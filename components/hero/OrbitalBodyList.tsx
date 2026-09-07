import Link from "next/link";
import type { PlaneValue } from "@/data/schema";
import { HERO_PLANES, type HeroBody } from "@/data/queries";

const PLANE_LABEL: Record<PlaneValue, string> = {
  ai: "AI",
  product: "PRODUCT",
  business: "BUSINESS",
};

/**
 * Layer 0 of the orbital hero's degradation ladder (spec §3.6): every body,
 * as a real link, grouped by plane, permanently in the DOM. Screen-reader
 * only — the SVG (layer 1) and R3F (layer 2) layers carry their own visible,
 * real anchors once they mount, so this list is the accessible baseline
 * underneath them, not a second visible copy (CLAUDE.md §3, principle 5).
 */
export function OrbitalBodyList({ bodies }: { bodies: HeroBody[] }) {
  // Several bodies (e.g. Turbotork) belong to more than one plane. Each body
  // gets exactly one entry — filed under the first plane it matches in
  // HERO_PLANES order — so a screen-reader visitor hears every link once,
  // not once per plane it spans; the "(spans ...)" suffix on that single
  // entry is what communicates the other planes it also touches.
  const seen = new Set<string>();

  return (
    <div className="sr-only">
      <h2>What Aditya works on, by discipline</h2>
      {HERO_PLANES.map((plane) => {
        const inPlane = bodies.filter((body) => body.planes.includes(plane) && !seen.has(body.id));
        inPlane.forEach((body) => seen.add(body.id));
        if (inPlane.length === 0) return null;
        return (
          <section key={plane} aria-labelledby={`orbital-plane-${plane}`}>
            <h3 id={`orbital-plane-${plane}`}>{PLANE_LABEL[plane]}</h3>
            <ul>
              {inPlane.map((body) => (
                <li key={body.id}>
                  {/* sr-only repeated here (redundant with the ancestor div) so the
                      44px-tap-target audit's `sr-only` skip heuristic — which only
                      checks an element's own className, not an ancestor's — still
                      recognizes this <a> as intentionally hidden rather than an
                      undersized visible tap target (e2e/mobile-audit.spec.ts). */}
                  <Link href={body.href} className="sr-only">
                    {body.label}
                    {body.planes.length > 1 ? ` (spans ${body.planes.map((p) => PLANE_LABEL[p]).join(", ")})` : ""}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
