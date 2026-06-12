"use client";

import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { WaitlistSection } from "@/components/landing/WaitlistSection";
import { DesktopAppCTA } from "@/components/landing/DesktopAppCTA";
import { Footer } from "@/components/landing/Footer";
import { LandingSynapseSDR } from "@/components/landing/LandingSynapseSDR";
import { useLandingSynapse } from "@/hooks/use-landing-synapse";
import {
    LandingRealFinanceFiscalSection,
    LandingRealProductShowcase,
    LandingRealSynapseSection,
} from "@/components/landing/LandingProductScreenshots";
import {
    LandingDifferentiatorTable,
    LandingFinalCTASection,
    LandingOperatingSystemSection,
    LandingPlanComparisonSection,
    LandingProblemSection,
    LandingTrustAndFAQSection,
} from "@/components/landing/StrategicLandingSections";

const DesktopIndex = () => {
    const sdr = useLandingSynapse();

    return (
        <div className="min-h-screen bg-background selection:bg-primary/30">
            <Navbar />
            <main>
                <Hero />
                <LandingProblemSection />
                <LandingDifferentiatorTable />
                <LandingRealProductShowcase />
                <LandingOperatingSystemSection />
                <LandingRealSynapseSection />
                <LandingRealFinanceFiscalSection />
                <WaitlistSection />
                <LandingPlanComparisonSection />
                <LandingTrustAndFAQSection />
                <DesktopAppCTA />
                <LandingFinalCTASection />
            </main>
            <Footer />
            <LandingSynapseSDR sdr={sdr} />
        </div>
    );
};

export default DesktopIndex;
