export interface InterviewPassEmailParams {
  candidateName: string;
  driveName: string;
  slotTimeIST: string;
  panelName: string;
  passUrl: string;
  meetLink?: string | null;
  supportEmail?: string;
  isTestMode?: boolean;
}

/**
 * Escapes dynamic string values to prevent HTML injection in emails.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generates responsive, branded HTML email for candidate interview pass.
 */
export function renderInterviewPassEmailHtml(params: InterviewPassEmailParams): string {
  const safeName = escapeHtml(params.candidateName);
  const safeDrive = escapeHtml(params.driveName);
  const safeTime = escapeHtml(params.slotTimeIST);
  const safePanel = escapeHtml(params.panelName);
  const safeSupport = escapeHtml(params.supportEmail || 'recruitment@rotaract-tits.org');

  const testBanner = params.isTestMode
    ? `<div style="background-color: #78350f; color: #fef3c7; padding: 10px 16px; font-size: 12px; font-weight: bold; text-align: center; border-radius: 6px; margin-bottom: 20px;">
        [TEST MODE ACTIVE] This message was rerouted to the administrator test address.
       </div>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Interview Pass — Rotaract RecruitX</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b1120; color: #f1f5f9; margin: 0; padding: 30px 15px;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
    
    <!-- Top Header -->
    <div style="background: linear-gradient(135deg, #1d4ed8 0%, #3b82f6 50%, #4f46e5 100%); padding: 24px; text-align: center;">
      <span style="font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #bfdbfe; display: block; margin-bottom: 4px;">Rotaract Club of TIT & S</span>
      <h1 style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">Official Interview Pass</h1>
    </div>

    <!-- Body Content -->
    <div style="padding: 28px;">
      ${testBanner}

      <p style="font-size: 14px; color: #cbd5e1; margin-top: 0;">Dear <strong>${safeName}</strong>,</p>
      
      <p style="font-size: 13px; color: #94a3b8; line-height: 1.6;">
        Your interview slot for <strong>${safeDrive}</strong> has been confirmed. Below are your scheduled details and your confidential pass link:
      </p>

      <!-- Details Card -->
      <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 18px; margin: 22px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="color: #94a3b8; padding: 5px 0; width: 35%;">Interview Time:</td>
            <td style="color: #f8fafc; font-weight: 600; padding: 5px 0;">${safeTime}</td>
          </tr>
          <tr>
            <td style="color: #94a3b8; padding: 5px 0;">Assigned Panel:</td>
            <td style="color: #60a5fa; font-weight: 600; padding: 5px 0;">${safePanel}</td>
          </tr>
          <tr>
            <td style="color: #94a3b8; padding: 5px 0;">Timezone:</td>
            <td style="color: #cbd5e1; padding: 5px 0;">Asia/Kolkata (IST)</td>
          </tr>
        </table>
      </div>

      <!-- Call to Action Button -->
      <div style="text-align: center; margin: 26px 0;">
        <a href="${params.passUrl}" target="_blank" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; font-size: 13px; font-weight: 600; text-decoration: none; border-radius: 8px; display: inline-block; box-shadow: 0 4px 12px rgba(37,99,235,0.4);">
          Access Your Candidate Pass &rarr;
        </a>
      </div>

      <p style="font-size: 12px; color: #64748b; line-height: 1.5; text-align: center; margin: 0 auto; max-width: 440px;">
        Please do not forward this email. Your pass link contains an unguessable cryptographic token mapped exclusively to your record.
      </p>

      <hr style="border: none; border-top: 1px solid #1e293b; margin: 24px 0;">

      <!-- Help/Footer -->
      <p style="font-size: 11px; color: #64748b; margin: 0; text-align: center;">
        Need help or have scheduling queries? Contact our committee at <a href="mailto:${safeSupport}" style="color: #60a5fa; text-decoration: underline;">${safeSupport}</a>.
      </p>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Plain-text alternative for candidate interview pass.
 */
export function renderInterviewPassEmailText(params: InterviewPassEmailParams): string {
  const testPrefix = params.isTestMode ? '[TEST MODE ACTIVE]\n' : '';

  return `${testPrefix}Dear ${params.candidateName},

Your interview slot for ${params.driveName} has been confirmed.

Scheduled Time: ${params.slotTimeIST} (Asia/Kolkata IST)
Assigned Panel: ${params.panelName}

You can access your official interview pass and Google Meet room details using your confidential link:
${params.passUrl}

Note: Do not share this pass link. It contains a private cryptographic access token.

Need assistance? Contact us at: ${params.supportEmail || 'recruitment@rotaract-tits.org'}

Best regards,
Rotaract Club of TIT & S
`;
}
