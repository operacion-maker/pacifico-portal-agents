"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import dynamic from "next/dynamic";
import { CodeBlock } from "./CodeBlock";
import { MermaidBlock } from "./MermaidBlock";
import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "./TableBlock";
import type { Components } from "react-markdown";

// Lazy-load MetaBuilder widgets — only loaded when a metabuilder-* block appears in chat
const DraftReviewCard = dynamic(() =>
  import("../agents/metabuilder/DraftReviewCard").then((m) => ({ default: m.DraftReviewCard }))
);
const QualityScoreCard = dynamic(() =>
  import("../agents/metabuilder/QualityScoreCard").then((m) => ({ default: m.QualityScoreCard }))
);
const GovernanceStatusCard = dynamic(() =>
  import("../agents/metabuilder/GovernanceStatusCard").then((m) => ({ default: m.GovernanceStatusCard }))
);
const HITLReviewCard = dynamic(() =>
  import("../agents/metabuilder/HITLReviewCard").then((m) => ({ default: m.HITLReviewCard }))
);
const PipelineProgressTracker = dynamic(() =>
  import("../agents/metabuilder/PipelineProgressTracker").then((m) => ({ default: m.PipelineProgressTracker }))
);
const TableInputCard = dynamic(() =>
  import("../agents/metabuilder/TableInputCard").then((m) => ({ default: m.TableInputCard }))
);

interface MarkdownRendererProps {
  content: string;
}

const components: Components = {
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || "");
    const code = String(children).replace(/\n$/, "");

    // Inline code
    if (!match && !className) {
      return (
        <code className="bg-slate-100 px-1.5 py-0.5 rounded text-primary text-sm font-mono" {...props}>
          {children}
        </code>
      );
    }

    const language = match ? match[1] : "";

    if (language.startsWith("metabuilder-")) {
      try {
        const data = JSON.parse(code);
        switch (language) {
          case "metabuilder-pipeline":
            return <PipelineProgressTracker {...data} />;
          case "metabuilder-draft":
            return <DraftReviewCard {...data} />;
          case "metabuilder-quality":
            return <QualityScoreCard {...data} />;
          case "metabuilder-governance":
            return <GovernanceStatusCard {...data} />;
          case "metabuilder-hitl":
            return <HITLReviewCard {...data} />;
          case "metabuilder-table-input":
            return <TableInputCard {...data} />;
        }
      } catch (e) {
        console.error("Failed to parse metabuilder block", e);
      }
    }

    if (language === "mermaid") {
      return <MermaidBlock code={code} />;
    }

    return <CodeBlock language={language} code={code} />;
  },

  pre({ children }) {
    return <>{children}</>;
  },

  table: Table,
  thead: TableHead,
  th: TableHeader,
  tr: TableRow,
  td: TableCell,

  h2({ children }) {
    return <h2 className="text-lg font-bold text-foreground mt-6 mb-3">{children}</h2>;
  },
  h3({ children }) {
    return <h3 className="text-base font-semibold text-foreground mt-4 mb-2">{children}</h3>;
  },
  p({ children }) {
    return <p className="text-sm text-foreground/90 leading-relaxed mb-3">{children}</p>;
  },
  ul({ children }) {
    return <ul className="list-disc list-outside pl-6 space-y-1.5 mb-3 text-sm text-foreground/90">{children}</ul>;
  },
  ol({ children }) {
    return <ol className="list-decimal list-outside pl-6 space-y-1.5 mb-3 text-sm text-foreground/90">{children}</ol>;
  },
  li({ children }) {
    return <li className="leading-relaxed pl-1">{children}</li>;
  },
  blockquote({ children }) {
    return (
      <blockquote className="border-l-2 border-primary/50 pl-4 my-3 text-sm text-muted italic">
        {children}
      </blockquote>
    );
  },
  strong({ children }) {
    return <strong className="font-semibold text-foreground">{children}</strong>;
  },
  a({ children, href }) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-hover underline">
        {children}
      </a>
    );
  },
  hr() {
    return <hr className="border-border my-4" />;
  },
};

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  );
}
