"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ChevronDown } from "lucide-react";

export function Hero() {
  const scrollToCatalog = () => {
    document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center px-6">
      <div className="max-w-4xl mx-auto text-center">
        {/* Logos row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center gap-8 mb-10"
        >
          <Image
            src="/dalogo.png"
            alt="Data & Analytics"
            width={180}
            height={80}
            className="h-14 w-auto object-contain"
            priority
          />
          <Image
            src="/frasepacifico.svg"
            alt="Protegemos el mundo de las personas"
            width={168}
            height={87}
            className="h-12 w-auto object-contain"
            priority
          />
        </motion.div>

        {/* Torito + Title */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mb-6"
        >
          <Image
            src="/torito.png"
            alt="Portal de Agentes"
            width={160}
            height={160}
            className="mx-auto h-32 w-auto object-contain drop-shadow-lg"
            priority
          />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl md:text-6xl font-bold leading-tight mb-3 text-foreground"
        >
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Portal de Agentes
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-xl text-muted max-w-2xl mx-auto mb-2"
        >
          Suite de agentes inteligentes de Data &amp; Analytics
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-base text-muted/80 max-w-xl mx-auto mb-10"
        >
          Herramientas especializadas potenciadas por IA para modelado dimensional,
          gobernanza de metadatos y más.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <button
            onClick={scrollToCatalog}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/25"
          >
            Explorar Agentes
            <ChevronDown className="w-5 h-5 animate-bounce" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}

