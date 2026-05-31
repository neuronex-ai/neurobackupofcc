import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring } from "remotion";
import { COLORS, EASINGS, fadeInOut } from "../helpers";

// V7 — Apple Style: White Background, Vertical, High Legibility, Safe Areas
export const Scene8_Beneficio: React.FC = () => {
    const frame = useCurrentFrame();
    const duration = 80;
    const opacity = fadeInOut(frame, duration, 10, 10);

    const breathRadius = interpolate(frame, [0, duration], [600, 950], { easing: EASINGS.smooth });
    const breathOp = interpolate(frame, [0, 40, 80], [0.1, 0.2, 0.15], { easing: EASINGS.smooth });

    const tOp = interpolate(frame, [5, 15], [0, 1], { extrapolateRight: "clamp" });
    const tY = interpolate(frame, [5, 18], [30, 0], { easing: EASINGS.cinematic, extrapolateRight: "clamp" });

    const t2Op = interpolate(frame, [15, 25], [0, 1], { extrapolateRight: "clamp" });
    const t2Y = interpolate(frame, [15, 28], [30, 0], { easing: EASINGS.cinematic, extrapolateRight: "clamp" });

    const sepWidth = interpolate(frame, [25, 45], [0, 240], { easing: EASINGS.expOut, extrapolateRight: "clamp" });

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
            <div style={{
                position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                width: breathRadius, height: breathRadius, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(0,122,255,0.4) 0%, transparent 65%)",
                opacity: breathOp, filter: "blur(60px)",
            }} />

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 100, textAlign: "center", padding: "0 80px" }}>
                <h2 style={{ fontSize: 54, color: "#8E8E93", fontFamily: "Inter", fontWeight: 500, margin: 0, opacity: tOp, transform: `translateY(${tY}px)` }}>
                    Bem-estar.
                </h2>
                <h1 style={{ fontSize: 110, color: "#1D1D1F", fontFamily: "Manrope", fontWeight: 800, margin: "40px 0 0 0", opacity: t2Op, transform: `translateY(${t2Y}px)`, lineHeight: 0.9 }}>
                    Foco no que <br />realmente <br /><span style={{ color: "#007AFF" }}>importa.</span>
                </h1>

                <div style={{ width: sepWidth, height: 4, backgroundColor: "#007AFF", margin: "48px 0", opacity: interpolate(frame, [25, 35], [0, 1]) }} />

                <h3 style={{ fontSize: 44, color: "#1D1D1F", fontFamily: "Inter", fontWeight: 400, fontStyle: "italic", margin: 0, opacity: interpolate(frame, [45, 60], [0, 1]), transform: `translateY(${interpolate(frame, [45, 55], [20, 0])}px)` }}>
                    100% no paciente.
                </h3>
            </div>

            <div style={{ position: "absolute", bottom: 100, fontSize: 13, color: "rgba(0,122,255,0.15)", fontFamily: "Inter", letterSpacing: 10 }}>PURE FOCUS MODE</div>
        </AbsoluteFill>
    );
};
