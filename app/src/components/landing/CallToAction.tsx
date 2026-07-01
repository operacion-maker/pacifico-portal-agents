"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Sparkles } from "lucide-react";

export function CallToAction() {
  const scrollToCatalog = () => {
    document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative py-24 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto text-center"
      >
        <div className="rounded-2xl border border-border bg-white p-12 shadow-sm">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            ¿Listo para explorar?
          </h2>
          <p className="text-muted mb-8">
            Selecciona un agente del catálogo y empieza a potenciar tu trabajo con IA.
          </p>
          <button
            onClick={scrollToCatalog}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/25"
          >
            Ver Agentes
            <Sparkles className="w-5 h-5" />
          </button>
        </div>

        {/* Footer logos */}
        <div className="flex items-center justify-center gap-6 mt-10 opacity-60">
          <Image
            src="/dalogo.png"
            alt="Data & Analytics"
            width={120}
            height={50}
            className="h-8 w-auto object-contain"
          />
          <Image
            src="/frasepacifico.svg"
            alt="Protegemos el mundo de las personas"
            width={100}
            height={50}
            className="h-7 w-auto object-contain"
          />
        </div>
      </motion.div>
    </section>
  );
}

