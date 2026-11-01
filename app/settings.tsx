import { useState } from 'react';
import { View } from 'react-native';
import { Screen, TopBar } from '@/components/ui/header';
import { Button, Field, Note } from '@/components/ui/primitives';
import { T } from '@/components/ui/text';
import { useHealth } from '@/hooks/use-health';
import { errorMessage } from '@/lib/errors';
import { ApiError, api } from '@/lib/fetcher';
import { useAuth } from '@/providers/auth-provider';

export default function Settings() {
  const { user, local, refreshUser, signOut } = useAuth();
  const health = useHealth();
  const [name, setName] = useState(user?.name ?? '');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function saveName() {
    if (name.trim().length < 2) {
      setError('Name needs at least 2 characters.');
      return;
    }
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      await api.patch('/profile', { name: name.trim() });
      await refreshUser();
      setMessage('Name updated on EcoLife.');
    } catch (err) {
      setError(errorMessage(err, 'EcoLife could not update your name.'));
    } finally {
      setPending(false);
    }
  }

  async function resend() {
    setPending(true);
    setError(null);
    try {
      await api.post('/auth/resend-verification');
      setMessage('If your email can receive it, a verification link is on the way.');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    setPending(true);
    setError(null);
    try {
      await api.delete('/profile');
      await signOut();
    } catch (err) {
      setError(errorMessage(err, 'The account was not deleted.'));
      setPending(false);
    }
  }

  return (
    <Screen>
      <TopBar title="Settings" back />
      <Field label="Name" value={name} onChangeText={setName} />
      <View className="mt-3">
        <Button label="Save name" onPress={() => void saveName()} loading={pending} />
      </View>
      <View className="mt-5 rounded-[24px] bg-card p-4">
        <T weight="bold" className="text-ink">
          Email
        </T>
        <T className="text-sm text-muted-foreground">{user?.email}</T>
        <T className="mt-1 text-sm text-forest">
          {user?.emailVerified ? 'Verified' : 'Not verified'}
        </T>
        {!user?.emailVerified ? (
          <View className="mt-3">
            <Button label="Resend verification" variant="outline" onPress={() => void resend()} />
          </View>
        ) : null}
      </View>
      <View className="mt-4 rounded-[24px] bg-card p-4">
        <T weight="bold" className="text-ink">
          Timezone
        </T>
        <T className="text-sm text-muted-foreground">{user?.timezone}</T>
        {local.employeeId ? (
          <View className="mt-3">
            <Note>{`Employee ID ${local.employeeId} is stored on this phone${local.organizationName ? ` for ${local.organizationName}` : ''}.`}</Note>
          </View>
        ) : null}
      </View>
      <View className="mt-4 rounded-[24px] bg-card p-4">
        <T weight="bold" className="text-ink">
          Connection
        </T>
        <T className="text-sm text-muted-foreground">
          {health.isPending
            ? 'Checking…'
            : health.isError
              ? health.error instanceof ApiError
                ? health.error.message
                : 'Not reachable'
              : `${health.data?.service ?? 'EcoLife'} is ${health.data?.status ?? 'up'}`}
        </T>
      </View>
      <View className="mt-6">
        {confirmDelete ? (
          <View className="gap-3">
            <Note>This asks EcoLife to delete the account. It cannot be undone from the app.</Note>
            <Button
              label="Delete account"
              variant="outline"
              onPress={() => void remove()}
              loading={pending}
            />
            <Button label="Keep account" variant="ghost" onPress={() => setConfirmDelete(false)} />
          </View>
        ) : (
          <Button label="Delete account" variant="ghost" onPress={() => setConfirmDelete(true)} />
        )}
      </View>
      {message ? (
        <T weight="semibold" className="mt-4 text-sm text-forest">
          {message}
        </T>
      ) : null}
      {error ? (
        <T weight="semibold" className="mt-4 text-sm text-destructive">
          {error}
        </T>
      ) : null}
    </Screen>
  );
}
