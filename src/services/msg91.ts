export type Msg91SendResult = { requestId: string; accessToken?: string; invisibleVerified: boolean };
const unsupported = () => { throw new Error('MSG91 mobile verification is available in the installed Android or iOS app, not on the web.'); };
export const msg91 = { sendOtp: async (_phone: string): Promise<Msg91SendResult> => unsupported(), verifyOtp: async (_requestId: string, _otp: string): Promise<string> => unsupported(), retryOtp: async (_requestId: string): Promise<void> => unsupported() };
