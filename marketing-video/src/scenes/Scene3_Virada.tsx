import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring } from "remotion";
import { COLORS, EASINGS, fadeInOut } from "../helpers";

// V7 — Apple Style: White Background, Vertical, High Legibility, Safe Areas
export const Scene3_Virada: React.FC = () => {
    const frame = useCurrentFrame();
    const duration = 80;
    const opacity = fadeInOut(frame, duration, 8, 12);

    const flashOp = interpolate(frame, [0, 5, 12], [1, 0.9, 0], { extrapolateRight: "clamp" });
    const sphereOp = interpolate(frame, [8, 18], [0, 0.25], { extrapolateRight: "clamp" });
    const sphereScale = interpolate(frame, [8, 40], [0.6, 1.3], { easing: EASINGS.cinematic, extrapolateRight: "clamp" });

    const titleSpring = spring({ frame: frame - 25, fps: 30, config: { damping: 18, stiffness: 100 } });
    const titleOp = interpolate(titleSpring, [0, 0.5], [0, 1]);
    const titleY = interpolate(titleSpring, [0, 1], [40, 0]);
    const ls = interpolate(titleSpring, [0, 1], [25, 3], { easing: EASINGS.expOut });

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
            <div style={{ position: "absolute", inset: 0, backgroundColor: "#007AFF", opacity: flashOp, zIndex: 1000 }} />

            <div style={{ position: "absolute", transform: `scale(${sphereScale})`, opacity: sphereOp }}>
                <div style={{ position: "absolute", width: 800, height: 800, top: -400, left: -400, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,122,255,0.4) 0%, transparent 65%)", filter: "blur(50px)" }} />
                <svg width="600" height="600" viewBox="-300 -300 600 600">
                    {[0, 45, 90, 135].map((rz, i) => (
                        <ellipse key={i} cx={0} cy={0} rx={260} ry={80} fill="none" stroke="rgba(0,122,255,0.4)" strokeWidth={1} transform={`rotate(${rz})`} />
                    ))}
                    <circle cx={0} cy={0} r={5} fill="#007AFF" />
                </svg>
            </div>

            <div style={{ zIndex: 600, textAlign: "center", transform: `translateY(${titleY}px)`, opacity: titleOp }}>
                <h1 style={{ fontSize: 130, fontFamily: "Manrope", fontWeight: 800, color: "#1D1D1F", margin: 0, letterSpacing: `${ls}px` }}>
                    NEURONEX
                </h1>
                <div style={{ width: 120, height: 4, background: "#007AFF", margin: "40px auto", borderRadius: 2 }} />
                <p style={{ fontSize: 32, fontFamily: "Inter", fontWeight: 500, color: "#8E8E93", textTransform: "uppercase", letterSpacing: 8, margin: 0 }}>
                    IA integrada.
                </p>
            </div>

            <div style={{ position: "absolute", top: 250, left: 80, right: 80, bottom: 250, border: "2px solid rgba(0,0,0,0.02)", borderRadius: 60, pointerEvents: "none" }} />
        </AbsoluteFill>
    );
};
