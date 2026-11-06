import { Tabs } from 'expo-router';
import { C, Icon } from '@/components/design';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
export default function TabLayout() {
  const { bottom } = useSafeAreaInsets(); const { reduceMotion, language } = useApp();
  const titles = language === 'हिन्दी' ? ['घर', 'सेवाएँ', 'पूछें', 'इतिहास', 'मेरा'] : language === 'తెలుగు' ? ['హోమ్', 'సేవలు', 'అడుగు', 'చరిత్ర', 'నేను'] : ['Home', 'Services', 'Ask Mitra', 'History', 'Profile'];
  return <Tabs backBehavior="initialRoute" screenOptions={{ headerShown: false, animation: reduceMotion ? 'none' : 'fade', tabBarActiveTintColor: C.green, tabBarInactiveTintColor: C.muted, tabBarStyle: { height: 70 + bottom, paddingBottom: bottom + 7, paddingTop: 8, backgroundColor: C.white, borderTopColor: C.line }, tabBarLabelStyle: { fontSize: 12, fontWeight: '700' }, tabBarHideOnKeyboard: true }}>
    <Tabs.Screen name="index" options={{ href: null }} />
    <Tabs.Screen name="home" options={{ title: titles[0], tabBarIcon: ({ focused }) => <Icon name="home-outline" color={focused ? C.green : C.muted} /> }} />
    <Tabs.Screen name="explore" options={{ title: titles[1], tabBarIcon: ({ focused }) => <Icon name="grid-outline" color={focused ? C.green : C.muted} /> }} />
    <Tabs.Screen name="assistant" options={{ title: titles[2], tabBarIcon: ({ focused }) => <Icon name="sparkles-outline" color={focused ? C.green : C.muted} /> }} />
    <Tabs.Screen name="history" options={{ title: titles[3], tabBarIcon: ({ focused }) => <Icon name="time-outline" color={focused ? C.green : C.muted} /> }} />
    <Tabs.Screen name="profile" options={{ title: titles[4], tabBarIcon: ({ focused }) => <Icon name="person-outline" color={focused ? C.green : C.muted} /> }} />
  </Tabs>;
}
