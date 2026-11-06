import { Image, Text, TouchableOpacity, View } from 'react-native';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Action, C, Icon, MenuRow, Page, Section, s } from '@/components/design';
import { ServiceCard } from '@/components/ServiceCard';
import { useApp } from '@/context/AppContext';
import { articles, services } from '@/data/content';
import { api } from '@/services/api';
import { t } from '@/i18n';
export default function Home() {
  const { profile, conversations, storageError, token, language } = useApp();
  const [usage, setUsage] = useState<{ totalCalls: number; remainingCalls: number } | null>(null);
  const [weather, setWeather] = useState<{ temp?: { current?: number; unit?: string }; description?: string } | null>(null);
  useEffect(() => { if (!token) return; let active = true; api.usage(token).then(data => { if (active) setUsage(data); }).catch(() => {}); api.weather(token).then(data => { if (active) setWeather(data); }).catch(() => {}); return () => { active = false; }; }, [token]);
  return <Page>
    <View style={s.between}><View style={{ gap: 5 }}><Text style={s.label}>{t('YOUR EVERYDAY FARM COMPANION', language)}</Text><Text style={s.title}>{t('Namaste,', language)} {profile?.name.split(' ')[0]} <Text style={{ fontSize: 24 }}>☀</Text></Text><Text style={s.body}>{profile?.village || t('Let’s make today a good farming day.', language)}</Text></View></View>
    {storageError ? <Text accessibilityRole="alert" style={{ color: C.red }}>{t(storageError, language)}</Text> : null}
    {weather?.temp?.current !== undefined && <View style={[s.card, s.row]}><Icon name="partly-sunny-outline" /><View><Text style={s.h3}>{t('Today’s weather', language)} · {weather.temp.current}°{weather.temp.unit ?? 'C'}</Text><Text style={s.body}>{t(weather.description ?? 'Current conditions', language)}</Text></View></View>}
    <View style={{ backgroundColor: C.dark, borderRadius: 26, padding: 23, gap: 18, overflow: 'hidden' }}><View style={s.row}><View style={{ flex: 1, gap: 12 }}><Text style={[s.label, { color: '#BBD6A1' }]}>{t('A FRIEND, JUST A CALL AWAY', language)}</Text><Text style={[s.title, { color: 'white', fontSize: 29, lineHeight: 35 }]}>{t('Big questions.', language)}{'\n'}{t('Simple answers.', language)}</Text><Text style={{ color: '#C4D7CC', lineHeight: 21, fontSize: 13 }}>{t('Talk about your animals and crops in your own language.', language)}</Text></View><Image source={require('../../../assets/images/farmer-cows-onboarding.png')} resizeMode="contain" style={{ width: '36%', height: 170 }} /></View><Action title="Talk to Mitra" icon="mic-outline" onPress={() => router.push('/(tabs)/assistant')} /></View>
    <View style={{ ...s.between, padding: 16, backgroundColor: C.white, borderRadius: 18, borderWidth: 1, borderColor: C.line }}>{[[String(conversations.length), 'Chats'], [String(usage?.totalCalls ?? '—'), 'Calls'], [String(usage?.remainingCalls ?? '—'), 'Calls left']].map(([value, label]) => <View key={label} style={{ alignItems: 'center', flex: 1, gap: 4 }}><Text style={s.h2}>{value}</Text><Text style={[s.small, { textAlign: 'center' }]}>{t(label, language)}</Text></View>)}</View>
    <Section title="How can we help?" action="View all" onPress={() => router.push('/(tabs)/explore')} /><View style={{ ...s.row, flexWrap: 'wrap' }}>{services.slice(0, 4).map(service => <ServiceCard key={service.id} service={service} />)}</View>
    <TouchableOpacity accessibilityRole="button" onPress={() => router.push({ pathname: '/service/[id]', params: { id: 'emergency' } })} style={{ ...s.row, padding: 17, borderRadius: 18, backgroundColor: '#FBEAE5' }}><Icon name="medkit-outline" color={C.red} /><View style={{ flex: 1 }}><Text style={s.h3}>{t('Need urgent support?', language)}</Text><Text style={s.small}>{t('Find your next step and contact support', language)}</Text></View><Icon name="arrow-forward" color={C.red} /></TouchableOpacity>
    <Section title="A little knowledge goes far" />{articles.slice(0, 2).map(a => <TouchableOpacity key={a.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/article/[id]', params: { id: a.id } })} style={[s.card, s.row]}><View style={{ backgroundColor: a.color, borderRadius: 16, padding: 18 }}><Icon name={a.icon} size={28} /></View><View style={{ flex: 1, gap: 4 }}><Text style={s.label}>{t(a.tag, language)}</Text><Text style={s.h3}>{t(a.title, language)}</Text><Text style={s.small}>{t(a.time, language)} {t('read', language)}</Text></View><Icon name="chevron-forward" size={16} /></TouchableOpacity>)}
    <MenuRow title="Explore the farm library" subtitle="Short guides and common questions" icon="book-outline" onPress={() => router.push('/resources')} />
    <MenuRow title="New to Prani Mitra?" subtitle="See how it works in five simple steps" icon="help-circle-outline" onPress={() => router.push('/how-it-works')} />
  </Page>;
}
