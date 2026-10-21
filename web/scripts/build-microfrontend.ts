import "@goauthentik/core/environment/load/node";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { localeManifestPlugin } from "#bundler/locale-manifest-plugin/node";
import { mdxPlugin } from "#bundler/mdx-plugin/node";
import { styleLoaderPlugin } from "#bundler/style-loader-plugin/node";
import { createBundleDefinitions } from "#bundler/utils/node";
import { PackageRoot } from "#paths/node";

import { MonoRepoRoot } from "@goauthentik/core/paths/node";

import esbuild from "esbuild";
import postcss from "postcss";

const output = path.resolve(
    process.env.CONSOLE_MFE_OUT_DIR || path.join(PackageRoot, "dist-console"),
);

const base = process.env.CONSOLE_MFE_ASSET_BASE || "/apps/authentik/microfrontend/";
await mkdir(output, { recursive: true });

await esbuild.build({
    entryPoints: {
        "authentik-microfrontend": "src/console/microfrontend.ts",
        "authentik": "src/console/console.global.css",
    },
    absWorkingDir: PackageRoot,
    outdir: output,
    publicPath: base,
    bundle: true,
    splitting: true,
    format: "esm",
    minify: true,
    sourcemap: true,
    chunkNames: "chunks/[name]-[hash]",
    assetNames: "assets/[name]-[hash]",
    tsconfig: path.join(PackageRoot, "tsconfig.build.json"),
    define: { ...createBundleDefinitions(), "process.env.NODE_ENV": '"production"' },
    conditions: ["bundler", "production"],
    loader: {
        ".css": "text",
        ".ttf": "file",
        ".woff": "file",
        ".woff2": "file",
        ".jpg": "file",
        ".png": "file",
        ".svg": "file",
    },
    plugins: [mdxPlugin({ root: MonoRepoRoot }), styleLoaderPlugin(), localeManifestPlugin()],
});

// 微前端样式隔离：Shadow DOM保留原生样式；文档规则只作用于本应用挂载槽与浮层槽。
// Native @scope与根选择器适配沿用Console/marketing接入方式，字体注册保持全局资源语义。
const file = path.join(output, "authentik.css");
const sheet = postcss.parse(await readFile(file, "utf8"));

sheet.walkRules((rule) => {
    if (rule.parent?.type === "atrule" && /keyframes$/i.test(rule.parent.name)) return;

    rule.selectors = rule.selectors.map((selector) =>
        selector
            .replace(/(^|[\s>+~,(])(?::root|html|body)(?=[\s.#:[>+~),]|$)/g, "$1:scope")
            .replace(/:scope\s+:scope/g, ":scope"),
    );

    if (rule.selectors.some((selector) => selector === ":scope")) {
        rule.walkDecls((declaration) => {
            if (
                /^(min-|max-)?(height|width)$|^(padding|margin|overflow|position|display)/.test(
                    declaration.prop,
                )
            )
                declaration.remove();
        });
    }
});

const scoped = postcss.atRule({ name: "scope", params: "(.console-authentik-surface)" });
const result = postcss.root();

for (const node of sheet.nodes.slice()) {
    if (node.type === "atrule" && /^(font-face|charset)$/i.test(node.name)) result.append(node);
    else scoped.append(node);
}

result.append(scoped);
await writeFile(file, result.toString());

console.log(`authentik Console module built at ${output}`);
