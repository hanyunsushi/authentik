# 第一设计系统适配

本目录将 kreeper第一设计系统适配到 authentik 现有 Lit / PatternFly 结构。设计规范入口为本机 `kreeper-first-design-system/SKILL.md`；Agent 维护规则见根 `AGENTS.md`。不复制青舟业务组件或接入其账号服务。

- `tokens.css`：四种中英字体角色、数字字族、白/浅灰嵌套表面、Apple 语义色、几何与 PF token 桥接；保留现有主题选择。
- `fonts.css`：自托管 Fraunces、Source Han Serif SC、Inter、Resource Han Rounded CN 与 Courier Prime，许可证随 `src/assets/fonts/first/` 提供。
- `components.css`：文档和每个 `AKElement` 的共享视觉规则。Shadow DOM 内置组件 CSS 之后加载，部署方品牌覆盖仍通过原机制应用。
- `document.css`：文档字体、底色、原生纵向滚动及桌面 16px 槽位。
- `flow-host.css`：SSR 保留的 `ak-flow-executor.pf-c-login` 仅作为宿主，内部认证网格负责布局。此小型适配不分层，以兼容独立预览中未分层的 PF Login CSS。

文档层顺序为 `reset, vendor, components, theme, mode, design, brand`。全局字体与 token 分别进入 Interface、Flow、Static bundle；共享控件规则另外从 `shadow/authentik-base.css` 进入组件。普通全局选择器不能穿透 Shadow DOM。

顶栏/侧栏、门户及认证分栏的专项布局保留在各自组件 CSS。`ak-tooltip` 继承 PatternFly 的触发/定位逻辑，适配 18px 表面并避免关闭内容撑宽页面。`ak-page-scrollbar` 只负责文档轨道，生命周期内管理槽位，页面仍由浏览器原生滚动。现有控件保持请求、权限、路由和生成 API 客户端契约。

本次读取的 AWS 官方来源（2026-10-19）：

- [Typography](https://cloudscape.design/foundation/visual-foundation/typography/)：正文 14/20、辅助与代码 12/16、标题层级；中英字族为本设计系统的适配。
- [Data visualization colors](https://cloudscape.design/foundation/visual-foundation/data-vis-colors/)：分类序列、固定系列颜色、可访问区分；`common/first-design.ts` 使用官方 design-tokens 包核对的 50 色，不循环复用。

Storybook 的 `Design system / First` 使用实际共享组件和应用壳 CSS，业务数据为明确的本地样本。它不替代连接 backend 后的全部路由、登录或 SSO 验收。运行证据和限制由项目 `agent.md` 维护。

## 真实控件接入

`elements/sidebar/Sidebar.ts` 以 Lit 模型节点提供原权限、路径、当前项、品牌及披露状态；`sidebar-motion-react.tsx` 在独占 DOM 执行 canonical Motion 树。React/react-dom 19.2.0、framer-motion 14.3.0 是运行依赖，其余应用保持 Lit。静态根分组、筛选、72px轨道、全宽收起按钮由 `Sidebar.css` 提供，复制来源和 CC BY-NC-SA 4.0 许可见 `elements/sidebar/ATTRIBUTION.md`。版本/About入口位于品牌区右下独立位置。

普通/默认弧边/强调/高亮弧边/删除由真实控件语义接入：表单主动作与取消、Modal、应用创建拆分菜单、行内编辑、任务按钮均有独立责任边界。`ak-refresh-button` 继承原任务生命周期，仅将表格刷新呈现为标准 SVG；SVG 许可同上。Flow 通过继承自定义属性让所有 stage 的动作维持18px，不靠穿透 Shadow DOM。表格页面宽度收敛到容器，手机搜索独占一行，按钮换行，数据表独立横向滚动。

`Application Controls` story 继承真正的 `ApplicationListPage`，只替换列表数据源和文档旁栏；其创建菜单、选择、工具栏、行内编辑与刷新使用实际组件。Storybook 配置复用仓库 Markdown 编译器解析 `~docs/`，用于加载真实页面依赖。预览不提供认证 backend，不在其中提交生产修改。Wireit 已将 TSX 与 TTF 纳入构建输入。

## 路由准备与入场

`common/page-preparation.ts` 与 `RouterView` 门控初始内容：懒加载、生成客户端请求及响应体、Lit 更新和可见加载状态稳定后，先移除内容区中央的点阵，跨过一次绘制再执行裁切入场。准备期页面隐藏并 inert；过期路由取消，搜索参数更新和后续刷新不重播整页动画。减少动态效果时跳过入场。Middleware 仅在准备期等待响应副本，原生成客户端继续处理原始响应。

SSR placeholder、独立启动页、空状态等待、表格刷新、消息和局部面板均使用 DotMatrix；可访问名称保留，视觉不显示 Loading 文字。桌面侧栏原生滚动条按用户本项目明确要求隐藏，滚动能力保留；这是 authentik 的局部例外，不改 canonical 规范。桌面顶栏使用侧栏底部收起动作，手机保留导航开关。选择器去掉 PF 装饰下划线；创建拆分按钮使用双线 chevron，顶栏头像与圆形触发区重合且无悬浮光效。

菜单使用原生Popover top layer，保留同一Shadow DOM作用域和原业务回调；按触发器/视口定位，随滚动与缩放更新，不受空状态表格的overflow裁切。路由揭示穿过inline/contents自定义宿主和透明布局，选取真实块盒错峰裁切；不对没有可绘制块盒的inline宿主播放无效clip。品牌区右下独立显示服务端真实版本（10/12辅助字、右10/下3），折叠隐藏，点击仍打开About。品牌底部使用1px中性分隔线，与64px正文顶栏底线对齐。

Flow 在请求和阶段模块准备期间隐藏整个认证内容区并设置 inert，保留表单节点、输入与几何，仅呈现独立点阵；内容就绪后才揭示。状态卡保留 tone 语义，表面不绘制彩色顶边。普通/默认弧边按钮固定1px外ring与text-2文字，400ms灰色内阴影；强调/高亮弧边固定Apple蓝并使用400ms白色内光，鼠标移出收回，键盘焦点独立保留；填写框覆盖旧 PF 底线变量，聚焦时四边均为 1px 边框加 1px 蓝色内线，内距不跳动。

切换开关保留原生checkbox及表单命名：40×23px轨道、17px白色滑块和3px内距，开启位移17px；500ms回弹，按下轻缩放，禁用阻止切换，键盘可见焦点及触摸44px命中保留，减少动态取消动画。

## 空态、弹窗与门户卡片

非加载空态/错误由 `EmptyIllustration` 使用设计系统提供的原 SVG，160×100 contain；文案、重试和权限语义保留。`EmptyState` 连接后设置默认status，避免原生createElement构造期间写属性失败。Dialog延续浏览器焦点、Escape、遮罩及表单逻辑，桌面18px浅灰表面，窄屏保留原全屏行为；长标题换行。确认主动作显式接入高亮弧边，风险由既有标题/正文和业务回调表达。门户网格卡的整卡链接不使用正文链接下划线，文字不描边，标题区保留两行完整高度；独立正文链接维持原反馈。

空态SVG的生产资源地址必须由`new URL(asset, import.meta.url)`解析；原生bundle中的相对asset路径不能直接绑定到页面img src。MFE绝对发布base继续有效。2026-10-23重新读取[AWS Typography](https://cloudscape.design/foundation/visual-foundation/typography/)的14/20正文与12/16说明，项目字体按既有角色保留。
