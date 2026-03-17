# `sections/header.liquid` 顶部菜单渲染逻辑分析

本文只分析当前代码中顶部菜单 section 的主要功能和渲染逻辑，不涉及改造建议。

## 1. 组件职责概览

`sections/header.liquid` 是站点头部 Section，除 Logo、搜索、账户、购物车等区域外，也承担了顶部导航菜单的入口编排职责。

对于“菜单”这部分，它主要负责：

1. 读取后台配置的菜单来源。
2. 识别哪些一级菜单需要特殊样式或特殊下拉行为。
3. 决定桌面端和移动端分别使用哪个菜单。
4. 把菜单数据和控制参数传给 `snippets/main-nav-links.liquid`。
5. 提供移动端抽屉菜单容器。

可以把它理解为“Header 菜单总控层”，而不是完整的菜单细节渲染器。真正的多级菜单 HTML 主体在 `snippets/main-nav-links.liquid` 中。

## 2. 菜单数据来源

### 2.1 桌面主菜单

桌面菜单默认读取：

- `section.settings.menu_linklist`

对应 schema 中的：

- `Menu` (`id: menu_linklist`)

实际取值方式是：

```liquid
linklists[section.settings.menu_linklist]
```

也就是 Shopify 后台导航菜单对象。

### 2.2 移动端菜单

移动端菜单优先读取：

- `section.settings.menu_linklist_mobile`

如果未配置，则回退到桌面菜单：

```liquid
{%- assign mobile_linklist = section.settings.menu_linklist_mobile | default: section.settings.menu_linklist -%}
```

因此移动端支持单独配置菜单，也支持复用桌面菜单。

## 3. 初始化的菜单辅助数据

在 header 主体开始前，代码先做了两类菜单辅助配置：

```liquid
assign featured_links = section.settings.nav_featured_link | split: ', '
assign crown_links = section.settings.nav_crown_link | split: ', '
```

### 3.1 `featured_links`

来自后台文本配置 `nav_featured_link`，按 `, ` 拆分后变成标题数组。

用途：

- 如果某个菜单标题命中该数组，则该链接会被标记为 `featured-link`
- 顶层菜单命中时，不直接显示文字，而是显示 `sale-toggle.gif`

这意味着它的匹配逻辑是“按菜单标题字符串精确匹配”。

### 3.2 `crown_links`

来自后台文本配置 `nav_crown_link`，同样按 `, ` 拆分。

用途：

- 顶层菜单命中时会增加 `crown-link` class
- 桌面端会在链接前插入一个 `crown.png` 图标

同样是基于菜单标题文本匹配。

### 3.3 倒计时资源判断

代码会扫描 section blocks：

- 只要存在 `menu-promotion-large`
- 且 `block.settings.show_countdown == true`

就会提前加载：

```liquid
<script src="{{ 'countdown-timer.js' | asset_url }}" defer></script>
```

这不是菜单树本身的数据来源，但属于菜单下拉促销内容的依赖加载逻辑。

## 4. 桌面菜单渲染逻辑

桌面菜单在当前文件里有两层结构：

1. 顶部左侧的 inline 菜单占位
2. 统一的主导航 `main-navigation`

### 4.1 Inline 模式下的顶部一级菜单预渲染

当：

```liquid
section.settings.menu_layout contains 'inline'
```

header 左侧会渲染一个 `#proxy-nav`：

```liquid
<div id="proxy-nav" class="navigation navigation--left">
```

这里会直接循环：

```liquid
{% for link in linklists[section.settings.menu_linklist].links %}
```

并只输出一级菜单项。

#### 这一层会先判断每个一级菜单是否有下拉

判定规则：

1. `link.links != blank`，则认为有下拉。
2. 如果 `link.levels >= 2`，则认定应使用 column / mega menu。
3. 即使 `link.levels < 2`，只要某个 block 的 `dropdown_link_title` 与当前一级菜单标题匹配，也会强制：
   - `has_dropdown = true`
   - `use_columns = true`

也就是说，一个一级菜单即使后台导航本身没有二级三级层级，只要配置了关联的 promotion block，仍然会被当作“有下拉内容”的菜单。

#### 这一层输出的菜单项特征

每个一级菜单 `<li>` 会按条件附加：

- `navigation__item--with-children`
- `navigation__item--with-mega-menu`
- `navigation__item--with-small-menu`
- `featured-link`
- `navigation__item--active`
- `crown-link`

菜单标题显示规则：

- 命中 `featured_links`：显示 GIF 图片
- 否则：显示 `link.title`

如果命中 `crown_links`，还会在链接前插入皇冠图标。

这一层没有展开完整的二级、三级内容，更像是给 inline header 布局使用的一级菜单骨架。

### 4.2 主桌面导航的完整菜单渲染

在 header 主体后，文件始终会输出：

```liquid
<main-navigation id="main-nav" class="desktop-only" data-proxy-nav="proxy-nav">
```

其中完整桌面导航内容由下面这句负责：

```liquid
{% render 'main-nav-links', link_list: section.settings.menu_linklist, mobile: false, featured_links: featured_links, crown_links: crown_links %}
```

也就是说：

- `header.liquid` 负责把菜单句柄和特殊链接参数传进去
- `main-nav-links.liquid` 负责把完整桌面菜单树渲染出来

## 5. `main-nav-links.liquid` 中的完整菜单展开规则

虽然用户当前要求聚焦 `header.liquid`，但它的菜单实际渲染依赖该 snippet，因此这里记录它与 header 直接相关的主逻辑。

### 5.1 一级菜单处理

snippet 中循环：

```liquid
{% for link in linklists[link_list].links %}
```

它和 `header.liquid` 一样，会先为每个一级菜单计算：

- `has_dropdown`
- `use_columns`
- `small_promo_count`

判断逻辑与 header 中的 inline 版本基本一致，但多了对 small promotion 的统计。

### 5.2 什么时候是普通下拉，什么时候是 mega menu

判定大致如下：

1. `link.links != blank` 时，菜单天然有下拉。
2. `link.levels >= 2` 时，使用 column 布局。
3. 如果某个 promotion block 的 `dropdown_link_title` 命中一级菜单标题，也会强制启用 `use_columns` 和下拉结构。

因此一个一级菜单是否成为 mega menu，不只取决于 Shopify 导航层级，也取决于 section blocks 中是否挂了促销内容。

### 5.3 大促销 block 注入

当 block 类型为 `menu-promotion-large` 且 `dropdown_link_title` 匹配当前一级菜单标题时，会在二级菜单容器顶部插入宽幅促销内容：

- 桌面端优先显示 `desktop_image`
- 移动端优先显示 `mobile_image`
- 可带标题、文案、按钮
- 可带 countdown

所以 large promotion 是“附着在指定一级菜单下拉中的内容块”。

### 5.4 二级与三级菜单

如果该菜单存在子链接或 small promotion，则继续输出二级菜单容器。

有两种主要模式：

#### 模式 A：`use_columns == true` 且 `link.levels == 1`

这时一级菜单只有一层子链接，没有更深层级，但因为 promotion 或布局逻辑被强制按列展示。

行为：

- 所有二级链接直接平铺在单独一列中
- 不再为每个二级项单独展开三级结构

#### 模式 B：其他情况

对每个 `child_link` 输出一个二级项：

- 如果 `child_link.links != blank`，则它本身是一个可展开列标题
- 然后继续输出三级链接 `child_child_link`

三级链接旁还会读取对象 metafield：

- `nitro_lookbook.lookbook_page`
- `nitro_lookbook.lookbook_collection`
- `nitro_lookbook.lookbook_product`

如果有值，会渲染一个 `.menu-tag`。

### 5.5 小促销 block 注入

如果 `menu-promotion-small` 的 `dropdown_link_title` 匹配当前一级菜单：

- 桌面端：每个 small promo 作为单独一列插入 mega menu
- 移动端：small promo 合并到 promotion 区域
- 且移动端在满足条件时可启用 carousel 样式：
  - `section.settings.enable_mobile_promo_carousel == true`
  - 并且当前菜单本身还有普通链接

## 6. 移动端菜单渲染逻辑

移动端菜单模板定义在：

```liquid
<script class="mobile-navigation-drawer-template" type="text/template">
```

这表示移动端菜单不是直接常驻在 DOM 中，而是以内嵌模板形式提供给前端脚本使用。

### 6.1 移动抽屉的菜单来源

使用：

```liquid
mobile_linklist = section.settings.menu_linklist_mobile | default: section.settings.menu_linklist
```

然后传给：

```liquid
{% render 'main-nav-links', link_list: mobile_linklist, mobile: true, featured_links: featured_links %}
```

注意这里没有传 `crown_links`，因此当前移动端渲染不会使用桌面那套皇冠图标逻辑。

### 6.2 移动端展开行为控制

抽屉根节点上带有：

```liquid
data-mobile-expand-with-entire-link="{{ section.settings.mobile_expand_with_entire_link }}"
```

说明前端 JS 会读取这个设置，决定“点击整行父链接是否直接展开子菜单”。

### 6.3 移动端附加商品区

如果开启：

- `section.settings.enable_nav_mob_products`

则会在移动菜单主导航下方追加一个精选商品区：

- 数据源：`section.settings.nav_mob_products_collection`
- 标题：`section.settings.nav_mob_products_title`
- 最多输出 10 个商品

这个区域不属于菜单树本身，但属于移动抽屉导航的一部分。

## 7. 当前顶部菜单的核心控制项

与菜单逻辑直接相关的 schema 配置主要有：

- `menu_linklist`：桌面主菜单
- `menu_layout`：菜单布局方式，影响是否走 inline 预渲染
- `nav_featured_link`：需要高亮/替换为 GIF 的菜单标题
- `nav_crown_link`：需要加皇冠图标的菜单标题
- `menu_linklist_mobile`：移动端独立菜单
- `mobile_expand_with_entire_link`：移动端父项展开行为
- `enable_mobile_promo_carousel`：移动端促销区是否启用轮播样式
- `enable_nav_mob_products`：移动端是否显示精选商品
- `nav_mob_products_title`：移动端精选商品标题
- `nav_mob_products_collection`：移动端精选商品集合

此外，这些 block 也直接参与菜单下拉渲染：

- `menu-promotion-small`
- `menu-promotion-large`

它们通过 `dropdown_link_title` 与某个一级菜单标题建立绑定关系。

## 8. 当前实现的关键结论

1. `header.liquid` 不是只渲染静态头部，它实际承担了菜单配置分发和桌面/移动端入口组织。
2. 顶部菜单的数据核心来自 Shopify 后台 `link_list`，但是否形成 mega menu，还受到 section block 配置影响。
3. 一级菜单的特殊视觉效果不是靠 link handle，而是靠“标题文本匹配”实现的。
4. 桌面端存在一个 inline 一级菜单骨架 `#proxy-nav`，完整菜单则统一交给 `main-nav-links.liquid` 输出。
5. 移动端菜单与桌面端可使用不同菜单源，并通过抽屉模板方式交由前端脚本接管。
6. 大促销、小促销、倒计时、lookbook metafield 标签，都会影响最终下拉菜单内容。

## 9. 相关文件

- `sections/header.liquid`
- `snippets/main-nav-links.liquid`

