import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Action, C, Page, s } from '@/components/design';
import { useApp } from '@/context/AppContext';
import { t } from '@/i18n';

const steps = [
  ['Choose your language', 'Select English, Hindi or Telugu at the top of the screen.'],
  ['Pick a topic', 'Choose animal health, crops, government schemes or general questions.'],
  ['Ask by voice or text', 'Record a question to hear a reply, or type it in a live chat.'],
  ['Decide your next step', 'Use the answer as guidance. Consult a veterinarian for animal treatment or urgent symptoms.'],
  ['Keep useful notes', 'Find your conversations in History. You can also share a voice conversation summary by SMS.'],
];

export default function HowItWorks() {
  const { language } = useApp();
  return <Page back title="Five simple steps" subtitle="Help for your farm, in your language.">
    {steps.map(([title, body], i) => <View key={title} style={[s.card, s.row, { alignItems: 'flex-start' }]}><View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: C.sage, alignItems: 'center', justifyContent: 'center' }}><Text style={[s.h3, { color: C.green }]}>0{i + 1}</Text></View><View style={{ flex: 1, gap: 5 }}><Text style={s.h3}>{t(title, language)}</Text><Text style={s.body}>{t(body, language)}</Text></View></View>)}
    <Action title="Ask Prani Mitra" onPress={() => router.push('/(tabs)/assistant')} />
  </Page>;
}
