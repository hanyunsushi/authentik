import { displayBrandingTitle } from "#common/ui/config";

import { describe, expect, it } from "vitest";

describe("displayBrandingTitle", () => {
    it("capitalizes only the default authentik product name", () => {
        expect(displayBrandingTitle()).toBe("Authentik");
        expect(displayBrandingTitle("authentik")).toBe("Authentik");
        expect(displayBrandingTitle("Example Identity")).toBe("Example Identity");
    });
});
