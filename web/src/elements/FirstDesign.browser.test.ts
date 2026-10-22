import "#elements/buttons/SpinnerButton/index";
import "#elements/PageScrollbar";
import "#elements/Tooltip";
import "#elements/buttons/Dropdown";
import "#elements/sidebar/Sidebar";
import "#elements/sidebar/SidebarItem";
import "#elements/cards/AggregateCard";
import "#components/ak-switch-input";
import "#elements/EmptyState";
import "#user/LibraryPage/ak-library-application-empty-list";
import PFGlobals from "@patternfly/patternfly/base/patternfly-globals.css" with { type: "bundled-text" };
import PFVariables from "@patternfly/patternfly/base/patternfly-variables.css" with { type: "bundled-text" };
import PFButton from "@patternfly/patternfly/components/Button/button.css";
import PFDropdown from "@patternfly/patternfly/components/Dropdown/dropdown.css";
import PFFormControl from "@patternfly/patternfly/components/FormControl/form-control.css";
import PFSwitch from "@patternfly/patternfly/components/Switch/switch.css";

import { AKElement } from "#elements/Base";

import { CardMenu } from "#user/LibraryApplication/CardMenu";
import { AKLibraryApp } from "#user/LibraryApplication/index";
import ApplicationListStyles from "#user/LibraryPage/ApplicationList.css";

import Tokens from "#styles/first/tokens.css" with { type: "bundled-text" };

import type { Application } from "@goauthentik/api";

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";

import { html } from "lit";

// 普通/强调按钮与填写框：加载真实 PF 样式，回归跨层叠覆盖而非孤立 CSS 样本。
class FirstControlsFixture extends AKElement {
    static styles = [PFButton, PFFormControl, PFSwitch];

    render() {
        return html`<button class="pf-c-button pf-m-secondary">Normal</button>
            <a class="pf-c-button pf-m-primary" href="#">Emphasis</a>
            <button class="pf-c-button ak-first-default-arc">Cancel</button>
            <button class="pf-c-button pf-m-danger ak-first-highlight">Confirm</button>
            <input class="pf-c-form-control" aria-label="Username" />
            <ak-switch-input name="newTab" label="Open in a new tab"></ak-switch-input>`;
    }
}

customElements.define("ak-first-controls-fixture", FirstControlsFixture);

class FirstLibraryMenuFixture extends AKElement {
    static styles = [PFButton, PFDropdown, ApplicationListStyles];

    render() {
        return html`<div data-anchor-strategy="anchor-position" style="height:160px">
            ${CardMenu({
                cardID: "fixture-app",
                descriptionID: "fixture-description",
                application: { name: "Fixture" } as Application,
                editURL: "/if/admin/core/applications/fixture",
            })}
        </div>`;
    }
}

customElements.define("ak-first-library-menu-fixture", FirstLibraryMenuFixture);

const mounted: HTMLElement[] = [];

beforeEach(() => {
    const tokens = document.createElement("style");
    tokens.textContent = PFVariables + PFGlobals + Tokens;
    document.head.append(tokens);
    mounted.push(tokens);
});

afterEach(() => {
    mounted.forEach((element) => element.remove());
    mounted.length = 0;
});

describe("first design system integration", () => {
    it("draws validation icons once without changing input geometry or covering typed text", async () => {
        const fixture = new FirstControlsFixture();
        mounted.push(fixture);
        document.body.append(fixture);
        await fixture.updateComplete;
        const input = fixture.shadowRoot!.querySelector("input")!;
        const before = input.getBoundingClientRect();

        for (const status of ["invalid", "success", "warning"]) {
            input.setAttribute("aria-invalid", String(status === "invalid"));
            input.classList.toggle("pf-m-success", status === "success");
            input.classList.toggle("pf-m-warning", status === "warning");
            const style = getComputedStyle(input);
            expect(style.backgroundImage).toContain("data:image/svg+xml");
            expect(style.backgroundRepeat).toBe("no-repeat");
            expect(style.backgroundSize).not.toBe("auto");
            expect(style.backgroundPosition).not.toBe("0% 0%");
            expect(parseFloat(style.paddingRight)).toBeGreaterThanOrEqual(32);
            expect(input.getBoundingClientRect().height).toBe(before.height);
        }
    });

    it("keeps the portal action menu compact and its icon trigger square and keyboard reachable", async () => {
        const fixture = new FirstLibraryMenuFixture();
        mounted.push(fixture);
        document.body.append(fixture);
        await fixture.updateComplete;
        const button = fixture.shadowRoot!.querySelector("button")!;
        const menu = fixture.shadowRoot!.querySelector("menu")!;
        const rect = button.getBoundingClientRect();
        expect(rect.width).toBe(rect.height);
        expect(rect.width).toBeGreaterThanOrEqual(32);
        expect(getComputedStyle(button).borderRadius).toBe("8px");
        expect(button.tabIndex).toBe(0);
        button.click();
        expect(menu.matches(":popover-open")).toBe(true);
        const panel = menu.getBoundingClientRect();
        expect(panel.width).toBeLessThanOrEqual(320);
        expect(panel.width).toBeGreaterThan(100);
        expect(panel.right).toBeLessThanOrEqual(window.innerWidth);
        expect(panel.left).toBeGreaterThanOrEqual(0);
        expect(getComputedStyle(menu).filter).toBe("none");
        menu.hidePopover();
    });

    it("keeps the native switch value and both thumb endpoints inside the shared rail", async () => {
        const fixture = new FirstControlsFixture();
        mounted.push(fixture);
        document.body.append(fixture);
        await fixture.updateComplete;
        const control = fixture.shadowRoot!.querySelector("ak-switch-input")!;
        await control.updateComplete;
        const input = control.querySelector("input")!;
        const rail = control.querySelector<HTMLElement>(".pf-c-switch__toggle")!;
        const geometry = getComputedStyle(rail);
        expect([geometry.width, geometry.height]).toEqual(["40px", "23px"]);
        expect(getComputedStyle(rail, "::before").width).toBe("17px");
        expect(getComputedStyle(rail, "::before").left).toBe("3px");
        expect(getComputedStyle(rail, "::before").top).toBe("3px");
        expect(getComputedStyle(rail, "::before").transitionDuration).toBe("0.5s");
        input.click();
        await new Promise((resolve) => setTimeout(resolve, 550));
        expect(input.checked).toBe(true);
        expect(getComputedStyle(rail, "::before").transform).toBe("matrix(1, 0, 0, 1, 17, 0)");
        expect(input.name).toBe("newTab");
        input.disabled = true;
        input.click();
        expect(input.checked).toBe(true);
    });

    it("keeps input focus even and ordinary buttons neutral under PatternFly variants", async () => {
        const fixture = new FirstControlsFixture();
        mounted.push(fixture);
        document.body.append(fixture);
        await fixture.updateComplete;
        const root = fixture.shadowRoot!;
        const normal = root.querySelector("button")!;
        const emphasis = root.querySelector("a")!;
        const input = root.querySelector("input")!;
        const before = input.getBoundingClientRect();
        const padding = getComputedStyle(input).paddingBottom;
        input.focus();
        await new Promise((resolve) => setTimeout(resolve, 250));
        const focus = getComputedStyle(input);

        expect([
            focus.borderTopWidth,
            focus.borderRightWidth,
            focus.borderBottomWidth,
            focus.borderLeftWidth,
        ]).toEqual(["1px", "1px", "1px", "1px"]);

        expect(focus.paddingBottom).toBe(padding);
        expect(input.getBoundingClientRect().height).toBe(before.height);
        expect(focus.boxShadow).toContain("inset");
        // 浏览器鼠标可能停在前一用例位置；普通及悬浮态都必须保持中性文字。
        expect(["oklch(0.556 0 0)", "oklch(0.37 0 0)"]).toContain(getComputedStyle(normal).color);
        expect(getComputedStyle(normal).boxShadow).toContain("inset");
        expect(getComputedStyle(emphasis).boxShadow).toContain("1px");
        expect(getComputedStyle(emphasis).transitionTimingFunction).toContain("ease");
        expect(getComputedStyle(normal, "::after").display).toBe("none");
    });

    it("animates neutral and emphasis inner light without changing the ring, color or geometry", async () => {
        const fixture = new FirstControlsFixture();
        mounted.push(fixture);
        document.body.append(fixture);
        await fixture.updateComplete;

        for (const button of fixture.shadowRoot!.querySelectorAll<HTMLElement>(".pf-c-button")) {
            const color = getComputedStyle(button).color;
            const background = getComputedStyle(button).backgroundColor;
            const rect = button.getBoundingClientRect();
            await userEvent.hover(button);
            await new Promise((resolve) => setTimeout(resolve, 450));
            const hover = getComputedStyle(button);
            expect(hover.boxShadow).toContain("32px");
            expect(hover.boxShadow).toContain("1px");
            expect(hover.color).toBe(color);
            expect(hover.backgroundColor).toBe(background);
            expect(hover.transform).toBe("none");
            expect(button.getBoundingClientRect().width).toBe(rect.width);
            expect(button.getBoundingClientRect().height).toBe(rect.height);
            await userEvent.click(button);
            await userEvent.hover(fixture.shadowRoot!.querySelector("input")!);
            await new Promise((resolve) => setTimeout(resolve, 450));
            expect(getComputedStyle(button).boxShadow).not.toContain("32px");
        }
    });

    it("uses the provided illustration for empty/error states while loading stays a single dot matrix", async () => {
        const empty = document.createElement("ak-empty-state");

        empty.innerHTML =
            '<span>Unable to load</span><span slot="body">Retry this request.</span><button slot="primary">Retry</button>';

        const library = document.createElement("ak-library-application-empty-list");
        mounted.push(empty, library);
        document.body.append(empty, library);
        await empty.updateComplete;
        await library.updateComplete;

        for (const element of [empty, library]) {
            const illustration =
                element.shadowRoot!.querySelector<AKElement>("ak-empty-illustration")!;

            await illustration.updateComplete;
            const image = illustration.shadowRoot!.querySelector("img")!;
            await image.decode();
            expect(image.naturalWidth).toBeGreaterThan(0);
            expect(illustration.getBoundingClientRect().width).toBe(160);
            expect(illustration.getBoundingClientRect().height).toBe(100);
        }

        expect(empty.shadowRoot!.querySelector('slot[name="primary"]')).not.toBeNull();
        empty.loading = true;
        await empty.updateComplete;
        expect(empty.shadowRoot!.querySelector("ak-empty-illustration")).toBeNull();
        expect(empty.shadowRoot!.querySelectorAll("ak-spinner")).toHaveLength(1);
        expect(empty.shadowRoot!.querySelector('slot[name="body"]')).toBeNull();
    });

    it("keeps application card titles undecorated across the card and title hover boundaries", async () => {
        const fixture = new FirstLibraryMenuFixture();

        fixture.render = () =>
            html`<div style="position:relative;width:160px;height:160px">
                ${AKLibraryApp({ application: { pk: "hover", name: "Application", launchUrl: "#" } as Application })}
            </div>`;

        mounted.push(fixture);
        document.body.append(fixture);
        await fixture.updateComplete;

        const link = fixture.shadowRoot!.querySelector<HTMLAnchorElement>(
            "a.card-header-aspect-wrapper",
        )!;

        const title = fixture.shadowRoot!.querySelector<HTMLElement>('[part="card-title"]')!;

        for (const target of [link, title]) {
            await userEvent.hover(target);
            expect(getComputedStyle(link).textDecorationLine).toBe("none");
            expect(getComputedStyle(title).textDecorationLine).toBe("none");
            expect(getComputedStyle(title).webkitTextStrokeWidth).toBe("0px");
        }

        await userEvent.keyboard("{Tab}");
        link.focus();
        expect(getComputedStyle(link).outlineStyle).toBe("solid");
    });

    it("keeps every status tone on a neutral card boundary", async () => {
        const card = document.createElement("ak-aggregate-card");

        mounted.push(card);
        document.body.append(card);

        for (const tone of ["success", "warning", "danger", "neutral"] as const) {
            card.tone = tone;
            await card.updateComplete;
            const style = getComputedStyle(card.shadowRoot!.querySelector("section")!);

            expect(style.borderTopWidth).toBe(style.borderBottomWidth);
            expect(style.borderTopColor).toBe(style.borderBottomColor);
        }
    });

    it("opens an empty-table dropdown outside its clipping container", async () => {
        const wrapper = document.createElement("div");
        wrapper.style.cssText = "height:40px;width:300px;overflow:hidden";
        wrapper.innerHTML = `<ak-dropdown><button class="pf-c-dropdown__toggle">Options</button><menu class="pf-c-dropdown__menu" style="width:200px;height:120px"><li><button class="pf-c-dropdown__menu-item">Create provider</button></li></menu></ak-dropdown>`;
        mounted.push(wrapper);
        document.body.append(wrapper);
        const button = wrapper.querySelector<HTMLButtonElement>("button")!;
        const menu = wrapper.querySelector("menu")!;
        button.click();
        expect(menu.matches(":popover-open")).toBe(true);

        expect(menu.getBoundingClientRect().bottom).toBeGreaterThan(
            wrapper.getBoundingClientRect().bottom,
        );

        expect(button.ariaExpanded).toBe("true");
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        expect(menu.matches(":popover-open")).toBe(false);
        expect(menu.hidden).toBe(true);
        expect(document.activeElement).toBe(button);
    });

    it("renders static groups and opens nested groups from the visible collapsed rail", async () => {
        const sidebar = document.createElement("ak-sidebar");
        const section = document.createElement("ak-sidebar-item");
        const group = document.createElement("ak-sidebar-item");
        const leaf = document.createElement("ak-sidebar-item");
        section.label = "Directory";
        group.label = "People";
        group.path = "people";
        leaf.label = "Users";
        leaf.path = "users";
        group.append(leaf);
        section.append(group);
        sidebar.append(section);
        sidebar.collapsed = true;
        mounted.push(sidebar);
        document.body.append(sidebar);
        await leaf.updateComplete;
        await group.updateComplete;
        await sidebar.updateComplete;
        await sidebar.updateComplete;
        const root = sidebar.shadowRoot!;
        expect(root.querySelector(".n-menu-item-group-title")?.textContent).toContain("Directory");
        expect(root.querySelectorAll("#menu button")).toHaveLength(1);

        sidebar.addEventListener("ak-sidebar-expand", () => {
            sidebar.collapsed = false;
        });

        root.querySelector<HTMLButtonElement>("[data-testid='sidebar-group-toggle']")!.click();
        await group.updateComplete;
        await sidebar.updateComplete;
        expect(sidebar.collapsed).toBe(false);
        expect(group.expanded).toBe(true);

        expect(
            root
                .querySelector("[data-testid='sidebar-group-toggle']")
                ?.getAttribute("aria-expanded"),
        ).toBe("true");

        expect(root.querySelector("a[href$='users']")).not.toBeNull();
        leaf.current = true;
        await leaf.updateComplete;
        await sidebar.updateComplete;
        expect(root.querySelector("[aria-current='page']")?.textContent).toContain("Users");
        const filter = root.querySelector<HTMLInputElement>("input")!;
        filter.value = "missing navigation";
        filter.dispatchEvent(new Event("input", { bubbles: true }));
        await sidebar.updateComplete;
        expect(root.querySelector<HTMLElement>("#empty")?.hidden).toBe(false);
        expect(root.querySelector<HTMLElement>("#menu")?.hidden).toBe(true);
        filter.value = "Users";
        filter.dispatchEvent(new Event("input", { bubbles: true }));
        await sidebar.updateComplete;
        expect(root.querySelector("a[href$='users']")).not.toBeNull();
        sidebar.collapsed = true;
        await sidebar.updateComplete;
        expect(group.expanded).toBe(false);
        expect(filter.value).toBe("");
    });

    it("keeps task button geometry and blocks duplicate pending actions", async () => {
        const button = document.createElement("ak-spinner-button");
        let finish: (() => void) | undefined;
        let calls = 0;
        button.textContent = "Save";
        button.className = "pf-m-primary ak-first-highlight";

        button.callAction = () => {
            calls++;

            return new Promise<void>((resolve) => {
                finish = resolve;
            });
        };

        mounted.push(button);
        document.body.append(button);
        await button.updateComplete;
        const control = button.shadowRoot!.querySelector("button")!;
        const before = control.getBoundingClientRect();
        control.click();
        await button.updateComplete;
        expect(control.disabled).toBe(true);
        expect(control.getAttribute("aria-busy")).toBe("true");
        expect(control.getBoundingClientRect().width).toBe(before.width);
        expect(control.getBoundingClientRect().height).toBe(before.height);
        control.click();
        expect(calls).toBe(1);
        finish!();
    });

    it("keeps the document scrollbar reservation until its final owner disconnects", () => {
        const first = document.createElement("ak-page-scrollbar");
        const second = document.createElement("ak-page-scrollbar");

        mounted.push(first, second);
        document.body.append(first, second);
        expect(document.body.classList.contains("ak-first-scrollable")).toBe(true);

        first.remove();
        expect(document.body.classList.contains("ak-first-scrollable")).toBe(true);

        second.remove();
        expect(document.body.classList.contains("ak-first-scrollable")).toBe(false);
    });

    it("prevents closed tooltip content from widening the document", async () => {
        const container = document.createElement("div");

        container.style.cssText = "position:fixed;right:0;top:100px";

        const tooltip = document.createElement("ak-tooltip");

        tooltip.content = "A long label for an action at the right edge of the viewport";
        const trigger = document.createElement("span");

        trigger.textContent = "?";
        tooltip.append(trigger);
        container.append(tooltip);
        mounted.push(container);
        document.body.append(container);
        await tooltip.updateComplete;

        expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    });
});
