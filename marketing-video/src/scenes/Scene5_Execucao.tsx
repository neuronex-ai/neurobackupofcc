import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring } from "remotion";
import { COLORS, EASINGS, fadeInOut } from "../helpers";

// V7 — Apple Style: White Background, Vertical, High Legibility, Safe Areas
export const Scene5_Execucao: React.FC = () => {
    const frame = useCurrentFrame();
    const duration = 80;
    const opacity = fadeInOut(frame, duration, 10, 10);

    const tOp = interpolate(frame, [3, 10], [0, 1], { extrapolateRight: "clamp" });
    const tY = interpolate(frame, [3, 15], [30, 0], { easing: EASINGS.cinematic, extrapolateRight: "clamp" });

    const cards = [
        { title: "Pagamento Pix", status: "OK", delay: 10 },
        { title: "Dashboard Sync", status: "DONE", delay: 18 },
        { title: "Agenda IA", status: "SYNC", delay: 26 },
        { title: "Histórico Clínico", status: "OK", delay: 34 },
    ];

    return (
        <AbsoluteFill
            style={{
                backgroundColor: "#FFFFFF",
                justifyContent: "center",
                alignItems: "center",
                overflow: "hidden",
                opacity,
            }}
        >
            <div style={{ position: "absolute", top: 220, textAlign: "center", width: "100%", padding: "0 80px", zIndex: 1000 }}>
                <h1 style={{ fontSize: 90, fontFamily: "Manrope", fontWeight: 800, color: "#1D1D1F", margin: 0, lineHeight: 0.9, opacity: tOp, transform: `translateY(${tY}px)` }}>
                    Execução <br /><span style={{ color: "rgba(0,122,255,0.8)" }}>real.</span>
                </h1>
                <p style={{ fontSize: 32, fontFamily: "Inter", fontWeight: 400, color: "#8E8E93", marginTop: 40, opacity: interpolate(frame, [15, 25], [0, 1]) }}>
                    Zero esforço, <br />máximo impacto.
                </p>
            </div>

            <div style={{ position: "absolute", top: 580, bottom: 250, left: 80, right: 80, display: "flex", flexDirection: "column", gap: 30 }}>
                {cards.map((card, i) => {
                    const cSpring = spring({ frame: frame - card.delay, fps: 30, config: { damping: 20, stiffness: 100 } });
                    const cOp = interpolate(cSpring, [0, 0.4], [0, 1]);
                    const cY = interpolate(cSpring, [0, 1], [60, 0]);

                    return (
                        <div key={i} style={{
                            width: "100%", height: 160, backgroundColor: "#FBFBFD", borderRadius: 24, border: "1px solid rgba(0,0,0,0.04)",
                            display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 40px",
                            opacity: cOp, transform: `translateY(${cY}px)`, boxShadow: "0 10px 40px rgba(0,0,0,0.02)"
                        }}>
                            <div>
                                <div style={{ fontSize: 13, color: "#8E8E93", fontFamily: "Inter", fontWeight: 500, letterSpacing: 2, marginBottom: 8 }}>AUTO-RUN</div>
                                <h3 style={{ fontSize: 36, color: "#1D1D1F", fontFamily: "Manrope", fontWeight: 500, margin: 0 }}>{card.title}</h3>
                            </div>
                            <div style={{ color: "#007AFF", fontSize: 16, fontFamily: "Inter", fontWeight: 600 }}>{card.status}</div>
                        </div>
                    );
                })}
            </div>

            <div style={{ position: "absolute", bottom: 100, fontSize: 13, color: "rgba(0,0,122,0.15)", fontFamily: "Inter", letterSpacing: 10 }}>INFRA BY APPLE DESIGN</div>
        </AbsoluteFill>
    );
};
