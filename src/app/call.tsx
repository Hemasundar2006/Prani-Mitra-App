import { useState } from 'react';
import { router } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { Action, C, ExternalButton, Icon, Page, openExternal, s } from '@/components/design';
import { PHONE } from '@/data/content';
import { useApp } from '@/context/AppContext';
import { api } from '@/services/api';
import { t } from '@/i18n';

const topics: [string, string][] = [['Animal health', 'animal_health'], ['Crops', 'crop_guidance'], ['Nutrition', 'nutrition'], ['Urgent help', 'emergency'], ['Other', 'general']];
export default function Call() {
  const { token, profile, language } = useApp();
  const [topic, setTopic] = useState('animal_health');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function startCall() {
    if (!token || !profile?.phone) return setError(t('Sign in with a mobile number to request a call. You can still open the phone dialer below.', language) ?? 'Sign in with a mobile number to request a call. You can still open the phone dialer below.');
    setBusy(true); setError('');
    try { const result = await api.initiateCall(token, { phoneNumber: profile.phone, language: language === 'हिन्दी' ? 'hindi' : language === 'తెలుగు' ? 'telugu' : 'english', queryType: topic, isEmergency: topic === 'emergency' }); if (result.tollFreeNumber) setError(await openExternal(`tel:${result.tollFreeNumber}`)); else setError(t('Call requested. Check your phone for the next step.', language) ?? 'Call requested. Check your phone for the next step.'); }
    catch (e) { setError(t(e instanceof Error ? e.message : 'Could not request a call.', language) ?? 'Could not request a call.'); }
    finally { setBusy(false); }
  }
  return <Page back title="Talk to Prani Mitra" subtitle="Choose the help you need and connect in your language.">
    {token && <View style={s.card}><Text style={s.h2}>{t('Request a call', language)}</Text><Text style={s.body}>{t('What would you like to discuss?', language)}</Text><View style={[s.row, { flexWrap: 'wrap' }]}>{topics.map(([label, value]) => <TouchableOpacity key={value} accessibilityRole="radio" accessibilityState={{ checked: topic === value }} onPress={() => setTopic(value)} style={{ padding: 12, borderRadius: 12, minHeight: 46, backgroundColor: topic === value ? C.green : C.sage }}><Text style={[s.h3, { color: topic === value ? C.white : C.green }]}>{t(label, language)}</Text></TouchableOpacity>)}</View><Action title="Request call" icon="call-outline" loading={busy} onPress={startCall} /></View>}
    {error ? <Text accessibilityRole="alert" style={[s.body, { color: C.red }]}>{t(error, language)}</Text> : null}
    <View style={[s.card, { backgroundColor: C.sage, alignItems: 'center' }]}><Icon name="call-outline" size={42} /><Text style={s.h2}>{PHONE}</Text><Text style={[s.body, { textAlign: 'center' }]}>{t('Call Prani Mitra support directly.', language)}</Text><ExternalButton title="Open phone dialer" url={`tel:${PHONE}`} /></View>
    <View style={s.card}><Icon name="mic-outline" size={32} /><Text style={s.h2}>{t('Voice assistant', language)}</Text><Text style={s.body}>{t('Ask a question aloud and hear the answer in your language.', language)}</Text><Action title="Talk with Mitra" onPress={() => router.push('/voice')} /></View>
    <Text style={s.small}>{t('Opening the dialer lets you decide whether to place the call. For an animal emergency, contact a local veterinarian promptly.', language)}</Text>
  </Page>;
}
