import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Action, C, Icon, MenuRow, Page, s } from '@/components/design';
import { findService } from '@/data/content';
import { useApp } from '@/context/AppContext';
import { t } from '@/i18n';
export default function Service() {
  const { id } = useLocalSearchParams<{ id: string }>(); const item = findService(id); const { language } = useApp();
  if (!item) return <Page back title="Service not found"><Action title="Browse services" onPress={() => router.replace('/(tabs)/explore')} /></Page>;
  return <Page back footer={<Action title={id === 'emergency' ? 'Contact support' : 'Start a conversation'} icon={id === 'emergency' ? 'call-outline' : 'chatbubble-outline'} onPress={() => router.push(id === 'emergency' ? '/call' : { pathname: '/chat', params: { service: item.id } })} />}>
    <View style={{ backgroundColor: item.color, borderRadius: 28, padding: 28, gap: 18 }}><Icon name={item.icon} size={48} color={item.ink} /><Text style={s.title}>{t(item.title, language)}</Text><Text style={[s.body, { color: item.ink }]}>{t(item.description, language)}</Text></View>
    <Text style={s.body}>{t(item.detail, language)}</Text><Text style={s.h2}>{t('What we can explore', language)}</Text>{item.topics.map((topic, i) => <View key={topic} style={s.row}><View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: C.sage, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: C.green, fontWeight: '700' }}>{i + 1}</Text></View><Text style={s.h3}>{t(topic, language)}</Text></View>)}
    {id !== 'emergency' && <Action title="Start voice conversation" icon="mic-outline" onPress={() => router.push({ pathname: '/voice', params: { service: item.id } })} />}
    <Text style={s.h2}>{t('Start with a question', language)}</Text>{item.prompts.map(p => <MenuRow key={p} title={p} icon="chatbubble-ellipses-outline" onPress={() => router.push({ pathname: '/chat', params: { service: item.id, prompt: p } })} />)}
    <Text style={s.small}>{t('The assistant needs an internet connection. For urgent animal symptoms, contact a local veterinarian.', language)}</Text>
  </Page>;
}
