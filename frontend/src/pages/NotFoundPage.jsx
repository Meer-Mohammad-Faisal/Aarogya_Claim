import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6"><section className="text-center"><p className="text-sm font-semibold text-teal-700">404</p><h1 className="mt-2 text-2xl font-semibold text-slate-950">Page not found</h1><p className="mt-2 text-sm text-slate-600">The page you requested does not exist.</p><Link to="/login" className="mt-6 inline-flex rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800">Return to sign in</Link></section></main>;
}
