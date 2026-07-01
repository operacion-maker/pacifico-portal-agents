"use client";

import { motion } from "framer-motion";
import { BookOpen, MessageSquare, BarChart3 } from "lucide-react";

const features = [
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
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function Features() {
  return (
    <section className="relative py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Capacidades
          </h2>
          <p className="text-muted max-w-lg mx-auto">
            ModelatorX combina inteligencia artificial con acceso directo
            a tus datos empresariales.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="group rounded-2xl border border-border bg-white p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
