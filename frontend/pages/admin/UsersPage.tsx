import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  ApiError,
  adminResetPassword,
  createUser,
  deleteUser,
  listUsers,
  updateUser,
} from '../../lib/adminApi';
import type { UserCreate, UserResponse } from '../../lib/adminTypes';
import { useAuth } from '../../lib/auth';
import { Button, Card, Field, SelectInput, Spinner, TextInput, Toggle } from '../../components/admin/ui';

const emptyUser = (): UserCreate => ({ email: '', password: '', full_name: '', role: 'manager' });

// ── Inline edit panel for a single user ──────────────────────────────────────
const EditUserPanel: React.FC<{
  user: UserResponse;
  isSelf: boolean;
  onClose: () => void;
  onChanged: () => void;
}> = ({ user, isSelf, onClose, onChanged }) => {
  const [fullName, setFullName] = useState(user.full_name || '');
  const [role, setRole] = useState<'admin' | 'manager'>(user.role === 'admin' ? 'admin' : 'manager');
  const [isActive, setIsActive] = useState(user.is_active);
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setError(null);
    setBusy(true);
    try {
      await updateUser(user.id, { full_name: fullName.trim() || null, role, is_active: isActive });
      if (newPassword) {
        if (newPassword.length < 8) throw new ApiError(422, 'Password must be at least 8 characters');
        await adminResetPassword(user.id, newPassword);
      }
      onChanged();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError && typeof e.detail === 'string' ? e.detail : 'Could not save changes.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete user ${user.email}? This cannot be undone.`)) return;
    setError(null);
    setBusy(true);
    try {
      await deleteUser(user.id);
      onChanged();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError && typeof e.detail === 'string' ? e.detail : 'Could not delete user.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="mb-4 text-lg font-semibold text-mfleet-gray-dark">Edit {user.email}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full name">
          <TextInput value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </Field>
        <Field label="Role">
          <SelectInput value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'manager')}>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </SelectInput>
        </Field>
        <Field label="New password (optional)">
          <TextInput
            type="password"
            autoComplete="new-password"
            placeholder="Leave blank to keep current"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </Field>
        <div className="flex items-end">
          <Toggle
            label="Active"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
        </div>
      </div>
      {error && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <div className="mt-4 flex justify-between">
        <Button variant="danger" onClick={remove} disabled={busy || isSelf}>
          Delete
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={save} disabled={busy}>
            {busy ? <Spinner className="h-4 w-4 text-white" /> : 'Save'}
          </Button>
        </div>
      </div>
      {isSelf && <p className="mt-2 text-xs text-mfleet-gray">You cannot delete your own account.</p>}
    </Card>
  );
};

const UsersPage: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editing, setEditing] = useState<UserResponse | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserCreate>({ defaultValues: emptyUser() });

  const isAdmin = user?.role === 'admin';

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
      if (e instanceof ApiError && e.status === 409) setFormError('A user with this email already exists.');
      else if (e instanceof ApiError && e.status === 422) setFormError('Check the fields — password must be at least 8 characters.');
      else setFormError('Could not create the user.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-mfleet-gray-dark">Users</h1>
        {isAdmin && (
          <Button onClick={() => { setShowForm((v) => !v); setEditing(null); }}>
            {showForm ? 'Cancel' : 'Add user'}
          </Button>
        )}
      </div>

      {forbidden ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-mfleet-gray">Only administrators can manage users.</p>
        </Card>
      ) : (
        <>
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
                      {...register('password', { required: 'Required', minLength: { value: 8, message: 'At least 8 characters' } })}
                    />
                  </Field>
                </div>
                {formError && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Spinner className="h-4 w-4 text-white" /> : 'Create user'}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {editing && (
            <EditUserPanel
              user={editing}
              isSelf={editing.id === user?.id}
              onClose={() => setEditing(null)}
              onChanged={refresh}
            />
          )}

          <Card className="overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-16"><Spinner className="h-6 w-6" /></div>
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
                    {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-mfleet-gray-dark">{u.full_name || '—'}</td>
                      <td className="px-4 py-3 text-mfleet-gray">{u.email}</td>
                      <td className="px-4 py-3 capitalize text-mfleet-gray">{u.role}</td>
                      <td className="px-4 py-3">
                        <span className={'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ' + (u.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600')}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" onClick={() => { setEditing(u); setShowForm(false); }}>Edit</Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default UsersPage;
