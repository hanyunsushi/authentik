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
    tasks: "M5 3h14v18H5Zm4 5 1.5 1.5L13 7m-4 6 1.5 1.5L13 11m2-3h2m-2 6h2",
    server: "M4 4h16v6H4Zm0 10h16v6H4Zm3-7h.01m0 10h.01m9-10h1m-1 10h1",
    filter: "M4 5h16M7 12h10m-7 7h4",
    inbox: "M4 4h16v15h-5l-3 3-3-3H4Zm0 9h5l2 3h2l2-3h5",
    plug: "M8 3v5m8-5v5M5 8h14v3a7 7 0 0 1-14 0Zm7 10v3",
    bell: "M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12h4",
    send: "m22 2-7 20-4-9-9-4Zm0 0L11 13",
    calendar: "M4 5h16v16H4Zm4-3v6m8-6v6M4 10h16m-12 4h3m-3 4h6",
    checklist: "M13 5h7M13 12h7M13 19h7M4 5l1.5 1.5L8 4m-4 8 1.5 1.5L8 11m-4 8 1.5 1.5L8 18",
    userRemove:
        "M15 21v-2a5 5 0 0 0-5-5H6a5 5 0 0 0-5 5v2m11-14a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm8 5h-6",
    download: "M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4",
    route: "M5 5h.01M19 19h.01M5 5v5a4 4 0 0 0 4 4h6a4 4 0 0 1 4 4m-3-13h6m-3-3 3 3-3 3M2 5a3 3 0 1 0 6 0 3 3 0 0 0-6 0Zm14 14a3 3 0 1 0 6 0 3 3 0 0 0-6 0Z",
    layers: "m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5m-18 5 9 5 9-5",
    file: "M5 2h9l5 5v15H5Zm9 0v6h5m-10 4h6m-6 4h6",
    star: "m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z",
    stage: "M4 4h6v6H4Zm10 10h6v6h-6ZM7 10v4a3 3 0 0 0 3 3h4m-2-3 2 3-2 3",
    message: "M4 4h16v13H9l-5 4Zm4 5h8m-8 4h5",
    badge: "M5 3h14v14H5Zm4 14-1 4 4-2 4 2-1-4m-7-8h6m-6 3h4",
    bot: "M12 3v3m-2-3h4M4 9h16v11H4Zm4 4h.01m8 0h.01M8 17h8m-13-5H2m20 0h-1",
    lock: "M5 10h14v11H5Zm3 0V7a4 4 0 0 1 8 0v3m-4 4v3",
    ticket: "M3 5h18v5a3 3 0 0 0 0 6v5H3v-5a3 3 0 0 0 0-6Zm9 1v2m0 3v2m0 3v2",
    palette:
        "M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1-3.7 1.5 1.5 0 0 1 .8-2.8H17a4 4 0 0 0 4-4c0-4.1-4-7.5-9-7.5ZM7 11h.01M10 7h.01m5 0h.01m3 4h.01",
    license: "M5 3h14v18H5Zm4 5h6m-6 4h6m-6 4h3m4-12v6l2-1.5 2 1.5V8",
    deviceGroups: "M4 5h5v5H4zM15 5h5v5h-5zM9 15h6v5H9zM6.5 10v3h11v-3",
    integration: "M7 4h4v4H7zM13 16h4v4h-4zM11 6h3a3 3 0 0 1 3 3v7M13 18h-3a3 3 0 0 1-3-3V8",
    attributes: "M20 13 11 22 2 13V4h9Zm-13-4h.01",
};

const routeIcons: Record<string, string> = {
    "/administration/overview": "home",
    "/administration/dashboard/users": "chart",
    "/administration/system-tasks": "tasks",
    "/core/applications": "applications",
    "/core/providers": "providers",
    "/outpost/outposts": "server",
    "/requests/rules": "filter",
    "/requests/access-requests": "inbox",
    "/endpoints/devices": "device",
    "/endpoints/groups": "deviceGroups",
    "/endpoints/connectors": "plug",
    "/events/log": "events",
    "/events/rules": "bell",
    "/events/transports": "send",
    "/events/lifecycle-rules": "calendar",
    "/events/lifecycle-reviews": "checklist",
    "/events/offboardings": "userRemove",
    "/events/exports": "download",
    "/policy/policies": "shield",
    "/core/property-mappings": "route",
    "/blueprints/instances": "layers",
    "/files": "file",
    "/policy/reputation": "star",
    "/flow/flows": "flows",
    "/flow/stages": "stage",
    "/flow/stages/prompts": "message",
    "/identity/users": "users",
    "/identity/groups": "groups",
    "/identity/roles": "badge",
    "/identity/agents": "bot",
    "/identity/object-attributes": "attributes",
    "/identity/initial-permissions": "lock",
    "/core/sources": "globe",
    "/core/tokens": "key",
    "/flow/stages/invitations": "ticket",
    "/core/brands": "palette",
    "/crypto/certificates": "certificate",
    "/outpost/integrations": "integration",
    "/admin/settings": "settings",
    "/enterprise/licenses": "license",
};

export function menuIconPath(icon = "applications"): string {
    return icons[icon] ?? icons.applications;
}

export function menuIconForPath(path: string): string {
    const normalizedPath = path.split(/[?#]/, 1)[0].replace(/\/$/, "");

    const route = Object.keys(routeIcons).find(
        (suffix) => normalizedPath === suffix || normalizedPath.endsWith(suffix),
    );

    if (route) return routeIcons[route];

    if (normalizedPath.endsWith("overview")) return "home";

    if (/dashboard|statistics/.test(normalizedPath)) return "chart";

    if (/users/.test(normalizedPath)) return "users";

    if (/agents/.test(normalizedPath)) return "bot";

    if (/groups/.test(normalizedPath)) return "groups";

    if (/roles/.test(normalizedPath)) return "badge";

    if (/providers/.test(normalizedPath)) return "providers";

    if (/outpost/.test(normalizedPath)) return "server";

    if (/connectors/.test(normalizedPath)) return "plug";

    if (/devices/.test(normalizedPath)) return "device";

    if (/prompts/.test(normalizedPath)) return "message";

    if (/stages/.test(normalizedPath)) return "stage";

    if (/flow/.test(normalizedPath)) return "flows";

    if (/invitations/.test(normalizedPath)) return "ticket";

    if (/token/.test(normalizedPath)) return "key";

    if (/certificates/.test(normalizedPath)) return "certificate";

    if (/licenses/.test(normalizedPath)) return "license";

    if (/permission/.test(normalizedPath)) return "lock";

    if (/reputation/.test(normalizedPath)) return "star";

    if (/policy/.test(normalizedPath)) return "shield";

    if (/tasks/.test(normalizedPath)) return "tasks";

    if (/events/.test(normalizedPath)) return "events";

    if (/brands/.test(normalizedPath)) return "palette";

    if (/settings|attributes/.test(normalizedPath)) return "settings";

    if (/sources/.test(normalizedPath)) return "globe";

    if (/blueprints/.test(normalizedPath)) return "layers";

    if (/files/.test(normalizedPath)) return "file";

    if (/mapping/.test(normalizedPath)) return "route";

    return "applications";
}

// 侧边栏：这些按路由绘制的SVG属于本fork；上游导航本身没有逐页SVG资源。
export function menuIconSvgForPath(path: string): string {
    const icon = menuIconPath(menuIconForPath(path));

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icon}" /></svg>`;
}
