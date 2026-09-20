import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function LoginPage() {
  const { isAuthenticated, isLoading, login, role } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-sm text-slate-500">Checking your session…</main>;
  }

  if (!isLoading && isAuthenticated) {
    return <Navigate to={role === 'insurer' ? '/insurer' : '/patient'} replace />;
  }

  const handleChange = (event) => {
    setForm((currentForm) => ({ ...currentForm, [event.target.name]: event.target.value }));
    setErrors((currentErrors) => ({ ...currentErrors, [event.target.name]: '' }));
    setServerError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};

    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) nextErrors.email = 'Enter a valid email address.';
    if (form.password.length < 8) nextErrors.password = 'Password must be at least 8 characters.';

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setServerError('');

    try {
      const user = await login({ email: form.email.trim(), password: form.password });
      navigate(user.role === 'insurer' ? '/insurer' : '/patient', { replace: true });
    } catch (error) {
      setServerError(error.response?.data?.message || 'Unable to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10 sm:px-8">
      <section className="w-full max-w-md">
        <div className="mb-8">
          <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-teal-700 text-lg font-bold text-white shadow-sm">A</div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">AarogyaID</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Claims operations portal</h1>
          <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600">Sign in to securely manage healthcare insurance claims.</p>
        </div>
        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6"><h2 className="text-lg font-semibold text-slate-950">Welcome back</h2><p className="mt-1 text-sm text-slate-500">Use your AarogyaID account to continue.</p></div>
          {serverError && <div role="alert" className="mb-5 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{serverError}</div>}
          <div className="space-y-5">
            <Field id="email" label="Email address" type="email" value={form.email} onChange={handleChange} error={errors.email} autoComplete="email" placeholder="you@example.com" />
            <Field id="password" label="Password" type="password" value={form.password} onChange={handleChange} error={errors.password} autoComplete="current-password" placeholder="Enter your password" />
          </div>
          <button type="submit" disabled={isSubmitting} className="mt-7 flex w-full items-center justify-center rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-slate-500">Secure access for patients and insurer teams</p>
      </section>
    </main>
  );
}

function Field({ id, label, type, value, onChange, error, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <input id={id} name={id} type={type} value={value} onChange={onChange} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} className={`block w-full rounded-md border bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-slate-300 focus:border-teal-600 focus:ring-teal-100'}`} {...props} />
      {error && <p id={`${id}-error`} className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
