/**
 * @fileoverview Shimmering Text Animation Component
 * 
 * Creates an animated shimmer effect across text content using
 * CSS gradient masking and Framer Motion. Used for loading states
 * and attention-grabbing text displays.
 * 
 * @module components/ui/ShimmeringText
 * @requires framer-motion
 */

import { useMemo, useRef } from "react";
import { motion, useInView } from "framer-motion";

/**
 * Utility function to merge CSS class names.
 * @param {...string} classes - Class names to merge
 * @returns {string} Space-separated class string
 */
const cn = (...classes) => classes.filter(Boolean).join(" ");

/**
 * Text component with animated shimmer effect.
 * 
 * Uses a moving gradient overlay to create a "scanning" or "loading" effect
 * across the text. Supports viewport-triggered animation and customization.
 * 
 * @component
 * @param {Object} props
 * @param {string} props.text - Text content to display
 * @param {number} [props.duration=2] - Animation duration in seconds
 * @param {number} [props.delay=0] - Animation start delay
 * @param {boolean} [props.repeat=true] - Whether to loop the animation
 * @param {number} [props.repeatDelay=0.5] - Delay between animation loops
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.startOnView=true] - Start animation when in viewport
 * @param {boolean} [props.once=false] - Only animate once
 * @param {string} [props.inViewMargin] - Intersection observer margin
 * @param {number} [props.spread=2] - Shimmer spread multiplier
 * @param {string} [props.color] - Base text color (default: gray-400)
 * @param {string} [props.shimmerColor] - Shimmer highlight color (default: gray-900)
 * @returns {JSX.Element} Animated text span
 * 
 * @example
 * <ShimmeringText text="Loading your data..." duration={3} />
 */
export function ShimmeringText({
    text,
    duration = 2,
    delay = 0,
    repeat = true,
    repeatDelay = 0.5,
    className,
    startOnView = true,
    once = false,
    inViewMargin,
    spread = 2,
    color,
    shimmerColor,
}) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once, margin: inViewMargin });

    // Calculate shimmer width based on text length
    const dynamicSpread = useMemo(() => {
        return text.length * spread;
    }, [text, spread]);

    const shouldAnimate = !startOnView || isInView;

    return (
        <motion.span
            ref={ref}
            className={cn(
                "relative inline-block bg-[length:250%_100%,auto] bg-clip-text text-transparent",
                "bg-no-repeat",
                className
            )}
            style={{
                "--spread": `${dynamicSpread}px`,
                "--base-color": color || "#9ca3af",
                "--shimmer-color": shimmerColor || "#111827",
                "--shimmer-bg": "linear-gradient(90deg, transparent calc(50% - var(--spread)), var(--shimmer-color), transparent calc(50% + var(--spread)))",
                backgroundImage: "var(--shimmer-bg), linear-gradient(var(--base-color), var(--base-color))",
                backgroundPosition: "100% center",
            }}
            initial={{
                backgroundPosition: "100% center",
                opacity: 0,
            }}
            animate={
                shouldAnimate
                    ? {
                        backgroundPosition: "0% center",
                        opacity: 1,
                    }
                    : {}
            }
            transition={{
                backgroundPosition: {
                    repeat: repeat ? Infinity : 0,
                    duration,
                    delay,
                    repeatDelay,
                    type: "tween",
                    ease: "linear"
                },
                opacity: {
                    duration: 0.3,
                    delay,
                },
            }}
        >
            {text}
        </motion.span>
    );
}

export default ShimmeringText;
