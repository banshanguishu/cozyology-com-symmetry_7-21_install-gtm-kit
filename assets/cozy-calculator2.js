document.addEventListener("DOMContentLoaded", () => {
  const select_a = document.querySelector(".cal2-item-a select");
  const input_b = document.querySelector(".cal2-item-b input");
  const input_c = document.querySelector(".cal2-item-c input");
  const select_d = document.querySelector(".cal2-item-d select");
  const select_e = document.querySelector(".cal2-item-e select");
  const btn = document.querySelector(".cal2-btn");
  const result_block = document.querySelector(".cal2-result-item-res");

  const toOneDecimal = (raw) => {
    const value = String(raw ?? "");
    if (value === "") return "";
    const cleaned = value.replace(/[^\d.]/g, "");
    const dotIndex = cleaned.indexOf(".");
    if (dotIndex === -1) return cleaned;
    const intPart = cleaned.slice(0, dotIndex);
    const fracPart = cleaned
      .slice(dotIndex + 1)
      .replace(/\./g, "")
      .slice(0, 1);
    const normalizedInt = intPart === "" ? "0" : intPart;
    return `${normalizedInt}.${fracPart}`;
  };

  const setFilledClass = (el, isFilled) => {
    if (!el) return;
    if (isFilled) el.classList.add("cal2-filled");
    else el.classList.remove("cal2-filled");
  };

  const setCursorToEnd = (input) => {
    if (!input) return;
    try {
      const end = input.value.length;
      input.setSelectionRange(end, end);
    } catch (e) {}
  };

  if (select_a) {
    select_a.addEventListener("change", () => setFilledClass(select_a, true));
  }
  if (select_d) {
    select_d.addEventListener("change", () => setFilledClass(select_d, true));
  }
  if (select_e) {
    select_e.addEventListener("change", () => setFilledClass(select_e, true));
  }

  if (input_b) {
    input_b.addEventListener("focus", () => {
      if (input_b.value === "0") {
        try {
          input_b.select();
        } catch (e) {}
      }
    });
    input_b.addEventListener("input", () => {
      const nextValue = toOneDecimal(input_b.value);
      if (nextValue !== input_b.value) input_b.value = nextValue;
      setCursorToEnd(input_b);
      setFilledClass(input_b, input_b.value !== "");
    });
  }
  if (input_c) {
    input_c.addEventListener("focus", () => {
      if (input_c.value === "0") {
        try {
          input_c.select();
        } catch (e) {}
      }
    });
    input_c.addEventListener("input", () => {
      const nextValue = toOneDecimal(input_c.value);
      if (nextValue !== input_c.value) input_c.value = nextValue;
      setCursorToEnd(input_c);
      setFilledClass(input_c, input_c.value !== "");
    });
  }

  btn.addEventListener("click", () => {
    const a_value = select_a.options[select_a.selectedIndex].getAttribute("data-weight");
    const b_value = parseFloat(input_b.value) || 0;
    const c_value = parseFloat(input_c.value) || 0;
    const d_value = select_d.options[select_d.selectedIndex].getAttribute("data-weight");
    const e_value = select_e.options[select_e.selectedIndex].getAttribute("data-weight");

    const invalid = b_value == "" || c_value == "";
    if (invalid) {
      result_block.innerHTML = "-";
    }
    if (b_value == "") {
      input_b.classList.add("el-highlight-error");
      return;
    }
    if (c_value == "") {
      input_c.classList.add("el-highlight-error");
      return;
    }
    const kg_result = parseFloat(a_value) * b_value * c_value * 0.00064516 * ((parseInt(d_value) + parseInt(e_value)) / 1000);
    // const kg_value = kg_result.toFixed(2);
    // const lbs_value = (kg_result * 2.204).toFixed(2);
    // result_block.innerHTML = `≈ ${lbs_value}lbs (${kg_value}kg)`

    const lbs_value = Math.ceil(kg_result * 2.204);
    result_block.innerHTML = `≈ ${lbs_value}lbs`;
  });

  input_b.addEventListener("change", () => {
    if (input_b.value != "") {
      input_b.classList.remove("el-highlight-error");
    }
  });

  input_c.addEventListener("change", () => {
    if (input_c.value != "") {
      input_c.classList.remove("el-highlight-error");
    }
  });
});
