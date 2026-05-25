import { ImageResponse } from "next/og";

export const alt = "House Job Application 2026-27 - Allied Hospital, Faisalabad";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Social-share preview image (WhatsApp, etc.), rendered on the fly.
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "linear-gradient(135deg, #3730a3 0%, #05125c 100%)",
          padding: "90px",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 30, letterSpacing: 8, opacity: 0.85 }}>
          ANNUAL SESSION 2026 - 2027
        </div>
        <div style={{ fontSize: 82, fontWeight: 700, marginTop: 24, lineHeight: 1.05 }}>
          Application Form for House Job
        </div>
        <div style={{ fontSize: 38, marginTop: 28, opacity: 0.92 }}>
          {"Allied Hospital-I / II & FTH, Faisalabad"}
        </div>
      </div>
    ),
    size
  );
}
