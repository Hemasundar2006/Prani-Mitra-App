import { useEffect, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Action, Brand, C, Icon, Page, s } from '@/components/design';
import { useApp } from '@/context/AppContext';
import { t } from '@/i18n';

export default function Welcome() {
  const { language, profile } = useApp();
  const [mark] = useState(() => new Animated.Value(0));
  const [copy] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.sequence([
      Animated.spring(mark, { toValue: 1, friction: 6, tension: 45, useNativeDriver: true }),
      Animated.timing(copy, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [copy, mark]);
  return <Page>
    <View style={{ flex: 1, justifyContent: 'center', gap: 28, paddingVertical: 28 }}>
      <Animated.View style={{ alignItems: 'center', transform: [{ scale: mark }, { rotate: mark.interpolate({ inputRange: [0, 1], outputRange: ['-8deg', '0deg'] }) }], opacity: mark }}>
        <View style={{ width: 132, height: 132, borderRadius: 44, backgroundColor: C.sage, alignItems: 'center', justifyContent: 'center', shadowColor: C.green, shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 8 }}>
          <Icon name="leaf-outline" size={62} color={C.green} />
        </View>
      </Animated.View>
      <Animated.View style={{ gap: 14, alignItems: 'center', opacity: copy, transform: [{ translateY: copy.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }}>
        <Brand compact />
        <Text style={[s.title, { textAlign: 'center' }]}>{t('Welcome to Prani Mitra', language)}</Text>
        <Text style={[s.body, { textAlign: 'center', maxWidth: 360 }]}>{t('Your farming companion is ready to grow with you.', language)}</Text>
        <Text style={[s.h3, { textAlign: 'center', color: C.green }]}>{profile?.name ? `${t('Namaste', language)}, ${profile.name}` : ''}</Text>
      </Animated.View>
      <Animated.View style={{ opacity: copy, transform: [{ translateY: copy.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }}>
        <Action title="Start exploring" onPress={() => router.replace('/(tabs)/home')} />
      </Animated.View>
    </View>
  </Page>;
}
