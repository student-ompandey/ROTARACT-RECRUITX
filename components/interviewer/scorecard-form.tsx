'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  CheckCircle2,
  Save,
  Video,
  Clock,
  ExternalLink,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import { DEFAULT_RUBRIC_CRITERIA } from '@/lib/validations/scorecard';
import { submitScorecardAction } from '@/lib/actions/scorecard-actions';

interface ScorecardFormProps {
  assignment: {
    assignmentId: string;
    candidateName: string;
    enrollmentNo: string;
    branch: string;
    yearOfStudy: string;
    driveName: string;
    panelName: string;
    meetLink: string | null;
    slotFormatted: string;
    existingScorecard?: any;
  };
}

export function ScorecardForm({ assignment }: ScorecardFormProps) {
  const router = useRouter();

  const [scores, setScores] = useState<Record<string, number>>({
    communicationScore: assignment.existingScorecard?.communication_score || 3,
    motivationScore: assignment.existingScorecard?.motivation_score || 3,
    domainKnowledgeScore: assignment.existingScorecard?.domain_knowledge_score || 3,
    teamworkScore: assignment.existingScorecard?.teamwork_score || 3,
    overallScore: assignment.existingScorecard?.overall_score || 3,
  });

  const [recommendation, setRecommendation] = useState<string>('recommend');
  const [internalNotes, setInternalNotes] = useState<string>(
    assignment.existingScorecard?.internal_notes || ''
  );
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isAlreadySubmitted = Boolean(assignment.existingScorecard?.submitted_at);

  const handleScoreChange = (criterionId: string, val: number) => {
    setScores((prev) => ({ ...prev, [criterionId]: val }));
  };

  // Weighted composite preview
  const calculatedComposite = (
    (scores.communicationScore * 0.2) +
    (scores.motivationScore * 0.2) +
    (scores.domainKnowledgeScore * 0.25) +
    (scores.teamworkScore * 0.2) +
    (scores.overallScore * 0.15)
  ).toFixed(2);

  const handleSubmit = async (isFinalSubmission: boolean) => {
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await submitScorecardAction({
        assignmentId: assignment.assignmentId,
        communicationScore: scores.communicationScore,
        motivationScore: scores.motivationScore,
        domainKnowledgeScore: scores.domainKnowledgeScore,
        teamworkScore: scores.teamworkScore,
        overallScore: scores.overallScore,
        internalNotes,
        recommendation: recommendation as any,
        isFinalSubmission,
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to submit evaluation.');
        setSubmitting(false);
        return;
      }

      setSuccessMessage(
        isFinalSubmission
          ? 'Final scorecard submitted successfully! Returning to workspace...'
          : 'Evaluation draft saved.'
      );

      if (isFinalSubmission) {
        setTimeout(() => {
          router.push('/interviewer');
          router.refresh();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Navigation Breadcrumb & Back */}
      <div className="flex items-center justify-between">
        <Link
          href="/interviewer"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Interviewer Workspace
        </Link>
        {isAlreadySubmitted && (
          <Badge variant="success" className="text-xs">
            Scorecard Finalized
          </Badge>
        )}
      </div>

      {/* Candidate Profile Header Card */}
      <Card className="bg-slate-900/60 border-slate-800">
        <CardContent className="pt-5 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-blue-400 tracking-wider uppercase">
                {assignment.driveName}
              </span>
              <h1 className="text-xl font-bold text-slate-100">{assignment.candidateName}</h1>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                  {assignment.enrollmentNo}
                </span>
                <span>•</span>
                <span>{assignment.branch}</span>
                <span>•</span>
                <span>{assignment.yearOfStudy}</span>
              </div>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>{assignment.slotFormatted}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="purple">{assignment.panelName}</Badge>
                {assignment.meetLink && (
                  <a
                    href={assignment.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Video className="w-3 h-3" />
                    Open Meet
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {errorMessage && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-300 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Rubric Criteria Evaluation */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Standardized 5-Point Evaluation Rubric</CardTitle>
              <CardDescription className="text-xs">
                Rate each criterion on an objective 1 to 5 scale. Subjective notes can be entered below.
              </CardDescription>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase text-slate-400 tracking-wider block">
                Calculated Composite
              </span>
              <span className="text-xl font-bold font-mono text-blue-400">
                {calculatedComposite}
                <span className="text-xs text-slate-500"> / 5.0</span>
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-5 divide-y divide-slate-800/80">
            {DEFAULT_RUBRIC_CRITERIA.map((criterion, idx) => (
              <div
                key={criterion.id}
                className={`flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  idx === 0 ? '' : 'pt-5'
                }`}
              >
                <div className="max-w-md">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-200">{criterion.name}</h3>
                    <Badge variant="outline" className="text-[10px]">
                      {criterion.weight}% Weight
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{criterion.description}</p>
                </div>

                {/* Score Selector 1-5 */}
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((scoreValue) => {
                    const isSelected = scores[criterion.id] === scoreValue;
                    return (
                      <button
                        key={scoreValue}
                        type="button"
                        onClick={() => handleScoreChange(criterion.id, scoreValue)}
                        className={`w-9 h-9 rounded-lg text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/25 ring-2 ring-blue-500/20'
                            : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:border-slate-500 hover:bg-slate-800'
                        }`}
                      >
                        {scoreValue}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Qualitative Notes & Recommendation */}
          <div className="pt-6 border-t border-slate-800 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 block">
                Overall Recommendation
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'strongly_recommend', label: 'Strongly Recommend', color: 'border-emerald-500/50 text-emerald-300' },
                  { id: 'recommend', label: 'Recommend', color: 'border-blue-500/50 text-blue-300' },
                  { id: 'neutral', label: 'Neutral / Review', color: 'border-amber-500/50 text-amber-300' },
                  { id: 'do_not_recommend', label: 'Do Not Recommend', color: 'border-rose-500/50 text-rose-300' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRecommendation(item.id)}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all ${
                      recommendation === item.id
                        ? `bg-slate-800 ring-2 ring-blue-500/30 ${item.color} font-semibold`
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 block">
                Interviewer Qualitative Observations & Notes
              </label>
              <textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Highlight specific problem-solving examples, leadership aptitude, technical experience, or culture-fit flags..."
                rows={4}
                className="w-full p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 resize-y"
              />
              <p className="text-[11px] text-slate-500">
                Notes remain confidential to recruitment administrators and are excluded from the public candidate pass.
              </p>
            </div>
          </div>

          {/* Form Action Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Final submission permanently records candidate interview completion.</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={submitting}
                onClick={() => handleSubmit(false)}
                className="w-full sm:w-auto gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                Save Draft
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={submitting}
                onClick={() => handleSubmit(true)}
                className="w-full sm:w-auto gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Submit Final Scorecard
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
