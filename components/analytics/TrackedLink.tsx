"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { track } from "@vercel/analytics";

type TrackedLinkProps = ComponentProps<typeof Link> & {
  event: string;
  eventProps?: Record<string, string>;
};

/**
 * A next/link that fires a named analytics event on click — usable from
 * Server Component pages, since a Server Component can't pass a function
 * prop (an onTrack callback, an onClick, anything) to a Client Component;
 * only serializable data crosses that boundary. This takes the event name
 * and a plain-object payload instead, and calls track() itself.
 */
export function TrackedLink({ event, eventProps, onClick, ...props }: TrackedLinkProps) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        track(event, eventProps);
        onClick?.(e);
      }}
    />
  );
}
