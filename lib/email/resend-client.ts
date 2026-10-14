import { Resend } from 'resend';

export type EmailMode = 'draft' | 'test' | 'production';

export interface EmailDispatchOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey?: string;
}

export interface EmailDispatchResult {
  success: boolean;
  messageId?: string;
  error?: string;
  mode: EmailMode;
  skippedDueToDraft?: boolean;
}

/**
 * Reads server-enforced email mode from environment.
 * NEVER allows the browser or client to override the mode.
 */
export function getEmailMode(): EmailMode {
  const envMode = (process.env.EMAIL_MODE || 'draft').toLowerCase().trim();
  if (envMode === 'production') return 'production';
  if (envMode === 'test') return 'test';
  return 'draft';
}

/**
 * Initializes server-side Resend client.
 */
export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.includes('your-') || apiKey.includes('dummy')) {
    return null;
  }
  return new Resend(apiKey);
}

/**
 * Sends transactional email adhering strictly to EMAIL_MODE rules:
 * - draft: logs and returns simulated response; provider is never invoked.
 * - test: reroutes recipient to configured EMAIL_TEST_ADDRESS allowlist only.
 * - production: dispatches directly to candidate recipient.
 */
export async function sendTransactionalEmail(
  options: EmailDispatchOptions
): Promise<EmailDispatchResult> {
  const mode = getEmailMode();
  const fromAddress =
    process.env.RESEND_FROM_ADDRESS || 'Rotaract Recruitment <recruitment@rotaract-tits.org>';

  // 1. DRAFT MODE
  if (mode === 'draft') {
    return {
      success: true,
      messageId: `draft_${Date.now()}_simulated`,
      mode: 'draft',
      skippedDueToDraft: true,
    };
  }

  // 2. TEST MODE
  let targetRecipient = options.to;
  if (mode === 'test') {
    const testAllowedAddress = process.env.EMAIL_TEST_ADDRESS;
    if (!testAllowedAddress) {
      return {
        success: false,
        error: 'EMAIL_MODE is set to test, but EMAIL_TEST_ADDRESS is not configured.',
        mode: 'test',
      };
    }
    targetRecipient = testAllowedAddress;
  }

  // 3. PRODUCTION or TEST DISPATCH
  const resend = getResendClient();
  if (!resend) {
    return {
      success: false,
      error: 'Resend API key is not configured in server environment.',
      mode,
    };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [targetRecipient],
      subject: mode === 'test' ? `[TEST] ${options.subject}` : options.subject,
      html: options.html,
      text: options.text,
      headers: options.idempotencyKey
        ? { 'X-Idempotency-Key': options.idempotencyKey }
        : undefined,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
        mode,
      };
    }

    return {
      success: true,
      messageId: data?.id,
      mode,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Unknown provider error occurred during dispatch.',
      mode,
    };
  }
}
