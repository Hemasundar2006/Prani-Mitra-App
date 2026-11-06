import React from 'react';
import { Image, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Action, C, Icon, Page, s } from '@/components/design';
import { useApp } from '@/context/AppContext';
import { t } from '@/i18n';

export default function Welcome() {
  const { height } = useWindowDimensions(); const { language } = useApp();
  const copy = language === 'हिन्दी' ? ['आपकी खेती का', 'अपना साथी।', 'पशुओं की देखभाल और खेती के सवालों के लिए अपनी भाषा में सहायता।'] : language === 'తెలుగు' ? ['మీ వ్యవసాయానికి', 'మీ తోడు.', 'పశువుల సంరక్షణ, పంటల గురించి మీ భాషలో సహాయం పొందండి.'] : ['A little guidance.', 'A lot of growth.', 'Care for your animals. Nurture your crops.\nFind a friend for every farming question.'];
  return <Page footer={<View style={{ gap: 14 }}><Action title="Get Started" onPress={() => router.push('/login')} /><Text style={[s.small, { textAlign: 'center' }]}>{t('Made with care, for our farming community', language)}</Text></View>}>
    <View style={{ flex: 1, justifyContent: 'center', gap: 18 }}>
      <View style={{ borderRadius: 32, backgroundColor: '#FFFFFF', padding: 8 }}><Image accessibilityLabel={t('Farmer ploughing with two oxen', language)} source={require('../../assets/images/farmer-ploughing-white.png')} resizeMode="contain" style={{ width: '100%', height: Math.min(height * 0.35, 360) }} /></View>
      <View style={{ gap: 12, alignItems: 'center' }}><Text style={s.label}>{t('YOUR FARM. OUR FRIENDSHIP.', language)}</Text><Text style={[s.title, { textAlign: 'center', fontSize: 34, lineHeight: 40 }]}>{copy[0]}{'\n'}<Text style={{ color: C.green }}>{copy[1]}</Text></Text><Text style={[s.body, { textAlign: 'center' }]}>{copy[2]}</Text></View>
      <View style={{ ...s.row, justifyContent: 'center', gap: 22 }}>{[['leaf-outline', 'Crop care'], ['paw-outline', 'Animal health'], ['globe-outline', '3 languages']].map(([icon, label]) => <View key={label} style={{ alignItems: 'center', gap: 6 }}><Icon name={icon} size={18} /><Text style={s.small}>{t(label, language)}</Text></View>)}</View>
    </View>
  </Page>;
}
