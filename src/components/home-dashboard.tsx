import { type Href, router } from 'expo-router';
import {
  ArrowRight,
  CalendarDays,
  Check,
  Leaf,
  Menu,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react-native';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useMenu } from '@/components/menu-sheet';
import { Avatar } from '@/components/ui/avatar';
import { BellButton, IconButton, Screen } from '@/components/ui/header';
import { Note } from '@/components/ui/primitives';
import { T } from '@/components/ui/text';
import { CATEGORY_META } from '@/data/content';
import { useHomeModel } from '@/hooks/resources';
import {
  categoryShare,
  firstName,
  formatCount,
  formatKg,
  greetingFor,
  signedKg,
} from '@/lib/format';
import { colors } from '@/lib/theme';
import { useAuth } from '@/providers/auth-provider';

export default function HomeDashboard() {
  const { user, local, updateLocal, isEmployee } = useAuth();
  const menu = useMenu();
  const { model, tip, loading } = useHomeModel();
  const zone = user?.timezone || 'Asia/Kolkata';
  const hidden = local.dismissedTips.includes(tip.id) || local.acceptedTips.includes(tip.id);
  const baselineProgress = Math.min(100, Math.max(0, model.percent));
  const impacts = CATEGORY_META.map((category) => ({
    ...category,
    value: model.breakdown[category.key],
    share: categoryShare(model.breakdown[category.key], model.breakdown.totalKg),
  })).sort((a, b) => b.value - a.value);
  const dominant = impacts[0];

  return (
    <Screen dock>
      <View className="mb-5 flex-row items-center gap-3">
        <IconButton label="Open menu" onPress={menu.open}>
          <Menu color={colors.ink} size={20} />
        </IconButton>
        <View className="flex-1">
          <T
            weight="semibold"
            className="text-[11px] uppercase tracking-widest text-muted-foreground"
          >
            {greetingFor(new Date(), zone)}
          </T>
          <T weight="extrabold" className="text-2xl text-ink" numberOfLines={1}>
            {firstName(model.name)}
          </T>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/rewards' as Href)}
          className="rounded-full bg-accent px-3 py-2"
        >
          <T weight="bold" className="text-sm text-forest">
            {loading && model.points === 0 ? '…' : `${formatCount(model.points)} pts`}
          </T>
        </Pressable>
        <BellButton
          count={user?.unreadNotifications ?? 0}
          onPress={() => router.push('/notifications' as Href)}
        />
        {user ? (
          <Pressable onPress={() => router.push('/profile' as Href)}>
            <Avatar name={user.name} uri={user.avatarUrl} />
          </Pressable>
        ) : null}
      </View>

      {user && !user.emailVerified ? (
        <Pressable onPress={() => router.push('/settings' as Href)} className="mb-4">
          <Note>Verify your email to earn points and coins. Tap to resend from Settings.</Note>
        </Pressable>
      ) : null}
      {isEmployee ? (
        <View className="mb-4">
          <Note>
            {`${user?.organization?.name ?? local.organizationName ?? 'Workplace'} impact view${local.employeeId ? ` · ${local.employeeId}` : ''}`}
          </Note>
        </View>
      ) : null}

      <View className="rounded-[32px] bg-eco-900 p-5">
        <View className="flex-row items-center justify-between">
          <T weight="semibold" className="text-xs uppercase tracking-[2px] text-eco-100">
            Today’s impact
          </T>
          <View className="rounded-full bg-cream/10 px-3 py-1">
            <T weight="semibold" className="text-xs text-cream">
              {model.logged ? 'Complete' : 'Not logged'}
            </T>
          </View>
        </View>

        {loading && !model.logged ? (
          <View className="h-48 items-center justify-center">
            <ActivityIndicator color={colors.lime} />
            <T className="mt-3 text-sm text-eco-100">Building your impact view</T>
          </View>
        ) : (
          <>
            <View className="mt-6 flex-row items-start justify-between gap-4">
              <View className="flex-1">
                <View className="flex-row items-end">
                  <Figure size={64} color={colors.cream} face="serif">
                    {model.logged ? formatKg(model.totalKg) : '—'}
                  </Figure>
                  <T weight="semibold" className="mb-2 ml-2 text-sm text-eco-100">
                    kg CO₂e
                  </T>
                </View>
                <T className="mt-2 text-sm leading-5 text-eco-100">
                  {model.logged
                    ? model.deltaKg <= 0
                      ? `${signedKg(model.deltaKg)} below your usual day`
                      : `${signedKg(model.deltaKg)} above your usual day`
                    : 'Your daily story starts with a check-in'}
                </T>
              </View>
              <View className="items-end pt-1">
                <Figure size={32} color={colors.lime}>
                  {String(model.streak)}
                </Figure>
                <T
                  weight="semibold"
                  className="mt-1 text-right text-[11px] uppercase tracking-widest text-eco-100"
                >
                  day streak
                </T>
              </View>
            </View>

            <View className="mt-6">
              <View className="mb-2 flex-row items-center justify-between">
                <T className="text-xs text-eco-100">Daily baseline</T>
                <Figure size={13} color={colors.cream}>
                  {model.logged && model.baselineKg ? `${Math.round(model.percent)}%` : '—'}
                </Figure>
              </View>
              <View className="h-2 overflow-hidden rounded-full bg-cream/15">
                <View
                  className="h-2 rounded-full bg-primary"
                  style={{
                    width: `${model.logged ? Math.min(100, Math.max(3, baselineProgress)) : 0}%`,
                  }}
                />
              </View>
            </View>

            <View className="mt-5 flex-row items-end gap-2">
              {impacts.map((item) => (
                <View key={item.key} className="flex-1">
                  <View className="h-12 justify-end">
                    <View
                      className="rounded-t-md bg-cream/80"
                      style={{ height: `${Math.max(8, Math.min(100, item.share))}%` }}
                    />
                  </View>
                  <T className="mt-1 text-center text-[8px] uppercase text-eco-100">
                    {item.label.slice(0, 3)}
                  </T>
                </View>
              ))}
              <T className="ml-2 max-w-[94px] text-xs leading-4 text-eco-100">
                Five signals shape today’s total.
              </T>
            </View>
          </>
        )}
      </View>

      <Pressable
        onPress={() => router.push('/track' as Href)}
        className="mt-3 flex-row items-center rounded-[24px] bg-card p-3"
      >
        <View
          className={`h-12 w-12 items-center justify-center rounded-full ${model.logged ? 'bg-accent' : 'bg-primary'}`}
        >
          {model.logged ? (
            <Check color={colors.forest} size={21} strokeWidth={2.5} />
          ) : (
            <Leaf color={colors.ink} size={21} />
          )}
        </View>
        <View className="ml-3 flex-1">
          <T weight="bold" className="text-base text-ink">
            {model.logged ? 'Today is logged' : 'Complete today’s check-in'}
          </T>
          <T className="mt-0.5 text-xs text-muted-foreground">
            {model.logged
              ? 'Review answers and your category split'
              : 'Five quick questions · about 1 minute'}
          </T>
        </View>
        <ArrowRight color={colors.ink} size={19} />
      </Pressable>

      {model.logged && dominant ? (
        <>
          <View className="mb-3 mt-7 flex-row items-end justify-between">
            <View>
              <T className="text-xs uppercase tracking-widest text-muted-foreground">Impact map</T>
              <T weight="extrabold" className="mt-1 text-2xl text-ink">
                What shaped today
              </T>
            </View>
            <T weight="semibold" className="text-xs text-muted-foreground">
              {formatKg(model.totalKg)} kg total
            </T>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-[1.2] justify-between rounded-[28px] bg-accent p-4">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-card">
                <Leaf color={colors.forest} size={18} />
              </View>
              <View className="mt-8">
                <T className="text-xs uppercase tracking-wide text-forest">Largest share</T>
                <T weight="extrabold" className="mt-1 text-xl text-ink">
                  {dominant.label}
                </T>
                <T weight="extrabold" className="mt-2 text-4xl text-ink">
                  {dominant.share}%
                </T>
                <T className="text-xs text-forest">{formatKg(dominant.value)} kg CO₂e</T>
              </View>
            </View>
            <View className="flex-1 gap-3">
              {impacts.slice(1, 3).map((item) => (
                <ImpactTile
                  key={item.key}
                  label={item.label}
                  value={item.value}
                  share={item.share}
                />
              ))}
            </View>
          </View>
          <View className="mt-3 flex-row gap-3">
            {impacts.slice(3).map((item) => (
              <ImpactTile
                key={item.key}
                label={item.label}
                value={item.value}
                share={item.share}
                horizontal
              />
            ))}
          </View>
        </>
      ) : null}

      {!hidden ? (
        <View className="mt-7 overflow-hidden rounded-[28px] bg-card p-5">
          <View className="flex-row items-start">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-primary">
              <Sparkles color={colors.ink} size={18} />
            </View>
            <Pressable
              accessibilityLabel="Dismiss suggestion"
              onPress={() =>
                void updateLocal((state) => ({
                  ...state,
                  dismissedTips: [...state.dismissedTips, tip.id],
                }))
              }
              className="ml-auto h-9 w-9 items-center justify-center rounded-full bg-muted"
            >
              <X color={colors.ink} size={16} />
            </Pressable>
          </View>
          <T className="mt-5 text-xs uppercase tracking-widest text-muted-foreground">
            One thing today
          </T>
          <T weight="extrabold" className="mt-1 text-2xl leading-8 text-ink">
            {tip.title}
          </T>
          <T className="mt-2 text-sm leading-6 text-muted-foreground">{tip.body}</T>
          <View className="mt-5 flex-row items-center">
            <View className="rounded-full bg-accent px-3 py-1.5">
              <T weight="bold" className="text-xs text-forest">
                {tip.impact} · {tip.points}
              </T>
            </View>
            <Pressable
              onPress={() =>
                void updateLocal((state) => ({
                  ...state,
                  acceptedTips: [...state.acceptedTips, tip.id],
                }))
              }
              className="ml-auto flex-row items-center gap-2 rounded-full bg-secondary px-4 py-2.5"
            >
              <T weight="bold" className="text-sm text-cream">
                I’ll do it
              </T>
              <ArrowRight color={colors.cream} size={15} />
            </Pressable>
          </View>
        </View>
      ) : null}

      <View className="mb-3 mt-7 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Trophy color={colors.forest} size={17} />
          <T weight="extrabold" className="text-xl text-ink">
            Community
          </T>
        </View>
        <Pressable onPress={() => router.push('/leaderboard' as Href)}>
          <T weight="bold" className="text-sm text-forest">
            Full board
          </T>
        </Pressable>
      </View>
      <View className="flex-row rounded-[28px] bg-card px-3 py-5">
        {model.ranks.slice(0, 3).map((row, index) => (
          <View key={`${row.userId}-${row.rank}`} className="flex-1 items-center">
            <View>
              <Avatar name={row.name} uri={row.avatarUrl} size={index === 0 ? 54 : 46} />
              <View className="absolute -right-1 -top-1 h-5 min-w-5 items-center rounded-full bg-primary px-1">
                <T weight="extrabold" className="text-[10px] text-ink">
                  {row.rank}
                </T>
              </View>
            </View>
            <T weight="bold" className="mt-2 text-center text-xs text-ink" numberOfLines={1}>
              {row.userId === user?.id ? 'You' : firstName(row.name)}
            </T>
            <T className="mt-0.5 text-[10px] text-muted-foreground">
              {formatCount(row.points)} pts
            </T>
          </View>
        ))}
      </View>

      {model.next ? (
        <Pressable
          onPress={() => router.push(`/event/${model.next?.slug}` as Href)}
          className="mb-2 mt-3 flex-row items-center rounded-[24px] bg-accent p-4"
        >
          <View className="h-12 w-12 items-center justify-center rounded-full bg-card">
            <CalendarDays color={colors.forest} size={20} />
          </View>
          <View className="ml-3 flex-1">
            <T className="text-[10px] uppercase tracking-widest text-forest">Next nearby event</T>
            <T weight="bold" className="mt-0.5 text-sm text-ink" numberOfLines={1}>
              {model.next.title}
            </T>
            <T className="mt-0.5 text-xs text-forest" numberOfLines={1}>
              {model.next.when} · {model.next.venue}
            </T>
          </View>
          <ArrowRight color={colors.forest} size={18} />
        </Pressable>
      ) : null}
    </Screen>
  );
}

function Figure({
  children,
  size,
  color,
  face = 'sans',
}: {
  children: string;
  size: number;
  color: string;
  face?: 'sans' | 'serif';
}) {
  return (
    <Text
      style={{
        fontFamily:
          face === 'serif' ? 'InstrumentSerif_400Regular' : 'PlusJakartaSans_800ExtraBold',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: size,
        lineHeight: Math.round(size * (face === 'serif' ? 1.12 : 1.05)),
        color,
      }}
    >
      {children}
    </Text>
  );
}

function ImpactTile({
  label,
  value,
  share,
  horizontal = false,
}: {
  label: string;
  value: number;
  share: number;
  horizontal?: boolean;
}) {
  return (
    <View className={`${horizontal ? 'flex-1' : 'flex-1'} rounded-[24px] bg-card p-4`}>
      <View className={horizontal ? 'flex-row items-end justify-between' : ''}>
        <View>
          <T className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</T>
          <T weight="extrabold" className="mt-1 text-xl text-ink">
            {formatKg(value)}
            <T className="text-xs text-muted-foreground"> kg</T>
          </T>
        </View>
        <T
          weight="bold"
          className={horizontal ? 'text-sm text-forest' : 'mt-2 text-sm text-forest'}
        >
          {share}%
        </T>
      </View>
      <View className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <View className="h-1.5 rounded-full bg-leaf" style={{ width: `${share}%` }} />
      </View>
    </View>
  );
}
