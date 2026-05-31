import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring } from "remotion";
import { COLORS, EASINGS, fadeInOut } from "../helpers";

// V7 — Apple Style: White Background, Vertical, High Legibility, Safe Areas
export const Scene2_Problema: React.FC = () => {
    const frame = useCurrentFrame();
    const duration = 80;
    const opacity = fadeInOut(frame, duration, 10, 10);

    const tOp = interpolate(frame, [3, 10], [0, 1], { extrapolateRight: "clamp" });
    const tY = interpolate(frame, [3, 15], [30, 0], { easing: EASINGS.cinematic, extrapolateRight: "clamp" });

    const cardEntries = [
        { label: "AGENDA ANTIGA", y: 400, delay: 10, w: 400, h: 200 },
        { label: "NOTAS MANUAIS", y: 650, delay: 18, w: 380, h: 180 },
        { label: "DADOS SOLTOS", y: 900, delay: 26, w: 420, h: 190 },
    ];

    return (
        <AbsoluteFill
            style={{
                backgroundColor: "#FBFBFD",
                justifyContent: "center",
                alignItems: "center",
                overflow: "hidden",
                opacity,
            }}
        >
            <div style={{ position: "absolute", top: 220, textAlign: "center", width: "100%", padding: "0 80px" }}>
                <h1 style={{ fontSize: 90, fontFamily: "Manrope", fontWeight: 800, color: "#1D1D1F", margin: 0, lineHeight: 0.9, opacity: tOp, transform: `translateY(${tY}px)` }}>
                    O fim da <br /><span style={{ color: "#8E8E93" }}>complexidade.</span>
                </h1>
            </div>

            <div style={{ position: "absolute", bottom: 450, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
                {cardEntries.map((card, i) => {
                    const cSpring = spring({ frame: frame - card.delay, fps: 30, config: { damping: 20, stiffness: 100 } });
                    const cOp = interpolate(cSpring, [0, 0.4], [0, 1]);
                    const cY = interpolate(cSpring, [0, 1], [60, 0]);

                    return (
                        <div key={i} style={{
                            width: card.w, height: card.h, backgroundColor: "white", borderRadius: 24, border: "1px solid rgba(0,0,0,0.05)",
                            boxShadow: "0 20px 60px rgba(0,0,0,0.03)", display: "flex", alignItems: "center", justifyContent: "center",
                            opacity: cOp, transform: `translateY(${cY}px)`
                        }}>
                            <span style={{ fontSize: 24, fontFamily: "Inter", fontWeight: 500, color: "#8E8E93" }}>{card.label}</span>
                        </div>
                    );
                })}
            </div>

            <div style={{ position: "absolute", bottom: 250, textAlign: "center", width: "100%", opacity: interpolate(frame, [35, 50], [0, 1]) }}>
                <p style={{ fontSize: 32, fontFamily: "Inter", fontWeight: 400, color: "#1D1D1F" }}>Chega de perder tempo.</p>
            </div>
        </AbsoluteFill>
    );
};
