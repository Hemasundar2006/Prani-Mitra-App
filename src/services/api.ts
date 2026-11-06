import { Language } from '@/data/content';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://prani-mitra-backend1.onrender.com/api';
type ApiResult<T> = { success: boolean; message?: string; data: T; errors?: string[]; code?: string };
export type ApiUser = { id?: string; _id?: string; name: string; phoneNumber?: string; email?: string; role?: string; preferredLanguage?: string; location?: { state?: string; district?: string; village?: string; pincode?: string }; farmingTypes?: string[] };
export type ApiCall = { _id?: string; topic?: string; query?: { text?: string }; response?: { text?: string }; duration?: number; status?: string; createdAt?: string };
export type ApiPlan = { id?: string; _id?: string; name: string; price: number; currency?: string; billingCycle?: string; features?: string[]; isPopular?: boolean };
export type ApiSubscription = { status?: string; planId?: string; planName?: string; startDate?: string; endDate?: string };
export type ApiContent = { id?: string; _id?: string; question?: string; title?: string; answer?: string; body?: string; content?: string };
async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, { ...init, signal: controller.signal, headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init.headers ?? {}) } });
    const payload = await response.json().catch(() => ({})) as ApiResult<T>;
    if (!response.ok || payload.success === false) throw new Error(payload.message || payload.code || `Request failed (${response.status})`);
    return payload.data ?? payload as unknown as T;
  } catch (e) { if (controller.signal.aborted) throw new Error('The service took too long to respond. Please try again.'); throw e; }
  finally { clearTimeout(timer); }
}
const body = (data: unknown) => ({ method: 'POST', body: JSON.stringify(data) });
export const apiLanguage = (language: Language) => language === 'हिन्दी' ? 'hindi' : language === 'తెలుగు' ? 'telugu' : 'english';
export const api = {
  async login(identifier: string, password: string) { return request<{ token: string; user: ApiUser }>('/auth/login', body({ identifier, password })); },
  async sendOtp(phoneNumber: string, purpose: 'login' | 'registration' | 'reset_password' = 'login') { return request<{ otpSent: boolean; isNewUser: boolean; expiresIn: number }>('/auth/send-otp', body({ phoneNumber, purpose })); },
  async verifyOtp(phoneNumber: string, otp: string) { return request<{ token: string; user: ApiUser }>('/auth/verify-otp', body({ phoneNumber, otp })); },
  async verifyMsg91(data: { accessToken: string; phoneNumber: string; name: string; preferredLanguage: string }) { return request<{ token: string; user: ApiUser }>('/auth/msg91/verify', body(data)); },
  async register(data: Record<string, unknown>) { return request<{ token: string; user: ApiUser }>('/auth/register', body(data)); },
  async forgotPassword(data: { email?: string; phoneNumber?: string }) { return request('/auth/forgot-password', body(data)); },
  async resetPassword(data: { phoneNumber: string; otp: string; newPassword: string }) { return request('/auth/reset-password', body(data)); },
  async profile(token: string) { return request<ApiUser>('/users/profile', {}, token); },
  async updateProfile(token: string, data: Record<string, unknown>) { return request<ApiUser>('/users/profile', { method: 'PUT', body: JSON.stringify(data) }, token); },
  async usage(token: string) { return request<{ totalCalls: number; monthlyCallsUsed: number; remainingCalls: number; totalMinutes: number }>('/users/usage', {}, token); },
  async calls(token: string, page = 1) { return request<{ calls: ApiCall[]; pagination: unknown }>(`/users/calls?page=${page}&limit=10`, {}, token); },
  async plans(language: Language = 'English') { const result = await request<ApiPlan[] | { plans?: ApiPlan[] }>(`/plans?language=${apiLanguage(language)}`); return Array.isArray(result) ? result : result.plans ?? []; },
  async subscription(token: string) { const result = await request<ApiSubscription | { subscription: ApiSubscription }>('/users/subscription', {}, token); return 'subscription' in result ? result.subscription : result; },
  async content(type = 'faq', language: Language = 'English') { const result = await request<ApiContent[] | { content?: ApiContent[]; items?: ApiContent[] }>(`/content?type=${type}&language=${apiLanguage(language)}`); return Array.isArray(result) ? result : result.content ?? result.items ?? []; },
  async weather(token: string) { return request<{ location?: { name?: string }; temp?: { current?: number; unit?: string }; description?: string }>('/users/weather/current', {}, token); },
  async initiateCall(token: string, data: Record<string, unknown>) { return request<{ callId: string; status: string; tollFreeNumber: string }>('/calls/initiate', body(data), token); },
  async contact(data: { name: string; phone?: string; email?: string; category: string; subject: string; message: string }) { return request('/contact', body(data)); },
};
