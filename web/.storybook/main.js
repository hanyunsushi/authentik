/**
 * @import { StorybookConfig } from "@storybook/web-components-vite";
 * @file Storybook configuration.
 */

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { compileMarkdown } from "../bundler/mdx-plugin/compile.ts";
import { copyAssets } from "../scripts/build-assets.ts";

/**
 * @param {TemplateStringsArray} strings
 * @param {...any} values
 *
 * @returns {string}
 */
const html = (strings, ...values) => String.raw({ raw: strings }, ...values);

await copyAssets();

const __dirname = fileURLToPath(new URL(".", import.meta.url));

/**
 * @satisfies {StorybookConfig}
 */
const config = {
    stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
    staticDirs: [{ from: "../dist/assets", to: "/static/dist/assets" }],
    addons: [
        // ---
        "@storybook/addon-links",
        "@storybook/addon-docs",
    ],
    framework: "@storybook/web-components-vite",
    viteFinal: async (config) => {
        const newConfig = {
            ...config,
            plugins: [
                ...(config.plugins ?? []),
                {
                    name: "authentik-storybook-docs",
                    enforce: "pre",
                    resolveId(source) {
                        if (source.startsWith("~docs/")) return `\0ak-docs:${source.slice(6)}`;
                    },
                    async load(id) {
                        if (!id.startsWith("\0ak-docs:")) return;
                        const publicPath = `/${id.slice(9)}`;
                        const publicDirectory = dirname(publicPath);

                        const source = await readFile(
                            join(__dirname, "../../website/docs", publicPath),
                            "utf8",
                        );

                        const { html: content, frontmatter } = await compileMarkdown(
                            source,
                            publicDirectory,
                        );

                        const data = Buffer.from(
                            JSON.stringify({ content, frontmatter, publicPath, publicDirectory }),
                        ).toString("base64");

                        return `export default ${JSON.stringify(`data:application/json;base64,${data}`)}`;
                    },
                },
            ],
            define: {
                ...config.define,
                "import.meta.env.AK_BUNDLER": JSON.stringify("storybook"),
            },
            resolve: {
                ...config.resolve,
                // Avoid multiple instances of web components packages.
                conditions: [],
            },
        };

        newConfig.server = config.server || {};
        newConfig.server.fs = newConfig.server.fs || {};
        newConfig.server.fs.allow = newConfig.server.fs.allow || [];
        newConfig.server.fs.allow.push(join(__dirname, "../../packages/fonts"));
        newConfig.server.fs.allow.push(join(__dirname, ".."));

        return newConfig;
    },

    previewBody: (body) => html`
        <ak-skip-to-content></ak-skip-to-content>
        <ak-message-container></ak-message-container>

        ${body}
    `,
};

export default config;
