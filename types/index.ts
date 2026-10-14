export type DriveStatus = 'draft' | 'active' | 'closed';

export interface RecruitmentDrive {
  id: string;
  name: string;
  year: number;
  status: DriveStatus;
  targetCount: number;
  candidateCount: number;
  startDate: string;
  endDate?: string;
}

export type CandidateStatus =
  | 'pending'
  | 'scheduled'
  | 'interviewed'
  | 'selected'
  | 'rejected'
  | 'waitlisted';

export interface Candidate {
  id: string;
  driveId: string;
  enrollmentNo: string;
  fullName: string;
  email: string;
  phone?: string;
  branch?: string;
  yearOfStudy?: number;
  status: CandidateStatus;
  interviewSlot?: string;
  panelName?: string;
}

export interface InterviewPanel {
  id: string;
  driveId: string;
  name: string;
  meetLink?: string;
  memberNames: string[];
  slotsCount: number;
}

export interface InterviewSlot {
  id: string;
  driveId: string;
  panelId: string;
  panelName: string;
  startsAt: string;
  durationMins: number;
  capacity: number;
  assignedCandidateName?: string;
}

export interface MetricCardData {
  title: string;
  value: string | number;
  description: string;
  change?: string;
  isPositive?: boolean;
}
