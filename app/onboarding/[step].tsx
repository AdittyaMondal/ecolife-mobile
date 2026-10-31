import { useLocalSearchParams } from 'expo-router';
import { ScreenPlaceholder } from '@/components/screen-placeholder';

export default function OnboardingStep() {
  const { step } = useLocalSearchParams<{ step: string }>();
  return <ScreenPlaceholder title={`Onboarding — step ${step ?? '?'}`} />;
}
