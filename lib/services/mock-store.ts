/**
 * In-Memory Mock Store for offline local testing when Supabase is not connected.
 * Keeps drives, panels, students (candidates), interviewers, slots, and scorecards synchronized.
 */

export interface InMemoryDrive {
  id: string;
  name: string;
  academic_year: string;
  description: string | null;
  target_candidates: number;
  interview_date: string; // ISO date YYYY-MM-DD
  starts_at: string;
  ends_at: string;
  status: string;
  created_at: string;
}

export interface InMemoryPanel {
  id: string;
  drive_id: string;
  name: string;
  description: string | null;
  meet_link: string | null;
  members: Array<{
    userId: string;
    fullName: string;
    email: string;
    roleInPanel: 'lead' | 'evaluator';
  }>;
}

export interface InMemoryCandidate {
  id: string;
  drive_id: string;
  enrollment_no: string;
  full_name: string;
  email: string;
  phone: string | null;
  branch: string;
  year_of_study: string;
  interviewer_name?: string | null;
  interview_link?: string | null;
  status: 'applied' | 'scheduled' | 'interviewed' | 'selected' | 'waitlisted' | 'rejected';
  assigned_panel_id?: string;
  slot_starts_at?: string;
  slot_ends_at?: string;
  created_at: string;
}

export interface InMemoryInterviewer {
  id: string;
  full_name: string;
  email: string;
  role: 'interviewer' | 'admin';
}

export interface InMemoryScorecard {
  id: string;
  assignment_id: string;
  interviewer_id: string;
  interviewer_name: string;
  communication_score: number;
  motivation_score: number;
  domain_knowledge_score: number;
  teamwork_score: number;
  overall_score: number;
  internal_notes?: string;
  recommendation: 'strongly_recommend' | 'recommend' | 'neutral' | 'do_not_recommend';
  submitted_at: string;
}

// Consistent recruitment date in Asia/Kolkata
const DEFAULT_DRIVE_DATE = '2026-10-16';
const DEFAULT_START_TIME = `${DEFAULT_DRIVE_DATE}T10:00:00+05:30`;
const DEFAULT_END_TIME = `${DEFAULT_DRIVE_DATE}T12:00:00+05:30`;

class MockDataStore {
  // Pre-configured interviewers for the club
  interviewers: InMemoryInterviewer[] = [
    { id: 'usr-int-001', full_name: 'Aayush Batra', email: 'aayush.batra@tit.edu.in', role: 'interviewer' },
    { id: 'usr-int-002', full_name: 'Simran Kaur', email: 'simran.kaur@tit.edu.in', role: 'interviewer' },
    { id: 'usr-int-003', full_name: 'Rohit Aggarwal', email: 'rohit.aggarwal@tit.edu.in', role: 'interviewer' },
    { id: 'usr-int-004', full_name: 'Kavya Soni', email: 'kavya.soni@tit.edu.in', role: 'interviewer' },
    { id: 'usr-int-005', full_name: 'Manish Chawla', email: 'manish.chawla@tit.edu.in', role: 'interviewer' },
    { id: 'usr-int-006', full_name: 'Deepak Yadav', email: 'deepak.yadav@tit.edu.in', role: 'interviewer' },
    { id: 'usr-int-007', full_name: 'Tanvi Mehra', email: 'tanvi.mehra@tit.edu.in', role: 'interviewer' },
    { id: 'usr-int-008', full_name: 'Harshit Vashisht', email: 'harshit.vashisht@tit.edu.in', role: 'interviewer' },
  ];

  drives: InMemoryDrive[] = [
    {
      id: 'd0000000-0000-0000-0000-000000000001',
      name: 'Rotaract Induction Drive 2026-27',
      academic_year: '2026-27',
      description: 'Annual core induction for technical, editorial, creative, and operational wings.',
      target_candidates: 92,
      interview_date: DEFAULT_DRIVE_DATE,
      starts_at: DEFAULT_START_TIME,
      ends_at: DEFAULT_END_TIME,
      status: 'scheduled',
      created_at: new Date().toISOString(),
    },
  ];

  panels: InMemoryPanel[] = [
    {
      id: 'p0000000-0000-0000-0000-000000000001',
      drive_id: 'd0000000-0000-0000-0000-000000000001',
      name: 'Panel 1 — Technical & Web',
      description: 'Technical, coding & web aptitude evaluation',
      meet_link: 'https://meet.google.com/rx-tech-demo',
      members: [
        { userId: 'usr-int-001', fullName: 'Aayush Batra', email: 'aayush.batra@tit.edu.in', roleInPanel: 'lead' },
        { userId: 'usr-int-002', fullName: 'Simran Kaur', email: 'simran.kaur@tit.edu.in', roleInPanel: 'evaluator' },
      ],
    },
    {
      id: 'p0000000-0000-0000-0000-000000000002',
      drive_id: 'd0000000-0000-0000-0000-000000000001',
      name: 'Panel 2 — Editorial & Content',
      description: 'Writing, articulation & editorial aptitude',
      meet_link: 'https://meet.google.com/rx-edit-demo',
      members: [
        { userId: 'usr-int-003', fullName: 'Rohit Aggarwal', email: 'rohit.aggarwal@tit.edu.in', roleInPanel: 'lead' },
        { userId: 'usr-int-004', fullName: 'Kavya Soni', email: 'kavya.soni@tit.edu.in', roleInPanel: 'evaluator' },
      ],
    },
    {
      id: 'p0000000-0000-0000-0000-000000000003',
      drive_id: 'd0000000-0000-0000-0000-000000000001',
      name: 'Panel 3 — Creative & Media',
      description: 'Design, media, video & branding aptitude',
      meet_link: 'https://meet.google.com/rx-media-demo',
      members: [
        { userId: 'usr-int-005', fullName: 'Manish Chawla', email: 'manish.chawla@tit.edu.in', roleInPanel: 'lead' },
        { userId: 'usr-int-006', fullName: 'Deepak Yadav', email: 'deepak.yadav@tit.edu.in', roleInPanel: 'evaluator' },
      ],
    },
    {
      id: 'p0000000-0000-0000-0000-000000000004',
      drive_id: 'd0000000-0000-0000-0000-000000000001',
      name: 'Panel 4 — Operations & PR',
      description: 'Event operations, logistics & public relations',
      meet_link: 'https://meet.google.com/rx-ops-demo',
      members: [
        { userId: 'usr-int-007', fullName: 'Tanvi Mehra', email: 'tanvi.mehra@tit.edu.in', roleInPanel: 'lead' },
        { userId: 'usr-int-008', fullName: 'Harshit Vashisht', email: 'harshit.vashisht@tit.edu.in', roleInPanel: 'evaluator' },
      ],
    },
  ];

  candidates: InMemoryCandidate[] = [
    {
      id: 'c0000000-0000-0000-0000-000000000001',
      drive_id: 'd0000000-0000-0000-0000-000000000001',
      enrollment_no: '24TIT001',
      full_name: 'Aarav Sharma',
      email: 'aarav.sharma@tit.edu.in',
      phone: '+91 98765 43210',
      branch: 'Computer Science',
      year_of_study: '1st Year',
      status: 'scheduled',
      assigned_panel_id: 'p0000000-0000-0000-0000-000000000001',
      slot_starts_at: `${DEFAULT_DRIVE_DATE}T10:00:00+05:30`,
      slot_ends_at: `${DEFAULT_DRIVE_DATE}T10:05:00+05:30`,
      created_at: new Date().toISOString(),
    },
    {
      id: 'c0000000-0000-0000-0000-000000000002',
      drive_id: 'd0000000-0000-0000-0000-000000000001',
      enrollment_no: '24TIT015',
      full_name: 'Priya Verma',
      email: 'priya.verma@tit.edu.in',
      phone: '+91 98765 43211',
      branch: 'Textile Technology',
      year_of_study: '1st Year',
      status: 'interviewed',
      assigned_panel_id: 'p0000000-0000-0000-0000-000000000001',
      slot_starts_at: `${DEFAULT_DRIVE_DATE}T10:05:00+05:30`,
      slot_ends_at: `${DEFAULT_DRIVE_DATE}T10:10:00+05:30`,
      created_at: new Date().toISOString(),
    },
    {
      id: 'c0000000-0000-0000-0000-000000000003',
      drive_id: 'd0000000-0000-0000-0000-000000000001',
      enrollment_no: '24TIT067',
      full_name: 'Ananya Deshmukh',
      email: 'ananya.deshmukh@tit.edu.in',
      phone: '+91 98765 43212',
      branch: 'Mechanical Engineering',
      year_of_study: '1st Year',
      status: 'scheduled',
      assigned_panel_id: 'p0000000-0000-0000-0000-000000000002',
      slot_starts_at: `${DEFAULT_DRIVE_DATE}T10:00:00+05:30`,
      slot_ends_at: `${DEFAULT_DRIVE_DATE}T10:05:00+05:30`,
      created_at: new Date().toISOString(),
    },
  ];

  scorecards: InMemoryScorecard[] = [
    {
      id: 'sc-001',
      assignment_id: 'a0000000-0000-0000-0000-000000000002',
      interviewer_id: 'usr-int-001',
      interviewer_name: 'Aayush Batra',
      communication_score: 5,
      motivation_score: 4,
      domain_knowledge_score: 4,
      teamwork_score: 5,
      overall_score: 5,
      internal_notes: 'Highly articulate, strong community leadership motivation.',
      recommendation: 'strongly_recommend',
      submitted_at: new Date().toISOString(),
    },
  ];

  // Helper Methods
  addDrive(drive: Omit<InMemoryDrive, 'id' | 'created_at' | 'interview_date'>) {
    const driveDate = drive.starts_at ? drive.starts_at.slice(0, 10) : DEFAULT_DRIVE_DATE;
    const newDrive: InMemoryDrive = {
      ...drive,
      id: `d_mock_${Date.now()}`,
      interview_date: driveDate,
      created_at: new Date().toISOString(),
    };
    this.drives.unshift(newDrive);

    // Default 4 panels
    const defaultPanels = [
      { name: 'Panel 1 — Technical & Web', description: 'Technical & domain aptitude' },
      { name: 'Panel 2 — Editorial & Content', description: 'Writing & editorial aptitude' },
      { name: 'Panel 3 — Creative & Media', description: 'Design, media, and branding' },
      { name: 'Panel 4 — Operations & PR', description: 'Logistics, events, and public relations' },
    ];

    defaultPanels.forEach((p, idx) => {
      this.panels.push({
        id: `p_mock_${Date.now()}_${idx}`,
        drive_id: newDrive.id,
        name: p.name,
        description: p.description,
        meet_link: `https://meet.google.com/demo-p${idx + 1}`,
        members: [],
      });
    });

    return newDrive;
  }

  assignMemberToPanel(driveId: string, panelId: string, userId: string, roleInPanel: 'lead' | 'evaluator') {
    const panel = this.panels.find((p) => p.id === panelId);
    const interviewer = this.interviewers.find((i) => i.id === userId);
    if (!panel || !interviewer) return false;

    // Check duplicate
    if (panel.members.some((m) => m.userId === userId)) return false;

    panel.members.push({
      userId: interviewer.id,
      fullName: interviewer.full_name,
      email: interviewer.email,
      roleInPanel,
    });
    return true;
  }

  removeMemberFromPanel(panelId: string, userId: string) {
    const panel = this.panels.find((p) => p.id === panelId);
    if (!panel) return false;
    panel.members = panel.members.filter((m) => m.userId !== userId);
    return true;
  }

  importCandidates(driveId: string, rows: Array<Omit<InMemoryCandidate, 'id' | 'drive_id' | 'created_at' | 'status'>>, duplicateAction: 'skip' | 'update') {
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const r of rows) {
      const existing = this.candidates.find(
        (c) => c.drive_id === driveId && c.enrollment_no.toUpperCase() === r.enrollment_no.toUpperCase()
      );

      if (existing) {
        if (duplicateAction === 'skip') {
          skipped++;
        } else {
          existing.full_name = r.full_name;
          existing.email = r.email;
          existing.branch = r.branch;
          existing.year_of_study = r.year_of_study;
          existing.phone = r.phone;
          existing.interviewer_name = r.interviewer_name || existing.interviewer_name || null;
          existing.interview_link = r.interview_link || existing.interview_link || null;
          updated++;
        }
      } else {
        this.candidates.push({
          id: `c_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          drive_id: driveId,
          enrollment_no: r.enrollment_no.toUpperCase().trim(),
          full_name: r.full_name.trim(),
          email: r.email.toLowerCase().trim(),
          phone: r.phone || null,
          branch: r.branch || 'General',
          year_of_study: r.year_of_study || '1st Year',
          interviewer_name: r.interviewer_name || null,
          interview_link: r.interview_link || null,
          status: 'applied',
          created_at: new Date().toISOString(),
        });
        created++;
      }
    }

    return { created, updated, skipped };
  }

  updateCandidateStatus(candidateId: string, newStatus: InMemoryCandidate['status']) {
    const c = this.candidates.find((cand) => cand.id === candidateId);
    if (c) {
      c.status = newStatus;
      return true;
    }
    return false;
  }
}

// Global singleton across hot-reloads
const globalForMock = globalThis as unknown as { mockStore?: MockDataStore };
export const mockStore = globalForMock.mockStore || new MockDataStore();
if (process.env.NODE_ENV !== 'production') globalForMock.mockStore = mockStore;
