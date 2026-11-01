import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen, TopBar } from '@/components/ui/header';
import { Button, EmptyBlock, LoadingBlock } from '@/components/ui/primitives';
import { T } from '@/components/ui/text';
import { useNotifications } from '@/hooks/resources';
import { formatWhen } from '@/lib/format';
import { useAuth } from '@/providers/auth-provider';

export default function Notifications() {
  const { user } = useAuth();
  const { items, loading, unavailable, markRead } = useNotifications();
  return (
    <Screen>
      <TopBar title="Notifications" back />
      {loading ? <LoadingBlock /> : null}
      {!loading && items.length === 0 ? (
        <EmptyBlock
          title={unavailable ? 'Notifications aren’t available' : 'You’re caught up'}
          body={
            unavailable
              ? 'EcoLife did not return notifications. The rest of the app still works.'
              : 'Event reminders and reward notes will land here.'
          }
        />
      ) : null}
      <View className="gap-3">
        {items.map((item, index) => (
          <Animated.View
            key={item.id}
            entering={FadeInDown.duration(320).delay(Math.min(index, 8) * 40)}
            className={`rounded-[22px] p-4 ${item.readAt ? 'bg-card' : 'bg-accent'}`}
          >
            <T weight="bold" className="text-ink">
              {item.title}
            </T>
            {item.body ? <T className="mt-1 text-sm text-muted-foreground">{item.body}</T> : null}
            <T className="mt-2 text-xs text-muted-foreground">
              {formatWhen(item.createdAt, user?.timezone)}
            </T>
            {!item.readAt ? (
              <View className="mt-3">
                <Button
                  label="Mark read"
                  variant="outline"
                  onPress={() => void markRead(item.id)}
                />
              </View>
            ) : null}
          </Animated.View>
        ))}
      </View>
    </Screen>
  );
}
