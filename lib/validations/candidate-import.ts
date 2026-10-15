import { z } from 'zod';

/**
 * Supported canonical candidate fields.
 */
export const CanonicalFieldEnum = z.enum([
  'fullName',
  'enrollmentNo',
  'email',
  'branch',
  'yearOfStudy',
  'phone',
  'interviewerName',
  'interviewLink',
  'ignore',
]);

export type CanonicalField = z.infer<typeof CanonicalFieldEnum>;

/**
 * Validates that an interview link is a well-formed HTTPS URL (preferably Google Meet or video conference link).
 */
export function isValidInterviewUrl(urlStr: string): boolean {
  try {
    const trimmed = urlStr.trim();
    if (!trimmed) return false;
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Normalized row schema after column mapping.
 */
export const CandidateRowSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(120, 'Name too long')
    .transform((val) => sanitizeFormulaInjection(val)),
  enrollmentNo: z
    .string()
    .min(3, 'Enrollment number is required')
    .max(50)
    .transform((val) => sanitizeFormulaInjection(val.toUpperCase().trim())),
  email: z
    .string()
    .email('Invalid email address')
    .max(150)
    .transform((val) => val.toLowerCase().trim()),
  branch: z
    .string()
    .min(2, 'Course/Department is required')
    .max(100)
    .default('General')
    .transform((val) => sanitizeFormulaInjection(val)),
  yearOfStudy: z
    .string()
    .max(30)
    .default('1st Year')
    .transform((val) => sanitizeFormulaInjection(val)),
  phone: z
    .string()
    .max(25)
    .optional()
    .transform((val) => (val ? sanitizeFormulaInjection(val.trim()) : undefined)),
  interviewerName: z
    .string()
    .min(2, 'Interviewer Name is mandatory (min 2 characters)')
    .max(120, 'Interviewer Name is too long')
    .transform((val) => sanitizeFormulaInjection(val.trim())),
  interviewLink: z
    .string()
    .min(5, 'Interview Link is mandatory')
    .refine((val) => isValidInterviewUrl(val), {
      message: 'Interview Link must be a valid HTTPS URL (e.g., https://meet.google.com/xxx-yyyy-zzz)',
    })
    .transform((val) => sanitizeFormulaInjection(val.trim())),
});

export type ValidatedCandidateRow = z.infer<typeof CandidateRowSchema>;

/**
 * Sanitizes untrusted CSV cell values against spreadsheet formula injection (=, +, -, @, \t, \r).
 */
export function sanitizeFormulaInjection(value: string): string {
  const trimmed = value.trim();
  if (/^[=+\-@\t\r]/.test(trimmed)) {
    // Prefix with single quote to escape spreadsheet interpretation
    return `'${trimmed}`;
  }
  return trimmed;
}

export interface ColumnMappingConfig {
  sourceColumn: string;
  targetField: CanonicalField;
}

export interface RowValidationResult {
  rowNumber: number;
  data: Partial<ValidatedCandidateRow>;
  errors: string[];
  isDuplicateInFile: boolean;
  isExistingInDb: boolean;
  isValid: boolean;
}

export interface ImportValidationSummary {
  totalRows: number;
  validRowsCount: number;
  invalidRowsCount: number;
  duplicateInFileCount: number;
  existingInDbCount: number;
  rows: RowValidationResult[];
}
