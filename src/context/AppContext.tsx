import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { Language } from '@/data/content';
import { Conversation, Profile } from '@/services/gateway';
import { scheduleDailyGreeting } from '@/services/dailyNotification';

type State = { profile: Profile | null; language: Language; conversations: Conversation[]; reduceMotion: boolean; token: string | null };
const initial: State = { profile: null, language: 'English', conversations: [], reduceMotion: false, token: null };
const KEY = 'pranimitra.account.v2';
const TOKEN_KEY = 'pranimitra.auth.token';
type Context = State & { ready: boolean; storageError: string; signIn: (profile: Profile, token?: string) => void; signOut: () => void; setLanguage: (l: Language) => void; setReduceMotion: (v: boolean) => void; saveConversation: (c: Conversation) => void; toggleSaved: (id: string) => void };
const AppContext = createContext<Context | null>(null);
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(initial);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState('');
  useEffect(() => {
    Promise.all([AsyncStorage.getItem(KEY), Platform.OS === 'web' ? Promise.resolve(null) : SecureStore.getItemAsync(TOKEN_KEY)]).then(([raw, token]) => {
      const saved = raw ? JSON.parse(raw) : null;
      if (saved && Array.isArray(saved.conversations)) setState({ ...initial, ...saved, token, profile: (saved.wasLive || saved.token) && !token ? null : saved.profile });
    }).catch(() => setStorageError('Saved account data could not be read.')).finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (ready) { const saved = { profile: state.profile, language: state.language, conversations: state.conversations, reduceMotion: state.reduceMotion, wasLive: !!state.token }; AsyncStorage.setItem(KEY, JSON.stringify(saved)).catch(() => setStorageError('Changes are available this session, but could not be saved on this device.')); }
  }, [state, ready]);
  useEffect(() => { if (ready && state.profile?.name) scheduleDailyGreeting(state.profile.name, state.language).catch(() => {}); }, [ready, state.profile?.name, state.language]);
  return <AppContext.Provider value={{ ...state, ready, storageError,
    signIn: (profile, token) => { if (token && Platform.OS !== 'web') SecureStore.setItemAsync(TOKEN_KEY, token).catch(() => setStorageError('Could not securely save your login. You may need to sign in again.')); setState(s => ({ ...s, profile, token: token ?? s.token })); },
    signOut: () => { if (Platform.OS !== 'web') SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => setStorageError('Could not clear the saved login token.')); setState(s => ({ ...s, profile: null, token: null, conversations: [] })); },
    setLanguage: language => setState(s => ({ ...s, language })),
    setReduceMotion: reduceMotion => setState(s => ({ ...s, reduceMotion })),
    saveConversation: c => setState(s => ({ ...s, conversations: [c, ...s.conversations.filter(x => x.id !== c.id)].slice(0, 100) })),
    toggleSaved: id => setState(s => ({ ...s, conversations: s.conversations.map(c => c.id === id ? { ...c, saved: !c.saved } : c) })),
  }}>{children}</AppContext.Provider>;
}
export function useApp() { const c = useContext(AppContext); if (!c) throw new Error('AppProvider missing'); return c; }
