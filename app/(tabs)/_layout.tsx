import { Tabs } from 'expo-router';
import { Dock } from '@/components/ui/dock';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'shift',
        transitionSpec: { animation: 'timing', config: { duration: 260 } },
      }}
      tabBar={(props) => <Dock state={props.state} navigateToTab={props.navigateToTab} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="track" options={{ title: 'Track' }} />
      <Tabs.Screen name="marketplace" options={{ title: 'Market' }} />
      <Tabs.Screen name="events" options={{ title: 'Events' }} />
      <Tabs.Screen name="game" options={{ title: 'Game' }} />
    </Tabs>
  );
}
