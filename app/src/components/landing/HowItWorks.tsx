"use client";

import { motion } from "framer-motion";
import { HelpCircle, Cpu, FileText } from "lucide-react";

const steps = [
  {
    icon: HelpCircle,
    title: "1. Pregunta",
    description: "Escribe tu consulta en lenguaje natural sobre cualquier tema.",
  },
  {
    icon: Cpu,
    title: "2. Procesamiento",
    description:
      "El agente busca en la base de conocimiento y selecciona la mejor herramienta.",
  },
  {
    icon: FileText,
    title: "3. Respuesta",
    description:
      "Recibe una respuesta estructurada con texto, tablas, diagramas o código.",
  },
];

export function HowItWorks() {
  return (
    <section className="relative py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold text-foreground mb-4">
            ¿Cómo funciona?
          </h2>
          <p className="text-muted max-w-lg mx-auto">
            Un proceso simple de tres pasos para obtener las respuestas que necesitas.
          </p>
        </motion.div>

        <div className="relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0" />

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, idx) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="text-center"
              >
                <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 mb-6">
                  <step.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
