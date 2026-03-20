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

## 5. 一级菜单、下拉展开、二级菜单和图片渲染逻辑

虽然菜单入口在 `header.liquid`，但完整的下拉内容是由 `main-nav-links.liquid` 负责输出的。因此要看清一级菜单、二级菜单和右侧图片的关系，必须把这两个文件连起来看。

### 5.1 一级菜单是如何渲染的

`main-nav-links.liquid` 中的一级菜单循环如下：

```liquid
{% for link in linklists[link_list].links %}
```

也就是说，一级菜单直接来自 Shopify 后台导航菜单：

```liquid
linklists[link_list].links
```

在桌面端调用时，`link_list` 实际就是：

```liquid
section.settings.menu_linklist
```

所以一级菜单的数据来源就是 Shopify 后台选中的 Header 菜单。

每个一级菜单在渲染前，代码会先计算：

- `has_dropdown`：是否需要下拉
- `use_columns`：是否按 mega menu / columns 布局
- `small_promo_count`：是否存在与该一级菜单绑定的 small promotion

### 5.2 一级菜单何时会被判定为“有下拉”

一级菜单出现下拉，不只有一种来源。

判定规则如下：

1. 如果 `link.links != blank`，说明后台菜单本身就有子菜单，此时 `has_dropdown = true`。
2. 如果 `link.levels >= 2`，说明菜单存在更深层级，`use_columns = true`。
3. 如果某个 block 的 `dropdown_link_title` 与当前一级菜单标题一致，即使这个一级菜单本身没有二级菜单，也会被强制设为：
   - `has_dropdown = true`
   - `use_columns = true`

因此，一个一级菜单的下拉内容可能来自两类数据：

- Shopify 后台导航树本身的子菜单
- Header section 中绑定到该一级菜单的 promotion blocks

### 5.3 一级菜单鼠标悬浮后为何会展开下拉

Liquid 模板本身只输出结构和状态属性，例如：

- 一级菜单 link 上的 `aria-haspopup="true"`
- 一级菜单 link 上的 `aria-expanded="false"`
- 下拉容器 `navigation__tier-2-container`

真正的“鼠标悬浮展开”由主题 JS 和 CSS 共同完成。

#### JS 逻辑

`assets/main.js` 中的 `MainNavigation` 组件会给所有一级可下拉菜单绑定：

- `mouseenter`
- `mouseleave`

鼠标移入时：

- 给当前一级菜单 `<li>` 添加 `navigation__item--show-children`
- 给 header 添加 `section-header--nav-open`
- 同时把一级 link 的 `aria-expanded` 改成 `true`

鼠标移出时：

- 移除 `navigation__item--show-children`
- 把 `aria-expanded` 改回 `false`

#### CSS 逻辑

CSS 默认把：

```css
.navigation__tier-2-container
```

设为隐藏状态：

- `visibility: hidden`
- `opacity: 0`
- `pointer-events: none`

当一级菜单带有：

```css
.navigation__item--show-children
```

时，才把对应二级下拉容器显示出来。

因此“一级菜单悬浮展开二级菜单”的主链路是：

1. 一级菜单被识别为 `navigation__item--with-children`
2. 鼠标移入触发 JS
3. JS 给一级菜单加 `navigation__item--show-children`
4. CSS 根据这个 class 显示对应的 `navigation__tier-2-container`

### 5.4 二级菜单的数据来源和渲染方式

二级菜单的数据主来源是当前一级菜单的子链接：

```liquid
link.links
```

如果当前一级菜单存在子菜单，代码会在下拉容器中输出：

```liquid
<ul class="navigation__tier-2 ...">
```

然后分两种模式渲染。

#### 模式 A：强制列布局，但菜单只有一层

当：

```liquid
use_columns == true and link.levels == 1
```

说明这个一级菜单虽然只有一层子链接，但由于 promotion block 或布局判定，被按 mega menu 方式渲染。

此时行为是：

- 把所有 `link.links` 直接输出为一列链接
- 不继续渲染三级结构

这种情况常见于：

- 一级菜单绑定了 promotion 图片区
- 一级菜单需要做成带图片的 mega menu，但子菜单本身并不深

#### 模式 B：标准的二级列 + 三级菜单

如果不满足上面的条件，则会逐个循环：

```liquid
{% for child_link in link.links %}
```

每个 `child_link` 就是一个二级菜单项。

渲染规则：

- `child_link.title` 作为二级标题或二级链接文字
- `child_link.url` 作为二级链接地址
- 如果 `child_link.links != blank`，则它下面还会渲染三级菜单 `child_child_link`

因此：

- 一级菜单来源：`linklists[link_list].links`
- 二级菜单来源：`link.links`
- 三级菜单来源：`child_link.links`

### 5.5 下拉框右边大图片是如何出现的

你提到的“下拉框中右边有图片”，当前代码里主要对应的是：

- `menu-promotion-large`

这不是 Shopify 导航菜单对象自带的图片，而是 Header section 的 block 内容。

#### 图片数据来源

`menu-promotion-large` 的 schema 中定义了这些字段：

- `dropdown_link_title`
- `desktop_image`
- `mobile_image`
- `image_position`
- `enable_fade`

也就是说，图片不是从 `link`、`child_link` 或 collection/product 自动读取出来的，而是后台在 Header section 的 block 里手动配置的。

#### 图片和一级菜单的绑定方式

绑定逻辑不是靠菜单 handle，也不是靠链接 URL，而是靠标题文本匹配：

```liquid
block.settings.dropdown_link_title == 当前一级菜单标题
```

代码里会先把两边都做 `downcase | strip` 后再比较。

只有匹配成功的 `menu-promotion-large` block，才会被插入到该一级菜单的下拉中。

#### 图片渲染位置

当命中 `menu-promotion-large` 后，代码会先在二级菜单容器顶部插入：

```liquid
<div class="navigation__wide-promotion ...">
```

桌面端：

- 如果 `desktop_image != blank` 且 `mobile == false`
- 就渲染 `desktop_image`

移动端：

- 如果 `mobile_image != blank` 且 `mobile == true`
- 就渲染 `mobile_image`

图片实际通过下面这句输出：

```liquid
{% render 'image' with block.settings.desktop_image %}
```

或：

```liquid
{% render 'image' with block.settings.mobile_image %}
```

#### 为什么图片会显示在右边

图片左右位置由 `image_position` 控制。

当：

```liquid
block.settings.image_position == 'right'
```

图片所在列会额外带上：

```liquid
column--order-push-desktop
```

CSS 会根据这个 class，把图片放到右边；默认 schema 值本身也是 `right`。

所以你在桌面下拉里看到“右边有一张大图”，本质上是：

1. 当前一级菜单命中了一个 `menu-promotion-large` block
2. 该 block 配了 `desktop_image`
3. 该 block 的 `image_position` 为 `right`
4. 模板把图片列和文字列一起输出到下拉容器顶部

### 5.6 下拉中的小图片列是如何渲染的

除了“右边大图”外，下拉里还有另一种图片来源：

- `menu-promotion-small`

这种不是整块宽幅图片区，而是作为 mega menu 中的一个 promotion 列插入。

它的数据来源字段是：

- `dropdown_link_title`
- `image`
- `title`
- `link_url`

逻辑同样是先用 `dropdown_link_title` 绑定某个一级菜单标题。

桌面端命中后，代码会把它作为：

```liquid
<li class="navigation__column navigation__column--promotion">
```

插入到二级菜单列中。

它的图片通过：

```liquid
{% render 'image' with block.settings.image %}
```

输出，因此 small promotion 的图片来源也是 Header section 的 block 图片字段，不来自菜单对象本身。

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

