// 侧边栏 / 组件绘制动画：直接保留两个附件的 Motion variants；不再自行采样弹簧或猜测缺省动画。
import type { Transition, Variants } from "framer-motion";
export const SPRING_LAYOUT: Transition = { type: "spring", stiffness: 360, damping: 32, mass: 0.6 };
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
export const SUBMENU_TRANSITION: Transition = { duration: 0.18, ease: EASE_OUT };

export const SUBMENU_VARIANTS: Variants = {
    closed: {
        opacity: 0,
        clipPath: "inset(0 0 100% 0 round 8px)",
        transition: {
            duration: 0.14,
            ease: EASE_OUT,
            staggerChildren: 0.025,
            staggerDirection: -1,
        },
    },
    open: {
        opacity: 1,
        clipPath: "inset(0 0 0% 0 round 8px)",
        transition: { duration: 0.2, delayChildren: 0.035, ease: EASE_OUT, staggerChildren: 0.045 },
    },
};

export const SUBMENU_ITEM_VARIANTS: Variants = {
    closed: { opacity: 0, y: -6, filter: "blur(3px)" },
    open: { opacity: 1, y: 0, filter: "blur(0px)", transition: SUBMENU_TRANSITION },
};

// 悬浮包装与真正layoutId面是两层；退出函数的custom来自同一菜单作用域，不是整条nav。
export const HOVER_VARIANTS: Variants = {
    initial: { opacity: 0, filter: "blur(6px)" },
    animate: { opacity: 1, filter: "blur(0px)" },
    exit: (active: boolean) => (!active ? { opacity: 0, filter: "blur(6px)" } : {}),
};

export const REDUCED_HOVER_VARIANTS: Variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: (active: boolean) => (!active ? { opacity: 0 } : {}),
};

export const RAIL_TRANSITION: Transition = {
    type: "tween",
    ease: "easeOut",
    duration: 0.2,
    staggerChildren: 0.1,
};

export const RAIL_CONTENT_VARIANTS: Variants = {
    open: { display: "block", opacity: 1 },
    closed: { display: "block", opacity: 1 },
};

export const RAIL_LABEL_VARIANTS: Variants = {
    open: { x: 0, opacity: 1, transition: { x: { stiffness: 1000, velocity: -100 } } },
    closed: { x: -20, opacity: 0, transition: { x: { stiffness: 100 } } },
};

export const RAIL_STAGGER_VARIANTS = {
    open: { transition: { staggerChildren: 0.03, delayChildren: 0.02 } },
} satisfies Variants;
