import { useEffect, useState } from 'react';
import { formatCurrency, formatDate } from './ClaimList.jsx';
import { StatusBadge } from './StatusBadge.jsx';
import { updateClaimStatus } from '../services/claims.js';

const statuses = ['Pending', 'Approved', 'Rejected'];

export function InsurerReviewPanel({ claim, isLoading, error, onClose, onRetry, onUpdated }) {
  const [form, setForm] = useState({ status: 'Pending', approvedAmount: '', insurerComments: '' });
  const [validationError, setValidationError] = useState('');
  const [serverError, setServerError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [confirmingRejection, setConfirmingRejection] = useState(false);

  useEffect(() => {
    if (!claim) return;
    setForm({ status: claim.status, approvedAmount: claim.approvedAmount ?? '', insurerComments: claim.insurerComments || '' });
    setValidationError('');
    setServerError('');
    setConfirmingRejection(false);
  }, [claim]);

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
      ...(event.target.name === 'status' && event.target.value !== 'Approved' ? { approvedAmount: '' } : {}),
    }));
    setValidationError('');
    setServerError('');
    setConfirmingRejection(false);
  };

  const validate = (nextStatus = form.status) => {
    if (nextStatus === 'Approved') {
      if (form.approvedAmount === '' || form.approvedAmount === null) return 'Enter an approved amount before approving this claim.';
      const amount = Number(form.approvedAmount);
      if (!Number.isFinite(amount) || amount < 0) return 'Approved amount must be zero or greater.';
      if (amount > claim.claimAmount) return 'Approved amount cannot exceed the requested claim amount.';
    }

    if (nextStatus === 'Pending' && form.approvedAmount !== '' && Number(form.approvedAmount) !== 0) return 'Pending claims cannot have an approved amount.';
    return '';
  };

  const save = async (nextStatus = form.status) => {
    const nextError = validate(nextStatus);
    if (nextError) { setValidationError(nextError); return; }

    setIsSaving(true);
    setServerError('');
    try {
      const updatedClaim = await updateClaimStatus(claim._id, {
        status: nextStatus,
        approvedAmount: nextStatus === 'Approved' ? Number(form.approvedAmount) : null,
        insurerComments: form.insurerComments,
      });
      setForm({ status: updatedClaim.status, approvedAmount: updatedClaim.approvedAmount ?? '', insurerComments: updatedClaim.insurerComments || '' });
      onUpdated(updatedClaim);
    } catch (requestError) {
      setServerError(requestError.response?.data?.message || 'We could not update this claim. Please try again.');
    } finally {
      setIsSaving(false);
      setConfirmingRejection(false);
    }
  };

  const handleAction = (nextStatus) => {
    setForm((current) => ({ ...current, status: nextStatus, approvedAmount: nextStatus === 'Rejected' ? '' : current.approvedAmount }));
    setValidationError('');
    if (nextStatus === 'Rejected') setConfirmingRejection(true);
    else save(nextStatus);
  };

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="review-panel-title"><div className="max-h-[94vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:max-w-3xl sm:rounded-xl"><div className="flex items-start justify-between border-b border-slate-200 px-5 py-5 sm:px-7"><div><p className="font-mono text-xs font-semibold text-teal-700">{claim ? `Claim #${claim._id.slice(-8)}` : 'Claim review'}</p><h2 id="review-panel-title" className="mt-1 text-xl font-semibold text-slate-950">Review claim</h2></div><button type="button" onClick={onClose} aria-label="Close claim review" className="rounded-md p-2 text-xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700">×</button></div>{isLoading && <div className="px-6 py-16 text-center text-sm text-slate-500">Loading claim details…</div>}{error && <div className="px-6 py-12 text-center"><p className="text-sm text-red-600">{error}</p><button type="button" onClick={onRetry} className="mt-4 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Retry</button></div>}{claim && !isLoading && !error && <PanelContent claim={claim} form={form} errors={{ validationError, serverError }} isSaving={isSaving} confirmingRejection={confirmingRejection} onChange={handleChange} onAction={handleAction} onSave={() => form.status === 'Rejected' ? setConfirmingRejection(true) : save()} onConfirmReject={() => save('Rejected')} onCancelReject={() => setConfirmingRejection(false)} />}</div></div>;
}

function PanelContent({ claim, form, errors, isSaving, confirmingRejection, onChange, onAction, onSave, onConfirmReject, onCancelReject }) {
  return <div className="space-y-7 px-5 py-6 sm:px-7"><div className="flex flex-wrap items-center justify-between gap-3"><StatusBadge status={claim.status} /><p className="text-sm text-slate-500">Submitted {formatDate(claim.submissionDate)}</p></div><div className="grid gap-4 sm:grid-cols-2"><Detail label="Patient name" value={claim.name} /><Detail label="Patient email" value={claim.email} /><Detail label="Claim amount" value={formatCurrency(claim.claimAmount)} /><Detail label="Claim ID" value={claim._id} /></div><div><h3 className="text-sm font-semibold text-slate-900">Description</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{claim.description}</p></div><div className="border-t border-slate-100 pt-6"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-base font-semibold text-slate-950">Supporting document</h3><a href={claim.document} target="_blank" rel="noreferrer" className="rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-100">Open document</a></div></div><div className="border-t border-slate-100 pt-6"><h3 className="text-base font-semibold text-slate-950">Decision</h3><p className="mt-1 text-sm text-slate-500">Update the review outcome and record your comments.</p>{errors.validationError && <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{errors.validationError}</p>}{errors.serverError && <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{errors.serverError}</p>}<div className="mt-5 grid gap-5 sm:grid-cols-2"><label className="text-sm font-medium text-slate-700">Status<select name="status" value={form.status} onChange={onChange} className="mt-1.5 block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100">{statuses.map((status) => <option key={status}>{status}</option>)}</select></label><label className="text-sm font-medium text-slate-700">Approved amount<input name="approvedAmount" type="number" min="0" step="0.01" value={form.approvedAmount} onChange={onChange} className="mt-1.5 block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100" placeholder="Required when approved" /></label><label className="text-sm font-medium text-slate-700 sm:col-span-2">Insurer comments<textarea name="insurerComments" value={form.insurerComments} onChange={onChange} rows="4" className="mt-1.5 block w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100" placeholder="Add context for the patient and audit trail." /></label></div><div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-between"><div className="flex flex-col gap-2 sm:flex-row"><button type="button" onClick={() => onAction('Approved')} disabled={isSaving} className="rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">Approve</button><button type="button" onClick={() => onAction('Rejected')} disabled={isSaving} className="rounded-md bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60">Reject</button></div><button type="button" onClick={onSave} disabled={isSaving} className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">{isSaving ? 'Saving…' : 'Save / Update'}</button></div>{confirmingRejection && <div role="alertdialog" className="mt-4 rounded-md border border-red-200 bg-red-50 p-4"><p className="text-sm font-semibold text-red-900">Reject this claim?</p><p className="mt-1 text-sm text-red-700">This will mark the claim as rejected and clear any approved amount.</p><div className="mt-3 flex gap-3"><button type="button" onClick={onConfirmReject} disabled={isSaving} className="rounded-md bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800">Confirm rejection</button><button type="button" onClick={onCancelReject} className="rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700">Cancel</button></div></div>}</div></div>;
}

function Detail({ label, value }) { return <div className="rounded-lg bg-slate-50 px-4 py-3"><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-1 break-words text-sm font-medium text-slate-900">{value}</p></div>; }
