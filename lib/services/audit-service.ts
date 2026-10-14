import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin, AuthSessionUser } from '@/lib/auth/guards';

export interface AuditLogPayload {
  action: string;
  driveId?: string;
  targetEntity: string;
  targetId: string;
  details?: Record<string, unknown>;
}

/**
 * Records an immutable audit log entry in `public.audit_logs`.
 * Ensures secrets, raw tokens, or private credentials are NEVER recorded.
 */
export async function logAuditEvent(
  actor: AuthSessionUser,
  payload: AuditLogPayload
): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient();
    await supabase.from('audit_logs').insert({
      action: payload.action,
      actor_id: actor.id,
      actor_email: actor.email,
      drive_id: payload.driveId || null,
      target_entity: payload.targetEntity,
      target_id: payload.targetId,
      details: payload.details || {},
    });
  } catch (err) {
    // Non-blocking log catch to prevent cascading failures
    console.error('Failed to write audit log:', err);
  }
}
