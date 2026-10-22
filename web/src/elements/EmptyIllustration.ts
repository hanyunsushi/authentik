import placeholder from "../assets/illustrations/kreeper-placeholder-transparent.svg";

import { AKElement } from "#elements/Base";

import { css, html } from "lit";
import { customElement } from "lit/decorators.js";

/** 提示信息：设计系统原件仅裁过留白；装饰插画不替代错误说明或DotMatrix。 */
@customElement("ak-empty-illustration")
export class EmptyIllustration extends AKElement {
    static styles = [
        css`
            :host {
                display: block;
                margin: 0 auto 9px;
                inline-size: 160px;
                max-inline-size: 100%;
                block-size: 100px;
            }
            img {
                display: block;
                inline-size: 100%;
                block-size: 100%;
                object-fit: contain;
            }
        `,
    ];

    render() {
        return html`<img
            src=${placeholder}
            alt=""
            aria-hidden="true"
            data-design-id="empty-illustration"
        />`;
    }
}
