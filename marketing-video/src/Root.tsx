import React from "react";
import { Composition } from "remotion";
import { NeuronexMarketingVideo } from "./NeuronexMarketingVideo";

export const RemotionRoot: React.FC = () => {
    return (
        <>
            <Composition
                id="NeuronexMarketingVideo"
                component={NeuronexMarketingVideo}
                durationInFrames={720} // 24 seconds at 30fps (approx 2.6s per scene)
                fps={30}
                width={1080}
                height={1920}
            />
        </>
    );
};
