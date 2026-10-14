import { z } from 'zod';

export const ScorecardSubmissionSchema = z.object({
  assignmentId: z.string().uuid('Invalid interview assignment ID'),
  communicationScore: z.coerce.number().int().min(1, 'Minimum score is 1').max(5, 'Maximum score is 5'),
  motivationScore: z.coerce.number().int().min(1, 'Minimum score is 1').max(5, 'Maximum score is 5'),
  domainKnowledgeScore: z.coerce.number().int().min(1, 'Minimum score is 1').max(5, 'Maximum score is 5'),
  teamworkScore: z.coerce.number().int().min(1, 'Minimum score is 1').max(5, 'Maximum score is 5'),
  overallScore: z.coerce.number().int().min(1, 'Minimum score is 1').max(5, 'Maximum score is 5'),
  criterionComments: z.record(z.string(), z.string()).optional(),
  internalNotes: z.string().max(1000, 'Notes too long').optional(),
  recommendation: z.enum(['strongly_recommend', 'recommend', 'neutral', 'do_not_recommend']).default('recommend'),
  isFinalSubmission: z.boolean().default(false),
});

export type ScorecardSubmissionInput = z.infer<typeof ScorecardSubmissionSchema>;

export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  weight: number; // e.g. 20 for 20%
}

export const DEFAULT_RUBRIC_CRITERIA: RubricCriterion[] = [
  {
    id: 'communicationScore',
    name: 'Communication & Confidence',
    description: 'Clarity of thought, articulation, active listening, and language confidence.',
    weight: 20,
  },
  {
    id: 'motivationScore',
    name: 'Rotaract Spirit & Motivation',
    description: 'Understanding of Rotaract values, commitment, community drive, and enthusiasm.',
    weight: 20,
  },
  {
    id: 'domainKnowledgeScore',
    name: 'Domain & Technical Aptitude',
    description: 'Technical, editorial, design, or managerial problem-solving competence.',
    weight: 25,
  },
  {
    id: 'teamworkScore',
    name: 'Teamwork & Situational Judgment',
    description: 'Interpersonal skills, adaptability, conflict resolution, and peer respect.',
    weight: 20,
  },
  {
    id: 'overallScore',
    name: 'Overall Potential & Role Fit',
    description: 'Holistic assessment of candidate contribution to the 2026-27 core team.',
    weight: 15,
  },
];
