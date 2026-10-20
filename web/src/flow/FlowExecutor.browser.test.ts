import { FlowExecutor } from "#flow/FlowExecutor";

import { ChallengeTypes, FlowsApi } from "@goauthentik/api";

import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
    document.querySelectorAll("ak-flow-executor").forEach((element) => element.remove());
    document.querySelectorAll("form[data-test-autosubmit]").forEach((form) => form.remove());
    vi.restoreAllMocks();
});

it("blanks the complete form during a request without losing entered values", async () => {
    const challenge = {
        component: "xak-flow-shell",
        body: '<form><label>Username<input name="username"></label><button>Continue</button></form>',
    } as ChallengeTypes;

    let finish!: (value: ChallengeTypes) => void;

    vi.spyOn(FlowsApi.prototype, "flowsExecutorSolve").mockImplementation(
        () =>
            new Promise((resolve) => {
                finish = resolve;
            }),
    );

    const executor = new FlowExecutor();
    executor.flowSlug = "";
    executor.challenge = challenge;
    document.body.append(executor);

    await vi.waitFor(() => {
        expect(executor.shadowRoot!.querySelector("main")!.ariaBusy).toBe("false");
    });

    executor.flowSlug = "test-flow";
    const content = executor.shadowRoot!.querySelector<HTMLElement>(".ak-flow-content")!;
    const input = content.querySelector("input")!;
    input.value = "entered-user";
    const request = executor.submit({ component: "ak-stage-identification" });
    await executor.updateComplete;
    expect(content.inert).toBe(true);
    expect(getComputedStyle(content).visibility).toBe("hidden");
    expect(executor.shadowRoot!.querySelectorAll("ak-loading-overlay")).toHaveLength(1);
    expect(content.querySelector("input")).toBe(input);
    expect(input.value).toBe("entered-user");

    finish(challenge);
    await request;
    await executor.updateComplete;
    expect(content.inert).toBe(false);
    expect(getComputedStyle(content).visibility).toBe("visible");
    expect(executor.shadowRoot!.querySelector("ak-loading-overlay")).toBeNull();
    expect(input.value).toBe("entered-user");
});

it("preserves and disables the current stage during autosubmit navigation", async () => {
    vi.spyOn(FlowsApi.prototype, "flowsExecutorSolve").mockResolvedValue({
        component: "ak-stage-autosubmit",
        url: "https://example.com/sso",
        attrs: { SAMLResponse: "response" },
    });

    const formSubmit = vi
        .spyOn(HTMLFormElement.prototype, "submit")
        .mockImplementation(function submit(this: HTMLFormElement) {
            this.dataset.testAutosubmit = "true";
        });

    const executor = new FlowExecutor();

    const currentChallenge = {
        component: "ak-stage-authenticator-validate",
    } as ChallengeTypes;

    executor.flowSlug = "test-flow";
    executor.challenge = currentChallenge;

    await executor.submit({ component: "ak-stage-authenticator-validate" }, { invisible: true });

    expect(formSubmit).toHaveBeenCalledOnce();
    expect(executor.challenge).toBe(currentChallenge);
    expect(executor.inert).toBe(true);
});
