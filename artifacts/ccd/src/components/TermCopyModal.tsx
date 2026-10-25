import { useState, useEffect, useId } from 'react';
import { Copy, Calendar, ArrowRight } from 'lucide-react';
import {
  ModalShell,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from './ccdPlanner/ModalShell';

interface TermCopyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCopy: (
    sourceYear: string,
    sourceTerm: string,
    targetYear: string,
    targetTerm: string,
  ) => Promise<void>;
  availableYears: string[];
  currentYear: string;
}

const HALF_TERMS = [
  { id: 'A1', name: 'Autumn 1', months: 'Sep-Oct' },
  { id: 'A2', name: 'Autumn 2', months: 'Nov-Dec' },
  { id: 'SP1', name: 'Spring 1', months: 'Jan-Feb' },
  { id: 'SP2', name: 'Spring 2', months: 'Mar-Apr' },
  { id: 'SM1', name: 'Summer 1', months: 'Apr-May' },
  { id: 'SM2', name: 'Summer 2', months: 'Jun-Jul' },
];

export function TermCopyModal({
  isOpen,
  onClose,
  onCopy,
  availableYears,
  currentYear,
}: TermCopyModalProps) {
  const titleId = useId();
  const [sourceYear, setSourceYear] = useState<string>('');
  const [sourceTerm, setSourceTerm] = useState<string>('');
  const [targetYear, setTargetYear] = useState<string>(currentYear);
  const [targetTerm, setTargetTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setSourceYear(currentYear);
      setSourceTerm('');
      setTargetYear(currentYear);
      setTargetTerm('');
      setError('');
    }
  }, [isOpen, currentYear]);

  const handleCopy = async () => {
    if (!sourceYear || !sourceTerm || !targetYear || !targetTerm) {
      setError('Please select all required fields');
      return;
    }

    if (sourceYear === targetYear && sourceTerm === targetTerm) {
      setError('Source and target cannot be the same');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onCopy(sourceYear, sourceTerm, targetYear, targetTerm);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to copy term');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ModalShell open={isOpen} onClose={onClose} labelledBy={titleId}>
      <ModalHeader
        title="Copy or Move Term"
        subtitle="Copy lesson plans between terms or academic years"
        onClose={onClose}
        titleId={titleId}
      />
      <ModalBody>
        {error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : null}

        <div className="space-y-5">
          <div className="rounded-2xl bg-slate-50 p-4">
            <h3 className="mb-3 text-sm font-extrabold text-slate-900">Source (Copy From)</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Academic Year
                </label>
                <select
                  value={sourceYear}
                  onChange={(e) => setSourceYear(e.target.value)}
                  className="h-11 w-full rounded-xl border border-indigo-100 px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  <option value="">Select source year…</option>
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Term
                </label>
                <select
                  value={sourceTerm}
                  onChange={(e) => setSourceTerm(e.target.value)}
                  className="h-11 w-full rounded-xl border border-indigo-100 px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                  disabled={!sourceYear}
                >
                  <option value="">Select source term…</option>
                  {HALF_TERMS.map((term) => (
                    <option key={term.id} value={term.id}>
                      {term.name} ({term.months})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <ArrowRight className="h-5 w-5 text-slate-400" aria-hidden />
          </div>

          <div className="rounded-2xl bg-indigo-50/60 p-4">
            <h3 className="mb-3 text-sm font-extrabold text-slate-900">Target (Copy To)</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Academic Year
                </label>
                <select
                  value={targetYear}
                  onChange={(e) => setTargetYear(e.target.value)}
                  className="h-11 w-full rounded-xl border border-indigo-100 px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Term
                </label>
                <select
                  value={targetTerm}
                  onChange={(e) => setTargetTerm(e.target.value)}
                  className="h-11 w-full rounded-xl border border-indigo-100 px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                  disabled={!targetYear}
                >
                  <option value="">Select target term…</option>
                  {HALF_TERMS.map((term) => (
                    <option key={term.id} value={term.id}>
                      {term.name} ({term.months})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
            <div>
              <h4 className="text-sm font-bold text-amber-900">Important</h4>
              <p className="mt-1 text-sm text-amber-800">
                Copying a term will replace all existing lessons in the target term. This action
                cannot be undone.
              </p>
            </div>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 items-center justify-center rounded-full border-2 border-indigo-200 px-4 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void handleCopy()}
          disabled={isLoading || !sourceYear || !sourceTerm || !targetYear || !targetTerm}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 disabled:bg-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          <Copy className="h-4 w-4" aria-hidden />
          {isLoading ? 'Copying…' : 'Copy Term'}
        </button>
      </ModalFooter>
    </ModalShell>
  );
}
