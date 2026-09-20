import { useCallback, useEffect, useMemo, useState } from 'react';
import { InsurerReviewPanel } from '../components/InsurerReviewPanel.jsx';
import { SummaryCard } from '../components/SummaryCard.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { formatCurrency, formatDate } from '../components/ClaimList.jsx';
import { getAllClaims, getClaimById } from '../services/claims.js';

const emptyFilters = { status: '', from: '', to: '', minAmount: '', maxAmount: '' };

export function InsurerPage() {
  const [filters, setFilters] = useState(emptyFilters);
  const [draftFilters, setDraftFilters] = useState(emptyFilters);
  const [claims, setClaims] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedClaimId, setSelectedClaimId] = useState(null);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const [confirmation, setConfirmation] = useState('');

  const loadClaims = useCallback(async (nextFilters = filters) => {
    setIsLoading(true);
    setLoadError('');
    try {
      setClaims(await getAllClaims(nextFilters));
    } catch (error) {
      setLoadError(error.response?.data?.message || 'We could not load claims.');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadClaims(filters); }, [filters, loadClaims]);

  const summary = useMemo(() => ({
    total: claims.length,
    pending: claims.filter((claim) => claim.status === 'Pending').length,
    approved: claims.filter((claim) => claim.status === 'Approved').length,
    rejected: claims.filter((claim) => claim.status === 'Rejected').length,
  }), [claims]);

  const handleFilterChange = (event) => {
    setDraftFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const applyFilters = (event) => {
    event.preventDefault();
    setConfirmation('');
    setFilters({ ...draftFilters });
  };

  const resetFilters = () => {
    setDraftFilters(emptyFilters);
    setFilters(emptyFilters);
    setConfirmation('');
  };

  const openClaim = async (claimId) => {
    setSelectedClaimId(claimId);
    setSelectedClaim(null);
    setDetailsError('');
    setDetailsLoading(true);
    try {
      setSelectedClaim(await getClaimById(claimId));
    } catch (error) {
      setDetailsError(error.response?.data?.message || 'We could not load this claim.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleUpdated = (updatedClaim) => {
    setSelectedClaim(updatedClaim);
    setConfirmation(`Claim #${updatedClaim._id.slice(-8)} updated to ${updatedClaim.status}.`);
    loadClaims(filters);
  };

  const retryDetails = () => { if (selectedClaimId) openClaim(selectedClaimId); };

  return (
    <>
      <section className="mb-8 flex flex-col justify-between gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-end"><div><p className="mb-2 text-sm font-semibold text-teal-700">Claims Management</p><h1 className="text-3xl font-semibold tracking-tight text-slate-950">Review submitted claims</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Search, review, and record decisions on patient claims from one focused workspace.</p></div></section>
      {confirmation && <div role="status" className="mb-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{confirmation}</div>}
      <section aria-label="Claim summary" className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4"><SummaryCard label="Total claims" value={summary.total} /><SummaryCard label="Pending" value={summary.pending} tone="amber" /><SummaryCard label="Approved" value={summary.approved} tone="emerald" /><SummaryCard label="Rejected" value={summary.rejected} tone="red" /></section>
      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="mb-5"><h2 className="text-base font-semibold text-slate-950">Filter claims</h2><p className="mt-1 text-sm text-slate-500">Filters are applied on the claims service.</p></div><form onSubmit={applyFilters} className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"><label className="text-sm font-medium text-slate-700">Status<select name="status" value={draftFilters.status} onChange={handleFilterChange} className="mt-1.5 block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100"><option value="">All statuses</option><option>Pending</option><option>Approved</option><option>Rejected</option></select></label><label className="text-sm font-medium text-slate-700">From date<input name="from" type="date" value={draftFilters.from} onChange={handleFilterChange} className="mt-1.5 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm font-normal text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100" /></label><label className="text-sm font-medium text-slate-700">To date<input name="to" type="date" value={draftFilters.to} onChange={handleFilterChange} className="mt-1.5 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm font-normal text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100" /></label><label className="text-sm font-medium text-slate-700">Minimum amount<input name="minAmount" type="number" min="0" step="0.01" value={draftFilters.minAmount} onChange={handleFilterChange} placeholder="0" className="mt-1.5 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm font-normal text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100" /></label><label className="text-sm font-medium text-slate-700">Maximum amount<input name="maxAmount" type="number" min="0" step="0.01" value={draftFilters.maxAmount} onChange={handleFilterChange} placeholder="No limit" className="mt-1.5 block w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm font-normal text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100" /></label><div className="flex flex-wrap items-end gap-3 md:col-span-2 xl:col-span-5"><button type="submit" className="rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2">Apply Filters</button><button type="button" onClick={resetFilters} className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Reset Filters</button></div></form></section>
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6"><div><h2 className="text-base font-semibold text-slate-950">Claims queue</h2><p className="mt-1 text-sm text-slate-500">{isLoading ? 'Loading claims…' : `${claims.length} claim${claims.length === 1 ? '' : 's'} in this view`}</p></div>{isLoading && <span className="text-sm text-slate-500">Loading…</span>}</div>{loadError && <div role="alert" className="m-5 flex flex-col gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"><span>{loadError}</span><button type="button" onClick={() => loadClaims(filters)} className="self-start rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-100">Retry</button></div>}{isLoading ? <TableLoading /> : !loadError && (claims.length ? <ClaimsTable claims={claims} onOpen={openClaim} /> : <EmptyClaims />)}</section>
      {selectedClaimId && <InsurerReviewPanel claim={selectedClaim} isLoading={detailsLoading} error={detailsError} onClose={() => setSelectedClaimId(null)} onRetry={retryDetails} onUpdated={handleUpdated} />}
    </>
  );
}

function ClaimsTable({ claims, onOpen }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 sm:px-6">Patient</th><th className="px-5 py-3">Claim amount</th><th className="px-5 py-3">Submission date</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Approved amount</th><th className="px-5 py-3 sm:px-6">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{claims.map((claim) => <tr key={claim._id} className="hover:bg-slate-50"><td className="px-5 py-4 sm:px-6"><p className="text-sm font-semibold text-slate-900">{claim.name}</p><p className="mt-1 text-xs text-slate-500">{claim.email}</p></td><td className="px-5 py-4 text-sm font-medium text-slate-900">{formatCurrency(claim.claimAmount)}</td><td className="px-5 py-4 text-sm text-slate-600">{formatDate(claim.submissionDate)}</td><td className="px-5 py-4"><StatusBadge status={claim.status} /></td><td className="px-5 py-4 text-sm text-slate-700">{claim.approvedAmount !== null && claim.approvedAmount !== undefined ? formatCurrency(claim.approvedAmount) : '—'}</td><td className="px-5 py-4 sm:px-6"><button type="button" onClick={() => onOpen(claim._id)} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800">Review</button></td></tr>)}</tbody></table></div>;
}

function TableLoading() { return <div className="space-y-3 p-5" aria-label="Loading claims"><div className="h-12 animate-pulse rounded bg-slate-100" /><div className="h-12 animate-pulse rounded bg-slate-100" /><div className="h-12 animate-pulse rounded bg-slate-100" /></div>; }
function EmptyClaims() { return <div className="px-6 py-16 text-center"><p className="text-base font-semibold text-slate-900">No claims match these filters.</p><p className="mt-2 text-sm text-slate-500">Try resetting the filters or widening the search criteria.</p></div>; }
