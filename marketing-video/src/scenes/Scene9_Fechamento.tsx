import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring } from "remotion";
import { COLORS, EASINGS, fadeInOut } from "../helpers";

// V7 — Apple Style: White Background, Vertical, High Legibility, Safe Areas
export const Scene9_Fechamento: React.FC = () => {
    const frame = useCurrentFrame();
    const duration = 80;
    const opacity = fadeInOut(frame, duration, 10, 10);

    const logoSpring = spring({ frame: frame - 25, fps: 30, config: { damping: 18, stiffness: 80 } });
    const logoOp = interpolate(logoSpring, [0, 0.5], [0, 1]);
    const logoScale = interpolate(logoSpring, [0, 1], [0.95, 1]);
    const ls = interpolate(frame, [25, 65], [15, 3], { easing: EASINGS.cinematic, extrapolateRight: "clamp" });

    const sloganOp = interpolate(frame, [45, 60], [0, 1]);
    const sloganY = interpolate(frame, [45, 65], [15, 0], { easing: EASINGS.cinematic });

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
            <div style={{ position: "absolute", top: -100, width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,122,255,0.05) 0%, transparent 70%)", filter: "blur(50px)" }} />

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 100, transform: `scale(${logoScale})`, textAlign: "center", padding: "0 80px" }}>
                <h1 style={{ fontSize: 130, fontFamily: "Manrope", fontWeight: 800, color: "#1D1D1F", opacity: logoOp, letterSpacing: `${ls}px`, margin: 0, lineHeight: 1 }}>
                    NEURONEX
                </h1>

                <div style={{ width: 120, height: 4, background: "#007AFF", margin: "40px auto", borderRadius: 2 }} />

                <p style={{ fontSize: 36, fontFamily: "Inter", fontWeight: 500, color: "#8E8E93", textTransform: "uppercase", letterSpacing: 10, opacity: sloganOp, transform: `translateY(${sloganY}px)`, margin: 0, lineHeight: 1.2 }}>
                    Inteligência <br />Operacional
                </p>

                <div style={{ marginTop: 120, display: "flex", flexDirection: "column", alignItems: "center", gap: 30, opacity: sloganOp }}>
                    <div style={{ padding: "20px 60px", backgroundColor: "#1D1D1F", borderRadius: 40, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}>
                        <span style={{ fontSize: 24, color: "white", fontFamily: "Inter", fontWeight: 600, letterSpacing: 2 }}>Comece Agora</span>
                    </div>
                    <p style={{ fontSize: 20, fontFamily: "Inter", color: "rgba(0,0,0,0.4)", letterSpacing: 4, margin: 0 }}>WWW.NEURONEX.AI</p>
                </div>
            </div>

            <div style={{ position: "absolute", bottom: 100, fontSize: 11, color: "rgba(0,0,0,0.1)", fontFamily: "Inter", letterSpacing: 5 }}>DESIGNED BY NEURONEX LABS</div>
        </AbsoluteFill>
    );
};
