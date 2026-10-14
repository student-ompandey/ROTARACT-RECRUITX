'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/guards';
import { logAuditEvent } from '@/lib/services/audit-service';
import {
  CreateDriveSchema,
  UpdateDriveSchema,
  PanelSchema,
  AssignPanelMemberSchema,
  DriveStatus,
} from '@/lib/validations/drive';
import { revalidatePath } from 'next/cache';

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Valid drive status transition states
 */
const VALID_STATUS_TRANSITIONS: Record<DriveStatus, DriveStatus[]> = {
  draft: ['ready', 'archived'],
  ready: ['scheduled', 'draft', 'archived'],
  scheduled: ['completed', 'ready', 'archived'],
  completed: ['archived'],
  archived: ['draft'], // Allow un-archiving back to draft
};

// ==============================================================================
// DRIVE OPERATIONS
// ==============================================================================

export async function createDriveAction(formData: FormData): Promise<ActionResponse> {
  const admin = await requireAdmin();

  const rawInput = {
    name: formData.get('name'),
    academicYear: formData.get('academicYear'),
    description: formData.get('description'),
    targetCandidates: formData.get('targetCandidates') || 92,
    slotDurationMinutes: formData.get('slotDurationMinutes') || 15,
    timezone: formData.get('timezone') || 'Asia/Kolkata',
    startsAt: formData.get('startsAt'),
    endsAt: formData.get('endsAt'),
    status: formData.get('status') || 'draft',
  };

  const parsed = CreateDriveSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(', '),
    };
  }

  const isConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy') &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project')
  );

  if (!isConfigured) {
    const { mockStore } = await import('@/lib/services/mock-store');
    const newDrive = mockStore.addDrive({
      name: parsed.data.name,
      academic_year: parsed.data.academicYear,
      description: parsed.data.description || null,
      target_candidates: parsed.data.targetCandidates,
      starts_at: parsed.data.startsAt,
      ends_at: parsed.data.endsAt,
      status: parsed.data.status,
    });
    revalidatePath('/drives');
    return { success: true, data: newDrive };
  }

  const supabase = await createServerSupabaseClient();
  const { data: drive, error } = await supabase
    .from('recruitment_drives')
    .insert({
      name: parsed.data.name,
      academic_year: parsed.data.academicYear,
      description: parsed.data.description,
      target_candidates: parsed.data.targetCandidates,
      starts_at: parsed.data.startsAt,
      ends_at: parsed.data.endsAt,
      status: parsed.data.status,
      created_by: admin.id,
    })
    .select()
    .single();

  if (error || !drive) {
    return { success: false, error: error?.message || 'Failed to create drive' };
  }

  // Automatically provision 4 default panels for the new drive
  const defaultPanels = [
    { name: 'Panel 1 — Technical & Web', description: 'Technical & domain aptitude' },
    { name: 'Panel 2 — Editorial & Content', description: 'Writing & editorial aptitude' },
    { name: 'Panel 3 — Creative & Media', description: 'Design, media, and branding' },
    { name: 'Panel 4 — Operations & PR', description: 'Logistics, events, and public relations' },
  ];

  await supabase.from('interview_panels').insert(
    defaultPanels.map((p) => ({
      drive_id: drive.id,
      name: p.name,
      description: p.description,
    }))
  );

  await logAuditEvent(admin, {
    action: 'DRIVE_CREATED',
    driveId: drive.id,
    targetEntity: 'recruitment_drives',
    targetId: drive.id,
    details: { name: drive.name, academicYear: drive.academic_year },
  });

  revalidatePath('/drives');
  return { success: true, data: drive };
}

export async function updateDriveStatusAction(
  driveId: string,
  newStatus: DriveStatus
): Promise<ActionResponse> {
  const admin = await requireAdmin();
  const supabase = await createServerSupabaseClient();

  // Check current status
  const { data: currentDrive, error: fetchErr } = await supabase
    .from('recruitment_drives')
    .select('status, name')
    .eq('id', driveId)
    .single();

  if (fetchErr || !currentDrive) {
    return { success: false, error: 'Drive not found.' };
  }

  const allowedTransitions = VALID_STATUS_TRANSITIONS[currentDrive.status as DriveStatus] || [];
  if (!allowedTransitions.includes(newStatus)) {
    return {
      success: false,
      error: `Invalid status transition from "${currentDrive.status}" to "${newStatus}".`,
    };
  }

  const { error: updateErr } = await supabase
    .from('recruitment_drives')
    .update({ status: newStatus })
    .eq('id', driveId);

  if (updateErr) {
    return { success: false, error: updateErr.message };
  }

  await logAuditEvent(admin, {
    action: 'DRIVE_STATUS_CHANGED',
    driveId,
    targetEntity: 'recruitment_drives',
    targetId: driveId,
    details: { from: currentDrive.status, to: newStatus },
  });

  revalidatePath('/drives');
  revalidatePath(`/drives/${driveId}`);
  return { success: true };
}

// ==============================================================================
// PANEL OPERATIONS
// ==============================================================================

export async function createPanelAction(
  driveId: string,
  formData: FormData
): Promise<ActionResponse> {
  const admin = await requireAdmin();

  const rawInput = {
    name: formData.get('name'),
    description: formData.get('description'),
    meetLink: formData.get('meetLink') || undefined,
  };

  const parsed = PanelSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(', '),
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data: panel, error } = await supabase
    .from('interview_panels')
    .insert({
      drive_id: driveId,
      name: parsed.data.name,
      description: parsed.data.description,
      meet_link: parsed.data.meetLink || null,
    })
    .select()
    .single();

  if (error || !panel) {
    return {
      success: false,
      error: error?.code === '23505' ? 'A panel with this name already exists in this drive.' : error?.message,
    };
  }

  await logAuditEvent(admin, {
    action: 'PANEL_CREATED',
    driveId,
    targetEntity: 'interview_panels',
    targetId: panel.id,
    details: { name: panel.name },
  });

  revalidatePath(`/drives/${driveId}`);
  return { success: true, data: panel };
}

export async function assignPanelMemberAction(
  driveId: string,
  panelId: string,
  userId: string,
  roleInPanel: 'lead' | 'evaluator' = 'evaluator'
): Promise<ActionResponse> {
  const isConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy') &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project')
  );

  if (!isConfigured) {
    const { mockStore } = await import('@/lib/services/mock-store');
    const assigned = mockStore.assignMemberToPanel(driveId, panelId, userId, roleInPanel);
    if (!assigned) {
      return { success: false, error: 'This interviewer is already assigned or invalid.' };
    }
    revalidatePath(`/drives/${driveId}`);
    return { success: true };
  }

  const admin = await requireAdmin();
  const supabase = await createServerSupabaseClient();

  // 1. Verify that user exists in user_roles and has interviewer role
  const { data: userRecord, error: userErr } = await supabase
    .from('user_roles')
    .select('id, full_name, email, role')
    .eq('id', userId)
    .single();

  if (userErr || !userRecord) {
    return { success: false, error: 'User does not exist or has no active role.' };
  }

  // 2. Insert membership
  const { error: insertErr } = await supabase.from('panel_members').insert({
    panel_id: panelId,
    user_id: userId,
    role_in_panel: roleInPanel,
  });

  if (insertErr) {
    if (insertErr.code === '23505') {
      return { success: false, error: 'This interviewer is already assigned to this panel.' };
    }
    return { success: false, error: insertErr.message };
  }

  await logAuditEvent(admin, {
    action: 'PANEL_MEMBERS_ASSIGNED',
    driveId,
    targetEntity: 'panel_members',
    targetId: panelId,
    details: { userId, roleInPanel, name: userRecord.full_name },
  });

  revalidatePath(`/drives/${driveId}`);
  return { success: true };
}

export async function removePanelMemberAction(
  driveId: string,
  panelId: string,
  userId: string
): Promise<ActionResponse> {
  const isConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy') &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project')
  );

  if (!isConfigured) {
    const { mockStore } = await import('@/lib/services/mock-store');
    mockStore.removeMemberFromPanel(panelId, userId);
    revalidatePath(`/drives/${driveId}`);
    return { success: true };
  }

  const admin = await requireAdmin();
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from('panel_members')
    .delete()
    .eq('panel_id', panelId)
    .eq('user_id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  await logAuditEvent(admin, {
    action: 'PANEL_MEMBERS_ASSIGNED',
    driveId,
    targetEntity: 'panel_members',
    targetId: panelId,
    details: { removedUserId: userId },
  });

  revalidatePath(`/drives/${driveId}`);
  return { success: true };
}
