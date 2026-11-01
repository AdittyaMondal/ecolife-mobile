import { type Href, Link } from 'expo-router';
import { Eye, EyeOff, Leaf } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Field } from '@/components/ui/primitives';
import { T } from '@/components/ui/text';
import { errorMessage } from '@/lib/errors';
import { colors } from '@/lib/theme';
import { useAuth } from '@/providers/auth-provider';

export default function Login() {
  const insets = useSafeAreaInsets();
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<null | 'password' | 'google'>(null);

  async function submit() {
    const nextEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      setError('Enter the email on your EcoLife account.');
      return;
    }
    if (password.length < 10) {
      setError('Password needs at least 10 characters.');
      return;
    }
    setError(null);
    setPending('password');
    try {
      await signIn(nextEmail, password);
    } catch (err) {
      setError(errorMessage(err, 'Those details were not accepted.'));
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
          paddingTop: insets.top + 28,
          paddingBottom: insets.bottom + 28,
          paddingHorizontal: 20,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-8 h-16 w-16 items-center justify-center rounded-full border-2 border-ink bg-secondary">
          <Leaf color={colors.lime} size={30} />
        </View>
        <T weight="extrabold" className="text-4xl text-ink">
          Welcome back
        </T>
        <T className="mt-2 text-base leading-6 text-muted-foreground">
          Sign in with Google, or with the email and password on your EcoLife account.
        </T>
        <View className="mt-8 gap-4">
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
          <Field
            label="Email"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
          />
          <View>
            <Field
              label="Password"
              secureTextEntry={!show}
              value={password}
              onChangeText={setPassword}
              placeholder="At least 10 characters"
              autoCapitalize="none"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={show ? 'Hide password' : 'Show password'}
              onPress={() => setShow((value) => !value)}
              className="absolute right-3 top-9 h-11 w-11 items-center justify-center"
            >
              {show ? (
                <EyeOff color={colors.ink} size={18} />
              ) : (
                <Eye color={colors.ink} size={18} />
              )}
            </Pressable>
          </View>
          {error ? (
            <T weight="semibold" className="text-sm text-destructive">
              {error}
            </T>
          ) : null}
          <Button
            label="Sign in"
            onPress={() => void submit()}
            loading={pending === 'password'}
            disabled={pending !== null}
          />
        </View>
        <View className="mt-8 flex-row justify-center gap-1">
          <T className="text-muted-foreground">New to EcoLife?</T>
          <Link href={'/register' as Href}>
            <T weight="bold" className="text-forest">
              Create an account
            </T>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
