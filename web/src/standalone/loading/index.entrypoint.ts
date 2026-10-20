import "#elements/Spinner";
import { AKElement } from "#elements/Base";

import { css, html, TemplateResult } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("ak-loading")
export class Loading extends AKElement {
    static styles = [
        css`
            :host {
                position: absolute;
                inset: 0;
                display: flex;
                flex-flow: column;
                place-items: center;
                justify-content: center;
                text-align: center;
                gap: var(--pf-global--spacer--md);
            }

            label {
                font-size: var(--pf-global--FontSize--xl);
                font-weight: var(--pf-global--FontWeight--normal);
                font-family: var(--pf-global--FontFamily--heading--sans-serif);
            }
        `,
    ];

    public connectedCallback(): void {
        super.connectedCallback();
        this.dataset.akInterfaceRoot = this.localName;
    }

    render(): TemplateResult {
        // 加载反馈：服务准备期只使用默认20px点阵，可读名称由组件提供。
        return html`<ak-spinner></ak-spinner>`;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "ak-loading": Loading;
    }
}
