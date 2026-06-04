// Free Swatches 收纳条交互 — cart-drawer 与 main-cart 共用。
// markup 见 snippets/free-swatches.liquid，样式见 custom-styles-emily.css。
// 两个 section 永不同页渲染（cart-drawer 在 cart 模板上被 unless 排除），不会重复绑定。

// 横向列表：左右滚动按钮，事件委托
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

// 删除按钮：拦截 <a href> 默认跳转，改走 AJAX cart/change.js + on:cart:change。
// on:cart:change 会让页面上的 cart-form（主购物车 / 抽屉）自动 refresh，
// 本收纳条（data-merge="free-swatches"）、总价、header 计数随之局部更新。
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
