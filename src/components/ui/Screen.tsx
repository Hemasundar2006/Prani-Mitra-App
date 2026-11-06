import React from 'react';
import {
  ScrollView,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';

export interface ScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
  className?: string;
  contentContainerClassName?: string;
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  scrollable = true,
  className = '',
  contentContainerClassName = '',
}) => {
  const { isDark } = useAppTheme();

  return (
    <SafeAreaView
      className={`flex-1 bg-slate-50 dark:bg-slate-950 ${className}`}
      edges={['top', 'left', 'right']}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        {scrollable ? (
          <ScrollView
            className="flex-1"
            contentContainerClassName={`p-4 pb-12 ${contentContainerClassName}`}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          <View className={`flex-1 p-4 ${contentContainerClassName}`}>
            {children}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
