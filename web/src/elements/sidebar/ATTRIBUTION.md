# 代码与字体来源

青舟源码及从中提取/参数化的Vue/CSS/TS代码：萌狼蓝天 / xrilang，原作者历史仓库 [地址](https://github.com/xrilang/qing-zhou)（2026-10-19核验返回HTTP 404），当前fork [来源](https://github.com/hanyunsushi/qing-zhou) 。2026-10-19审查HEAD为304457cd23849368c5334379f22b8f91e6956d7e，快照包含dirty工作区增量，逐文件SHA见[coverage.json](../references/coverage.json)，本轮来源边界见[审查记录](../references/source-review-2026-10-19.md)。KreeperShell、KreeperPublicHeader、BrandMark、DualUsageRings、route-indicator/reveal-ready经过参数化/接入改写；StatusBadge和CategoryTrendChart是按合同生成并经过隔离测试的兼容/通用扩展，不宣称青舟已经使用它们；其他source-reference原样保存。保留随附QINGZHOU-LICENSE.txt。项目明确CC BY-NC-SA4.0；复制青舟派生代码需遵守该许可，商业使用另取得源码授权。规范中的AWS/Apple公开来源和字体许可证不使青舟代码变成MIT。

Console runtime与CSS作用域/产物验证脚本按该fork工作区原样保存，仅供应用接入审查，不宣称独立MIT组件。`source-reference/package.json`新增[PostCSS](https://github.com/postcss/postcss) `^8.5.16`为构建依赖；其自身MIT许可与青舟派生代码许可分开。本包没有复制PostCSS库实现或改变现有字体/React/Motion/图标许可；随附QINGZHOU-LICENSE.txt与审查时原项目LICENSE字节一致。

字体保留各自OFL授权和版权，见fonts/LICENSES.md。Cloudscape官方组件/设计token通过来源链接参考，未把Cloudscape React包或官方商标作为运行资产。provider SVG和品牌图像随项目来源/标识用途，不赋予独立商标授权。

复用CSS明确替换数字font face/token为Courier Prime，但这只是示范实现选择；不声称青舟当前已经采用。Courier Prime由AWS官方等宽列表选定，文件来自固定Google Fonts源，许可OFL；AWS排版与图表规则直接读取官方来源，青舟局部override分开记录。

Fraunces复用字体保持同family但从固定Google Fonts源取得真实变量，避免将原静态500文件的命名/face范围当作原生多字重；原文件移到source-reference字节快照，青舟本身未改。新文件保留独立OFL。

RefreshButton、SkylineHeatmap、AvailabilityHeatmap和ContributionSkyline是本次独立Vue/Canvas实现，参考交互来源与404/未知上游授权边界见references/refresh、skyline、sources；未包含参考React整段源码或声称原组件授权。集成本包青舟派生样式时继续遵守上方CC BY-NC-SA4.0合同。

## Glass Folder Cards

`GlassFolder.vue`、`FolderArtCanvas.vue`与`utils/folder-art.ts`移植用户提供的Glass Folder Cards源码：保留原形状、程序位图、分帧绘制队列、玻璃与主要动效，改为Vue并加入真实商品列表/键盘边界。原附件SHA-256为`e37b014146ccf15cabea59c6d693850a3231f6021c00a2f38829d57589956c92`；附件没有作者URL/许可证，不能以本包其他来源许可替代其授权，也不宣称MIT。用户授权本地集成不代表已取得第三方分发或商业授权，另行复用须核实。完整差异见[专项](../references/glass-folder.md)。

## DotMatrix 参考

用户提供的React Loader文本标注 [beui.dev](https://beui.dev/components/motion/loader)。本包只按用户指定的DotMatrix视觉与时序编写Vue/CSS适配，不打包原React组件、Motion依赖或未提供的EASE_IN_OUT helper；来源与实现差异见 [加载反馈](../references/loading.md)。青舟相关共享样式与页面门控继续遵守上方青舟派生代码许可。

## 刷新 SVG

RefreshButton 的图标使用 [Lucide refresh-cw](https://lucide.dev/icons/refresh-cw)，[原始 SVG](https://github.com/lucide-icons/lucide/blob/main/icons/refresh-cw.svg)；它不是未能访问的21st组件源码。旋转、请求状态与Vue封装仍由本包维护。图标许可如下：

```text
ISC License

Copyright (c) 2026 Lucide Icons and Contributors

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

## AnimatedSidebar 动画参考

侧栏动画参数与shared-layout参考[beui AnimatedSidebar](https://beui.dev/components/motion/animated-sidebar)及其公开ease/shared-layout-bg；包内以Vue数据/事件桥接直接运行来源React动画，保留原SharedLayoutBg与variants，不附带原React业务组件。beui仓库MIT声明如下（保留原文）：

```text
MIT License

Copyright (c) 2026 Saurabh Chauhan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

另一份SessionNavBar附件未提供作者/许可证，不能将上方MIT套用到它；只移植用户指定的宽度/文字动画数值，不附带Next业务实现。用于其他分发/商业场景前核实该来源。当前复用Shell直接运行来源React动画和Vue数据桥接，不复制组织/Next业务；运行库许可见下。

## React与Motion运行依赖

复用Shell使用React/react-dom19.2.0与framer-motion14.3.0执行原投影/variants/presence。以下保留Motion声明，React声明见后。

```text
The MIT License (MIT)

Copyright (c) 2024 [Motion](https://motion.dev) B.V.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

```text
The MIT License (MIT)

Copyright (c) 2018 Framer B.V.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

```text
MIT License

Copyright (c) Meta Platforms, Inc. and affiliates.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

```

## HeroUI ordinary radio styling

The ordinary radio control/indicator CSS is adapted from [HeroUI](https://github.com/heroui-inc/heroui), `@heroui/styles` 3.2.6 (Copyright 2025 NextUI Inc., Apache-2.0). Original component CSS is preserved under `upstream/heroui`; the [Apache license](licenses/HeroUI-Apache-2.0.txt) is included. Slots and states map to Naive native input DOM, colors/fonts map to QingZhou, and host orientation remains intact. Source animations use 200ms indicator scale/background and 100ms pressed control scale; this adds no HeroUI runtime dependency.

## Arc Library DateRangePicker

[Arc Library](https://github.com/kuratlielia/arc-library/tree/b40c8906e8cc55cba920113be856b2e6d964885a)，Copyright (c) 2026 Elia Kuratli，MIT。组件采用用户提供的TSX；样式和motion-tokens取自该固定版本原项目。完整许可保存在[date-range-picker/LICENSE](reference/date-range-picker/LICENSE)，来源与SHA见[provenance.json](reference/date-range-picker/provenance.json)。运行源码仅增加注释/定位，系统token映射在原CSS之后；Vue桥接不替换动画或日期逻辑。Lucide React图标依赖遵守其ISC许可；青舟其他派生代码仍遵守原许可。

## authentik adapter

The sidebar Motion modules retain the upstream animation tree and variants. The Lit adapter replaces Vue leaf renderers with menu data and native links, retaining authentik routing and permission decisions.
