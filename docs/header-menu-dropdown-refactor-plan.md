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

### 阶段 2：抽离公共辅助逻辑

任务目标：避免后续 5 个特殊模板复制大量相同代码。

需要考虑抽离的公共逻辑：

- 一级菜单是否有下拉的判定
- `use_columns` 判定
- `small_promo_count` 统计
- large promotion block 匹配逻辑
- small promotion block 匹配逻辑
- 二级/三级链接的循环辅助片段

任务：

- 盘点哪些逻辑必须复用
- 盘点哪些逻辑应保留在默认模板内部
- 将重复的 block 匹配逻辑抽成辅助 snippet 或统一约定的变量输入

输出物：

- 公共变量约定
- 公共逻辑复用方案

验收标准：

- 特殊模板开发时不需要反复复制默认模板整段代码

### 阶段 3：定义 5 个特殊菜单的 UI 需求清单

任务目标：在写代码前，把 5 个特殊菜单各自的结构需求单独列清。

需要分别产出这 5 个菜单的 UI 说明：

- `Drapery`
- `Shades`
- `Hardware`
- `Free Swatches`
- `Sale`

每个菜单都需要明确：

- 是否显示二级菜单
- 是否显示三级菜单
- 二级和三级是平铺、分栏还是卡片化
- 是否有主视觉图片
- 图片来自哪里
- 是否有额外文案、按钮、标签
- 移动端是否复用桌面结构
- 是否需要保留当前 promotion block 机制

输出物：

- 5 份菜单 UI 需求说明

输入来源：

- 用户提供对应设计图
- 或用户直接描述需要如何改

验收标准：

- 每个特殊菜单的结构边界清晰
- 开发时不需要再边写边猜

### 阶段 4：逐个实现 5 个特殊模板

任务目标：一个菜单一个菜单地落地。

建议顺序：

1. `Drapery`
2. `Shades`
3. `Hardware`
4. `Free Swatches`
5. `Sale`

每个菜单都按同样的步骤执行：

1. 创建对应 snippet
2. 接入 router
3. 实现该菜单桌面端 dropdown UI
4. 接入所需的 block / image / text 数据
5. 校验二级、三级链接输出是否正确
6. 校验 hover / open / close 行为
7. 本轮不处理移动端

输出物：

- 对应菜单专用 snippet
- 对应菜单所需的 schema / block 扩展

验收标准：

- 该菜单单独验收通过
- 不影响其他 8 个一级菜单

### 阶段 5：统一样式和交互收尾

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

## 6. 五个特殊菜单的开发任务拆分

这里先不写具体 UI 代码，只拆任务。

### 任务 A：`Drapery` 专用 dropdown snippet

任务内容：

- 创建 `nav-dropdown-drapery.liquid`
- 明确 `Drapery` 的二级/三级排版结构
- 明确是否需要独立图片区
- 明确所需 block 配置
- 由用户提供 `Drapery` 对应设计图或修改说明
- 完成后单独联调

### 任务 B：`Shades` 专用 dropdown snippet

任务内容：

- 创建 `nav-dropdown-shades.liquid`
- 明确 `Shades` 的二级/三级排版结构
- 明确是否需要独立图片区
- 明确所需 block 配置
- 由用户提供 `Shades` 对应设计图或修改说明
- 完成后单独联调

### 任务 C：`Hardware` 专用 dropdown snippet

任务内容：

- 创建 `nav-dropdown-hardware.liquid`
- 明确 `Hardware` 的二级/三级排版结构
- 明确是否需要独立图片区
- 明确所需 block 配置
- 由用户提供 `Hardware` 对应设计图或修改说明
- 完成后单独联调

### 任务 D：`Free Swatches` 专用 dropdown snippet

任务内容：

- 创建 `nav-dropdown-free-swatches.liquid`
- 明确 `Free Swatches` 的二级/三级排版结构
- 明确是否需要独立图片区
- 明确所需 block 配置
- 由用户提供 `Free Swatches` 对应设计图或修改说明
- 完成后单独联调

### 任务 E：`Sale` 专用 dropdown snippet

任务内容：

- 创建 `nav-dropdown-sale.liquid`
- 明确 `Sale` 的二级/三级排版结构
- 明确是否需要独立图片区
- 明确所需 block 配置
- 由用户提供 `Sale` 对应设计图或修改说明
- 完成后单独联调

## 7. 第一轮不建议做的事

为了保证这次重构可控，第一轮不建议做下面这些事情：

- 不重写 `header.liquid` 的整体结构
- 不改 Shopify 后台菜单数据结构
- 不一次性同时实现 5 个特殊菜单 UI
- 不处理移动端特殊菜单下拉改造
- 不把所有菜单相关 CSS 一口气推翻重写
- 不先优化“好看”，而是先把“可路由、可扩展、可逐步替换”做好

## 8. 推荐的首个执行任务

如果按最稳妥的节奏推进，建议下一步只做下面这件事：

### 下一步任务

先完成“阶段 1：建立渲染路由层”。

具体来说，只做：

1. 从 `main-nav-links.liquid` 中抽出默认 dropdown 渲染逻辑
2. 新增 router snippet
3. 建立 5 个特殊菜单 snippet 占位文件
4. 先让 5 个特殊菜单继续临时复用默认逻辑

这样做的价值是：

- 代码结构先站稳
- 站点 UI 基本不变
- 后续可以一项一项替换 5 个特殊菜单

## 9. 本文档的用途

后续开发建议严格按本文档推进：

1. 先确认本文档任务拆分是否合理
2. 如有调整，先改文档
3. 文档定稿后，再按阶段逐步实现
4. 每次只处理一个明确任务，不跨阶段混写
