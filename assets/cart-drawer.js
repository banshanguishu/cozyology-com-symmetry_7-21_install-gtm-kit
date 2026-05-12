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

// Free Swatches 删除按钮：拦截 <a href> 默认跳转，改走 AJAX cart/change.js + on:cart:change
// 不能复用 Symmetry 的 .cart-item__remove 拦截，因为它需要 .cart-item__quantity-input 结构，我们没有
document.addEventListener('click', function (e) {
  const link = e.target.closest('.free-swatches__item-remove');
  if (!link) return;
  e.preventDefault();
  const url = new URL(link.href, location.origin);
  const id = url.searchParams.get('id');
  fetch('/cart/change.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: id, quantity: 0 })
  })
    .then(function (r) { return r.ok ? r.json() : Promise.reject(r); })
    .then(function () {
      document.dispatchEvent(new CustomEvent('on:cart:change', { bubbles: true, cancelable: false }));
    })
    .catch(function (err) { console.error('Free Swatches remove failed:', err); });
});

window.customElements.define('cart-drawer', CartDrawer);
