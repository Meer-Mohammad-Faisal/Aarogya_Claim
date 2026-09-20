import { useCallback, useEffect, useState } from 'react';
import { ClaimDetails } from '../components/ClaimDetails.jsx';
import { ClaimForm } from '../components/ClaimForm.jsx';
import { ClaimList } from '../components/ClaimList.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getClaimById, getMyClaims } from '../services/claims.js';

export function PatientPage() {
  const { user } = useAuth();
  const [claims, setClaims] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState('');
  const [selectedClaimId, setSelectedClaimId] = useState(null);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');

  const loadClaims = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      setClaims(await getMyClaims());
    } catch (error) {
      setLoadError(error.response?.data?.message || 'We could not load your claims.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadClaims(); }, [loadClaims]);

  const handleSelectClaim = async (claimId) => {
    if (claimId === 'new') {
      setSubmissionMessage('');
      setShowForm(true);
      return;
    }

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

  const handleSubmitted = async () => {
    setSubmissionMessage('Claim submitted successfully. It is now pending review.');
    setShowForm(false);
    await loadClaims();
  };

  const retryDetails = () => {
    if (selectedClaimId) handleSelectClaim(selectedClaimId);
  };

  return (
    <>
      <section className="mb-8 flex flex-col justify-between gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-end">
        <div><p className="mb-2 text-sm font-semibold text-teal-700">Patient portal</p><h1 className="text-3xl font-semibold tracking-tight text-slate-950">Your claims</h1><p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">Track submitted healthcare claims, review decisions, and keep your supporting documents in one place.</p></div>
        <button type="button" onClick={() => { setSubmissionMessage(''); setShowForm(true); }} className="rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2">Submit New Claim</button>
      </section>

      {submissionMessage && <div role="status" className="mb-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{submissionMessage}</div>}
      {showForm && <div className="mb-8"><ClaimForm user={user} onCancel={() => setShowForm(false)} onSubmitted={handleSubmitted} /></div>}

      <section aria-labelledby="claims-list-title">
        <div className="mb-4 flex items-center justify-between gap-4"><div><h2 id="claims-list-title" className="text-lg font-semibold text-slate-950">Submitted claims</h2><p className="mt-1 text-sm text-slate-500">{claims.length ? `${claims.length} claim${claims.length === 1 ? '' : 's'} on file` : 'Your submitted claims will appear here.'}</p></div>{isLoading && <span className="text-sm text-slate-500">Loading…</span>}</div>
        {loadError && <div role="alert" className="mb-4 flex flex-col gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"><span>{loadError}</span><button type="button" onClick={loadClaims} className="self-start rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-100">Retry</button></div>}
        {isLoading ? <LoadingList /> : !loadError && <ClaimList claims={claims} onSelect={handleSelectClaim} />}
      </section>

      {selectedClaimId && <ClaimDetails claim={selectedClaim} isLoading={detailsLoading} error={detailsError} onClose={() => setSelectedClaimId(null)} onRetry={retryDetails} />}
    </>
  );
}

function LoadingList() { return <div className="space-y-3" aria-label="Loading claims"><div className="h-40 animate-pulse rounded-xl border border-slate-200 bg-white" /><div className="h-40 animate-pulse rounded-xl border border-slate-200 bg-white" /></div>; }
