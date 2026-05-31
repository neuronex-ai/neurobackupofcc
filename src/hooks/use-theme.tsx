import { useTheme as useNextTheme } from "next-themes";
import { useEffect, useState } from "react";

export function useTheme() {
    const { theme: _theme, setTheme, resolvedTheme } = useNextTheme();
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    const toggleTheme = () => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
    };

    // Return safe values during SSR/hydration
    const safeTheme = mounted ? (resolvedTheme as "dark" | "light") : "dark";

    return {
        theme: safeTheme,
        toggleTheme,
        setTheme,
        mounted
    };
}
