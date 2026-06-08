import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ApiError, createUser, listUsers } from '../../lib/adminApi';
import type { UserCreate, UserResponse } from '../../lib/adminTypes';
import { useAuth } from '../../lib/auth';
import { Button, Card, Field, SelectInput, Spinner, TextInput } from '../../components/admin/ui';

const emptyUser = (): UserCreate => ({
  email: '',
  password: '',
  full_name: '',
  role: 'manager',
});

const UsersPage: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserCreate>({ defaultValues: emptyUser() });

  const refresh = () => {
    setLoading(true);
    listUsers()
      .then((u) => {
        setUsers(u);
        setForbidden(false);
      })
      .catch((e) => {
        if (e instanceof ApiError && e.status === 403) setForbidden(true);
        setUsers([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(refresh, []);

  const onSubmit = async (data: UserCreate) => {
    setFormError(null);
    try {
      await createUser({ ...data, full_name: data.full_name?.trim() || null });
      reset(emptyUser());
      setShowForm(false);
      refresh();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setFormError('A user with this email already exists.');
      } else if (e instanceof ApiError && e.status === 422) {
        setFormError('Check the fields — password must be at least 8 characters.');
      } else {
        setFormError('Could not create the user.');
      }
    }
  };

  if (forbidden) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-mfleet-gray">
          Only administrators can manage users.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-mfleet-gray-dark">Users</h1>
        {user?.role === 'admin' && (
          <Button onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : 'Add user'}
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-mfleet-gray-dark">New user</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Full name" error={errors.full_name?.message}>
                <TextInput {...register('full_name')} placeholder="Jane Manager" />
              </Field>
              <Field label="Role" error={errors.role?.message}>
                <SelectInput {...register('role')}>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </SelectInput>
              </Field>
              <Field label="Email" required error={errors.email?.message}>
                <TextInput type="email" {...register('email', { required: 'Required' })} />
              </Field>
              <Field label="Password" required error={errors.password?.message}>
                <TextInput
                  type="password"
                  autoComplete="new-password"
                  {...register('password', {
                    required: 'Required',
                    minLength: { value: 8, message: 'At least 8 characters' },
                  })}
                />
              </Field>
            </div>
            {formError && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Spinner className="h-4 w-4 text-white" /> : 'Create user'}
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
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-sm text-mfleet-gray">No users.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-mfleet-gray">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-mfleet-gray-dark">
                    {u.full_name || '—'}
                  </td>
                  <td className="px-4 py-3 text-mfleet-gray">{u.email}</td>
                  <td className="px-4 py-3 capitalize text-mfleet-gray">{u.role}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ' +
                        (u.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600')
                      }
                    >
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
};

export default UsersPage;
