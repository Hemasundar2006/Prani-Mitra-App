import { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Action, C, Field, Icon, MenuRow, Page, s } from '@/components/design';
import { useApp } from '@/context/AppContext';
import { findService } from '@/data/content';
import { api, ApiCall } from '@/services/api';
import { t } from '@/i18n';
export default function History() {
  const { conversations, token, language } = useApp(); const [search, setSearch] = useState(''); const [savedOnly, setSavedOnly] = useState(false);
  const [calls, setCalls] = useState<ApiCall[]>([]);
  useEffect(() => { if (!token) return; let active = true; api.calls(token).then(data => { if (active) setCalls(data.calls ?? []); }).catch(() => {}); return () => { active = false; }; }, [token]);
  const list = conversations.filter(c => (!savedOnly || c.saved) && `${c.title} ${findService(c.service)?.title}`.toLowerCase().includes(search.toLowerCase()));
  return <Page title="Every conversation, close at hand" subtitle="Revisit your questions and keep useful notes."><Field label="Search history" placeholder="Search your conversations" value={search} onChangeText={setSearch} /><View style={s.row}>{['All conversations', 'Saved'].map((label, i) => <TouchableOpacity accessibilityRole="button" key={label} onPress={() => setSavedOnly(!!i)} style={{ backgroundColor: savedOnly === !!i ? C.green : C.sage, borderRadius: 12, padding: 12 }}><Text style={{ color: savedOnly === !!i ? C.white : C.green }}>{t(label, language)}</Text></TouchableOpacity>)}</View>
    {list.length ? list.map(c => <MenuRow key={c.id} title={c.title} subtitle={`${t(findService(c.service)?.title, language)} · ${new Date(c.date).toLocaleDateString(language === 'हिन्दी' ? 'hi-IN' : language === 'తెలుగు' ? 'te-IN' : 'en-IN')}${c.saved ? ` · ${t('Saved', language)}` : ''}`} icon="chatbubbles-outline" onPress={() => router.push({ pathname: '/conversation/[id]', params: { id: c.id } })} />) : <View style={[s.card, { alignItems: 'center', paddingVertical: 40 }]}><Icon name="chatbubbles-outline" size={46} /><Text style={s.h2}>{t(search || savedOnly ? 'Nothing here yet' : 'Your story starts here', language)}</Text><Text style={[s.body, { textAlign: 'center' }]}>{t('Ask a question. Your conversation will appear here automatically.', language)}</Text><Action title="Ask your first question" onPress={() => router.push('/(tabs)/assistant')} /></View>}
    {token && <><Text style={s.h2}>{t('Your calls', language)}</Text>{calls.length ? calls.filter(c => `${c.topic ?? ''} ${c.query?.text ?? ''}`.toLowerCase().includes(search.toLowerCase())).map((c, i) => <View key={c._id ?? String(i)} style={s.card}><Text style={s.h3}>{t(c.topic ?? 'Prani Mitra call', language)}</Text>{c.query?.text && <Text style={s.body}>{c.query.text}</Text>}{c.response?.text && <Text style={s.body}>{c.response.text}</Text>}<Text style={s.small}>{t(c.status ?? 'Call', language)}{c.createdAt ? ` · ${new Date(c.createdAt).toLocaleDateString(language === 'हिन्दी' ? 'hi-IN' : language === 'తెలుగు' ? 'te-IN' : 'en-IN')}` : ''}</Text></View>) : <Text style={s.body}>{t('No calls to show yet.', language)}</Text>}</>}
    <Text style={s.small}>{t('Conversations are stored on this device. Signing out clears them for privacy.', language)}</Text>
  </Page>;
}
