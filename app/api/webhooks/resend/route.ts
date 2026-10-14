import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createHmac } from 'crypto';

/**
 * Handles incoming delivery status webhooks from Resend (delivered, bounced, opened, complained).
 * Verifies webhook signatures using svix/resend signing secret.
 */
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  const rawBody = await request.text();

  // Signature verification if secret configured
  if (webhookSecret) {
    const signature = request.headers.get('svix-signature');
    const svixId = request.headers.get('svix-id');
    const svixTimestamp = request.headers.get('svix-timestamp');

    if (!signature || !svixId || !svixTimestamp) {
      return NextResponse.json({ error: 'Missing webhook signature headers' }, { status: 400 });
    }

    // Verify HMAC signature
    const signedPayload = `${svixId}.${svixTimestamp}.${rawBody}`;
    const expectedSignature = createHmac('sha256', webhookSecret)
      .update(signedPayload)
      .digest('base64');

    if (!signature.includes(expectedSignature)) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }
  }

  try {
    const payload = JSON.parse(rawBody);
    const eventType = payload.type; // e.g. "email.delivered", "email.bounced"
    const messageId = payload.data?.email_id;

    if (!messageId) {
      return NextResponse.json({ received: true, note: 'No message ID in event' });
    }

    const supabase = await createServerSupabaseClient();

    // Map Resend events to delivery status
    let mappedStatus = 'delivered';
    if (eventType === 'email.bounced') mappedStatus = 'bounced';
    else if (eventType === 'email.complained') mappedStatus = 'complained';
    else if (eventType === 'email.delivery_delayed') mappedStatus = 'delayed';

    // Update delivery log
    await supabase
      .from('email_delivery_log')
      .update({
        status: mappedStatus,
        response_payload: payload,
      })
      .eq('provider_message_id', messageId);

    return NextResponse.json({ received: true, status: mappedStatus });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to process webhook payload', details: err.message },
      { status: 500 }
    );
  }
}
