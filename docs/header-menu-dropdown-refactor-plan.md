# Header 菜单下拉渲染层重构执行清单

本文档用于拆分 `Header` 菜单下拉渲染层的重构任务。目标不是一次性写完全部代码，而是先明确改造边界、拆分步骤、建立执行顺序，后续按任务逐步实现。

## 1. 目标与已知条件

### 1.1 目标

在不改变 Shopify 后台菜单数据结构的前提下，对 Header 下拉菜单渲染层进行重构，使：

1. 所有一级菜单继续共用同一套菜单数据来源。
2. 保留当前已有的默认下拉渲染模式。
3. 允许个别一级菜单使用各自独立的下拉 UI 模板。
4. 后续可以逐个菜单单独开发，不需要一次性完成全部特殊菜单 UI。

### 1.2 已知条件

当前一级菜单总数为 9 个。

其中需要特殊重构的一级菜单有 5 个：

- `Drapery`
- `Shades`
- `Hardware`
- `Free Swatches`
- `Sale`

其余一级菜单继续使用当前已存在的默认渲染模式。

本轮重构只考虑桌面端网页下拉菜单。

移动端本轮不纳入重构范围，原因是：

- 当前没有移动端设计图
- 当前任务目标聚焦在桌面端特殊下拉渲染层

因此后续文档中提到的特殊菜单模板，默认都指桌面端 dropdown 模板。

### 1.3 不可改变的约束

菜单数据来源不能改。

也就是说以下数据结构必须保留：

- 一级菜单：来自 Shopify 后台 Header 菜单
- 二级菜单：来自一级菜单的 `link.links`
- 三级菜单：来自二级菜单的 `child_link.links`

不能通过改 Shopify 后台菜单结构来适配 UI，只能在现有数据结构之上改造渲染层。

### 1.4 特殊菜单 UI 输入方式

当开始进入某一个特殊菜单的实际开发时，由用户提供该菜单对应的 UI 输入。

UI 输入方式包括：

- 提供设计图
- 或直接描述需要如何修改

因此本阶段文档只负责拆任务，不预设这 5 个特殊菜单的最终视觉方案。

## 2. 重构方向确认

### 2.1 采用“默认模板 + 特殊模板”的结构

是的，按当前需求，整体应当拆成：

1. 一个默认下拉渲染模板
2. 五个特殊菜单下拉模板

也就是总共六类下拉渲染结果：

- `default`
- `drapery`
- `shades`
- `hardware`
- `free-swatches`
- `sale`

### 2.2 为什么这样拆

原因很明确：

1. 当前所有一级菜单虽然共用一套菜单数据结构，但 UI 已经不再统一。
2. 这 5 个菜单的下拉 UI 彼此不同，不适合继续堆在一个 snippet 里用大量条件分支硬写。
3. 默认菜单仍然存在，说明当前逻辑不能直接废弃，而是要被抽成“默认模板”保留。
4. 后续如果继续新增特殊菜单，也可以在这个结构上扩展。

## 3. 建议的代码结构

本次重构不建议动 `header.liquid` 的菜单数据入口，只建议重构“下拉渲染层”。

### 3.1 保持不动或尽量少动的部分

- `sections/header.liquid`
- Shopify 后台菜单来源
- 当前一级菜单 hover / open 的主交互机制

### 3.2 重点重构的部分

当前的 [snippets/main-nav-links.liquid](/mnt/d/dbc%20projects/cozyology-com-symmetry_7-21_install-gtm-kit/snippets/main-nav-links.liquid) 需要从“大一统渲染文件”改造成：

1. 一级菜单遍历与模板分发层
2. 默认下拉模板
3. 特殊菜单下拉模板
4. 公共辅助逻辑层

### 3.3 建议的 snippet 拆分

建议最终至少拆出这些 snippet：

- `snippets/main-nav-links.liquid`
  作用：保留一级菜单循环，但不再承担全部 dropdown HTML

- `snippets/nav-dropdown-router.liquid`
  作用：根据当前一级菜单标题，决定应该走哪个 dropdown variant

- `snippets/nav-dropdown-default.liquid`
  作用：承接当前现有默认下拉逻辑

- `snippets/nav-dropdown-drapery.liquid`
- `snippets/nav-dropdown-shades.liquid`
- `snippets/nav-dropdown-hardware.liquid`
- `snippets/nav-dropdown-free-swatches.liquid`
- `snippets/nav-dropdown-sale.liquid`

如后续需要，还可以补充公共 snippet：

- `snippets/nav-menu-utils.liquid`
- `snippets/nav-promotion-large.liquid`
- `snippets/nav-promotion-small.liquid`
- `snippets/nav-link-list-column.liquid`

这些公共 snippet 不是第一阶段必须项，但如果默认模板和特殊模板之间会复用相同片段，建议在第二阶段抽离。

## 4. 推荐的重构原则

### 4.1 数据与样式分离

数据来源继续使用 Shopify 菜单对象和 Header section blocks。

渲染样式差异，不再直接写死在一个大模板里，而是通过“菜单标题 -> 变体模板”的映射来控制。

### 4.2 默认逻辑先保留，再逐个替换

不要一开始就推翻 `main-nav-links.liquid` 里的全部实现。

更稳妥的方式是：

1. 先把当前默认逻辑抽到 `nav-dropdown-default.liquid`
2. 确保默认菜单行为不变
3. 再逐个接入 5 个特殊菜单

### 4.3 特殊菜单逐个落地

由于 `Drapery / Shades / Hardware / Free Swatches / Sale` 这五个菜单的 UI 都不同，不建议并行混写。

应当按菜单逐个完成：

1. 先定义该菜单要用到哪些数据
2. 再写该菜单专用 snippet
3. 完成一个再接下一个

### 4.4 不修改后台菜单结构

如果特殊 UI 需要附加图片、文案、按钮、标签等非菜单树数据：

- 继续通过 Header section blocks 提供
- 或在现有 section schema 里扩展配置项

不要依赖改变 Shopify 导航树结构来适配 UI。

## 5. 分阶段执行清单

以下是建议的执行顺序。

### 当前进度

- 阶段 0：已确认
- 阶段 1：已完成
- 阶段 2：代码已实现，待 Shopify 后台验收
- 阶段 3：未开始
- 阶段 4：未开始
- 阶段 5：未开始
- 阶段 6：未开始
- 阶段 7：未开始
- 阶段 8：未开始

### 阶段 0：重构前确认

任务目标：先把基础边界确认清楚，避免后面返工。

当前已确认结论：

- 一级菜单总数确认为 9 个
- 5 个特殊菜单标题已确认：
  - `Drapery`
  - `Shades`
  - `Hardware`
  - `Free Swatches`
  - `Sale`
- 当前可以继续使用“标题字符串匹配”方案
- 当前继续保留 hover 打开下拉的交互方式
- 本次重构只影响下拉层，不影响一级菜单本身的文案、入口和其他表现
- 本轮重构范围仅限桌面端，不处理移动端

备注：

- 即使后续发现标题匹配方案需要微调，也只需要单独调整路由或匹配层，不影响本次整体重构方向

输出物：

- 菜单标题映射表
- 特殊菜单名单冻结版

### 阶段 1：建立渲染路由层

任务目标：先建立“默认模板 + 特殊模板”的代码骨架，不立即实现 5 个特殊 UI。

任务：

- 在 `main-nav-links.liquid` 中保留一级菜单循环
- 抽出当前 dropdown 渲染逻辑到 `nav-dropdown-default.liquid`
- 新增 `nav-dropdown-router.liquid`
- 为每个一级菜单增加 variant 判定逻辑
- 当一级菜单不属于 5 个特殊菜单时，继续走默认模板
- 先为 5 个特殊菜单保留占位模板，但内部先临时复用默认模板

输出物：

- 路由层已建立
- 默认菜单不变
- 五个特殊菜单已有独立 snippet 占位

验收标准：

- 当前站点视觉和交互基本不变
- 所有一级菜单仍可正常展开
- 默认逻辑不回归

当前状态：

- 已完成

完成记录：

- 已从 `main-nav-links.liquid` 中抽出默认 dropdown 渲染逻辑
- 已新增 router snippet
- 已建立 5 个特殊菜单 snippet 占位文件
- 当前 5 个特殊菜单仍临时复用默认逻辑
- 用户已将代码同步到 Shopify 后台并完成视觉验证
- 验证结果：当前菜单视觉和交互基本没有变动

### 阶段 2：`Drapery` 菜单重构

任务目标：完成 `Drapery` 专用桌面端 dropdown 重构。

任务 2.1：需求确认

- 用户提供 `Drapery` 对应设计图或修改说明
- 明确 `Drapery` 的二级/三级展示方式
- 明确 `Drapery` 是否需要图片区、文案区、按钮区
- 明确 `Drapery` 是否沿用现有 promotion block，还是增加新配置
- 明确 `Drapery` 是否需要新的 schema / block 配置

当前状态：

- 已完成

完成记录：

- 用户已提供 `Drapery` 设计截图和说明文档
- 已确认 `Drapery` 采用桌面端左右分栏 dropdown
- 已确认左侧主内容来自现有二级、三级菜单结构
- 已确认右侧图片和链接需要独立配置
- 已确认左侧底部还需要一块附加图文内容
- 已确认当前需求足够进入 2.2 代码编写

任务 2.2：代码编写

- 编写 `nav-dropdown-drapery.liquid`
- 接入 `Drapery` 所需的 block / image / text 数据
- 完成桌面端 dropdown UI
- 校验 hover / open / close 行为
- 校验二级、三级链接输出是否正确
- 完成 Shopify 后台视觉验收

当前状态：

- 代码已实现，待验收

完成记录：

- 已编写 `nav-dropdown-drapery.liquid`
- 已为 `Header` 增加 `Drapery menu promotion` block 配置
- 已接入右侧图片、右侧链接、左侧底部图文的独立配置
- 已增加 `Drapery` 桌面端专用 dropdown 样式
- 当前仍需用户在 Shopify 后台完成视觉与交互验收

输出物：

- `Drapery` 专用 dropdown snippet
- `Drapery` 所需配置项和渲染逻辑

验收标准：

- `Drapery` 下拉单独验收通过
- 不影响其他 8 个一级菜单

### 阶段 3：`Shades` 菜单重构

任务目标：完成 `Shades` 专用桌面端 dropdown 重构。

任务 3.1：需求确认

- 用户提供 `Shades` 对应设计图或修改说明
- 明确 `Shades` 的二级/三级展示方式
- 明确 `Shades` 是否需要图片区、文案区、按钮区
- 明确 `Shades` 是否沿用现有 promotion block，还是增加新配置
- 明确 `Shades` 是否需要新的 schema / block 配置

任务 3.2：代码编写

- 编写 `nav-dropdown-shades.liquid`
- 接入 `Shades` 所需的 block / image / text 数据
- 完成桌面端 dropdown UI
- 校验 hover / open / close 行为
- 校验二级、三级链接输出是否正确
- 完成 Shopify 后台视觉验收

输出物：

- `Shades` 专用 dropdown snippet
- `Shades` 所需配置项和渲染逻辑

验收标准：

- `Shades` 下拉单独验收通过
- 不影响其他 8 个一级菜单

### 阶段 4：`Hardware` 菜单重构

任务目标：完成 `Hardware` 专用桌面端 dropdown 重构。

任务 4.1：需求确认

- 用户提供 `Hardware` 对应设计图或修改说明
- 明确 `Hardware` 的二级/三级展示方式
- 明确 `Hardware` 是否需要图片区、文案区、按钮区
- 明确 `Hardware` 是否沿用现有 promotion block，还是增加新配置
- 明确 `Hardware` 是否需要新的 schema / block 配置

任务 4.2：代码编写

- 编写 `nav-dropdown-hardware.liquid`
- 接入 `Hardware` 所需的 block / image / text 数据
- 完成桌面端 dropdown UI
- 校验 hover / open / close 行为
- 校验二级、三级链接输出是否正确
- 完成 Shopify 后台视觉验收

输出物：

- `Hardware` 专用 dropdown snippet
- `Hardware` 所需配置项和渲染逻辑

验收标准：

- `Hardware` 下拉单独验收通过
- 不影响其他 8 个一级菜单

### 阶段 5：`Free Swatches` 菜单重构

任务目标：完成 `Free Swatches` 专用桌面端 dropdown 重构。

任务 5.1：需求确认

- 用户提供 `Free Swatches` 对应设计图或修改说明
- 明确 `Free Swatches` 的二级/三级展示方式
- 明确 `Free Swatches` 是否需要图片区、文案区、按钮区
- 明确 `Free Swatches` 是否沿用现有 promotion block，还是增加新配置
- 明确 `Free Swatches` 是否需要新的 schema / block 配置

任务 5.2：代码编写

- 编写 `nav-dropdown-free-swatches.liquid`
- 接入 `Free Swatches` 所需的 block / image / text 数据
- 完成桌面端 dropdown UI
- 校验 hover / open / close 行为
- 校验二级、三级链接输出是否正确
- 完成 Shopify 后台视觉验收

输出物：

- `Free Swatches` 专用 dropdown snippet
- `Free Swatches` 所需配置项和渲染逻辑

验收标准：

- `Free Swatches` 下拉单独验收通过
- 不影响其他 8 个一级菜单

### 阶段 6：`Sale` 菜单重构

任务目标：完成 `Sale` 专用桌面端 dropdown 重构。

任务 6.1：需求确认

- 用户提供 `Sale` 对应设计图或修改说明
- 明确 `Sale` 的二级/三级展示方式
- 明确 `Sale` 是否需要图片区、文案区、按钮区
- 明确 `Sale` 是否沿用现有 promotion block，还是增加新配置
- 明确 `Sale` 是否需要新的 schema / block 配置

任务 6.2：代码编写

- 编写 `nav-dropdown-sale.liquid`
- 接入 `Sale` 所需的 block / image / text 数据
- 完成桌面端 dropdown UI
- 校验 hover / open / close 行为
- 校验二级、三级链接输出是否正确
- 完成 Shopify 后台视觉验收

输出物：

- `Sale` 专用 dropdown snippet
- `Sale` 所需配置项和渲染逻辑

验收标准：

- `Sale` 下拉单独验收通过
- 不影响其他 8 个一级菜单

### 阶段 7：按重复度决定是否抽离公共辅助逻辑

任务目标：在完成若干特殊菜单后，再判断是否需要补做公共逻辑抽离。

这一阶段不是强制前置阶段，而是按实际开发重复度决定是否执行。

需要考虑抽离的公共逻辑：

- 一级菜单是否有下拉的判定
- `use_columns` 判定
- `small_promo_count` 统计
- large promotion block 匹配逻辑
- small promotion block 匹配逻辑
- 二级/三级链接循环辅助片段
- 通用图片区或 promotion 区块

任务 7.1：重复度评估

- 盘点当前已完成特殊菜单中的重复结构
- 判断是否已经出现较多重复代码
- 判断是否值得抽离成公共 snippet

任务 7.2：必要时进行抽离

- 抽离重复 block 匹配逻辑
- 抽离重复 link list 渲染片段
- 抽离重复图片区或 promotion 片段
- 收敛公共变量输入约定

输出物：

- 公共逻辑复用方案
- 必要的公共 snippet

验收标准：

- 后续继续扩展特殊菜单时，不需要复制大量重复代码

### 阶段 8：统一样式和交互收尾

任务目标：在 5 个特殊菜单都落地后，再统一收口 CSS 和交互细节。

任务：

- 清理重复 CSS
- 统一 dropdown 容器命名规范
- 统一特殊菜单 modifier class 命名
- 检查 hover 边界、z-index、宽度、高度、滚动行为
- 检查 desktop / no-js 兼容

输出物：

- 收敛后的样式结构
- 清理后的类名规范

## 6. 第一轮不建议做的事

为了保证这次重构可控，第一轮不建议做下面这些事情：

- 不重写 `header.liquid` 的整体结构
- 不改 Shopify 后台菜单数据结构
- 不一次性同时实现 5 个特殊菜单 UI
- 不处理移动端特殊菜单下拉改造
- 不把所有菜单相关 CSS 一口气推翻重写
- 不先优化“好看”，而是先把“可路由、可扩展、可逐步替换”做好

## 7. 推荐的首个执行任务

如果按当前新的阶段顺序推进，建议下一步只做下面这件事：

### 下一步任务

进入“阶段 2：`Drapery` 菜单重构”的任务 2.1 需求确认。

具体来说，只做：

1. 提供 `Drapery` 的设计图或修改说明
2. 明确 `Drapery` 的二级、三级展示结构
3. 明确 `Drapery` 是否需要图片区、文案区、按钮区
4. 明确 `Drapery` 是否需要新增 block / schema 配置

这样做的价值是：

- 只处理一个菜单，范围清晰
- 需求和代码不会混在一起推进
- `Drapery` 确认完后可以直接进入 2.2 编码

## 8. 本文档的用途

后续开发建议严格按本文档推进：

1. 先确认本文档任务拆分是否合理
2. 如有调整，先改文档
3. 文档定稿后，再按阶段逐步实现
4. 每次只处理一个明确任务，不跨阶段混写

## 9. 当前已改动文件清单

本节用于记录截至当前阶段，菜单下拉重构实际改动过的文件，方便后续正式迁移到 Shopify 后台时核对。

### 已更新文件

- [snippets/main-nav-links.liquid](/mnt/d/dbc%20projects/cozyology-com-symmetry_7-21_install-gtm-kit/snippets/main-nav-links.liquid)
  说明：已接入 dropdown router，保留一级菜单循环和默认结构入口。

- [snippets/nav-dropdown-router.liquid](/mnt/d/dbc%20projects/cozyology-com-symmetry_7-21_install-gtm-kit/snippets/nav-dropdown-router.liquid)
  说明：已建立一级菜单到特殊 dropdown 模板的路由分发逻辑。

- [snippets/nav-dropdown-default.liquid](/mnt/d/dbc%20projects/cozyology-com-symmetry_7-21_install-gtm-kit/snippets/nav-dropdown-default.liquid)
  说明：已抽出当前默认下拉渲染逻辑。

- [snippets/nav-dropdown-drapery.liquid](/mnt/d/dbc%20projects/cozyology-com-symmetry_7-21_install-gtm-kit/snippets/nav-dropdown-drapery.liquid)
  说明：已改为 `Drapery` 专用桌面端 dropdown 模板。

- [snippets/nav-dropdown-shades.liquid](/mnt/d/dbc%20projects/cozyology-com-symmetry_7-21_install-gtm-kit/snippets/nav-dropdown-shades.liquid)
  说明：当前为 `Shades` 占位模板，仍临时复用默认模板。

- [snippets/nav-dropdown-hardware.liquid](/mnt/d/dbc%20projects/cozyology-com-symmetry_7-21_install-gtm-kit/snippets/nav-dropdown-hardware.liquid)
  说明：当前为 `Hardware` 占位模板，仍临时复用默认模板。

- [snippets/nav-dropdown-free-swatches.liquid](/mnt/d/dbc%20projects/cozyology-com-symmetry_7-21_install-gtm-kit/snippets/nav-dropdown-free-swatches.liquid)
  说明：当前为 `Free Swatches` 占位模板，仍临时复用默认模板。

- [snippets/nav-dropdown-sale.liquid](/mnt/d/dbc%20projects/cozyology-com-symmetry_7-21_install-gtm-kit/snippets/nav-dropdown-sale.liquid)
  说明：当前为 `Sale` 占位模板，仍临时复用默认模板。

- [sections/header.liquid](/mnt/d/dbc%20projects/cozyology-com-symmetry_7-21_install-gtm-kit/sections/header.liquid)
  说明：已新增 `Drapery menu promotion` block 配置，并去掉其中冗余的 `Link name` 配置项。

- [assets/main.css](/mnt/d/dbc%20projects/cozyology-com-symmetry_7-21_install-gtm-kit/assets/main.css)
  说明：已移除 `Drapery` dropdown 的专用样式，保留主题原有通用导航样式。

- [assets/header-menu-dropdowns.css](/mnt/d/dbc%20projects/cozyology-com-symmetry_7-21_install-gtm-kit/assets/header-menu-dropdowns.css)
  说明：已新增特殊菜单下拉的独立样式文件，当前承载 `Drapery` 的桌面端专用样式。

- [docs/header-menu-rendering-analysis.md](/mnt/d/dbc%20projects/cozyology-com-symmetry_7-21_install-gtm-kit/docs/header-menu-rendering-analysis.md)
  说明：已补充当前 header 菜单、二级三级菜单和菜单图片渲染逻辑分析。

- [docs/header-menu-dropdown-refactor-plan.md](/mnt/d/dbc%20projects/cozyology-com-symmetry_7-21_install-gtm-kit/docs/header-menu-dropdown-refactor-plan.md)
  说明：重构总任务文档，持续维护阶段进度和执行清单。

- [docs/drapery-menu-refactor/drapery-design.md](/mnt/d/dbc%20projects/cozyology-com-symmetry_7-21_install-gtm-kit/docs/drapery-menu-refactor/drapery-design.md)
  说明：`Drapery` 设计说明与需求梳理文档。

### 已新增文件

- [docs/header-menu-dropdown-refactor-notes.md](/mnt/d/dbc%20projects/cozyology-com-symmetry_7-21_install-gtm-kit/docs/header-menu-dropdown-refactor-notes.md)
  说明：记录后续开发其它特殊菜单时可复用的注意事项。

- [docs/drapery-menu-refactor/screenshots/.gitkeep](/mnt/d/dbc%20projects/cozyology-com-symmetry_7-21_install-gtm-kit/docs/drapery-menu-refactor/screenshots/.gitkeep)
  说明：用于保留 `Drapery` 设计截图目录。

### 迁移提示

如果后续要往 Shopify 后台正式迁移，当前至少需要重点核对这些主题文件：

- `snippets/main-nav-links.liquid`
- `snippets/nav-dropdown-router.liquid`
- `snippets/nav-dropdown-default.liquid`
- `snippets/nav-dropdown-drapery.liquid`
- `snippets/nav-dropdown-shades.liquid`
- `snippets/nav-dropdown-hardware.liquid`
- `snippets/nav-dropdown-free-swatches.liquid`
- `snippets/nav-dropdown-sale.liquid`
- `sections/header.liquid`
- `assets/main.css`
- `assets/header-menu-dropdowns.css`
