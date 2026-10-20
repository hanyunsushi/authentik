import "#elements/Spinner";
import PFButton from "@patternfly/patternfly/components/Button/button.css";
import PFSpinner from "@patternfly/patternfly/components/Spinner/spinner.css";

import { ERROR_CLASS, PROGRESS_CLASS, SUCCESS_CLASS } from "#common/constants";
import { PFSize } from "#common/enums";

import { AKElement } from "#elements/Base";
import { ifPresent } from "#elements/utils/attributes";

import { Task, TaskStatus } from "@lit/task";
import { css, html } from "lit";
import { property } from "lit/decorators.js";

// `pointer-events: none` makes the button inaccessible during the processing phase.

const buttonStyles = [
    PFButton,
    PFSpinner,
    css`
        /* 普通按钮 / 高亮弧边按钮：加载是原按钮状态；点阵绝对居中，标签保留宽度。 */
        #spinner-button.working {
            pointer-events: none;
        }
        #spinner-button.pf-m-in-progress {
            padding: 0 10px;
        }
        #spinner-button.pf-m-in-progress slot {
            visibility: hidden;
        }
        .pf-c-button__progress {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            display: inline-flex;
            margin: 0;
        }
    `,
];

const StatusMap = {
    [TaskStatus.INITIAL]: "",
    [TaskStatus.PENDING]: PROGRESS_CLASS,
    [TaskStatus.COMPLETE]: SUCCESS_CLASS,
    [TaskStatus.ERROR]: ERROR_CLASS,
} as const satisfies Record<TaskStatus, string>;

const SPINNER_TIMEOUT = 1000 * 1.5;

// milliseconds

/**
 * BaseTaskButton
 *
 * This is an abstract base class for our four-state buttons. It provides the four basic events of
 * this class: click, success, failure, reset. Subclasses can override any of these event handlers,
 * but overriding onSuccess() or onFailure() means that you must either call `onComplete` if you
 * want to preserve the TaskButton's "reset after completion" semantics, or inside `onSuccess` and
 * `onFailure` call their `super.` equivalents.
 */

export abstract class BaseTaskButton<R = unknown> extends AKElement {
    public eventPrefix = "ak-button";

    /**
     * Dispatch `${eventPrefix}-${suffix}`, bubbling and crossing shadow roots.
     */
    #dispatch(suffix: "click" | "success" | "failure" | "reset", detail: object = {}): void {
        this.dispatchEvent(
            new CustomEvent(`${this.eventPrefix}-${suffix}`, {
                bubbles: true,
                composed: true,
                detail,
            }),
        );
    }

    public static styles = [...buttonStyles];

    public callAction?(): Promise<R>;

    @property({ type: Boolean })
    public disabled = false;

    @property({ type: String })
    public label: string | null = null;

    protected buildTask() {
        return new Task<[], R>(this, {
            task: () => {
                if (typeof this.callAction !== "function") {
                    throw new TypeError("No action defined for SpinnerButton");
                }

                return this.callAction();
            },
            args: () => [],
            autoRun: false,
            onComplete: (r: R) => this.onSuccess(r),
            onError: (error) => this.onError(error),
        });
    }

    protected actionTask: Task = this.buildTask();

    protected onComplete() {
        setTimeout(() => {
            this.#dispatch("reset");
            // set-up for the next task...
            this.actionTask = this.buildTask();
            this.requestUpdate();
        }, SPINNER_TIMEOUT);
    }

    protected onSuccess(result: R): void {
        this.#dispatch("success", { result });

        this.onComplete();
    }

    protected onError(error: unknown) {
        this.#dispatch("failure", { error });

        this.onComplete();
    }

    protected onClick() {
        // Don't accept clicks when a task is in progress..
        if (this.actionTask.status === TaskStatus.PENDING) {
            return;
        }

        this.#dispatch("click");
        this.actionTask.run();
    }

    #spinner = html`<span class="pf-c-button__progress">
        <ak-spinner size=${PFSize.Small}></ak-spinner>
    </span>`;

    public get buttonClasses() {
        return [
            ...this.classList,
            StatusMap[this.actionTask.status],
            this.actionTask.status === TaskStatus.INITIAL ? "" : "working",
        ]
            .join(" ")
            .trim();
    }

    protected override render() {
        return html`<button
            id="spinner-button"
            part="spinner-button"
            data-testid="task-button"
            class="pf-c-button pf-m-progress ${this.buttonClasses}"
            @click=${this.onClick}
            type="button"
            aria-label=${ifPresent(this.label)}
            aria-busy=${this.actionTask.status === TaskStatus.PENDING ? "true" : "false"}
            ?disabled=${this.disabled || this.actionTask.status === TaskStatus.PENDING}
        >
            ${this.actionTask.render({
                pending: () => this.#spinner,
            })}
            <slot></slot>
        </button>`;
    }
}

export default BaseTaskButton;
