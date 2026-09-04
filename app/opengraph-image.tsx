import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** PLAN.md Phase 7 — verify this in the LinkedIn and X preview inspectors before launch. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#070809",
          color: "#E9ECEB",
          fontFamily: "monospace",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, letterSpacing: 8, color: "#B6FF4A" }}>
          ADITYA LAB
        </div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 56, letterSpacing: 2 }}>
          AI × PRODUCT × BUSINESS
        </div>
        <div style={{ display: "flex", marginTop: 40, fontSize: 22, letterSpacing: 6, color: "#98A09E" }}>
          BUILD · EXPERIMENT · ITERATE
        </div>
      </div>
    ),
    { ...size },
  );
}
