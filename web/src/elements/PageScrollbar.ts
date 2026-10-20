import { AKElement } from "#elements/Base";

import { css, html } from "lit";
import { customElement, state } from "lit/decorators.js";

let activeScrollbars = 0;

/** Decorative pointer control; native document keyboard scrolling remains available. */
@customElement("ak-page-scrollbar")
export class PageScrollbar extends AKElement {
    // 页面滚动条：16px 槽位含 1px 边界，8px 滑块在内部净宽居中。
    static styles = [
        css`
            :host {
                position: fixed;
                inset: 0 0 0 auto;
                inline-size: 16px;
                z-index: 120;
                border-inline-start: 1px solid var(--ak-first-border-strong);
            }
            .rail {
                block-size: 100%;
                position: relative;
                touch-action: none;
                user-select: none;
            }
            .thumb {
                position: absolute;
                inset-inline: 0;
                margin-inline: auto;
                inline-size: 8px;
                min-block-size: 24px;
                border-radius: 999px;
                background: #c7c7c7;
                cursor: grab;
            }
            .thumb:hover,
            .rail:active .thumb {
                background: #a8a8a8;
            }
            @media (width <= 768px) {
                :host {
                    display: none;
                }
            }
        `,
    ];

    @state() private thumbHeight = 0;
    @state() private thumbTop = 0;
    #frame = 0;
    #observer = new ResizeObserver(() => this.#schedule());
    #mutations = new MutationObserver(() => this.#schedule());
    #abort?: AbortController;

    #schedule = () => {
        cancelAnimationFrame(this.#frame);

        this.#frame = requestAnimationFrame(() => {
            const height = window.innerHeight;

            const total = Math.max(
                document.documentElement.scrollHeight,
                document.body.scrollHeight,
            );

            this.thumbHeight = total > height + 1 ? Math.max(24, (height * height) / total) : 0;

            this.thumbTop =
                total > height
                    ? (window.scrollY / (total - height)) * (height - this.thumbHeight)
                    : 0;
        });
    };

    connectedCallback(): void {
        super.connectedCallback();
        this.setAttribute("aria-hidden", "true");
        activeScrollbars += 1;
        document.body.classList.add("ak-first-scrollable");
        this.#abort = new AbortController();
        const options = { signal: this.#abort.signal, passive: true };
        window.addEventListener("scroll", this.#schedule, options);
        window.addEventListener("resize", this.#schedule, options);
        window.visualViewport?.addEventListener("resize", this.#schedule, options);
        this.#observer.observe(document.body);
        this.#observer.observe(document.documentElement);
        this.#mutations.observe(document.body, { childList: true, subtree: true });
        this.#schedule();
    }

    disconnectedCallback(): void {
        activeScrollbars -= 1;

        if (!activeScrollbars) document.body.classList.remove("ak-first-scrollable");
        this.#abort?.abort();
        this.#observer.disconnect();
        this.#mutations.disconnect();
        cancelAnimationFrame(this.#frame);
        super.disconnectedCallback();
    }

    #pointerDown = (event: PointerEvent) => {
        if (event.button !== 0 || !this.thumbHeight) return;
        event.preventDefault();
        const rail = event.currentTarget as HTMLElement;
        const start = event.clientY;
        const height = window.innerHeight;

        const range =
            Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) - height;

        const travel = height - this.thumbHeight;

        if (travel <= 0) return;
        const startTop = event.target === rail ? start - this.thumbHeight / 2 : this.thumbTop;

        const scroll = (top: number) =>
            window.scrollTo({
                top: (Math.max(0, Math.min(travel, top)) / travel) * range,
                behavior: "instant",
            });

        scroll(startTop);
        rail.setPointerCapture(event.pointerId);
        const move = (next: PointerEvent) => scroll(startTop + next.clientY - start);

        const done = () => {
            rail.removeEventListener("pointermove", move);
            rail.removeEventListener("pointerup", done);
            rail.removeEventListener("pointercancel", done);
        };

        rail.addEventListener("pointermove", move);
        rail.addEventListener("pointerup", done);
        rail.addEventListener("pointercancel", done);
    };

    render() {
        return html`<div class="rail" @pointerdown=${this.#pointerDown}>
            <div
                class="thumb"
                ?hidden=${!this.thumbHeight}
                style="height:${this.thumbHeight}px;top:${this.thumbTop}px"
            ></div>
        </div>`;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "ak-page-scrollbar": PageScrollbar;
    }
}
