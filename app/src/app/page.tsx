"use client";

import { NeuralBackground } from "@/components/landing/NeuralBackground";
import { Hero } from "@/components/landing/Hero";
import { AgentCatalog } from "@/components/landing/AgentCatalog";
import { CallToAction } from "@/components/landing/CallToAction";

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <NeuralBackground />
      <div className="relative" style={{ zIndex: 2 }}>
        <Hero />
        <AgentCatalog />
        <CallToAction />
      </div>
    </div>
  );
}

