# 自托管字体与许可证

字体来自 canonical `kreeper-first-design-system/assets/fonts/`，字体文件字节原样复制，随 authentik 的 CSS 资源打包，不依赖第三方字体 CDN。

| 字族                    | 角色                 | 许可证                                                                                     |
| ----------------------- | -------------------- | ------------------------------------------------------------------------------------------ |
| Fraunces                | 英文标题             | `brand/Fraunces-OFL.txt`                                                                   |
| Source Han Serif SC     | 中文标题             | `source-han/OFL-1.1.txt`                                                                   |
| Inter                   | 英文正文             | `inter/OFL-1.1.txt`                                                                        |
| Resource Han Rounded CN | 中文正文             | `brand/ResourceHanRounded-OFL-License.txt`；来源说明 `brand/ResourceHanRounded-LICENSE.md` |
| Courier Prime           | 数字、日期、ID、代码 | `courier-prime/OFL.txt`                                                                    |

字族和字重声明在 `styles/first/fonts.css`。Courier Prime 的字面与基线校准在 `@font-face` 声明，不修改原字体文件。排版来源与组件接入边界见 `styles/first/README.md`。
