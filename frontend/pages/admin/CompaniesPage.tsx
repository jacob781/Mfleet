import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { createCompany, listCompanies } from '../../lib/adminApi';
import {
  emptyCompany,
  normalizeCompany,
  type CompanyCreate,
  type CompanyResponse,
} from '../../lib/adminTypes';
import CompanyFields from '../../components/admin/CompanyFields';
import { Button, Card, Spinner } from '../../components/admin/ui';

const CompaniesPage: React.FC = () => {
  const [companies, setCompanies] = useState<CompanyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CompanyCreate>({ defaultValues: emptyCompany() });

  const refresh = () => {
    setLoading(true);
    listCompanies()
      .then(setCompanies)
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false));
  };

  useEffect(refresh, []);

  const onSubmit = async (data: CompanyCreate) => {
    setFormError(null);
    try {
      await createCompany(normalizeCompany(data));
      reset(emptyCompany());
      setShowForm(false);
      refresh();
    } catch {
      setFormError('Could not create company. Check the fields and try again.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-mfleet-gray-dark">Companies</h1>
        <Button onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : 'Add company'}
        </Button>
      </div>

      {showForm && (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-mfleet-gray-dark">New company</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <CompanyFields register={register} errors={errors} />
            {formError && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Spinner className="h-4 w-4 text-white" /> : 'Create company'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-6 w-6" />
          </div>
        ) : companies.length === 0 ? (
          <div className="py-16 text-center text-sm text-mfleet-gray">
            No companies yet. Add one to start creating applications.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-mfleet-gray">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">DOT</th>
                <th className="px-4 py-3">MC</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Phone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {companies.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-mfleet-gray-dark">{c.name}</td>
                  <td className="px-4 py-3 text-mfleet-gray">{c.dot_number || '—'}</td>
                  <td className="px-4 py-3 text-mfleet-gray">{c.mc_number || '—'}</td>
                  <td className="px-4 py-3 text-mfleet-gray">
                    {c.address_city}, {c.address_state}
                  </td>
                  <td className="px-4 py-3 text-mfleet-gray">{c.phone || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
};

export default CompaniesPage;
