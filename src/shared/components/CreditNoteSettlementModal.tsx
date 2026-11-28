import React, { useState, useEffect } from 'react';
import { Percent, DollarSign, AlertCircle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

export interface SettleModalNote {
  id: string;
  cnNo: string;
  customerName: string;
  againstInvoiceNo?: string;
  reason?: string;
  totalAmount: number;
  taxableAmount?: number;
}

interface CreditNoteSettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: SettleModalNote | null;
  onConfirmSettle: (settlementAmount: number, percentage: number, remarks: string) => Promise<void>;
}

const PERCENT_OPTIONS = [
  { value: 100, label: '100% - Full Billed Value (Salable Return / 100% Credit)' },
  { value: 60, label: '60% - High Recovery Return' },
  { value: 55, label: '55% - Near-Expiry Return' },
  { value: 50, label: '50% - Standard Expiry Return Policy (Default Half Value)' },
  { value: 45, label: '45% - Damaged / Short-Expiry Salvage' },
  { value: 40, label: '40% - Minimum Disposal Scrap Value' },
  { value: -1, label: 'Custom % - Enter Custom Percentage' }
];

const formatCurrency = (amount: number = 0) =>
  `₹ ${(Number(amount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function CreditNoteSettlementModal({
  isOpen,
  onClose,
  note,
  onConfirmSettle
}: CreditNoteSettlementModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<number>(50);
  const [customPct, setCustomPct] = useState<number>(50);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Initialize or reset when note opens
  useEffect(() => {
    if (note) {
      // Default to 50% for expiry/breakage, or 100% for sales return
      const isSalesReturn = note.reason === 'Sales Return';
      const defaultPct = isSalesReturn ? 100 : 50;
      setSelectedPreset(defaultPct);
      setCustomPct(defaultPct);
      setRemarks(`Settled at ${defaultPct}% recovery as per company return policy`);
    }
  }, [note, isOpen]);

  if (!isOpen || !note) return null;

  const activePercentage = selectedPreset === -1 ? customPct : selectedPreset;
  const originalTotal = Number(note.totalAmount) || 0;
  
  // Calculate settlement amount
  const calculatedSettlement = Math.round((originalTotal * (activePercentage / 100)) * 100) / 100;
  const deductionAmount = Math.max(0, originalTotal - calculatedSettlement);

  const handlePresetChange = (val: number) => {
    setSelectedPreset(val);
    const pct = val === -1 ? customPct : val;
    setRemarks(`Settled at ${pct}% recovery as per company return policy`);
  };

  const handleCustomChange = (val: number) => {
    const clamped = Math.min(100, Math.max(0, val));
    setCustomPct(clamped);
    setRemarks(`Settled at ${clamped}% recovery as per company return policy`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (calculatedSettlement <= 0 && activePercentage > 0) {
      alert('Settlement amount must be greater than zero.');
      return;
    }
    setSubmitting(true);
    try {
      await onConfirmSettle(calculatedSettlement, activePercentage, remarks);
      onClose();
    } catch (err: any) {
      console.error('Settlement confirmation failed:', err);
      alert('Failed to settle: ' + (err.message || 'Error occurred'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-900 to-[#163c78] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-blue-200">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Settle Credit Note & Ledger Adjustment</h3>
              <p className="text-xs text-blue-200">
                Apply return scrap/salvage percentage policy and approve credit
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Note Summary Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Credit Note</span>
                <span className="text-sm font-bold font-mono text-slate-800">{note.cnNo}</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Original Claim Total</span>
                <span className="text-base font-extrabold text-slate-900">{formatCurrency(originalTotal)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/80">
              <div>
                <span className="text-slate-500">Retailer / Party:</span>{' '}
                <span className="font-semibold text-slate-800">{note.customerName}</span>
              </div>
              <div>
                <span className="text-slate-500">Against Invoice:</span>{' '}
                <span className="font-mono font-medium text-slate-700">{note.againstInvoiceNo || 'N/A'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500">Return Reason:</span>{' '}
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800 ml-1">
                  {note.reason || 'Sales Return'}
                </span>
              </div>
            </div>
          </div>

          {/* Percentage Dropdown Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-[#163c78]" />
                Select Return Credit Percentage *
              </label>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Applied Rate: {activePercentage}%
              </span>
            </div>

            <select
              value={selectedPreset}
              onChange={(e) => handlePresetChange(Number(e.target.value))}
              className="w-full text-sm font-medium border border-slate-300 rounded-xl p-3 bg-white text-slate-800 focus:ring-2 focus:ring-[#163c78] focus:border-[#163c78] shadow-sm"
            >
              {PERCENT_OPTIONS.map((opt, i) => (
                <option key={i} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Custom Percentage Input if chosen */}
            {selectedPreset === -1 && (
              <div className="mt-2 flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-xs font-semibold text-slate-700">Enter Custom Rate (%):</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={customPct}
                  onChange={(e) => handleCustomChange(Number(e.target.value))}
                  className="w-24 text-sm font-bold text-slate-900 border border-slate-300 rounded px-2.5 py-1"
                  required
                />
                <span className="text-xs text-slate-500">% of original claim</span>
              </div>
            )}
          </div>

          {/* Calculation Breakdown Card */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-blue-50/40 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 border-b border-emerald-100 pb-2">
              <span>Financial Impact Breakdown</span>
              <span className="text-emerald-700 font-bold">{activePercentage}% Approved</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded-lg border border-emerald-200 shadow-sm">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Approved Credit to Ledger
                </span>
                <span className="text-xl font-black text-emerald-600 block mt-0.5">
                  {formatCurrency(calculatedSettlement)}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Reduces party outstanding dues
                </span>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Scrap / Destruction Loss
                </span>
                <span className="text-xl font-black text-slate-600 block mt-0.5">
                  {formatCurrency(deductionAmount)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {100 - activePercentage}% policy write-off
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-emerald-900 bg-emerald-100/60 p-2 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Original: <strong>{formatCurrency(originalTotal)}</strong> &rarr; <strong>{activePercentage}%</strong> = Final Credit:{' '}
                <strong>{formatCurrency(calculatedSettlement)}</strong>
              </span>
            </div>
          </div>

          {/* Remarks / Justification */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Settlement Remarks & Policy Notes
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Settled at 50% recovery as per expiry return policy"
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#163c78]"
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 hover:shadow-lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Recording Settlement...
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4" />
                  Confirm & Settle {formatCurrency(calculatedSettlement)} in Ledger
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
