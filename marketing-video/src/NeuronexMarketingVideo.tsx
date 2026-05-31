import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { Scene1_Ruptura } from "./scenes/Scene1_Ruptura";
import { Scene2_Problema } from "./scenes/Scene2_Problema";
import { Scene3_Virada } from "./scenes/Scene3_Virada";
import { Scene4_Synapse } from "./scenes/Scene4_Synapse";
import { Scene5_Execucao } from "./scenes/Scene5_Execucao";
import { Scene6_Robustez } from "./scenes/Scene6_Robustez";
import { Scene7_ProvaSocial } from "./scenes/Scene7_ProvaSocial";
import { Scene8_Beneficio } from "./scenes/Scene8_Beneficio";
import { Scene9_Fechamento } from "./scenes/Scene9_Fechamento";

// NeuroNex Marketing Video — 72s, 1920x1080 @ 30fps
// Total frames: 2160
// Cada bloco tem 8 segundos = 240 frames

export const NeuronexMarketingVideo: React.FC = () => {
    return (
        <AbsoluteFill style={{ backgroundColor: "#020204" }}>
            {/* Bloco 1 (0s - 2.6s) */}
            <Sequence from={0} durationInFrames={80}>
                <Scene1_Ruptura />
            </Sequence>

            {/* Bloco 2 (2.6s - 5.3s) */}
            <Sequence from={80} durationInFrames={80}>
                <Scene2_Problema />
            </Sequence>

            {/* Bloco 3 (5.3s - 8s) */}
            <Sequence from={160} durationInFrames={80}>
                <Scene3_Virada />
            </Sequence>

            {/* Bloco 4 (8s - 10.6s) */}
            <Sequence from={240} durationInFrames={80}>
                <Scene4_Synapse />
            </Sequence>

            {/* Bloco 5 (10.6s - 13.3s) */}
            <Sequence from={320} durationInFrames={80}>
                <Scene5_Execucao />
            </Sequence>

            {/* Bloco 6 (13.3s - 16s) */}
            <Sequence from={400} durationInFrames={80}>
                <Scene6_Robustez />
            </Sequence>

            {/* Bloco 7 (16s - 18.6s) */}
            <Sequence from={480} durationInFrames={80}>
                <Scene7_ProvaSocial />
            </Sequence>

            {/* Bloco 8 (18.6s - 21.3s) */}
            <Sequence from={560} durationInFrames={80}>
                <Scene8_Beneficio />
            </Sequence>

            {/* Bloco 9 (21.3s - 24s) */}
            <Sequence from={640} durationInFrames={80}>
                <Scene9_Fechamento />
            </Sequence>
        </AbsoluteFill>
    );
};
