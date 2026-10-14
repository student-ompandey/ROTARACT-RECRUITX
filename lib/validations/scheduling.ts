import { z } from 'zod';

export const SlotGenerationConfigSchema = z
  .object({
    driveId: z.string().uuid('Invalid drive ID'),
    interviewDate: z.string().min(10, 'Interview date is required (YYYY-MM-DD)'),
    startTime: z.string().min(4, 'Start time is required (HH:MM)'), // e.g. "10:00"
    endTime: z.string().min(4, 'End time is required (HH:MM)'),     // e.g. "12:00"
    slotDurationMinutes: z.coerce.number().int().min(3).max(60).default(5),
    bufferMinutes: z.coerce.number().int().min(0).max(30).default(0),
    panelIds: z.array(z.string().uuid()).min(1, 'At least one panel must be selected'),
  })
  .refine(
    (data) => {
      const [startH, startM] = data.startTime.split(':').map(Number);
      const [endH, endM] = data.endTime.split(':').map(Number);
      return endH * 60 + endM > startH * 60 + startM;
    },
    {
      message: 'End time must be later than start time',
      path: ['endTime'],
    }
  );

export type SlotGenerationConfig = z.infer<typeof SlotGenerationConfigSchema>;

export interface GeneratedSlotPreview {
  slotId?: string;
  panelId: string;
  panelName: string;
  meetLink?: string | null;
  startsAt: string; // ISO string
  endsAt: string;   // ISO string
  startsAtFormatted: string;
  endsAtFormatted: string;
  assignedCandidateId?: string;
  assignedCandidateName?: string;
  assignedCandidateEnrollment?: string;
}

export interface CapacityCalculationResult {
  totalCandidates: number;
  selectedPanelsCount: number;
  slotDurationMinutes: number;
  bufferMinutes: number;
  totalWindowMinutes: number;
  slotsPerPanel: number;
  totalSlotsCapacity: number;
  fitsInWindow: boolean;
  surplusOrDeficit: number; // positive = surplus capacity, negative = deficit candidates
}
