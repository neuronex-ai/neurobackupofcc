import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring } from "remotion";
import { COLORS, EASINGS, fadeInOut } from "../helpers";

// V7 — Apple Style: White Background, Vertical, High Legibility, Safe Areas
export const Scene7_ProvaSocial: React.FC = () => {
    const frame = useCurrentFrame();
    const duration = 80;
    const opacity = fadeInOut(frame, duration, 10, 10);

    const tOp = interpolate(frame, [3, 12], [0, 1], { extrapolateRight: "clamp" });
    const tY = interpolate(frame, [3, 15], [30, 0], { easing: EASINGS.cinematic, extrapolateRight: "clamp" });

    const panelSpring = spring({ frame: frame - 12, fps: 30, config: { damping: 22, stiffness: 100 } });
    const panelOp = interpolate(panelSpring, [0, 0.4], [0, 1]);
    const panelY = interpolate(panelSpring, [0, 1], [60, 0]);

    const bars = [40, 75, 50, 110, 65, 140, 90, 180, 125, 220, 160, 260];
    const countA = Math.floor(interpolate(frame, [15, 60], [10, 85], { easing: EASINGS.smooth, extrapolateRight: "clamp" }));
    const countB = Math.floor(interpolate(frame, [20, 70], [200, 954], { easing: EASINGS.smooth, extrapolateRight: "clamp" }));

    return (
        <AbsoluteFill
            style={{
                backgroundColor: "#FFFFFF",
                justifyContent: "center",
                alignItems: "center",
                padding: "0 80px",
                overflow: "hidden",
                opacity,
            }}
        >
            <div style={{ position: "absolute", top: 220, textAlign: "center", width: "100%", zIndex: 1000, padding: "0 80px" }}>
                <h1 style={{ fontSize: 90, fontFamily: "Manrope", fontWeight: 800, color: "#1D1D1F", margin: 0, lineHeight: 0.9, opacity: tOp, transform: `translateY(${tY}px)` }}>
                    Sua base. <br /><span style={{ color: "#007AFF" }}>Sólida.</span>
                </h1>

                <div style={{ display: "flex", justifyContent: "center", gap: 60, marginTop: 40, opacity: interpolate(frame, [25, 40], [0, 1]) }}>
                    <div>
                        <div style={{ fontSize: 13, color: "#8E8E93", fontFamily: "Inter", letterSpacing: 2 }}>USUÁRIOS ATIVOS</div>
                        <div style={{ fontSize: 72, fontFamily: "Manrope", fontWeight: 300, color: "#1D1D1F", marginTop: 8 }}>{countA}K+</div>
                    </div>
                </div>
            </div>

            <div style={{
                width: 900, height: 600, backgroundColor: "#F5F5F7", borderRadius: 40, border: "1px solid rgba(0,0,0,0.035)",
                padding: 60, boxShadow: "0 40px 100px rgba(0,0,0,0.04)", opacity: panelOp, transform: `translateY(${panelY}px)`
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
                    <div style={{ fontSize: 20, color: "#1D1D1F", fontFamily: "Manrope", fontWeight: 600 }}>Crescimento Global</div>
                    <div style={{ padding: "6px 14px", backgroundColor: "#007AFF", fontSize: 11, color: "white", fontFamily: "Inter", borderRadius: 6, letterSpacing: 2, fontWeight: 700 }}>LIVE</div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-end", gap: 24, height: 350, paddingBottom: 10, borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                    {bars.map((h, i) => {
                        const bSpring = spring({ frame: frame - 18 - i * 2, fps: 30, config: { damping: 14, stiffness: 100 } });
                        const bScale = interpolate(bSpring, [0, 1], [0, 1]);
                        return (
                            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }}>
                                <div style={{
                                    width: "100%", height: h * 1.3 * bScale, backgroundColor: i === bars.length - 1 ? "#007AFF" : "rgba(0,122,255,0.08)",
                                    borderRadius: "8px 8px 0 0", opacity: interpolate(bSpring, [0, 0.4], [0, 1]),
                                }} />
                            </div>
                        );
                    })}
                </div>
            </div>

            <div style={{ position: "absolute", bottom: 220, textAlign: "center", width: "100%", padding: "0 80px" }}>
                <p style={{ fontSize: 32, fontFamily: "Inter", fontWeight: 400, color: "#1D1D1F", opacity: interpolate(frame, [40, 55], [0, 1]) }}>
                    Escala elástica para <br />sua ambição.
                </p>
                <div style={{ marginTop: 24, fontSize: 54, color: "#007AFF", fontFamily: "Manrope", fontWeight: 200, opacity: interpolate(frame, [45, 60], [0, 1]) }}>{countB}K+</div>
            </div>

            <div style={{ position: "absolute", bottom: 100, fontSize: 13, color: "rgba(0,0,0,0.1)", fontFamily: "Inter", letterSpacing: 10 }}>ELASTIC DATA STACK</div>
        </AbsoluteFill>
    );
};
