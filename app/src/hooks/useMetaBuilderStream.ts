"use client";

import { useState, useEffect, useRef } from "react";

export interface ColumnDraft {
  name: string;
  comment: string;
}

export interface GovernanceIndicator {
  status: "pass" | "warn";
  compliance_notes: string[];
}

export interface DraftData {
  tableName: string;
  tableComment: string;
  columns: ColumnDraft[];
  governance_indicator: GovernanceIndicator;
}

export type PipelineStep =
  | "idle"
  | "collect_context"
  | "generate_draft"
  | "human_review"
  | "publish_uc"
  | "completed"
  | "failed";

export interface MetaBuilderStreamState {
  currentStep: PipelineStep;
  draftData: DraftData | null;
  isAwaitingInput: boolean;
  progressMessages: string[];
}

/**
 * Parses the raw text stream from the MetaBuilder agent and extracts structured
 * blocks (pipeline steps, draft data, HITL pauses).
 */
export function useMetaBuilderStream(rawContent: string): MetaBuilderStreamState {
  const [state, setState] = useState<MetaBuilderStreamState>({
    currentStep: "idle",
    draftData: null,
    isAwaitingInput: false,
    progressMessages: [],
  });

  const lastContentRef = useRef<string>("");

  useEffect(() => {
    if (rawContent === lastContentRef.current) return;
    lastContentRef.current = rawContent;

    let currentStep: PipelineStep = "idle";
    let draftData: DraftData | null = null;
    let isAwaitingInput = false;
    const progressMessages: string[] = [];

    // Extract all metabuilder-pipeline blocks
    const pipelineMatches = [...rawContent.matchAll(/```json:metabuilder-pipeline\n([\s\S]*?)\n```/g)];
    for (const match of pipelineMatches) {
      try {
        const parsed = JSON.parse(match[1]) as { currentStep: string };
        currentStep = (parsed.currentStep as PipelineStep) ?? "idle";
      } catch {
        // ignore parse errors
      }
    }

    // Extract metabuilder-draft block (last one wins for rework iterations)
    const draftMatches = [...rawContent.matchAll(/```json:metabuilder-draft\n([\s\S]*?)\n```/g)];
    for (const match of draftMatches) {
      try {
        const parsed = JSON.parse(match[1]) as DraftData;
        draftData = parsed;
      } catch {
        // ignore parse errors
      }
    }

    // Detect HITL pause
    const hitlMatch = /```json:metabuilder-hitl\n([\s\S]*?)\n```/.test(rawContent);
    if (hitlMatch || currentStep === "human_review") {
      isAwaitingInput = true;
    }

    // Extract plain SSE progress messages (lines starting with ⚙️ or 🧠)
    const progressLines = rawContent
      .split("\n")
      .filter((line) => line.startsWith("⚙️") || line.startsWith("🧠") || line.startsWith("✅"));
    progressMessages.push(...progressLines);

    setState({ currentStep, draftData, isAwaitingInput, progressMessages });
  }, [rawContent]);

  return state;
}
