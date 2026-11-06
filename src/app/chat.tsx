import React, { useEffect, useId, useRef, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Action, C, Icon, keyboardBehavior, s } from '@/components/design';
import { useApp } from '@/context/AppContext';
import { assistantGateway, Conversation, Message } from '@/services/gateway';
import { findService } from '@/data/content';
import { t } from '@/i18n';
export default function Chat() {
  const { service: serviceParam, prompt, conversation: conversationId } = useLocalSearchParams<{ service: string; prompt?: string; conversation?: string }>();
  const app = useApp(); const existing = app.conversations.find(c => c.id === conversationId); const item = findService(existing?.service ?? serviceParam) ?? findService('general')!;
  const language = existing?.language ?? app.language;
  const generatedId = useId(); const id = existing?.id ?? generatedId;
  const [messages, setMessages] = useState<Message[]>(existing?.messages ?? [{ id: 'hello', role: 'assistant', text: language === 'हिन्दी' ? 'नमस्ते! अपना सवाल लिखें। मैं आपकी खेती और पशुओं के बारे में मदद कर सकता हूँ।' : language === 'తెలుగు' ? 'నమస్కారం! మీ ప్రశ్న రాయండి. పంటలు, పశువుల గురించి సహాయం చేస్తాను.' : `Hello! Ask me about ${item.title.toLowerCase()}. I’ll try to help in your language.` }]);
  const [draft, setDraft] = useState(prompt ?? ''); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const sending = useRef(false);
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null); const mounted = useRef(true); const pending = useRef<AbortController | null>(null);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; pending.current?.abort(); }; }, []);
  async function send() {
    if (!draft.trim() || sending.current) return;
    sending.current = true; setBusy(true); setError('');
    const next = [...messages, { id: `${id}-${messages.length}-u`, role: 'user' as const, text: draft.trim() }]; setMessages(next); setDraft('');
    try {
      const controller = new AbortController(); pending.current = controller;
      const response = await assistantGateway.reply(item.id, language, next, app.token ?? undefined, controller.signal);
      const complete = [...next, { id: `${id}-${next.length}-a`, role: 'assistant' as const, text: response }];
      const conversation: Conversation = { id, service: item.id, language, title: next.find(m => m.role === 'user')!.text.slice(0, 80), date: new Date().toISOString(), messages: complete, saved: existing?.saved ?? false };
      app.saveConversation(conversation); if (mounted.current) setMessages(complete);
    } catch (e) { if (mounted.current) { setError(e instanceof Error ? e.message : 'The assistant is unavailable. Please try again.'); setDraft(next.at(-1)!.text); setMessages(messages); } }
    finally { pending.current = null; sending.current = false; if (mounted.current) setBusy(false); }
  }
  return <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}><KeyboardAvoidingView style={{ flex: 1 }} behavior={keyboardBehavior}>
    <View style={{ ...s.row, padding: 20, borderBottomWidth: 1, borderBottomColor: C.line }}><TouchableOpacity accessibilityRole="button" accessibilityLabel={t('Go back', language)} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/assistant')} style={{ padding: 8 }}><Icon name="arrow-back" /></TouchableOpacity><View style={{ backgroundColor: C.sage, padding: 12, borderRadius: 14 }}><Icon name={item.icon} /></View><View style={{ flex: 1 }}><Text style={s.h3}>{t(item.title, language)}</Text><Text style={s.small}>{language} · {t('Live assistant', language)}</Text></View></View>
    <ScrollView ref={scroll} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: !app.reduceMotion })} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, gap: 16, width: '100%', maxWidth: 660, alignSelf: 'center' }}>{messages.map(m => <View key={m.id} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '90%', padding: 16, borderRadius: 20, borderBottomRightRadius: m.role === 'user' ? 5 : 20, borderBottomLeftRadius: m.role === 'assistant' ? 5 : 20, backgroundColor: m.role === 'user' ? C.green : C.white, borderWidth: m.role === 'user' ? 0 : 1, borderColor: C.line }}><Text style={{ fontSize: 16, lineHeight: 24, color: m.role === 'user' ? C.white : C.text }}>{m.text}</Text></View>)}{messages.length === 1 && item.prompts.map(p => <TouchableOpacity accessibilityRole="button" key={p} onPress={() => setDraft(p)} style={{ padding: 14, backgroundColor: C.sage, borderRadius: 14 }}><Text style={{ color: C.green }}>{t(p, language)} ↗</Text></TouchableOpacity>)}{busy && <Text accessibilityLiveRegion="polite" style={s.body}>{t('Mitra is preparing a reply…', language)}</Text>}</ScrollView>
    <View style={{ padding: 16, gap: 10, borderTopWidth: 1, borderTopColor: C.line, backgroundColor: C.white, width: '100%', maxWidth: 660, alignSelf: 'center' }}>{error ? <Text accessibilityRole="alert" style={{ color: C.red }}>{t(error, language)}</Text> : null}<View style={s.row}><TextInput accessibilityLabel={t('Your message', language)} placeholder={t('Type your farming question…', language)} placeholderTextColor={C.muted} value={draft} onChangeText={setDraft} multiline maxLength={2000} style={[s.field, { flex: 1, paddingVertical: 13, maxHeight: 110 }]} /><View style={{ width: 90 }}><Action title="Send" icon="send-outline" onPress={send} loading={busy} disabled={!draft.trim()} /></View></View></View>
  </KeyboardAvoidingView></SafeAreaView>;
}
