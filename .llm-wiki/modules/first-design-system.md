---
title: 第一设计系统适配
updated: 2026-10-20
sources:
  - web/src/styles/first/tokens.css
  - web/src/styles/first/components.css
  - web/src/elements/Base.ts
  - web/src/elements/router/core/RouterView.ts
  - web/src/common/page-preparation.ts
  - web/src/elements/PageScrollbar.ts
  - web/src/elements/Tooltip.ts
  - web/src/admin/ak-interface-admin.ts
  - web/src/user/ak-interface-user.ts
  - web/src/user/LibraryApplication/CardMenu.ts
  - web/src/user/LibraryPage/ApplicationList.css
  - web/src/user/LibraryPage/ak-library-impl.ts
  - web/src/flow/FlowExecutor.ts
  - web/src/stories/FirstDesignSystem.stories.ts
---

# 样式接入

共享 token 从三份 `*.global.css` 进入文档，设计层位于 `mode` 之后、`brand` 之前。`AKElement#finalizeStyles` 仍在组件自己的样式之后采用 `shadow/authentik-base.css`；该文件最后引入 `first/components.css`。普通 CSS 选择器没有穿透 Shadow DOM，使用实际共享根加载规则并继承 CSS custom properties。

| 所有者 | 职责 |
| --- | --- |
| `styles/first/tokens.css`、`fonts.css` | 中英标题/正文、Courier Prime 数字角色、Apple 语义色与 PF 映射，保留明暗主题 |
| `styles/first/components.css` | 按钮、输入、选择器、卡片、表格、状态标签、浮层、键盘焦点和响应规则 |
| `styles/first/document.css`、`elements/PageScrollbar.ts` | 原生文档滚动、桌面 16px 槽与 8px 滑块、移动隐藏轨道、卸载清理 |
| `elements/Tooltip.ts#AKTooltip` | 继承 PfTooltip 的原事件/定位；18px 表面、去装饰箭头，关闭内容不扩展页面 |
| `admin/ak-interface-admin.css`、`components/ak-page-navbar.css`、`elements/sidebar/` | 64px 玻璃顶栏、264/72px 桌面导航、300px 手机抽屉及品牌区 |
| `user/ak-interface-user.css`、`user/LibraryPage/` | 门户外壳、应用卡片/行、搜索与窄屏布局 |
| `flow/FlowExecutor.css`、`styles/first/flow-host.css` | Stacked 认证分栏与 860px 单列切换；避免宿主登录网格和 header 隐式轨道 |
| `elements/Spinner.ts` | 20px 内容/16px 行内 DotMatrix，继承实际请求的等待时机 |
| `common/first-design.ts`、`elements/charts/` | AWS 分类颜色、事件类型稳定映射、正文图例和等宽数字刻度 |

品牌图与已有 brand 配置仍由现有上下文提供；只在展示边界将默认标题`authentik`格式化为`Authentik`，自定义品牌标题与内部标识不改。Sidebar 在上下文尚未提供时显示默认品牌，不阻断导航。品牌区和底部收起区各64px；根分组静态呈现，路由图标按功能职责区分。筛选处于原生滚动区，斜杠聚焦、Escape清空、无结果在原轨道反馈。整栏收起清空筛选和深层子菜单；从折叠轨道展开嵌套组会通知应用壳展开。桌面路由切换保留用户折叠状态。真实server版本与About入口位于品牌区右下，独立于首页链接；10/12辅助正文、右10/下3，折叠隐藏。品牌区恢复1px中性底部分隔线，与64px正文顶栏底线对齐。移动管理导航提供关闭背景按钮、Escape 恢复焦点、正文 inert 与页面滚动锁。

# 组件与依赖

- `elements/sidebar/sidebar-motion-react.tsx`、`sidebar-motion.ts`、`sidebar-motion.css` 从 canonical 资产适配；原共享悬浮/选中、子树退出与整栏错峰由 React 19.2.0 / react-dom 19.2.0 / framer-motion 14.3.0 运行，来源许可见该目录 `ATTRIBUTION.md`。
- `SidebarItem#toMenuOption` 保留许可证/能力判断、绝对链接和当前项，桥接模型变化事件；原生链接沿用应用点击拦截。
- `elements/buttons/RefreshButton.ts` 继承 SpinnerButton 请求状态，只将真实表格刷新替换为标准 SVG 入口；BaseTaskButton 等待时保留标签占位、中心点阵和原几何，实际禁用防止重复提交。
- `Form`、`ModalForm`、`ak-modal` 的动作显式接入弧边；应用列表创建拆分按钮、行内编辑及删除各保留类别。下拉面按内容宽度和视口约束展开，Escape关闭并归还触发器焦点。菜单保留在原DOM作用域，使用原生Popover top layer避开空状态表格的overflow裁切；按真实触发器与可见视口定位，滚动/resize持续更新。不可逆会话撤销使用删除外观；警告/启停仍用高亮弧边。
- `TablePage.css` 限制真实页面宽度，`Table.css` 将窄屏搜索独立成行、操作组换行、表格独立滚动，不用页面裁切隐藏控件。
- Storybook使用仓库原Markdown编译器加载真实页面的文档依赖；Wireit监控TSX和TTF，修改动画和字体会参与重新构建。

# 路由加载与顶栏

`RouterView` 与 `common/page-preparation.ts` 管理准备、入场、就绪三个阶段。准备期懒加载实际页面并将完整内容根隐藏/inert，等待生成客户端首批请求及响应体终态、Lit更新、字体/首屏媒体就绪和多次绘制安静检查。点阵以可见内容区居中，保留侧栏/顶栏；准备完成后先撤下点阵、跨过绘制帧，再将单一完整路由内容层作为一次动画目标揭示，避免点阵与内容重叠或子模块先行露出。取消过期路由；低动态跳过揭示动画但保留准备顺序，后续刷新保留局部16px点阵。SSR placeholder和独立启动页亦使用九点阵，不显示Loading文字。Flow在请求及阶段模块准备期间，以单个独立点阵替换整个认证内容区的可见呈现；品牌、标题与表单一并visibility隐藏并inert，节点、输入值及布局保留。阶段准备完成且请求终止才恢复内容，自动提交协议与错误处理仍由原Flow engine负责；其他调用方遮罩保持各自语义。

桌面侧栏按用户在本项目的要求隐藏原生轨道但保留滚动能力；canonical 规范不变。顶栏桌面收起控件由侧栏底部承担，手机保留导航开关。说明文字单行省略且不撑宽动作区；动作间距8px；头像与触发圆重合、无hover光效。“用户界面”为普通强调按钮；共享普通/强调按钮固定1px外ring与400ms内阴影反馈，普通/默认弧边固定text-2文字与12%灰色内阴影；强调/高亮弧边保持蓝底白字与32%白色内光，鼠标focus不锁住内光；普通PF变体显式保持中性颜色，去掉旧伪元素边线与链接下划线，键盘焦点单独保留。填写框覆盖PF状态底线和底内距，焦点四边1px加1px蓝色内线且尺寸稳定；状态卡保留tone但不绘制彩色边条。创建拆分下拉使用双线chevron，选择器去PF下划线，统计卡不建立内部横向滚动，块级按钮文案居中。

# 行为边界

填写框的共享白面只设置`background-color`，不使用会重置`background-repeat/size/position`的`background`简写；PF校验图标继续单次绘制，错误/成功/警告态额外保留36px文字内距。不能只验证健康输入框，必须覆盖`aria-invalid`与PF状态变体。

门户`CardMenu`的入口复用普通plain图标按钮：32px方形、8px角，触摸跟随44px变量，SVG三点居中并可Tab访问。原生Popover和CSS anchor保持同一DOM作用域；菜单按内容收缩，显式取消PF的100%最小宽度，最大320px且限制视口两侧8px，距入口8px并支持方向翻转；无旧drop-shadow滤镜。桌面卡片和手机列表共享入口，编辑URL及业务逻辑不变。自动回归使用真实CardMenu模板与PF样式检查尺寸和键盘可达性。

门户的全局Enter快捷处理对原生button和a直接放行，不再手动click后又触发浏览器默认click；自定义可交互元素仍保留原处理。回归在实际LibraryPage内验证原生Popover入口只触发一次、入口处Escape关闭后保留焦点，搜索单结果自动打开保持不变。实际IAB从编辑项按Escape可关闭菜单，但未恢复入口焦点；此分支仍为已知限制，不能用入口处的自动测试宣称完整焦点恢复。

保留 Lit 应用、生成客户端、权限树、路由、身份认证、Flow stage 提交和应用数据逻辑。可见主导航由原 Motion 树独占 DOM；Lit SidebarItem 继续作为数据与上下文模型。没有引入 Vue/Naive UI。`AKTooltip` 消费者改用 `ak-tooltip`；其 props、slots、show/hide 和触发模型沿用父类。Flow 的 iframe/sidebar 布局保留原模式；认证说明只加入 Stacked 模式。

设计分类以中文注释记录在共享样式、壳、导航、加载和预览模板责任边界。既有类别即可表达本次改动；没有注册新的全局设计类型，也没有修改 canonical 设计系统。

# 开发与验证入口

`stories/FirstDesignSystem.stories.ts` 提供 Admin、User、Authentication、Authentication Error、Application Controls、Feedback。Application Controls继承实际ApplicationListPage，仅将列表数据源和文档旁栏隔离成本地fixture；可操作实际拆分菜单、行选择与刷新，不能在此验证真实增删改API。Admin 使用壳 CSS 和实际导航/表格/标签控件；User 使用实际 `ak-library-impl`；认证使用实际 `FlowExecutor` 与本地 challenge。数据都是 Storybook 样本，不代表真实账号或生产统计。

`elements/FirstDesign.browser.test.ts` 覆盖PF变体真实层叠下的输入焦点/内距稳定、普通按钮颜色与外ring、强调过渡、各状态卡中性边界、滚动条多实例清理、关闭 Tooltip 不撑宽文档、静态导航分组、可见Motion轨道上的嵌套组展开、筛选/无结果/收起清空、当前项，以及任务加载期间尺寸稳定与防重复提交。`flow/FlowExecutor.browser.test.ts`另外覆盖请求期间内容完全隐藏、单点阵、节点和值保留及完成恢复，并保留自动提交协议回归。浏览器尺寸、构建、检查、测试结果和未验证项归[项目权威文档](../../agent.md)维护；源码与官方来源说明见 `web/src/styles/first/README.md`。

## See Also

- [前端模块](frontend.md)
- [开发入口](../guides/development.md)
- [API 边界](../apis/frontend-api.md)

## 布尔开关

共享`.pf-c-switch`显式覆盖PF几何变量，而非仅设置轨道尺寸：40×23px轨道、17px白色滑块、3px内距，开启位移17px；500ms回弹，按下缩放0.96。原生input及HorizontalFormElement继续提供name/checked、标签和表单读写；禁用阻止切换，键盘focus-visible有清晰outline，轨道无额外shadow。触摸命中44px，减少动态取消过渡与缩放；中文分类注释与`switch-input` locator落在共享组件。自动回归覆盖尺寸、端点、布尔值、命名和禁用，运行证据由[项目权威](../../agent.md)维护。

## 统一空态与弹窗

`EmptyIllustration`逐字节引用设计系统提供的SVG，160×100px contain；`EmptyState`及门户无应用状态共用，loading分支仍只显示DotMatrix，业务说明/重试/权限入口不变。默认status在连接后设置，满足原生自定义元素构造约束。`dialog.css`负责原生Dialog浅灰18px表面、边框、阴影及低动态，窄屏沿原全屏布局；`ak-modal.css`让长标题换行。确认主动作通过显式`ak-first-highlight`跨SpinnerButton Shadow DOM使用蓝色内光，取消保持中性弧边，业务回调和禁用保留。

门户`ApplicationList.css`将整卡链接与正文超链接分开：卡片悬浮仅中性阴影，标题无下划线和文字描边，底部40px保留两行20px文字。可访问链接、键盘焦点、操作菜单和目标URL保留。
