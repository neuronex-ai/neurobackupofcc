import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring } from "remotion";
import { COLORS, EASINGS, fadeInOut } from "../helpers";

// V7 — Apple Style: White Background, Vertical, High Legibility, Safe Areas
export const Scene4_Synapse: React.FC = () => {
    const frame = useCurrentFrame();
    const duration = 80;
    const opacity = fadeInOut(frame, duration, 10, 10);

    const tOp = interpolate(frame, [3, 10], [0, 1], { extrapolateRight: "clamp" });
    const tY = interpolate(frame, [3, 15], [30, 0], { easing: EASINGS.cinematic, extrapolateRight: "clamp" });

    const sphereOp = interpolate(frame, [5, 15], [0, 0.4], { extrapolateRight: "clamp" });
    const sphereScale = interpolate(frame, [5, 40], [0.8, 1.2], { easing: EASINGS.cinematic, extrapolateRight: "clamp" });

    const panelSpring = spring({ frame: frame - 18, fps: 30, config: { damping: 18, stiffness: 100 } });
    const panelOp = interpolate(panelSpring, [0, 0.4], [0, 1]);
    const panelY = interpolate(panelSpring, [0, 1], [60, 0]);

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
                    Sincronia <br /><span style={{ color: "#007AFF" }}>absoluta.</span>
                </h1>
                <p style={{ fontSize: 32, fontFamily: "Inter", fontWeight: 400, color: "#8E8E93", marginTop: 40, opacity: interpolate(frame, [15, 25], [0, 1]) }}>
                    IA integrada ao <br />seu fluxo.
                </p>
            </div>

            <div style={{ position: "relative", width: 600, height: 600, transform: `scale(${sphereScale})`, opacity: sphereOp }}>
                <div style={{ position: "absolute", width: "100%", height: "100%", borderRadius: "50%", border: "1px solid rgba(0,122,255,0.08)" }} />
                <div style={{ position: "absolute", top: "50%", left: "50%", width: 120, height: 120, backgroundColor: "white", borderRadius: "50%", transform: "translate(-50%, -50%)", border: "1px solid rgba(0,0,0,0.05)", display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <div style={{ width: 16, height: 16, backgroundColor: "#007AFF", borderRadius: "50%" }} />
                </div>

                <div style={{ position: "absolute", inset: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 6 }}>
                    {Array.from({ length: 30 }).map((_, i) => {
                        const h = interpolate(Math.sin(frame * 0.2 + i * 0.1), [-1, 1], [10, 120]);
                        return <div key={i} style={{ width: 3, height: h, backgroundColor: "rgba(0,122,255,0.4)", borderRadius: 2 }} />;
                    })}
                </div>
            </div>

            <div style={{
                position: "absolute", bottom: 250, width: 850, height: 280,
                backgroundColor: "#F5F5F7", border: "1px solid rgba(0,0,0,0.04)", borderRadius: 40, padding: 50,
                boxShadow: "0 20px 80px rgba(0,0,0,0.04)", opacity: panelOp, transform: `translateY(${panelY}px)`
            }}>
                <div style={{ fontSize: 13, color: "#8E8E93", fontFamily: "Inter", fontWeight: 600, letterSpacing: 2, marginBottom: 15 }}>SYNA-CORE-01</div>
                <div style={{ fontSize: 42, color: "#1D1D1F", fontFamily: "Manrope", fontWeight: 500 }}>Agendamento inteligente <br /><span style={{ color: "#007AFF" }}>confirmado.</span></div>
                <div style={{ height: 4, width: "100%", backgroundColor: "rgba(0,122,255,0.05)", marginTop: 40, borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", backgroundColor: "#007AFF", width: `${interpolate(frame, [20, 60], [0, 100], { extrapolateRight: "clamp" })}%` }} />
                </div>
            </div>

            <div style={{ position: "absolute", bottom: 100, fontSize: 13, color: "rgba(0,0,0,0.2)", fontFamily: "Inter", letterSpacing: 10 }}>SECURITY LEVEL 100%</div>
        </AbsoluteFill>
    );
};
