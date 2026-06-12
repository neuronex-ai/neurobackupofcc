"use client";

import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { EcosystemShowcase } from "@/components/landing/EcosystemShowcase";
import { VideoHero } from "@/components/landing/VideoHero";
import { Manifesto } from "@/components/landing/Manifesto";
import { WaitlistSection } from "@/components/landing/WaitlistSection";
import { DesktopAppCTA } from "@/components/landing/DesktopAppCTA";
import { Footer } from "@/components/landing/Footer";
import { LandingSynapseSDR } from "@/components/landing/LandingSynapseSDR";
import { useLandingSynapse } from "@/hooks/use-landing-synapse";

const DesktopIndex = () => {
    const sdr = useLandingSynapse();

    return (
        <div className="min-h-screen bg-background selection:bg-primary/30">
            <Navbar />
            <main>
                <Hero />
                <EcosystemShowcase />
                <VideoHero />
                <Manifesto />
                <WaitlistSection />
                <DesktopAppCTA />
            </main>
            <Footer />
            <LandingSynapseSDR sdr={sdr} />
        </div>
    );
};

export default DesktopIndex;
