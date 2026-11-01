import { type Href, router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Avatar } from '@/components/ui/avatar';
import { Screen, TopBar } from '@/components/ui/header';
import { Button } from '@/components/ui/primitives';
import { T } from '@/components/ui/text';
import { formatCount } from '@/lib/format';
import { shownCoins, shownPoints } from '@/lib/local-state';
import { useAuth } from '@/providers/auth-provider';

const LINKS = [
  { href: '/rewards', label: 'Rewards history' },
  { href: '/orders', label: 'Redemptions' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/settings', label: 'Account settings' },
  { href: '/notifications', label: 'Notifications' },
];

export default function Profile() {
  const { user, local, isEmployee, signOut } = useAuth();
  if (!user) return null;
  const coins = shownCoins(user.wallet.coinsBalance, local, local.spentCoins);
  return (
    <Screen>
      <TopBar title="Profile" back />
      <View className="items-center rounded-[32px] bg-secondary px-5 py-8">
        <Avatar name={user.name} uri={user.avatarUrl} size={96} />
        <T weight="extrabold" className="mt-4 text-3xl text-cream">
          {user.name}
        </T>
        <T className="text-eco-100">{user.email}</T>
        {user.city ? <T className="text-eco-100">{user.city}</T> : null}
      </View>
      <View className="mt-4 flex-row gap-3">
        <Stat label="Points" value={formatCount(shownPoints(user.wallet.pointsTotal, local))} />
        <Stat label="Coins" value={formatCount(coins)} />
      </View>
      <View className="mt-4 rounded-[24px] bg-card p-4">
        <T weight="bold" className="text-ink">
          {isEmployee ? 'Organization employee' : 'Individual'}
        </T>
        <T className="mt-1 text-sm text-muted-foreground">
          {user.organization
            ? `${user.organization.name} · ${user.organization.role} · ${user.organization.status}`
            : local.organizationName
              ? `${local.organizationName} is saved on this phone${local.employeeId ? ` · ID ${local.employeeId}` : ''}. EcoLife has not confirmed the membership.`
              : 'No organization linked.'}
        </T>
        <T className="mt-2 text-sm text-muted-foreground">
          Email {user.emailVerified ? 'verified' : 'not verified'} · onboarding{' '}
          {user.onboardingComplete || local.onboardingComplete ? 'complete' : 'in progress'}
        </T>
      </View>
      <View className="mt-4 gap-2">
        {LINKS.map((link) => (
          <Pressable
            key={link.href}
            onPress={() => router.push(link.href as Href)}
            className="rounded-[20px] bg-card px-4 py-4"
          >
            <T weight="bold" className="text-ink">
              {link.label}
            </T>
          </Pressable>
        ))}
      </View>
      <View className="mt-5">
        <Button label="Log out" variant="outline" onPress={() => void signOut()} />
      </View>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-[22px] border-2 border-ink bg-primary p-4">
      <T className="text-xs uppercase text-forest">{label}</T>
      <T weight="extrabold" className="text-2xl text-ink">
        {value}
      </T>
    </View>
  );
}
