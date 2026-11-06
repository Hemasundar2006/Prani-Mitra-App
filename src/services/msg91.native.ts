type Msg91Response = { type?: string; message?: string; reqId?: string; requestId?: string; invisibleVerified?: boolean; 'access-token'?: string; accessToken?: string };
export type Msg91SendResult = { requestId: string; accessToken?: string; invisibleVerified: boolean };
const MSG91_WIDGET_API = 'https://control.msg91.com/api/v5/widget';
function credentials() {
  const widgetId = process.env.EXPO_PUBLIC_MSG91_WIDGET_ID?.trim();
  const tokenAuth = process.env.EXPO_PUBLIC_MSG91_TOKEN_AUTH?.trim();
  if (!widgetId || !tokenAuth) throw new Error('MSG91 is not configured. Add the widget ID and mobile integration token, then restart the app.');
  return { widgetId, tokenAuth };
}
async function post(endpoint: string, body: Record<string, unknown>): Promise<Msg91Response> {
  const { widgetId, tokenAuth } = credentials();
  const response = await fetch(`${MSG91_WIDGET_API}${endpoint}`, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ widgetId, tokenAuth, ...body }) });
  const payload = await response.json().catch(() => null) as Msg91Response | null;
  if (!response.ok) throw new Error(payload?.message || `MSG91 request failed (${response.status}).`);
  if (!payload) throw new Error('MSG91 returned an invalid response.');
  return payload;
}
function assertSuccess(response: Msg91Response, fallback: string) { if (response.type?.toLowerCase() !== 'success') throw new Error(response.message || fallback); return response; }
function indianIdentifier(value: string) { const digits = value.replace(/\D/g, ''); if (/^91\d{10}$/.test(digits)) return digits; if (/^\d{10}$/.test(digits)) return `91${digits}`; throw new Error('Enter a valid 10-digit Indian mobile number.'); }
const token = (response: Msg91Response) => response['access-token'] || response.accessToken;
export const msg91 = {
  async sendOtp(phoneNumber: string): Promise<Msg91SendResult> {
    const response = assertSuccess(await post('/sendOtpMobile', { identifier: indianIdentifier(phoneNumber) }), 'MSG91 could not send the verification code.');
    const requestId = String(response.reqId || response.requestId || response.message || ''); const accessToken = token(response);
    if (!requestId && !accessToken) throw new Error('MSG91 did not return a verification request ID.');
    return { requestId, accessToken, invisibleVerified: response.invisibleVerified === true };
  },
  async verifyOtp(requestId: string, otp: string) {
    if (!requestId) throw new Error('Send a new verification code before trying again.');
    const response = assertSuccess(await post('/verifyOtp', { reqId: requestId, otp }), 'The verification code is incorrect or expired.');
    const accessToken = token(response) || response.message; if (!accessToken) throw new Error('MSG91 verified the code but did not return an access token.'); return accessToken;
  },
  async retryOtp(requestId: string) {
    if (!requestId) throw new Error('Send a verification code first.');
    assertSuccess(await post('/retryOtp', { reqId: requestId, retryChannel: 11 }), 'MSG91 could not resend the verification code.');
  },
};
