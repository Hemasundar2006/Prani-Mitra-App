import React, { useState } from 'react';
import { KeyboardAvoidingView, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Action, C, Field, Page, keyboardBehavior, s } from './design';
import { useApp } from '@/context/AppContext';
import { api, apiLanguage, ApiUser } from '@/services/api';
import { msg91 } from '@/services/msg91';
import { t } from '@/i18n';

const farmOptions: [string, string][] = [['Crops', 'crops'], ['Dairy', 'dairy'], ['Poultry', 'poultry'], ['Livestock', 'livestock'], ['Fishery', 'fishery'], ['Horticulture', 'horticulture'], ['Organic', 'organic'], ['Mixed', 'mixed']];

export function AuthScreen({ mode = 'login' }: { mode?: 'login' | 'register' | 'reset' }) {
  const { signIn, language } = useApp();
  const [method, setMethod] = useState<'password' | 'otp'>('password');
  const [sent, setSent] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpRequestId, setOtpRequestId] = useState('');
  const [name, setName] = useState('');
  const [village, setVillage] = useState('');
  const [farming, setFarming] = useState<string[]>(['crops']);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const enter = (user: ApiUser, token: string, welcome = false) => { signIn({ name: user.name, phone: user.phoneNumber ?? identifier.trim(), village: user.location?.village ?? user.location?.district ?? user.location?.state ?? '', farming: user.farmingTypes ?? [] }, token); router.replace(welcome ? '/welcome' : '/(tabs)/home'); };
  async function finishMsg91Login(phoneNumber: string, accessToken: string) {
    const result = await api.verifyMsg91({ accessToken, phoneNumber, name: 'Farmer', preferredLanguage: apiLanguage(language) });
    enter(result.user, result.token);
  }
  async function submit() {
    if (loading) return;
    setError(''); setNotice('');
    const id = identifier.trim();
    if (mode === 'register' && (name.trim().length < 2 || !/^\d{10}$/.test(id))) return setError('Enter your name and a 10-digit mobile number.');
    if ((mode === 'register' || (mode === 'login' && method === 'otp')) && !/^\d{10}$/.test(id)) return setError('Enter a 10-digit mobile number.');
    if (mode === 'register' && (!/^(?=.*[A-Za-z])(?=.*\d).{6,}$/.test(password) || password !== confirmPassword)) return setError('Use at least 6 letters and numbers. Both passwords must match.');
    if (mode === 'login' && method === 'password' && (!id || !password)) return setError('Enter your mobile number or email and password.');
    if (mode === 'login' && method === 'otp' && sent && !/^\d{6}$/.test(otp)) return setError('Enter the 6-digit code sent to your phone.');
    if (mode === 'reset' && !(/^\d{10}$/.test(id) || /^\S+@\S+\.\S+$/.test(id))) return setError('Enter your registered mobile number or email.');
    if (mode === 'reset' && sent && (!/^\d{6}$/.test(otp) || !/^(?=.*[A-Za-z])(?=.*\d).{6,}$/.test(password) || password !== confirmPassword)) return setError('Enter your 6-digit OTP and matching new passwords with at least 6 letters and numbers.');
    setLoading(true);
    try {
      if (mode === 'register') {
        const result = await api.register({ phoneNumber: id, name: name.trim(), password, confirmPassword, role: 'farmer', preferredLanguage: language === 'हिन्दी' ? 'hindi' : language === 'తెలుగు' ? 'telugu' : 'english', ...(village.trim() ? { location: { village: village.trim() } } : {}), farmingTypes: farming });
        enter(result.user, result.token, true);
      } else if (mode === 'reset') {
        if (sent) { await api.resetPassword({ phoneNumber: id, otp, newPassword: password }); setResetDone(true); setNotice('Password changed. You can sign in now.'); }
        else { await api.forgotPassword(/^\d{10}$/.test(id) ? { phoneNumber: id } : { email: id }); setSent(/^\d{10}$/.test(id)); setNotice('Recovery instructions were requested. Check your phone or email.'); }
      } else if (method === 'otp') {
        if (!sent) {
          const result = await msg91.sendOtp(id);
          setOtpRequestId(result.requestId);
          if (result.invisibleVerified && result.accessToken) await finishMsg91Login(id, result.accessToken);
          else { setSent(true); setNotice('Verification code sent to your phone.'); }
        } else {
          const accessToken = await msg91.verifyOtp(otpRequestId, otp);
          await finishMsg91Login(id, accessToken);
        }
      } else {
        const result = await api.login(id, password); enter(result.user, result.token);
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'The service is unavailable. Please try again.'); }
    finally { setLoading(false); }
  }
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={keyboardBehavior}><Page back title={t(mode === 'register' ? 'Create your account' : mode === 'reset' ? 'Recover your account' : 'Welcome back', language)} subtitle={t(mode === 'register' ? 'A few details help us give useful guidance.' : mode === 'reset' ? 'We’ll help you regain access.' : 'Get farming help in your language.', language)}>
    {mode === 'login' && <View style={[s.row, { backgroundColor: C.sage, borderRadius: 14, padding: 4 }]}>{(['password', 'otp'] as const).map(m => <TouchableOpacity accessibilityRole="button" key={m} onPress={() => { setMethod(m); setSent(false); setError(''); setNotice(''); }} style={{ flex: 1, minHeight: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 11, backgroundColor: method === m ? C.white : 'transparent' }}><Text style={[s.h3, { color: C.green }]}>{t(m === 'password' ? 'Password' : 'Mobile OTP', language)}</Text></TouchableOpacity>)}</View>}
    {mode === 'register' && <Field label="Full name" placeholder="Your name" value={name} onChangeText={setName} autoComplete="name" />}
    {!resetDone && <Field label={mode === 'register' || (mode === 'login' && method === 'otp') ? 'Mobile number' : 'Email or mobile number'} placeholder={mode === 'register' || method === 'otp' ? '10-digit mobile number' : 'Registered mobile or email'} keyboardType={mode === 'register' || method === 'otp' ? 'phone-pad' : 'email-address'} value={identifier} onChangeText={v => { setIdentifier(v); setSent(false); setOtp(''); setOtpRequestId(''); }} autoCapitalize="none" />}
    {mode === 'register' && <><Field label="Village (optional)" placeholder="Where you farm" value={village} onChangeText={setVillage} /><Text style={s.h3}>{t('What do you farm?', language)}</Text><View style={[s.row, { flexWrap: 'wrap' }]}>{farmOptions.map(([label, value]) => <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: farming.includes(value) }} key={value} onPress={() => setFarming(prev => prev.includes(value) ? prev.filter(x => x !== value) : [...prev, value])} style={{ padding: 12, minHeight: 46, borderRadius: 12, backgroundColor: farming.includes(value) ? C.green : C.sage }}><Text style={[s.h3, { color: farming.includes(value) ? C.white : C.green }]}>{t(label, language)}</Text></TouchableOpacity>)}</View></>}
    {(mode === 'register' || (mode === 'login' && method === 'password')) && <><Field label="Password" placeholder="At least 6 letters and numbers" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} /><TouchableOpacity accessibilityRole="button" onPress={() => setShowPassword(v => !v)}><Text style={[s.small, { color: C.green }]}>{t(showPassword ? 'Hide password' : 'Show password', language)}</Text></TouchableOpacity></>}
    {mode === 'register' && <Field label="Confirm password" placeholder="Enter password again" secureTextEntry={!showPassword} value={confirmPassword} onChangeText={setConfirmPassword} />}
    {mode === 'reset' && sent && !resetDone && <><Field label="OTP from your phone" placeholder="6-digit code" keyboardType="number-pad" maxLength={6} value={otp} onChangeText={setOtp} /><Field label="New password" secureTextEntry value={password} onChangeText={setPassword} /><Field label="Confirm new password" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} /></>}
    {mode === 'login' && method === 'otp' && sent && <><Field label="Verification code" placeholder="6-digit code" keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode" maxLength={6} value={otp} onChangeText={setOtp} /><TouchableOpacity accessibilityRole="button" onPress={async () => { try { setError(''); await msg91.retryOtp(otpRequestId); setNotice('A new code was requested.'); } catch (e) { setError(e instanceof Error ? e.message : 'Could not resend code.'); } }}><Text style={[s.small, { color: C.green }]}>{t('Resend code', language)}</Text></TouchableOpacity></>}
    {error ? <Text accessibilityRole="alert" style={[s.body, { color: C.red }]}>{t(error, language)}</Text> : null}{notice ? <Text accessibilityLiveRegion="polite" style={s.body}>{t(notice, language)}</Text> : null}
    {!resetDone && <Action title={mode === 'register' ? 'Create account' : mode === 'reset' ? sent ? 'Reset password' : 'Send recovery instructions' : method === 'otp' && !sent ? 'Send OTP' : 'Sign in'} onPress={submit} loading={loading} />}
    {mode === 'login' && <><TouchableOpacity accessibilityRole="button" onPress={() => router.push('/forgot-password')}><Text style={[s.h3, { color: C.green, textAlign: 'center' }]}>{t('Forgot password?', language)}</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" onPress={() => router.push('/register')}><Text style={[s.h3, { color: C.green, textAlign: 'center' }]}>{t('New here? Create an account', language)}</Text></TouchableOpacity></>}
    {mode === 'reset' && <Action title="Back to login" secondary onPress={() => router.replace('/login')} />}
  </Page></KeyboardAvoidingView>;
}
