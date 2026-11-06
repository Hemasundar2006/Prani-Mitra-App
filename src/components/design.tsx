import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Animated, Image, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, View, ViewStyle, StyleProp } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import * as Linking from 'expo-linking';
import { languages } from '@/data/content';
import { useApp } from '@/context/AppContext';
import { t } from '@/i18n';

export const C = { green: '#14613D', dark: '#103A29', bg: '#FFFFFF', white: '#FFFFFF', text: '#182F22', muted: '#43594A', line: '#C9D8CA', sage: '#E7F3E8', yellow: '#F2CB72', red: '#A22B28' };
export type IconName = React.ComponentProps<typeof Ionicons>['name'];
export function Icon({ name, size = 22, color = C.green }: { name: string; size?: number; color?: React.ComponentProps<typeof Ionicons>['color'] }) { return <Ionicons name={name as IconName} size={size} color={color} />; }
export const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 }, between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  title: { fontSize: 30, lineHeight: 37, letterSpacing: -0.9, fontWeight: '800', color: C.text }, h2: { fontSize: 22, lineHeight: 29, fontWeight: '700', letterSpacing: -0.4, color: C.text }, h3: { fontSize: 17, lineHeight: 24, fontWeight: '700', color: C.text }, body: { fontSize: 16, lineHeight: 24, color: C.muted }, small: { fontSize: 14, lineHeight: 21, color: C.muted }, label: { fontSize: 12, fontWeight: '800', letterSpacing: 1.2, color: C.green },
  card: { backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 22, padding: 20, gap: 12 }, badge: { alignSelf: 'flex-start', borderRadius: 8, paddingVertical: 5, paddingHorizontal: 9, backgroundColor: C.sage },
  field: { minHeight: 56, borderWidth: 1.5, borderColor: C.line, borderRadius: 14, paddingHorizontal: 16, backgroundColor: C.white, color: C.text, fontSize: 16 }, section: { marginTop: 10, marginBottom: 2 },
});
export async function openExternal(url: string) {
  if (!/^(tel:|mailto:|sms:)/.test(url)) return 'This action is not available in the app.';
  try { await Linking.openURL(url); return ''; }
  catch { return 'Could not open this service. Please try again on your phone.'; }
}
export function ExternalButton({ title, url, secondary = false }: { title: string; url: string; secondary?: boolean }) {
  const [error, setError] = useState('');
  return <View style={{ gap: 8 }}><Action title={title} secondary={secondary} icon={url.startsWith('tel:') ? 'call-outline' : url.startsWith('mailto:') ? 'mail-outline' : 'chatbubble-outline'} onPress={async () => setError(await openExternal(url))} />{error ? <Text accessibilityRole="alert" style={{ color: C.red }}>{error}</Text> : null}</View>;
}
export function Action({ title, onPress, secondary = false, icon = 'arrow-forward', loading = false, disabled = false }: { title: string; onPress: () => void; secondary?: boolean; icon?: string; loading?: boolean; disabled?: boolean }) {
  const { language } = useApp(); const label = t(title, language) ?? title;
  // Static style on TouchableOpacity avoids the NativeWind interop/style-callback issue in the old CTA.
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: disabled || loading }} testID={title === 'Get Started' ? 'get-started' : undefined} activeOpacity={0.8} onPress={onPress} disabled={disabled || loading} style={{ minHeight: 56, width: '100%', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 15, backgroundColor: secondary ? C.white : C.green, borderWidth: secondary ? 1.5 : 0, borderColor: C.green, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: disabled ? 0.5 : 1 }}>
    {loading ? <ActivityIndicator color={secondary ? C.green : C.white} /> : <><Text style={{ color: secondary ? C.green : C.white, fontSize: 16, fontWeight: '700', textAlign: 'center', flexShrink: 1 }}>{label}</Text><Icon name={icon} color={secondary ? C.green : C.white} size={19} /></>}
  </TouchableOpacity>;
}
export function Entry({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const [value] = useState(() => new Animated.Value(1));
  const { reduceMotion } = useApp();
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then(systemReduced => {
      if (!mounted || reduceMotion || systemReduced) return;
      value.setValue(0); Animated.timing(value, { toValue: 1, duration: 320, useNativeDriver: Platform.OS !== 'web' }).start();
    });
    return () => { mounted = false; value.stopAnimation(); };
  }, [reduceMotion, value]);
  return <Animated.View style={[style, { opacity: value, transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}>{children}</Animated.View>;
}
export function Brand({ compact = false }: { compact?: boolean }) { return <View style={s.row}><Image accessibilityLabel="Prani Mitra logo" source={require('../../assets/images/prani-mitra-logo.png')} resizeMode="contain" style={{ width: compact ? 90 : 112, height: compact ? 74 : 91 }} /></View>; }
export function LanguagePicker() {
  const { language, setLanguage } = useApp(); const [open, setOpen] = useState(false); const label = t('Choose language', language) ?? 'Choose language';
  return <><TouchableOpacity accessibilityRole="button" accessibilityLabel={label} onPress={() => setOpen(true)} style={{ ...s.row, minHeight: 48, gap: 5, paddingHorizontal: 10, backgroundColor: C.sage, borderRadius: 24 }}><Icon name="globe-outline" size={18} /><Text style={{ color: C.green, fontSize: 14, fontWeight: '700' }}>{language}</Text><Icon name="chevron-down" size={14} /></TouchableOpacity>
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}><View style={{ flex: 1, justifyContent: 'center', padding: 30, backgroundColor: '#132E2577' }}><View accessibilityViewIsModal style={[s.card, { width: '100%', maxWidth: 420, alignSelf: 'center' }]}><Text style={s.h2}>{t('Choose your language', language)}</Text>{languages.map(l => <TouchableOpacity key={l} accessibilityRole="radio" accessibilityState={{ checked: language === l }} onPress={() => { setLanguage(l); setOpen(false); }} style={{ ...s.between, minHeight: 50 }}><Text style={s.h3}>{l}</Text><Icon name={language === l ? 'checkmark-circle' : 'ellipse-outline'} /></TouchableOpacity>)}<Action title="Close" secondary icon="close" onPress={() => setOpen(false)} /></View></View></Modal></>;
}
export function Page({ children, title, subtitle, back = false, footer }: { children: React.ReactNode; title?: string; subtitle?: string; back?: boolean; footer?: React.ReactNode }) {
  const { language } = useApp();
  return <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: C.bg }}>
    <View style={{ paddingHorizontal: 22, paddingTop: 10, paddingBottom: 16, width: '100%', maxWidth: 660, alignSelf: 'center' }}><View style={s.between}>{back ? <TouchableOpacity accessibilityRole="button" accessibilityLabel={t('Back', language)} onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={{ ...s.row, minHeight: 44 }}><Icon name="arrow-back" /><Text style={s.h3}>{t('Back', language)}</Text></TouchableOpacity> : <Brand />}<LanguagePicker /></View></View>
    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 28, gap: 20, width: '100%', maxWidth: 660, alignSelf: 'center', flexGrow: 1 }}><Entry style={{ gap: 20, flex: 1 }}>{title ? <View style={{ gap: 6 }}><Text style={s.title}>{t(title, language)}</Text>{subtitle ? <Text style={s.body}>{t(subtitle, language)}</Text> : null}</View> : null}{children}</Entry></ScrollView>
    {footer ? <SafeAreaView edges={['bottom']} style={{ backgroundColor: C.bg }}><View style={{ padding: 20, paddingTop: 10, width: '100%', maxWidth: 660, alignSelf: 'center' }}>{footer}</View></SafeAreaView> : null}
  </SafeAreaView>;
}
export function Field({ label, ...props }: TextInputProps & { label: string }) { const { language } = useApp(); const translated = t(label, language) ?? label; return <View style={{ gap: 8 }}><Text style={s.h3}>{translated}</Text><TextInput {...props} accessibilityLabel={translated} placeholderTextColor="#596B5E" placeholder={t(props.placeholder, language)} style={[s.field, props.style]} /></View>; }
export function Section({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) { const { language } = useApp(); return <View style={[s.between, s.section]}><Text style={s.h2}>{t(title, language)}</Text>{action ? <TouchableOpacity accessibilityRole="button" onPress={onPress} style={{ paddingVertical: 10 }}><Text style={{ color: C.green, fontSize: 14, fontWeight: '700' }}>{t(action, language)} →</Text></TouchableOpacity> : null}</View>; }
export function MenuRow({ title, subtitle, icon, onPress }: { title: string; subtitle?: string; icon: string; onPress: () => void }) { const { language } = useApp(); return <TouchableOpacity accessibilityRole="button" onPress={onPress} activeOpacity={0.7} style={[s.row, { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.line }]}><View style={{ backgroundColor: C.sage, padding: 12, borderRadius: 14 }}><Icon name={icon} /></View><View style={{ flex: 1 }}><Text style={s.h3}>{t(title, language)}</Text>{subtitle ? <Text style={s.small}>{t(subtitle, language)}</Text> : null}</View><Icon name="chevron-forward" size={16} color={C.muted} /></TouchableOpacity>; }
export const keyboardBehavior = Platform.OS === 'ios' ? 'padding' as const : 'height' as const;
export function DotTransition() {
  const pathname = usePathname(); const { reduceMotion } = useApp(); const [opacity] = useState(() => new Animated.Value(0)); const [dots] = useState(() => [0, 1, 2].map(() => new Animated.Value(0.7)));
  useEffect(() => {
    if (reduceMotion) { opacity.setValue(0); return; }
    opacity.setValue(1);
    dots.forEach(dot => dot.setValue(0.7));
    const driver = Platform.OS !== 'web';
    const animation = Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 230, useNativeDriver: driver }),
      Animated.stagger(35, dots.map(dot => Animated.sequence([Animated.timing(dot, { toValue: 1.3, duration: 65, useNativeDriver: driver }), Animated.timing(dot, { toValue: 0.7, duration: 65, useNativeDriver: driver })]))),
    ]); animation.start();
    return () => animation.stop();
  }, [pathname, opacity, dots, reduceMotion]);
  if (reduceMotion) return null;
  return <Animated.View pointerEvents="none" style={{ position: 'absolute', inset: 0, zIndex: 1000, backgroundColor: '#00000099', alignItems: 'center', justifyContent: 'center', opacity }}><View style={{ flexDirection: 'row', gap: 8, padding: 18, borderRadius: 22, backgroundColor: '#00000066' }}>{dots.map((dot, i) => <Animated.View key={i} style={{ width: 9, height: 9, borderRadius: 9, backgroundColor: '#FFFFFF', transform: [{ scale: dot }] }} />)}</View></Animated.View>;
}
