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
  'ignore',
]);

export type CanonicalField = z.infer<typeof CanonicalFieldEnum>;

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
