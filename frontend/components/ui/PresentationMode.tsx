"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function PresentationMode() {
  const [isPresentation, setIsPresentation] = useState(false);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "D" && e.shiftKey && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsPresentation((prev) => {
          const next = !prev;
          if (next) {
            document.documentElement.classList.add("presentation-mode");
          } else {
            document.documentElement.classList.remove("presentation-mode");
          }
          setToast(true);
          setTimeout(() => setToast(false), 2000);
          return next;
        });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] glass-panel px-5 py-2.5 rounded-full border border-primary/30 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-primary text-[16px]">
            {isPresentation ? "theater_comedy" : "laptop"}
          </span>
          <span className="font-data-label text-data-label uppercase text-on-surface">
            {isPresentation ? "Presentation Mode ON" : "Presentation Mode OFF"}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
