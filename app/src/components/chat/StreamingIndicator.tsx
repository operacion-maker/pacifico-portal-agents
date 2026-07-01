"use client";

export function StreamingIndicator() {
  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <div className="flex items-center gap-1.5 text-muted text-sm">
        <div className="dot-animation flex gap-1">
          <span className="block w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="block w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="block w-1.5 h-1.5 rounded-full bg-primary" />
        </div>
        <span className="ml-1">ModelatorX está pensando...</span>
      </div>
    </div>
  );
}
