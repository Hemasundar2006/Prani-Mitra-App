import { useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Action, C, Field, LanguagePicker, Page, s } from '@/components/design';
import { useApp } from '@/context/AppContext';
import { api } from '@/services/api';
import { t } from '@/i18n';
export default function Settings() {
  const app = useApp();
  const [name, setName] = useState(app.profile?.name ?? '');
  const [village, setVillage] = useState(app.profile?.village ?? '');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  async function save() {
    if (!name.trim()) return setMessage('Enter your name before saving.');
    setBusy(true); setMessage('');
    try {
      if (app.token) { const current = await api.profile(app.token); const user = await api.updateProfile(app.token, { name: name.trim(), preferredLanguage: app.language === 'हिन्दी' ? 'hindi' : app.language === 'తెలుగు' ? 'telugu' : 'english', location: { ...current.location, village: village.trim() } }); app.signIn({ ...app.profile!, name: user.name, village: user.location?.village ?? village.trim() }); setMessage('Profile saved to your account.'); }
      else { app.signIn({ ...app.profile!, name: name.trim(), village: village.trim() }); setMessage('Profile saved on this device.'); }
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Could not save your profile.'); }
    finally { setBusy(false); }
  }
  return <Page back title="Your details"><Field label="Your name" value={name} onChangeText={setName} /><Field label="Village" value={village} onChangeText={setVillage} /><Action title="Save profile" icon="checkmark" onPress={save} loading={busy} />{message ? <Text accessibilityLiveRegion="polite" style={s.body}>{t(message, app.language)}</Text> : null}<View style={s.card}><View style={s.between}><Text style={s.h3}>{t('Preferred language', app.language)}</Text><LanguagePicker /></View><View style={s.between}><View style={{ flex: 1 }}><Text style={s.h3}>{t('Reduce motion', app.language)}</Text><Text style={s.small}>{t('Use simpler screen transitions', app.language)}</Text></View><Switch accessibilityLabel={t('Reduce motion', app.language)} value={app.reduceMotion} onValueChange={app.setReduceMotion} trackColor={{ true: C.green }} /></View></View><Text style={s.small}>{t('Conversations are stored on this device. Signing out clears them.', app.language)}</Text>{confirm ? <View style={s.card}><Text style={s.h3}>{t('Sign out and clear local chats?', app.language)}</Text><Action title="Yes, sign out" icon="log-out-outline" onPress={() => { app.signOut(); router.replace('/'); }} /><Action title="Keep exploring" secondary onPress={() => setConfirm(false)} /></View> : <Action title="Sign out" secondary icon="log-out-outline" onPress={() => setConfirm(true)} />}</Page>;
}
