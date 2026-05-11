# Cart Drawer Free Swatches 区块 — 设计文档

**日期**：2026-05-11
**作者**：libo.gou@dreambigcareer.com
**关联工作**：续接 `feature/nav-dropdown-refactor` 分支上 mini-cart 系列实现

## 背景

之前已实现 test.liquid（样品 collection 页）底部的 mini-cart 浮条，强制约束购物车样品最多 20 件，并在产品列表卡片上提供 Add/Remove 切换。

现状的缺口：用户在 Symmetry 主题的侧边栏购物车（cart-drawer）中看到的样品商品仍按"每件一行"标准布局展示，并附带数量步进器。这与"样品最多 20 件、且不能跨件数量调整"的业务规则不一致——用户可以通过数量步进器越过 20 件上限。

## 目标

在 cart-drawer 内增加一个名为 **Free Swatches** 的紧凑横向区块：

- 仅展示购物车中的样品商品（不带步进器）
- 显示形如 `Free Swatches (N/20)` 的计数器
- 提供横向滚动 + 左右切换按钮
- 每件支持单击垃圾按钮直接移除
- 样品商品**从原主商品列表中过滤掉**，避免在 cart-drawer 内重复展示

非目标：

- cart-drawer 内不强制 20 件上限（仍由 test.liquid 的 Add 按钮逻辑负责）
- 不引入新主题设置（20 直接硬编码）
- 不抽组件 / snippet（评估后采用 inline 集成简化结构）

## 样品商品识别

样品商品 = `item.product.collections` 中包含 handle 为 `free-swatches` 的 collection。

```liquid
{%- assign h = item.product.collections | map: 'handle' -%}
{%- if h contains 'free-swatches' -%}
  {# this is a sample #}
{%- endif -%}
```

判定逻辑在 cart-drawer.liquid 中两处使用：

1. 过滤主 cart-item 列表，排除样品
2. Free Swatches 区块内反向筛选，仅渲染样品

计数同样基于此判定。

## DOM 结构

整个 Free Swatches 区块插入 cart-drawer 主列表与 cross-sells 之间（即 cart-drawer.liquid 现在 line 92 闭合后、line 101 cross-sells `data-merge` 容器之前）。

```html
<div data-merge="free-swatches">
  <!-- sample_count > 0 时才填充以下内容 -->
  <div class="cart-drawer__content-item free-swatches" data-free-swatches>
    <header class="free-swatches__header">
      <h3 class="free-swatches__title">Free Swatches (N/20)</h3>
      <div class="free-swatches__nav">
        <button data-free-swatches-prev><img src="mini-cart-left-arrow-active.png"></button>
        <button data-free-swatches-next><img src="mini-cart-right-arrow-active.png"></button>
      </div>
    </header>
    <ul class="free-swatches__list" data-free-swatches-list>
      <li class="free-swatches__item">
        <div class="free-swatches__item-image"><img src="..."></div>
        <div class="free-swatches__item-meta">
          <div class="free-swatches__item-title">{{ item.product.title }}</div>
          <a class="free-swatches__item-remove"
             href="{{ routes.cart_change_url }}?id={{ item.key }}&quantity=0">×</a>
        </div>
      </li>
      <!-- ...更多样品... -->
    </ul>
  </div>
</div>
```

**关键设计**：

- 最外层 `<div data-merge="free-swatches">` 始终输出（即使 0 件样品），让 Symmetry 的 section-rendering 机制有稳定的刷新目标节点
- 内部内容用 `{% if sample_count > 0 %}` 控制，0 件时为空、不占视觉空间
- 垃圾按钮使用与 cart-item.liquid line 174 相同的 `<a href="/cart/change?id=KEY&quantity=0">` 形式，由 `<cart-form data-ajax-update="true">` 自动拦截

## 样式

样式以内联 `<style>` 块写在 cart-drawer.liquid 内（与 markup 同生命周期）。一套规则覆盖桌面 + 移动，必要时后期加 media query 微调。

```css
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
```

**布局抉择说明**：

- item 宽度固定 80px（cart-drawer ~400px 内容区一次可视 ~4 件，吻合 mockup）
- `align-items: flex-start` 在 `.free-swatches__list` 上：所有图片顶部对齐，标题在图片下方自然换行；不同长度标题导致 item 高度参差，整行高度由最长标题撑出
- 标题 `flex: 1 1 auto`：占满 remove 按钮以外的宽度，自动换行
- 滚动条隐藏，靠左右按钮 + 触摸滑动；按钮"到边失活"不做（与 mini-cart 一致）

## 删除流程

完全委托给 Symmetry 的 cart-form AJAX 机制：

1. 用户点击 `<a class="free-swatches__item-remove" href="/cart/change?id=KEY&quantity=0">`
2. 该 `<a>` 位于 cart-drawer.liquid 的 `<cart-form data-ajax-update="true">` 内部
3. Symmetry 拦截链接点击 → POST 到 `/cart/change` → 接收新 cart 状态
4. Symmetry 用 Section Rendering API 刷新 cart-drawer DOM（含 Free Swatches 块——它就是该 section 的一部分）
5. Symmetry dispatch `on:cart:change` 全局事件
6. test.liquid 现有的两个监听器分别响应：
   - `syncButtonsWithCart` → 同步产品列表 Add 按钮态（"In Cart" 回弹为 "Add to cart"）
   - `refreshMiniCartFromServer` → 刷新底部 mini-cart HTML

**不需要任何自定义 cart 写流程代码**——零 `fetch` 调用、零 `isCartFlying` 锁集成、零跨页协调代码。

## 滚动按钮 JS

唯一需要新增的 JS。追加到 `assets/cart-drawer.js` 文件末尾：

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

事件委托绑在 `document`，保证 cart-drawer 多次 section-rendering 后依然有效。

## cart-drawer.liquid 改动清单

1. **移除调研用 debug `<script>`**（line 47-65 的 `[debug] cart-drawer items` 块）
2. **在 `<script src="cart-drawer.js">` 之后、`<cart-drawer>` 开标签之前添加内联 `<style>` 块**（前述 CSS）
3. **主 cart-item 列表 `for` 循环过滤样品**（line 82-90 区域）：
   ```liquid
   {% for item in cart.items %}
     {%- assign h = item.product.collections | map: 'handle' -%}
     {%- unless h contains 'free-swatches' -%}
       <!-- 原有 data-merge-list-item div -->
     {%- endunless -%}
   {% endfor %}
   ```
4. **在主列表关闭后、cross-sells 之前插入 Free Swatches 块**（line ~92 之后、line ~101 之前）

## assets/cart-drawer.js 改动

文件末尾追加 7 行的滚动按钮事件委托代码。

## 边界情况

| 场景 | 处理 |
|---|---|
| 购物车 0 件 | cart-drawer 自身的 empty 态逻辑独立工作；`data-merge="free-swatches"` 包装 div 内为空 |
| 仅样品、无普通商品 | 主列表为空、Free Swatches 显示；cart-drawer 仍为非 empty 态 |
| 仅普通商品、无样品 | 主列表正常、Free Swatches 不渲染（空包装 div） |
| 1 件样品 | 显示 1 件，滚动按钮存在但点击无视觉效果（无溢出） |
| 删到最后 1 件再删 | Symmetry 刷新后 `sample_count == 0`，块消失 |
| test.liquid 上并发操作 | cart-drawer modal 遮罩阻止与底部 mini-cart 并发点击，无 race |
| 非 test.liquid 页删样品 | `on:cart:change` 派发但无 mini-cart 监听器，无副作用 |

## 验证清单

部署到 Shopify dev 主题后手动验证：

- [ ] 普通商品 + 样品混合在购物车 → 主列表只看到普通商品，Free Swatches 只看到样品
- [ ] 计数 `Free Swatches (N/20)` 正确
- [ ] 点垃圾按钮 × → 该样品从 Free Swatches 移除，计数减 1
- [ ] **test.liquid 上**：点垃圾按钮 × → 对应产品卡 "In Cart" 按钮回弹为 "Add to cart"
- [ ] **test.liquid 上**：点垃圾按钮 × → 底部 mini-cart 同步刷新
- [ ] 从 test.liquid Add to cart 加样品 → 重新打开 cart-drawer 见新样品出现
- [ ] 样品数 > 4 件 → 左/右滚动按钮能横向滚动列表
- [ ] 样品数 = 0 → Free Swatches 完全不显示，cart-drawer 形态与现在一致
- [ ] 购物车清空 → cart-drawer 进入 empty 态正常
- [ ] 移动端视口：cart-drawer 内 Free Swatches 列表横向滚动正常
- [ ] **回归**：普通（非样品）商品在主列表的 quantity stepper（+/-/remove）行为不受影响

## 未决事项

- 垃圾图标待用户提供，目前用文本 `×` 占位
- 后期视测试效果可能加移动端 media query 微调

## 影响范围

修改文件：

- `sections/cart-drawer.liquid` — 主要工作量
- `assets/cart-drawer.js` — 末尾追加 7 行

不修改：

- `sections/test.liquid`
- `snippets/mini-cart.liquid`
- `snippets/cart-item.liquid`
- 任何主题设置 schema
