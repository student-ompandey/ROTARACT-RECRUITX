import { NextRequest, NextResponse } from 'next/server';
import { processEmailJobBatch } from '@/lib/email/queue-processor';

/**
 * Vercel Cron Endpoint for automated background queue processing.
 * Protected by authorization bearer header: `Authorization: Bearer ${CRON_SECRET}`
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Verify authorization secret
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized cron invocation' }, { status: 401 });
  }

  try {
    const result = await processEmailJobBatch(30);
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Error processing email jobs',
      },
      { status: 500 }
    );
  }
}
