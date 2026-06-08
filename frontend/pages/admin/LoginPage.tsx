import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { ApiError } from '../../lib/adminApi';
import { Button, Card, Field, Spinner, TextInput } from '../../components/admin/ui';

interface LoginForm {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ defaultValues: { email: '', password: '' } });

  // Already authenticated → skip the login screen.
  useEffect(() => {
    if (!loading && user) navigate('/admin/applications', { replace: true });
  }, [loading, user, navigate]);

  const onSubmit = async (data: LoginForm) => {
    setFormError(null);
    try {
      await login(data.email, data.password);
      navigate('/admin/applications', { replace: true });
    } catch (e) {
      if (e instanceof ApiError && e.status === 429) {
        setFormError('Too many attempts. Please wait a minute and try again.');
      } else {
        setFormError('Incorrect email or password.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 font-sans">
      <Card className="w-full max-w-sm p-8">
        <div className="mb-6 text-center">
          <span className="text-2xl font-extrabold tracking-tight text-mfleet-blue">
            Mfleet <span className="text-mfleet-gray-dark">CRM</span>
          </span>
          <p className="mt-1 text-sm text-mfleet-gray">Manager sign in</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Field label="Email" htmlFor="email" required error={errors.email?.message}>
            <TextInput
              id="email"
              type="email"
              autoComplete="username"
              autoFocus
              {...register('email', { required: 'Required' })}
            />
          </Field>
          <Field label="Password" htmlFor="password" required error={errors.password?.message}>
            <TextInput
              id="password"
              type="password"
              autoComplete="current-password"
              {...register('password', { required: 'Required' })}
            />
          </Field>

          {formError && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>
          )}

          <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
            {isSubmitting ? <Spinner className="h-4 w-4 text-white" /> : 'Sign in'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default LoginPage;
