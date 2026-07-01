import { BookOpen, MessageSquare, BarChart3, Database, GitBranch, Table2, Search, CheckCircle2, FileText, Shield } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────

export interface Suggestion {
  icon: LucideIcon;
  label: string;
  text: string;
  color: string;
}

export interface GreetingConfig {
  title: string;
  highlightName: string;
  subtitle: string;
  bullets: string[];
  footer: string;
  avatar: string;
}

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface AgentConfig {
  id: string;
  name: string;
  tagline: string;
  description: string;
  avatar: string;
  accentColor: string;
  gradientFrom: string;
  gradientTo: string;
  category: "data-modeling" | "governance" | "analytics" | "custom";
  status: "active" | "coming-soon" | "beta";
  requiredRoles: string[];
  chatConfig: {
    placeholder: string;
    suggestions: Suggestion[];
    greeting: GreetingConfig;
    endpoint: string;
  };
  features: Feature[];
}

// ── Agent Definitions ────────────────────────────────────────────────

const MODELATORX: AgentConfig = {
  id: "modelatorx",
  name: "ModelatorX",
  tagline: "Asistente inteligente de Data & Analytics",
  description:
    "Consulta documentos, explora el universo de datos y genera modelos dimensionales con diagramas al instante.",
  avatar: "/torito.png",
  accentColor: "#0891b2",
  gradientFrom: "#0891b2",
  gradientTo: "#9333ea",
  category: "data-modeling",
  status: "active",
  requiredRoles: ["data-engineer", "data-analyst", "admin"],
  chatConfig: {
    placeholder: "Escribe tu pregunta...",
    endpoint: "/api/agents/modelatorx/chat",
    suggestions: [
      {
        icon: BookOpen,
        label: "Documentación",
        text: "¿Qué lineamientos de nomenclatura aplican para tablas y campos?",
        color: "text-cyan-600 bg-cyan-50 border-cyan-200 hover:bg-cyan-100",
      },
      {
        icon: Database,
        label: "Explorar datos",
        text: "¿Qué tablas existen en el dominio de pólizas?",
        color: "text-purple-600 bg-purple-50 border-purple-200 hover:bg-purple-100",
      },
      {
        icon: GitBranch,
        label: "Modelamiento",
        text: "Diseña un modelo estrella para el proceso de siniestros",
        color: "text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100",
      },
      {
        icon: BarChart3,
        label: "Análisis",
        text: "¿Qué variables tiene la tabla de pólizas y qué significan?",
        color: "text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100",
      },
    ],
    greeting: {
      title: "¡Hola! Soy",
      highlightName: "ModelatorX",
      subtitle:
        "Asistente inteligente del equipo de Data & Analytics de Pacífico. Estoy aquí para ayudarte con todo lo relacionado con modelado asociado a productos de datos en la capa DDV, así como para explorar los conceptos de negocio disponibles en nuestro lakehouse.",
      bullets: [
        "Lineamientos y convenciones de nombres de tablas, columnas o dominios.",
        "Descubrir qué conceptos de negocio están disponibles en el lakehouse y cómo se relacionan.",
        "Apoyo en el proceso de modelamiento para productos de datos.",
      ],
      footer:
        "Solo dime qué necesitas y con gusto te apoyaré. ¡Vamos a trabajar para que tus datos estén siempre bien estructurados y gobernados! 🚀",
      avatar: "/torito.png",
    },
  },
  features: [
    {
      icon: BookOpen,
      title: "Base de Conocimiento",
      description:
        "Accede a documentos, políticas y procedimientos indexados con búsqueda semántica de alta precisión.",
    },
    {
      icon: MessageSquare,
      title: "Chat Inteligente",
      description:
        "Conversaciones naturales con streaming en tiempo real. El agente decide automáticamente qué herramienta usar.",
    },
    {
      icon: BarChart3,
      title: "Visualizaciones",
      description:
        "Respuestas enriquecidas con tablas markdown, diagramas Mermaid, bloques de código y exportación a SVG/PNG.",
    },
  ],
};

const METABUILDER: AgentConfig = {
  id: "metabuilder",
  name: "MetaBuilder",
  tagline: "Gobernanza inteligente de metadatos del Lakehouse",
  description:
    "Genera, evalúa y publica metadatos funcionales para tablas y columnas del Unity Catalog usando un patrón Reflexion con revisión humana.",
  avatar: "/torito.png",
  accentColor: "#0891b2",
  gradientFrom: "#0891b2",
  gradientTo: "#06b6d4",
  category: "governance",
  status: "beta",
  requiredRoles: ["data-engineer", "data-steward", "admin"],
  chatConfig: {
    placeholder: "Ingresa una tabla: catalog.schema.table",
    endpoint: "/api/agents/metabuilder/chat",
    suggestions: [
      {
        icon: Table2,
        label: "Documentar tabla",
        text: "Genera la documentación de la tabla udv_desa.sch_udv_tbl.ha_jerarquia_producto_gen_core",
        color: "text-cyan-600 bg-cyan-50 border-cyan-200 hover:bg-cyan-100",
      },
      {
        icon: Search,
        label: "Explorar metadatos",
        text: "¿Qué tablas del esquema sch_udv_tbl carecen de comentarios?",
        color: "text-cyan-600 bg-cyan-50/80 border-cyan-200 hover:bg-cyan-100",
      },
      {
        icon: CheckCircle2,
        label: "Evaluar calidad",
        text: "Evalúa la calidad de los metadatos actuales de udv_desa.sch_udv_tbl.ha_polizas",
        color: "text-teal-600 bg-teal-50 border-teal-200 hover:bg-teal-100",
      },
      {
        icon: Shield,
        label: "Validar gobernanza",
        text: "¿La tabla ha_siniestros cumple con los 7 principios de gobernanza?",
        color: "text-sky-600 bg-sky-50 border-sky-200 hover:bg-sky-100",
      },
    ],
    greeting: {
      title: "¡Hola! Soy",
      highlightName: "MetaBuilder",
      subtitle:
        "Agente de gobernanza inteligente de metadatos. Automatizo el ciclo de vida del metadato funcional: desde la recolección de contexto técnico hasta la publicación en Unity Catalog, con evaluación de calidad y revisión humana.",
      bullets: [
        "Genera drafts de comentarios para tablas y columnas con IA.",
        "Evalúa la calidad contra 4 pilares: Claridad, Propósito, Detalle y Contexto.",
        "Valida cumplimiento de los 7 Principios de Gobernanza de Pacífico.",
        "Publica automáticamente con ALTER TABLE tras aprobación del Data Steward.",
      ],
      footer:
        "Indica una tabla en formato catalog.schema.table y comenzaré el proceso de documentación inteligente. 📋",
      avatar: "/torito.png",
    },
  },
  features: [
    {
      icon: FileText,
      title: "Auto-documentación",
      description:
        "Genera drafts de comentarios para tablas y columnas analizando esquema, profiling y lineage.",
    },
    {
      icon: CheckCircle2,
      title: "Evaluación de Calidad",
      description:
        "LLM-as-a-Judge evalúa cada draft contra 4 pilares de gobernanza con scores de 0 a 1.",
    },
    {
      icon: Shield,
      title: "Review HITL",
      description:
        "El Data Steward aprueba, rechaza o solicita rework en un flujo interactivo dentro del chat.",
    },
  ],
};

// ── Registry ─────────────────────────────────────────────────────────

const AGENT_REGISTRY: Record<string, AgentConfig> = {
  modelatorx: MODELATORX,
  metabuilder: METABUILDER,
};

/**
 * Get the configuration for a specific agent.
 */
export function getAgentConfig(agentId: string): AgentConfig | undefined {
  return AGENT_REGISTRY[agentId];
}

/**
 * Get all registered agents.
 */
export function getAllAgents(): AgentConfig[] {
  return Object.values(AGENT_REGISTRY);
}

/**
 * Get agents accessible to a given set of roles.
 */
export function getAccessibleAgents(userRoles: string[]): AgentConfig[] {
  return getAllAgents().filter((agent) =>
    agent.requiredRoles.some(
      (role) => userRoles.includes(role) || userRoles.includes("admin")
    )
  );
}

/**
 * Check if a user with the given roles can access a specific agent.
 */
export function canAccessAgent(
  agentId: string,
  userRoles: string[]
): boolean {
  const agent = getAgentConfig(agentId);
  if (!agent) return false;
  if (userRoles.includes("admin")) return true;
  return agent.requiredRoles.some((role) => userRoles.includes(role));
}

/**
 * Get all valid agent IDs for static params generation.
 */
export function getAgentIds(): string[] {
  return Object.keys(AGENT_REGISTRY);
}
