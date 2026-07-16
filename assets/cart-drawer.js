/* global SideDrawer */

class CartDrawer extends SideDrawer {
  connectedCallback() {
    this.bindEvents();
  }

  bindEvents() {
    this.openDrawerViaEventHandler = this.handleDrawerOpenViaEvent.bind(this);
    this.closeDrawerViaEventHandler = this.close.bind(this, null);
    document.addEventListener('dispatch:cart-drawer:open', this.openDrawerViaEventHandler);
    document.addEventListener('dispatch:cart-drawer:close', this.closeDrawerViaEventHandler);
    document.addEventListener('dispatch:cart-drawer:refresh', this.cartRefreshHandler);
    this.addEventListener('on:cart-drawer:before-open', () => {
      theme.manuallyLoadImages(this);
      this.querySelectorAll('cc-cart-cross-sell').forEach((el) => el.init());
    });
    this.addEventListener('on:cart:after-merge', () => {
      theme.manuallyLoadImages(this);
      this.querySelectorAll('cc-cart-cross-sell').forEach((el) => el.init());
    });

    // 点击（或键盘回车/空格）JULY20 / JULY250 时，自动把折扣码填入 ymq 输入框并触发 Apply。
    // 委托挂在持久的 <cart-drawer> 上，cart-form 局部刷新后依然有效。
    this.addEventListener('click', this.handleApplyDiscountClick.bind(this));
    this.addEventListener('keydown', this.handleApplyDiscountKeydown.bind(this));
  }

  /**
   * Delegated click handler for the JULY20 / JULY250 discount code links.
   * @param {Event} evt - Event object.
   */
  handleApplyDiscountClick(evt) {
    const trigger = evt.target.closest('.js-apply-discount');
    if (!trigger) return;
    evt.preventDefault();
    this.applyYmqDiscount(trigger.dataset.discountCode);
  }

  /**
   * Keyboard activation (Enter / Space) for the discount code links.
   * @param {KeyboardEvent} evt - Event object.
   */
  handleApplyDiscountKeydown(evt) {
    if (evt.key !== 'Enter' && evt.key !== ' ') return;
    const trigger = evt.target.closest('.js-apply-discount');
    if (!trigger) return;
    evt.preventDefault();
    this.applyYmqDiscount(trigger.dataset.discountCode);
  }

  /**
   * Fill the ymq third-party discount input with the given code and click its Apply button.
   * Uses the native value setter + input event so the plugin's internal state updates.
   * @param {string} code - Discount code to apply.
   */
  applyYmqDiscount(code) {
    if (!code) return;

    const wrapper =
      this.querySelector('.ymq-option-discount-wrapper') ||
      document.querySelector('.ymq-option-discount-wrapper');
    if (!wrapper) return;

    const input = wrapper.querySelector('.ymq-option-discount-input');
    const button = wrapper.querySelector('.ymq-option-discount-button');
    if (!input || !button) return;

    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    input.focus();
    nativeSetter.call(input, code);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));

    // 给插件一个 tick 处理 input 事件后再点击 Apply
    setTimeout(() => button.click(), 50);
  }

  disconnectedCallback() {
    document.removeEventListener('dispatch:cart-drawer:refresh', this.cartRefreshHandler);
    document.removeEventListener('dispatch:cart-drawer:open', this.openDrawerViaEventHandler);
    document.removeEventListener('dispatch:cart-drawer:close', this.closeDrawerViaEventHandler);
  }

  /**
   * Handle when the drawer is opened via an event
   * @param {object} evt - Event object.
   */
  handleDrawerOpenViaEvent(evt) {
    this.open(evt.detail ? evt.detail.opener : null);
  }

  /**
   * Trigger refresh of contents
   */
  cartRefreshHandler() {
    this.querySelector('cart-form').refresh();
  }

  /**
   * Update section's cart-form element with new contents
   * @param {string} html - Whole-section HTML.
   */
  updateFromCartChange(html) {
    this.querySelector('cart-form').refreshFromHtml(html);
  }
}

// Free Swatches 收纳条的交互（箭头滚动 / 移除 AJAX）已抽到 free-swatches.js，与 main-cart 共用

window.customElements.define('cart-drawer', CartDrawer);
