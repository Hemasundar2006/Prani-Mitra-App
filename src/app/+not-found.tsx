import React from 'react';
import { View, Text } from 'react-native';
import { Link, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/context/AppContext';
import { t } from '@/i18n';

export default function NotFoundScreen() {
  const { language } = useApp();
  return (
    <>
      <Stack.Screen options={{ title: t('Page Not Found', language) }} />
      <View className="flex-1 items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <View className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/60 items-center justify-center mb-4">
          <Ionicons name="alert-circle-outline" size={36} color="#ef4444" />
        </View>

        <Text className="text-2xl font-bold text-slate-900 dark:text-white text-center">
          {t('Screen not found', language)}
        </Text>

        <Text className="text-sm text-slate-500 dark:text-slate-400 text-center mt-2 mb-6">
          {t('The requested route could not be found.', language)}
        </Text>

        <Link href="/" asChild>
          <Button title={t('Return to Home', language) ?? 'Return to Home'} variant="primary" />
        </Link>
      </View>
    </>
  );
}

