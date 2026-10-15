'use client';

import React, { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CanonicalField,
  ImportValidationSummary,
} from '@/lib/validations/candidate-import';
import {
  validateCandidateImportAction,
  commitCandidateImportAction,
  ImportCommitResult,
} from '@/lib/actions/candidate-import-actions';
import {
  Upload,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  AlertTriangle,
  RefreshCw,
  X,
  Download,
} from 'lucide-react';

interface ImportWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  drives: Array<{ id: string; name: string }>;
}

type WizardStep = 'upload' | 'mapping' | 'preview' | 'result';

export function ImportWizardModal({ isOpen, onClose, drives }: ImportWizardModalProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('upload');
  const [selectedDriveId, setSelectedDriveId] = useState<string>(drives[0]?.id || '');
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, CanonicalField>>({});
  const [validationSummary, setValidationSummary] = useState<ImportValidationSummary | null>(null);
  const [duplicateAction, setDuplicateAction] = useState<'skip' | 'update'>('skip');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [commitResult, setCommitResult] = useState<ImportCommitResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string>('students');
  const [autoDeduplicate, setAutoDeduplicate] = useState<boolean>(true);
  const [removedDuplicatesCount, setRemovedDuplicatesCount] = useState<number>(0);
  const [quickCleanStats, setQuickCleanStats] = useState<{
    total: number;
    unique: number;
    removed: number;
    enrollmentHeader: string;
    cleanedRows: Record<string, any>[];
  } | null>(null);

  if (!isOpen) return null;

  // Auto-suggest column mappings based on common column names
  function autoSuggestMapping(headers: string[]) {
    const suggested: Record<string, CanonicalField> = {};
    headers.forEach((h) => {
      const lower = h.toLowerCase().trim();
      if (
        lower.includes('interviewer') ||
        lower.includes('panelist') ||
        lower.includes('evaluator') ||
        lower.includes('taken by') ||
        lower.includes('faculty') ||
        lower === 'interviewer' ||
        lower === 'interviewer name'
      ) {
        suggested[h] = 'interviewerName';
      } else if (
        lower.includes('link') ||
        lower.includes('meet') ||
        lower.includes('url') ||
        lower.includes('gmeet') ||
        lower.includes('teams') ||
        lower.includes('zoom')
      ) {
        suggested[h] = 'interviewLink';
      } else if (
        lower === 'name' ||
        lower === 'candidate name' ||
        lower === 'student name' ||
        lower === 'full name' ||
        (lower.includes('name') && !lower.includes('interviewer')) ||
        lower.includes('candidate')
      ) {
        suggested[h] = 'fullName';
      } else if (
        lower.includes('enroll') ||
        lower.includes('roll') ||
        lower.includes('reg') ||
        lower.includes('id')
      ) {
        suggested[h] = 'enrollmentNo';
      } else if (lower.includes('email') || lower.includes('mail')) {
        suggested[h] = 'email';
      } else if (lower.includes('branch') || lower.includes('dept') || lower.includes('course')) {
        suggested[h] = 'branch';
      } else if (lower.includes('year') || lower.includes('sem')) {
        suggested[h] = 'yearOfStudy';
      } else if (
        lower.includes('phone') ||
        lower.includes('mobile') ||
        lower.includes('contact') ||
        lower === 'number' ||
        lower.includes('no.')
      ) {
        suggested[h] = 'phone';
      } else {
        suggested[h] = 'ignore';
      }
    });
    setColumnMapping(suggested);
  }

  // Unified File Parser supporting CSV and Excel (.xlsx, .xls)
  async function processSpreadsheetFile(file: File) {
    setErrorMessage(null);
    const originalName = file.name.replace(/\.[^/.]+$/, '');
    setFileName(originalName || 'students');
    const lowerName = file.name.toLowerCase();

    if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
      // Excel File Parsing
      try {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          setErrorMessage('The Excel file has no readable sheets.');
          return;
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
          defval: '',
          raw: false,
        });

        if (jsonData.length === 0) {
          setErrorMessage('No student data found in the Excel sheet.');
          return;
        }

        const headers = Object.keys(jsonData[0] || {});
        if (headers.length === 0) {
          setErrorMessage('Could not find column headers in the Excel file.');
          return;
        }

        // Convert all values to strings
        const stringRows: Record<string, string>[] = jsonData.map((row) => {
          const formattedRow: Record<string, string> = {};
          Object.entries(row).forEach(([k, v]) => {
            formattedRow[k] = v !== null && v !== undefined ? String(v).trim() : '';
          });
          return formattedRow;
        });

        // Helper to find enrollment column header
        const detectEnrollmentHeader = (hdrs: string[]) => {
          return (
            hdrs.find((h) => {
              const l = h.toLowerCase().trim();
              return l.includes('enroll') || l.includes('roll') || l.includes('reg') || l === 'id';
            }) || hdrs[0] || ''
          );
        };

        const enrCol = detectEnrollmentHeader(headers);
        const seenEnr = new Set<string>();
        const uniqueCleanedRows: Record<string, string>[] = [];

        for (const row of stringRows) {
          const rawVal = enrCol ? String(row[enrCol] || '').trim().toUpperCase() : '';
          if (rawVal) {
            if (!seenEnr.has(rawVal)) {
              seenEnr.add(rawVal);
              uniqueCleanedRows.push(row);
            }
          } else {
            uniqueCleanedRows.push(row);
          }
        }

        setQuickCleanStats({
          total: stringRows.length,
          unique: uniqueCleanedRows.length,
          removed: stringRows.length - uniqueCleanedRows.length,
          enrollmentHeader: enrCol,
          cleanedRows: uniqueCleanedRows,
        });

        setRawHeaders(headers);
        setRawRows(stringRows);
        autoSuggestMapping(headers);
        setCurrentStep('mapping');
      } catch (err: any) {
        setErrorMessage(`Failed to parse Excel file: ${err.message || 'Unknown format'}`);
      }
    } else {
      // CSV File Parsing via PapaParse
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (!results.meta.fields || results.meta.fields.length === 0) {
            setErrorMessage('Could not find column headers in the CSV file.');
            return;
          }

          const headers = results.meta.fields;
          const rows = results.data;

          const enrCol =
            headers.find((h) => {
              const l = h.toLowerCase().trim();
              return l.includes('enroll') || l.includes('roll') || l.includes('reg') || l === 'id';
            }) || headers[0] || '';

          const seenEnr = new Set<string>();
          const uniqueCleanedRows: Record<string, string>[] = [];

          for (const row of rows) {
            const rawVal = enrCol ? String(row[enrCol] || '').trim().toUpperCase() : '';
            if (rawVal) {
              if (!seenEnr.has(rawVal)) {
                seenEnr.add(rawVal);
                uniqueCleanedRows.push(row);
              }
            } else {
              uniqueCleanedRows.push(row);
            }
          }

          setQuickCleanStats({
            total: rows.length,
            unique: uniqueCleanedRows.length,
            removed: rows.length - uniqueCleanedRows.length,
            enrollmentHeader: enrCol,
            cleanedRows: uniqueCleanedRows,
          });

          setRawHeaders(headers);
          setRawRows(rows);
          autoSuggestMapping(headers);
          setCurrentStep('mapping');
        },
        error: (err) => {
          setErrorMessage(`Failed to parse CSV: ${err.message}`);
        },
      });
    }
  }

  // Step 1: Handle File Upload via file dialog
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      processSpreadsheetFile(file);
    }
  }

  // Drag & Drop Handlers
  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      const name = file.name.toLowerCase();
      const isValidFormat =
        name.endsWith('.csv') ||
        name.endsWith('.xlsx') ||
        name.endsWith('.xls') ||
        file.type === 'text/csv' ||
        file.type.includes('spreadsheet') ||
        file.type.includes('excel');

      if (!isValidFormat) {
        setErrorMessage('Please upload a valid .csv, .xlsx, or .xls spreadsheet file.');
        return;
      }
      processSpreadsheetFile(file);
    }
  }

  // Export unique valid student records to an Excel (.xlsx / .xls compatible) file
  function handleDownloadUniqueXls() {
    if (!validationSummary) return;

    // Filter valid unique candidate rows
    const uniqueValidRows = validationSummary.rows
      .filter((r) => r.isValid && !r.isDuplicateInFile)
      .map((r, index) => ({
        'S.No': index + 1,
        'Full Name': r.data.fullName || '',
        'Enrollment Number': r.data.enrollmentNo || '',
        'Email Address': r.data.email || '',
        'Phone Number': r.data.phone || '',
        'Department / Branch': r.data.branch || 'General',
        'Year of Study': r.data.yearOfStudy || '1st Year',
        'Interviewer Name': r.data.interviewerName || '',
        'Interview Link': r.data.interviewLink || '',
        'Database Status': r.isExistingInDb ? 'Existing in DB' : 'New Candidate',
      }));

    if (uniqueValidRows.length === 0) {
      setErrorMessage('No unique valid records available to download.');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(uniqueValidRows);

    // Auto-size columns for neat formatting in Excel
    const colWidths = [
      { wch: 6 },
      { wch: 24 },
      { wch: 18 },
      { wch: 30 },
      { wch: 16 },
      { wch: 22 },
      { wch: 14 },
      { wch: 22 },
      { wch: 38 },
      { wch: 16 },
    ];
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Unique Students');

    const downloadFileName = `${fileName}_unique_cleaned.xlsx`;
    XLSX.writeFile(workbook, downloadFileName, { bookType: 'xlsx' });
  }

  // Instant 1-Click Clean & Download Excel: Removes duplicate enrollment numbers and keeps all uploaded columns exactly as-is
  function handleDownloadQuickCleanedXls() {
    if (!quickCleanStats || quickCleanStats.cleanedRows.length === 0) {
      setErrorMessage('No cleaned rows available to download.');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(quickCleanStats.cleanedRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cleaned Unique Students');

    const downloadFileName = `${fileName}_unique_by_enrollment.xlsx`;
    XLSX.writeFile(workbook, downloadFileName, { bookType: 'xlsx' });
  }

  // Step 2: Validate Mapped Data with optional In-Memory De-duplication
  async function handleValidateMapping() {
    setErrorMessage(null);

    // Mandatory Column Mapping Validation
    const mappedTargets = Object.values(columnMapping);
    const missingRequired: string[] = [];
    if (!mappedTargets.includes('fullName')) missingRequired.push('Full Name');
    if (!mappedTargets.includes('enrollmentNo')) missingRequired.push('Enrollment Number');
    if (!mappedTargets.includes('email')) missingRequired.push('Email Address');
    if (!mappedTargets.includes('interviewerName')) missingRequired.push('Interviewer Name');
    if (!mappedTargets.includes('interviewLink')) missingRequired.push('Interview Link');

    if (missingRequired.length > 0) {
      setErrorMessage(
        `Mandatory column mapping missing: Please map ${missingRequired.join(', ')} before validating.`
      );
      return;
    }

    setIsLoading(true);

    // Transform raw rows into mapped rows
    let mappedRows = rawRows.map((row) => {
      const mapped: Record<string, string> = {};
      Object.entries(columnMapping).forEach(([header, targetField]) => {
        if (targetField !== 'ignore') {
          mapped[targetField] = (row[header] || '').trim();
        }
      });
      return mapped;
    });

    // If auto-deduplication is enabled, strip in-file duplicates immediately so only unique students (by Name & Enrollment No) remain
    let removedDupes = 0;
    if (autoDeduplicate) {
      const seenIdentity = new Set<string>();
      const uniqueRows: typeof mappedRows = [];

      for (const row of mappedRows) {
        const nameKey = (row.fullName || '').toLowerCase().trim();
        const enrKey = (row.enrollmentNo || '').toUpperCase().trim();
        
        // Deduplicate strictly on the basis of Full Name and Enrollment Number
        const identityKey = `${nameKey}:::${enrKey}`;

        if (seenIdentity.has(identityKey)) {
          removedDupes++;
        } else {
          seenIdentity.add(identityKey);
          uniqueRows.push(row);
        }
      }

      mappedRows = uniqueRows;
    }
    setRemovedDuplicatesCount(removedDupes);

    const res = await validateCandidateImportAction({
      driveId: selectedDriveId,
      mappedRows,
    });

    setIsLoading(false);
    if (!res.success || !res.data) {
      setErrorMessage(res.error || 'Validation failed.');
    } else {
      setValidationSummary(res.data);
      setCurrentStep('preview');
    }
  }

  // Step 3: Commit Batch to Database
  async function handleCommitImport() {
    if (!validationSummary) return;

    setIsLoading(true);
    setErrorMessage(null);

    // Filter only valid rows
    const validRowsToCommit = validationSummary.rows
      .filter((r) => r.isValid && (duplicateAction === 'update' || !r.isDuplicateInFile))
      .map((r) => r.data as any);

    const res = await commitCandidateImportAction({
      driveId: selectedDriveId,
      rowsToCommit: validRowsToCommit,
      duplicateAction,
    });

    setIsLoading(false);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to commit import batch.');
    } else {
      setCommitResult(res);
      setCurrentStep('result');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="max-w-3xl w-full max-h-[90vh] flex flex-col border-slate-700 bg-[#0f172a] shadow-2xl shadow-black relative overflow-hidden">
        {/* Modal Top Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Candidate Import Wizard (CSV)
              </h3>
              <p className="text-[11px] text-slate-400">
                Step-by-step verified candidate batch importer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Wizard Steps Breadcrumbs */}
        <div className="px-6 py-2.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <span
            className={`font-medium ${
              currentStep === 'upload' ? 'text-blue-400 font-semibold' : 'text-slate-500'
            }`}
          >
            1. Upload File
          </span>
          <span className="text-slate-600">→</span>
          <span
            className={`font-medium ${
              currentStep === 'mapping' ? 'text-blue-400 font-semibold' : 'text-slate-500'
            }`}
          >
            2. Map Headers
          </span>
          <span className="text-slate-600">→</span>
          <span
            className={`font-medium ${
              currentStep === 'preview' ? 'text-blue-400 font-semibold' : 'text-slate-500'
            }`}
          >
            3. Validate & Preview
          </span>
          <span className="text-slate-600">→</span>
          <span
            className={`font-medium ${
              currentStep === 'result' ? 'text-blue-400 font-semibold' : 'text-slate-500'
            }`}
          >
            4. Summary
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl flex items-center gap-2 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: UPLOAD */}
          {currentStep === 'upload' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Target Recruitment Drive
                </label>
                <select
                  value={selectedDriveId}
                  onChange={(e) => setSelectedDriveId(e.target.value)}
                  className="w-full h-8 px-2.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  {drives.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                  isDragging
                    ? 'border-blue-400 bg-blue-950/40 ring-4 ring-blue-500/20 scale-[1.01]'
                    : 'border-slate-700 hover:border-blue-500/60 bg-slate-900/30'
                }`}
              >
                <input
                  type="file"
                  accept=".csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,.xlsx,.xls"
                  onChange={handleFileUpload}
                  id="csv-file-input"
                  className="hidden"
                />
                <label
                  htmlFor="csv-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-2.5"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform ${
                      isDragging
                        ? 'bg-blue-600 text-white scale-110 shadow-lg shadow-blue-500/30'
                        : 'bg-blue-950/80 border border-blue-800/60 text-blue-400'
                    }`}
                  >
                    <FileSpreadsheet className="w-7 h-7" />
                  </div>
                  <span className="text-sm font-semibold text-slate-100">
                    {isDragging ? 'Drop Excel / CSV file here now' : 'Drag & Drop Excel (.xlsx, .xls) or CSV file, or browse'}
                  </span>
                  <span className="text-xs text-slate-400 max-w-sm">
                    Drop your student registration file directly here (.xlsx, .xls, .csv). Up to 500 records per batch.
                  </span>
                </label>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <span className="font-semibold text-slate-300 block">Required Spreadsheet Data:</span>
                <p>• Mandatory: Student Name, Enrollment Number, Email Address, Interviewer Name, Interview Link (HTTPS)</p>
                <p>• Optional: Department/Branch and Year of Study (defaults applied if omitted)</p>
              </div>
            </div>
          )}

          {/* STEP 2: MAPPING */}
          {currentStep === 'mapping' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Map CSV Headers</h4>
                  <p className="text-[11px] text-slate-400">
                    Match source columns from your uploaded file to canonical RecruitX fields.
                  </p>
                </div>
                <Badge variant="info">{rawRows.length} Rows Detected</Badge>
              </div>

              <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 overflow-hidden text-xs">
                {rawHeaders.map((header) => (
                  <div
                    key={header}
                    className="p-3 bg-slate-900/40 flex items-center justify-between gap-4"
                  >
                    <div>
                      <span className="font-semibold text-slate-200 font-mono">{header}</span>
                      <span className="text-[10px] text-slate-500 block truncate max-w-xs mt-0.5">
                        Sample: "{rawRows[0]?.[header] || ''}"
                      </span>
                    </div>

                    <select
                      value={columnMapping[header] || 'ignore'}
                      onChange={(e) =>
                        setColumnMapping({
                          ...columnMapping,
                          [header]: e.target.value as CanonicalField,
                        })
                      }
                      className="h-8 px-2.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
                    >
                      <option value="fullName">Full Name (Required)</option>
                      <option value="enrollmentNo">Enrollment No. (Required)</option>
                      <option value="email">Email Address (Required)</option>
                      <option value="interviewerName">Interviewer Name (Required)</option>
                      <option value="interviewLink">Interview Link (Required — HTTPS)</option>
                      <option value="branch">Branch / Course</option>
                      <option value="yearOfStudy">Year of Study</option>
                      <option value="phone">Phone / Mobile</option>
                      <option value="ignore">— Ignore Column —</option>
                    </select>
                  </div>
                ))}
              </div>

              {/* Quick 1-Click Clean & Download by Enrollment No */}
              {quickCleanStats && (
                <div className="p-4 bg-emerald-950/30 border border-emerald-800/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-semibold text-emerald-200">
                        Quick Clean: Unique by Enrollment No.
                      </span>
                      {quickCleanStats.removed > 0 ? (
                        <Badge variant="warning">{quickCleanStats.removed} Duplicates Detected</Badge>
                      ) : (
                        <Badge variant="success">All {quickCleanStats.total} Unique</Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1">
                      Column matched: <strong className="text-white">"{quickCleanStats.enrollmentHeader}"</strong>. Keeps all original columns intact with unique students.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDownloadQuickCleanedXls}
                    className="border-emerald-700/80 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-200 hover:text-white shrink-0 font-medium"
                    title="Download Excel file immediately with all original columns and duplicates removed by enrollment number"
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Download Cleaned Excel ({quickCleanStats.unique} rows)
                  </Button>
                </div>
              )}

              {/* Deduplication Switch */}
              <div className="p-3 bg-blue-950/30 border border-blue-900/50 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-blue-200 block">
                    Remove Duplicate Student Entries for Import
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Automatically filter out repeated records matching on Student Name & Enrollment Number so only unique students proceed to import & XLS export.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoDeduplicate}
                    onChange={(e) => setAutoDeduplicate(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW & VALIDATION */}
          {currentStep === 'preview' && validationSummary && (
            <div className="space-y-4">
              {removedDuplicatesCount > 0 && (
                <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl flex items-center justify-between text-xs text-amber-200">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      Filtered out <strong className="text-white">{removedDuplicatesCount} duplicate record(s)</strong> from uploaded file. Retaining only unique students.
                    </span>
                  </div>
                  <Badge variant="warning">{removedDuplicatesCount} Removed</Badge>
                </div>
              )}

              {/* Summary Metrics & Download XLS Trigger */}
              <div className="flex items-center justify-between">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs flex-1 mr-3">
                  <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Unique Records</span>
                    <span className="font-semibold text-slate-200 text-sm">
                      {validationSummary.totalRows}
                    </span>
                  </div>
                  <div className="p-2.5 bg-emerald-950/30 rounded-lg border border-emerald-900/40">
                    <span className="text-emerald-400 block text-[10px]">Ready to Import</span>
                    <span className="font-semibold text-emerald-300 text-sm">
                      {validationSummary.validRowsCount}
                    </span>
                  </div>
                  <div className="p-2.5 bg-amber-950/30 rounded-lg border border-amber-900/40">
                    <span className="text-amber-400 block text-[10px]">Existing in Database</span>
                    <span className="font-semibold text-amber-300 text-sm">
                      {validationSummary.existingInDbCount}
                    </span>
                  </div>
                  <div className="p-2.5 bg-red-950/30 rounded-lg border border-red-900/40">
                    <span className="text-red-400 block text-[10px]">Invalid / Errors</span>
                    <span className="font-semibold text-red-300 text-sm">
                      {validationSummary.invalidRowsCount}
                    </span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownloadUniqueXls}
                  className="h-10 border-blue-700/60 bg-blue-950/40 hover:bg-blue-900/60 text-blue-300 hover:text-white shrink-0"
                  title="Download unique student records as an Excel (.xlsx / .xls) spreadsheet"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Download Unique (.xlsx)
                </Button>
              </div>

              {/* Duplicate Handling Policy Selection */}
              <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-200 block">
                    Duplicate Enrollment Policy
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Action to take when a candidate enrollment number already exists in this drive.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={duplicateAction === 'skip' ? 'primary' : 'outline'}
                    onClick={() => setDuplicateAction('skip')}
                    className="h-7 text-xs"
                  >
                    Skip Duplicates
                  </Button>
                  <Button
                    size="sm"
                    variant={duplicateAction === 'update' ? 'primary' : 'outline'}
                    onClick={() => setDuplicateAction('update')}
                    className="h-7 text-xs"
                  >
                    Update Records
                  </Button>
                </div>
              </div>

              {/* Row Inspection Table */}
              <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-800 text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-900/90 text-slate-400 sticky top-0 border-b border-slate-800">
                    <tr>
                      <th className="p-2">#</th>
                      <th className="p-2">Enrollment</th>
                      <th className="p-2">Candidate</th>
                      <th className="p-2">Email</th>
                      <th className="p-2">Interviewer</th>
                      <th className="p-2">Interview Link</th>
                      <th className="p-2">Validation Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {validationSummary.rows.map((row) => (
                      <tr
                        key={row.rowNumber}
                        className={row.isValid ? 'hover:bg-slate-800/20' : 'bg-red-950/15'}
                      >
                        <td className="p-2 font-mono text-slate-500">{row.rowNumber}</td>
                        <td className="p-2 font-mono font-semibold text-slate-200">
                          {row.data.enrollmentNo || 'MISSING'}
                        </td>
                        <td className="p-2 text-slate-300">{row.data.fullName || 'MISSING'}</td>
                        <td className="p-2 text-slate-400 truncate max-w-[130px]">
                          {row.data.email || 'MISSING'}
                        </td>
                        <td className="p-2 text-slate-300 truncate max-w-[120px]">
                          {row.data.interviewerName || (
                            <span className="text-red-400 font-medium">MISSING</span>
                          )}
                        </td>
                        <td className="p-2 text-slate-400 truncate max-w-[160px] font-mono text-[11px]">
                          {row.data.interviewLink ? (
                            <span className="text-blue-400 underline truncate block max-w-[160px]" title={row.data.interviewLink}>
                              {row.data.interviewLink}
                            </span>
                          ) : (
                            <span className="text-red-400 font-medium">MISSING</span>
                          )}
                        </td>
                        <td className="p-2">
                          {row.isValid ? (
                            <Badge variant={row.isExistingInDb ? 'warning' : 'success'}>
                              {row.isExistingInDb ? 'Exists in DB' : 'Valid'}
                            </Badge>
                          ) : (
                            <div className="space-y-0.5">
                              <Badge variant="destructive">Error</Badge>
                              <span className="text-[10px] text-red-300 block">
                                {row.errors.join('; ')}
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 4: RESULT */}
          {currentStep === 'result' && commitResult && (
            <div className="p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Candidate Batch Imported</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Database commit completed. Candidate records are now safely enrolled.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 p-4 bg-slate-900/60 rounded-xl border border-slate-800 text-xs max-w-sm mx-auto">
                <div>
                  <span className="text-slate-500 block text-[10px]">Created</span>
                  <span className="font-semibold text-emerald-400 text-base">
                    {commitResult.createdCount}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Skipped</span>
                  <span className="font-semibold text-amber-400 text-base">
                    {commitResult.skippedCount}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Failed</span>
                  <span className="font-semibold text-red-400 text-base">
                    {commitResult.failedCount}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownloadUniqueXls}
                  className="border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Download Unique Cleaned Data (.xlsx)
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between">
          <div>
            {currentStep === 'mapping' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep('upload')}
                disabled={isLoading}
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Re-upload
              </Button>
            )}
            {currentStep === 'preview' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep('mapping')}
                disabled={isLoading}
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Adjust Mappings
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep === 'upload' && (
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
            )}

            {currentStep === 'mapping' && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleValidateMapping}
                disabled={isLoading}
              >
                {isLoading ? 'Validating...' : 'Validate & Preview'}
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            )}

            {currentStep === 'preview' && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleCommitImport}
                disabled={isLoading || validationSummary?.validRowsCount === 0}
              >
                {isLoading ? 'Writing to DB...' : 'Confirm & Commit Batch'}
              </Button>
            )}

            {currentStep === 'result' && (
              <Button variant="primary" size="sm" onClick={onClose}>
                Finish & View Roster
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
