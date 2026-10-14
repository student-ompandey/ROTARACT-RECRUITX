import { z } from 'zod';

export const DriveStatusSchema = z.enum(['draft', 'ready', 'scheduled', 'completed', 'archived']);
export type DriveStatus = z.infer<typeof DriveStatusSchema>;

const BaseDriveSchema = z.object({
  name: z.string().min(3, 'Drive name must be at least 3 characters').max(100),
  academicYear: z.string().min(4, 'e.g. 2026-27').max(20),
  description: z.string().optional(),
  targetCandidates: z.coerce.number().int().positive().default(92),
  slotDurationMinutes: z.coerce.number().int().min(5).max(120).default(15),
  timezone: z.string().default('Asia/Kolkata'),
  startsAt: z.string().min(1, 'Interview start time is required'),
  endsAt: z.string().min(1, 'Interview end time is required'),
  status: DriveStatusSchema.default('draft'),
});

export const CreateDriveSchema = BaseDriveSchema.refine(
  (data) => new Date(data.endsAt).getTime() > new Date(data.startsAt).getTime(),
  {
    message: 'Interview end time must be after start time',
    path: ['endsAt'],
  }
);

export type CreateDriveInput = z.infer<typeof CreateDriveSchema>;

export const UpdateDriveSchema = BaseDriveSchema.partial();
export type UpdateDriveInput = z.infer<typeof UpdateDriveSchema>;

export const PanelSchema = z.object({
  name: z.string().min(2, 'Panel name must be at least 2 characters').max(60),
  description: z.string().optional(),
  meetLink: z
    .string()
    .url('Must be a valid URL (e.g. https://meet.google.com/...)')
    .optional()
    .or(z.literal('')),
});

export type PanelInput = z.infer<typeof PanelSchema>;

export const AssignPanelMemberSchema = z.object({
  panelId: z.string().uuid(),
  userId: z.string().uuid(),
  roleInPanel: z.enum(['lead', 'evaluator']).default('evaluator'),
});

export type AssignPanelMemberInput = z.infer<typeof AssignPanelMemberSchema>;
