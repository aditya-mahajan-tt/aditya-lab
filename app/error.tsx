"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Phase 7 wires this to error monitoring.
    console.error(error);
  }, [error]);

  return (
    <section className="section">
      <div className="container-lab">
        <p className="label mb-6">SYSTEM FAULT</p>
        <h1 className="text-[length:var(--text-2xl)]">Something in the Lab broke.</h1>
        <p className="prose-lab mt-6 text-text-muted">
          This has been logged. You can try again, or carry on exploring.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-8 rounded-sm border border-accent px-6 py-3 font-mono text-xs uppercase tracking-widest text-accent transition-colors duration-200 hover:bg-accent hover:text-bg"
        >
          Retry
        </button>
      </div>
    </section>
  );
}
