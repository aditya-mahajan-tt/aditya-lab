import Link from "next/link";
import { navigation } from "@/data/navigation";

export default function NotFound() {
  return (
    <section className="section">
      <div className="container-lab">
        <p className="label mb-6">ERROR 404 — ROUTE NOT FOUND</p>
        <h1 className="text-[length:var(--text-3xl)]">This part of the Lab doesn&rsquo;t exist yet.</h1>
        <p className="prose-lab mt-6 text-text-muted">
          Either it was archived, or it was never built. Here is everything that does exist:
        </p>

        <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
          {navigation.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="font-mono text-xs uppercase tracking-widest text-accent hover:underline"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
