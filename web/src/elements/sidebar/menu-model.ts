// 侧边栏 / 菜单归类级别：业务图标按路由职责区分，不以同一个占位图标代替全部入口。
export interface MenuOption {
    key: string | number;
    label: string;
    href?: string;
    icon?: string;
    type?: "group" | "divider";
    children?: MenuOption[];
    show?: boolean;
    disabled?: boolean;
    enterpriseRequired?: string;
    sidebarLabel?: string;
    sidebarProject?: boolean;
    sidebarRouteKey?: string | number;
    sidebarProjectOwner?: string;
    sidebarProjectKey?: string;
    sidebarCaption?: string;
    sidebarProjectLoading?: boolean;
}

const icons: Record<string, string> = {
    home: "m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z",
    applications: "M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z",
    providers: "M8 3v5m8-5v5M5 8h14v3a7 7 0 0 1-14 0Zm7 10v4",
    users: "M15 21v-2a5 5 0 0 0-5-5H6a5 5 0 0 0-5 5v2M18 8a3 3 0 0 1 0 6m4 7v-2a5 5 0 0 0-4-4M12 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
    groups: "M3 7h7l2 2h9v11H3ZM3 7V4h7l2 3",
    shield: "m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6Zm-4 10 3 3 5-6",
    events: "M5 3h14v18H5Zm4 5h6m-6 4h6m-6 4h4",
    settings: "M4 7h16M4 17h16M8 4v6m8 4v6",
    flows: "M9 3h6v6H9ZM2 16h6v6H2ZM16 16h6v6h-6ZM12 9v4M5 16v-3h14v3",
    key: "M14 8a5 5 0 1 1-4 8L3 23l-3-3 7-7a5 5 0 0 1 7-5ZM17 8h.01",
    device: "M3 3h18v14H3Zm5 18h8m-4-4v4",
    certificate: "M5 3h14v12H5Zm7 8 3 2v8l-3-2-3 2v-8Z",
    chart: "M3 3v18h18M7 16v-5m5 5V6m5 10V9",
    globe: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z",
    files: "M5 2h9l5 5v15H5Zm9 0v6h5M8 12h8m-8 4h6",
};

export function menuIconPath(icon = "applications"): string {
    return icons[icon] ?? icons.applications;
}

export function menuIconForPath(path: string): string {
    if (path.endsWith("overview")) return "home";

    if (/dashboard|statistics/.test(path)) return "chart";

    if (/users|agents/.test(path)) return "users";

    if (/groups|roles/.test(path)) return "groups";

    if (/providers|outpost|connectors/.test(path)) return "providers";

    if (/devices/.test(path)) return "device";

    if (/flow|stages/.test(path)) return "flows";

    if (/token|invitations/.test(path)) return "key";

    if (/certificates|licenses/.test(path)) return "certificate";

    if (/policy|permission|reputation/.test(path)) return "shield";

    if (/events|tasks/.test(path)) return "events";

    if (/brands|settings/.test(path)) return "settings";

    if (/sources/.test(path)) return "globe";

    if (/files|blueprints|mapping/.test(path)) return "files";

    return "applications";
}
