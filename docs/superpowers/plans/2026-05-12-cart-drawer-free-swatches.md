# Cart Drawer Free Swatches Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 cart-drawer 内增加 Free Swatches 横向区块，独立展示样品商品（`free-swatches` collection），并把样品从原主商品列表中过滤掉。

**Architecture:** 全部委托给 Symmetry 现有 `<cart-form data-ajax-update="true">` AJAX 机制处理删除写流程，事件链路（`on:cart:change` → `syncButtonsWithCart` + `refreshMiniCartFromServer`）已经在 test.liquid 配齐。新增内容只有静态 markup、CSS、与一段 7 行的横向滚动按钮事件委托。

**Tech Stack:** Shopify Liquid + 主题 JS（无构建步骤、无测试框架）。验证通过 Shopify dev 主题在浏览器手动测试。

---

## File Structure

**修改文件**：

| 文件 | 改动 |
|---|---|
| `sections/cart-drawer.liquid` | 1) 删除调研用 debug script；2) 在 section 头部追加内联 `<style>` 块；3) 主 cart-item `for` 循环加样品过滤；4) 在主列表关闭后、cross-sells 之前插入 Free Swatches `<div data-merge="free-swatches">` 块 |
| `assets/cart-drawer.js` | 文件末尾追加 7 行的滚动按钮事件委托 |

**不修改**：`sections/test.liquid`、`snippets/mini-cart.liquid`、`snippets/cart-item.liquid`、主题设置。

**不新建**：无新文件。

## 前置条件

开始前确认：
- 工作分支为 `feature/nav-dropdown-refactor`
- `sections/cart-drawer.liquid` 当前包含 brainstorming 阶段加的 debug `<script>`（line 47-66 区域）—— 这是 Task 1 要删的
- Shopify CLI / theme 同步工具已配置好，可推到 dev 主题做浏览器验证
- 浏览器开 devtools 准备好 console + network 面板

---

## Task 1: 移除 cart-drawer.liquid 中的调研用 debug script

**Files:**
- Modify: `sections/cart-drawer.liquid` 第 47-66 行（删除整段 debug script block）

- [ ] **Step 1: 删除 debug script block**

用 Edit 工具把 `sections/cart-drawer.liquid` 中如下完整内容删除（删除后该位置直接接 `{%- if section.settings.show_order_note -%}`）：

```liquid

{%- comment -%} TEMP DEBUG: 用于识别样品商品的字段调研，确认逻辑后会移除 {%- endcomment -%}
<script>
  console.group('[debug] cart-drawer items ({{ cart.items.size }} 件)');
  {%- for item in cart.items -%}
    console.log({{ forloop.index }}, {
      product_id: {{ item.product_id }},
      variant_id: {{ item.variant_id }},
      title: {{ item.product.title | json }},
      handle: {{ item.product.handle | json }},
      type: {{ item.product.type | json }},
      tags: {{ item.product.tags | json }},
      vendor: {{ item.product.vendor | json }},
      collections: {{ item.product.collections | map: 'handle' | json }},
      price: {{ item.price | json }},
      original_price: {{ item.original_price | json }},
      variant_title: {{ item.variant.title | json }}
    });
  {%- endfor -%}
  console.groupEnd();
</script>
```

Edit `old_string` 包括前面那行空行；`new_string` 为空字符串。

- [ ] **Step 2: 同步到 dev 主题、打开浏览器验证**

推到 dev 主题后，打开任意带 cart 的页面（如首页），打开 devtools console。
Expected：console 不再出现 `[debug] cart-drawer items` 分组。

- [ ] **Step 3: 提交**

```bash
git add sections/cart-drawer.liquid
git commit -m "chore: 移除 cart-drawer 字段调研 debug script"
```

---

## Task 2: 添加 Free Swatches 内联样式

**Files:**
- Modify: `sections/cart-drawer.liquid`，在原 line 45（`<script src="cart-drawer.js">`）之后插入 `<style>` 块

- [ ] **Step 1: 插入 `<style>` 块**

用 Edit 工具：

`old_string`:
```liquid
<script src="{{ 'cart-drawer.js' | asset_url }}" defer></script>
{%- if section.settings.show_order_note -%}
```

`new_string`:
```liquid
<script src="{{ 'cart-drawer.js' | asset_url }}" defer></script>

{%- comment -%} Free Swatches 区块样式：cart-drawer 内样品商品横向列表 {%- endcomment -%}
<style>
  .free-swatches__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  .free-swatches__title { margin: 0; font-size: 14px; font-weight: 600; }
  .free-swatches__nav { display: flex; gap: 12px; }
  .free-swatches__nav-btn { background: transparent; border: none; cursor: pointer; padding: 4px; line-height: 0; }
  .free-swatches__list { display: flex; gap: 8px; list-style: none; margin: 0; padding: 0; overflow-x: auto; overflow-y: hidden; scroll-behavior: smooth; align-items: flex-start; }
  .free-swatches__list::-webkit-scrollbar { display: none; }
  .free-swatches__item { flex: 0 0 80px; display: flex; flex-direction: column; gap: 4px; }
  .free-swatches__item-image { width: 80px; height: 80px; }
  .free-swatches__item-image img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .free-swatches__item-meta { display: flex; align-items: flex-start; justify-content: space-between; gap: 4px; }
  .free-swatches__item-title { flex: 1 1 auto; font-size: 12px; line-height: 1.3; word-break: break-word; }
  .free-swatches__item-remove { flex: 0 0 auto; font-size: 14px; color: inherit; text-decoration: none; line-height: 1; }
</style>

{%- if section.settings.show_order_note -%}
```

- [ ] **Step 2: 同步到 dev 主题、浏览器验证**

打开任意页面，devtools Elements 标签找到 `<style>` 标签，确认包含 `.free-swatches__*` 规则。Console 无新报错。

Expected：cart-drawer 视觉行为不变（此时还没有 Free Swatches 块，CSS 没生效目标）。

- [ ] **Step 3: 提交**

```bash
git add sections/cart-drawer.liquid
git commit -m "feat: 在 cart-drawer 中添加 Free Swatches 区块样式"
```

---

## Task 3: 添加 Free Swatches 块 markup + 主列表样品过滤

这是核心改动。一次提交完成"加块 + 过滤"，避免中间状态出现样品在主列表/Free Swatches 中重复或丢失。

**Files:**
- Modify: `sections/cart-drawer.liquid`，两处编辑：(a) 主 `for` 循环加过滤，(b) 主列表关闭后、cross-sells 之前插入 Free Swatches 块

- [ ] **Step 1: 主 cart-item 循环过滤样品**

用 Edit 工具：

`old_string`:
```liquid
            {% for item in cart.items %}
              <div data-merge-list-item="item-key:{{ item.key }}|{{ item.final_price }}{% for discount_allocation in item.line_level_discount_allocations %}|{{ discount_allocation.discount_application.title | escape }}{% endfor %}"
                  {% comment %} Discount items are difficult to predict - BOGOFs appear as a separate item with the same key as an existing item - simpler to always refresh {% endcomment %}
                  {%- if item.line_level_discount_allocations == empty -%}
                  data-merge-cache="{{ item.key }}|{{ item.quantity }}|{{ item.final_line_price }}|{% if item.selling_plan_allocation %}{{ item.selling_plan_allocation.selling_plan.id }}{% endif %}"
                  {%- endif -%}>
                {%- render 'cart-item', item: item, forloop: forloop, drawer: true -%}
              </div>
            {% endfor %}
```

`new_string`:
```liquid
            {% for item in cart.items %}
              {%- assign item_collection_handles = item.product.collections | map: 'handle' -%}
              {%- unless item_collection_handles contains 'free-swatches' -%}
                <div data-merge-list-item="item-key:{{ item.key }}|{{ item.final_price }}{% for discount_allocation in item.line_level_discount_allocations %}|{{ discount_allocation.discount_application.title | escape }}{% endfor %}"
                    {% comment %} Discount items are difficult to predict - BOGOFs appear as a separate item with the same key as an existing item - simpler to always refresh {% endcomment %}
                    {%- if item.line_level_discount_allocations == empty -%}
                    data-merge-cache="{{ item.key }}|{{ item.quantity }}|{{ item.final_line_price }}|{% if item.selling_plan_allocation %}{{ item.selling_plan_allocation.selling_plan.id }}{% endif %}"
                    {%- endif -%}>
                  {%- render 'cart-item', item: item, forloop: forloop, drawer: true -%}
                </div>
              {%- endunless -%}
            {% endfor %}
```

- [ ] **Step 2: 在主列表关闭后、cross-sells 之前插入 Free Swatches 块**

主列表 `<div class="cart-item-list ...">` 的闭合在原 line 113，下面是 `announcement_position == 'below-items'` 块（line 115-119），再下面 line 120 是 `<div class="cart-drawer__content-upper">` 的闭合 `</div>`，再下面 line 122 是 `<div data-merge="cross-sells" ...>`。

Free Swatches 块作为 cross-sells 的兄弟，插入位置：`cart-drawer__content-upper` 闭合的 `</div>` 之后、cross-sells `<div data-merge="cross-sells">` 之前。

用 Edit 工具：

`old_string`:
```liquid
      </div>

      <div data-merge="cross-sells" data-merge-cache="{% if cart.items == blank %}blank{% else %}{{ cart.items.first.product.id }}{% endif %}">
```

（注意：上面这个 `</div>` 是 cart-drawer__content-upper 的闭合）

`new_string`:
```liquid
      </div>

      {%- comment -%} Free Swatches：cart-drawer 内样品商品的紧凑横向列表 {%- endcomment -%}
      {%- assign sample_count = 0 -%}
      {%- for item in cart.items -%}
        {%- assign h = item.product.collections | map: 'handle' -%}
        {%- if h contains 'free-swatches' -%}
          {%- assign sample_count = sample_count | plus: 1 -%}
        {%- endif -%}
      {%- endfor -%}
      <div data-merge="free-swatches">
        {%- if sample_count > 0 -%}
          <div class="cart-drawer__content-item free-swatches" data-free-swatches>
            <header class="free-swatches__header">
              <h3 class="free-swatches__title">Free Swatches ({{ sample_count }}/20)</h3>
              <div class="free-swatches__nav">
                <button type="button" class="free-swatches__nav-btn" data-free-swatches-prev aria-label="Previous">
                  <img src="{{ 'mini-cart-left-arrow-active.png' | asset_url }}" width="8" height="12" alt="">
                </button>
                <button type="button" class="free-swatches__nav-btn" data-free-swatches-next aria-label="Next">
                  <img src="{{ 'mini-cart-right-arrow-active.png' | asset_url }}" width="8" height="12" alt="">
                </button>
              </div>
            </header>
            <ul class="free-swatches__list" data-free-swatches-list role="list">
              {%- for item in cart.items -%}
                {%- assign h = item.product.collections | map: 'handle' -%}
                {%- if h contains 'free-swatches' -%}
                  <li class="free-swatches__item">
                    <div class="free-swatches__item-image">
                      <img src="{{ item.product.featured_media | image_url: width: 160 }}" alt="" width="80" height="80">
                    </div>
                    <div class="free-swatches__item-meta">
                      <div class="free-swatches__item-title">{{ item.product.title }}</div>
                      <a class="free-swatches__item-remove"
                         href="{{ routes.cart_change_url }}?id={{ item.key }}&quantity=0"
                         aria-label="Remove {{ item.product.title | escape }}">×</a>
                    </div>
                  </li>
                {%- endif -%}
              {%- endfor -%}
            </ul>
          </div>
        {%- endif -%}
      </div>

      <div data-merge="cross-sells" data-merge-cache="{% if cart.items == blank %}blank{% else %}{{ cart.items.first.product.id }}{% endif %}">
```

- [ ] **Step 3: 同步到 dev 主题、浏览器逐项验证**

a. **空购物车**：cart-drawer 进入 empty 态正常显示（"Your cart is empty"），Free Swatches 区域不显示。

b. **只有普通商品（非样品）**：cart-drawer 主列表显示普通商品；Free Swatches 区域不显示（外层 `data-merge="free-swatches"` div 存在但内部为空，CSS 不占视觉空间）。

c. **只有样品**：主列表显示为空（视觉上 Cart 标题下直接接 Free Swatches）；Free Swatches 显示样品。
- 计数 `Free Swatches (N/20)` 数字等于样品数
- 每件 swatch 显示：图片 + 标题（标题自动换行），右下角 `×`
- 图片顶部对齐，整行高度由最长标题撑出

d. **混合购物车**：主列表只看到普通商品；Free Swatches 只看到样品；两边互不重复。

e. **删除样品（非 test.liquid 页面，例如首页）**：点击 `×` → cart-drawer 自动 AJAX 刷新 → 该样品消失、计数减 1。Network 面板能看到一个 POST `/cart/change.js`。

f. **删除样品（test.liquid 页面）**：先在 test.liquid 加几个样品到购物车，打开 cart-drawer，点 `×` →
- cart-drawer 内该样品消失、计数减 1
- 页面底部 mini-cart 同步刷新（数量减 1）
- 对应产品卡的 "In Cart" 按钮回弹为 "Add to cart"

g. **回归：普通商品的 quantity stepper**：在 cart-drawer 主列表对一个普通商品点 -/+/Remove，行为与之前一致，无破坏。

h. **滚动**：加 5+ 件样品，能横向手动滑动列表（按钮先不要点，按钮在 Task 4 加 JS 才生效）。

任何一项失败先排查再继续，不要带着已知问题往下走。

- [ ] **Step 4: 提交**

```bash
git add sections/cart-drawer.liquid
git commit -m "feat: cart-drawer 增加 Free Swatches 区块并过滤主列表样品"
```

---

## Task 4: 添加 Free Swatches 滚动按钮 JS

**Files:**
- Modify: `assets/cart-drawer.js`，文件末尾追加 7 行事件委托代码

- [ ] **Step 1: 在 cart-drawer.js 末尾追加滚动按钮代码**

先用 Read 工具读 `assets/cart-drawer.js`，确认文件存在、查看末尾几行的现有结构（如果末尾没有 trailing newline 需注意拼接）。

然后用 Edit 工具，把文件最末尾内容（最后一个 `;` 或 `}` 后的最后几个字符）作为 `old_string`，在其后追加：

```js

// Free Swatches 横向列表：左右滚动按钮，事件委托
document.addEventListener('click', function (e) {
  const prev = e.target.closest('[data-free-swatches-prev]');
  const next = e.target.closest('[data-free-swatches-next]');
  if (!prev && !next) return;
  const block = (prev || next).closest('[data-free-swatches]');
  const list  = block && block.querySelector('[data-free-swatches-list]');
  if (!list) return;
  const step = list.clientWidth * 0.8;
  list.scrollBy({ left: prev ? -step : step, behavior: 'smooth' });
});
```

如果 cart-drawer.js 是被混淆 / 压缩的 build 产物，Edit 不好操作，则改用 Read 看清结构后再决定追加方式（最坏情况单独建一个 `<script>` 内联到 cart-drawer.liquid 末尾——但这是 fallback，不是默认）。

- [ ] **Step 2: 同步到 dev 主题、浏览器验证滚动按钮**

加 5+ 件样品到购物车，打开 cart-drawer：
- 点左箭头 → 列表向右回滚（露出靠左 / 之前位置的 item）
- 点右箭头 → 列表向左滚（露出右侧未显示的 item）
- 滚动是 smooth 平滑过渡
- 滚动一次的距离约为可视区宽度的 80%

回归检查：cart-drawer 其它原有功能未受影响（普通商品 stepper、Cart 按钮、关闭按钮、cross-sells 等）。

- [ ] **Step 3: 提交**

```bash
git add assets/cart-drawer.js
git commit -m "feat: 在 cart-drawer.js 中追加 Free Swatches 横向滚动按钮事件委托"
```

---

## 完工后整体验证

按 spec 的验证清单逐项过一遍（重复 Task 3 / Task 4 中的检查），重点关注：

- [ ] 普通商品 + 样品混合 → 主列表只看到普通商品，Free Swatches 只看到样品
- [ ] 计数 `Free Swatches (N/20)` 正确
- [ ] 点垃圾按钮 × → 该样品从 Free Swatches 移除，计数减 1
- [ ] test.liquid 上：点 × → 产品卡 "In Cart" 回弹为 "Add to cart"
- [ ] test.liquid 上：点 × → 底部 mini-cart 同步刷新
- [ ] test.liquid Add to cart 加样品 → 重新打开 cart-drawer 见新样品出现
- [ ] 样品数 > 4 件 → 左/右滚动按钮能横向滚动列表
- [ ] 样品数 = 0 → Free Swatches 不显示，cart-drawer 形态不变
- [ ] 购物车清空 → cart-drawer 进入 empty 态正常
- [ ] 移动端视口：cart-drawer 内 Free Swatches 横向滚动正常
- [ ] **回归**：非样品商品 quantity stepper（+/-/remove）行为不受影响

---

## 备注

- 垃圾图标目前用文本 `×` 占位；后续用户提供真正的 trash icon PNG 后，把 Task 3 的 `>×</a>` 替换为 `><img src="{{ '...' | asset_url }}" ...></a>` 即可
- 移动端如发现 80px 在窄屏不合适，再加 `@media (max-width: 767px)` 微调，本期不做
