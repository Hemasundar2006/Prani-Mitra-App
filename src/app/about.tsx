import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Action, Brand, Page, s } from '@/components/design';
import { useApp } from '@/context/AppContext';
import { t } from '@/i18n';

export default function About() {
  const { language } = useApp();
  return <Page back title="Rooted in care. Growing together.">
    <View style={s.card}><Brand /><Text style={s.body}>{t('Prani Mitra brings farming and animal health assistance closer to rural communities through voice and text, in English, Hindi and Telugu.', language)}</Text><Text style={s.body}>{t('Ask about your farm, read short guides, and keep useful conversations close at hand.', language)}</Text></View>
    <View style={s.card}><Text style={s.h2}>{t('How your information is used', language)}</Text><Text style={s.body}>{t('Questions are sent to the assistant service for a reply. Your saved conversations stay on this device. Account details are sent to the account API when you sign in or update your profile.', language)}</Text></View>
    <Action title="Explore farm guides" onPress={() => router.push('/resources')} />
    <Action title="Help and support" secondary onPress={() => router.push('/support')} />
    <Text style={s.small}>{t('Prani Mitra · Version 1.0.0', language)}</Text>
  </Page>;
}
