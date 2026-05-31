import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring } from "remotion";
import { COLORS, EASINGS, fadeInOut } from "../helpers";

// V7 — Apple Style: White Background, Vertical, High Legibility, Safe Areas
export const Scene1_Ruptura: React.FC = () => {
    const frame = useCurrentFrame();
    const duration = 80;
    const opacity = fadeInOut(frame, duration, 10, 10);

    const camScale = interpolate(frame, [0, duration], [1.1, 1], { easing: EASINGS.smooth });
    const tOp = interpolate(frame, [5, 15], [0, 1], { extrapolateRight: "clamp" });
    const tY = interpolate(frame, [5, 20], [40, 0], { easing: EASINGS.cinematic, extrapolateRight: "clamp" });

    const cardSpring = spring({ frame: frame - 15, fps: 30, config: { damping: 18, stiffness: 120 } });
    const cardOp = interpolate(cardSpring, [0, 0.5], [0, 1]);
    const cardY = interpolate(cardSpring, [0, 1], [100, 0]);

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
            <div style={{ position: "absolute", top: 250, bottom: 250, left: 80, right: 80, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transform: `scale(${camScale})` }}>
                <h2 style={{ fontSize: 32, fontFamily: "Inter", fontWeight: 500, color: "#8E8E93", textTransform: "uppercase", letterSpacing: 8, margin: 0, opacity: tOp, transform: `translateY(${tY}px)` }}>
                    NeuroNex V7
                </h2>
                <h1 style={{ fontSize: 110, fontFamily: "Manrope", fontWeight: 800, color: "#1D1D1F", margin: "20px 0", lineHeight: 0.9, textAlign: "center", opacity: tOp, transform: `translateY(${tY * 0.5}px)` }}>
                    Pense <br />além.
                </h1>

                <div style={{
                    marginTop: 80, width: 600, height: 400, backgroundColor: "#F5F5F7", borderRadius: 40, border: "1px solid rgba(0,0,0,0.03)",
                    boxShadow: "0 40px 100px rgba(0,0,0,0.05)", opacity: cardOp, transform: `translateY(${cardY}px)`
                }}>
                    <div style={{ padding: 40 }}>
                        <div style={{ width: 120, height: 4, backgroundColor: "#1D1D1F", borderRadius: 2, marginBottom: 20 }} />
                        <div style={{ fontSize: 24, fontFamily: "Inter", color: "#1D1D1F", fontWeight: 400 }}>A nova era da gestão.</div>
                    </div>
                </div>
            </div>
        </AbsoluteFill>
    );
};
