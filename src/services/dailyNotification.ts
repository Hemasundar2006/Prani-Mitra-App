import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Language } from '@/data/content';

const DAILY_ID = 'prani-mitra-daily-greeting';
Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldPlaySound: true, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }) });

export async function scheduleDailyGreeting(name: string, language: Language) {
  if (Platform.OS === 'web' || !name.trim()) return;
  if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('daily-greeting', { name: 'Daily greeting', importance: 3, sound: 'default' });
  const permissions = await Notifications.getPermissionsAsync();
  if (permissions.status !== 'granted') { const requested = await Notifications.requestPermissionsAsync(); if (requested.status !== 'granted') return; }
  await Notifications.cancelScheduledNotificationAsync(DAILY_ID).catch(() => {});
  const copy = language === 'తెలుగు' ? { title: `నమస్తే ${name}`, body: 'ఎలా ఉన్నారు? మీ పశువులు మరియు పంటలు ఎలా ఉన్నాయి?' } : language === 'हिन्दी' ? { title: `नमस्ते ${name}`, body: 'आप कैसे हैं? आपके पशु और फसलें कैसी हैं?' } : { title: `Namaste ${name}`, body: 'How are you? How are your animals and crops today?' };
  await Notifications.scheduleNotificationAsync({ identifier: DAILY_ID, content: { title: copy.title, body: copy.body, sound: 'default', data: { route: '/(tabs)/assistant' } }, trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 8, minute: 0, channelId: 'daily-greeting' } });
}

export async function cancelDailyGreeting() { if (Platform.OS !== 'web') await Notifications.cancelScheduledNotificationAsync(DAILY_ID).catch(() => {}); }
