import { interpolate, Easing } from "remotion";

// NeuroNex Brand Colors - Tech Luxury Monochrome
export const COLORS = {
    bgDeep: "#050505",
    bgSurface: "#0A0A0B",
    bgElevated: "#111112",
    accentPrimary: "#FFFFFF",
    accentLight: "#E4E4E7",
    accentGlow: "#52525B",
    accentSecondary: "#D4D4D8",
    white: "#ffffff",
    textPrimary: "rgba(255, 255, 255, 0.98)",
    textSecondary: "rgba(255, 255, 255, 0.70)",
    textTertiary: "rgba(255, 255, 255, 0.45)",
    success: "#FFFFFF",
    warning: "#A1A1AA",
    danger: "#FF4D4D",
    glassBorder: "rgba(255, 255, 255, 0.12)",
};

// Easing functions mimicking After Effects
export const EASINGS = {
    smooth: Easing.bezier(0.22, 1, 0.36, 1),
    spring: Easing.bezier(0.175, 0.885, 0.32, 1.275),
    bounce: Easing.bezier(0.34, 1.56, 0.64, 1),
    cinematic: Easing.bezier(0.16, 1, 0.3, 1),
    inOut: Easing.bezier(0.45, 0, 0.55, 1),
    expOut: Easing.bezier(0.19, 1, 0.22, 1),
};

// Fade in/out helper
export function fadeInOut(
    frame: number,
    duration: number,
    fadeIn = 20,
    fadeOut = 20
): number {
    return interpolate(
        frame,
        [0, fadeIn, duration - fadeOut, duration],
        [0, 1, 1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
}

// Slide animation helper
export function slideIn(
    frame: number,
    direction: "left" | "right" | "up" | "down" = "up",
    delay = 0,
    duration = 30
): { transform: string; opacity: number } {
    const progress = interpolate(frame - delay, [0, duration], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: EASINGS.cinematic,
    });

    const distance = 80;
    const offsets = {
        left: `translateX(${interpolate(progress, [0, 1], [-distance, 0])}px)`,
        right: `translateX(${interpolate(progress, [0, 1], [distance, 0])}px)`,
        up: `translateY(${interpolate(progress, [0, 1], [distance, 0])}px)`,
        down: `translateY(${interpolate(progress, [0, 1], [-distance, 0])}px)`,
    };

    return {
        transform: offsets[direction],
        opacity: interpolate(progress, [0, 0.3], [0, 1], {
            extrapolateRight: "clamp",
        }),
    };
}

// Scale entrance
export function scaleIn(
    frame: number,
    delay = 0,
    duration = 25
): { transform: string; opacity: number } {
    const progress = interpolate(frame - delay, [0, duration], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: EASINGS.spring,
    });

    return {
        transform: `scale(${interpolate(progress, [0, 1], [0.8, 1])})`,
        opacity: interpolate(progress, [0, 0.4], [0, 1], {
            extrapolateRight: "clamp",
        }),
    };
}

// Typewriter effect
export function typewriter(
    text: string,
    frame: number,
    delay = 0,
    speed = 2
): string {
    const charsToShow = Math.floor(Math.max(0, (frame - delay) / speed));
    return text.substring(0, Math.min(charsToShow, text.length));
}

// Glow pulse animation
export function glowPulse(frame: number, speed = 0.05): number {
    return 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(frame * speed));
}

// Particle position generator
export function getParticlePosition(
    frame: number,
    index: number,
    speed = 1
): { x: number; y: number; opacity: number; scale: number } {
    const seed = index * 137.5;
    const baseX = ((seed * 73) % 1920) - 960;
    const baseY = ((seed * 97) % 1080) - 540;

    return {
        x: baseX + Math.sin(frame * 0.02 * speed + seed) * 30,
        y: baseY + Math.cos(frame * 0.015 * speed + seed * 0.7) * 25,
        opacity: 0.2 + 0.3 * Math.sin(frame * 0.03 + seed),
        scale: 0.5 + 0.5 * Math.sin(frame * 0.02 + seed * 0.5),
    };
}

// Gradient text style helper
export function gradientText(
    from: string = COLORS.white,
    to: string = COLORS.accentLight
): React.CSSProperties {
    return {
        backgroundImage: `linear-gradient(135deg, ${from}, ${to})`,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
    };
}
