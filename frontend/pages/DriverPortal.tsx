import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FormProvider, useForm } from 'react-hook-form';
import { Helmet } from 'react-helmet-async';

import { emptyDriverForm, FormError, getForm, submitForm } from '../lib/driverApi';
import type { DriverFormValues } from '../lib/driverTypes';
import { useAutosave } from '../lib/useAutosave';
import WizardProgress from '../components/driver/WizardProgress';
import Step1Personal from '../components/driver/steps/Step1Personal';
import Step2Cdl from '../components/driver/steps/Step2Cdl';
import Step3History from '../components/driver/steps/Step3History';
import Step4Work from '../components/driver/steps/Step4Work';
import Step5Finance from '../components/driver/steps/Step5Finance';
import Step6Signatures from '../components/driver/steps/Step6Signatures';

type Screen = 'loading' | 'ready' | 'notfound' | 'expired' | 'submitted' | 'done' | 'error';

const STEP_TITLES = ['Personal', 'License & Medical', 'History', 'Work & Logs', 'Agreements', 'Signatures'];

// Which top-level fields to validate when leaving each step.
const STEP_FIELDS: string[][] = [
  ['first_name', 'last_name', 'ssn', 'dob', 'phone', 'email', 'address', 'emergency'],
  ['cdl', 'medical', 'experience', 'license_history'],
  [],
  [],
  ['w9', 'banking', '_policies_ack'],
  ['signatures'],
];

// Map a top-level field (from a server validation error) back to its step.
const FIELD_TO_STEP: Record<string, number> = {
  first_name: 0, middle_name: 0, last_name: 0, ssn: 0, dob: 0, phone: 0, email: 0,
  address: 0, residency_history: 0, emergency: 0, application_date: 0,
  cdl: 1, medical: 1, experience: 1, license_history: 1,
  accidents: 2, violations: 2, drug_alcohol_history: 2,
  employment_history: 3, seven_day_log: 3, last_relieved_time: 3, last_relieved_date: 3, last_relieved_location: 3,
  equipment: 4, ifta_choice: 4, w9: 4, banking: 4, policies: 4,
  signatures: 5,
};

const CenteredCard: React.FC<{ title: string; children?: React.ReactNode }> = ({ title, children }) => (
  <div className="min-h-screen flex items-center justify-center bg-mfleet-gray-light px-4">
    <div className="max-w-md w-full bg-white rounded-2xl shadow p-8 text-center">
      <h1 className="text-xl font-bold text-mfleet-gray-dark mb-2">{title}</h1>
      {children}
    </div>
  </div>
);

const DriverPortal: React.FC = () => {
  const { token = '' } = useParams();
  const [screen, setScreen] = useState<Screen>('loading');
  const [isOwner, setIsOwner] = useState(true);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const methods = useForm<DriverFormValues>({ defaultValues: emptyDriverForm(), mode: 'onTouched' });
  const { status: saveStatus, saveNow } = useAutosave(token, methods);

  useEffect(() => {
    let active = true;
    getForm(token)
      .then((meta) => {
        if (!active) return;
        setIsOwner(meta.driver_is_owner);
        setCompanyName(meta.company_name);
        methods.reset({ ...emptyDriverForm(), ...(meta.answers as Partial<DriverFormValues>) });
        setScreen('ready');
      })
      .catch((e) => {
        if (!active) return;
        if (e instanceof FormError) {
          if (e.status === 410) return setScreen('expired');
          if (e.status === 409) return setScreen('submitted');
          if (e.status === 404) return setScreen('notfound');
        }
        setScreen('error');
      });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const goNext = async () => {
    const fields = STEP_FIELDS[step];
    const ok = fields.length ? await methods.trigger(fields as any) : true;
    if (!ok) return;
    void saveNow();
    setStep((s) => Math.min(s + 1, STEP_TITLES.length - 1));
    scrollTop();
  };

  const goBack = () => {
    void saveNow();
    setStep((s) => Math.max(s - 1, 0));
    scrollTop();
  };

  const onSubmit = async () => {
    setSubmitError(null);
    const ok = await methods.trigger(['signatures'] as any);
    if (!ok) return;
    setSubmitting(true);
    try {
      await submitForm(token, methods.getValues());
      setScreen('done');
    } catch (e) {
      if (e instanceof FormError) {
        if (e.status === 410) return setScreen('expired');
        if (e.status === 409) return setScreen('submitted');
        if (e.status === 422 && Array.isArray(e.detail)) {
          let firstStep = step;
          e.detail.forEach((item: any, idx: number) => {
            const path = (item.loc || []).join('.');
            const root = (item.loc || [])[0];
            if (path) methods.setError(path as any, { type: 'server', message: item.msg });
            if (idx === 0 && root in FIELD_TO_STEP) firstStep = FIELD_TO_STEP[root];
          });
          setStep(firstStep);
          setSubmitError('Please fix the highlighted fields.');
          scrollTop();
          return;
        }
      }
      setSubmitError('Could not submit. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const stepEl = useMemo(() => {
    switch (step) {
      case 0: return <Step1Personal />;
      case 1: return <Step2Cdl />;
      case 2: return <Step3History />;
      case 3: return <Step4Work />;
      case 4: return <Step5Finance isOwner={isOwner} />;
      case 5: return <Step6Signatures isOwner={isOwner} />;
      default: return null;
    }
  }, [step, isOwner]);

  if (screen === 'loading') return <CenteredCard title="Loading…" />;
  if (screen === 'notfound') return <CenteredCard title="Link not found"><p className="text-gray-500">This application link is invalid.</p></CenteredCard>;
  if (screen === 'expired') return <CenteredCard title="Link expired"><p className="text-gray-500">This application link has expired. Please contact your manager for a new one.</p></CenteredCard>;
  if (screen === 'submitted') return <CenteredCard title="Already submitted"><p className="text-gray-500">This application has already been submitted. Thank you!</p></CenteredCard>;
  if (screen === 'error') return <CenteredCard title="Something went wrong"><p className="text-gray-500">Please try again later.</p></CenteredCard>;
  if (screen === 'done') return (
    <CenteredCard title="Application submitted ✓">
      <p className="text-gray-500">Thank you! Your application has been submitted for review.</p>
    </CenteredCard>
  );

  const isLast = step === STEP_TITLES.length - 1;

  return (
    <div className="min-h-screen bg-mfleet-gray-light flex flex-col">
      <Helmet><title>Driver Application — Mfleet</title><meta name="robots" content="noindex,nofollow" /></Helmet>

      {/* Sticky header with progress */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-xl mx-auto">
          {companyName && <p className="text-xs text-gray-400 mb-1">{companyName}</p>}
          <WizardProgress steps={STEP_TITLES} current={step} />
          <p className="text-xs text-right mt-1 h-4 text-gray-400">
            {saveStatus === 'saving' && 'Saving…'}
            {saveStatus === 'saved' && 'Saved'}
            {saveStatus === 'error' && 'Save failed'}
          </p>
        </div>
      </header>

      {/* Step content */}
      <main className="flex-1 px-4 py-5">
        <div className="max-w-xl mx-auto">
          <FormProvider {...methods}>
            <form onSubmit={(e) => e.preventDefault()}>{stepEl}</form>
          </FormProvider>
          {submitError && <p className="text-red-600 text-sm mt-2">{submitError}</p>}
        </div>
      </main>

      {/* Sticky footer nav */}
      <footer className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3">
        <div className="max-w-xl mx-auto flex gap-3">
          {step > 0 && (
            <button type="button" onClick={goBack}
              className="flex-1 min-h-12 rounded-lg border border-gray-300 font-medium text-mfleet-gray-dark">
              Back
            </button>
          )}
          {!isLast ? (
            <button type="button" onClick={goNext}
              className="flex-1 min-h-12 rounded-lg bg-mfleet-blue text-white font-semibold">
              Next
            </button>
          ) : (
            <button type="button" onClick={onSubmit} disabled={submitting}
              className="flex-1 min-h-12 rounded-lg bg-mfleet-blue text-white font-semibold disabled:opacity-60">
              {submitting ? 'Submitting…' : 'Submit application'}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};

export default DriverPortal;
