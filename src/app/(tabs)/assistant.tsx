import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Action, C, Icon, Page, s } from '@/components/design';
import { services, ServiceId } from '@/data/content';
import { useApp } from '@/context/AppContext';
import { t } from '@/i18n';
export default function Assistant() {
  const { language } = useApp(); const [service, setService] = useState<ServiceId>('animal-health');
  return <Page title="Let’s talk about your farm" subtitle="Your questions matter. Start wherever you are.">
    <View style={[s.card, { backgroundColor: C.dark, alignItems: 'center', borderWidth: 0, padding: 30 }]}><View style={{ width: 90, height: 90, borderRadius: 45, borderWidth: 9, borderColor: '#3B6953', backgroundColor: '#578668', alignItems: 'center', justifyContent: 'center' }}><Icon name="mic-outline" size={34} color="white" /></View><Text style={[s.h2, { color: 'white' }]}>{t('A familiar voice. A helping hand.', language)}</Text><Text style={[s.body, { color: '#C5D9CD', textAlign: 'center' }]}>{t('Speak naturally and hear the answer in', language)} {language}.</Text><Action title="Start voice conversation" icon="mic-outline" onPress={() => router.push({ pathname: '/voice', params: { service } })} /></View>
    <Text style={s.h2}>{t('Prefer to type?', language)}</Text><Text style={s.body}>{t('Choose a topic to chat with the live assistant.', language)}</Text><View style={{ ...s.row, flexWrap: 'wrap' }}>{services.filter(x => x.id !== 'emergency').map(item => <TouchableOpacity key={item.id} accessibilityRole="radio" accessibilityState={{ checked: service === item.id }} onPress={() => setService(item.id)} style={{ ...s.row, width: '48%', flexGrow: 1, padding: 14, borderWidth: 1, borderColor: service === item.id ? C.green : C.line, borderRadius: 16, backgroundColor: service === item.id ? C.sage : C.white }}><Icon name={item.icon} size={18} /><Text style={[s.small, { flex: 1, color: C.text, fontWeight: '700' }]}>{t(item.title, language)}</Text></TouchableOpacity>)}</View>
    <Action title="Start live chat" icon="chatbubble-outline" onPress={() => router.push({ pathname: '/chat', params: { service } })} /><Text style={s.small}>{t('Your question is sent to the assistant service. Answers require that service to be online. Conversations are saved on this device.', language)}</Text>
  </Page>;
}
