import { motion } from 'framer-motion';

const SparrLoader = ({ size = 64, text = null, className = "" }) => {
    return (
        <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
            <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>

                {/* Outer Orbital Ring */}
                <motion.div
                    className="absolute inset-0 border-2 border-dashed border-blue-200 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                />

                {/* Inner Tech Ring (Cyan) */}
                <motion.div
                    className="absolute inset-2 border-2 border-cyan-500 rounded-full border-t-transparent border-l-transparent"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />

                {/* Core "Sparr" Blades (The Brand Mark) */}
                <motion.svg
                    width={size * 0.5}
                    height={size * 0.5}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                    <motion.path
                        d="M12 2L2 7L12 12L22 7L12 2Z"
                        fill="#2563EB"
                        className="opacity-80"
                    />
                    <motion.path
                        d="M2 17L12 22L22 17"
                        stroke="#06B6D4"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <motion.path
                        d="M2 12L12 17L22 12"
                        stroke="#3B82F6"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </motion.svg>

                {/* Pulsing Core Glow */}
                <motion.div
                    className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl"
                    animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            </div>

            {text && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center"
                >
                    <span className="text-sm font-bold tracking-widest text-gray-900 uppercase">{text}</span>
                    <div className="flex gap-1 mt-1">
                        <motion.div className="w-1 h-1 bg-blue-600 rounded-full" animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }} />
                        <motion.div className="w-1 h-1 bg-blue-600 rounded-full" animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} />
                        <motion.div className="w-1 h-1 bg-blue-600 rounded-full" animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} />
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default SparrLoader;
