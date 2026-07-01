"use client";

import { useEffect, useRef } from "react";

interface Neuron {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseOpacity: number;
  pulsePhase: number;
  layer: number;
}

export function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let neurons: Neuron[] = [];
    let time = 0;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = canvas.parentElement?.scrollHeight || window.innerHeight * 3;
    }

    function createNeurons() {
      if (!canvas) return;

      const area = canvas.width * canvas.height;
      const count = Math.min(Math.floor(area / 8000), 150);

      neurons = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 2.5 + 1,
        baseOpacity: Math.random() * 0.15 + 0.08,
        pulsePhase: Math.random() * Math.PI * 2,
        layer: Math.floor(Math.random() * 3),
      }));
    }

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const connectionDist = 180;
      const strongDist = 100;

      // --- Synaptic connections ---
      for (let i = 0; i < neurons.length; i++) {
        for (let j = i + 1; j < neurons.length; j++) {
          const dx = neurons[i].x - neurons[j].x;
          const dy = neurons[i].y - neurons[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDist) {
            const t = 1 - dist / connectionDist;
            const isStrong = dist < strongDist;

            // Pulse traveling along connection
            const pulse = Math.sin(time * 0.02 + neurons[i].pulsePhase + dist * 0.02);
            const pulseBoost = pulse > 0.7 ? (pulse - 0.7) * 0.15 : 0;

            const opacity = t * (isStrong ? 0.12 : 0.06) + pulseBoost;

            ctx.strokeStyle = `rgba(8, 145, 178, ${opacity})`;
            ctx.lineWidth = isStrong ? 1 : 0.5;
            ctx.beginPath();
            ctx.moveTo(neurons[i].x, neurons[i].y);
            ctx.lineTo(neurons[j].x, neurons[j].y);
            ctx.stroke();

            // Signal dot traveling along strong connections
            if (isStrong && pulse > 0.8) {
              const signalPos = (Math.sin(time * 0.03 + neurons[i].pulsePhase) + 1) / 2;
              const sx = neurons[i].x + (neurons[j].x - neurons[i].x) * signalPos;
              const sy = neurons[i].y + (neurons[j].y - neurons[i].y) * signalPos;
              ctx.beginPath();
              ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(8, 145, 178, ${0.2 + pulseBoost})`;
              ctx.fill();
            }
          }
        }
      }

      // --- Neurons (nodes) ---
      for (const n of neurons) {
        const pulse = Math.sin(time * 0.025 + n.pulsePhase);
        const opacity = n.baseOpacity + pulse * 0.04;
        const r = n.radius + pulse * 0.4;

        // Outer glow
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(8, 145, 178, ${opacity * 0.15})`;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(8, 145, 178, ${opacity})`;
        ctx.fill();

        // Bright center
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(8, 145, 178, ${opacity * 1.5})`;
        ctx.fill();
      }
    }

    function update() {
      if (!canvas) return;
      time++;

      for (const n of neurons) {
        n.x += n.vx;
        n.y += n.vy;

        if (n.x < -20) n.x = canvas.width + 20;
        if (n.x > canvas.width + 20) n.x = -20;
        if (n.y < -20) n.y = canvas.height + 20;
        if (n.y > canvas.height + 20) n.y = -20;
      }
    }

    function animate() {
      update();
      draw();
      animationId = requestAnimationFrame(animate);
    }

    resize();
    createNeurons();
    animate();

    const handleResize = () => {
      resize();
      createNeurons();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
      aria-hidden="true"
    />
  );
}
