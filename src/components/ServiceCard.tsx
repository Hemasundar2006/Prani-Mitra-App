import { Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { services } from '@/data/content';
import { Icon, s } from './design';
import { useApp } from '@/context/AppContext';
import { t } from '@/i18n';
export function ServiceCard({ service }: { service: typeof services[number] }) {
  const { language } = useApp();
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={t(service.title, language)} activeOpacity={0.8} onPress={() => router.push({ pathname: '/service/[id]', params: { id: service.id } })} style={[s.card, { width: '47%', flexGrow: 1, padding: 16, backgroundColor: service.color, borderWidth: 0, minHeight: 157 }]}><View style={s.between}><View style={{ padding: 10, backgroundColor: '#FFFFFFBB', borderRadius: 14 }}><Icon name={service.icon} color={service.ink} /></View><Icon name="arrow-forward" size={16} color={service.ink} /></View><View style={{ gap: 4 }}><Text style={s.h3}>{t(service.title, language)}</Text><Text style={[s.small, { color: service.ink }]}>{t(service.description, language)}</Text></View></TouchableOpacity>;
}
