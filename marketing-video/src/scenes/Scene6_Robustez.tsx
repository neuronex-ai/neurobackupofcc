import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring } from "remotion";
import { COLORS, EASINGS, fadeInOut } from "../helpers";

// V7 — Apple Style: White Background, Vertical, High Legibility, Safe Areas
export const Scene6_Robustez: React.FC = () => {
    const frame = useCurrentFrame();
    const duration = 80;
    const opacity = fadeInOut(frame, duration, 10, 10);

    const camScale = interpolate(frame, [0, duration], [1.3, 1], { easing: EASINGS.smooth });
    const camZ = interpolate(frame, [0, duration], [300, -100], { easing: EASINGS.smooth });

    const nodes = [
        { label: "CLOUD CORE", angle: 0, radius: 420, delay: 10 },
        { label: "CRM STACK", angle: 72, radius: 450, delay: 18 },
        { label: "PAYMENT", angle: 144, radius: 400, delay: 8 },
        { label: "AI ENGINE", angle: 216, radius: 500, delay: 25 },
        { label: "STREAM", angle: 288, radius: 430, delay: 15 },
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
            <div style={{ position: "absolute", top: 220, textAlign: "center", width: "100%", zIndex: 1000, padding: "0 80px" }}>
                <h1 style={{ fontSize: 90, fontFamily: "Manrope", fontWeight: 800, color: "#1D1D1F", margin: 0, lineHeight: 0.9, opacity: interpolate(frame, [5, 15], [0, 1]) }}>
                    Segurança <br /><span style={{ color: "#007AFF" }}>absoluta.</span>
                </h1>
                <p style={{ fontSize: 32, fontFamily: "Inter", fontWeight: 400, color: "#8E8E93", marginTop: 40, opacity: interpolate(frame, [15, 25], [0, 1]) }}>
                    Infraestrutura de <br />nível global.
                </p>
            </div>

            <div style={{ position: "absolute", inset: 0, perspective: "1500px", perspectiveOrigin: "50% 50%" }}>
                <div style={{ position: "absolute", inset: 0, transform: `scale(${camScale}) translateZ(${camZ}px)`, transformStyle: "preserve-3d" }}>

                    {[700, 1000, 1300].map((size, i) => (
                        <div key={i} style={{ position: "absolute", top: "50%", left: "50%", width: size, height: size, transform: "translate(-50%, -50%) rotateX(75deg)", border: "1px solid rgba(0,0,0,0.03)", borderRadius: "50%", transformStyle: "preserve-3d" }} />
                    ))}

                    <div style={{
                        position: "absolute", top: "50%", left: "50%", width: 140, height: 140, transform: "translate(-50%, -50%)",
                        backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.05)", borderRadius: "50%", boxShadow: "0 40px 100px rgba(0,122,255,0.15)",
                    }}>
                        <div style={{ position: "absolute", top: "50%", left: "50%", width: 20, height: 20, backgroundColor: "#007AFF", borderRadius: "50%", transform: "translate(-50%, -50%)" }} />
                    </div>

                    {nodes.map((node, i) => {
                        const nSpring = spring({ frame: frame - node.delay, fps: 30, config: { damping: 14, stiffness: 100 } });
                        const nOp = interpolate(nSpring, [0, 0.4], [0, 1]);

                        const nx = Math.cos((node.angle * Math.PI) / 180) * node.radius;
                        const nz = Math.sin((node.angle * Math.PI) / 180) * node.radius;

                        return (
                            <div key={i} style={{
                                position: "absolute", top: "50%", left: "50%", width: 200, height: 70,
                                transform: `translate(-50%, -50%) translate3d(${nx}px, ${0}px, ${nz}px) rotateY(-${node.angle}deg)`,
                                backgroundColor: "white", border: "1px solid rgba(0,0,0,0.04)",
                                borderRadius: 12, display: "flex", justifyContent: "center", alignItems: "center", opacity: nOp,
                                boxShadow: "0 20px 60px rgba(0,0,0,0.03)", transformStyle: "preserve-3d"
                            }}>
                                <span style={{ color: "#1D1D1F", fontSize: 13, fontFamily: "Inter", letterSpacing: 3, fontWeight: 500 }}>{node.label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div style={{ position: "absolute", bottom: 100, fontSize: 13, color: "rgba(0,0,0,0.1)", fontFamily: "Inter", letterSpacing: 10 }}>GLOBAL NODE SYNC</div>
        </AbsoluteFill>
    );
};
