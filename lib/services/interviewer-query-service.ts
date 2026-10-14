import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireInterviewer, isSupabaseConfigured } from '@/lib/auth/guards';
import { formatToIST } from '@/lib/crypto/tokens';

export interface EvaluatorAssignmentItem {
  assignmentId: string;
  driveId: string;
  driveName: string;
  panelId: string;
  panelName: string;
  meetLink: string | null;
  candidateId: string;
  candidateName: string;
  enrollmentNo: string;
  branch: string;
  yearOfStudy: string;
  slotFormatted: string;
  scorecardStatus: 'pending' | 'submitted';
  overallScore?: number;
}

export interface InterviewerDashboardData {
  interviewerName: string;
  interviewerEmail: string;
  assignedPanels: Array<{
    id: string;
    name: string;
    meetLink: string | null;
    totalSlots: number;
  }>;
  assignments: EvaluatorAssignmentItem[];
  stats: {
    totalAssigned: number;
    completedScorecards: number;
    pendingScorecards: number;
  };
}

/**
 * Queries candidates and slots assigned to the current interviewer.
 */
export async function getInterviewerWorkspace(): Promise<InterviewerDashboardData> {
  const user = await requireInterviewer();

  // If local unconfigured demo mode, return structured mock data
  if (!isSupabaseConfigured()) {
    return {
      interviewerName: user.fullName,
      interviewerEmail: user.email,
      assignedPanels: [
        {
          id: 'p0000000-0000-0000-0000-000000000001',
          name: 'Panel 1 — Technical & Web',
          meetLink: 'https://meet.google.com/rx-tech-demo',
          totalSlots: 23,
        },
      ],
      assignments: [
        {
          assignmentId: 'a0000000-0000-0000-0000-000000000001',
          driveId: 'd0000000-0000-0000-0000-000000000001',
          driveName: 'Rotaract Induction Drive 2026-27',
          panelId: 'p0000000-0000-0000-0000-000000000001',
          panelName: 'Panel 1 — Technical & Web',
          meetLink: 'https://meet.google.com/rx-tech-demo',
          candidateId: 'c0000000-0000-0000-0000-000000000001',
          candidateName: 'Aarav Sharma',
          enrollmentNo: '24TIT001',
          branch: 'Computer Science',
          yearOfStudy: '1st Year',
          slotFormatted: '20 Oct 2026, 10:00 AM – 10:05 AM',
          scorecardStatus: 'pending',
        },
        {
          assignmentId: 'a0000000-0000-0000-0000-000000000002',
          driveId: 'd0000000-0000-0000-0000-000000000001',
          driveName: 'Rotaract Induction Drive 2026-27',
          panelId: 'p0000000-0000-0000-0000-000000000001',
          panelName: 'Panel 1 — Technical & Web',
          meetLink: 'https://meet.google.com/rx-tech-demo',
          candidateId: 'c0000000-0000-0000-0000-000000000002',
          candidateName: 'Priya Verma',
          enrollmentNo: '24TIT015',
          branch: 'Textile Technology',
          yearOfStudy: '1st Year',
          slotFormatted: '20 Oct 2026, 10:05 AM – 10:10 AM',
          scorecardStatus: 'submitted',
          overallScore: 4,
        },
      ],
      stats: {
        totalAssigned: 2,
        completedScorecards: 1,
        pendingScorecards: 1,
      },
    };
  }

  const supabase = await createServerSupabaseClient();

  // 1. Fetch panels where user is a member (or all if admin)
  let panelsQuery = supabase
    .from('interview_panels')
    .select(`
      id,
      name,
      meet_link,
      panel_members (
        user_id
      )
    `);

  if (user.role !== 'admin') {
    panelsQuery = panelsQuery.eq('panel_members.user_id', user.id);
  }

  const { data: panelsData } = await panelsQuery;
  const panelIds = (panelsData || []).map((p: any) => p.id);

  if (panelIds.length === 0) {
    return {
      interviewerName: user.fullName,
      interviewerEmail: user.email,
      assignedPanels: [],
      assignments: [],
      stats: { totalAssigned: 0, completedScorecards: 0, pendingScorecards: 0 },
    };
  }

  // 2. Fetch assignments belonging to those panels
  const { data: assignmentsData } = await supabase
    .from('interview_assignments')
    .select(`
      id,
      drive_id,
      recruitment_drives (
        name
      ),
      candidates (
        id,
        full_name,
        enrollment_no,
        branch,
        year_of_study
      ),
      interview_slots (
        panel_id,
        starts_at,
        ends_at,
        interview_panels (
          id,
          name,
          meet_link
        )
      ),
      scorecards (
        id,
        interviewer_id,
        overall_score
      )
    `)
    .in('interview_slots.panel_id', panelIds)
    .order('created_at', { ascending: true });

  let completedScorecards = 0;

  const assignments: EvaluatorAssignmentItem[] = (assignmentsData || []).map((a: any) => {
    const slot = a.interview_slots;
    const panel = slot?.interview_panels;
    const cand = a.candidates;
    const scorecard = (a.scorecards || []).find((s: any) => s.interviewer_id === user.id);

    const isSubmitted = Boolean(scorecard);
    if (isSubmitted) completedScorecards++;

    return {
      assignmentId: a.id,
      driveId: a.drive_id,
      driveName: a.recruitment_drives?.name || 'Recruitment Drive',
      panelId: panel?.id || '',
      panelName: panel?.name || 'Panel',
      meetLink: panel?.meet_link || null,
      candidateId: cand?.id || '',
      candidateName: cand?.full_name || 'Candidate',
      enrollmentNo: cand?.enrollment_no || '—',
      branch: cand?.branch || 'General',
      yearOfStudy: cand?.year_of_study || '1st Year',
      slotFormatted: slot?.starts_at ? formatToIST(slot.starts_at) : 'TBD',
      scorecardStatus: isSubmitted ? 'submitted' : 'pending',
      overallScore: scorecard?.overall_score,
    };
  });

  const assignedPanels = (panelsData || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    meetLink: p.meet_link,
    totalSlots: assignments.filter((a) => a.panelId === p.id).length,
  }));

  return {
    interviewerName: user.fullName,
    interviewerEmail: user.email,
    assignedPanels,
    assignments,
    stats: {
      totalAssigned: assignments.length,
      completedScorecards,
      pendingScorecards: Math.max(0, assignments.length - completedScorecards),
    },
  };
}

/**
 * Fetches single assignment details for the evaluation form.
 */
export async function getAssignmentForEvaluation(assignmentId: string) {
  const user = await requireInterviewer();

  if (!isSupabaseConfigured()) {
    return {
      assignmentId,
      candidateName: 'Aarav Sharma',
      enrollmentNo: '24TIT001',
      branch: 'Computer Science',
      yearOfStudy: '1st Year',
      driveName: 'Rotaract Induction Drive 2026-27',
      panelName: 'Panel 1 — Technical & Web',
      meetLink: 'https://meet.google.com/rx-tech-demo',
      slotFormatted: '20 Oct 2026, 10:00 AM – 10:05 AM',
      existingScorecard: null,
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data: assignment, error } = await supabase
    .from('interview_assignments')
    .select(`
      id,
      drive_id,
      recruitment_drives (
        name
      ),
      candidates (
        id,
        full_name,
        enrollment_no,
        branch,
        year_of_study
      ),
      interview_slots (
        panel_id,
        starts_at,
        interview_panels (
          name,
          meet_link
        )
      ),
      scorecards (
        id,
        interviewer_id,
        communication_score,
        motivation_score,
        domain_knowledge_score,
        teamwork_score,
        overall_score,
        internal_notes
      )
    `)
    .eq('id', assignmentId)
    .single();

  if (error || !assignment) {
    return null;
  }

  const cand = assignment.candidates as any;
  const slot = assignment.interview_slots as any;
  const existingScorecard = (assignment.scorecards as any[])?.find(
    (s: any) => s.interviewer_id === user.id
  );

  return {
    assignmentId: assignment.id,
    candidateName: cand?.full_name || 'Candidate',
    enrollmentNo: cand?.enrollment_no || '—',
    branch: cand?.branch || 'General',
    yearOfStudy: cand?.year_of_study || '1st Year',
    driveName: (assignment.recruitment_drives as any)?.name || 'Recruitment Drive',
    panelName: slot?.interview_panels?.name || 'Interview Panel',
    meetLink: slot?.interview_panels?.meet_link || null,
    slotFormatted: slot?.starts_at ? formatToIST(slot.starts_at) : 'TBD',
    existingScorecard,
  };
}
