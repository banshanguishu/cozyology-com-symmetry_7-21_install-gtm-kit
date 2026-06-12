const tabs = ["1", "2"];
let currentTab = "1";

/* 解析url参数，返回一个对象 */
function parseSearchToObject() {
  const searchParams = new URLSearchParams(window.location.search);
  const result = {};

  // 遍历所有参数，存入对象
  for (const [key, value] of searchParams.entries()) {
    result[key] = value;
  }

  return result;
}

/* 循环渲染所有tab和content的显隐状态 */
function styleSelectedSwitcher(t) {
  try {
    for (const tabItem of tabs) {
      const switcher = document.querySelector(`.switcher-${tabItem}`);
      if (switcher) {
        if (t === tabItem) {
          switcher.classList.add("active");
        } else {
          switcher.classList.remove("active");
        }
      }
    }
  } catch (error) {
    throw error;
  }
}

/* 根据当前路由tab控制一些元素的显隐 */
function displayElement(t) {
  if (!t || !tabs.includes(t)) return;
  const stackedWidthDom = document.querySelector(".item-stacked-width");
  const rodLengthDom = document.querySelector(".item-rod-length");
  const numberPanelsDom = document.querySelector(".number-of-panels");
  const resultStackedWidthDom = document.querySelector(".cal-result-stacked-width");
  const hyperPanel = document.querySelector(".cal-item-hyperlink-panel");
  const hyperStacked = document.querySelector(".cal-item-hyperlink-stacked");

  if (stackedWidthDom) stackedWidthDom.style.display = t === "1" ? "flex" : "none";
  if (rodLengthDom) rodLengthDom.style.display = t === "2" ? "flex" : "none";
  if (numberPanelsDom) numberPanelsDom.style.display = t === "2" ? "flex" : "none";
  if (resultStackedWidthDom) resultStackedWidthDom.style.display = t === "2" ? "block" : "none";
  if (hyperPanel) hyperPanel.style.display = t === "1" ? "block" : "none";
  if (hyperStacked) hyperStacked.style.display = t === "2" ? "block" : "none";
}

function updateInputFilledState(el) {
  if (!el) return;
  const nextIsFilled = el.value !== "" && el.value !== el.defaultValue;
  el.classList.toggle("is-filled", nextIsFilled);
}

function isValidDecimalOne(value) {
  return /^\d*(\.\d{0,1})?$/.test(value);
}

function sanitizeDecimalToOne(text) {
  let s = String(text ?? "").replace(/[^\d.]/g, "");
  const firstDotIndex = s.indexOf(".");
  if (firstDotIndex === -1) return s;
  const beforeDot = s.slice(0, firstDotIndex);
  const afterRaw = s.slice(firstDotIndex + 1).replace(/\./g, "");
  return `${beforeDot}.${afterRaw.slice(0, 1)}`;
}

function attachDecimalOneLimiter(el) {
  if (!el) return;

  el.addEventListener("beforeinput", (e) => {
    if (!e || !e.inputType) return;
    if (e.inputType.startsWith("delete")) return;
    if (e.inputType === "insertFromPaste") return;
    if (typeof e.data !== "string") return;

    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? start;
    const nextValue = `${el.value.slice(0, start)}${e.data}${el.value.slice(end)}`;

    if (!isValidDecimalOne(nextValue)) {
      e.preventDefault();
    }
  });

  el.addEventListener("paste", (e) => {
    if (!e) return;
    e.preventDefault();
    const pastedText = e.clipboardData ? e.clipboardData.getData("text") : "";
    const insertText = sanitizeDecimalToOne(pastedText);
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? start;
    const nextValue = `${el.value.slice(0, start)}${insertText}${el.value.slice(end)}`;
    const finalValue = isValidDecimalOne(nextValue) ? nextValue : sanitizeDecimalToOne(nextValue);
    el.value = finalValue;
    const nextCaret = Math.min(start + insertText.length, el.value.length);
    el.setSelectionRange(nextCaret, nextCaret);
    updateInputFilledState(el);
  });

  el.addEventListener("input", () => {
    if (isValidDecimalOne(el.value)) return;
    const caret = el.selectionStart ?? el.value.length;
    el.value = sanitizeDecimalToOne(el.value);
    const nextCaret = Math.min(caret, el.value.length);
    el.setSelectionRange(nextCaret, nextCaret);
  });
}

function updateSelectFilledState(el) {
  if (!el) return;
  const nextIsFilled = el.dataset.hasBeenChanged === "true";
  el.classList.toggle("is-filled", nextIsFilled);
}

function markSelectAsFilled(el) {
  if (!el || el.dataset.hasBeenChanged === "true") return;
  el.dataset.hasBeenChanged = "true";
  updateSelectFilledState(el);
}

/* radio-group：读取选中项 data-weight（无选中时回退第一项） */
function getRadioWeight(group) {
  if (!group) return null;
  const checked = group.querySelector('input[type="radio"]:checked') || group.querySelector('input[type="radio"]');
  return checked ? checked.getAttribute("data-weight") : null;
}

/* radio-group：重置为默认选中第一项 */
function resetRadioGroup(group) {
  if (!group) return;
  const radios = group.querySelectorAll('input[type="radio"]');
  radios.forEach((radio, index) => {
    radio.checked = index === 0;
  });
}

function resetCalculatorView() {
  const el1 = document.querySelector(".item-stacked-width input");
  const el2 = document.querySelector(".item-rod-length input");
  const el3 = document.querySelector(".number-of-panels select");
  const el4 = document.querySelector(".pleat-style .cozy-cal-radio-group");

  const el6 = document.querySelector(".cal-result-order");
  const el7 = document.querySelector(".cal-result-rings");
  const el8 = document.querySelector(".cal-result-width");

  if (el1) {
    el1.classList.remove("el-highlight-error");
    el1.value = "";
  }
  if (el2) {
    el2.classList.remove("el-highlight-error");
    el2.value = "";
  }
  if (el3) el3.selectedIndex = 0;
  resetRadioGroup(el4);

  if (el3) delete el3.dataset.hasBeenChanged;

  updateInputFilledState(el1);
  updateInputFilledState(el2);
  updateSelectFilledState(el3);

  if (el6) el6.innerHTML = "-";
  if (el7) el7.innerHTML = "-";
  if (el8) el8.innerHTML = "-";
}

function setTab(t, shouldPushState = true) {
  if (!t || !tabs.includes(t)) return;
  if (t === currentTab) return;

  currentTab = t;
  styleSelectedSwitcher(currentTab);
  displayElement(currentTab);
  resetCalculatorView();

  if (shouldPushState) {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", currentTab);
    window.history.pushState({ tab: currentTab }, "", url.toString());
  }
}

/* 监听tab切换事件，跳转功能 */
function listenTabSwitcher() {
  const dom = document.querySelector(".tab-switcher");
  if (dom) {
    dom.addEventListener("click", (e) => {
      const t = e.target.closest(".switcher-item");
      if (t) {
        const tab_v = t.dataset.tab;
        if (tab_v) {
          setTab(tab_v, true);
        }
      }
    });
  }
}

/* 移动端时相关操作 */
function modifyWhenMobile() {
  // 判断当前是否时移动端
  const isMobile = window.innerWidth <= 768;
  if (isMobile) {
    const tab1 = document.querySelector(".switcher-1");
    if (tab1) {
      tab1.innerText = "Panel Width";
    }
    const tab2 = document.querySelector(".switcher-2");
    if (tab2) {
      tab2.innerText = "Stacked Width";
    }
  }
}

/* 计算流程1 */
function processOne(el_stacked_width_input, el_pleat_style_select, el_result_order, el_result_rings) {
  const pleatStyleBaseValueMap = {
    double: {
      value1: 2,
      value2: 0.18,
      ringsValueRange: [0.8, 1.2],
      panelValueRange: [3.579, 5.369],
    },
    triple: {
      value1: 2.5,
      value2: 0.29,
      ringsValueRange: [1.5, 2],
      panelValueRange: [1.89, 2.52],
    },
  };

  const stacked_width_value = parseFloat(el_stacked_width_input.value) || 0;
  const pleat_style_value = getRadioWeight(el_pleat_style_select); // double or triple
  const base_value = pleatStyleBaseValueMap[pleat_style_value];

  if (stacked_width_value == "") {
    el_stacked_width_input.classList.add("el-highlight-error");
    el_result_order.innerHTML = "-";
    el_result_rings.innerHTML = "-";
    throw new Error("cozy-calculator未通过校验，stacked_width为必填！");
  }

  // 褶子个数
  // const rings = Math.round((stacked_width_value * 100) / (base_value.value1 * 39.3701));
  const ringsRange = `${Math.round(stacked_width_value / base_value.ringsValueRange[1])} ~ ${Math.round(stacked_width_value / base_value.ringsValueRange[0])}`;
  // 单片宽度
  // const panel = Math.round(stacked_width_value / base_value.value2);
  const panelRange = `${Math.round(stacked_width_value * base_value.panelValueRange[0])} ~ ${Math.round(stacked_width_value * base_value.panelValueRange[1])}`;

  console.log("ringsRange", ringsRange);
  console.log("panelRange", panelRange);

  el_result_order.innerHTML = `≈ ${panelRange}`;
  el_result_rings.innerHTML = `≈ ${ringsRange}`;
}

/* 计算流程2 */
function processTwo(el_rod_length_input, el_number_of_panels_select, el_pleat_style_select, el_result_order, el_result_rings, el_result_width) {
  /* double or triple参与计算值基数 */
  const pleatStyleBaseValueMap = {
    double: {
      range: [1.5, 4],
      interval: {
        lt: 2.4,
        ltgt: 2.2,
        gt: 2,
      },
      value: 2,
      widthRange: [0.8, 1.2],
    },
    triple: {
      range: [1, 4],
      interval: {
        lt: 2.4,
        ltgt: 2.2,
        gt: 2,
      },
      value: 2.5,
      widthRange: [1.5, 2],
    },
  };
  const el_rod_length = parseFloat(el_rod_length_input.value) || 0; // a float number in inch
  const el_number_of_panels = el_number_of_panels_select.options[el_number_of_panels_select.selectedIndex].getAttribute("data-weight"); // single or split
  const pleat_style_value = getRadioWeight(el_pleat_style_select); // double or triple
  const base_value = pleatStyleBaseValueMap[pleat_style_value];

  if (el_rod_length == "" || !base_value) {
    el_rod_length_input.classList.add("el-highlight-error");
    el_result_order.innerHTML = "-";
    el_result_rings.innerHTML = "-";
    el_result_width.innerHTML = "-";
    throw new Error("cozy-calculator未通过校验，rod_length为必填！");
  }

  const rodLengthMeters = el_rod_length * 0.0254; // 将rod length单位inch转换成meter
  const orderValue = rodLengthMeters * el_number_of_panels;
  const orderValueToInchs = orderValue / 0.0254; // 将order value值转换回inch单位
  /**
   * orderValue换算回inch后，orderValue只会存在整数或.5的情况
   * 为了避免浏览器历史遗留的小数位的问题（0.5会变成0.5000000000000001）
   * 先将结果 * 10，然后取整数部分，再 / 10，来解决后面堆 0 的情况
   */
  const roundedOrderValueToInchs = parseInt(orderValueToInchs * 10) / 10;

  let ringsValue;
  // 根据order value值的大小计算C值，C值固定向上取整
  if (orderValue <= base_value.range[0]) {
    ringsValue = Math.ceil((orderValue * base_value.interval.lt) / 0.24);
  } else if (orderValue >= base_value.range[1]) {
    ringsValue = Math.ceil((orderValue * base_value.interval.gt) / 0.24);
  } else {
    ringsValue = Math.ceil((orderValue * base_value.interval.ltgt) / 0.24);
  }

  // const widthValueToInchs = ((ringsValue * base_value.value) / 100) * 39.3701; // C值换算回inch
  const widthRangeRet = `${Math.round(ringsValue * base_value.widthRange[0])} ~ ${Math.round(ringsValue * base_value.widthRange[1])}`;

  // 四舍五入转换成inch单位C值
  // const roundedWidthValueToInchs = Math.round(widthValueToInchs);
  console.log("roundedOrderValueToInchs:", roundedOrderValueToInchs);
  console.log("ringsValue:", ringsValue);
  console.log("widthRangeRet:", widthRangeRet);
  el_result_order.innerHTML = `≈ ${roundedOrderValueToInchs}`;
  el_result_rings.innerHTML = `≈ ${ringsValue}`;
  el_result_width.innerHTML = `≈ ${widthRangeRet}`;
}

/* 主流程 */
function main() {
  // 输入下拉框和提交按钮Doms
  const el1 = document.querySelector(".item-stacked-width input");
  const el2 = document.querySelector(".item-rod-length input");
  const el3 = document.querySelector(".number-of-panels select");
  const el4 = document.querySelector(".pleat-style .cozy-cal-radio-group");
  const el5 = document.querySelector(".cal-btn-calculate"); // 计算按钮

  // 结果展示Doms
  const el6 = document.querySelector(".cal-result-order");
  const el7 = document.querySelector(".cal-result-rings");
  const el8 = document.querySelector(".cal-result-width");

  // 添加必填校验样式
  el1.addEventListener("change", () => {
    if (el1.value != "") {
      el1.classList.remove("el-highlight-error");
    }
  });
  el2.addEventListener("change", () => {
    if (el2.value != "") {
      el2.classList.remove("el-highlight-error");
    }
  });

  updateInputFilledState(el1);
  updateInputFilledState(el2);
  updateSelectFilledState(el3);

  attachDecimalOneLimiter(el1);
  attachDecimalOneLimiter(el2);

  el1.addEventListener("input", () => {
    updateInputFilledState(el1);
  });
  el2.addEventListener("input", () => {
    updateInputFilledState(el2);
  });
  el3.addEventListener("change", () => {
    markSelectAsFilled(el3);
  });

  // Selecting the default option again does not reliably fire `change`,
  // so we mark the select as filled as soon as the user starts interacting.
  el3.addEventListener("pointerdown", () => {
    markSelectAsFilled(el3);
  });
  el3.addEventListener("keydown", () => {
    markSelectAsFilled(el3);
  });

  // 添加点击计算按钮事件
  el5.addEventListener("click", () => {
    try {
      if (currentTab === "1") {
        processOne(el1, el4, el6, el7);
      } else {
        processTwo(el2, el3, el4, el6, el7, el8);
      }
    } catch (error) {
      console.error(error);
    }
  });
}

/* 立即执行 */
(function () {
  const searchParams = parseSearchToObject();
  const tab = tabs.includes(searchParams.tab) ? searchParams.tab : "1";
  currentTab = tab;

  document.addEventListener("DOMContentLoaded", () => {
    styleSelectedSwitcher(currentTab); // 给命中的switch tab添加选中样式
    displayElement(currentTab); // 不同tab展示不同的元素
    listenTabSwitcher(); // 给switch tab绑定点击事件，事件委托模式
    // modifyWhenMobile(); // 移动端时相关操作
    main();
  });

  window.handleNavigate = function (tab) {
    setTab(String(tab), true);
  };

  window.addEventListener("popstate", () => {
    const nextSearchParams = parseSearchToObject();
    const nextTab = tabs.includes(nextSearchParams.tab) ? nextSearchParams.tab : "1";
    if (nextTab !== currentTab) {
      currentTab = nextTab;
      styleSelectedSwitcher(currentTab);
      displayElement(currentTab);
    }
  });

  document.addEventListener("beforeunload", () => {
    // TODO: 做一些清理工作
  });
})();
