import { type Href, Redirect } from 'expo-router';

export default function LegacyOnboardingStep() {
  return <Redirect href={'/onboarding' as Href} />;
}
