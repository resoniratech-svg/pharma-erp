import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router';
import { AlertTriangle, Home, RefreshCw, ArrowLeft } from 'lucide-react';

export default function ErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  let errorMessage = 'An unexpected error occurred.';
  if (isRouteErrorResponse(error)) {
    errorMessage = error.statusText || error.data?.message || errorMessage;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 animate-in fade-in zoom-in duration-300">
      <div className="w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle className="w-12 h-12 text-rose-600" />
      </div>
      <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Something went wrong!</h2>
      <p className="text-slate-500 text-lg mb-8 max-w-lg text-center bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner overflow-auto max-h-48">
        <code className="text-sm font-mono text-rose-600 break-words">{errorMessage}</code>
      </p>
      
      <div className="flex gap-4">
        <button 
          onClick={() => window.location.reload()} 
          className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all duration-200 shadow-sm"
        >
          <RefreshCw className="w-5 h-5" />
          Try Again
        </button>
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 px-6 py-3 bg-[#163c78] hover:bg-[#112d59] text-white font-bold rounded-xl shadow-lg shadow-[#163c78]/30 transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
          Go Back
        </button>
      </div>
    </div>
  );
}
