/**
 * The animation system.
 *
 * Import from here, not from `motion/react` directly, unless you genuinely
 * need a primitive this barrel does not expose. Anything imported straight
 * from `motion/react` must use `m`, never `motion` — the app root runs
 * LazyMotion in strict mode.
 */
export * from "./tokens";
export { MotionProvider } from "./MotionProvider";
export { Reveal, type RevealProps } from "./Reveal";
export { Stagger, StaggerItem } from "./Stagger";
export { Pressable, PressableLink, pressMotion } from "./Pressable";
export { RevealImage, RevealFrame } from "./RevealImage";
export { PageTransition } from "./PageTransition";
export { AnimatedNumber } from "./AnimatedNumber";
