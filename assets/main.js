function initLazyScript(element, callback, threshold = 500) {
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (typeof callback === "function") {
              callback();
              observer.unobserve(entry.target);
            }
          }
        });
      },
      { rootMargin: `0px 0px ${threshold}px 0px` }
    );
    io.observe(element);
  } else {
    callback();
  }
}
theme.stickyHeaderHeight = () => {
  const v = getComputedStyle(document.documentElement).getPropertyValue(
    "--theme-sticky-header-height"
  );
  if (v) {
    return parseInt(v, 10) || 0;
  }
  return 0;
};
theme.getOffsetTopFromDoc = (el) =>
  el.getBoundingClientRect().top + window.scrollY;
theme.getOffsetLeftFromDoc = (el) =>
  el.getBoundingClientRect().left + window.scrollX;
theme.getScrollParent = (node) => {
  const isElement = node instanceof HTMLElement;
  const overflowY = isElement && window.getComputedStyle(node).overflowY;
  const isScrollable = overflowY !== "visible" && overflowY !== "hidden";
  if (!node) {
    return null;
  }
  if (isScrollable && node.scrollHeight > node.clientHeight) {
    return node;
  }
  return (
    theme.getScrollParent(node.parentNode) ||
    document.scrollingElement ||
    window
  );
};
theme.scrollToRevealElement = (el) => {
  const scrollContainer = theme.getScrollParent(el);
  const scrollTop =
    scrollContainer === window ? window.scrollY : scrollContainer.scrollTop;
  const scrollVisibleHeight =
    scrollContainer === window
      ? window.innerHeight
      : scrollContainer.clientHeight;
  const elTop = theme.getOffsetTopFromDoc(el);
  const elBot = elTop + el.offsetHeight;
  const inViewTop = scrollTop + theme.stickyHeaderHeight();
  const inViewBot = scrollTop + scrollVisibleHeight - 50;
  if (elTop < inViewTop || elBot > inViewBot) {
    scrollContainer.scrollTo({
      top: elTop - 100 - theme.stickyHeaderHeight(),
      left: 0,
      behavior: "smooth",
    });
  }
};
theme.getEmptyOptionSelectors = (formContainer) => {
  const emptySections = [];
  formContainer
    .querySelectorAll('[data-selector-type="dropdown"].option-selector')
    .forEach((el) => {
      if (
        !el.querySelector(
          '[aria-selected="true"][data-value]:not([data-value=""])'
        )
      ) {
        emptySections.push(el);
      }
    });
  formContainer
    .querySelectorAll('[data-selector-type="listed"].option-selector')
    .forEach((el) => {
      if (!el.querySelector("input:checked")) {
        emptySections.push(el);
      }
    });
  return emptySections;
};
theme.suffixIds = (container, prefix) => {
  const suffixCandidates = ["id", "for", "aria-describedby", "aria-controls"];
  for (let i = 0; i < suffixCandidates.length; i += 1) {
    container
      .querySelectorAll(`[${suffixCandidates[i]}]`)
      .forEach((el) =>
        el.setAttribute(
          suffixCandidates[i],
          el.getAttribute(suffixCandidates[i]) + prefix
        )
      );
  }
};
theme.addDelegateEventListener = (
  element,
  eventName,
  selector,
  callback,
  addEventListenerParams = null
) => {
  const cb = (evt) => {
    const el = evt.target.closest(selector);
    if (!el) return;
    if (!element.contains(el)) return;
    callback.call(el, evt, el);
  };
  element.addEventListener(eventName, cb, addEventListenerParams);
  return cb;
};
theme.hideAndRemove = (el) => {
  el.querySelectorAll("input").forEach((input) => {
    input.disabled = !0;
  });
  const wrapper = document.createElement("div");
  wrapper.className = "merge-remove-wrapper";
  el.parentNode.insertBefore(wrapper, el);
  wrapper.appendChild(el);
  el.classList.add("merge-remove-item");
  wrapper.style.height = `${wrapper.clientHeight}px`;
  const cs = getComputedStyle(el);
  const fadeDuration =
    parseFloat(cs.getPropertyValue("--fade-duration")) * 1000;
  const slideDuration =
    parseFloat(cs.getPropertyValue("--slide-duration")) * 1000;
  setTimeout(() => {
    wrapper.classList.add("merge-remove-wrapper--fade");
    setTimeout(() => {
      wrapper.classList.add("merge-remove-wrapper--slide");
      setTimeout(() => wrapper.remove(), slideDuration);
    }, fadeDuration);
  }, 10);
};
theme.insertAndReveal = (el, target, iaeCmd, delay) => {
  const initialDelay = delay || 10;
  el.classList.add("merge-add-wrapper");
  target.insertAdjacentElement(iaeCmd, el);
  el.style.height = `${el.firstElementChild.clientHeight}px`;
  const cs = getComputedStyle(el);
  const fadeDuration =
    parseFloat(cs.getPropertyValue("--fade-duration")) * 1000;
  const slideDuration =
    parseFloat(cs.getPropertyValue("--slide-duration")) * 1000;
  setTimeout(() => {
    el.classList.add("merge-add-wrapper--slide");
    setTimeout(() => {
      el.classList.add("merge-add-wrapper--fade");
      setTimeout(() => {
        el.style.height = "";
        el.classList.remove(
          "merge-add-wrapper",
          "merge-add-wrapper--slide",
          "merge-add-wrapper--fade"
        );
      }, fadeDuration);
    }, slideDuration);
  }, initialDelay);
};
theme.mergeNodes = (newContent, targetContainer) => {
  try {
    newContent.querySelectorAll("[data-merge]").forEach((newEl) => {
      const targetEl = targetContainer.querySelector(
        `[data-merge="${newEl.dataset.merge}"]`
      );
      if (
        !newEl.dataset.mergeCache ||
        !targetEl.dataset.mergeCache ||
        newEl.dataset.mergeCache !== targetEl.dataset.mergeCache
      ) {
        targetEl.innerHTML = newEl.innerHTML;
        if (newEl.dataset.mergeCache || targetEl.dataset.mergeCache) {
          targetEl.dataset.mergeCache = newEl.dataset.mergeCache;
        }
      }
    });
    newContent.querySelectorAll("[data-merge-attributes]").forEach((newEl) => {
      const targetEl = targetContainer.querySelector(
        `[data-merge-attributes="${newEl.dataset.mergeAttributes}"]`
      );
      const newElAttributeNames = newEl.getAttributeNames();
      for (let i = 0; i < newElAttributeNames.length; i += 1) {
        const attributeName = newElAttributeNames[i];
        targetEl.setAttribute(attributeName, newEl.getAttribute(attributeName));
      }
    });
    newContent.querySelectorAll("[data-merge-list]").forEach((newList) => {
      const targetList = targetContainer.querySelector(
        `[data-merge-list="${newList.dataset.mergeList}"]`
      );
      let targetListItems = Array.from(
        targetList.querySelectorAll("[data-merge-list-item]")
      );
      const newListItems = Array.from(
        newList.querySelectorAll("[data-merge-list-item]")
      );
      targetListItems.forEach((targetListItem) => {
        const matchedItem = newListItems.find(
          (item) =>
            item.dataset.mergeListItem === targetListItem.dataset.mergeListItem
        );
        if (!matchedItem) {
          theme.hideAndRemove(targetListItem);
        }
      });
      targetListItems = Array.from(
        targetList.querySelectorAll(
          "[data-merge-list-item]:not(.merge-remove-item)"
        )
      );
      for (let i = 0; i < newListItems.length; i += 1) {
        const newListItem = newListItems[i];
        const matchedItem = targetListItems.find(
          (item) =>
            item.dataset.mergeListItem === newListItem.dataset.mergeListItem
        );
        if (matchedItem) {
          if (
            !newListItem.dataset.mergeCache ||
            !matchedItem.dataset.mergeCache ||
            newListItem.dataset.mergeCache !== matchedItem.dataset.mergeCache
          ) {
            matchedItem.innerHTML = newListItem.innerHTML;
            if (newListItem.dataset.mergeCache) {
              matchedItem.dataset.mergeCache = newListItem.dataset.mergeCache;
            }
          }
        } else {
          if (i === 0) {
            theme.insertAndReveal(newListItem, targetList, "afterbegin", 500);
          } else if (i >= targetListItems.length) {
            theme.insertAndReveal(newListItem, targetList, "beforeend", 500);
          } else {
            theme.insertAndReveal(
              newListItem,
              targetListItems[i],
              "beforebegin",
              500
            );
          }
          targetListItems.splice(i, 0, newListItem);
        }
      }
    });
  } catch (ex) {
    window.location.reload();
  }
};
theme.showQuickPopup = (message, origin) => {
  const offsetLeft = theme.getOffsetLeftFromDoc(origin);
  const offsetTop = theme.getOffsetTopFromDoc(origin);
  const originLeft = origin.getBoundingClientRect().left;
  const popup = document.createElement("div");
  popup.className = "simple-popup simple-popup--hidden";
  popup.innerHTML = message;
  popup.style.left = `${offsetLeft}px`;
  popup.style.top = `${offsetTop}px`;
  document.body.appendChild(popup);
  let marginLeft = -(popup.clientWidth - origin.clientWidth) / 2;
  if (originLeft + marginLeft < 0) {
    marginLeft -= originLeft + marginLeft - 2;
  }
  const offsetRight = offsetLeft + marginLeft + popup.clientWidth + 5;
  if (offsetRight > window.innerWidth) {
    marginLeft -= offsetRight - window.innerWidth;
  }
  popup.style.marginTop = -popup.clientHeight - 10;
  popup.style.marginLeft = marginLeft;
  setTimeout(() => {
    popup.classList.remove("simple-popup--hidden");
  }, 10);
  setTimeout(() => {
    popup.classList.add("simple-popup--hidden");
  }, 3500);
  setTimeout(() => {
    popup.remove();
  }, 4000);
};
theme.manuallyLoadImages = (container) => {
  container.querySelectorAll("img[data-manual-src]").forEach((el) => {
    el.src = el.dataset.manualSrc;
    el.removeAttribute("data-manual-src");
    if (el.dataset.manualSrcset) {
      el.srcset = el.dataset.manualSrcset;
      el.removeAttribute("data-manual-srcset");
    }
  });
};
theme.whenComponentLoaded = (component, callback) => {
  const components =
    Symbol.iterator in Object(component) ? [...component] : [component];
  if (!components.find((c) => !c.hasAttribute("loaded"))) {
    callback();
    return;
  }
  const onMutation = (mutationList, observer) => {
    for (let i = 0; i < mutationList.length; i += 1) {
      const mutation = mutationList[i];
      if (mutation.type === "attributes") {
        if (!components.find((c) => !c.hasAttribute("loaded"))) {
          observer.disconnect();
          callback.call();
        }
      }
    }
  };
  const observer = new MutationObserver(onMutation);
  components.forEach((c) =>
    observer.observe(c, { attributes: !0, attributeFilter: ["loaded"] })
  );
};
function debounce(fn, wait = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}
window.addEventListener(
  "resize",
  debounce(() => {
    window.dispatchEvent(new CustomEvent("on:debounced-resize"));
  })
);
(() => {
  const { mediaQueries } = theme;
  if (!mediaQueries) return;
  const mqKeys = Object.keys(mediaQueries);
  const mqLists = {};
  theme.mediaMatches = {};
  const handleMqChange = () => {
    const newMatches = mqKeys.reduce((acc, media) => {
      acc[media] = !!(mqLists[media] && mqLists[media].matches);
      return acc;
    }, {});
    Object.keys(newMatches).forEach((key) => {
      theme.mediaMatches[key] = newMatches[key];
    });
    window.dispatchEvent(new CustomEvent("on:breakpoint-change"));
  };
  mqKeys.forEach((mq) => {
    mqLists[mq] = window.matchMedia(mediaQueries[mq]);
    theme.mediaMatches[mq] = mqLists[mq].matches;
    try {
      mqLists[mq].addEventListener("change", handleMqChange);
    } catch (err1) {
      mqLists[mq].addListener(handleMqChange);
    }
  });
})();
function setViewportHeight() {
  document.documentElement.style.setProperty(
    "--viewport-height",
    `${window.innerHeight}px`
  );
}
function setHeaderHeight() {
  const header = document.getElementById("shopify-section-header");
  if (!header) return;
  let height = header.offsetHeight;
  const announcement = document.getElementById("shopify-section-announcement");
  if (announcement) height += announcement.offsetHeight;
  document.documentElement.style.setProperty("--header-height", `${height}px`);
}
function setScrollbarWidth() {
  document.documentElement.style.setProperty(
    "--scrollbar-width",
    `${window.innerWidth - document.documentElement.clientWidth}px`
  );
}
function setDimensionVariables() {
  setViewportHeight();
  setHeaderHeight();
  setScrollbarWidth();
}
document.addEventListener("DOMContentLoaded", setDimensionVariables);
window.addEventListener("resize", debounce(setDimensionVariables, 400));
setTimeout(setViewportHeight, 3000);
function pauseAllMedia(el = document) {
  el.querySelectorAll(".js-youtube, .js-vimeo, video").forEach((video) => {
    const component = video.closest("video-component");
    if (component && component.dataset.background === "true") return;
    if (video.matches(".js-youtube")) {
      video.contentWindow.postMessage(
        '{ "event": "command", "func": "pauseVideo", "args": "" }',
        "*"
      );
    } else if (video.matches(".js-vimeo")) {
      video.contentWindow.postMessage('{ "method": "pause" }', "*");
    } else {
      video.pause();
    }
  });
  el.querySelectorAll("product-model").forEach((model) => {
    if (model.modelViewerUI) model.modelViewerUI.pause();
  });
}
class DeferredMedia extends HTMLElement {
  constructor() {
    super();
    const loadBtn = this.querySelector(".js-load-media");
    if (loadBtn) {
      loadBtn.addEventListener("click", this.loadContent.bind(this));
    } else {
      this.addObserver();
    }
  }
  addObserver() {
    if ("IntersectionObserver" in window === !1) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.loadContent(!1, !1, "observer");
            observer.unobserve(this);
          }
        });
      },
      { rootMargin: "0px 0px 1000px 0px" }
    );
    observer.observe(this);
  }
  loadContent(focus = !0, pause = !0, loadTrigger = "click") {
    if (pause) pauseAllMedia();
    if (this.getAttribute("loaded") !== null) return;
    this.loadTrigger = loadTrigger;
    const content = this.querySelector(
      "template"
    ).content.firstElementChild.cloneNode(!0);
    this.appendChild(content);
    this.setAttribute("loaded", "");
    const deferredEl = this.querySelector("video, model-viewer, iframe");
    if (deferredEl && focus) deferredEl.focus();
  }
}
customElements.define("deferred-media", DeferredMedia);
class DetailsDisclosure extends HTMLElement {
  constructor() {
    super();
    this.disclosure = this.querySelector("details");
    this.toggle = this.querySelector("summary");
    this.panel = this.toggle.nextElementSibling;
    this.init();
  }
  init() {
    if (window.getComputedStyle(this.panel).transitionDuration !== "0s") {
      this.toggle.addEventListener("click", this.handleToggle.bind(this));
      this.disclosure.addEventListener(
        "transitionend",
        this.handleTransitionEnd.bind(this)
      );
    }
  }
  handleToggle(evt) {
    evt.preventDefault();
    if (!this.disclosure.open) {
      this.open();
    } else {
      this.close();
    }
  }
  handleTransitionEnd(evt) {
    if (evt.target !== this.panel) return;
    if (this.disclosure.classList.contains("is-closing")) {
      this.disclosure.classList.remove("is-closing");
      this.disclosure.open = !1;
    }
    this.panel.removeAttribute("style");
  }
  addContentHeight() {
    this.panel.style.height = `${this.panel.scrollHeight}px`;
  }
  open() {
    this.panel.style.height = "0";
    this.disclosure.open = !0;
    this.addContentHeight();
  }
  close() {
    this.addContentHeight();
    this.disclosure.classList.add("is-closing");
    setTimeout(() => {
      this.panel.style.height = "0";
    });
  }
}
customElements.define("details-disclosure", DetailsDisclosure);
if (!customElements.get("gift-card-recipient")) {
  class GiftCardRecipient extends HTMLElement {
    connectedCallback() {
      this.recipientEmail = this.querySelector(
        '[name="properties[Recipient email]"]'
      );
      this.recipientEmailLabel = this.querySelector(
        `label[for="${this.recipientEmail.id}"]`
      );
      this.recipientName = this.querySelector(
        '[name="properties[Recipient name]"]'
      );
      this.recipientMessage = this.querySelector(
        '[name="properties[Message]"]'
      );
      this.recipientSendOn = this.querySelector('[name="properties[Send on]"]');
      this.recipientOffsetProperty = this.querySelector(
        '[name="properties[__shopify_offset]"]'
      );
      if (
        this.recipientEmailLabel &&
        this.recipientEmailLabel.dataset.jsLabel
      ) {
        this.recipientEmailLabel.innerText =
          this.recipientEmailLabel.dataset.jsLabel;
      }
      if (this.recipientOffsetProperty) {
        this.recipientOffsetProperty.value = new Date()
          .getTimezoneOffset()
          .toString();
        this.recipientOffsetProperty.removeAttribute("disabled");
      }
      this.recipientCheckbox = this.querySelector(
        ".gift-card-recipient__checkbox"
      );
      this.recipientCheckbox.addEventListener("change", () =>
        this.synchronizeProperties()
      );
      this.synchronizeProperties();
    }
    synchronizeProperties() {
      if (this.recipientCheckbox.checked) {
        this.recipientEmail.setAttribute("required", "");
        this.recipientEmail.removeAttribute("disabled");
        this.recipientName.removeAttribute("disabled");
        this.recipientMessage.removeAttribute("disabled");
        this.recipientSendOn.removeAttribute("disabled");
        if (this.recipientOffsetProperty) {
          this.recipientOffsetProperty.removeAttribute("disabled");
        }
      } else {
        this.recipientEmail.removeAttribute("required");
        this.recipientEmail.setAttribute("disabled", "");
        this.recipientName.setAttribute("disabled", "");
        this.recipientMessage.setAttribute("disabled", "");
        this.recipientSendOn.setAttribute("disabled", "");
        if (this.recipientOffsetProperty) {
          this.recipientOffsetProperty.setAttribute("disabled", "");
        }
      }
    }
  }
  customElements.define("gift-card-recipient", GiftCardRecipient);
}
const trapFocusHandlers = {};
function removeTrapFocus(elementToFocus = null) {
  document.removeEventListener("focusin", trapFocusHandlers.focusin);
  document.removeEventListener("focusout", trapFocusHandlers.focusout);
  document.removeEventListener("keydown", trapFocusHandlers.keydown);
  if (elementToFocus) elementToFocus.focus();
}
function trapFocus(container, elementToFocus = container) {
  const focusableEls = Array.from(
    container.querySelectorAll(
      'summary, a[href], area[href], button:not([disabled]), input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled]), object, iframe, audio[controls], video[controls], [tabindex]:not([tabindex^="-"])'
    )
  );
  const firstEl = focusableEls[0];
  const lastEl = focusableEls[focusableEls.length - 1];
  removeTrapFocus();
  trapFocusHandlers.focusin = (evt) => {
    if (
      evt.target !== container &&
      evt.target !== lastEl &&
      evt.target !== firstEl
    )
      return;
    document.addEventListener("keydown", trapFocusHandlers.keydown);
  };
  trapFocusHandlers.focusout = () => {
    document.removeEventListener("keydown", trapFocusHandlers.keydown);
  };
  trapFocusHandlers.keydown = (evt) => {
    if (evt.code !== "Tab") return;
    if (evt.target === lastEl && !evt.shiftKey) {
      evt.preventDefault();
      firstEl.focus();
    }
    if ((evt.target === container || evt.target === firstEl) && evt.shiftKey) {
      evt.preventDefault();
      lastEl.focus();
    }
  };
  document.addEventListener("focusout", trapFocusHandlers.focusout);
  document.addEventListener("focusin", trapFocusHandlers.focusin);
  (elementToFocus || container).focus();
}
class Modal extends HTMLElement {
  constructor() {
    super();
    this.addEventListener("click", this.handleClick.bind(this));
  }
  handleClick(evt) {
    if (evt.target !== this && !evt.target.matches(".js-close-modal")) return;
    this.close();
  }
  open(opener) {
    this.scrollY = window.scrollY;
    document.body.classList.add("fixed");
    document.body.style.top = `-${this.scrollY}px`;
    this.setAttribute("open", "");
    this.openedBy = opener;
    trapFocus(this);
    window.pauseAllMedia();
    this.keyupHandler = (evt) => evt.key === "Escape" && this.close();
    this.addEventListener("keyup", this.keyupHandler);
    this.querySelectorAll("table").forEach((table) => {
      const wrapper = document.createElement("div");
      wrapper.className = "scrollable-table";
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });
  }
  close() {
    document.body.style.top = "";
    document.body.classList.remove("fixed");
    window.scrollTo(0, this.scrollY);
    this.removeAttribute("open");
    removeTrapFocus(this.openedBy);
    window.pauseAllMedia();
    this.removeEventListener("keyup", this.keyupHandler);
  }
}
customElements.define("modal-dialog", Modal);
class ModalOpener extends HTMLElement {
  constructor() {
    super();
    const button = this.querySelector("button");
    if (!button) return;
    button.addEventListener("click", () => {
      const modal = document.getElementById(this.dataset.modal);
      if (modal) modal.open(button);
    });
  }
}
customElements.define("modal-opener", ModalOpener);
class SideDrawer extends HTMLElement {
  constructor() {
    super();
    this.overlay = document.querySelector(".js-overlay");
  }
  handleClick(evt) {
    if (evt.target.matches(".js-close-drawer") || evt.target === this.overlay) {
      this.close();
    }
  }
  open(opener, elementToFocus, callback) {
    this.dispatchEvent(
      new CustomEvent(`on:${this.dataset.name}:before-open`, { bubbles: !0 })
    );
    this.scrollY = window.scrollY;
    document.documentElement.classList.add('lock');
    // document.body.classList.add("fixed");
    // document.body.style.top = `-${this.scrollY}px`;
    document.documentElement.style.height = "100vh";
    this.overlay.classList.add("is-visible");
    this.setAttribute("open", "");
    this.setAttribute("aria-hidden", "false");
    this.opener = opener;
    trapFocus(this, elementToFocus);
    this.clickHandler = this.clickHandler || this.handleClick.bind(this);
    this.keyupHandler = (evt) => {
      if (evt.key !== "Escape" || evt.target.closest(".cart-drawer-popup"))
        return;
      this.close();
    };
    this.addEventListener("click", this.clickHandler);
    this.addEventListener("keyup", this.keyupHandler);
    this.overlay.addEventListener("click", this.clickHandler);
    const transitionDuration = parseFloat(
      getComputedStyle(this).getPropertyValue("--longest-transition-in-ms")
    );
    setTimeout(() => {
      if (callback) callback();
      this.dispatchEvent(
        new CustomEvent(`on:${this.dataset.name}:after-open`, { bubbles: !0 })
      );
    }, transitionDuration);
  }
  close(callback) {
    this.dispatchEvent(
      new CustomEvent(`on:${this.dataset.name}:before-close`, { bubbles: !0 })
    );
    this.removeAttribute("open");
    this.setAttribute("aria-hidden", "true");
    this.overlay.classList.remove("is-visible");
    removeTrapFocus(this.opener);

    document.documentElement.style.height = "";
    document.body.style.top = "";
    document.body.classList.remove("fixed");
    // window.scrollTo(0, this.scrollY);
    document.documentElement.classList.remove('lock');
    
    this.removeEventListener("click", this.clickHandler);
    this.removeEventListener("keyup", this.keyupHandler);
    this.overlay.removeEventListener("click", this.clickHandler);
    const transitionDuration = parseFloat(
      getComputedStyle(this).getPropertyValue("--longest-transition-in-ms")
    );
    setTimeout(() => {
      if (callback) callback();
      this.dispatchEvent(
        new CustomEvent(`on:${this.dataset.name}:after-close`, { bubbles: !0 })
      );
    }, transitionDuration);
  }
}
customElements.define("side-drawer", SideDrawer);
class BuyButtons extends HTMLElement {
  constructor() {
    super();
    window.initLazyScript(this, this.initLazySection.bind(this));
  }
  initLazySection() {
    this.dynamicPaymentButtonTemplate = this.querySelector(
      ".dynamic-payment-button-template"
    );
    if (this.dynamicPaymentButtonTemplate) {
      this.variantIdInput = this.querySelector('[name="id"]');
      if (this.variantIdInput.value) {
        this.tryInitDynamicPaymentButton();
      } else {
        this.boundTryInitDynamicPaymentButtonOnChange =
          this.tryInitDynamicPaymentButton.bind(this);
        this.variantIdInput.addEventListener(
          "change",
          this.boundTryInitDynamicPaymentButtonOnChange
        );
      }
    }
  }
  tryInitDynamicPaymentButton() {
    if (this.variantIdInput.value) {
      if (this.boundTryInitDynamicPaymentButtonOnChange) {
        this.variantIdInput.removeEventListener(
          "change",
          this.boundTryInitDynamicPaymentButtonOnChange
        );
      }
      this.dynamicPaymentButtonTemplate.insertAdjacentHTML(
        "afterend",
        this.dynamicPaymentButtonTemplate.innerHTML
      );
      this.dynamicPaymentButtonTemplate.remove();
      if (Shopify.PaymentButton) {
        Shopify.PaymentButton.init();
      }
    }
  }
}
customElements.define("buy-buttons", BuyButtons);
const CartForm = class extends HTMLElement {
  connectedCallback() {
    this.enableAjaxUpdate = this.dataset.ajaxUpdate;
    if (this.enableAjaxUpdate) {
      this.sectionId = this.dataset.sectionId;
      this.boundRefresh = this.refresh.bind(this);
      document.addEventListener("on:cart:change", this.boundRefresh);
      theme.addDelegateEventListener(
        this,
        "click",
        ".cart-item__remove",
        (evt) => {
          evt.preventDefault();
          this.adjustItemQuantity(evt.target.closest(".cart-item"), { to: 0 });
        }
      );
      theme.addDelegateEventListener(this, "click", ".quantity-down", (evt) => {
        evt.preventDefault();
        this.adjustItemQuantity(evt.target.closest(".cart-item"), {
          decrease: !0,
        });
      });
      theme.addDelegateEventListener(this, "click", ".quantity-up", (evt) => {
        evt.preventDefault();
        this.adjustItemQuantity(evt.target.closest(".cart-item"), {
          increase: !0,
        });
      });
      theme.addDelegateEventListener(
        this,
        "change",
        ".cart-item__quantity-input",
        (evt) => {
          this.adjustItemQuantity(evt.target.closest(".cart-item"), {
            currentValue: !0,
          });
        }
      );
    }
  }
  disconnectedCallback() {
    if (this.enableAjaxUpdate) {
      document.removeEventListener("on:cart:change", this.boundRefresh);
    }
  }
  refresh() {
    this.classList.add("cart-form--refreshing");
    fetch(`${window.Shopify.routes.root}?section_id=${this.sectionId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.text();
      })
      .then((response) => {
        this.refreshFromHtml(response);
      });
  }
  refreshFromHtml(html) {
    const frag = document.createDocumentFragment();
    const newContent = document.createElement("div");
    frag.appendChild(newContent);
    newContent.innerHTML = html;
    newContent
      .querySelectorAll("[data-cc-animate]")
      .forEach((el) => el.removeAttribute("data-cc-animate"));
    theme.mergeNodes(newContent, this);
    this.classList.remove("cart-form--refreshing");
    this.querySelectorAll(".merge-item-refreshing").forEach((el) =>
      el.classList.remove("merge-item-refreshing")
    );
    this.dispatchEvent(
      new CustomEvent("on:cart:after-merge", { bubbles: !0, cancelable: !1 })
    );
    if (
      theme.settings.afterAddToCart === "drawer" &&
      this.closest(".drawer") &&
      !this.closest(".drawer").hasAttribute("open")
    ) {
      document.dispatchEvent(
        new CustomEvent("theme:open-cart-drawer", {
          bubbles: !0,
          cancelable: !1,
        })
      );
    }
  }
  adjustItemQuantity(item, change) {
    const quantityInput = item.querySelector(".cart-item__quantity-input");
    let newQuantity = parseInt(quantityInput.value, 10);
    if (typeof change.to !== "undefined") {
      newQuantity = change.to;
      quantityInput.value = newQuantity;
    } else if (change.increase) {
      newQuantity += quantityInput.step || 1;
      quantityInput.value = newQuantity;
    } else if (change.decrease) {
      newQuantity -= quantityInput.step || 1;
      quantityInput.value = newQuantity;
    } else if (change.currentValue);
    if (
      quantityInput.max &&
      parseInt(quantityInput.value, 10) > parseInt(quantityInput.max, 10)
    ) {
      newQuantity = quantityInput.max;
      quantityInput.value = newQuantity;
      theme.showQuickPopup(
        theme.strings.cartItemsQuantityError.replace(
          "[QUANTITY]",
          quantityInput.max
        ),
        quantityInput
      );
    }
    clearTimeout(this.adjustItemQuantityTimeout);
    this.adjustItemQuantityTimeout = setTimeout(
      () => {
        const updateParam = { updates: {} };
        this.querySelectorAll(
          ".cart-item__quantity-input:not([disabled])"
        ).forEach((el) => {
          updateParam.updates[el.dataset.key] = el.value;
          if (el.value !== el.dataset.initialValue) {
            el.closest("[data-merge-list-item]").classList.add(
              "merge-item-refreshing"
            );
          }
        });
        fetch(theme.routes.cartUpdate, {
          method: "POST",
          body: JSON.stringify(updateParam),
          headers: { "Content-Type": "application/json" },
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
            document.dispatchEvent(
              new CustomEvent("on:cart:change", { bubbles: !0, cancelable: !1 })
            );
          })
          .catch((error) => {
            console.log(error.message);
            this.dispatchEvent(
              new CustomEvent("on:cart:error", {
                bubbles: !0,
                detail: { error: error.message },
              })
            );
            window.location.reload();
          });
      },
      newQuantity === 0 ? 10 : 700
    );
  }
};
window.customElements.define("cart-form", CartForm);
const CCCartCrossSell = class extends HTMLElement {
  init() {
    this.productList = this.querySelector(".product-grid");
    if (this.dataset.from) {
      fetch(this.dataset.from)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.text();
        })
        .then((response) => {
          const frag = document.createDocumentFragment();
          const newContent = document.createElement("div");
          frag.appendChild(newContent);
          newContent.innerHTML = response;
          const pl = newContent.querySelector(".product-grid");
          if (pl) {
            this.productList.innerHTML = pl.innerHTML;
            this.querySelectorAll(".product-block").forEach((el) =>
              el.classList.add("slider__item")
            );
            this.querySelectorAll("carousel-slider").forEach((el) =>
              el.refresh()
            );
          } else {
            this.classList.add("hidden");
          }
        });
    }
  }
};
window.customElements.define("cc-cart-cross-sell", CCCartCrossSell);
const CCFetchedContent = class extends HTMLElement {
  connectedCallback() {
    fetch(this.dataset.url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.text();
      })
      .then((response) => {
        const frag = document.createDocumentFragment();
        const fetchedContent = document.createElement("div");
        frag.appendChild(fetchedContent);
        fetchedContent.innerHTML = response;
        const replacementContent = fetchedContent.querySelector(
          `[data-id="${this.dataset.id}"]`
        );
        if (replacementContent) {
          this.innerHTML = replacementContent.innerHTML;
        }
      });
  }
};
window.customElements.define("cc-fetched-content", CCFetchedContent);
function throttle(fn, wait = 300) {
  let throttleTimeoutId = -1;
  let tick = !1;
  return () => {
    clearTimeout(throttleTimeoutId);
    throttleTimeoutId = setTimeout(fn, wait);
    if (!tick) {
      fn.call();
      tick = !0;
      setTimeout(() => {
        tick = !1;
      }, wait);
    }
  };
}
const FilterContainer = class extends HTMLElement {
  constructor() {
    super();
    this.section = this.closest(".shopify-section");
    this.filters = this.querySelector(".filters");
    const utilityBar = document.querySelector(".utility-bar");
    if (utilityBar) {
      this.utilBarClone = utilityBar.cloneNode(!0);
      this.utilBarClone.classList.add("utility-bar--sticky-mobile-copy");
      this.utilBarClone.removeAttribute("data-ajax-container");
      utilityBar.insertAdjacentElement("afterend", this.utilBarClone);
      theme.suffixIds(this.utilBarClone, "dupe");
      this.previousScrollTop = window.scrollY;
      this.throttledCheckStickyScroll = throttle(
        this.checkStickyScroll.bind(this),
        200
      );
    }
    if (this.filters) {
      this.allowAutoApplyHideUnavailable =
        this.filters.dataset.autoApplyHideUnavailable === "true";
      if (this.allowAutoApplyHideUnavailable) {
        theme.addDelegateEventListener(
          this,
          "change",
          ".filter-group__checkbox, .cc-price-range__input",
          (evt, delEl) => {
            if (this.allowAutoApplyHideUnavailable) {
              if (
                (delEl.type === "checkbox" && delEl.checked) ||
                (delEl.type === "text" && delEl.value)
              ) {
                const toEnable = this.filters.querySelector(
                  '[name="filter.v.availability"][value="1"]'
                );
                if (toEnable) {
                  toEnable.checked = !0;
                  toEnable.dispatchEvent(
                    new CustomEvent("change", { bubbles: !0, cancelable: !1 })
                  );
                }
              }
            }
          }
        );
        theme.addDelegateEventListener(
          this,
          "change",
          ".filter-group--availability .filter-toggle__input",
          (evt, delEl) => {
            if (delEl.checked && delEl.value === "1") {
              this.allowAutoApplyHideUnavailable = !1;
            }
          }
        );
      }
      if (this.dataset.ajaxFiltering === "true") {
        const debouncedAjaxLoadForm = debounce(
          this.ajaxLoadForm.bind(this),
          700
        );
        theme.addDelegateEventListener(
          this,
          "change",
          "#CollectionFilterForm",
          debouncedAjaxLoadForm
        );
        theme.addDelegateEventListener(
          this,
          "submit",
          "#CollectionFilterForm",
          debouncedAjaxLoadForm
        );
      } else {
        theme.addDelegateEventListener(
          this,
          "change",
          "#CollectionFilterForm",
          (_evt, delEl) => delEl.submit()
        );
      }
      this.initFiltersEtc();
    }
    if (this.dataset.ajaxFiltering === "true") {
      theme.addDelegateEventListener(
        this.section,
        "click",
        ".link-dropdown__link, .filter-group__applied-item, .filter-group__clear-link, .pagination a",
        (evt, delEl) => {
          evt.preventDefault();
          this.ajaxLoadUrl(delEl.href);
        }
      );
    }
  }
  connectedCallback() {
    if (this.throttledCheckStickyScroll) {
      window.addEventListener("scroll", this.throttledCheckStickyScroll);
    }
    if (this.dataset.ajaxFiltering === "true") {
      this.boundAjaxPopState = this.ajaxPopState.bind(this);
      window.addEventListener("popstate", this.boundAjaxPopState);
    }
    if (this.section.querySelector(".layout-switchers")) {
      this.boundSwitchGridLayout = theme.addDelegateEventListener(
        this.section,
        "click",
        ".layout-switch",
        this.switchGridLayout.bind(this)
      );
    }
    this.delegatedToggleFiltersCallback = theme.addDelegateEventListener(
      this.section,
      "click",
      "[data-toggle-filters]",
      (evt) => {
        evt.preventDefault();
        this.classList.toggle("filter-container--show-filters-desktop");
        this.classList.toggle("filter-container--show-filters-mobile");
        const isNowVisible = this.classList.contains(
          "filter-container--show-filters-desktop"
        );
        this.section
          .querySelectorAll(".toggle-btn[data-toggle-filters]")
          .forEach((el) => {
            el.classList.toggle("toggle-btn--revealed-desktop", isNowVisible);
          });
      }
    );
  }
  disconnectedCallback() {
    if (this.boundCheckStickyScroll) {
      window.removeEventListener("scroll", this.throttledCheckStickyScroll);
    }
    if (this.boundAjaxPopState) {
      window.removeEventListener("popstate", this.boundAjaxPopState);
    }
  }
  initFiltersEtc() {
    this.classList.add("filter-container--mobile-initialised");
    if (window.location.href.indexOf("?") >= 0) {
      document
        .querySelectorAll("#sort-dropdown-options .link-dropdown__link")
        .forEach((el) => {
          const queryTerms = window.location.href.split("?")[1].split("&");
          let newHref = el.href;
          queryTerms.forEach((term) => {
            if (term.indexOf("sort_by=") === -1) {
              newHref += `&${term}`;
            }
          });
          el.href = newHref;
        });
    }
  }
  switchGridLayout(evt) {
    evt.preventDefault();
    if (evt.target.classList.contains("layout-switch--one-column")) {
      this.querySelectorAll(".product-grid").forEach((el) => {
        el.classList.remove("product-grid--per-row-mob-2");
        el.classList.add("product-grid--per-row-mob-1");
      });
    } else {
      this.querySelectorAll(".product-grid").forEach((el) => {
        el.classList.remove("product-grid--per-row-mob-1");
        el.classList.add("product-grid--per-row-mob-2");
      });
    }
    evt.target.classList.add("layout-switch--active");
    (
      evt.target.nextElementSibling || evt.target.previousElementSibling
    ).classList.remove("layout-switch--active");
  }
  checkStickyScroll() {
    const utilityBarOffsetY = theme.getOffsetTopFromDoc(
      this.section.querySelector(".utility-bar")
    );
    if (
      window.innerWidth < 768 &&
      this.previousScrollTop > window.scrollY &&
      window.scrollY > utilityBarOffsetY
    ) {
      document.body.classList.add("utility-bar-sticky-mobile-copy-reveal");
    } else {
      document.body.classList.remove("utility-bar-sticky-mobile-copy-reveal");
    }
    this.previousScrollTop = window.scrollY;
  }
  ajaxLoadForm(evt) {
    if (evt.type === "submit") {
      evt.preventDefault();
    }
    const queryVals = [];
    this.filters.querySelectorAll("input, select").forEach((input) => {
      if (
        ((input.type !== "checkbox" && input.type !== "radio") ||
          input.checked) &&
        input.value !== ""
      ) {
        queryVals.push([input.name, encodeURIComponent(input.value)]);
      }
    });
    let newUrl = window.location.pathname;
    queryVals.forEach((value) => {
      newUrl += `&${value[0]}=${value[1]}`;
    });
    newUrl = newUrl.replace("&", "?");
    this.ajaxLoadUrl.call(this, newUrl);
  }
  ajaxPopState() {
    this.ajaxLoadUrl.call(this, document.location.href, !0);
  }
  ajaxLoadUrl(url, noPushState) {
    if (!noPushState) {
      let fullUrl = url;
      if (fullUrl.slice(0, 1) === "/") {
        fullUrl = `${window.location.protocol}//${window.location.host}${fullUrl}`;
      }
      window.history.pushState({ path: fullUrl }, "", fullUrl);
    }
    let fetchUrl = url;
    if (this.dataset.filterSectionId) {
      fetchUrl = `${url}${url.indexOf("?") >= 0 ? "&" : "?"}section_id=${
        this.dataset.filterSectionId
      }`;
    }
    const refreshContainerSelector = "[data-ajax-container]";
    const ajaxContainers = this.section.querySelectorAll(
      refreshContainerSelector
    );
    ajaxContainers.forEach((el) => el.classList.add("ajax-loading"));
    if (this.ajaxLoadUrlFetchAbortController) {
      this.ajaxLoadUrlFetchAbortController.abort();
    }
    this.ajaxLoadUrlFetchAbortController = new AbortController();
    fetch(fetchUrl, {
      method: "get",
      signal: this.ajaxLoadUrlFetchAbortController.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.text();
      })
      .then((response) => {
        if (document.activeElement) {
          this.activeElementId = document.activeElement.id;
        }
        const scrollContainer = this.querySelector(".filters");
        let elAboveScrollTopData = null;
        if (
          scrollContainer &&
          getComputedStyle(scrollContainer).overflow === "auto"
        ) {
          const allFilterChildren =
            scrollContainer.querySelectorAll(".filters *");
          let elAboveScrollTop = allFilterChildren[0];
          for (let i = 1; i < allFilterChildren.length; i += 1) {
            if (allFilterChildren[i].offsetTop) {
              if (allFilterChildren[i].offsetTop < scrollContainer.scrollTop) {
                if (
                  allFilterChildren[i].offsetTop > elAboveScrollTop.offsetTop
                ) {
                  elAboveScrollTop = allFilterChildren[i];
                }
              } else {
                break;
              }
            }
          }
          if (elAboveScrollTop.offsetTop === 0) {
            elAboveScrollTop = !1;
          } else {
            elAboveScrollTopData = {
              selector: "",
              textContent: elAboveScrollTop.textContent,
              extraScrollOffset:
                scrollContainer.scrollTop - elAboveScrollTop.offsetTop,
            };
            const attributeNames = elAboveScrollTop.getAttributeNames();
            for (let i = 0; i < attributeNames.length; i += 1) {
              const attrName = attributeNames[i];
              if (attrName === "class") {
                Array.from(elAboveScrollTop.classList)
                  .filter((a) => a !== "filter-group__item--disabled")
                  .forEach((cl) => {
                    elAboveScrollTopData.selector += `.${cl}`;
                  });
              } else {
                elAboveScrollTopData.selector += `[${attrName}="${CSS.escape(
                  elAboveScrollTop.getAttribute(attrName)
                )}"]`;
              }
            }
          }
        }
        const template = document.createElement("template");
        template.innerHTML = response;
        const newAjaxContainers = template.content.querySelectorAll(
          refreshContainerSelector
        );
        newAjaxContainers.forEach((el, index) => {
          ajaxContainers[index].innerHTML = el.innerHTML;
        });
        this.initFiltersEtc();
        if (elAboveScrollTopData) {
          this.querySelectorAll(elAboveScrollTopData.selector).forEach((el) => {
            if (el.textContent === elAboveScrollTopData.textContent) {
              scrollContainer.scrollTop =
                el.offsetTop + elAboveScrollTopData.extraScrollOffset;
            }
          });
        }
        if (this.utilBarClone) {
          const from = document.querySelector(
            ".utility-bar:not(.utility-bar--sticky-mobile-copy) .utility-bar__centre"
          );
          const to = this.utilBarClone.querySelector(".utility-bar__centre");
          if (from && to) {
            to.innerHTML = from.innerHTML;
          }
        }
        ajaxContainers.forEach((el) => el.classList.remove("ajax-loading"));
        if (this.activeElementId) {
          const el = document.getElementById(this.activeElementId);
          if (el) {
            el.focus();
          }
        }
        const scrollToY =
          theme.getOffsetTopFromDoc(
            this.section.querySelector("[data-ajax-scroll-to]")
          ) - document.querySelector(".section-header").clientHeight;
        window.scrollTo({ top: scrollToY, behavior: "smooth" });
      });
  }
};
window.customElements.define("filter-container", FilterContainer);
const GalleryViewer = class extends HTMLElement {
  connectedCallback() {
    if (!this.initialised) {
      this.initialised = !0;
      this.classList.add("gallery-viewer--pre-reveal");
      this.zoomContainer = this.querySelector(
        ".gallery-viewer__zoom-container"
      );
      this.thumbContainer = this.querySelector(".gallery-viewer__thumbs");
      this.controlsContainer = this.querySelector(".gallery-viewer__controls");
      this.previousBtn = this.querySelector(".gallery-viewer__prev");
      this.nextBtn = this.querySelector(".gallery-viewer__next");
      this.wheelZoomMultiplier = -0.001;
      this.pinchZoomMultiplier = 0.003;
      this.touchPanModifier = 1.0;
      this.currentZoomImage = null;
      this.currentTransform = { panX: 0, panY: 0, zoom: 1 };
      this.pinchTracking = { isTracking: !1, lastPinchDistance: 0 };
      this.touchTracking = { isTracking: !1, lastTouchX: 0, lastTouchY: 0 };
      theme.addDelegateEventListener(
        this,
        "click",
        ".gallery-viewer__thumb",
        this.onThumbClick.bind(this)
      );
      this.addEventListener("touchend", this.stopTrackingTouch.bind(this));
      this.addEventListener("touchmove", this.trackInputMovement.bind(this));
      this.addEventListener("mousemove", this.trackInputMovement.bind(this));
      this.addEventListener("wheel", this.trackWheel.bind(this));
      this.thumbContainer.addEventListener("touchmove", (evt) =>
        evt.stopPropagation()
      );
      this.previousBtn.addEventListener(
        "click",
        this.selectPreviousThumb.bind(this)
      );
      this.nextBtn.addEventListener("click", this.selectNextThumb.bind(this));
      this.zoomContainer.addEventListener(
        "click",
        this.onZoomContainerClick.bind(this)
      );
    }
    document.documentElement.classList.add("gallery-viewer-open");
    this.addEventListener("keyup", this.handleKeyup.bind(this));
    setTimeout(() => this.classList.remove("gallery-viewer--pre-reveal"), 10);
  }
  disconnectedCallback() {
    document.documentElement.classList.remove("gallery-viewer-open");
  }
  static createEl(type, className, appendTo, innerHTML) {
    const el = document.createElement(type);
    el.className = className;
    if (type === "a") {
      el.href = "#";
    }
    if (appendTo) {
      appendTo.insertAdjacentElement("beforeend", el);
    }
    if (innerHTML) {
      el.innerHTML = innerHTML;
    }
    return el;
  }
  init(currentFullUrl) {
    this.selectThumb(
      [...this.thumbContainer.children].find(
        (el) => el.dataset.zoomUrl === currentFullUrl
      ) || this.thumbContainer.firstElementChild
    );
  }
  panZoomImageFromCoordinate(inputX, inputY) {
    const doPanX = this.currentZoomImage.clientWidth > this.clientWidth;
    const doPanY = this.currentZoomImage.clientHeight > this.clientHeight;
    if (doPanX || doPanY) {
      const midX = this.clientWidth / 2;
      const midY = this.clientHeight / 2;
      const offsetFromCentreX = inputX - midX;
      const offsetFromCentreY = inputY - midY;
      let finalOffsetX = 0;
      let finalOffsetY = 0;
      if (doPanX) {
        const offsetMultiplierX =
          (this.currentZoomImage.clientWidth - this.clientWidth) / 2 / midX;
        finalOffsetX = Math.round(-offsetFromCentreX * offsetMultiplierX);
      }
      if (doPanY) {
        const offsetMultiplierY =
          (this.currentZoomImage.clientHeight - this.clientHeight) / 2 / midY;
        finalOffsetY = Math.round(-offsetFromCentreY * offsetMultiplierY);
      }
      this.currentTransform.panX = finalOffsetX;
      this.currentTransform.panY = finalOffsetY;
      this.alterCurrentPanBy(0, 0);
      this.updateImagePosition();
    }
  }
  alterCurrentPanBy(x, y) {
    this.currentTransform.panX += x;
    let panXMax =
      (this.currentZoomImage.naturalWidth * this.currentTransform.zoom -
        this.clientWidth) /
      2.0;
    panXMax = Math.max(panXMax, 0);
    this.currentTransform.panX = Math.min(this.currentTransform.panX, panXMax);
    this.currentTransform.panX = Math.max(this.currentTransform.panX, -panXMax);
    this.currentTransform.panY += y;
    let panYMax =
      (this.currentZoomImage.naturalHeight * this.currentTransform.zoom -
        this.clientHeight) /
      2.0;
    panYMax = Math.max(panYMax, 0);
    this.currentTransform.panY = Math.min(this.currentTransform.panY, panYMax);
    this.currentTransform.panY = Math.max(this.currentTransform.panY, -panYMax);
    this.updateImagePosition();
  }
  setCurrentTransform(panX, panY, zoom) {
    this.currentTransform.panX = panX;
    this.currentTransform.panY = panY;
    this.currentTransform.zoom = zoom;
    this.alterCurrentTransformZoomBy(0);
  }
  alterCurrentTransformZoomBy(delta) {
    this.currentTransform.zoom += delta;
    const maxZoomX = this.clientWidth / this.currentZoomImage.naturalWidth;
    const maxZoomY = this.clientHeight / this.currentZoomImage.naturalHeight;
    this.currentTransform.zoom = Math.max(
      this.currentTransform.zoom,
      Math.min(maxZoomX, maxZoomY)
    );
    this.currentTransform.zoom = Math.min(this.currentTransform.zoom, 1.0);
    this.alterCurrentPanBy(0, 0);
    this.updateImagePosition();
  }
  updateImagePosition() {
    this.currentZoomImage.style.transform = `translate3d(${this.currentTransform.panX}px, ${this.currentTransform.panY}px, 0) scale(${this.currentTransform.zoom})`;
  }
  selectThumb(thumb) {
    [...thumb.parentElement.children].forEach((el) => {
      if (el === thumb) {
        el.classList.add("gallery-viewer__thumb--active");
      } else {
        el.classList.remove("gallery-viewer__thumb--active");
      }
    });
    this.zoomContainer.classList.add("gallery-viewer__zoom-container--loading");
    this.currentZoomImage = GalleryViewer.createEl(
      "img",
      "gallery-viewer__zoom-image"
    );
    this.currentZoomImage.alt = "";
    this.currentZoomImage.style.visibility = "hidden";
    this.currentZoomImage.onload = () => {
      this.zoomContainer.classList.remove(
        "gallery-viewer__zoom-container--loading"
      );
      this.currentZoomImage.style.visibility = "";
      this.currentZoomImage.style.top = `${
        this.clientHeight / 2 - this.currentZoomImage.clientHeight / 2
      }px`;
      this.currentZoomImage.style.left = `${
        this.clientWidth / 2 - this.currentZoomImage.clientWidth / 2
      }px`;
      this.setCurrentTransform(0, 0, 0);
    };
    this.currentZoomImage.src = thumb.dataset.zoomUrl;
    this.zoomContainer.replaceChildren(this.currentZoomImage);
  }
  selectPreviousThumb(evt) {
    if (evt) evt.preventDefault();
    if (this.thumbContainer.childElementCount < 2) return;
    let previous = this.thumbContainer.querySelector(
      ".gallery-viewer__thumb--active"
    ).previousElementSibling;
    while (!previous || !previous.offsetParent) {
      if (!previous) {
        previous = this.thumbContainer.lastElementChild;
      } else {
        previous = previous.previousElementSibling;
      }
    }
    this.selectThumb(previous);
  }
  selectNextThumb(evt) {
    if (evt) evt.preventDefault();
    if (this.thumbContainer.childElementCount < 2) return;
    let next = this.thumbContainer.querySelector(
      ".gallery-viewer__thumb--active"
    ).nextElementSibling;
    while (!next || !next.offsetParent) {
      if (!next) {
        next = this.thumbContainer.firstElementChild;
      } else {
        next = next.nextElementSibling;
      }
    }
    this.selectThumb(next);
  }
  stopTrackingTouch() {
    this.pinchTracking.isTracking = !1;
    this.touchTracking.isTracking = !1;
  }
  trackInputMovement(evt) {
    evt.preventDefault();
    if (evt.type === "touchmove" && evt.touches.length > 0) {
      const touch1 = evt.touches[0];
      if (!this.touchTracking.isTracking) {
        this.touchTracking.isTracking = !0;
        this.touchTracking.lastTouchX = touch1.clientX;
        this.touchTracking.lastTouchY = touch1.clientY;
      } else {
        this.alterCurrentPanBy(
          (touch1.clientX - this.touchTracking.lastTouchX) *
            this.touchPanModifier,
          (touch1.clientY - this.touchTracking.lastTouchY) *
            this.touchPanModifier
        );
        this.touchTracking.lastTouchX = touch1.clientX;
        this.touchTracking.lastTouchY = touch1.clientY;
      }
      if (evt.touches.length === 2) {
        const touch2 = evt.touches[1];
        const pinchDistance = Math.sqrt(
          (touch1.clientX - touch2.clientX) ** 2 +
            (touch1.clientY - touch2.clientY) ** 2
        );
        if (!this.pinchTracking.isTracking) {
          this.pinchTracking.lastPinchDistance = pinchDistance;
          this.pinchTracking.isTracking = !0;
        } else {
          const pinchDelta =
            pinchDistance - this.pinchTracking.lastPinchDistance;
          this.alterCurrentTransformZoomBy(
            pinchDelta * this.pinchZoomMultiplier
          );
          this.pinchTracking.lastPinchDistance = pinchDistance;
        }
      } else {
        this.pinchTracking.isTracking = !1;
      }
    } else {
      this.panZoomImageFromCoordinate(evt.clientX, evt.clientY);
    }
  }
  trackWheel(evt) {
    evt.preventDefault();
    if (evt.deltaY !== 0) {
      this.alterCurrentTransformZoomBy(evt.deltaY * this.wheelZoomMultiplier);
    }
  }
  onThumbClick(evt, thumb) {
    evt.preventDefault();
    this.selectThumb(thumb);
  }
  onZoomContainerClick(evt) {
    evt.preventDefault();
    if (this.currentTransform.zoom === 1.0) {
      this.currentTransform.zoom = 0;
      this.alterCurrentTransformZoomBy(0);
    } else {
      this.currentTransform.zoom = 1;
      this.alterCurrentTransformZoomBy(0);
      this.panZoomImageFromCoordinate(evt.clientX, evt.clientY);
    }
  }
  handleKeyup(evt) {
    switch (evt.key) {
      case "ArrowLeft":
        evt.preventDefault();
        this.selectPreviousThumb();
        break;
      case "ArrowRight":
        evt.preventDefault();
        this.selectNextThumb();
        break;
    }
  }
};
window.customElements.define("gallery-viewer", GalleryViewer);
const LinkDropdown = class extends HTMLElement {
  constructor() {
    super();
    this.open = !1;
    this.button = this.querySelector(".link-dropdown__button");
    this.button.addEventListener("click", this.toggle.bind(this));
  }
  connectedCallback() {
    if (this.open) {
      this.addDismissListener();
    }
  }
  disconnectedCallback() {
    if (this.open) {
      this.removeDismissListener();
    }
  }
  toggle(evt, isDismiss) {
    if (!isDismiss) {
      evt.preventDefault();
      evt.stopPropagation();
    }
    const doExpand = this.button.getAttribute("aria-expanded") === "false";
    this.button.setAttribute("aria-expanded", doExpand);
    this.button.style.width = `${this.button.clientWidth}px`;
    let newWidth = null;
    const optsBox = this.button.nextElementSibling;
    const isLeftAligned = this.button
      .closest(".link-dropdown")
      .classList.contains("link-dropdown--left-aligned");
    if (!isLeftAligned) {
      if (doExpand) {
        newWidth = optsBox.clientWidth;
        if (document.querySelector("html[dir=rtl]")) {
          newWidth += parseInt(getComputedStyle(optsBox).left, 10);
        } else {
          newWidth += parseInt(getComputedStyle(optsBox).right, 10);
        }
        newWidth -= parseInt(
          getComputedStyle(optsBox.querySelector(".link-dropdown__link"))
            .paddingInlineStart,
          10
        );
      } else {
        newWidth =
          parseInt(getComputedStyle(this.button).paddingInlineEnd, 10) +
          Math.ceil(
            this.button
              .querySelector(".link-dropdown__button-text")
              .getBoundingClientRect().width
          );
      }
      setTimeout(() => {
        this.button.style.width = `${newWidth}px`;
      }, 10);
    }
    if (doExpand) {
      this.open = !0;
      this.addDismissListener();
    } else {
      this.open = !1;
      this.removeDismissListener();
    }
  }
  addDismissListener() {
    this.dismissCallback = this.toggle.bind(this, !0);
    document.addEventListener("click", this.dismissCallback);
  }
  removeDismissListener() {
    document.removeEventListener("click", this.dismissCallback);
    this.dismissCallback = null;
  }
};
window.customElements.define("link-dropdown", LinkDropdown);
const MainNavigation = class extends HTMLElement {
  constructor() {
    super();
    this.navHoverDelay = 250;
    this.navLastOpenDropdown = null;
    this.navOpenTimeoutId = -1;
    this.querySelectorAll(
      ".navigation__tier-1 > .navigation__item--with-children"
    ).forEach((el) => {
      el.addEventListener("mouseenter", this.onNavParentHoverIn.bind(this));
    });
    this.querySelectorAll(
      ".navigation__tier-1 > .navigation__item--with-children"
    ).forEach((el) => {
      el.addEventListener("mouseleave", this.onNavParentHoverOut.bind(this));
    });
    theme.addDelegateEventListener(
      this,
      "touchstart",
      ".navigation__tier-1 > .navigation__item--with-children > .navigation__link",
      (evt, el) => {
        this.handleTouch(evt, el);
      },
      { passive: !0 }
    );
    theme.addDelegateEventListener(
      this,
      "touchend",
      ".navigation__tier-1 > .navigation__item--with-children > .navigation__link",
      (evt, el) => {
        this.handleTouch(evt, el);
      }
    );
    theme.addDelegateEventListener(
      this,
      "click",
      ".navigation__tier-1 > .navigation__item--with-children > .navigation__link",
      this.onNavParentHoverIn.bind(this)
    );
    theme.addDelegateEventListener(
      this,
      "keydown",
      ".navigation__tier-1 > .navigation__item--with-children > .navigation__link",
      this.onNavKeydown.bind(this)
    );
    this.querySelectorAll(
      '.navigation__link[href="#"][aria-haspopup="true"]'
    ).forEach((el) => {
      el.addEventListener("click", (evt) => {
        evt.preventDefault();
        evt.currentTarget.nextElementSibling.dispatchEvent(
          new Event("click", { bubbles: !0 })
        );
      });
    });
    this.addEventListener("mouseenter", this.handleNavHover.bind(this));
    this.addEventListener("mouseleave", this.handleNavHover.bind(this));
  }
  ensureDropdownsInPageBounds() {
    this.querySelectorAll(
      ".navigation__item--with-small-menu > .navigation__child-tier"
    ).forEach((el) => {
      const parentBcr = el.parentElement.getBoundingClientRect();
      const childBcr = el.getBoundingClientRect();
      const diff = window.innerWidth - (parentBcr.left + childBcr.width);
      if (diff < 25) {
        el.style.setProperty("--nav-side-offset", `${diff - 25}px`);
      }
    });
  }
  connectedCallback() {
    const debouncedEnsureDropdownsInPageBounds = debounce(
      this.ensureDropdownsInPageBounds.bind(this),
      300
    );
    debouncedEnsureDropdownsInPageBounds();
    this.resizeObserver = new ResizeObserver((entries) => {
      for (let i = 0; i < entries.length; i += 1) {
        const entry = entries[i];
        if (entry.contentBoxSize || entry.contentRect) {
          debouncedEnsureDropdownsInPageBounds();
        }
      }
    });
    this.resizeObserver.observe(this);
    this.proxyTier1Nav = document.getElementById(this.dataset.proxyNav);
    if (this.proxyTier1Nav) {
      this.proxyTier1NavBoundEvents = [];
      const boundOnProxyNavEnterSmallMenu =
        this.onProxyNavEnterSmallMenu.bind(this);
      this.proxyTier1Nav
        .querySelectorAll(".navigation__item--with-small-menu")
        .forEach((el) => {
          el.addEventListener("mouseenter", boundOnProxyNavEnterSmallMenu);
          this.proxyTier1NavBoundEvents.push({
            element: el,
            name: "mouseenter",
            fn: boundOnProxyNavEnterSmallMenu,
          });
        });
      this.proxyTier1NavBoundEvents.push({
        element: this.proxyTier1Nav,
        name: "touchstart",
        fn: theme.addDelegateEventListener(
          this.proxyTier1Nav,
          "touchstart",
          ".navigation__item--with-small-menu",
          this.onProxyNavEnterSmallMenu.bind(this),
          { passive: !0 }
        ),
      });
      const onProxyNavEnterLeaveLargeMenu = (evt) => {
        const elIndex = [...evt.currentTarget.parentNode.children].indexOf(
          evt.currentTarget
        );
        this.querySelectorAll(".navigation__tier-1 > .navigation__item")[
          elIndex
        ].dispatchEvent(new Event(evt.type));
      };
      this.proxyTier1Nav
        .querySelectorAll(
          ".navigation__tier-1 > .navigation__item--with-children"
        )
        .forEach((el) => {
          el.addEventListener("mouseenter", onProxyNavEnterLeaveLargeMenu);
          this.proxyTier1NavBoundEvents.push({
            element: el,
            name: "mouseenter",
            fn: onProxyNavEnterLeaveLargeMenu,
          });
          el.addEventListener("mouseleave", onProxyNavEnterLeaveLargeMenu);
          this.proxyTier1NavBoundEvents.push({
            element: el,
            name: "mouseleave",
            fn: onProxyNavEnterLeaveLargeMenu,
          });
        });
      const eventNames = ["touchstart", "touchend", "click"];
      for (let i = 0; i < eventNames.length; i += 1) {
        const eventName = eventNames[i];
        this.proxyTier1NavBoundEvents.push({
          element: this.proxyTier1Nav,
          name: eventName,
          fn: theme.addDelegateEventListener(
            this.proxyTier1Nav,
            eventName,
            ".navigation__tier-1 > .navigation__item--with-children > .navigation__link",
            (evt, el) => {
              const elIndex = [...el.parentNode.parentNode.children].indexOf(
                el.parentNode
              );
              const proxiedLink = this.querySelectorAll(
                ".navigation__tier-1 > .navigation__item"
              )[elIndex].firstElementChild;
              this.handleTouch(evt, proxiedLink);
            },
            { passive: eventName === "touchstart" }
          ),
        });
      }
      this.proxyTier1NavBoundEvents.push({
        element: this.proxyTier1Nav,
        name: "keydown",
        fn: theme.addDelegateEventListener(
          this.proxyTier1Nav,
          "keydown",
          ".navigation__tier-1 > .navigation__item--with-children > .navigation__link",
          (evt, el) => {
            if (evt.key === "Enter") {
              const elIndex = [...el.parentNode.parentNode.children].indexOf(
                el.parentNode
              );
              const proxiedLink = this.querySelectorAll(
                ".navigation__tier-1 > .navigation__item"
              )[elIndex].firstElementChild;
              el.setAttribute(
                "aria-expanded",
                !proxiedLink.parentElement.classList.contains(
                  "navigation__item--show-children"
                )
              );
              this.onNavKeydown(evt, proxiedLink);
            }
          }
        ),
      });
      const boundHandleNavHover = this.handleNavHover.bind(this);
      this.proxyTier1Nav.addEventListener("mouseenter", boundHandleNavHover);
      this.proxyTier1Nav.addEventListener("mouseleave", boundHandleNavHover);
      this.proxyTier1NavBoundEvents.push({
        element: this.proxyTier1Nav,
        name: "mouseenter",
        fn: boundHandleNavHover,
      });
      this.proxyTier1NavBoundEvents.push({
        element: this.proxyTier1Nav,
        name: "mouseleave",
        fn: boundHandleNavHover,
      });
    }
    const tDiv = document.createElement("div");
    tDiv.innerHTML = this.querySelector(
      ".mobile-navigation-drawer-template"
    ).innerHTML;
    this.mobileDrawer = tDiv.firstElementChild;
    const mobileDrawerFooter = this.mobileDrawer.querySelector(
      ".mobile-navigation-drawer__footer"
    );
    const annBarMenu = document.querySelector(".announcement-bar .inline-menu");
    if (annBarMenu) {
      const clone = annBarMenu.cloneNode(!0);
      clone.classList.remove("desktop-only");
      mobileDrawerFooter.appendChild(clone);
    }
    const annBarLocalizations = document.querySelector(
      ".announcement-bar .header-localization"
    );
    if (annBarLocalizations) {
      const clone = annBarLocalizations.cloneNode(!0);
      clone.classList.remove("desktop-only");
      mobileDrawerFooter.appendChild(clone);
      clone.querySelector("form").addEventListener("change", (evt) => {
        const input = evt.target.previousElementSibling;
        if (input && input.tagName === "INPUT") {
          input.value = evt.detail.selectedValue;
          evt.currentTarget.submit();
        }
      });
    }
    const annBarSocial = document.querySelector(".announcement-bar .social");
    if (annBarSocial) {
      const clone = annBarSocial.cloneNode(!0);
      clone.classList.remove("desktop-only");
      mobileDrawerFooter.appendChild(clone);
    }
    theme.suffixIds(this.mobileDrawer, "MobileNav");
    document
      .querySelector(".section-header")
      .insertAdjacentElement("afterend", this.mobileDrawer);
    theme.addDelegateEventListener(
      this.mobileDrawer,
      "click",
      ".navigation__tier-1 > .navigation__item > .navigation__children-toggle",
      (evt, delEl) => {
        evt.preventDefault();
        delEl.parentElement.classList.add("navigation__item--open");
        this.mobileDrawer.classList.add("mobile-navigation-drawer--child-open");
        this.mobileDrawer.querySelector(".mobile-nav-title").innerText =
          delEl.previousElementSibling.innerText;
        delEl.nextElementSibling.style.top = `${Math.ceil(
          this.mobileDrawer.querySelector(".navigation__mobile-header")
            .clientHeight + 1
        )}px`;
        this.mobileDrawer
          .closest(".mobile-navigation-drawer")
          .scrollTo({ top: 0, left: 0, behavior: "instant" });
      }
    );
    if (this.mobileDrawer.dataset.mobileExpandWithEntireLink === "true") {
      theme.addDelegateEventListener(
        this.mobileDrawer,
        "click",
        ".navigation__item--with-children > .navigation__link",
        (evt, delEl) => {
          evt.preventDefault();
          delEl.nextElementSibling.dispatchEvent(
            new Event("click", { bubbles: !0, cancelable: !0 })
          );
        }
      );
    } else {
      theme.addDelegateEventListener(
        this.mobileDrawer,
        "click",
        '.navigation__item--with-children > .navigation__link[href="#"]',
        (evt, delEl) => {
          evt.preventDefault();
          delEl.nextElementSibling.dispatchEvent(
            new Event("click", { bubbles: !0, cancelable: !0 })
          );
        }
      );
    }
    theme.addDelegateEventListener(
      this.mobileDrawer,
      "click",
      ".mobile-nav-back",
      (evt) => {
        evt.preventDefault();
        this.mobileDrawer.classList.remove(
          "mobile-navigation-drawer--child-open"
        );
        this.mobileDrawer
          .querySelectorAll(".navigation__tier-1 > .navigation__item--open")
          .forEach((el) => {
            el.classList.remove("navigation__item--open");
          });
      }
    );
    theme.addDelegateEventListener(
      this.mobileDrawer,
      "click",
      ".navigation__tier-2 > .navigation__item > .navigation__children-toggle",
      (evt, delEl) => {
        evt.preventDefault();
        const doOpen = !delEl.parentElement.classList.contains(
          "navigation__item--open"
        );
        if (doOpen) {
          delEl.parentElement.classList.add("navigation__item--open");
          delEl.nextElementSibling.style.height = `${delEl.nextElementSibling.firstElementChild.clientHeight}px`;
        } else {
          delEl.parentElement.classList.remove("navigation__item--open");
          delEl.nextElementSibling.style.height = "";
        }
      }
    );
  }
  handleNavHover(evt) {
    this.closest(".section-header").classList.toggle(
      "section-header--nav-hover",
      evt.type === "mouseenter"
    );
  }
  onNavParentHoverIn(evt) {
    const dropdownContainer = evt.currentTarget;
    clearTimeout(this.navOpenTimeoutId);
    clearTimeout(dropdownContainer.dataset.navCloseTimeoutId);
    const openSiblings = [...dropdownContainer.parentNode.children].filter(
      (child) =>
        child !== dropdownContainer &&
        child.classList.contains("navigation__item--show-children")
    );
    openSiblings
      .filter((el) => el !== this.navLastOpenDropdown)
      .forEach((el) => el.classList.remove("navigation__item--show-children"));
    this.navLastOpenDropdown = dropdownContainer;
    const timeoutDelay = openSiblings.length === 0 ? 0 : this.navHoverDelay;
    const newNavOpenTimeoutId = setTimeout(() => {
      [...dropdownContainer.parentNode.children].forEach((el) => {
        if (el === dropdownContainer) {
          el.classList.add("navigation__item--show-children");
        } else {
          el.classList.remove("navigation__item--show-children");
        }
      });
      dropdownContainer
        .closest(".section-header")
        .classList.add("section-header--nav-open");
    }, timeoutDelay);
    this.navOpenTimeoutId = newNavOpenTimeoutId;
    dropdownContainer.dataset.navOpenTimeoutId = newNavOpenTimeoutId;
    dropdownContainer.firstElementChild.setAttribute("aria-expanded", !0);
  }
  onNavParentHoverOut(evt) {
    const dropdownContainer = evt.currentTarget;
    clearTimeout(dropdownContainer.dataset.navOpenTimeoutId);
    dropdownContainer.dataset.navCloseTimeoutId = setTimeout(() => {
      dropdownContainer.classList.remove("navigation__item--show-children");
      dropdownContainer
        .closest(".section-header")
        .classList.remove("section-header--nav-open");
    }, this.navHoverDelay);
    dropdownContainer.firstElementChild.setAttribute("aria-expanded", !1);
  }
  handleTouch(evt, link) {
    if (window.innerWidth > 767) {
      if (evt.type === "touchstart") {
        link.dataset.touchstartedAt = evt.timeStamp.toString();
      } else if (evt.type === "touchend") {
        if (evt.timeStamp - parseInt(link.dataset.touchstartedAt, 10) < 1000) {
          link.dataset.touchOpenTriggeredAt = evt.timeStamp.toString();
          if (
            link.parentElement.classList.contains(
              "navigation__item--show-children"
            )
          ) {
            link.parentElement.dispatchEvent(new Event("mouseleave"));
          } else {
            this.querySelectorAll(".navigation__item--show-children").forEach(
              (el) => el.dispatchEvent(new Event("mouseleave"))
            );
            link.parentElement.dispatchEvent(new Event("mouseenter"));
          }
          evt.preventDefault();
          evt.stopPropagation();
        }
      } else if (evt.type === "click") {
        if (
          link.dataset.touchOpenTriggeredAt &&
          evt.timeStamp - parseInt(link.dataset.touchOpenTriggeredAt, 10) < 1000
        ) {
          evt.preventDefault();
          evt.stopPropagation();
        }
      }
    }
  }
  onNavKeydown(evt, el) {
    if (evt.key === "Enter") {
      if (
        el.parentElement.classList.contains("navigation__item--show-children")
      ) {
        el.parentElement.dispatchEvent(new Event("mouseleave"));
      } else {
        el.parentElement.dispatchEvent(new Event("mouseenter"));
      }
      evt.preventDefault();
    }
  }
  onProxyNavEnterSmallMenu(evt, delEl) {
    const el = delEl || evt.currentTarget;
    const elIndex = [...el.parentNode.children].indexOf(el);
    const dropdown = this.querySelectorAll(
      ".navigation__tier-1 > .navigation__item"
    )[elIndex].querySelector(".navigation__tier-2-container");
    if (document.querySelector('html[dir="rtl"]')) {
      dropdown.style.right = `${
        dropdown.offsetParent.clientWidth -
        (theme.getOffsetLeftFromDoc(el) + el.clientWidth)
      }px`;
    } else {
      dropdown.style.left = `${theme.getOffsetLeftFromDoc(el)}px`;
    }
  }
  disconnectedCallback() {
    this.mobileDrawer.remove();
    if (this.proxyTier1NavBoundEvents) {
      for (let i = 0; i < this.proxyTier1NavBoundEvents.length; i += 1) {
        this.proxyTier1NavBoundEvents[i].element.removeEventListener(
          this.proxyTier1NavBoundEvents[i].name,
          this.proxyTier1NavBoundEvents[i].fn
        );
      }
    }
  }
};
window.customElements.define("main-navigation", MainNavigation);
const ProductBlock = class extends HTMLElement {
  constructor() {
    super();
    window.initLazyScript(this, this.init.bind(this));
  }
  init() {
    this.images = Array.from(this.querySelectorAll(".product-block__image"));
    if (this.images.length > 1) {
      this.initImagePagination();
      this.monitorSwatchSelection();
      this.initCustomLazyLoading();
    }
  }
  initCustomLazyLoading() {
    setTimeout(() => {
      this.querySelector(
        ".product-block__image--show-on-hover"
      ).classList.remove("product-block__image--inactivated");
    }, 1000);
    this.boundLazyLoadAll = this.lazyLoadAll.bind(this);
    this.addEventListener("mouseenter", this.boundLazyLoadAll);
    this.addEventListener("touchstart", this.boundLazyLoadAll, { passive: !0 });
  }
  lazyLoadAll() {
    this.querySelectorAll(".product-block__image--inactivated").forEach((el) =>
      el.classList.remove("product-block__image--inactivated")
    );
    this.removeEventListener("mouseenter", this.boundLazyLoadAll);
    this.removeEventListener("touchstart", this.boundLazyLoadAll);
  }
  getImageAt(index) {
    return this.images[
      ((index % this.images.length) + this.images.length) % this.images.length
    ];
  }
  incrementActiveImage(increment) {
    let index = 0;
    for (let i = 0; i < this.images.length; i += 1) {
      if (this.images[i].classList.contains("product-block__image--active")) {
        index = i;
        break;
      }
    }
    this.setActiveImage(index + increment);
  }
  setActiveImage(index) {
    const newActiveImage = this.getImageAt(index);
    const hoverImage = this.getImageAt(index + 1);
    [...newActiveImage.parentElement.children].forEach((el) => {
      el.classList.toggle(
        "product-block__image--active",
        el === newActiveImage
      );
      el.classList.toggle(
        "product-block__image--show-on-hover",
        el === hoverImage
      );
    });
    this.querySelectorAll(".product-block__image-dot").forEach((el, iter) => {
      el.classList.toggle("product-block__image-dot--active", iter === index);
    });
  }
  initImagePagination() {
    this.querySelector(".image-page-button--next").addEventListener(
      "click",
      (evt) => {
        evt.preventDefault();
        this.incrementActiveImage(1);
      }
    );
    this.querySelector(".image-page-button--previous").addEventListener(
      "click",
      (evt) => {
        evt.preventDefault();
        this.incrementActiveImage(-1);
      }
    );
    if (!this.closest(".carousel, .product-grid--scrollarea")) {
      const touchContainer = this.querySelector(
        ".image-cont--with-secondary-image"
      );
      touchContainer.addEventListener(
        "touchstart",
        (evt) => {
          theme.productBlockTouchTracking = !0;
          theme.productBlockTouchStartX = evt.touches[0].clientX;
          theme.productBlockTouchStartY = evt.touches[0].clientY;
        },
        { passive: !0 }
      );
      touchContainer.addEventListener(
        "touchmove",
        (evt) => {
          if (theme.productBlockTouchTracking) {
            if (
              Math.abs(evt.touches[0].clientY - theme.productBlockTouchStartY) <
              30
            ) {
              const deltaX =
                evt.touches[0].clientX - theme.productBlockTouchStartX;
              if (deltaX > 25) {
                this.incrementActiveImage(-1);
                theme.productBlockTouchTracking = !1;
              } else if (deltaX < -25) {
                this.incrementActiveImage(1);
                theme.productBlockTouchTracking = !1;
              }
            }
          }
        },
        { passive: !0 }
      );
      touchContainer.addEventListener("touchend", () => {
        theme.productBlockTouchTracking = !1;
      });
    }
  }
  onSelectSwatch(evt) {
    evt.preventDefault();
    let index = -1;
    for (let i = 0; i < this.images.length; i += 1) {
      if (this.images[i].dataset.mediaId === evt.currentTarget.dataset.media) {
        index = i;
        break;
      }
    }
    if (index < 0) return;
    this.setActiveImage(index);
    const { optionName } = evt.currentTarget.closest(
      ".product-block-options"
    ).dataset;
    const optionValue = evt.currentTarget.dataset.optionItem;
    this.querySelectorAll(".product-link, .quickbuy-toggle").forEach((el) => {
      const url = new URL(el.href);
      const params = new URLSearchParams(url.search);
      params.set(optionName, optionValue);
      el.href = `${url.pathname}?${params}`;
      el.rel = "nofollow";
    });
  }
  monitorSwatchSelection() {
    this.querySelectorAll("[data-media].product-block-options__item").forEach(
      (el) => {
        el.addEventListener("mouseenter", this.onSelectSwatch.bind(this));
        el.addEventListener("click", this.onSelectSwatch.bind(this));
      }
    );
  }
};
window.customElements.define("product-block", ProductBlock);
const MediaGallery = class extends HTMLElement {
  constructor() {
    super();
    this.section = this.closest(".js-product");
    this.mainImageContainer = this.querySelector(".main-image");
    this.slideshow = this.mainImageContainer.querySelector(
      ".main-image carousel-slider"
    );
    this.collage = this.querySelector(".product-media-collage");
    this.xrButton = this.querySelector("[data-shopify-xr]");
    this.variantPicker = this.section.querySelector("variant-picker");
    this.mediaGroupingEnabled =
      this.variantPicker &&
      this.hasAttribute("data-media-grouping-enabled") &&
      this.getMediaGroupData();
    this.mediaLists = [
      this.querySelectorAll(".main-image .slider__item"),
      this.querySelectorAll(".product-media-collage__item"),
      this.querySelectorAll(".thumbnails .slider__item"),
    ];
    if (this.variantPicker) {
      const toLoad = [this.variantPicker];
      if (this.slideshow.offsetParent) {
        toLoad.push(this.slideshow);
      }
      const thumbnailSlider = this.querySelector("carousel-slider.thumbnails");
      if (thumbnailSlider && thumbnailSlider.offsetParent) {
        toLoad.push(thumbnailSlider);
      }
      theme.whenComponentLoaded(toLoad, this.setFromVariantPicker.bind(this));
    }
    if (this.hasAttribute("data-zoom-enabled")) {
      this.galleryModal = this.querySelector(
        ".js-media-zoom-template"
      ).content.firstElementChild.cloneNode(!0);
      this.mediaLists.push(
        this.galleryModal.querySelectorAll(".gallery-viewer__thumb")
      );
      theme.addDelegateEventListener(
        this,
        "click",
        ".show-gallery",
        this.openGalleryViewer.bind(this)
      );
      if (this.hasAttribute("data-zoom-preload")) {
        this.mainImageContainer.addEventListener(
          "mouseover",
          MediaGallery.hoverMainImage.bind(this)
        );
        this.mainImageContainer.addEventListener(
          "touchstart",
          MediaGallery.hoverMainImage.bind(this)
        );
      }
    }
    this.section.addEventListener(
      "on:carousel-slider:select",
      this.selectMainMedia.bind(this)
    );
    theme.addDelegateEventListener(
      this,
      "click",
      ".thumbnail",
      this.selectThumbnail.bind(this)
    );
    this.section.addEventListener(
      "on:variant:change",
      this.onVariantChange.bind(this)
    );
    setTimeout(() => {
      if (this.slideshow.offsetParent) {
        this.slideshow.querySelectorAll(".theme-img").forEach((el) => {
          el.loading = "eager";
        });
      }
    }, 3000);
  }
  setFromVariantPicker() {
    if (this.mediaGroupingEnabled) {
      this.setMediaGroupOnFirstLoad();
    } else {
      const variant = this.variantPicker.getSelectedVariant();
      if (variant && variant.featured_media) {
        this.setActiveMedia(variant.featured_media.id, !0, !0);
      }
    }
  }
  setMediaGroupOnFirstLoad() {
    this.setActiveMediaGroup(this.getMediaGroupFromOptionSelectors());
    const variant = this.variantPicker.getSelectedVariant();
    if (variant && variant.featured_media) {
      this.setActiveMedia(variant.featured_media.id, !0, !0);
      return;
    }
    this.setActiveMedia(
      this.querySelector(".thumbnails .slider__item:not([hidden])").dataset
        .mediaId,
      !1,
      !0
    );
  }
  static hoverMainImage(evt) {
    MediaGallery.loadImage(
      evt.currentTarget.querySelector(".slider__item.is-active a.show-gallery")
    );
  }
  openGalleryViewer(evt, imageLink) {
    evt.preventDefault();
    if (!this.galleryModal.parentElement) {
      document.body.appendChild(this.galleryModal);
    }
    this.galleryModal.open(imageLink);
    const viewer = this.galleryModal.querySelector("gallery-viewer");
    viewer.init(imageLink.getAttribute("href"));
    viewer.focus();
    if (this.hasAttribute("data-zoom-preload")) {
      this.mediaLists[0].forEach((sliderItem) => {
        MediaGallery.loadImage(sliderItem.querySelector("a.show-gallery"));
      });
    }
  }
  static loadImage(anchor) {
    if (
      anchor.hasAttribute("data-loading") ||
      anchor.hasAttribute("data-loaded")
    )
      return;
    anchor.setAttribute("data-loading", "");
    const image = new Image(5000);
    image.addEventListener(
      "load",
      () => {
        anchor.removeAttribute("data-loading");
        anchor.setAttribute("data-loaded", "");
      },
      { once: !0 }
    );
    image.src = anchor.href;
  }
  onVariantChange(evt) {
    if (this.mediaGroupingEnabled) {
      this.setActiveMediaGroup(this.getMediaGroupFromOptionSelectors(evt));
    }
    if (evt.detail.variant && evt.detail.variant.featured_media) {
      this.setActiveMedia(evt.detail.variant.featured_media.id, !0);
    } else if (this.mediaGroupChanged) {
      this.setActiveMedia(
        this.querySelector(".thumbnails .slider__item:not([hidden])").dataset
          .mediaId,
        !0
      );
    }
  }
  getMediaGroupFromOptionSelectors(evt) {
    if (evt) {
      return evt.detail.selectedOptions[
        this.getMediaGroupData().groupOptionIndex
      ];
    }
    return this.variantPicker.getSelectedOptions()[
      this.getMediaGroupData().groupOptionIndex
    ];
  }
  getMediaGroupData() {
    if (typeof this.variantMediaData === "undefined") {
      const dataEl = this.querySelector(".js-data-variant-media");
      if (dataEl) {
        this.variantMediaData = JSON.parse(dataEl.textContent);
      } else {
        this.variantMediaData = !1;
      }
    }
    return this.variantMediaData;
  }
  setActiveMediaGroup(groupName) {
    this.mediaGroupChanged = this.currentMediaGroup !== groupName;
    this.currentMediaGroup = groupName;
    if (!this.mediaGroupChanged) return;
    if (!groupName) {
      this.mediaLists.forEach((list) => {
        list.forEach((mediaItem) => {
          mediaItem.hidden = !1;
        });
      });
      return;
    }
    const mediaGroupData = this.getMediaGroupData();
    this.mediaLists.forEach((list) => {
      list.forEach((el) => {
        const mediaItemGroup = mediaGroupData.media[el.dataset.mediaId].group;
        const showThis = mediaItemGroup === groupName || mediaItemGroup === !0;
        el.hidden = !showThis;
      });
      [...list].forEach((el) => {
        if (mediaGroupData.media[el.dataset.mediaId].group === !0) {
          if (mediaGroupData.media[el.dataset.mediaId].position === "start") {
            el.parentElement.prepend(el);
          } else {
            el.parentElement.append(el);
          }
        }
      });
      [...list]
        .filter((el) => el.hidden)
        .forEach((el) => el.parentElement.append(el));
      if (list.length > 0) {
        const slider = list[0].closest("carousel-slider");
        if (slider && slider.offsetParent) {
          slider.refresh();
        }
      }
    });
  }
  setActiveMedia(mediaId, scrollToItem = !0, firstLoad = !1) {
    const strMediaId = mediaId.toString();
    const mediaEl = this.mainImageContainer.querySelector(
      `[data-media-id="${strMediaId}"]`
    );
    if (scrollToItem) {
      if (
        this.slideshow.hasAttribute("loaded") &&
        this.slideshow.offsetParent
      ) {
        this.slideshow.scrollToElement(mediaEl, "instant");
      }
      if (this.collage && this.collage.offsetParent && !firstLoad) {
        const collageMediaEl = this.collage.querySelector(
          `[data-media-id="${strMediaId}"]`
        );
        if (collageMediaEl) {
          theme.scrollToRevealElement(collageMediaEl);
          clearTimeout(this.collage.dataset.highlightTimeoutId);
          if (this.mediaGroupChanged) {
            this.collage
              .querySelectorAll(".product-media-collage__item--highlight-off")
              .forEach((el) => {
                el.classList.remove(
                  "product-media-collage__item--highlight-off"
                );
              });
          } else {
            this.collage
              .querySelectorAll(".product-media-collage__item")
              .forEach((el) => {
                if (el === collageMediaEl) {
                  el.classList.remove(
                    "product-media-collage__item--highlight-off"
                  );
                } else {
                  el.classList.add(
                    "product-media-collage__item--highlight-off"
                  );
                }
              });
            this.collage.dataset.highlightTimeoutId = setTimeout(() => {
              this.collage
                .querySelectorAll(".product-media-collage__item--highlight-off")
                .forEach((el) => {
                  el.classList.remove(
                    "product-media-collage__item--highlight-off"
                  );
                });
            }, 1200);
          }
        }
      }
    }
    this.mediaLists.forEach((list) => {
      list.forEach((mediaItem) => {
        if (mediaItem.dataset.mediaId === strMediaId) {
          mediaItem.classList.add("is-active");
          const carousel = mediaItem.closest("carousel-slider");
          if (carousel && carousel.offsetParent) {
            carousel.scrollToElement(mediaItem);
          }
        } else {
          mediaItem.classList.remove("is-active");
        }
      });
    });
    window.pauseAllMedia();
    if (mediaEl) {
      const deferredMedia = mediaEl.querySelector(
        "deferred-media, product-model"
      );
      if (deferredMedia) deferredMedia.loadContent(!0);
      const playableMedia = mediaEl.querySelector("video");
      if (playableMedia) {
        playableMedia.play();
      }
    }
    if (this.xrButton && this.mediaIsModel(mediaId)) {
      this.xrButton.dataset.shopifyModel3dId = mediaId;
    }
    document.dispatchEvent(
      new CustomEvent("on:media-gallery:change", {
        bubbles: !0,
        cancelable: !1,
      })
    );
  }
  mediaIsModel(mediaId) {
    return !!this.querySelector(
      `.product-media--model[data-model-id="${mediaId}"]`
    );
  }
  selectThumbnail(evt, thumbnail) {
    evt.preventDefault();
    this.setActiveMedia(thumbnail.parentNode.dataset.mediaId, !0);
  }
  selectMainMedia(evt) {
    if (evt.detail.slide.dataset.mediaId) {
      this.setActiveMedia(evt.detail.slide.dataset.mediaId, !1);
    }
  }
};
window.customElements.define("media-gallery", MediaGallery);
const ProductForm = class extends HTMLElement {
  constructor() {
    super();
    this.form = this.querySelector(".js-product-form");
    if (this.form) {
      const idInput = this.form.querySelector('[name="id"]');
      idInput.disabled = !1;
      idInput.required = !0;
      if (theme.settings.afterAddToCart !== "no-js") {
        this.submitBtn = this.querySelector('[name="add"]');
        this.form.addEventListener("submit", this.handleSubmit.bind(this));
      }
    }
  }
  async handleSubmit(evt) {
    evt.preventDefault();
    if (this.submitBtn.getAttribute("aria-disabled") === "true") return;
    this.setErrorMsgState();
    const formValid = this.validate();
    if (!formValid) return;
    this.submitBtn.setAttribute("aria-disabled", "true");
    this.submitBtn.classList.add("is-loading");
    const formData = new FormData(this.form);
    const sectionsToUpdate = ["page-header", "cart-drawer"]
      .map((sel) => document.querySelector(sel))
      .filter((el) => el);
    const sectionIds = sectionsToUpdate.map((el) => el.dataset.sectionId);
    formData.append("sections_url", window.location.pathname);
    formData.append("sections", sectionIds.join(","));
    const fetchRequestOpts = {
      method: "POST",
      headers: {
        Accept: "application/javascript",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: formData,
    };
    try {
      const response = await fetch(theme.routes.cartAdd, fetchRequestOpts);
      const data = await response.json();
      let error =
        typeof data.description === "string" ? data.description : data.message;
      if (data.errors && typeof data.errors === "object") {
        error = Object.entries(data.errors).map((item) => item[1].join(", "));
      }
      if (data.status) this.setErrorMsgState(error);
      if (!response.ok) throw new Error(response.status);
      if (document.querySelector(".template-cart")) {
        const cartForm = document.querySelector("cart-form");
        if (cartForm && cartForm.enableAjaxUpdate) {
          cartForm.refresh();
        }
      } else if (theme.settings.afterAddToCart === "page") {
        setTimeout(() => {
          window.location.href = theme.routes.cart;
        }, 300);
      } else {
        sectionsToUpdate.forEach((el) => {
          el.updateFromCartChange(data.sections[el.dataset.sectionId]);
        });
        if (theme.settings.afterAddToCart === "notification") {
          const notification = document
            .getElementById("AddedNotification")
            .content.firstElementChild.cloneNode(!0);
          notification.dataset.productTitle = data.product_title;
          let notificationContainer = document.querySelector(
            ".pageheader--sticky"
          );
          if (!notificationContainer) {
            notificationContainer = document.querySelector("body");
          }
          notificationContainer.appendChild(notification);
        } else if (theme.settings.afterAddToCart === "drawer") {
          document.querySelector(".js-cart-drawer").open();
        }
      }
      this.dispatchEvent(
        new CustomEvent("on:cart:add", {
          bubbles: !0,
          detail: { variantId: data.variant_id },
        })
      );
      this.submitBtn.classList.add("is-success");
      this.submitBtn.removeAttribute("aria-disabled");
      setTimeout(() => {
        this.submitBtn.classList.remove("is-loading");
        this.submitBtn.classList.remove("is-success");
      }, 2000);
    } catch (error) {
      console.log(error);
      this.dispatchEvent(
        new CustomEvent("on:cart:error", {
          bubbles: !0,
          detail: { error: this.errorMsg.textContent },
        })
      );
      this.submitBtn.classList.remove("is-loading");
      this.submitBtn.classList.remove("is-success");
      this.submitBtn.removeAttribute("aria-disabled");
    }
  }
  setErrorMsgState(error = !1) {
    this.errorMsg = this.errorMsg || this.querySelector(".js-form-error");
    if (!this.errorMsg) return;
    this.errorMsg.hidden = !error;
    if (error) {
      this.errorMsg.innerHTML = "";
      const errorArray = Array.isArray(error) ? error : [error];
      errorArray.forEach((err, index) => {
        if (index > 0) this.errorMsg.insertAdjacentHTML("beforeend", "<br>");
        this.errorMsg.insertAdjacentText("beforeend", err);
      });
    }
  }
  validate() {
    let isValid = !0;
    this.querySelectorAll("variant-picker .option-selector").forEach((el) => {
      if (el.dataset.selectorType === "listed") {
        const input = el.querySelector("input");
        const inputIsValid = input.reportValidity();
        if (!inputIsValid) {
          isValid = !1;
        }
      } else {
        el.querySelectorAll(".label__prefix").forEach((label) =>
          label.remove()
        );
        el.querySelectorAll(".label--contains-error").forEach((label) =>
          label.classList.remove("label--contains-error")
        );
        const selectedOption = el.querySelector(
          '.custom-select .js-option[aria-selected="true"]'
        );
        if (!selectedOption) {
          const label = el.querySelector(".label");
          label.setAttribute("aria-live", "polite");
          label.classList.add("label--contains-error");
          const labelPrefix = document.createElement("span");
          labelPrefix.innerText = `${theme.strings.productsProductChooseA} `;
          labelPrefix.className = "label__prefix";
          label.prepend(labelPrefix);
          theme.scrollToRevealElement(el);
          isValid = !1;
        }
      }
    });
    return isValid;
  }
};
window.customElements.define("product-form", ProductForm);
class ProductInventory extends HTMLElement {
  constructor() {
    super();
    window.initLazyScript(this, this.initLazySection.bind(this));
  }
  initLazySection() {
    this.threshold = parseInt(this.dataset.threshold, 10);
    this.productInventory = this.querySelector(".product-inventory");
    this.inventoryNotice = this.querySelector(".product-inventory__status");
    this.variantInventory = this.getVariantInventory();
    this.closest(".js-product").addEventListener(
      "on:variant:change",
      this.handleVariantChange.bind(this)
    );
  }
  getVariantInventory() {
    const dataEl = this.querySelector('[type="application/json"]');
    return this.variantInventory || JSON.parse(dataEl.textContent);
  }
  handleVariantChange(evt) {
    this.updateInventory(
      evt.detail.variant
        ? this.variantInventory.find((v) => v.id === evt.detail.variant.id)
        : null
    );
  }
  updateInventory(inventory) {
    if (!inventory) {
      this.productInventory.hidden = !0;
      return;
    }
    const count = inventory.inventory_quantity;
    const showCount =
      this.dataset.showInventoryCount === "always" ||
      (this.dataset.showInventoryCount === "low" && count <= this.threshold);
    let notice = null;
    if (showCount) {
      if (count <= this.threshold) {
        notice = this.dataset.textXLeftLow.replace("[QTY]", count);
      } else {
        notice = this.dataset.textXLeftOk.replace("[QTY]", count);
      }
    } else {
      if (count <= this.threshold) {
        notice = this.dataset.textLow;
      } else {
        notice = this.dataset.textOk;
      }
    }
    this.productInventory.classList.toggle(
      "product-inventory--low",
      count <= this.threshold
    );
    this.productInventory.classList.toggle(
      "product-inventory--ok",
      count > this.threshold
    );
    this.inventoryNotice.innerText = notice;
    this.productInventory.hidden = !1;
  }
}
customElements.define("product-inventory", ProductInventory);
if (!customElements.get("quantity-wrapper")) {
  class QuantityWrapper extends HTMLElement {
    connectedCallback() {
      this.addEventListener("click", this.handleClick.bind(this));
    }
    handleClick(evt) {
      const btn = evt.target.closest("[data-quantity]");
      if (btn) {
        evt.preventDefault();
        const input = this.querySelector('[name="quantity"]');
        let change = btn.dataset.quantity === "up" ? 1 : -1;
        if (input.step) {
          change *= parseInt(input.step, 10);
        }
        input.value = Math.max(1, parseInt(input.value, 10) + change);
        input.dispatchEvent(
          new CustomEvent("change", { bubbles: !0, cancelable: !1 })
        );
      }
    }
  }
  customElements.define("quantity-wrapper", QuantityWrapper);
}
if (theme.settings.quickbuyStyle !== "off") {
  theme.quickbuy = {
    quickbuyResizeObserver: null,
    init: () => {
      theme.quickbuy.quickbuyResizeObserver = new ResizeObserver((entries) => {
        for (let i = 0; i < entries.length; i += 1) {
          const entry = entries[i];
          if (entry.contentBoxSize || entry.contentRect) {
            theme.quickbuy.debouncedQuickbuyResize(entry.target);
          }
        }
      });
      theme.addDelegateEventListener(
        document,
        "click",
        ".quickbuy-toggle",
        (evt, delEl) => {
          const productUrl = delEl.href;
          if (window.innerWidth >= 768) {
            evt.preventDefault();
            if (theme.quickbuy.currentRequestAbortController) {
              theme.quickbuy.currentRequestAbortController.abort();
            }
            theme.quickbuy.currentRequestAbortController =
              new AbortController();
            const block = delEl.closest(".product-block");
            const slider = delEl.closest(".collection-slider");
            let detailCont = null;
            let quickbuyCont = null;
            let sliderRow = null;
            if (slider) {
              sliderRow = slider.closest(".collection-slider-row");
              if (!sliderRow.querySelector(".quickbuy-container")) {
                return;
              }
              quickbuyCont = sliderRow.querySelector(".quickbuy-container");
            } else {
              theme.quickbuy.setBlockHeights(block);
              quickbuyCont = block.querySelector(".quickbuy-container");
            }
            detailCont = quickbuyCont.querySelector(".inner");
            block.classList.toggle("expanded");
            if (block.classList.contains("expanded")) {
              quickbuyCont.dispatchEvent(
                new CustomEvent("on:quickbuy:before-open", { bubbles: !0 })
              );
              if (slider) {
                const otherExpanded = Array.from(
                  slider.querySelectorAll(".product-block.expanded")
                ).filter((el) => el !== block);
                otherExpanded.forEach((el) => el.classList.remove("expanded"));
                if (otherExpanded.length === 0) {
                  quickbuyCont.style.height = 0;
                }
              } else {
                [...block.parentElement.children].forEach((el) => {
                  if (el !== block && el.classList.contains("expanded")) {
                    theme.quickbuy.contractDetail(el, !0);
                  }
                });
              }
              theme.quickbuy.quickbuyResizeObserver.disconnect();
              theme.quickbuy.quickbuyResizeObserver.observe(detailCont);
              detailCont.innerHTML = '<div class="loading-spinner"></div>';
              fetch(productUrl, {
                method: "get",
                signal: theme.quickbuy.currentRequestAbortController.signal,
              })
                .then((response) => {
                  if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                  }
                  return response.text();
                })
                .then((response) => {
                  const tmpl = document.createElement("template");
                  tmpl.innerHTML = response;
                  const newDetail = tmpl.content
                    .querySelector(".quickbuy-content")
                    .cloneNode(!0);
                  newDetail.querySelectorAll(".more").forEach((el) => {
                    el.href = productUrl;
                  });
                  newDetail.querySelectorAll(".product-title").forEach((el) => {
                    el.innerHTML = `<a href="">${el.innerHTML}</a>`;
                    el.firstElementChild.href = productUrl;
                  });
                  newDetail.querySelectorAll(".show-gallery").forEach((el) => {
                    el.classList.remove("show-gallery");
                    el.href = productUrl;
                  });
                  newDetail
                    .querySelectorAll(".not-in-quickbuy")
                    .forEach((el) => {
                      el.remove();
                    });
                  newDetail
                    .querySelectorAll(".only-in-quickbuy")
                    .forEach((el) => {
                      el.classList.remove("only-in-quickbuy");
                    });
                  newDetail
                    .querySelectorAll(".sticky-content-container")
                    .forEach((el) => {
                      el.classList.remove("sticky-content-container");
                    });
                  newDetail
                    .querySelectorAll("pickup-availability")
                    .forEach((el) => {
                      el.remove();
                    });
                  newDetail
                    .querySelectorAll('variant-picker[data-update-url="true"]')
                    .forEach((el) => {
                      el.dataset.updateUrl = !1;
                    });
                  newDetail
                    .querySelectorAll("noscript")
                    .forEach((el) => el.remove());
                  newDetail
                    .querySelectorAll(
                      ".media-gallery .main-image carousel-slider"
                    )
                    .forEach((el) => {
                      el.classList.remove("mobile-only");
                    });
                  newDetail
                    .querySelectorAll(".product-media-collage")
                    .forEach((el) => {
                      el.remove();
                    });
                  newDetail
                    .querySelectorAll(".media-gallery .thumbnails")
                    .forEach((el) => {
                      el.classList.remove("mobile-only");
                    });
                  [
                    "media-gallery--layout-carousel-beside",
                    "media-gallery--layout-columns-1",
                    "media-gallery--layout-columns-2",
                    "media-gallery--layout-collage-1",
                    "media-gallery--layout-collage-2",
                  ].forEach((cl) => {
                    newDetail.querySelectorAll(`.${cl}`).forEach((el) => {
                      el.classList.remove(cl);
                      el.classList.add("media-gallery--layout-carousel-under");
                    });
                  });
                  tmpl.content
                    .querySelectorAll(
                      '.section-main-product link[rel="stylesheet"]'
                    )
                    .forEach((el) => {
                      if (
                        !document.querySelector(
                          `link[rel="stylesheet"][href="${el.getAttribute(
                            "href"
                          )}"]`
                        )
                      ) {
                        document.head.insertAdjacentHTML(
                          "beforeend",
                          el.outerHTML
                        );
                      }
                    });
                  tmpl.content
                    .querySelectorAll(".section-main-product script[src]")
                    .forEach((el) => {
                      if (
                        !document.querySelector(
                          `script[src="${el.getAttribute("src")}"]`
                        )
                      ) {
                        const scr = document.createElement("script");
                        scr.src = el.getAttribute("src");
                        scr.defer = "defer";
                        document.head.appendChild(scr);
                      }
                    });
                  detailCont.innerHTML = "";
                  detailCont.appendChild(newDetail);
                  quickbuyCont.dispatchEvent(
                    new CustomEvent("on:quickbuy:after-open", { bubbles: !0 })
                  );
                });
              const closeButton = quickbuyCont.querySelector(".close-detail");
              closeButton.removeAttribute("tabindex");
              closeButton.addEventListener(
                "click",
                theme.quickbuy.onCloseClick
              );
              const scrollOffset = -120 - theme.stickyHeaderHeight();
              if (slider) {
                window.scrollTo({
                  top: theme.getOffsetTopFromDoc(quickbuyCont) + scrollOffset,
                  behavior: "smooth",
                });
              } else {
                theme.quickbuy.saveProductGridSpacingData();
                window.scrollTo({
                  top:
                    parseFloat(
                      block.dataset.qbScrollTo ||
                        theme.getOffsetTopFromDoc(quickbuyCont)
                    ) + scrollOffset,
                  behavior: "smooth",
                });
              }
            } else {
              if (slider) {
                quickbuyCont.style.height = "0px";
                setTimeout(() => {
                  if (quickbuyCont.style.height === "0px") {
                    detailCont.innerHTML = "";
                  }
                }, parseFloat(getComputedStyle(quickbuyCont).transitionDuration) * 1000);
              } else {
                theme.quickbuy.contractDetail(block);
              }
              setTimeout(() => {
                window.scrollTo({
                  top:
                    theme.getOffsetTopFromDoc(block) -
                    theme.stickyHeaderHeight() -
                    20,
                  behavior: "smooth",
                });
              }, 100);
              const closeButton = quickbuyCont.querySelector(".close-detail");
              closeButton.setAttribute("tabindex", "-1");
              closeButton.removeEventListener(
                "click",
                theme.quickbuy.onCloseClick
              );
            }
          }
        }
      );
    },
    debouncedQuickbuyResizeTimeoutID: -1,
    debouncedQuickbuyResize: (qbInner) => {
      clearTimeout(theme.quickbuy.debouncedQuickbuyResizeTimeoutID);
      theme.quickbuy.debouncedQuickbuyResizeTimeoutID = setTimeout(() => {
        const qbc = qbInner.closest(".quickbuy-container");
        const block = qbc.closest(".product-block");
        if (block) {
          if (block.classList.contains("expanded")) {
            const targetHeight = qbInner.clientHeight;
            block.style.paddingBottom = `${targetHeight + 20}px`;
            qbc.style.height = `${targetHeight}px`;
          }
        }
        if (qbInner.childElementCount > 0) {
          qbc.style.height = `${qbInner.clientHeight}px`;
        }
      }, 100);
    },
    contractDetail: (block, instant) => {
      theme.quickbuy.quickbuyResizeObserver.disconnect();
      clearTimeout(theme.quickbuy.debouncedQuickbuyResizeTimeoutID);
      block.classList.remove("expanded");
      const quickbuyCont = block.querySelector(".quickbuy-container");
      if (instant) {
        quickbuyCont.style.transitionDuration = "0ms";
        block.style.transitionDuration = "0ms";
      }
      quickbuyCont.style.height = 0;
      block.style.paddingBottom = 0;
      const msToClose =
        parseFloat(getComputedStyle(quickbuyCont).transitionDuration) * 1000;
      setTimeout(() => {
        if (quickbuyCont.style.height === "0px") {
          quickbuyCont.querySelector(".inner").innerHTML = "";
        }
        if (instant) {
          quickbuyCont.style.transitionDuration = "";
          block.style.transitionDuration = "";
        }
      }, msToClose);
      quickbuyCont.dispatchEvent(
        new CustomEvent("on:quickbuy:after-close", { bubbles: !0 })
      );
    },
    saveProductGridSpacingData: () => {
      document.querySelectorAll(".product-grid").forEach((el) => {
        const blocks = el.querySelectorAll(".product-block .block-inner");
        if (blocks.length <= 1) return;
        let row = 0;
        let currTop = 0;
        let runningHeight = 0;
        const gutter = parseFloat(getComputedStyle(el).rowGap);
        const listingOffset = theme.getOffsetTopFromDoc(blocks[0]);
        const rowOffsets = [listingOffset];
        blocks.forEach((block, index) => {
          if (block.clientHeight > runningHeight) {
            runningHeight = block.clientHeight;
          }
          const currOffsetTop = theme.getOffsetTopFromDoc(block);
          if (index === 0) {
            currTop = currOffsetTop;
          } else if (currOffsetTop > currTop) {
            row += 1;
            currTop = currOffsetTop;
            rowOffsets.push(gutter + runningHeight + rowOffsets[row - 1]);
            runningHeight = 0;
          }
          block.dataset.gridRow = row;
        });
        blocks.forEach((block) => {
          block.dataset.qbScrollTo =
            rowOffsets[block.dataset.gridRow] + block.clientHeight;
        });
      });
    },
    setBlockHeights: (block) => {
      const list = block.closest(".product-grid");
      if (!list) return;
      let tallest = 0;
      const blockTop = block.offsetTop;
      const blocksInThisRow = [
        ...list.querySelectorAll(".product-block"),
      ].filter((el) => el.offsetTop === blockTop);
      blocksInThisRow.forEach((el) => {
        const elInnerHeight = el.querySelector(
          ".block-inner .block-inner-inner"
        ).clientHeight;
        if (elInnerHeight > tallest) tallest = elInnerHeight;
      });
      blocksInThisRow.forEach((el) => {
        el.querySelector(".block-inner").style.setProperty(
          "--qb-block-height",
          `${tallest}px`
        );
      });
    },
    onCloseClick: (evt) => {
      evt.preventDefault();
      evt.stopPropagation();
      const slider = evt.target.closest(".collection-slider-row");
      if (slider) {
        slider
          .querySelector(".product-block.expanded .quickbuy-toggle")
          .dispatchEvent(
            new CustomEvent("click", { bubbles: !0, cancelable: !0 })
          );
      } else {
        evt.target
          .closest(".product-block")
          .querySelector(".quickbuy-toggle")
          .dispatchEvent(
            new CustomEvent("click", { bubbles: !0, cancelable: !0 })
          );
      }
    },
  };
  theme.quickbuy.init();
}
class CarouselSlider extends HTMLElement {
  constructor() {
    super();
    this.slides = [...this.querySelectorAll(".slider__item:not([hidden])")];
    if (this.slides.length < 2) {
      this.setCarouselState(!1);
      return;
    }
    window.initLazyScript(this, this.init.bind(this));
  }
  init() {
    this.slider = this.querySelector(".slider");
    this.grid = this.querySelector(".slider__grid");
    this.nav = this.querySelector(".slider-nav");
    this.rtl = document.dir === "rtl";
    if (this.nav) {
      this.prevBtn = this.querySelector('button[name="prev"]');
      this.nextBtn = this.querySelector('button[name="next"]');
    }
    this.initSlider();
    window.addEventListener(
      "on:debounced-resize",
      this.handleResize.bind(this)
    );
    this.setAttribute("loaded", "");
  }
  initSlider() {
    this.gridWidth = this.grid.clientWidth;
    this.slideSpan =
      this.getWindowOffset(this.slides[1]) -
      this.getWindowOffset(this.slides[0]);
    this.currentIndex =
      Math.round(this.slider.scrollLeft / this.slideSpan) || 0;
    this.slideGap = this.slideSpan - this.slides[0].clientWidth;
    this.slidesPerPage = Math.round(
      (this.gridWidth + this.slideGap) / this.slideSpan
    );
    this.slidesToScroll =
      theme.settings.sliderItemsPerNav === "page" ? this.slidesPerPage : 1;
    this.totalPages = this.slides.length - this.slidesPerPage + 1;
    this.setCarouselState(this.totalPages > 1);
    if (this.dataset.dynamicHeight === "true") {
      this.updateDynamicHeight();
    }
    this.addListeners();
    if (this.totalPages < 2 || !this.nav) return;
    this.sliderStart = this.getWindowOffset(this.slider);
    if (!this.sliderStart)
      this.sliderStart = (this.slider.clientWidth - this.gridWidth) / 2;
    this.sliderEnd = this.sliderStart + this.gridWidth;
    if (window.matchMedia("(pointer: fine)").matches) {
      this.slider.classList.add("is-grabbable");
    }
    this.setButtonStates();
  }
  refresh() {
    if (this.hasAttribute("loaded")) {
      this.removeListeners();
      this.style.removeProperty("--current-slide-height");
    }
    this.slides = [...this.querySelectorAll(".slider__item:not([hidden])")];
    if (this.slides.length < 2) {
      this.setCarouselState(!1);
      return;
    }
    this.init();
  }
  addListeners() {
    this.scrollHandler = debounce(this.handleScroll.bind(this), 100);
    this.slider.addEventListener("scroll", this.scrollHandler);
    if (this.nav) {
      this.navClickHandler = this.handleNavClick.bind(this);
      this.nav.addEventListener("click", this.navClickHandler);
    }
    if (window.matchMedia("(pointer: fine)").matches) {
      this.mousedownHandler = this.handleMousedown.bind(this);
      this.mouseupHandler = this.handleMouseup.bind(this);
      this.mousemoveHandler = this.handleMousemove.bind(this);
      this.slider.addEventListener("mousedown", this.mousedownHandler);
      this.slider.addEventListener("mouseup", this.mouseupHandler);
      this.slider.addEventListener("mouseleave", this.mouseupHandler);
      this.slider.addEventListener("mousemove", this.mousemoveHandler);
    }
  }
  removeListeners() {
    this.slider.removeEventListener("scroll", this.scrollHandler);
    if (this.nav) {
      this.nav.removeEventListener("click", this.navClickHandler);
    }
    if (window.matchMedia("(pointer: fine)").matches) {
      this.slider.removeEventListener("mousedown", this.mousedownHandler);
      this.slider.removeEventListener("mouseup", this.mouseupHandler);
      this.slider.removeEventListener("mouseleave", this.mouseupHandler);
      this.slider.removeEventListener("mousemove", this.mousemoveHandler);
    }
  }
  handleScroll() {
    const previousIndex = this.currentIndex;
    this.currentIndex = Math.round(
      Math.abs(this.slider.scrollLeft) / this.slideSpan
    );
    if (this.nav) {
      this.setButtonStates();
    }
    if (this.dataset.dynamicHeight === "true") {
      this.updateDynamicHeight();
    }
    if (
      this.dataset.dispatchEvents === "true" &&
      previousIndex !== this.currentIndex
    ) {
      this.dispatchEvent(
        new CustomEvent("on:carousel-slider:select", {
          bubbles: !0,
          detail: {
            index: this.currentIndex,
            slide: this.slides[this.currentIndex],
          },
        })
      );
    }
  }
  handleMousedown(evt) {
    this.mousedown = !0;
    this.startX = evt.pageX - this.sliderStart;
    this.scrollPos = this.slider.scrollLeft;
    this.slider.classList.add("is-grabbing");
  }
  handleMouseup() {
    this.mousedown = !1;
    this.slider.classList.remove("is-grabbing");
  }
  handleMousemove(evt) {
    if (!this.mousedown) return;
    evt.preventDefault();
    const x = evt.pageX - this.sliderStart;
    this.slider.scrollLeft = this.scrollPos - (x - this.startX) * 2;
  }
  handleNavClick(evt) {
    if (!evt.target.matches(".slider-nav__btn")) return;
    if (
      (evt.target.name === "next" && !this.rtl) ||
      (evt.target.name === "prev" && this.rtl)
    ) {
      this.scrollPos =
        this.slider.scrollLeft + this.slidesToScroll * this.slideSpan;
    } else {
      this.scrollPos =
        this.slider.scrollLeft - this.slidesToScroll * this.slideSpan;
    }
    this.slider.scrollTo({ left: this.scrollPos, behavior: "smooth" });
  }
  handleResize() {
    if (this.nav) this.removeListeners();
    this.initSlider();
  }
  scrollToElement(el, transition) {
    if (!this.getSlideVisibility(el)) {
      this.scrollPos = el.offsetLeft;
      this.slider.scrollTo({
        left: this.scrollPos,
        behavior: transition || "smooth",
      });
    }
  }
  updateDynamicHeight() {
    this.style.setProperty(
      "--current-slide-height",
      `${this.slides[this.currentIndex].firstElementChild.clientHeight}px`
    );
  }
  getWindowOffset(el) {
    return this.rtl
      ? window.innerWidth - el.getBoundingClientRect().right
      : el.getBoundingClientRect().left;
  }
  getSlideVisibility(el) {
    const slideStart = this.getWindowOffset(el);
    const slideEnd = Math.floor(slideStart + this.slides[0].clientWidth);
    return slideStart >= this.sliderStart && slideEnd <= this.sliderEnd;
  }
  setCarouselState(active) {
    if (active) {
      this.removeAttribute("inactive");
      if (this.gridWidth !== this.grid.clientWidth) {
        this.handleBreakpointChange();
      }
    } else {
      this.setAttribute("inactive", "");
    }
  }
  setButtonStates() {
    this.prevBtn.disabled =
      this.getSlideVisibility(this.slides[0]) && this.slider.scrollLeft === 0;
    this.nextBtn.disabled = this.getSlideVisibility(
      this.slides[this.slides.length - 1]
    );
  }
}
customElements.define("carousel-slider", CarouselSlider);
const TermsAgreement = class extends HTMLElement {
  connectedCallback() {
    this.delegatedEvent = theme.addDelegateEventListener(
      document,
      "click",
      '#cartform [name="checkout"], .additional-checkout-buttons input, a[href*="/checkout"]',
      this.handleFormSubmittingEvent.bind(this)
    );
  }
  disconnectedCallback() {
    document.removeEventListener("click", this.delegatedEvent);
  }
  handleFormSubmittingEvent(evt) {
    if (!this.querySelector("input:checked")) {
      evt.preventDefault();
      theme.showQuickPopup(
        theme.strings.cartTermsConfirmation,
        this.querySelector('[type="checkbox"]')
      );
    }
  }
};
window.customElements.define("terms-agreement", TermsAgreement);
const ToggleTarget = class extends HTMLElement {
  constructor() {
    super();
    this.addEventListener("click", this.toggleOpen.bind(this));
    this.addEventListener("keyup", this.handleKeyUp.bind(this));
    if (this.dataset.toggleCloseLabel) {
      this.dataset.toggleOpenLabel = this.innerHTML;
    }
  }
  handleKeyUp(evt) {
    if (evt.key === "Enter") this.toggleOpen(evt);
  }
  toggleOpen(evt) {
    evt.preventDefault();
    const target = document.querySelector(this.dataset.toggleTarget);
    const transCont = target.querySelector(".toggle-target-container");
    const doCollapse = !target.classList.contains("toggle-target--hidden");
    const transitionDuration =
      parseFloat(getComputedStyle(target).transitionDuration) * 1000;
    if (!target.classList.contains("toggle-target--in-transition")) {
      if (doCollapse) {
        this.classList.add("toggle-target-toggler--is-hidden");
        target.classList.add(
          "toggle-target--in-transition",
          "toggle-target--hiding"
        );
        target.style.height = `${transCont.clientHeight}px`;
        target.style.opacity = 1;
        if (this.dataset.toggleCloseLabel) {
          this.innerHTML = this.dataset.toggleOpenLabel;
        }
        setTimeout(() => {
          target.style.height = 0;
          target.style.opacity = 0;
          setTimeout(() => {
            target.classList.add("toggle-target--hidden");
            target.classList.remove(
              "toggle-target--in-transition",
              "toggle-target--hiding"
            );
            target.style.height = "";
            target.style.opacity = "";
          }, transitionDuration);
        }, 10);
      } else {
        this.classList.remove("toggle-target-toggler--is-hidden");
        target.classList.add(
          "toggle-target--in-transition",
          "toggle-target--revealing"
        );
        target.style.height = 0;
        target.style.opacity = 0;
        target.style.display = "block";
        if (this.dataset.toggleCloseLabel) {
          this.innerHTML = this.dataset.toggleCloseLabel;
        }
        setTimeout(() => {
          target.style.height = `${transCont.clientHeight}px`;
          target.style.opacity = 1;
          setTimeout(() => {
            target.classList.remove(
              "toggle-target--hidden",
              "toggle-target--in-transition",
              "toggle-target--revealing"
            );
            target.style.height = "";
            target.style.opacity = "";
            target.style.display = "";
          }, transitionDuration);
        }, 10);
      }
    }
  }
};
window.customElements.define("toggle-target", ToggleTarget);
class VariantContent extends HTMLElement {
  constructor() {
    super();
    if (this.childElementCount > 0) {
      this.closest(".js-product").addEventListener(
        "on:variant:change",
        this.handleVariantChange.bind(this)
      );
    }
  }
  handleVariantChange(evt) {
    [...this.childNodes]
      .filter((el) => el.tagName !== "SCRIPT")
      .forEach((el) => el.remove());
    this.querySelectorAll(":not(script)").forEach((el) => el.remove());
    const contentToShow = this.querySelector(
      `[data-variant="${evt.detail.variant ? evt.detail.variant.id : ""}"]`
    );
    if (contentToShow) {
      this.insertAdjacentHTML("beforeend", contentToShow.innerHTML);
    }
  }
}
customElements.define("variant-content", VariantContent);
const AnnouncementBar = class extends HTMLElement {
  constructor() {
    super();
    this.announcements = this.querySelectorAll(".announcement");
    if (this.announcements.length > 1) {
      this.backgrounds = Array.from(this.querySelectorAll(".announcement-bg"));
      this.changeDelay = 5000;
      this.currentAnnouncement = 0;
      this.querySelector(".announcement-bar__middle").addEventListener(
        "focusin",
        this.pauseAnnouncements.bind(this)
      );
      this.querySelector(".announcement-bar__middle").addEventListener(
        "focusout",
        this.playAnnouncements.bind(this)
      );
      this.querySelector(".announcement-button--previous").addEventListener(
        "click",
        this.previousAnnouncement.bind(this)
      );
      this.querySelector(".announcement-button--next").addEventListener(
        "click",
        this.nextAnnouncement.bind(this)
      );
      this.observer = new IntersectionObserver(this.handleIntersect.bind(this));
      this.observer.observe(this);
    }
  }
  handleIntersect(entries) {
    entries.forEach((entry) => {
      if (entry.target === this) {
        if (entry.isIntersecting) {
          this.playAnnouncements(this);
        } else {
          this.pauseAnnouncements(this);
        }
      }
    });
  }
  playAnnouncements() {
    if (this.announcements.length > 1) {
      this.announcementInterval = setInterval(() => {
        this.setCurrentAnnouncement(this.currentAnnouncement + 1);
      }, this.changeDelay);
    }
  }
  pauseAnnouncements() {
    if (this.announcementInterval) {
      clearInterval(this.announcementInterval);
    }
  }
  setCurrentAnnouncement(newIndex) {
    this.currentAnnouncement = newIndex % this.announcements.length;
    this.announcements.forEach((announcement, index) => {
      const background = this.backgrounds.find(
        (bg) => bg.dataset.index === index.toString()
      );
      if (index !== this.currentAnnouncement) {
        announcement.classList.add("announcement--inactive");
        if (background) {
          background.classList.remove("is-active");
        }
      } else {
        announcement.classList.remove("announcement--inactive");
        if (background) {
          background.classList.add("is-active");
        }
      }
    });
    const headingColor =
      this.announcements[this.currentAnnouncement].style.getPropertyValue(
        "--heading-color"
      );
    const textColor =
      this.announcements[this.currentAnnouncement].style.getPropertyValue(
        "--text-color"
      );
    const linkColor =
      this.announcements[this.currentAnnouncement].style.getPropertyValue(
        "--link-color"
      );
    if (headingColor) {
      this.style.setProperty("--heading-color", headingColor);
    }
    if (textColor) {
      this.style.setProperty("--text-color", textColor);
    }
    if (linkColor) {
      this.style.setProperty("--link-color", linkColor);
    }
  }
  previousAnnouncement() {
    this.setCurrentAnnouncement(this.currentAnnouncement - 1);
  }
  nextAnnouncement() {
    this.setCurrentAnnouncement(this.currentAnnouncement + 1);
  }
};
window.customElements.define("announcement-bar", AnnouncementBar);
const ImageWithTextOverlay = class extends HTMLElement {
  constructor() {
    super();
    this.fullHeightContainer = this.classList.contains("height--full")
      ? this
      : this.querySelector(".height--full");
    if (this.fullHeightContainer) {
      if (this.closest(".shopify-section").previousElementSibling) return;
      const ph = document.querySelector(".pageheader");
      if (!ph) {
        this.fullHeightContainer.classList.add(
          "height--full-ignore-header-height"
        );
        return;
      }
      const thisOffsetTop = theme.getOffsetTopFromDoc(this);
      const phOffsetTop = theme.getOffsetTopFromDoc(ph);
      if (phOffsetTop - 5 > thisOffsetTop) {
        this.fullHeightContainer.classList.add(
          "height--full-ignore-header-height"
        );
        return;
      }
      this.fullHeightContainer.classList.add(
        "height--full-minus-header-height"
      );
      this.checkForHeaderHeightSubtraction();
      const handleResize = debounce(
        this.checkForHeaderHeightSubtraction.bind(this),
        300
      );
      this.resizeObserver = new ResizeObserver((entries) => {
        for (let i = 0; i < entries.length; i += 1) {
          const entry = entries[i];
          if (entry.contentBoxSize || entry.contentRect) {
            handleResize();
          }
        }
      });
      this.resizeObserver.observe(this);
    }
  }
  checkForHeaderHeightSubtraction() {
    let height = window.innerHeight;
    if (
      document.querySelector(".pageheader--transparent-permitted") &&
      !this.closest(".shopify-section").previousElementSibling
    ) {
      document
        .querySelectorAll(".section-store-messages, .section-announcement-bar")
        .forEach((el) => {
          height -= el.clientHeight;
        });
    } else {
      height -= document.querySelector(".section-header").clientHeight;
    }
    this.fullHeightContainer.style.setProperty("--image-height", `${height}px`);
  }
};
window.customElements.define("image-with-text-overlay", ImageWithTextOverlay);
const PageHeader = class extends HTMLElement {
  constructor() {
    super();
    if (this.querySelector(".main-search")) {
      theme.addDelegateEventListener(
        this,
        "click",
        ".show-search-link",
        (evt) => {
          evt.preventDefault();
          document.body.classList.add("show-search");
          setTimeout(() => {
            this.querySelector(".main-search__input").focus();
          }, 500);
        }
      );
    }
    theme.inlineNavigationCheck();
    if (
      theme.settings.cartType === "drawer" &&
      document.querySelector(".js-cart-drawer") &&
      this.querySelector(".cart-link")
    ) {
      theme.addDelegateEventListener(this, "click", ".cart-link", (evt) => {
        evt.preventDefault();
        document.querySelector(".js-cart-drawer").open();
      });
    }
    if (
      window.Shopify.designMode &&
      document.body.classList.contains("reveal-mobile-nav")
    ) {
      theme.openMobileNav();
    }
    setTimeout(() => theme.manuallyLoadImages(this), 250);
  }
  connectedCallback() {
    this.section = document.querySelector(".section-header");
    this.transparentPageheader = document.querySelector(
      ".pageheader--transparent-permitted"
    );
    this.setTransparency();
    this.setSticky();
    this.setHeaderHeightProperty();
    window.addEventListener("scroll", this.afterScroll.bind(this));
    this.refreshHeader = () => {
      fetch(`${window.location.origin}?sections=header`)
        .then((response) => response.json())
        .then((data) => {
          const template = document.createElement("template");
          template.innerHTML = data.header;
          const selectorsForRefresh = [
            "#pageheader .logo-area__right__inner .cart-link .cart-link__icon .cart-link__count",
          ];
          for (let i = 0; i < selectorsForRefresh.length; i += 1) {
            const newEl = template.content.querySelector(
              selectorsForRefresh[i]
            );
            const currentEl = this.querySelector(selectorsForRefresh[i]);
            currentEl.innerHTML = newEl.innerHTML;
          }
        });
    };
    document.addEventListener("on:cart:change", this.refreshHeader);
    const debouncedAfterResize = debounce(this.afterResize.bind(this), 300);
    this.resizeObserver = new ResizeObserver((entries) => {
      for (let i = 0; i < entries.length; i += 1) {
        const entry = entries[i];
        if (entry.contentBoxSize || entry.contentRect) {
          debouncedAfterResize();
        }
      }
    });
    this.resizeObserver.observe(this);
  }
  disconnectedCallback() {
    this.resizeObserver.disconnect();
    document.removeEventListener("on:cart:change", this.refreshHeader);
  }
  afterScroll() {
    this.setTransparency();
  }
  afterResize() {
    if (theme.inlineNavigationCheck) {
      theme.inlineNavigationCheck();
    }
    this.setSticky();
    this.setHeaderHeightProperty();
  }
  setTransparency() {
    if (this.transparentPageheader) {
      const bar = document.querySelector(".section-announcement-bar");
      const scrollThreshold = bar ? bar.offsetTop + bar.clientHeight : 0;
      if (!this.isSticky || window.scrollY <= scrollThreshold) {
        this.transparentPageheader.classList.add("pageheader--transparent");
      } else {
        this.transparentPageheader.classList.remove("pageheader--transparent");
      }
    }
  }
  setSticky() {
    this.isSticky =
      getComputedStyle(this.section).position === "sticky" ||
      getComputedStyle(this.section).position === "-webkit-sticky";
  }
  setHeaderHeightProperty() {
    let headerHeight = 0;
    let stickyHeaderHeight = 0;
    if (this.section) {
      headerHeight = Math.ceil(this.section.clientHeight);
      if (this.isSticky) {
        stickyHeaderHeight = headerHeight;
      }
    }
    document.documentElement.style.setProperty(
      "--theme-header-height",
      `${headerHeight}px`
    );
    document.documentElement.style.setProperty(
      "--theme-sticky-header-height",
      `${stickyHeaderHeight}px`
    );
  }
  updateFromCartChange(html) {
    const selectorForUpdate = ".logo-area__right";
    const template = document.createElement("template");
    template.innerHTML = html;
    const elToUpdate = this.querySelector(selectorForUpdate);
    if (elToUpdate) {
      elToUpdate.innerHTML =
        template.content.querySelector(selectorForUpdate).innerHTML;
    }
  }
};
window.customElements.define("page-header", PageHeader);
const RelatedCollectionLinkButtons = class extends HTMLElement {
  constructor() {
    super();
    const handleResize = debounce(this.truncateButtons.bind(this), 300);
    this.resizeObserver = new ResizeObserver((entries) => {
      for (let i = 0; i < entries.length; i += 1) {
        const entry = entries[i];
        if (entry.contentBoxSize || entry.contentRect) {
          handleResize();
        }
      }
    });
    this.resizeObserver.observe(this);
    this.truncateButtons();
  }
  truncateButtons() {
    if (getComputedStyle(this).display === "flex") {
      const limit = 4;
      const btns = this.querySelectorAll(".btn");
      if (
        btns.length > limit &&
        !this.querySelector(".related-collection-links__expander")
      ) {
        Array.from(btns)
          .slice(limit - 1)
          .forEach((el) => el.classList.add("hidden"));
        const expander = document.createElement("a");
        expander.className =
          "btn btn--tertiary related-collection-links__expander";
        expander.href = "#";
        expander.innerText = this.dataset.expanderBtnText;
        expander.addEventListener("click", (evt) => {
          evt.preventDefault();
          this.resizeObserver.disconnect();
          [...evt.currentTarget.parentElement.children].forEach((el) =>
            el.classList.remove("hidden")
          );
          evt.currentTarget.remove();
        });
        this.insertAdjacentElement("beforeend", expander);
      }
    } else {
      const expander = this.querySelector(
        ".related-collection-links__expander"
      );
      if (expander) {
        [...expander.parentElement.children].forEach((el) =>
          el.classList.remove("hidden")
        );
        expander.remove();
      }
    }
  }
};
window.customElements.define(
  "related-collection-link-buttons",
  RelatedCollectionLinkButtons
);
window.initLazyScript = initLazyScript;
if (!theme.Shopify) theme.Shopify = {};
try {
  theme.Shopify.features = JSON.parse(
    document.documentElement.querySelector("#shopify-features").textContent
  );
} catch (e) {
  theme.Shopify.features = {};
}
document.addEventListener("DOMContentLoaded", () => {
  const internalLinksSmoothScroll = (evt) => {
    const link =
      evt.target.tagName === "A" ? evt.target : evt.target.closest("a");
    if (
      link &&
      link.getAttribute("href") &&
      link.getAttribute("href").length > 1 &&
      link.getAttribute("href")[0] === "#"
    ) {
      const target = document.querySelector(link.getAttribute("href"));
      if (target && target.offsetParent) {
        evt.preventDefault();
        theme.scrollToRevealElement(target);
      }
    }
  };
  if (theme.settings.internalLinksSmoothScroll) {
    document.addEventListener("click", internalLinksSmoothScroll);
  }
  const tabCheck = (evt) => {
    if (evt.code === "Tab") {
      document.body.classList.add("tab-used");
      document.removeEventListener("keydown", tabCheck);
      document.removeEventListener("click", internalLinksSmoothScroll);
    }
  };
  document.addEventListener("keydown", tabCheck);
  if (theme.settings.externalLinksNewTab) {
    document.addEventListener("click", (evt) => {
      const link =
        evt.target.tagName === "A" ? evt.target : evt.target.closest("a");
      if (link.className === "qbubble__close") {
        return;
      }
      if (
        link &&
        link.href &&
        link.tagName === "A" &&
        window.location.hostname !== new URL(link.href).hostname
      ) {
        link.target = "_blank";
      }
    });
  }
  theme.addDelegateEventListener(
    document,
    "click",
    ".mobile-nav-toggle",
    (evt) => {
      evt.preventDefault();
      if (document.body.classList.contains("enable-mobile-nav-transition")) {
        document.body.classList.remove(
          "reveal-mobile-nav",
          "reveal-mobile-nav--revealed"
        );
        setTimeout(() => {
          document.body.classList.remove("enable-mobile-nav-transition");
        }, 750);
      } else {
        theme.openMobileNav();
      }
    }
  );
  theme.openMobileNav = () => {
    document.body.classList.add("enable-mobile-nav-transition");
    setTimeout(() => {
      document.body.classList.add("reveal-mobile-nav");
      const cs = getComputedStyle(
        document.querySelector(
          ".mobile-navigation-drawer .navigation__tier-1 > .navigation__item > .navigation__link"
        )
      );
      const delayS =
        parseFloat(cs.transitionDelay.split(",")[0]) +
        parseFloat(cs.transitionDuration.split(",")[0]);
      setTimeout(() => {
        document.body.classList.add("reveal-mobile-nav--revealed");
      }, delayS * 1000);
      theme.manuallyLoadImages(
        document.querySelector(".mobile-navigation-drawer")
      );
    }, 10);
  };
  const shade = document.querySelector(".page-shade");
  if (shade) {
    shade.addEventListener("click", (evt) => {
      evt.preventDefault();
      document.body.classList.remove("reveal-mobile-nav", "show-search");
      setTimeout(() => {
        document.body.classList.remove("enable-mobile-nav-transition");
      }, 750);
    });
  }
});
window.onpageshow = () => {
  fetch(`${theme.routes.cart}.js`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(async (data) => {
      const { items } = data;
      const cartString = items
        .map((item) => `${item.key}|${item.quantity}`)
        .join(",");
      const cartUint8 = new TextEncoder().encode(cartString);
      const cartHashBuffer = await crypto.subtle.digest("SHA-256", cartUint8);
      const cartHashArray = Array.from(new Uint8Array(cartHashBuffer));
      const cartHashHex = cartHashArray
        .map((x) => x.toString(16).padStart(2, "0"))
        .join("");
      const cartHash = cartHashHex.toString();
      const cartHashFromDom = document.querySelector(".cart-link").dataset.hash;
      if (cartHash !== cartHashFromDom) {
        document.dispatchEvent(
          new CustomEvent("on:cart:change", { bubbles: !0, cancelable: !1 })
        );
      }
    })
    .catch((error) => {
      console.log(error.message);
    });
};
