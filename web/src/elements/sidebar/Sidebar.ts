import "#elements/sidebar/SidebarVersion";
import { DefaultBrand, displayBrandingTitle } from "#common/ui/config";

import { AKElement } from "#elements/Base";
import { WithBrandConfig } from "#elements/mixins/branding";
import { toCurrentInterface } from "#elements/router/core/interfaces";
import { type MenuOption } from "#elements/sidebar/menu-model";
import { SidebarMotion } from "#elements/sidebar/sidebar-motion-react";
import MotionStyles from "#elements/sidebar/sidebar-motion.css";
import Styles from "#elements/sidebar/Sidebar.css";
import type { SidebarItem } from "#elements/sidebar/SidebarItem";
import { ThemedImage } from "#elements/utils/images";

import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";

import { msg } from "@lit/localize";
import { CSSResult, html, PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";

@customElement("ak-sidebar")
export class Sidebar extends WithBrandConfig(AKElement) {
    static styles: CSSResult[] = [MotionStyles, Styles];

    @property({ type: Boolean })
    hidden = false;

    @property({ type: Boolean, reflect: true })
    collapsed = false;

    @state()
    private filter = "";

    private menuRoot?: Root;
    private media = matchMedia("(width > 768px)");
    private observer = new MutationObserver(() => this.requestUpdate());
    private items = new Map<string | number, SidebarItem>();

    public override connectedCallback(): void {
        super.connectedCallback();
        this.addEventListener("ak-sidebar-model-change", this.modelChanged);
        this.observer.observe(this, { childList: true, subtree: true });
        window.addEventListener("keydown", this.shortcut);
        this.media.addEventListener("change", this.modelChanged);
    }

    public override disconnectedCallback(): void {
        super.disconnectedCallback();
        this.removeEventListener("ak-sidebar-model-change", this.modelChanged);
        this.observer.disconnect();
        this.media.removeEventListener("change", this.modelChanged);
        window.removeEventListener("keydown", this.shortcut);
        this.menuRoot?.unmount();
        this.menuRoot = undefined;
    }

    private modelChanged = () => this.requestUpdate();

    private keyboard = (event: KeyboardEvent) => {
        if (!(event.target instanceof HTMLElement)) return;
        const target = event.target.closest<HTMLElement>(".n-menu-item-content");

        if (!target) return;

        const buttons = Array.from(
            this.shadowRoot!.querySelectorAll<HTMLElement>(".n-menu-item-content"),
        ).filter(
            (item) =>
                item.offsetHeight &&
                !item.closest("[data-motion-pop-id]") &&
                item.getAttribute("aria-disabled") !== "true",
        );

        const index = buttons.indexOf(target);
        let next: HTMLElement | undefined;

        if (event.key === "ArrowDown") next = buttons[(index + 1) % buttons.length];
        else if (event.key === "ArrowUp")
            next = buttons[(index + buttons.length - 1) % buttons.length];
        else if (event.key === "Home") next = buttons[0];
        else if (event.key === "End") next = buttons.at(-1);
        else if (event.key === "ArrowRight") {
            if (target.getAttribute("aria-expanded") === "false") target.click();
            else
                next =
                    target
                        .closest(".sidebar-motion-item")
                        ?.querySelector<HTMLElement>(".n-submenu-children .n-menu-item-content") ??
                    undefined;
        } else if (event.key === "ArrowLeft") {
            if (target.getAttribute("aria-expanded") === "true") target.click();
            else
                next =
                    target
                        .closest(".n-submenu-children")
                        ?.parentElement?.querySelector<HTMLElement>(
                            ".sidebar-row-track .n-menu-item-content",
                        ) ?? undefined;
        } else if (event.key === " " && target.tagName === "A") target.click();
        else return;

        event.preventDefault();
        next?.focus();
    };

    private shortcut = (event: KeyboardEvent) => {
        const editing = event
            .composedPath()
            .some(
                (node) =>
                    node instanceof HTMLElement &&
                    (node.matches("input,textarea,select") || node.isContentEditable),
            );

        if (event.key !== "/" || editing || event.metaKey || event.ctrlKey || event.altKey) return;

        if (matchMedia("(width <= 768px)").matches && this.collapsed) return;
        event.preventDefault();

        if (this.collapsed)
            this.dispatchEvent(
                new CustomEvent("ak-sidebar-expand", { bubbles: true, composed: true }),
            );

        this.updateComplete.then(() =>
            this.shadowRoot?.querySelector<HTMLInputElement>("input")?.focus(),
        );
    };

    protected override willUpdate(changed: PropertyValues<this>): void {
        super.willUpdate(changed);

        if (changed.has("collapsed") && this.collapsed) {
            // 侧边栏：收起前清空筛选与深层披露；同轮绘制显示清空后的终态。
            this.filter = "";

            this.querySelectorAll("ak-sidebar-item").forEach((item) => {
                item.expanded = false;
            });
        }
    }

    protected override updated(changed: PropertyValues<this>): void {
        super.updated(changed);
        this.renderMenu();
    }

    private renderMenu(): void {
        const host = this.shadowRoot?.querySelector<HTMLElement>("#menu");

        if (!host) return;
        this.menuRoot ??= createRoot(host);
        this.items.clear();

        this.querySelectorAll("ak-sidebar-item").forEach((item) => {
            this.items.set(item.key ?? item.path ?? item.label ?? "navigation", item);
        });

        const query = this.filter.trim().toLocaleLowerCase();

        const filterItem = (item: MenuOption): MenuOption | null => {
            if (!query || item.label.toLocaleLowerCase().includes(query)) return item;

            const children = item.children
                ?.map(filterItem)
                .filter((child): child is MenuOption => child !== null);

            return children?.length ? { ...item, children } : null;
        };

        const options = Array.from(this.querySelectorAll<SidebarItem>(":scope > ak-sidebar-item"))
            .map((item) => item.toMenuOption())
            .filter((item): item is MenuOption => item !== null)
            .map(filterItem)
            .filter((item): item is MenuOption => item !== null);

        const expandedKeys = Array.from(this.items)
            .filter(([, item]) => item.expanded || !!query)
            .map(([key]) => key);

        const active = Array.from(this.items).find(([, item]) => item.current)?.[0];
        host.hidden = options.length === 0 || this.hidden;
        const empty = this.shadowRoot?.querySelector<HTMLElement>("#empty");

        if (empty) empty.hidden = options.length !== 0 || this.hidden;

        // 侧边栏 / 组件绘制动画：同步桥接让 Lit 生命周期和原 Motion 根共享单一可见菜单。
        flushSync(() =>
            this.menuRoot?.render(
                createElement(SidebarMotion, {
                    host,
                    options,
                    value: active,
                    collapsed: this.collapsed && matchMedia("(width > 768px)").matches,
                    expandedKeys,
                    select: () =>
                        this.dispatchEvent(
                            new CustomEvent("ak-sidebar-select", { bubbles: true, composed: true }),
                        ),
                    toggle: (item: MenuOption) => this.items.get(item.key)?.toggleFromMenu(),
                }),
            ),
        );
    }

    render() {
        const brand = this.brand ?? DefaultBrand;

        return html`<div part="nav" class="sidebar-surface" data-design-id="sidebar-shell">
            <!-- 品牌标识 / 顶栏：固定64px区，40px图标与标题/说明分轨。 -->
            <div class="brand-header">
                <a
                    class="brand"
                    href=${toCurrentInterface()}
                    data-testid="sidebar-home"
                    aria-label=${msg("Home")}
                >
                    ${ThemedImage({ src: brand.brandingFavicon ?? DefaultBrand.brandingFavicon, alt: "", theme: this.activeTheme, themedUrls: brand.brandingFaviconThemedUrls })}
                    <span class="brand-copy"
                        ><strong>${displayBrandingTitle(brand.brandingTitle)}</strong
                        ><small
                            >${msg("Administration", { id: "navigation.admin.caption" })}</small
                        ></span
                    >
                </a>
                <!-- 品牌标识：真实应用版本独立于首页链接，固定在64px品牌区右下角。 -->
                <ak-sidebar-version compact></ak-sidebar-version>
            </div>
            <nav id="global-nav" aria-label=${msg("Global navigation")} part="list">
                <!-- 侧边栏 / 填写框：筛选在原生滚动区，斜杠聚焦、Escape清空。 -->
                <div class="sidebar-filter">
                    <input
                        type="search"
                        data-testid="sidebar-filter"
                        aria-label=${msg("Filter navigation", { id: "navigation.filter.aria-label" })}
                        placeholder=${msg("Filter navigation", { id: "navigation.filter.placeholder" })}
                        .value=${this.filter}
                        @input=${(event: InputEvent) => {
                            this.filter = (event.target as HTMLInputElement).value;
                        }}
                        @keydown=${(event: KeyboardEvent) => {
                            if (event.key === "Escape") {
                                event.stopPropagation();
                                this.filter = "";
                            }
                        }}
                    />
                    <kbd aria-hidden="true">/</kbd>
                </div>
                <div id="menu" @keydown=${this.keyboard}></div>
                <p id="empty" hidden role="status">
                    ${msg("No results", { id: "navigation.filter.empty" })}
                </p>
            </nav>
            <!-- 普通按钮 / 侧边栏：全宽收起入口，双箭头及完整可访问名称。 -->
            <footer>
                <button
                    class="collapse"
                    type="button"
                    data-testid="sidebar-collapse"
                    aria-controls="global-nav"
                    aria-expanded=${!this.collapsed}
                    aria-label=${this.collapsed ? msg("Expand navigation") : msg("Collapse navigation")}
                    @click=${() => this.dispatchEvent(new CustomEvent("ak-sidebar-toggle", { bubbles: true, composed: true }))}
                >
                    <span class="double-chevron" aria-hidden="true"
                        ><svg viewBox="0 0 14 20"><path d="m9 5-5 5 5 5" /></svg
                        ><svg viewBox="0 0 14 20"><path d="m9 5-5 5 5 5" /></svg
                    ></span>
                    <span>${msg("Collapse navigation")}</span>
                </button>
            </footer>
            <div hidden><slot @slotchange=${this.modelChanged}></slot></div>
        </div>`;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "ak-sidebar": Sidebar;
    }
}
