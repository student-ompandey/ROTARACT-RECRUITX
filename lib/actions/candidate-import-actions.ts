'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/guards';
import { logAuditEvent } from '@/lib/services/audit-service';
import {
  CandidateRowSchema,
  ValidatedCandidateRow,
  RowValidationResult,
  ImportValidationSummary,
} from '@/lib/validations/candidate-import';
import { revalidatePath } from 'next/cache';

const MAX_ROWS_LIMIT = 500; // Safe upper bound limit for recruitment induction drives

export interface ValidateImportPayload {
  driveId: string;
  mappedRows: Array<{
    fullName?: string;
    enrollmentNo?: string;
    email?: string;
    branch?: string;
    yearOfStudy?: string;
    phone?: string;
    interviewerName?: string;
    interviewLink?: string;
  }>;
}

export interface CommitImportPayload {
  driveId: string;
  rowsToCommit: ValidatedCandidateRow[];
  duplicateAction: 'skip' | 'update';
}

export interface ImportCommitResult {
  success: boolean;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  error?: string;
}

/**
 * Validates mapped rows against Zod schemas, detects in-file duplicates,
 * and checks existing enrollment numbers in Supabase.
 */
export async function validateCandidateImportAction(
  payload: ValidateImportPayload
): Promise<{ success: boolean; data?: ImportValidationSummary; error?: string }> {
  await requireAdmin();

  if (!payload.mappedRows || payload.mappedRows.length === 0) {
    return { success: false, error: 'No rows found to validate.' };
  }

  if (payload.mappedRows.length > MAX_ROWS_LIMIT) {
    return {
      success: false,
      error: `File exceeds maximum row limit of ${MAX_ROWS_LIMIT} rows per import batch.`,
    };
  }

  const isConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy') &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project')
  );

  let existingEnrollments = new Set<string>();
  let existingEmails = new Set<string>();

  if (!isConfigured) {
    const { mockStore } = await import('@/lib/services/mock-store');
    mockStore.candidates.forEach((c) => {
      existingEnrollments.add(c.enrollment_no.toUpperCase().trim());
      existingEmails.add(c.email.toLowerCase().trim());
    });
  } else {
    const supabase = await createServerSupabaseClient();
    const { data: existingRecords } = await supabase
      .from('candidates')
      .select('enrollment_no, email')
      .eq('drive_id', payload.driveId);

    existingEnrollments = new Set(
      (existingRecords || []).map((r) => r.enrollment_no.toUpperCase().trim())
    );
    existingEmails = new Set(
      (existingRecords || []).map((r) => r.email.toLowerCase().trim())
    );
  }

  const seenEnrollmentsInFile = new Set<string>();
  const seenEmailsInFile = new Set<string>();

  const rowResults: RowValidationResult[] = [];
  let validRowsCount = 0;
  let invalidRowsCount = 0;
  let duplicateInFileCount = 0;
  let existingInDbCount = 0;

  payload.mappedRows.forEach((rawRow, idx) => {
    const rowNumber = idx + 1;
    const errors: string[] = [];

    // Zod validation
    const parsed = CandidateRowSchema.safeParse(rawRow);
    let rowData: Partial<ValidatedCandidateRow> = rawRow;

    if (!parsed.success) {
      errors.push(...parsed.error.issues.map((i) => i.message));
    } else {
      rowData = parsed.data;
    }

    const enrollment = (rowData.enrollmentNo || '').toUpperCase().trim();
    const email = (rowData.email || '').toLowerCase().trim();

    // Check duplicate in file
    let isDuplicateInFile = false;
    if (enrollment) {
      if (seenEnrollmentsInFile.has(enrollment)) {
        isDuplicateInFile = true;
        errors.push(`Duplicate enrollment number "${enrollment}" within this CSV file.`);
      } else {
        seenEnrollmentsInFile.add(enrollment);
      }
    }

    if (email) {
      if (seenEmailsInFile.has(email)) {
        isDuplicateInFile = true;
        errors.push(`Duplicate email address "${email}" within this CSV file.`);
      } else {
        seenEmailsInFile.add(email);
      }
    }

    // Check existing in database
    const isExistingInDb =
      (enrollment ? existingEnrollments.has(enrollment) : false) ||
      (email ? existingEmails.has(email) : false);

    if (isDuplicateInFile) duplicateInFileCount++;
    if (isExistingInDb) existingInDbCount++;

    const isValid = errors.length === 0 && !isDuplicateInFile;
    if (isValid) {
      validRowsCount++;
    } else {
      invalidRowsCount++;
    }

    rowResults.push({
      rowNumber,
      data: rowData,
      errors,
      isDuplicateInFile,
      isExistingInDb,
      isValid,
    });
  });

  return {
    success: true,
    data: {
      totalRows: payload.mappedRows.length,
      validRowsCount,
      invalidRowsCount,
      duplicateInFileCount,
      existingInDbCount,
      rows: rowResults,
    },
  };
}

/**
 * Commits verified candidate rows in safe batches to Supabase.
 * Supports explicit duplicate handling ('skip' or 'update').
 */
export async function commitCandidateImportAction(
  payload: CommitImportPayload
): Promise<ImportCommitResult> {
  const admin = await requireAdmin();

  if (!payload.rowsToCommit || payload.rowsToCommit.length === 0) {
    return {
      success: false,
      createdCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      failedCount: 0,
      error: 'No rows provided to commit.',
    };
  }

  const isConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy') &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project')
  );

  if (!isConfigured) {
    const { mockStore } = await import('@/lib/services/mock-store');
    const result = mockStore.importCandidates(
      payload.driveId,
      payload.rowsToCommit.map((r) => ({
        enrollment_no: r.enrollmentNo,
        full_name: r.fullName,
        email: r.email,
        phone: r.phone || null,
        branch: r.branch,
        year_of_study: r.yearOfStudy,
        interviewer_name: r.interviewerName,
        interview_link: r.interviewLink,
      })),
      payload.duplicateAction
    );

    revalidatePath('/candidates');
    revalidatePath('/students');
    revalidatePath(`/drives/${payload.driveId}`);

    return {
      success: true,
      createdCount: result.created,
      updatedCount: result.updated,
      skippedCount: result.skipped,
      failedCount: 0,
    };
  }

  const supabase = await createServerSupabaseClient();
  const batchId = `import_${Date.now()}`;

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  // Process rows individually or in micro-batches to report exact partial progress
  for (const row of payload.rowsToCommit) {
    try {
      const candidateData = {
        drive_id: payload.driveId,
        enrollment_no: row.enrollmentNo,
        full_name: row.fullName,
        email: row.email,
        branch: row.branch,
        year_of_study: row.yearOfStudy,
        phone: row.phone || null,
        interviewer_name: row.interviewerName,
        interview_link: row.interviewLink,
        import_batch_id: batchId,
        status: 'pending' as const,
      };

      if (payload.duplicateAction === 'skip') {
        const { error } = await supabase
          .from('candidates')
          .insert(candidateData);

        if (error) {
          if (error.code === '23505') {
            skippedCount++;
          } else {
            failedCount++;
          }
        } else {
          createdCount++;
        }
      } else {
        // Upsert on drive_id and enrollment_no
        const { data, error } = await supabase
          .from('candidates')
          .upsert(candidateData, { onConflict: 'drive_id, enrollment_no' })
          .select('created_at, updated_at');

        if (error) {
          failedCount++;
        } else {
          createdCount++;
        }
      }
    } catch {
      failedCount++;
    }
  }

  // Audit log summary of the import
  await logAuditEvent(admin, {
    action: 'CANDIDATES_IMPORTED',
    driveId: payload.driveId,
    targetEntity: 'candidates',
    targetId: batchId,
    details: {
      batchId,
      createdCount,
      updatedCount,
      skippedCount,
      failedCount,
      duplicateAction: payload.duplicateAction,
    },
  });

  revalidatePath('/candidates');
  revalidatePath(`/drives/${payload.driveId}`);

  return {
    success: true,
    createdCount,
    updatedCount,
    skippedCount,
    failedCount,
  };
}
