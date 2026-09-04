import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/data/site";
import { Fill, filled } from "@/components/ui/Placeholder";

export const metadata: Metadata = {
  title: "Resume",
  description: "Download Aditya Mahajan's resume.",
};

/**
 * This route must load in under 1s. It is the single most important page for
 * a recruiter — keep it plain, fast and obvious. No motion, no 3D, ever.
 */
export default function ResumePage() {
  const ready = filled(site.resumePath);

  return (
    <section className="section">
      <div className="container-lab">
        <p className="label mb-4">DOCUMENT</p>
        <h1 className="text-[length:var(--text-3xl)]">Resume</h1>

        {ready ? (
          <>
            <Link
              href={site.resumePath}
              download
              className="mt-8 inline-block rounded-sm border border-accent px-6 py-3 font-mono text-xs uppercase tracking-widest text-accent transition-colors duration-200 hover:bg-accent hover:text-bg"
            >
              Download PDF ↓
            </Link>

            <object
              data={site.resumePath}
              type="application/pdf"
              className="mt-10 h-[80vh] w-full border border-border"
              aria-label="Resume preview"
            >
              <p className="p-6 text-text-muted">
                Your browser can&rsquo;t display the PDF inline.{" "}
                <Link href={site.resumePath} className="text-accent underline">
                  Download it instead
                </Link>
                .
              </p>
            </object>
          </>
        ) : (
          <p className="mt-8">
            <Fill value={site.resumePath} />
          </p>
        )}
      </div>
    </section>
  );
}
