import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Action, C, Icon, Page, s } from '@/components/design';
import { useApp } from '@/context/AppContext';
import { api, ApiPlan, ApiSubscription } from '@/services/api';
import { t } from '@/i18n';

export default function Plans() {
  const { token, language } = useApp();
  const [plans, setPlans] = useState<ApiPlan[]>([]);
  const [subscription, setSubscription] = useState<ApiSubscription | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function load() { setBusy(true); setError(''); try { const data = await api.plans(language); setPlans(Array.isArray(data) ? data : []); } catch (e) { setError(t(e instanceof Error ? e.message : 'Could not load plans.', language) ?? 'Could not load plans.'); } finally { setBusy(false); } }
  useEffect(() => { let active = true; api.plans(language).then(data => { if (active) setPlans(Array.isArray(data) ? data : []); }).catch(e => { if (active) setError(t(e instanceof Error ? e.message : 'Could not load plans.', language) ?? 'Could not load plans.'); }); if (token) api.subscription(token).then(data => { if (active) setSubscription(data); }).catch(() => {}); return () => { active = false; }; }, [language, token]);
  return <Page back title="Choose what suits you" subtitle="See current plans and what each includes.">
    <View style={[s.card, { backgroundColor: C.sage }]}><Icon name="ribbon-outline" size={32} /><Text style={s.h2}>{t('Your account', language)}</Text><Text style={s.body}>{t('Your account is connected. See available plans below.', language)}</Text></View>
    {subscription && <View style={s.card}><Text style={s.label}>{t('YOUR SUBSCRIPTION', language)}</Text><Text style={s.h2}>{t(subscription.planName ?? 'Your current plan', language)}</Text><Text style={s.body}>{t('Status:', language)} {t(subscription.status ?? 'Unknown', language)}{subscription.endDate ? ` · ${t('Through', language)} ${new Date(subscription.endDate).toLocaleDateString(language === 'हिन्दी' ? 'hi-IN' : language === 'తెలుగు' ? 'te-IN' : 'en-IN')}` : ''}</Text></View>}
    {plans.map((p, i) => <View key={p.id ?? p._id ?? String(i)} style={s.card}><Text style={s.h2}>{t(p.name, language)}</Text><Text style={s.title}>{p.currency === 'INR' ? '₹' : p.currency ?? ''}{p.price}<Text style={s.body}> / {t(p.billingCycle ?? 'plan', language)}</Text></Text>{p.features?.map(f => <View key={f} style={s.row}><Icon name="checkmark-circle" size={19} /><Text style={[s.body, { flex: 1 }]}>{t(f, language)}</Text></View>)}<Action title="Ask about this plan" secondary onPress={() => router.push({ pathname: '/support', params: { subject: `Plan: ${p.name}` } })} /></View>)}
    {error ? <Text accessibilityRole="alert" style={[s.body, { color: C.red }]}>{t(error, language)}</Text> : null}{!plans.length && !error && <Text style={s.body}>{t('No plans are listed right now.', language)}</Text>}
    <Action title="Refresh plans" secondary icon="refresh-outline" loading={busy} onPress={load} />
    <Text style={s.small}>{t('Need help choosing or renewing a plan? Ask support in the app.', language)}</Text><Action title="Contact plan support" onPress={() => router.push({ pathname: '/support', params: { subject: 'Plans and subscription' } })} />
  </Page>;
}
