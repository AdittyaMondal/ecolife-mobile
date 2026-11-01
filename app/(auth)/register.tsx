import { type Href, Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Field, Note } from '@/components/ui/primitives';
import { T } from '@/components/ui/text';
import { errorMessage } from '@/lib/errors';
import { useAuth } from '@/providers/auth-provider';

type AccountType = 'individual' | 'employee';

export default function Register() {
  const insets = useSafeAreaInsets();
  const { signUp, signInWithGoogle } = useAuth();
  const [accountType, setAccountType] = useState<AccountType>('individual');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<null | 'password' | 'google'>(null);

  async function submit() {
    if (name.trim().length < 2) {
      setError('Add the name you want on your profile.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 10) {
      setError('Use at least 10 characters for the password.');
      return;
    }
    if (accountType === 'employee' && !/^[A-Za-z0-9-]{3,32}$/.test(employeeId.trim())) {
      setError('Employee ID should be 3–32 letters, numbers or dashes.');
      return;
    }
    setError(null);
    setPending('password');
    try {
      await signUp({
        name,
        email,
        password,
        accountType,
        employeeId: accountType === 'employee' ? employeeId : undefined,
        organizationName: accountType === 'employee' ? organizationName : undefined,
      });
    } catch (err) {
      setError(errorMessage(err, 'The account could not be created.'));
    } finally {
      setPending(null);
    }
  }

  async function google() {
    setError(null);
    setPending('google');
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(errorMessage(err, 'Google sign-in failed.'));
    } finally {
      setPending(null);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 28,
          paddingHorizontal: 20,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <T weight="extrabold" className="text-4xl text-ink">
          Create your account
        </T>
        <T className="mt-2 text-base leading-6 text-muted-foreground">
          Individuals and organization employees use the same EcoLife login.
        </T>
        <View className="mt-6 gap-4">
          <Button
            label="Continue with Google"
            variant="outline"
            onPress={() => void google()}
            loading={pending === 'google'}
            disabled={pending !== null}
          />
          <View className="flex-row items-center gap-3">
            <View className="h-0.5 flex-1 bg-ink" />
            <T className="text-muted-foreground">or</T>
            <View className="h-0.5 flex-1 bg-ink" />
          </View>
        </View>
        <View className="mt-6 flex-row rounded-full border-2 border-ink bg-card p-1">
          <TypeChip
            label="Individual"
            active={accountType === 'individual'}
            onPress={() => setAccountType('individual')}
          />
          <TypeChip
            label="Employee"
            active={accountType === 'employee'}
            onPress={() => setAccountType('employee')}
          />
        </View>
        <View className="mt-6 gap-4">
          <Field
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            autoComplete="name"
          />
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="At least 10 characters"
            secureTextEntry
            autoCapitalize="none"
          />
          {accountType === 'employee' ? (
            <>
              <Field
                label="Employee ID"
                value={employeeId}
                onChangeText={setEmployeeId}
                placeholder="NW-10482"
                autoCapitalize="characters"
              />
              <Field
                label="Organization"
                value={organizationName}
                onChangeText={setOrganizationName}
                placeholder="Company name"
              />
              <Note>
                EcoLife creates your account now. Your employee ID is kept on this phone until the
                organization link is available.
              </Note>
            </>
          ) : null}
          {error ? (
            <T weight="semibold" className="text-sm text-destructive">
              {error}
            </T>
          ) : null}
          <Button
            label="Create account"
            onPress={() => void submit()}
            loading={pending === 'password'}
            disabled={pending !== null}
          />
        </View>
        <View className="mt-8 flex-row justify-center gap-1">
          <T className="text-muted-foreground">Already have an account?</T>
          <Link href={'/login' as Href}>
            <T weight="bold" className="text-forest">
              Sign in
            </T>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function TypeChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      className={`h-11 flex-1 items-center justify-center rounded-full ${active ? 'bg-primary' : ''}`}
    >
      <T weight="bold" className="text-ink">
        {label}
      </T>
    </Pressable>
  );
}
