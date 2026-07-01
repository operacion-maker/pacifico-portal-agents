"use client";

import type { ComponentPropsWithoutRef } from "react";

export function Table(props: ComponentPropsWithoutRef<"table">) {
  return (
    <div className="overflow-x-auto my-3 rounded-lg border border-border">
      <table className="w-full text-sm" {...props} />
    </div>
  );
}

export function TableHead(props: ComponentPropsWithoutRef<"thead">) {
  return <thead className="bg-slate-50 border-b border-border" {...props} />;
}

export function TableHeader(props: ComponentPropsWithoutRef<"th">) {
  return (
    <th
      className="px-4 py-2 text-left text-xs font-semibold text-muted uppercase tracking-wider"
      {...props}
    />
  );
}

export function TableRow(props: ComponentPropsWithoutRef<"tr">) {
  return <tr className="border-b border-border last:border-0 hover:bg-card-hover/50" {...props} />;
}

export function TableCell(props: ComponentPropsWithoutRef<"td">) {
  return <td className="px-4 py-2 text-foreground" {...props} />;
}
