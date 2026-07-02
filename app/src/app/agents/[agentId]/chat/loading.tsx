export default function Loading() {
  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header skeleton */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-white/80 animate-pulse">
          <div className="h-7 w-24 bg-slate-100 rounded" />
          <div className="w-px h-5 bg-border" />
          <div className="h-4 w-28 bg-slate-100 rounded" />
        </div>

        {/* Chat area skeleton */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4 animate-pulse">
            <div className="mx-auto h-14 w-14 rounded-full bg-cyan-100" />
            <div className="h-4 w-40 bg-slate-100 rounded mx-auto" />
            <div className="h-3 w-56 bg-slate-100 rounded mx-auto" />
          </div>
        </div>

        {/* Input skeleton */}
        <div className="border-t border-border bg-slate-50 p-4 animate-pulse">
          <div className="max-w-3xl mx-auto h-10 bg-slate-100 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
