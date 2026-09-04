import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Apple touch icon — SVG favicons aren't supported for iOS home-screen icons. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#070809",
        }}
      >
        <svg width="120" height="120" viewBox="0 0 64 64">
          <path
            d="M14 48 L32 14 L50 48"
            fill="none"
            stroke="#B6FF4A"
            strokeWidth="5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path d="M23 37 H41" fill="none" stroke="#B6FF4A" strokeWidth="5" strokeLinecap="round" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
