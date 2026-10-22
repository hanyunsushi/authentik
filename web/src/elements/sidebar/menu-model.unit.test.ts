import { menuIconForPath, menuIconPath, menuIconSvgForPath } from "./menu-model";

import { describe, expect, it } from "vitest";

describe("microfrontend sidebar icons", () => {
    it("serializes the same path used by the native sidebar", () => {
        const path = "/core/applications";
        const icon = menuIconForPath(path);

        expect(menuIconSvgForPath(path)).toContain(`<path d="${menuIconPath(icon)}" />`);
    });

    it("retains distinct symbols for different navigation categories", () => {
        const icons = [
            menuIconForPath("/core/applications"),
            menuIconForPath("/identity/users"),
            menuIconForPath("/events/log"),
            menuIconForPath("/flows/instances"),
        ];

        expect(new Set(icons).size).toBe(icons.length);
    });

    it("uses route-specific symbols across the admin sidebar", () => {
        const routes = [
            "/administration/overview",
            "/administration/dashboard/users",
            "/administration/system-tasks",
            "/core/applications",
            "/core/providers",
            "/outpost/outposts",
            "/requests/rules",
            "/requests/access-requests",
            "/endpoints/devices",
            "/endpoints/groups",
            "/endpoints/connectors",
            "/events/log",
            "/events/rules",
            "/events/transports",
            "/events/lifecycle-rules",
            "/events/lifecycle-reviews",
            "/events/offboardings",
            "/events/exports",
            "/policy/policies",
            "/core/property-mappings",
            "/blueprints/instances",
            "/files",
            "/policy/reputation",
            "/flow/flows",
            "/flow/stages",
            "/flow/stages/prompts",
            "/identity/users",
            "/identity/groups",
            "/identity/roles",
            "/identity/agents",
            "/identity/object-attributes",
            "/identity/initial-permissions",
            "/core/sources",
            "/core/tokens",
            "/flow/stages/invitations",
            "/core/brands",
            "/crypto/certificates",
            "/outpost/integrations",
            "/admin/settings",
            "/enterprise/licenses",
        ];

        expect(new Set(routes.map((route) => menuIconPath(menuIconForPath(route)))).size).toBe(
            routes.length,
        );

        for (const route of routes) {
            const svg = menuIconSvgForPath(route);

            expect(svg).toContain('viewBox="0 0 24 24"');
            expect(svg).toContain('stroke="currentColor"');
            expect(svg).toContain(`<path d="${menuIconPath(menuIconForPath(route))}" />`);
        }
    });
});
