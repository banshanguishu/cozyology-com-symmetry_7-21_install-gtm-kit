const tabs = ["1", "2", "3"];
let currentTab = "1";
const CM_TO_IN = 39.3701 / 100;

function parseSearchToObject() {
  const searchParams = new URLSearchParams(window.location.search);
  const result = {};
  for (const [key, value] of searchParams.entries()) {
    result[key] = value;
  }
  return result;
}

function styleSelectedSwitcher(t) {
  for (const tabItem of tabs) {
    const switcher = document.querySelector(`.switcher-${tabItem}`);
    if (switcher) {
      switcher.classList.toggle("active", t === tabItem);
    }
  }
}

function displayElement(t) {
  if (!t || !tabs.includes(t)) return;
  const stackedWidthDom = document.querySelector(".item-stacked-width");
  const rodLengthDom = document.querySelector(".item-rod-length");
  const hardwareWindowDom = document.querySelector(".item-hardware-window");
  const numberPanelsDom = document.querySelector(".number-of-panels");
  const pleatStyleDom = document.querySelector(".pleat-style");
  const hardwareStyleDom = document.querySelector(".hardware-style");
  const resultDom = document.querySelector(".cal-result");
  const hardwareResultDom = document.querySelector(".hardware-result-area");
  const resultStackedWidthDom = document.querySelector(".cal-result-stacked-width");
  const hyperPanel = document.querySelector(".cal-item-hyperlink-panel");
  const hyperStacked = document.querySelector(".cal-item-hyperlink-stacked");
  const hardwareIntro = document.querySelector(".hardware-intro");
  const rightImage = document.querySelector(".cal-right-image");
  const hardwareDiagram = document.querySelector(".hardware-diagram");

  if (stackedWidthDom) stackedWidthDom.style.display = t === "1" ? "flex" : "none";
  if (rodLengthDom) rodLengthDom.style.display = t === "2" ? "flex" : "none";
  if (hardwareWindowDom) hardwareWindowDom.style.display = t === "3" ? "flex" : "none";
  if (numberPanelsDom) numberPanelsDom.style.display = t === "2" ? "flex" : "none";
  if (pleatStyleDom) pleatStyleDom.style.display = t === "3" ? "none" : "flex";
  if (hardwareStyleDom) hardwareStyleDom.style.display = t === "3" ? "flex" : "none";
  if (resultDom) resultDom.style.display = t === "3" ? "none" : "grid";
  if (hardwareResultDom) hardwareResultDom.style.display = t === "3" ? "block" : "none";
  if (resultStackedWidthDom) resultStackedWidthDom.style.display = t === "2" ? "block" : "none";
  if (hyperPanel) hyperPanel.style.display = t === "1" ? "block" : "none";
  if (hyperStacked) hyperStacked.style.display = t === "2" ? "block" : "none";
  if (hardwareIntro) hardwareIntro.style.display = t === "3" ? "block" : "none";
  if (rightImage) rightImage.style.display = t === "3" ? "none" : "block";
  if (hardwareDiagram) hardwareDiagram.style.display = t === "3" ? "block" : "none";
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

function getRadioWeight(group) {
  if (!group) return null;
  const checked = group.querySelector('input[type="radio"]:checked') || group.querySelector('input[type="radio"]');
  return checked ? checked.getAttribute("data-weight") : null;
}

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
  const hardwareInput = document.querySelector(".item-hardware-window input");
  const hardwareStyle = document.querySelector(".hardware-style select");
  const hardwareResult = document.querySelector(".hardware-result-area");
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
  if (hardwareInput) {
    hardwareInput.classList.remove("el-highlight-error");
    hardwareInput.value = "";
  }
  if (el3) el3.selectedIndex = 0;
  if (hardwareStyle) hardwareStyle.selectedIndex = 0;
  resetRadioGroup(el4);
  if (el3) delete el3.dataset.hasBeenChanged;
  if (hardwareStyle) delete hardwareStyle.dataset.hasBeenChanged;
  updateInputFilledState(el1);
  updateInputFilledState(el2);
  updateInputFilledState(hardwareInput);
  updateSelectFilledState(el3);
  updateSelectFilledState(hardwareStyle);
  if (el6) el6.innerHTML = "-";
  if (el7) el7.innerHTML = "-";
  if (el8) el8.innerHTML = "-";
  if (hardwareResult) hardwareResult.innerHTML = '<div class="hardware-empty-state">Enter a window width above to see results</div>';
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

function listenTabSwitcher() {
  const dom = document.querySelector(".tab-switcher");
  if (dom) {
    dom.addEventListener("click", (e) => {
      const t = e.target.closest(".switcher-item");
      if (t) {
        const tabValue = t.dataset.tab;
        if (tabValue) {
          setTab(tabValue, true);
        }
      }
    });
  }
}

function processOne(el_stacked_width_input, el_pleat_style_select, el_result_order, el_result_rings) {
  const pleatStyleBaseValueMap = {
    double: {
      ringsValueRange: [0.8, 1.2],
      panelValueRange: [3.579, 5.369],
    },
    triple: {
      ringsValueRange: [1.5, 2],
      panelValueRange: [1.89, 2.52],
    },
  };
  const stacked_width_value = parseFloat(el_stacked_width_input.value) || 0;
  const pleat_style_value = getRadioWeight(el_pleat_style_select);
  const base_value = pleatStyleBaseValueMap[pleat_style_value];
  if (stacked_width_value === 0) {
    el_stacked_width_input.classList.add("el-highlight-error");
    el_result_order.innerHTML = "-";
    el_result_rings.innerHTML = "-";
    throw new Error("cozy-calculator validation failed: stacked_width is required");
  }
  const ringsRange = `${Math.round(stacked_width_value / base_value.ringsValueRange[1])} ~ ${Math.round(stacked_width_value / base_value.ringsValueRange[0])}`;
  const panelRange = `${Math.round(stacked_width_value * base_value.panelValueRange[0])} ~ ${Math.round(stacked_width_value * base_value.panelValueRange[1])}`;
  el_result_order.innerHTML = `≈ ${panelRange}`;
  el_result_rings.innerHTML = `≈ ${ringsRange}`;
}

function processTwo(el_rod_length_input, el_number_of_panels_select, el_pleat_style_select, el_result_order, el_result_rings, el_result_width) {
  const pleatStyleBaseValueMap = {
    double: {
      range: [1.5, 4],
      interval: {
        lt: 2.4,
        ltgt: 2.2,
        gt: 2,
      },
      widthRange: [0.8, 1.2],
    },
    triple: {
      range: [1, 4],
      interval: {
        lt: 2.4,
        ltgt: 2.2,
        gt: 2,
      },
      widthRange: [1.5, 2],
    },
  };
  const el_rod_length = parseFloat(el_rod_length_input.value) || 0;
  const el_number_of_panels = el_number_of_panels_select.options[el_number_of_panels_select.selectedIndex].getAttribute("data-weight");
  const pleat_style_value = getRadioWeight(el_pleat_style_select);
  const base_value = pleatStyleBaseValueMap[pleat_style_value];
  if (el_rod_length === 0 || !base_value) {
    el_rod_length_input.classList.add("el-highlight-error");
    el_result_order.innerHTML = "-";
    el_result_rings.innerHTML = "-";
    el_result_width.innerHTML = "-";
    throw new Error("cozy-calculator validation failed: rod_length is required");
  }
  const rodLengthMeters = el_rod_length * 0.0254;
  const orderValue = rodLengthMeters * el_number_of_panels;
  const orderValueToInchs = orderValue / 0.0254;
  const roundedOrderValueToInchs = parseInt(orderValueToInchs * 10, 10) / 10;
  let ringsValue;
  if (orderValue <= base_value.range[0]) {
    ringsValue = Math.ceil((orderValue * base_value.interval.lt) / 0.24);
  } else if (orderValue >= base_value.range[1]) {
    ringsValue = Math.ceil((orderValue * base_value.interval.gt) / 0.24);
  } else {
    ringsValue = Math.ceil((orderValue * base_value.interval.ltgt) / 0.24);
  }
  const widthRangeRet = `${Math.round(ringsValue * base_value.widthRange[0])} ~ ${Math.round(ringsValue * base_value.widthRange[1])}`;
  el_result_order.innerHTML = `≈ ${roundedOrderValueToInchs}`;
  el_result_rings.innerHTML = `≈ ${ringsValue}`;
  el_result_width.innerHTML = `≈ ${widthRangeRet}`;
}

function calcHardwarePleats(widthM, style) {
  if (style === "double") {
    if (widthM <= 1.5) return Math.ceil((widthM * 2.4) / 0.24);
    if (widthM < 4) return Math.ceil((widthM * 2.2) / 0.24);
    return Math.ceil((widthM * 2.0) / 0.24);
  }
  if (widthM <= 1) return Math.ceil((widthM * 3.0) / 0.24);
  if (widthM < 4) return Math.ceil((widthM * 2.8) / 0.24);
  return Math.ceil((widthM * 2.7) / 0.24);
}

function getHardwareDepthRange(style) {
  return style === "double" ? [2 * CM_TO_IN, 3 * CM_TO_IN] : [2.5 * CM_TO_IN, 3.75 * CM_TO_IN];
}

function computeHardware(windowIn, ext, style) {
  const panelIn = (windowIn + 2 * ext) / 2;
  const panelM = panelIn * 0.0254;
  const folds = calcHardwarePleats(panelM, style);
  const [dMin, dMax] = getHardwareDepthRange(style);
  return {
    panelIn,
    folds,
    stackMin: Math.ceil(folds * dMin),
    stackMax: Math.round(folds * dMax),
  };
}

function findMinHardwareExtension(windowIn, style) {
  for (let e = 0; e <= 80; e += 0.25) {
    const { stackMax } = computeHardware(windowIn, e, style);
    if (stackMax <= e) return e;
  }
  return null;
}

function fmtHardware(n, dec = 1) {
  return Number(n.toFixed(dec));
}

function processThree(el_window_width_input, el_style_select, result_area) {
  const windowIn = parseFloat(el_window_width_input.value) || 0;
  const style = el_style_select.value;
  if (windowIn <= 0) {
    el_window_width_input.classList.add("el-highlight-error");
    result_area.innerHTML = '<div class="hardware-empty-state">Enter a window width above to see results</div>';
    throw new Error("cozy-calculator validation failed: window width is required");
  }
  const minExt = findMinHardwareExtension(windowIn, style);
  if (minExt === null) {
    result_area.innerHTML = '<div class="hardware-empty-state">Window too large — please contact us</div>';
    return;
  }
  const ext = minExt + 2;
  const d = computeHardware(windowIn, ext, style);
  const hwWidth = fmtHardware(windowIn + 2 * ext);
  const panelFmt = fmtHardware(d.panelIn);
  result_area.innerHTML = `
    <div class="hardware-result-card">
      <div class="hardware-result-grid">
        <div>
          <div class="hardware-result-label">Single Panel Order Width (inches)</div>
          <div class="hardware-result-value"><span>≈</span> ${panelFmt}</div>
          <div class="hardware-result-sub">Enter this as your panel width when placing your order.</div>
        </div>
        <div>
          <div class="hardware-result-label">Hardware Width (inches)</div>
          <div class="hardware-result-value"><span>≈</span> ${hwWidth}</div>
          <div class="hardware-result-sub">Total hardware length to purchase and install.</div>
        </div>
      </div>
      <div class="hardware-note-box">Any single panel order width <strong>larger than ≈ ${panelFmt}"</strong> will also keep the window fully clear when open.</div>
    </div>
    <div class="hardware-detail-grid">
      <div>
        <div class="hardware-detail-label">Extension per Side</div>
        <div class="hardware-detail-value">≈ ${fmtHardware(ext)}"</div>
      </div>
      <div>
        <div class="hardware-detail-label">Stacked Width / Panel</div>
        <div class="hardware-detail-value">≈ ${d.stackMin} ~ ${d.stackMax}"</div>
      </div>
      <div>
        <div class="hardware-detail-label">Pleats per Panel</div>
        <div class="hardware-detail-value">≈ ${d.folds}</div>
      </div>
    </div>
  `;
}

function main() {
  const el1 = document.querySelector(".item-stacked-width input");
  const el2 = document.querySelector(".item-rod-length input");
  const el3 = document.querySelector(".number-of-panels select");
  const el4 = document.querySelector(".pleat-style .cozy-cal-radio-group");
  const el5 = document.querySelector(".cal-btn-calculate");
  const hardwareInput = document.querySelector(".item-hardware-window input");
  const hardwareStyle = document.querySelector(".hardware-style select");
  const hardwareResult = document.querySelector(".hardware-result-area");
  const el6 = document.querySelector(".cal-result-order");
  const el7 = document.querySelector(".cal-result-rings");
  const el8 = document.querySelector(".cal-result-width");

  [el1, el2, hardwareInput].forEach((input) => {
    if (!input) return;
    input.addEventListener("change", () => {
      if (input.value !== "") {
        input.classList.remove("el-highlight-error");
      }
    });
    updateInputFilledState(input);
    attachDecimalOneLimiter(input);
    input.addEventListener("input", () => {
      updateInputFilledState(input);
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        el5.click();
      }
    });
  });

  [el3, hardwareStyle].forEach((select) => {
    if (!select) return;
    updateSelectFilledState(select);
    select.addEventListener("change", () => {
      markSelectAsFilled(select);
    });
    select.addEventListener("pointerdown", () => {
      markSelectAsFilled(select);
    });
    select.addEventListener("keydown", () => {
      markSelectAsFilled(select);
    });
  });

  el5.addEventListener("click", () => {
    try {
      if (currentTab === "1") {
        processOne(el1, el4, el6, el7);
      } else if (currentTab === "2") {
        processTwo(el2, el3, el4, el6, el7, el8);
      } else {
        processThree(hardwareInput, hardwareStyle, hardwareResult);
      }
    } catch (error) {
      console.error(error);
    }
  });
}

(function () {
  const searchParams = parseSearchToObject();
  const tab = tabs.includes(searchParams.tab) ? searchParams.tab : "1";
  currentTab = tab;
  document.addEventListener("DOMContentLoaded", () => {
    styleSelectedSwitcher(currentTab);
    displayElement(currentTab);
    listenTabSwitcher();
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
      resetCalculatorView();
    }
  });
})();
