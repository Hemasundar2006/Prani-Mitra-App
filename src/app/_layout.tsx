import '../global.css';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { AppProvider, useApp } from '@/context/AppContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { C, DotTransition } from '@/components/design';

SplashScreen.preventAutoHideAsync().catch(() => {});
function Navigation() {
  const { ready, profile, reduceMotion } = useApp();
  useEffect(() => { if (ready) SplashScreen.hideAsync().catch(() => {}); }, [ready]);
  if (!ready) return <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center' }}><ActivityIndicator color={C.green} /></View>;
  return <><StatusBar style="dark" /><Stack screenOptions={{ headerShown: false, animation: reduceMotion ? 'none' : 'fade', contentStyle: { backgroundColor: C.bg } }}>
    <Stack.Protected guard={!profile} redirectTo="/(tabs)/home"><Stack.Screen name="index" /><Stack.Screen name="login" /><Stack.Screen name="register" /><Stack.Screen name="forgot-password" /></Stack.Protected>
    <Stack.Protected guard={!!profile} redirectTo="/login">
      <Stack.Screen name="welcome" /><Stack.Screen name="(tabs)" /><Stack.Screen name="service/[id]" /><Stack.Screen name="chat" /><Stack.Screen name="voice" /><Stack.Screen name="conversation/[id]" /><Stack.Screen name="call" /><Stack.Screen name="settings" /><Stack.Screen name="plans" />
    </Stack.Protected>
    <Stack.Screen name="support" /><Stack.Screen name="about" /><Stack.Screen name="how-it-works" /><Stack.Screen name="resources" /><Stack.Screen name="article/[id]" />
  </Stack><DotTransition /></>;
}
export default function RootLayout() { return <SafeAreaProvider><ThemeProvider><AppProvider><Navigation /></AppProvider></ThemeProvider></SafeAreaProvider>; }
