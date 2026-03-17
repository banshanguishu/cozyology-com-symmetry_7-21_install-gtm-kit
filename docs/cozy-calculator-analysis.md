# `cozy-calculator` 组件流程逻辑分析

本文基于以下三个文件分析 `cozy-calculator` 组件的主要流程和交互逻辑，不涉及改造建议：

- `sections/cozy-calculator.liquid`
- `assets/cozy-calculator.css`
- `assets/cozy-calculator.js`

## 1. 组件职责概览

`cozy-calculator` 是一个双模式窗帘计算器组件，用于帮助用户在两种目标之间切换：

1. 根据 `Stacked Width` 反推 `Single Panel Order Width` 和褶数/环数。
2. 根据 `Rod / Track Length`、`Number Of Panels`、`Pleat Style` 推算单片下单宽度、褶数/环数以及堆叠宽度范围。

从职责拆分上看：

- `Liquid` 负责输出组件结构、字段、帮助链接、结果区和右侧图片。
- `CSS` 负责版式、显隐状态的视觉表现、错误高亮和响应式布局。
- `JavaScript` 负责 URL 参数驱动的 tab 切换、输入限制、表单状态重置、计算公式执行和结果回填。

## 2. 组件结构

### 2.1 页面骨架

`sections/cozy-calculator.liquid` 输出了一个左侧计算区和右侧图片区：

- 顶部标题：来自 `section.settings.header_title`
- 左侧计算区：
  - tab 切换器
  - 两个输入框
  - 两个下拉框
  - 计算按钮
  - 结果展示区
  - tab 间互跳链接
- 右侧图片区：
  - 来自 `section.settings.right_block_image`

### 2.2 两个 tab 的字段差异

虽然所有字段都一次性渲染出来，但默认会通过 JS 控制显隐。

`tab=1` 对应 `Panel Width Calculator`：

- 显示 `Stacked Width (inch)` 输入框
- 显示 `Pleat Style`
- 隐藏 `Rod / Track Length`
- 隐藏 `Number Of Panels`
- 隐藏结果里的 `Stacked Width(inch)`
- 显示跳转到 tab 2 的提示链接

`tab=2` 对应 `Stacked Width Calculator`：

- 显示 `Rod / Track Length (inch)` 输入框
- 显示 `Number Of Panels`
- 显示 `Pleat Style`
- 显示结果里的 `Stacked Width(inch)`
- 显示跳转到 tab 1 的提示链接

### 2.3 可配置项

schema 中主要暴露了以下后台配置：

- `header_title`
- `right_block_image`
- `help_link_1` 到 `help_link_4`

这些 help link 会挂在各字段或结果标题旁边的帮助图标上，用于跳转外部说明页面。

## 3. 初始化与状态控制流程

## 3.1 入口初始化

`assets/cozy-calculator.js` 通过一个立即执行函数启动组件逻辑。

初始化顺序如下：

1. 读取当前 URL 查询参数。
2. 从 `tab` 参数中判断当前 tab 是否为 `1` 或 `2`。
3. 如果 URL 中没有合法值，则默认使用 `tab=1`。
4. 在 `DOMContentLoaded` 触发后执行界面初始化。

对应的初始化动作包括：

1. 给当前 tab 的切换按钮添加 `active` 样式。
2. 根据当前 tab 控制字段、结果块和互跳链接的显隐。
3. 绑定 tab 点击切换事件。
4. 执行 `main()`，挂载输入、下拉和按钮的业务逻辑。

## 3.2 URL 驱动的 tab 切换

组件不是单纯依赖内存状态切换，而是把当前 tab 同步到 URL：

- 点击 tab 时调用 `setTab(tab, true)`
- `setTab` 会：
  - 更新 `currentTab`
  - 刷新 tab 样式
  - 刷新页面显隐
  - 重置计算器状态
  - 使用 `history.pushState` 写回 `?tab=1` 或 `?tab=2`

这样做的结果是：

- 当前 tab 可以被分享或刷新后保留
- 浏览器前进后退可以还原 tab 状态

此外，脚本还监听了 `popstate`：

- 当用户使用浏览器后退/前进时
- 会重新读取 URL 中的 `tab`
- 并更新当前界面状态

## 3.3 跨 tab 跳转

模板中有两个文字链接：

- `CALCULATE STACKED WIDTH`
- `CALCULATE PANEL WIDTH`

它们最终调用全局 `handleNavigate(tab)`，而该函数内部实际也是走 `setTab`。因此这些链接本质上不是跳去新页面，而是在当前页面中切换计算模式并同步 URL。

## 4. 输入状态与校验逻辑

## 4.1 输入高亮与“已填写”状态

组件通过 `is-filled` class 来区分默认状态和已输入状态：

- 输入框：值非空且不等于默认值时，添加 `is-filled`
- 下拉框：只有在用户主动切换后，才会标记 `data-has-been-changed="true"`，再添加 `is-filled`

这个逻辑主要用于视觉反馈，控制文字颜色从浅色变为深色。

## 4.2 数字输入限制

两个文本输入框都被限制为“最多一位小数”的十进制数字。

JS 通过 `attachDecimalOneLimiter` 绑定三层限制：

1. `beforeinput`
   - 在输入发生前预判结果是否合法
   - 不合法则阻止输入
2. `paste`
   - 拦截粘贴内容
   - 只保留数字和一个小数点
   - 且小数点后最多一位
3. `input`
   - 如果仍出现非法值，立即二次清洗

模板中的 `onkeypress` 也做了基础限制，只允许数字、退格和小数点输入。不过真正更完整的限制逻辑主要还是在 JS 中。

## 4.3 必填校验与错误样式

当前组件只有当前 tab 的主输入框被视为必填项：

- tab 1 必填：`Stacked Width`
- tab 2 必填：`Rod / Track Length`

如果点击计算时对应字段为空：

- 输入框会被添加 `el-highlight-error`
- 结果区域会回退为 `-`
- 控制台抛出错误信息

错误高亮样式在 CSS 中表现为：

- `border: 3px solid #c16452`

当输入框后续发生 `change` 且值非空时，会移除错误高亮。

## 4.4 切 tab 时的重置逻辑

`setTab` 每次切换模式后都会调用 `resetCalculatorView()`，重置以下状态：

- 两个输入框清空
- 两个输入框错误高亮移除
- 两个下拉框恢复到第一个选项
- 下拉框的 `data-has-been-changed` 删除
- 三个结果值恢复为 `-`

这意味着该组件的设计是“两个模式彼此独立”，切换模式时不会保留上一个模式的输入和结果。

## 5. 计算流程一：Panel Width Calculator

当 `currentTab === "1"` 时，点击 `CALCULATE` 会执行 `processOne()`。

### 5.1 输入项

流程一实际使用的字段只有两个：

- `Stacked Width`
- `Pleat Style`

其中 `Pleat Style` 的两个选项分别对应：

- `double`
- `triple`

### 5.2 计算基数

脚本按 pleat style 读取不同的基础参数：

`double`：

- `ringsValueRange: [0.8, 1.2]`
- `panelValueRange: [3.579, 5.369]`

`triple`：

- `ringsValueRange: [1.5, 2]`
- `panelValueRange: [1.89, 2.52]`

### 5.3 计算方式

输入的 `stacked_width_value` 会被用于两个范围计算：

1. 褶数/环数范围

```text
Math.round(stacked_width_value / 上限) ~ Math.round(stacked_width_value / 下限)
```

2. 单片下单宽度范围

```text
Math.round(stacked_width_value * 下限系数) ~ Math.round(stacked_width_value * 上限系数)
```

### 5.4 输出结果

流程一会更新两个结果区域：

- `Single Panel Order Width(inch)` -> `≈ panelRange`
- `Numers of Pleats and Rod Rings` -> `≈ ringsRange`

不会更新 `Stacked Width(inch)` 结果块，因为该块在 tab 1 下被隐藏。

### 5.5 流程特点

流程一不是输出单一精确值，而是输出“范围值”。

也就是说，用户输入一个堆叠宽度后，组件会给出：

- 一个建议的单片下单宽度范围
- 一个建议的褶数/环数范围

## 6. 计算流程二：Stacked Width Calculator

当 `currentTab === "2"` 时，点击 `CALCULATE` 会执行 `processTwo()`。

### 6.1 输入项

流程二使用的字段有三个：

- `Rod / Track Length`
- `Number Of Panels`
- `Pleat Style`

其中：

- `Number Of Panels`
  - `Single` 对应 `data-weight="1"`
  - `Split` 对应 `data-weight="0.5"`
- `Pleat Style`
  - `double`
  - `triple`

### 6.2 计算思路

这一流程的核心思路是：

1. 先把 rod length 从英寸换算成米。
2. 结合面板数量权重，算出单片下单宽度。
3. 根据 pleat style 和宽度区间，估算需要的褶数/环数。
4. 再由褶数/环数换算堆叠宽度范围。

### 6.3 面板宽度计算

脚本先执行单位换算：

```text
rodLengthMeters = rodLengthInch * 0.0254
```

再乘以 panel 权重：

```text
orderValue = rodLengthMeters * panelWeight
```

再换算回英寸：

```text
orderValueToInchs = orderValue / 0.0254
```

这里 `panelWeight` 的设计含义是：

- `Single = 1`，单片宽度等于整根杆长
- `Split = 0.5`，双开时单片宽度等于杆长的一半

然后脚本用：

```text
parseInt(orderValueToInchs * 10) / 10
```

把结果处理成最多一位小数，避免浮点误差导致出现很多尾数。

### 6.4 褶数/环数计算

不同 pleat style 对应不同的区间参数：

`double`：

- `range: [1.5, 4]`
- `interval.lt = 2.4`
- `interval.ltgt = 2.2`
- `interval.gt = 2`
- `widthRange: [0.8, 1.2]`

`triple`：

- `range: [1, 4]`
- `interval.lt = 2.4`
- `interval.ltgt = 2.2`
- `interval.gt = 2`
- `widthRange: [1.5, 2]`

计算规则如下：

1. 如果 `orderValue <= range[0]`
   - 使用 `interval.lt`
2. 如果 `orderValue >= range[1]`
   - 使用 `interval.gt`
3. 其余情况
   - 使用 `interval.ltgt`

最终公式为：

```text
ringsValue = Math.ceil((orderValue * intervalFactor) / 0.24)
```

这里使用 `Math.ceil`，说明结果会固定向上取整。

### 6.5 堆叠宽度范围计算

得到 `ringsValue` 后，再根据 pleat style 的 `widthRange` 输出堆叠宽度范围：

```text
Math.round(ringsValue * widthRange[0]) ~ Math.round(ringsValue * widthRange[1])
```

### 6.6 输出结果

流程二会更新三个结果区域：

- `Single Panel Order Width(inch)` -> `≈ roundedOrderValueToInchs`
- `Numers of Pleats and Rod Rings` -> `≈ ringsValue`
- `Stacked Width(inch)` -> `≈ widthRangeRet`

与流程一相比，流程二的特点是：

- 单片下单宽度输出的是单值
- 褶数/环数输出的是单值
- 堆叠宽度输出的是范围值

## 7. 主事件收口逻辑

`main()` 是整个组件交互的主收口函数，负责做三类事情：

### 7.1 绑定表单状态事件

- 输入框 `change`：清除错误高亮
- 输入框 `input`：更新 `is-filled`
- 下拉框 `change`：记录用户已修改并更新 `is-filled`

### 7.2 绑定输入限制

- 对 `Stacked Width` 输入框绑定小数限制
- 对 `Rod / Track Length` 输入框绑定小数限制

### 7.3 绑定计算按钮

点击 `CALCULATE` 时：

1. 判断当前 `currentTab`
2. 如果是 tab 1，执行 `processOne`
3. 如果是 tab 2，执行 `processTwo`
4. 如果计算报错，则仅在控制台打印错误

因此按钮是整个计算行为的统一入口，而具体计算分流由当前 tab 决定。

## 8. CSS 在流程中的辅助作用

`assets/cozy-calculator.css` 本身不承载业务逻辑，但对组件流程有几个关键配合作用：

- `.active`
  - 用于高亮当前 tab
- `.is-filled`
  - 用于区分默认值与已填写状态
- `.el-highlight-error`
  - 用于必填错误高亮
- 响应式布局
  - 桌面端左右两栏
  - 移动端改为上下布局，右侧图片提前显示

CSS 让 JS 的状态切换可以直接映射为用户可见的视觉反馈。

## 9. 整体流程总结

这个组件的主流程可以概括为：

1. 页面加载时读取 URL 中的 `tab` 参数。
2. 根据 tab 显示对应的输入项、结果项和互跳链接。
3. 用户填写当前模式所需字段。
4. JS 对输入做最多一位小数的限制，并管理填写状态样式。
5. 点击 `CALCULATE` 后，按当前 tab 进入不同的计算函数。
6. 计算结果被格式化为 `≈` 开头的值或范围，并写回结果区。
7. 如果用户切换 tab，组件会重置输入、下拉和结果，再进入另一套计算流程。

因此，`cozy-calculator` 的核心并不是复杂的 DOM 结构，而是：

- URL 驱动的双模式切换
- tab 间独立的表单状态管理
- 两套不同的窗帘计算公式
- 结果区的统一回填机制
