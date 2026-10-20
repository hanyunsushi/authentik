import type { MenuOption } from "./menu-model";
import { menuIconPath } from "./menu-model";
import {
    SPRING_LAYOUT,
    SUBMENU_VARIANTS,
    SUBMENU_ITEM_VARIANTS,
    RAIL_TRANSITION,
    RAIL_CONTENT_VARIANTS,
    RAIL_STAGGER_VARIANTS,
    RAIL_LABEL_VARIANTS,
} from "./sidebar-motion";

import {
    motion,
    AnimatePresence,
    MotionContext,
    useReducedMotion,
    type HTMLMotionProps,
    type Variants,
} from "framer-motion";
/* eslint-disable react/refs -- The canonical Motion adapter snapshots mount state for late menu data. */
// 侧边栏 / 组件绘制动画：保留第一设计系统原 Motion 树；Lit 提供权限、路由与菜单数据。
// Derived from QingZhou, CC BY-NC-SA 4.0. See ATTRIBUTION.md.
import React, {
    Children,
    cloneElement,
    forwardRef,
    isValidElement,
    createContext,
    useContext,
    useId,
    useState,
    useRef,
    useLayoutEffect,
    useImperativeHandle,
    type HTMLAttributes,
    type ReactNode,
    type ReactElement,
    type MouseEvent,
    type Ref,
} from "react";
const cn = (...v: unknown[]) => v.filter(Boolean).join(" ");

// 侧边栏 / 组件绘制动画：入场终值释放filter层，避免共享背景跨行时遮住相邻行文字。
const SUBMENU_SHARED_ITEM_VARIANTS: Variants = {
    ...SUBMENU_ITEM_VARIANTS,
    open: { ...SUBMENU_ITEM_VARIANTS.open, transitionEnd: { filter: "none" } },
};

interface SharedLayoutBgProps
    extends
        Omit<HTMLAttributes<HTMLElement>, "children">,
        Pick<HTMLMotionProps<"ul">, "variants" | "initial" | "animate" | "exit" | "transition"> {
    children: ReactNode;
    /** Semantic container used for the children. */
    as?: "div" | "ul";
    /** Tailwind class applied to the moving pill. Defaults to a subtle foreground tint. */
    pillClassName?: string;
    /** Horizontal inset of the pill relative to each row (px). Default 20. */
    inset?: number;
    /** Optional positioning override for the pill wrapper inside each item. */
    pillContainerClassName?: string;
}

const variants: Variants = {
    initial: { opacity: 0, filter: "blur(6px)" },
    animate: { opacity: 1, filter: "blur(0px)" },
    exit: (isActive: boolean) => (!isActive ? { opacity: 0, filter: "blur(6px)" } : {}),
};

const reducedVariants: Variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: (isActive: boolean) => (!isActive ? { opacity: 0 } : {}),
};

const SharedLayoutBg = forwardRef<HTMLElement, SharedLayoutBgProps>(function SharedLayoutBg(
    {
        children,
        as = "div",
        className,
        onMouseLeave,
        pillClassName,
        pillContainerClassName,
        inset = 20,
        ...props
    },
    forwardedRef,
) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const uid = useId();
    const reduce = useReducedMotion();

    const renderedChildren = Children.toArray(children)
        .filter(isValidElement)
        .map((child, index) => {
            const el = child as ReactElement<{
                className?: string;
                onMouseEnter?: () => void;
                children?: ReactNode;
            }>;

            const childKey = el.key ? String(el.key) : `item-${index}`;

            return cloneElement(
                el,
                {
                    key: childKey,
                    className: cn("relative", el.props.className),
                    onMouseEnter: () => {
                        el.props.onMouseEnter?.();
                        setActiveId(childKey);
                    },
                },
                <>
                    <AnimatePresence custom={activeId !== null}>
                        {activeId !== null ? (
                            <motion.div
                                variants={reduce ? reducedVariants : variants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                custom={activeId !== null}
                                className={cn(
                                    "pointer-events-none absolute inset-y-0",
                                    pillContainerClassName,
                                )}
                                style={{ left: -inset, right: -inset }}
                            >
                                {activeId === childKey ? (
                                    <motion.div
                                        layoutId={`shared-bg-${uid}`}
                                        transition={reduce ? { duration: 0 } : SPRING_LAYOUT}
                                        className={cn(
                                            "pointer-events-none h-full w-full rounded-2xl bg-muted/80",
                                            pillClassName,
                                        )}
                                    />
                                ) : null}
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                    <div className="relative z-10 sidebar-motion-content">{el.props.children}</div>
                </>,
            );
        });

    const handleMouseLeave = (event: MouseEvent<HTMLElement>) => {
        setActiveId(null);
        onMouseLeave?.(event);
    };

    // layoutRoot scopes the pill's layout projection to this list, so fixed or
    // scrolled ancestors can't smear scroll offsets into its movement.
    return as === "ul" ? (
        <motion.ul
            {...(props as HTMLMotionProps<"ul">)}
            ref={forwardedRef as Ref<HTMLUListElement>}
            layoutRoot
            onMouseLeave={handleMouseLeave}
            className={cn("flex w-full flex-col", className)}
        >
            {renderedChildren}
        </motion.ul>
    ) : (
        <motion.div
            {...(props as HTMLMotionProps<"div">)}
            ref={forwardedRef as Ref<HTMLDivElement>}
            layoutRoot
            onMouseLeave={handleMouseLeave}
            className={cn("flex w-full flex-col", className)}
        >
            {renderedChildren}
        </motion.div>
    );
});

// 侧边栏：宿主 label/icon 作为只读菜单数据渲染，不改变Motion组件树与父子variants。
function MenuContent({ item, icon = false }: { item: MenuOption; icon?: boolean }) {
    return icon ? (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d={menuIconPath(item.icon)} />
        </svg>
    ) : (
        <span>
            {item.label}
            {item.enterpriseRequired && (
                <small className="enterprise-notice">{item.enterpriseRequired}</small>
            )}
        </span>
    );
}

// 侧边栏 / 组件绘制动画：只桥接原整栏的variant祖先；由原Motion父级安排30ms错峰，不逐项自控或重写延迟。
const RailVariantContext = createContext<React.ContextType<typeof MotionContext>>({});

function RailVariantScope({ children }: { children: ReactNode }) {
    const rail = useContext(MotionContext);

    return <RailVariantContext.Provider value={rail}>{children}</RailVariantContext.Provider>;
}

function RailLabel({
    item,
    collapsed,
    reduce,
    projectChild,
}: {
    item: MenuOption;
    collapsed: boolean;
    reduce: boolean;
    projectChild: boolean;
}) {
    const rail = useContext(RailVariantContext);

    const label = (
        <motion.span
            variants={reduce ? undefined : RAIL_LABEL_VARIANTS}
            initial={projectChild ? false : undefined}
            animate={reduce ? { x: 0, opacity: collapsed ? 0 : 1 } : undefined}
            className="n-menu-item-content-header"
            aria-hidden={collapsed}
        >
            {!collapsed && <MenuContent item={item} />}
        </motion.span>
    );

    // 项目披露的y/blur仍由物理父行执行；文字回接整栏祖先，避免open/closed同名状态串用。
    return projectChild ? (
        <MotionContext.Provider value={rail}>{label}</MotionContext.Provider>
    ) : (
        label
    );
}

// 附件2的根motion直接驱动现有aside，React菜单树仍在此真实DOM祖先内；不再跨两套动画引擎。
const ExistingRail = forwardRef<HTMLElement, { target: HTMLElement; children?: ReactNode }>(
    function ExistingRail({ target, children }, ref) {
        useImperativeHandle(ref, () => target, [target]);

        return <>{children}</>;
    },
);

const MotionRail = motion.create(ExistingRail);
const MotionScroll = motion.create(ExistingRail);

export interface SidebarMotionProps {
    host: HTMLElement;
    options: MenuOption[];
    value?: string | number;
    projectKey?: string;
    collapsed: boolean;
    expandedKeys: Array<string | number>;
    select: (item: MenuOption) => void;
    toggle: (item: MenuOption) => void;
}

export function SidebarMotion(props: SidebarMotionProps) {
    const reduce = useReducedMotion(),
        uid = useId(),
        rail = (props.host.getRootNode() as ShadowRoot).host as HTMLElement;

    const groups = groupItems(props.options);

    return (
        <MotionRail
            target={rail ?? props.host}
            initial={false}
            animate={props.collapsed ? "closed" : "open"}
            variants={
                rail
                    ? {
                          open: {
                              width: matchMedia("(width <= 768px)").matches ? "300px" : "264px",
                          },
                          closed: { width: "72px" },
                      }
                    : { open: {}, closed: {} }
            }
            transition={reduce ? { duration: 0 } : RAIL_TRANSITION}
        >
            <motion.div variants={RAIL_CONTENT_VARIANTS}>
                <MotionScroll target={props.host.parentElement ?? props.host} layoutScroll>
                    <motion.div
                        className="n-menu motion-sidebar-menu"
                        variants={RAIL_STAGGER_VARIANTS}
                    >
                        <RailVariantScope>
                            {renderGroups(groups, props, uid + "-active", !!reduce)}
                        </RailVariantScope>
                    </motion.div>
                </MotionScroll>
            </motion.div>
        </MotionRail>
    );
}

// 多项目路由导航：最高层的直接孩子是各项目；项目内容保留原分组和共享悬浮作用域。
function groupItems(options: MenuOption[]) {
    const visible = options.filter((item) => item.show !== false);

    if (visible.length && visible.every((item) => item.sidebarProject))
        return [{ key: "projects", group: false, item: visible[0], items: visible }];

    return visible.map((item, index) => ({
        key: String(item.key ?? index),
        group: item.type === "group",
        item,
        items: (item.type === "group" ? (item.children ?? []) : [item])
            .filter((child) => child.show !== false)
            .map((child) => (item.disabled ? { ...child, disabled: true } : child)),
    }));
}

// 组件绘制动画：首次披露保留父级错峰；已挂载列表随后收到异步菜单时跳过旧的closed快照。
function ProjectChildren({
    items,
    props,
    activeId,
    reduce,
}: {
    items: MenuOption[];
    props: SidebarMotionProps;
    activeId: string;
    reduce: boolean;
}) {
    const mounted = useRef(false);

    useLayoutEffect(() => {
        mounted.current = true;
    }, []);

    return <>{renderGroups(groupItems(items), props, activeId, reduce, true, mounted.current)}</>;
}

// 侧边栏 / 组件绘制动画：悬浮增强必须接到实际li，不能把只返回Fragment的中间组件当菜单行。
const SubmenuChildren = forwardRef<
    HTMLElement,
    { items: MenuOption[]; props: SidebarMotionProps; activeId: string; reduce: boolean }
>(function SubmenuChildren({ items, props, activeId, reduce }, ref) {
    const mounted = useRef(false);

    useLayoutEffect(() => {
        mounted.current = true;
    }, []);

    return (
        <SharedLayoutBg
            ref={ref}
            as="ul"
            inset={0}
            pillClassName="sidebar-hover-projection"
            pillContainerClassName="sidebar-hover-container"
            id={activeId}
            className="n-submenu-children sidebar-submenu-motion-list"
            role="group"
            variants={reduce ? undefined : SUBMENU_VARIANTS}
            initial={reduce ? false : "closed"}
            animate={reduce ? { opacity: 1 } : "open"}
            exit={reduce ? { opacity: 0 } : "closed"}
            transition={reduce ? { duration: 0.12 } : undefined}
        >
            {items.map((item) =>
                renderItem({
                    ...props,
                    item,
                    activeId,
                    reduce,
                    nested: true,
                    late: mounted.current,
                }),
            )}
        </SharedLayoutBg>
    );
});

function renderGroups(
    groups: ReturnType<typeof groupItems>,
    props: SidebarMotionProps,
    activeId: string,
    reduce: boolean,
    projectChild = false,
    late = false,
) {
    return groups.map((group) => (
        <div key={group.key} className={group.group ? "n-menu-item-group" : undefined}>
            {group.group && (
                <div className="n-menu-item-group-title">
                    <MenuContent item={group.item} />
                </div>
            )}
            <SharedLayoutBg
                as="ul"
                inset={0}
                pillClassName="sidebar-hover-projection"
                pillContainerClassName={
                    group.items[0]?.sidebarProject
                        ? "sidebar-hover-container sidebar-project-hover-container"
                        : "sidebar-hover-container"
                }
                className="sidebar-motion-list"
            >
                {group.items.map((item) =>
                    item.type === "divider" ? (
                        <hr key={String(item.key)} className="sidebar-menu-divider" />
                    ) : (
                        renderItem({ ...props, item, activeId, reduce, projectChild, late })
                    ),
                )}
            </SharedLayoutBg>
        </div>
    ));
}

function renderItem({
    item,
    activeId,
    reduce,
    nested = false,
    projectChild = false,
    late = false,
    ...props
}: SidebarMotionProps & {
    item: MenuOption;
    activeId: string;
    reduce: boolean;
    nested?: boolean;
    projectChild?: boolean;
    late?: boolean;
}) {
    const children = item.children
        ?.filter((child) => child.show !== false)
        .map((child) => (item.disabled ? { ...child, disabled: true } : child));

    const project = !!item.sidebarProject,
        expandable = project || !!children?.length,
        open =
            (project || !props.collapsed) &&
            props.expandedKeys.includes(item.key as string | number);

    const contains = (it: MenuOption): boolean =>
        (String(it.sidebarRouteKey ?? it.key) === String(props.value) &&
            (!it.sidebarProjectOwner || it.sidebarProjectOwner === props.projectKey)) ||
        !!it.children?.some(contains);

    const active = project ? item.sidebarProjectKey === props.projectKey : contains(item),
        label = String(
            item.sidebarLabel ?? (typeof item.label === "string" ? item.label : item.key),
        );

    const choose = () => {
        if (!item.disabled) (expandable ? props.toggle : props.select)(item);
    };

    const Row = expandable ? "button" : "a";

    const content = (
        <>
            <div className={cn("n-menu-item sidebar-row-track", project && "sidebar-project-row")}>
                <Row
                    href={expandable ? undefined : item.href}
                    type={expandable ? "button" : undefined}
                    data-testid={expandable ? "sidebar-group-toggle" : "sidebar-navigation-link"}
                    data-menu-key={String(item.key)}
                    className={cn(
                        "n-menu-item-content",
                        project && "sidebar-project-route",
                        !expandable && active && "n-menu-item-content--selected",
                        expandable && active && "n-menu-item-content--child-active",
                    )}
                    aria-disabled={!!item.disabled}
                    aria-current={
                        project && active ? "location" : !expandable && active ? "page" : undefined
                    }
                    aria-expanded={expandable ? open : undefined}
                    aria-controls={expandable ? activeId + "-sub-" + String(item.key) : undefined}
                    aria-label={project || props.collapsed ? label : undefined}
                    title={project || props.collapsed ? label : undefined}
                    onClick={choose}
                >
                    {active && (
                        <motion.span
                            layoutId={activeId}
                            transition={reduce ? { duration: 0 } : SPRING_LAYOUT}
                            className="sidebar-active-projection"
                            aria-hidden="true"
                        />
                    )}
                    {project ? (
                        <span className="sidebar-project-icon" aria-hidden="true">
                            {item.icon ? (
                                <MenuContent item={item} icon />
                            ) : (
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.6"
                                    strokeLinejoin="round"
                                >
                                    <path d="m12 3 9 5-9 5-9-5 9-5Z" />
                                    <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
                                </svg>
                            )}
                        </span>
                    ) : item.icon ? (
                        <span className="n-menu-item-content__icon" aria-hidden="true">
                            <MenuContent item={item} icon />
                        </span>
                    ) : (
                        <span className="sidebar-empty-icon" aria-hidden="true" />
                    )}
                    {/* 侧边栏 / 组件绘制动画：项目披露移动整行；文字仅响应整栏状态，不继承项目open/closed。 */}
                    {project ? (
                        <span className="n-menu-item-content-header sidebar-project-copy">
                            <strong>{label}</strong>
                            {!!item.sidebarCaption && <small>{String(item.sidebarCaption)}</small>}
                        </span>
                    ) : nested ? (
                        <span className="n-menu-item-content-header">
                            <MenuContent item={item} />
                        </span>
                    ) : (
                        <RailLabel
                            item={item}
                            collapsed={props.collapsed}
                            reduce={reduce}
                            projectChild={projectChild}
                        />
                    )}
                    {expandable && (
                        <motion.span
                            className="sidebar-motion-arrow"
                            aria-hidden="true"
                            initial={false}
                            animate={{
                                opacity: props.collapsed ? 0 : 1,
                                rotate: open ? 90 : 0,
                                x: props.collapsed ? 4 : 0,
                            }}
                            transition={reduce ? { duration: 0 } : SPRING_LAYOUT}
                        >
                            <i className="sidebar-chevron" />
                        </motion.span>
                    )}
                </Row>
            </div>
            {expandable && (
                <AnimatePresence initial={false} mode="popLayout">
                    {/* 侧边栏 / 组件绘制动画：子菜单独立复用源码悬浮面与选中面，保留原展开/退出variants。 */}
                    {open &&
                        (project ? (
                            <motion.div
                                key="project-content"
                                id={activeId + "-project-" + String(item.key)}
                                className="sidebar-project-content"
                                role="group"
                                aria-label={label + "导航"}
                                variants={reduce ? undefined : SUBMENU_VARIANTS}
                                initial={reduce ? false : "closed"}
                                animate={reduce ? { opacity: 1 } : "open"}
                                exit={reduce ? { opacity: 0 } : "closed"}
                                transition={reduce ? { duration: 0.12 } : undefined}
                            >
                                {/* 加载反馈：身份与原菜单准备期间不先输出匿名首页，准备完成一次揭示。 */}
                                {item.sidebarProjectLoading ? (
                                    <div
                                        className="sidebar-project-loading"
                                        role="status"
                                        aria-label="加载导航"
                                    >
                                        <span className="dot-matrix-loader" aria-hidden="true" />
                                    </div>
                                ) : (
                                    <ProjectChildren
                                        items={children ?? []}
                                        props={props}
                                        activeId={activeId + "-project-" + String(item.key)}
                                        reduce={reduce}
                                    />
                                )}
                            </motion.div>
                        ) : (
                            <SubmenuChildren
                                key="sidebar-submenu"
                                items={children!}
                                props={props}
                                activeId={activeId + "-sub-" + String(item.key)}
                                reduce={reduce}
                            />
                        ))}
                </AnimatePresence>
            )}
        </>
    );

    // 附件1：Motion li的layout与整项子variants保持原层级；每级SharedLayoutBg独立增强直接子项。
    // 组件绘制动画：异步加入已展开菜单的行从当前终态挂载，不继承父级首次closed快照；退出仍由父级variants编排。
    return (
        <motion.li
            key={String(item.key)}
            initial={late ? false : undefined}
            className={cn(
                project
                    ? "sidebar-project-section"
                    : expandable
                      ? "n-submenu"
                      : "n-menu-item sidebar-leaf",
                "sidebar-motion-item",
            )}
            role="none"
            aria-expanded={expandable ? open : undefined}
            layout={!nested && !reduce ? "position" : undefined}
            transition={!nested ? (reduce ? { duration: 0 } : SPRING_LAYOUT) : undefined}
            variants={
                (nested || projectChild) && !reduce ? SUBMENU_SHARED_ITEM_VARIANTS : undefined
            }
        >
            {content}
        </motion.li>
    );
}
