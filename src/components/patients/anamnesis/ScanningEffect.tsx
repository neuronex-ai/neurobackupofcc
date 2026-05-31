import { motion } from "framer-motion";

export const ScanningEffect = ({ isActive }: { isActive: boolean }) => {
    if (!isActive) return null;

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[40px] z-10">
            {/* Subtle dark overlay */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />

            {/* Clean scan beam — single horizontal line */}
            <motion.div
                initial={{ top: "-5%" }}
                animate={{ top: ["-5%", "105%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-0 right-0"
            >
                <div className="h-px w-full bg-white/80 shadow-[0_0_20px_rgba(255,255,255,0.6)]" />
                <div className="h-16 w-full bg-gradient-to-b from-white/8 to-transparent" />
            </motion.div>

            {/* Single subtle pulse ring */}
            <motion.div
                initial={{ scale: 0.6, opacity: 0.4 }}
                animate={{ scale: [0.6, 1.3], opacity: [0.3, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
                className="absolute inset-0 m-auto w-48 h-48 border border-white/10 rounded-full"
            />
        </div>
    );
};
