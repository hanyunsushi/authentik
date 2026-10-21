import type { SessionUser } from "@goauthentik/api";

export interface ConsoleNavigationItem {
    key: string;
    label: string;
    path?: string;
    group?: boolean;
    public?: boolean;
    expanded?: boolean;
    disabled?: boolean;
    children?: ConsoleNavigationItem[];
}

export interface ConsoleContext {
    initialPath: string;
    topbarTarget?: HTMLElement;
    onNavigate: (path: string) => void;
    onTopbarActions: (actions: { key: string; label: string; variant?: "primary" }[]) => void;
    onSession?: (session: { authenticated: boolean; isAdmin: boolean; username: string }) => void;
    onNavigation?: (items: ConsoleNavigationItem[]) => void;
    onPageLayout?: (layout: "page" | "content") => void;
    onHeader?: (header: { mounted: boolean; title: string; ready?: boolean }) => void;
    onVersion?: (version: string) => void;
    onVersionStatus?: (status: {
        state: "checking" | "current" | "available" | "error";
        latest?: string;
    }) => void;
}

export interface ConsoleRuntime {
    context: ConsoleContext;
    serviceURL: string;
    signal: AbortSignal;
    accessToken: () => Promise<string>;
    login: (selectAccount?: boolean) => Promise<void>;
    logout: () => Promise<void>;
    onSession: (session: SessionUser) => void;
}

let runtime: ConsoleRuntime | null = null;

export function consoleRuntime(): ConsoleRuntime | null {
    return runtime;
}

export function setConsoleRuntime(value: ConsoleRuntime | null): void {
    runtime = value;
}

// 微前端接入：宿主持有History，子应用仅发布属于自己的路径。
export function consoleNavigate(url: URL): boolean {
    if (
        !runtime ||
        url.origin !== window.location.origin ||
        !url.pathname.startsWith("/authentik/")
    ) {
        return false;
    }

    runtime.context.onNavigate(
        `${url.pathname.slice("/authentik".length)}${url.search}${url.hash}`,
    );

    return true;
}
