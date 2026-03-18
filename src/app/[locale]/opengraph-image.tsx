/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { SITE_BRAND_NAME, SITE_NAME, SITE_URL } from "@/lib/site-metadata";

export const alt = `${SITE_NAME} social preview`;
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          position: "relative",
          width: "100%",
          height: "100%",
          background:
            "radial-gradient(circle at 12% 18%, rgba(240, 166, 43, 0.34), transparent 34%), radial-gradient(circle at 86% 12%, rgba(212, 90, 31, 0.28), transparent 28%), linear-gradient(135deg, #140a06 0%, #2b170d 52%, #100705 100%)",
          color: "#fff5ea",
          fontFamily: "Segoe UI, Arial, sans-serif",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            opacity: 0.18,
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            padding: "54px 60px",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
            }}
          >
            <img
              src={`${SITE_URL}/brand/icon.png`}
              alt=""
              width={72}
              height={72}
              style={{ borderRadius: 18 }}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <span
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  letterSpacing: "-0.04em",
                }}
              >
                {SITE_BRAND_NAME}
              </span>
              <span
                style={{
                  fontSize: 20,
                  color: "#f0cfb4",
                }}
              >
                Clear structure. Direct execution.
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
              maxWidth: 780,
            }}
          >
            <span
              style={{
                display: "flex",
                alignSelf: "flex-start",
                padding: "10px 16px",
                borderRadius: 999,
                border: "1px solid rgba(240, 166, 43, 0.28)",
                background: "rgba(255, 244, 234, 0.08)",
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#f6c989",
              }}
            >
              Marketing Website
            </span>
            <span
              style={{
                fontSize: 66,
                lineHeight: 1.02,
                fontWeight: 800,
                letterSpacing: "-0.05em",
              }}
            >
              Landing pages, websites, process tools, and AI templates.
            </span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 24,
              fontSize: 24,
              color: "#f0cfb4",
            }}
          >
            <span>SEO, accessibility, and conversion-focused delivery</span>
            <span
              style={{
                display: "flex",
                padding: "10px 18px",
                borderRadius: 999,
                background: "linear-gradient(120deg, #f2a73a, #d45a1f)",
                color: "#2a1409",
                fontWeight: 800,
              }}
            >
              invessiv.com
            </span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
