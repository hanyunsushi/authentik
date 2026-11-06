import { ConsoleInterface } from "./Interface";

import { setConsoleRuntime, type ConsoleNavigationItem } from "#common/console";
import { DefaultUIConfig } from "#common/ui/config";

import {
    LicenseSummaryStatusEnum,
    CapabilitiesEnum,
    type LicenseSummary,
    type UserSelf,
} from "@goauthentik/api";

import { afterEach, describe, expect, it } from "vitest";

class NavigationFixture extends ConsoleInterface {
    capabilities = new Set<CapabilitiesEnum>();
    override can(capability: CapabilitiesEnum) {
        return this.capabilities.has(capability);
    }
    getNavigation() {
        return this.navigation();
    }
}

customElements.define("ak-console-navigation-fixture", NavigationFixture);

function paths(items: ConsoleNavigationItem[]): string[] {
    return items.flatMap((item) => [
        ...(item.path ? [item.path] : []),
        ...paths(item.children ?? []),
    ]);
}

afterEach(() => setConsoleRuntime(null));

describe("Console interface navigation", () => {
    it("follows the selected interface when an administrator switches in either direction", () => {
        setConsoleRuntime({
            context: { initialPath: "/", onNavigate() {}, onTopbarActions() {} },
            serviceURL: "",
            signal: new AbortController().signal,
            accessToken: async () => "",
            login: async () => {},
            logout: async () => {},
            onSession() {},
        });

        const root = new NavigationFixture();

        root.session = {
            user: { pk: 1, isSuperuser: true, systemPermissions: [] } as unknown as UserSelf,
        };

        root.uiConfig = {
            ...DefaultUIConfig,
            enabledFeatures: { ...DefaultUIConfig.enabledFeatures, settings: true },
        };

        for (const mode of ["admin", "user", "admin", "user"] as const) {
            root.setPath(`/if/${mode}/${mode === "admin" ? "administration/overview" : "library"}`);
            const published = paths(root.getNavigation());

            expect(published).toContain(
                mode === "admin" ? "/if/admin/core/applications" : "/if/user/library",
            );

            expect(
                published.filter((path) =>
                    path.startsWith(`/if/${mode === "admin" ? "user" : "admin"}/`),
                ),
            ).toEqual([]);

            if (mode === "user") expect(published).not.toContain("/if/user/settings");
        }
    });

    it("keeps feature flags and admin access checks when changing menus", () => {
        setConsoleRuntime({
            context: { initialPath: "/", onNavigate() {}, onTopbarActions() {} },
            serviceURL: "",
            signal: new AbortController().signal,
            accessToken: async () => "",
            login: async () => {},
            logout: async () => {},
            onSession() {},
        });

        const root = new NavigationFixture();

        root.session = {
            user: { pk: 2, isSuperuser: false, systemPermissions: [] } as unknown as UserSelf,
        };

        root.uiConfig = {
            ...DefaultUIConfig,
            enabledFeatures: { ...DefaultUIConfig.enabledFeatures, settings: false },
        };

        root.setPath("/if/user/library");
        expect(paths(root.getNavigation())).toEqual(["/", "/if/user/library"]);
        root.setPath("/if/admin/administration/overview");
        expect(paths(root.getNavigation())).toEqual(["/"]);
    });

    it("keeps stable group keys and marks detail ownership without replacing link destinations", () => {
        setConsoleRuntime({
            context: { initialPath: "/", onNavigate() {} },
            serviceURL: "",
            signal: new AbortController().signal,
            accessToken: async () => "",
            login: async () => {},
            logout: async () => {},
            onSession() {},
        });

        const root = new NavigationFixture();

        root.session = {
            user: { pk: 1, isSuperuser: true, systemPermissions: [] } as unknown as UserSelf,
        };

        root.setPath("/if/admin/identity/users/42");
        const items = root.getNavigation();
        const directory = items.find((item) => item.key === "directory")!;
        expect(directory.group).toBe(true);
        const user = directory.children!.find((item) => item.path === "/if/admin/identity/users")!;
        expect(user.activePath).toBe("/if/admin/identity/users/42");
        root.setPath("/if/admin/identity/groups/17");

        expect(
            root
                .getNavigation()
                .find((item) => item.key === "directory")!
                .children!.find((item) => item.path === user.path)!.activePath,
        ).toBeUndefined();
    });

    it("uses native capability and license rules for user navigation", () => {
        setConsoleRuntime({
            context: { initialPath: "/", onNavigate() {} },
            serviceURL: "",
            signal: new AbortController().signal,
            accessToken: async () => "",
            login: async () => {},
            logout: async () => {},
            onSession() {},
        });

        const root = new NavigationFixture();

        root.session = {
            user: { pk: 2, isSuperuser: false, systemPermissions: [] } as unknown as UserSelf,
        };

        root.uiConfig = {
            ...DefaultUIConfig,
            enabledFeatures: { ...DefaultUIConfig.enabledFeatures, requests: true, agents: true },
        };

        root.capabilities = new Set([
            CapabilitiesEnum.CanRequest,
            CapabilitiesEnum.CanAgentSelfService,
        ]);

        root.setPath("/if/user/library");
        root.licenseSummary = { status: LicenseSummaryStatusEnum.Valid } as LicenseSummary;

        expect(paths(root.getNavigation())).toEqual([
            "/",
            "/if/user/library",
            "/if/user/requests",
            "/if/user/agents",
        ]);

        root.licenseSummary = { status: LicenseSummaryStatusEnum.Unlicensed } as LicenseSummary;
        expect(paths(root.getNavigation())).toEqual(["/", "/if/user/library"]);
    });
});
