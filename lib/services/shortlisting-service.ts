import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin, isSupabaseConfigured } from '@/lib/auth/guards';

export interface ShortlistedCandidateItem {
  candidateId: string;
  fullName: string;
  enrollmentNo: string;
  email: string;
  phone: string | null;
  branch: string;
  yearOfStudy: string;
  status: 'applied' | 'scheduled' | 'interviewed' | 'selected' | 'waitlisted' | 'rejected';
  panelName: string;
  scorecardCount: number;
  averageScore: number;
  communicationAvg: number;
  motivationAvg: number;
  domainKnowledgeAvg: number;
  teamworkAvg: number;
  evaluatorRecommendations: string[];
}

export interface ShortlistingDashboardData {
  drives: Array<{ id: string; name: string }>;
  selectedDriveId: string;
  candidates: ShortlistedCandidateItem[];
  stats: {
    totalInterviewed: number;
    selectedCount: number;
    waitlistedCount: number;
    rejectedCount: number;
    averageDriveScore: number;
  };
}

export async function getShortlistingWorkspace(driveId?: string): Promise<ShortlistingDashboardData> {
  await requireAdmin();

  if (!isSupabaseConfigured()) {
    const demoCandidates: ShortlistedCandidateItem[] = [
      {
        candidateId: 'c0000000-0000-0000-0000-000000000001',
        fullName: 'Aarav Sharma',
        enrollmentNo: '24TIT001',
        email: 'aarav.sharma@tit.edu.in',
        phone: '+91 98765 43210',
        branch: 'Computer Science',
        yearOfStudy: '1st Year',
        status: 'selected',
        panelName: 'Panel 1 — Technical & Web',
        scorecardCount: 2,
        averageScore: 4.8,
        communicationAvg: 4.5,
        motivationAvg: 5.0,
        domainKnowledgeAvg: 5.0,
        teamworkAvg: 4.5,
        evaluatorRecommendations: ['strongly_recommend', 'strongly_recommend'],
      },
      {
        candidateId: 'c0000000-0000-0000-0000-000000000002',
        fullName: 'Priya Verma',
        enrollmentNo: '24TIT015',
        email: 'priya.verma@tit.edu.in',
        phone: '+91 98765 43211',
        branch: 'Textile Technology',
        yearOfStudy: '1st Year',
        status: 'selected',
        panelName: 'Panel 2 — Editorial & Media',
        scorecardCount: 2,
        averageScore: 4.5,
        communicationAvg: 4.5,
        motivationAvg: 4.5,
        domainKnowledgeAvg: 4.0,
        teamworkAvg: 5.0,
        evaluatorRecommendations: ['recommend', 'strongly_recommend'],
      },
      {
        candidateId: 'c0000000-0000-0000-0000-000000000003',
        fullName: 'Ananya Deshmukh',
        enrollmentNo: '24TIT067',
        email: 'ananya.deshmukh@tit.edu.in',
        phone: '+91 98765 43212',
        branch: 'Mechanical Engineering',
        yearOfStudy: '1st Year',
        status: 'waitlisted',
        panelName: 'Panel 3 — Design & Creativity',
        scorecardCount: 2,
        averageScore: 4.15,
        communicationAvg: 4.0,
        motivationAvg: 4.5,
        domainKnowledgeAvg: 4.0,
        teamworkAvg: 4.0,
        evaluatorRecommendations: ['recommend', 'neutral'],
      },
    ];

    return {
      drives: [{ id: 'd0000000-0000-0000-0000-000000000001', name: 'Rotaract Induction Drive 2026-27' }],
      selectedDriveId: 'd0000000-0000-0000-0000-000000000001',
      candidates: demoCandidates,
      stats: {
        totalInterviewed: demoCandidates.length,
        selectedCount: 2,
        waitlistedCount: 1,
        rejectedCount: 0,
        averageDriveScore: 4.48,
      },
    };
  }

  const supabase = await createServerSupabaseClient();

  // 1. Fetch drives
  const { data: drives } = await supabase
    .from('recruitment_drives')
    .select('id, name')
    .order('created_at', { ascending: false });

  const activeDriveId = driveId || drives?.[0]?.id || '';

  if (!activeDriveId) {
    return {
      drives: [],
      selectedDriveId: '',
      candidates: [],
      stats: { totalInterviewed: 0, selectedCount: 0, waitlistedCount: 0, rejectedCount: 0, averageDriveScore: 0 },
    };
  }

  // 2. Fetch candidates with assignments, panels, and scorecards for active drive
  const { data: rawCandidates } = await supabase
    .from('candidates')
    .select(`
      id,
      full_name,
      enrollment_no,
      email,
      phone,
      branch,
      year_of_study,
      status,
      interview_assignments (
        id,
        interview_slots (
          interview_panels (
            name
          )
        ),
        scorecards (
          communication_score,
          motivation_score,
          domain_knowledge_score,
          teamwork_score,
          overall_score,
          internal_notes
        )
      )
    `)
    .eq('drive_id', activeDriveId);

  let totalScoreSum = 0;
  let totalScorecardCount = 0;
  let selectedCount = 0;
  let waitlistedCount = 0;
  let rejectedCount = 0;
  let interviewedCount = 0;

  const candidateItems: ShortlistedCandidateItem[] = (rawCandidates || []).map((cand: any) => {
    const assignment = cand.interview_assignments?.[0];
    const panelName = assignment?.interview_slots?.interview_panels?.name || 'Unassigned';
    const scorecards: any[] = assignment?.scorecards || [];

    const scCount = scorecards.length;
    let avg = 0;
    let commAvg = 0;
    let motAvg = 0;
    let domAvg = 0;
    let teamAvg = 0;

    if (scCount > 0) {
      const commTotal = scorecards.reduce((acc, s) => acc + (s.communication_score || 0), 0);
      const motTotal = scorecards.reduce((acc, s) => acc + (s.motivation_score || 0), 0);
      const domTotal = scorecards.reduce((acc, s) => acc + (s.domain_knowledge_score || 0), 0);
      const teamTotal = scorecards.reduce((acc, s) => acc + (s.teamwork_score || 0), 0);
      const overallTotal = scorecards.reduce((acc, s) => acc + (s.overall_score || 0), 0);

      commAvg = Number((commTotal / scCount).toFixed(1));
      motAvg = Number((motTotal / scCount).toFixed(1));
      domAvg = Number((domTotal / scCount).toFixed(1));
      teamAvg = Number((teamTotal / scCount).toFixed(1));

      // Weighted composite formula
      avg = Number(((commAvg * 0.2) + (motAvg * 0.2) + (domAvg * 0.25) + (teamAvg * 0.2) + (overallTotal / scCount * 0.15)).toFixed(2));
      totalScoreSum += avg;
      totalScorecardCount++;
    }

    if (cand.status === 'selected') selectedCount++;
    else if (cand.status === 'waitlisted') waitlistedCount++;
    else if (cand.status === 'rejected') rejectedCount++;
    if (scCount > 0 || cand.status === 'interviewed') interviewedCount++;

    return {
      candidateId: cand.id,
      fullName: cand.full_name,
      enrollmentNo: cand.enrollment_no,
      email: cand.email,
      phone: cand.phone,
      branch: cand.branch,
      yearOfStudy: cand.year_of_study,
      status: cand.status,
      panelName,
      scorecardCount: scCount,
      averageScore: avg,
      communicationAvg: commAvg,
      motivationAvg: motAvg,
      domainKnowledgeAvg: domAvg,
      teamworkAvg: teamAvg,
      evaluatorRecommendations: scorecards.map((s) => s.internal_notes ? 'Has comments' : 'No notes'),
    };
  });

  return {
    drives: drives || [],
    selectedDriveId: activeDriveId,
    candidates: candidateItems.sort((a, b) => b.averageScore - a.averageScore),
    stats: {
      totalInterviewed: interviewedCount,
      selectedCount,
      waitlistedCount,
      rejectedCount,
      averageDriveScore: totalScorecardCount > 0 ? Number((totalScoreSum / totalScorecardCount).toFixed(2)) : 0,
    },
  };
}
