export default function AccessDenied() {
  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-600">
          Access Denied
        </h1>

        <p className="mt-4 text-slate-600">
          You do not have permission to access this page.
        </p>
      </div>
    </div>
  );
}