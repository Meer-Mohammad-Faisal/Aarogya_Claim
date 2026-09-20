import { useRef, useState } from 'react';
import { submitClaim } from '../services/claims.js';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const allowedMimeTypes = new Set(['application/pdf', 'image/jpeg', 'image/png']);
const allowedExtensions = new Set(['.pdf', '.jpg', '.jpeg', '.png']);

export function ClaimForm({ user, onCancel, onSubmitted }) {
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', claimAmount: '', description: '' });
  const [document, setDocument] = useState(null);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    setForm((currentForm) => ({ ...currentForm, [event.target.name]: event.target.value }));
    setErrors((currentErrors) => ({ ...currentErrors, [event.target.name]: '' }));
    setServerError('');
  };

  const handleDocumentChange = (event) => {
    const nextDocument = event.target.files?.[0] || null;
    setDocument(nextDocument);
    setErrors((currentErrors) => ({ ...currentErrors, document: validateDocument(nextDocument) }));
    setServerError('');
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Enter your name.';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) nextErrors.email = 'Enter a valid email address.';
    if (!form.claimAmount || Number(form.claimAmount) <= 0 || !Number.isFinite(Number(form.claimAmount))) nextErrors.claimAmount = 'Enter a claim amount greater than zero.';
    if (!form.description.trim()) nextErrors.description = 'Add a short description of the claim.';
    const documentError = validateDocument(document);
    if (documentError) nextErrors.document = documentError;
    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) { setErrors(nextErrors); return; }

    const payload = new FormData();
    payload.append('name', form.name.trim());
    payload.append('email', form.email.trim());
    payload.append('claimAmount', form.claimAmount);
    payload.append('description', form.description.trim());
    payload.append('document', document);

    setIsSubmitting(true);
    setServerError('');

    try {
      const claim = await submitClaim(payload);
      setForm({ name: user?.name || '', email: user?.email || '', claimAmount: '', description: '' });
      setDocument(null);
      setErrors({});
      if (fileInputRef.current) fileInputRef.current.value = '';
      onSubmitted(claim);
    } catch (error) {
      setServerError(error.response?.data?.message || 'We could not submit your claim. Check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-6 flex items-start justify-between gap-4 border-b border-slate-100 pb-5"><div><h2 className="text-lg font-semibold text-slate-950">Submit a new claim</h2><p className="mt-1 text-sm text-slate-500">Provide the details and supporting document for review.</p></div><button type="button" onClick={onCancel} className="rounded-md px-2 py-1 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700">Close</button></div>
      {serverError && <div role="alert" className="mb-5 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{serverError}</div>}
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="name" label="Name" value={form.name} onChange={handleChange} error={errors.name} />
          <Field id="email" label="Email address" type="email" value={form.email} onChange={handleChange} error={errors.email} />
          <Field id="claimAmount" label="Claim amount" type="number" min="0.01" step="0.01" value={form.claimAmount} onChange={handleChange} error={errors.claimAmount} prefix="₹" />
          <div className="sm:col-span-2"><label htmlFor="description" className="mb-1.5 block text-sm font-medium text-slate-700">Description</label><textarea id="description" name="description" rows="4" value={form.description} onChange={handleChange} aria-invalid={Boolean(errors.description)} className={textareaClass(Boolean(errors.description))} placeholder="Tell us what happened and what the claim is for." />{errors.description && <FieldError id="description-error">{errors.description}</FieldError>}</div>
          <div className="sm:col-span-2"><label htmlFor="document" className="mb-1.5 block text-sm font-medium text-slate-700">Supporting document</label><input ref={fileInputRef} id="document" name="document" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={handleDocumentChange} className="block w-full cursor-pointer rounded-md border border-slate-300 bg-white text-sm text-slate-600 file:mr-4 file:border-0 file:border-r file:border-slate-200 file:bg-slate-50 file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600" /><p className="mt-1.5 text-xs text-slate-500">PDF, JPG, JPEG or PNG up to 5 MB.</p>{document && !errors.document && <p className="mt-1.5 text-xs font-medium text-slate-600">Selected: {document.name} ({formatFileSize(document.size)})</p>}{errors.document && <FieldError id="document-error">{errors.document}</FieldError>}</div>
        </div>
        <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={onCancel} className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button><button type="submit" disabled={isSubmitting} className="rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? 'Submitting claim…' : 'Submit claim'}</button></div>
      </form>
    </section>
  );
}

function Field({ id, label, type = 'text', value, onChange, error, prefix, ...props }) { return <div><label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label><div className="relative">{prefix && <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">{prefix}</span>}<input id={id} name={id} type={type} value={value} onChange={onChange} aria-invalid={Boolean(error)} className={`${inputClass(Boolean(error))} ${prefix ? 'pl-7' : ''}`} {...props} /></div>{error && <FieldError id={`${id}-error`}>{error}</FieldError>}</div>; }
function FieldError({ id, children }) { return <p id={id} className="mt-1.5 text-xs text-red-600">{children}</p>; }
function inputClass(hasError) { return `block w-full rounded-md border bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 ${hasError ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-slate-300 focus:border-teal-600 focus:ring-teal-100'}`; }
function textareaClass(hasError) { return `${inputClass(hasError)} resize-y`; }
function validateDocument(file) { if (!file) return 'Choose a supporting document.'; const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase(); if (!allowedMimeTypes.has(file.type) || !allowedExtensions.has(extension)) return 'Use a PDF, JPG, JPEG, or PNG file.'; if (file.size > MAX_FILE_SIZE) return 'The document must be 5 MB or smaller.'; return ''; }
function formatFileSize(bytes) { return `${(bytes / (1024 * 1024)).toFixed(2)} MB`; }
