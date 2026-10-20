import type { Middleware, RequestContext, ResponseContext, ErrorContext } from "@goauthentik/api";

// 加载反馈：仅记录路由准备期启动的生成客户端请求，刷新和轮询不重播页面动画。
const preparing = new Set<PagePreparation>();

export class PagePreparation {
    pending = 0;
    revision = 0;
    controller = new AbortController();

    constructor() {
        preparing.add(this);
    }

    dispose() {
        this.controller.abort();
        preparing.delete(this);
    }
}

export class PagePreparationMiddleware implements Middleware {
    #requests = new WeakMap<RequestInit, () => void>();

    async pre(context: RequestContext) {
        const owners = [...preparing];

        if (!owners.length) return context;

        for (const owner of owners) {
            owner.pending++;

            owner.revision++;
        }

        let finished = false;

        this.#requests.set(context.init, () => {
            if (finished) return;
            finished = true;

            for (const owner of owners) {
                owner.pending--;

                owner.revision++;
            }
        });

        return context;
    }

    async post(context: ResponseContext) {
        if (!this.#requests.has(context.init)) return context.response;

        try {
            // 生成客户端仍读取原响应；clone消耗完成后才算网络与响应体终态。
            await context.response.clone().arrayBuffer();
        } finally {
            this.#requests.get(context.init)?.();
        }

        return context.response;
    }

    async onError(context: ErrorContext) {
        this.#requests.get(context.init)?.();
    }
}

export const nextPaint = () =>
    new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

export function routeElements(root: ParentNode): HTMLElement[] {
    const elements: HTMLElement[] = [];

    for (const element of root.querySelectorAll<HTMLElement>("*")) {
        elements.push(element);

        if (element.shadowRoot) elements.push(...routeElements(element.shadowRoot));
    }

    return elements;
}

export async function waitForPage(root: HTMLElement, preparation: PagePreparation) {
    const signal = preparation.controller.signal;

    // 字体沿既有1800ms边界；业务请求不以固定延时提前放行。
    const media = routeElements(root).filter(
        (element): element is HTMLImageElement =>
            element instanceof HTMLImageElement && !element.complete,
    );

    let mediaTimeout: ReturnType<typeof setTimeout> | undefined;

    try {
        await Promise.race([
            Promise.all([
                document.fonts.ready,
                ...media.slice(0, 8).map((image) => image.decode().catch(() => {})),
            ]),
            new Promise((resolve) => {
                mediaTimeout = setTimeout(resolve, 1800);
            }),
        ]);
    } finally {
        clearTimeout(mediaTimeout);
    }

    let stable = 0;

    while (!signal.aborted) {
        const revision = preparation.revision;
        const elements = routeElements(root);

        await Promise.all(
            elements.map(
                (element) =>
                    (element as HTMLElement & { updateComplete?: Promise<unknown> }).updateComplete,
            ),
        );

        await nextPaint();

        const busy = routeElements(root).some((element) => {
            if (
                !element.matches(
                    'ak-spinner, ak-empty-state[loading], ak-empty-state[default-label], [aria-busy="true"]',
                )
            )
                return false;

            // visibility由准备门控继承；display/实际布局用于排除非活动页签。
            return (
                element.getClientRects().length > 0 && getComputedStyle(element).display !== "none"
            );
        });

        stable =
            !preparation.pending && !busy && revision === preparation.revision ? stable + 1 : 0;

        if (stable >= 2) return;
    }
}
