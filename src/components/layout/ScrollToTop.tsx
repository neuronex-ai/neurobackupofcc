import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const ScrollToTop = () => {
    const { pathname, hash } = useLocation();

    useEffect(() => {
        // If there is a hash (e.g., #pricing), handle scrolling to that element instead
        if (hash) {
            const element = document.getElementById(hash.slice(1));
            if (element) {
                element.scrollIntoView({ behavior: "smooth" });
                return;
            }
        }

        // Default scroll to top
        window.scrollTo(0, 0);
    }, [pathname, hash]);

    return null;
};
