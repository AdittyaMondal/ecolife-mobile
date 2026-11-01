import { Gamepad2, Sparkles } from 'lucide-react-native';
import { View } from 'react-native';
import { Screen, TopBar } from '@/components/ui/header';
import { Button, Note } from '@/components/ui/primitives';
import { T } from '@/components/ui/text';
import { colors } from '@/lib/theme';
import { useAuth } from '@/providers/auth-provider';

export default function Game() {
  const { local, updateLocal } = useAuth();
  return (
    <Screen dock>
      <TopBar eyebrow="Play" title="Game" avatar />
      <View className="items-center rounded-[32px] border-2 border-ink bg-secondary px-6 py-10">
        <View className="h-24 w-24 items-center justify-center rounded-full border-2 border-ink bg-primary">
          <Gamepad2 color={colors.ink} size={42} />
        </View>
        <T weight="extrabold" className="mt-6 text-center text-4xl text-cream">
          Coming soon
        </T>
        <T className="mt-3 text-center text-base leading-6 text-eco-100">
          A daily footprint game is on the way. Your streak, points and events stay right where they
          are.
        </T>
      </View>
      <View className="mt-5 flex-row items-center gap-3 rounded-[24px] bg-accent p-4">
        <Sparkles color={colors.forest} size={22} />
        <T className="flex-1 text-sm leading-5 text-forest">
          Challenges will use the same points you already earn from logs and events.
        </T>
      </View>
      <View className="mt-5">
        {local.gameInterest ? (
          <Note>Interest saved on this phone. EcoLife has not been notified.</Note>
        ) : (
          <Button
            label="Keep me posted"
            onPress={() => void updateLocal((state) => ({ ...state, gameInterest: true }))}
          />
        )}
      </View>
    </Screen>
  );
}
