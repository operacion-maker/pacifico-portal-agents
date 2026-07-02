"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ArrowRight, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { getAllAgents, type AgentConfig } from "@/lib/agents/agent-registry";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

function StatusBadge({ status }: { status: AgentConfig["status"] }) {
  const config = {
    active: { label: "Activo", className: "status-active", dot: "bg-emerald-500" },
    beta: { label: "Beta", className: "status-beta", dot: "bg-amber-500" },
    "coming-soon": { label: "Próximamente", className: "status-coming-soon", dot: "bg-slate-400" },
  };
  const { label, className, dot } = config[status];
  return (
    <span className={`status-badge ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

function AgentCard({ agent }: { agent: AgentConfig }) {
  const isAccessible = agent.status !== "coming-soon";
  const [isNavigating, setIsNavigating] = useState(false);

  return (
    <motion.div
      variants={cardVariants}
      className="agent-card group rounded-2xl border border-border bg-white p-6 shadow-sm flex flex-col"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${agent.gradientFrom}15, ${agent.gradientTo}15)` }}
          >
            <Image
              src={agent.avatar}
              alt={agent.name}
              width={32}
              height={32}
              className="w-8 h-8 object-contain"
            />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">{agent.name}</h3>
            <p className="text-xs text-muted">{agent.tagline}</p>
          </div>
        </div>
        <StatusBadge status={agent.status} />
      </div>

      {/* Description */}
      <p className="text-sm text-muted leading-relaxed mb-5 flex-1">
        {agent.description}
      </p>

      {/* Features */}
      <div className="space-y-2 mb-6">
        {agent.features.map((feature) => (
          <div key={feature.title} className="flex items-center gap-2">
            <feature.icon className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-xs text-foreground font-medium">{feature.title}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      {isAccessible ? (
        <Link
          href={`/agents/${agent.id}/chat`}
          onClick={() => setIsNavigating(true)}
          className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-300 ${
            isNavigating 
              ? "bg-slate-400 cursor-not-allowed opacity-90" 
              : "bg-primary hover:bg-primary-hover hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/20"
          }`}
        >
          {isNavigating ? "Cargando..." : "Iniciar"}
          {isNavigating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ArrowRight className="w-4 h-4" />
          )}
        </Link>
      ) : (
        <div className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 text-slate-400 text-sm font-semibold cursor-not-allowed">
          Próximamente
        </div>
      )}
    </motion.div>
  );
}

export function AgentCatalog() {
  const agents = getAllAgents();

  return (
    <section id="catalogo" className="relative py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Catálogo de Agentes
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Elige tu agente
          </h2>
          <p className="text-muted max-w-lg mx-auto">
            Suite de agentes especializados potenciados por IA para el ecosistema de datos de Pacífico.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}

          {/* Placeholder for future agents (up to 3 total) */}
          {agents.length < 3 && (
            <motion.div
              variants={cardVariants}
              className="rounded-2xl border-2 border-dashed border-border bg-card/50 p-6 flex flex-col items-center justify-center text-center min-h-[280px]"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-slate-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-300 mb-2">Próximamente</h3>
              <p className="text-sm text-slate-300">
                Nuevos agentes en desarrollo
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
