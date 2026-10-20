import "#elements/commands/ak-command-palette";
import "#elements/PageScrollbar";
import { globalAK } from "#common/global";
import { applyDocumentTheme, createUIThemeEffect } from "#common/theme";

import { AKElement } from "#elements/Base";
import { AKCommandPalette } from "#elements/commands/ak-command-palette";
import { createCommonCommands, PaletteCommandNamespace } from "#elements/commands/shared";
import { BrandingContextController } from "#elements/controllers/BrandContextController";
import { ConfigContextController } from "#elements/controllers/ConfigContextController";
import { ContextControllerRegistry } from "#elements/controllers/ContextControllerRegistry";
import { LocaleContextController } from "#elements/controllers/LocaleContextController";
import { ModalOrchestrationController } from "#elements/controllers/ModalOrchestrationController";
import { ReactiveContextController } from "#elements/controllers/ReactiveContextController";
import { BrandingContext } from "#elements/mixins/branding";
import { AuthentikConfigContext } from "#elements/mixins/config";
import { applyScrollbarClass } from "#elements/utils/scrollbars";

import { ConsoleLogger, Logger } from "#logger/browser";

import { Context, ContextType } from "@lit/context";
import { ReactiveController } from "lit";

/**
 * The base interface element for the application.
 */
export abstract class Interface extends AKElement {
    protected logger: Logger;

    /**
     * Private map of controllers to their registry keys.
     *
     * This is used to track which controllers have been registered,
     * and to unregister them when removed.
     */
    #registryKeys = new WeakMap<ReactiveController, ContextType<Context<unknown, unknown>>>();

    /**
     * The command palette instance. This must be inserted by the extending class, as the palette
     * may depend on a context that is not available at the time of this class's construction.
     */
    public readonly commandPalette: AKCommandPalette;

    // 页面滚动条：三套应用共用文档原生滚动，控件随 Interface 生命周期清理。
    readonly #pageScrollbar = document.createElement("ak-page-scrollbar");

    constructor() {
        super();

        this.logger = ConsoleLogger.prefix(this.localName);

        const { config, brand, locale } = globalAK();

        createUIThemeEffect(applyDocumentTheme);
        applyScrollbarClass(this.ownerDocument);

        this.addController(new LocaleContextController(this, locale));
        this.addController(new ConfigContextController(this, config), AuthentikConfigContext);
        this.addController(new BrandingContextController(this, brand), BrandingContext);
        this.addController(new ModalOrchestrationController());

        this.id = "interface-root";
        this.commandPalette = this.ownerDocument.createElement("ak-command-palette");
    }

    public override connectedCallback(): void {
        super.connectedCallback();
        this.ownerDocument.body.append(this.#pageScrollbar);

        requestAnimationFrame(() => {
            this.commandPalette.modal.setCommands(
                createCommonCommands().map((command) => ({
                    namespace: PaletteCommandNamespace.Action,
                    ...command,
                })),
            );
        });
    }

    public override disconnectedCallback(): void {
        this.#pageScrollbar.remove();
        super.disconnectedCallback();
    }

    public override addController(
        controller: ReactiveController,
        registryKey?: ContextType<Context<unknown, unknown>>,
    ): void {
        if (controller instanceof ReactiveContextController) {
            if (!registryKey) {
                throw new TypeError(
                    `ReactiveContextController (${controller.constructor.name}) requires a registry key.`,
                );
            }

            if (this.#registryKeys.has(controller)) {
                throw new Error(
                    `Controller (${controller.constructor.name}) is already registered.`,
                );
            }

            this.#registryKeys.set(controller, registryKey);
            ContextControllerRegistry.set(registryKey, controller);
        }

        super.addController(controller);
    }

    public override removeController(controller: ReactiveController): void {
        super.removeController(controller);

        const registryKey = this.#registryKeys.get(controller);

        if (registryKey) {
            ContextControllerRegistry.delete(registryKey);
            this.#registryKeys.delete(controller);
        }
    }
}
