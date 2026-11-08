import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Action, Page, s, C } from '@/components/design';
import { useApp } from '@/context/AppContext';
import { api, RecordingAnalysis } from '@/services/api';
import { t } from '@/i18n';

export default function AnalysisHistoryScreen() {
  const app = useApp(); const [items, setItems] = useState<RecordingAnalysis[]>([]); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  const load = () => { if (!app.token) return; setLoading(true); api.recordingAnalyses(app.token).then(setItems).catch(e => setError(e instanceof Error ? e.message : 'Could not load analysis history.')).finally(() => setLoading(false)); };
  // The loader intentionally tracks only the authenticated user.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { const timer = setTimeout(load, 0); return () => clearTimeout(timer); }, [app.token]);
  return <Page back title="Analysis history" subtitle="Your analyzed recordings will appear here.">{loading ? <Text style={s.body}>{t('Loading…', app.language)}</Text> : null}{error ? <Text style={[s.body, { color: C.red }]}>{t(error, app.language)}</Text> : null}{!loading && !items.length ? <View style={[s.card, { alignItems: 'center' }]}><Text style={s.h2}>{t('No analysis history yet.', app.language)}</Text><Text style={s.body}>{t('Your analyzed recordings will appear here.', app.language)}</Text><Action title="Analyze a recording" onPress={() => router.push('/recording-analysis' as never)} /></View> : items.map(item => <View key={item.id} style={s.card}><Text style={s.label}>{new Date(item.createdAt).toLocaleDateString()}</Text><Text style={s.h3}>{item.summary}</Text><Text style={s.body}>{item.immediateAction || t('No immediate action detected.', app.language)}</Text><Text style={[s.small, { color: item.urgency === 'urgent' ? C.red : C.green }]}>{t(item.urgency === 'urgent' ? 'Urgent' : item.urgency === 'warning' ? 'Warning' : 'Normal', app.language)}</Text></View>)}</Page>;
}
