# `cozy-calculator2` 组件流程逻辑分析

本文基于以下三个文件分析 `cozy-calculator2` 的主要结构和交互流程，不涉及改造建议：

- `sections/cozy-calculator2.liquid`
- `assets/cozy-calculator2.css`
- `assets/cozy-calculator2.js`

## 1. 组件职责概览

`cozy-calculator2` 是一个单流程的窗帘重量计算器，用来根据帘头样式、单片宽度、单片长度、面料和里衬，估算每片窗帘的重量。

职责拆分如下：

- `Liquid` 负责输出标题、字段、帮助链接、计算按钮、结果区域和右侧图片。
- `CSS` 负责布局、输入态样式、错误高亮和响应式适配。
- `JavaScript` 负责输入格式清洗、必填校验、重量公式计算以及结果回填。

## 2. 组件结构

`sections/cozy-calculator2.liquid` 输出的是一个左右两栏布局：

- 左侧：
  - 主标题 `header_title`
  - 副标题 `header_subtitle`
  - 5 个输入字段
  - `CALCULATE` 按钮
  - 结果区 `Weight Per Panel`
- 右侧：
  - 可配置图片 `right_block_image`

组件没有 tab，也没有模式切换；所有计算都在一个固定表单内完成。

## 3. 表单字段组成

当前表单包含 5 个字段：

1. `Select Drapery Header Style`
2. `Single Panel Order Width(inch)`
3. `Single Panel Order Length(inch)`
4. `Fabric Collection`
5. `Lining Type`

其中：

- 字段 1、4、5 为下拉框
- 字段 2、3 为文本数字输入框

每个字段旁边都可以通过 schema 配置一个帮助链接：

- `help_link_a`
- `help_link_b`
- `help_link_c`
- `help_link_d`
- `help_link_e`

## 4. 初始化流程

`assets/cozy-calculator2.js` 在 `DOMContentLoaded` 后启动逻辑。

初始化时会：

1. 获取 5 个字段、计算按钮和结果区域的 DOM。
2. 注册下拉框交互事件。
3. 注册两个数字输入框的输入清洗与样式事件。
4. 注册计算按钮点击事件。
5. 注册输入框 `change` 事件，用于移除错误高亮。

这个组件没有额外的 URL 参数、历史状态或视图切换逻辑，初始化相对简单。

## 5. 输入状态与样式逻辑

## 5.1 输入框的已填写状态

文本输入框通过 `cal2-filled` class 控制颜色：

- 初始为空时是灰色
- 用户输入后变为黑色
- 如果再次清空，则移除 `cal2-filled`

对应逻辑由 `setFilledClass()` 控制。

## 5.2 下拉框的已选择状态

下拉框同样依赖 `cal2-filled` 控制显示颜色：

- 初始化时即使已有默认项，文本仍显示为灰色
- 用户开始与下拉框交互后，文本切换为黑色

这次优化后，下拉框不再只依赖 `change` 事件，而是只要用户开始操作下拉框就会标记为已选择，因此：

- 再次选择默认项也会变黑
- 选择其它项也会变黑

## 5.3 数字输入格式限制

两个文本框都使用 `toOneDecimal()` 处理输入，只允许：

- 数字
- 一个小数点
- 最多 1 位小数

处理方式是：

1. 先过滤掉非数字和非小数点字符。
2. 只保留第一个小数点。
3. 小数部分只截取 1 位。
4. 如果用户输入 `.5` 这类值，会标准化成 `0.5`。

输入框在 `input` 事件中实时清洗，随后把光标强制移到末尾。

## 6. 校验逻辑

这个组件实际强制校验的只有两个输入框：

- `Single Panel Order Width`
- `Single Panel Order Length`

校验逻辑在点击计算按钮时执行。

如果任一字段为空：

- 结果区重置为 `-`
- 对应输入框添加 `el-highlight-error`
- 函数直接 `return`

错误样式在 CSS 中表现为红色描边：

- `border: 3px solid #c16452`

当输入框后续发生 `change` 且值非空时，会移除错误高亮。

需要注意的是，当前代码里空值判断写成了：

```text
parseFloat(value) || 0
```

后面再判断 `== ""`。从实现上看，这会让空值被转成 `0`。虽然现有文档只梳理当前逻辑，但这意味着它的“空值校验”依赖实际运行结果，代码表达本身并不严谨。

## 7. 核心计算流程

点击 `CALCULATE` 后，脚本会依次读取 5 个字段的 `data-weight` 或输入值：

- `a_value`：帘头样式系数
- `b_value`：单片宽度
- `c_value`：单片长度
- `d_value`：面料克重
- `e_value`：里衬克重

## 7.1 各字段的计算含义

### 帘头样式

`Select Drapery Header Style` 对应的 `data-weight`：

- 普通褶 / Goblet / Grommet -> `2.2`
- Triple Pleat -> `2.2`
- Soft Top(Rod Pocket) -> `3`

这里可以理解为不同头部样式对面料耗量或重量倍数的影响系数。

### 面料与里衬

- `Fabric Collection` 的 `data-weight` 是不同面料的单位权重
- `Lining Type` 的 `data-weight` 是不同里衬的单位权重

脚本会把二者相加后再换算成千克系数。

## 7.2 计算公式

JS 中的核心公式是：

```text
kg_result = a_value * b_value * c_value * 0.00064516 * ((d_value + e_value) / 1000)
```

可拆解为：

1. `b_value * c_value`
   - 先得到单片面积的基础量级
2. `0.00064516`
   - 将平方英寸换算为平方米
3. `(d_value + e_value) / 1000`
   - 将面料与里衬的克重合并并换算成千克
4. `a_value`
   - 再乘以头部样式对应的系数

因此最终得到的是每片窗帘的重量，单位为千克。

## 7.3 输出结果

代码原本保留了两种输出方式：

- 千克和磅同时输出
- 只输出磅

当前实际启用的是第二种：

```text
lbs_value = Math.ceil(kg_result * 2.204)
```

最终结果写入：

```text
≈ {lbs_value}lbs
```

可以看出：

- 千克结果只作为中间计算值存在
- 对用户展示的是向上取整后的磅数

## 8. 主事件收口

整个组件的交互都收口在 `DOMContentLoaded` 回调里，主要包含三类事件：

### 8.1 下拉框事件

- `change`
- `pointerdown`
- `keydown`

用途：

- 标记用户已经操作过下拉框
- 给 select 添加 `cal2-filled`

### 8.2 输入框事件

- `focus`
  - 若值为 `0`，则选中文本
- `input`
  - 清洗成最多一位小数
  - 光标回到末尾
  - 刷新 `cal2-filled`
- `change`
  - 如果已填写则去掉错误边框

### 8.3 按钮事件

- 点击 `CALCULATE`
  - 读取表单值
  - 执行校验
  - 套用重量公式
  - 把结果写入结果区

## 9. CSS 在流程中的作用

`assets/cozy-calculator2.css` 对业务逻辑的主要配合点有：

- `.cal2-filled`
  - 控制输入框和下拉框从灰色切换为黑色
- `.el-highlight-error`
  - 显示必填错误状态
- 左右两栏布局
  - 桌面端图片在右侧
  - 移动端图片上移到表单前方

也就是说，这个组件的状态变化主要由 JS 决定，CSS 负责把这些状态转换为用户可见的视觉反馈。

## 10. 整体流程总结

`cozy-calculator2` 的主流程可以概括为：

1. 页面加载后获取所有字段和结果 DOM。
2. 用户选择帘头、面料、里衬，并输入宽度和长度。
3. JS 对宽度和长度做最多一位小数的实时清洗。
4. 用户点击 `CALCULATE`。
5. 脚本校验宽度和长度是否已填写。
6. 校验通过后，根据头部系数、面积换算、面料克重和里衬克重，计算每片重量。
7. 将结果以 `≈ xxlbs` 的形式回填到结果区。

因此，这个组件本质上是一个“单表单 + 单公式 + 单结果”的重量计算器，相比第一个计算器更简单，重点在于：

- 输入格式控制
- 必填校验
- 单位换算
- 重量公式计算
