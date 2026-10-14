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

  if (!isOpen) return null;

  // Auto-suggest column mappings based on common column names
  function autoSuggestMapping(headers: string[]) {
    const suggested: Record<string, CanonicalField> = {};
    headers.forEach((h) => {
      const lower = h.toLowerCase().trim();
      if (lower.includes('name') || lower.includes('candidate')) {
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
      } else if (lower.includes('phone') || lower.includes('mobile') || lower.includes('contact') || lower === 'number' || lower.includes('no.')) {
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
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
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

          setRawHeaders(results.meta.fields);
          setRawRows(results.data);
          autoSuggestMapping(results.meta.fields);
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

  // Step 2: Validate Mapped Data
  async function handleValidateMapping() {
    setIsLoading(true);
    setErrorMessage(null);

    // Transform raw rows into mapped rows
    const mappedRows = rawRows.map((row) => {
      const mapped: Record<string, string> = {};
      Object.entries(columnMapping).forEach(([header, targetField]) => {
        if (targetField !== 'ignore') {
          mapped[targetField] = row[header] || '';
        }
      });
      return mapped;
    });

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
                <span className="font-semibold text-slate-300 block">Required CSV Data:</span>
                <p>• Student Name, Enrollment Number (e.g. 24TIT001), Email Address</p>
                <p>• Department/Branch and Year of Study (optional, defaults provided)</p>
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
                      <option value="branch">Branch / Course</option>
                      <option value="yearOfStudy">Year of Study</option>
                      <option value="phone">Phone / Mobile</option>
                      <option value="ignore">— Ignore Column —</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW & VALIDATION */}
          {currentStep === 'preview' && validationSummary && (
            <div className="space-y-4">
              {/* Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Total Rows</span>
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
                  <span className="text-red-400 block text-[10px]">Invalid / Conflicts</span>
                  <span className="font-semibold text-red-300 text-sm">
                    {validationSummary.invalidRowsCount}
                  </span>
                </div>
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
              <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-800 text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-900/90 text-slate-400 sticky top-0 border-b border-slate-800">
                    <tr>
                      <th className="p-2">#</th>
                      <th className="p-2">Enrollment</th>
                      <th className="p-2">Candidate</th>
                      <th className="p-2">Email</th>
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
                        <td className="p-2 text-slate-400 truncate max-w-[140px]">
                          {row.data.email || 'MISSING'}
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
