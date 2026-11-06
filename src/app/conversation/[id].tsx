import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Action, Page, s } from '@/components/design';
import { useApp } from '@/context/AppContext';
import { findService } from '@/data/content';
import { t } from '@/i18n';
export default function ConversationDetail() {
  const { id } = useLocalSearchParams<{ id: string }>(); const { conversations, toggleSaved, language } = useApp(); const c = conversations.find(x => x.id === id);
  if (!c) return <Page back title="Conversation unavailable"><Text style={s.body}>{t('This conversation is no longer saved on this device.', language)}</Text></Page>;
  const locale = language === 'हिन्दी' ? 'hi-IN' : language === 'తెలుగు' ? 'te-IN' : 'en-IN';
  return <Page back title={c.title} subtitle={`${t(findService(c.service)?.title, language)} · ${c.language} · ${new Date(c.date).toLocaleDateString(locale)}`} footer={<Action title="Continue in text chat" onPress={() => router.push({ pathname: '/chat', params: { conversation: c.id } })} />}><Action secondary title={c.saved ? 'Remove bookmark' : 'Save conversation'} icon={c.saved ? 'bookmark' : 'bookmark-outline'} onPress={() => toggleSaved(c.id)} />{c.messages.map(m => <View key={m.id} style={s.card}><Text style={s.label}>{t(m.role === 'user' ? 'YOU' : 'PRANI MITRA', language)}</Text><Text style={s.body}>{m.text}</Text></View>)}</Page>;
}
