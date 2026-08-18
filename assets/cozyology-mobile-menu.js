(function () {
  function installPhoneStyles() {
    if (document.getElementById('cz-mobile-menu-hierarchy-styles')) return;
    var style = document.createElement('style');
    style.id = 'cz-mobile-menu-hierarchy-styles';
    style.textContent = '@media (max-width:700px){' +
      '.mobile-navigation-drawer .navigation__tier-1-container .mobile-nav-title{font-size:15px;font-weight:600;letter-spacing:.08em}' +
      '.mobile-navigation-drawer .cz-mobile-menu__group-label{display:flex;min-height:28px;align-items:flex-end;padding:8px 0 6px;border-bottom:1px solid rgb(var(--text-color)/.12);color:rgb(var(--text-color)/.56);font-size:10px;font-weight:600;letter-spacing:.14em;line-height:1;list-style:none}' +
      '.mobile-navigation-drawer .cz-mobile-menu__group-label--shop{min-height:22px;padding-top:2px}' +
      '.mobile-navigation-drawer .cz-mobile-menu__group-label--support{margin-top:6px}' +
      '.mobile-navigation-drawer .navigation__tier-1>.navigation__item.featured-link>.navigation__link{gap:12px}' +
      '.mobile-navigation-drawer .navigation__tier-1>.navigation__item.featured-link>.navigation__link>.cz-mobile-menu__sale-offer{display:inline-flex;min-width:0;min-height:0;align-items:center;justify-content:flex-start;padding:0;background:transparent;color:rgb(var(--text-color)/.62);font-size:11px;font-weight:500;letter-spacing:.02em;line-height:1.2;white-space:nowrap}' +
      '}';
    document.head.appendChild(style);
  }

  function closeSiblingGroups(item) {
    var parent = item.parentElement;
    if (!parent) return;
    parent.querySelectorAll(':scope > .navigation__item--open').forEach(function (sibling) {
      if (sibling === item) return;
      sibling.classList.remove('navigation__item--open');
      var panel = sibling.querySelector(':scope > .navigation__tier-3-container');
      if (panel) panel.style.height = '';
    });
  }

  function addGroupLabel(list, beforeItem, text, modifier) {
    if (!list || !beforeItem || list.querySelector('.cz-mobile-menu__group-label--' + modifier)) return;
    var label = document.createElement('li');
    label.className = 'cz-mobile-menu__group-label cz-mobile-menu__group-label--' + modifier;
    label.textContent = text;
    label.setAttribute('aria-hidden', 'true');
    list.insertBefore(label, beforeItem);
  }

  function enhanceMobileMenu() {
    installPhoneStyles();
    var drawer = document.querySelector('.mobile-navigation-drawer');
    if (!drawer) return;

    var rootContainer = drawer.querySelector('.navigation__tier-1-container');
    var rootTitle = rootContainer && rootContainer.querySelector('.mobile-nav-title');
    if (rootContainer && !rootTitle) {
      var rootHeader = rootContainer.querySelector('.navigation__mobile-header');
      var closeControl = rootHeader && rootHeader.querySelector('.mobile-nav-toggle');
      if (rootHeader && closeControl) {
        rootTitle = document.createElement('span');
        rootTitle.className = 'mobile-nav-title cz-mobile-menu__root-title';
        rootHeader.insertBefore(rootTitle, closeControl);
      }
    }
    if (rootTitle && !rootTitle.textContent.trim()) rootTitle.textContent = 'MENU';

    var list = drawer.querySelector('.navigation__tier-1');
    if (!list) return;

    var firstItem = list.querySelector(':scope > .navigation__item');
    addGroupLabel(list, firstItem, 'SHOP', 'shop');

    var galleryLink = list.querySelector(':scope > .navigation__item > .navigation__link[href="/pages/gallery"]');
    var galleryItem = galleryLink && galleryLink.closest('.navigation__item');
    addGroupLabel(list, galleryItem, 'EXPLORE & SUPPORT', 'support');

    var saleLink = list.querySelector(':scope > .featured-link > .navigation__link[href="/pages/sale"]');
    if (saleLink && !saleLink.querySelector('.cz-mobile-menu__sale-offer')) {
      var saleLabel = saleLink.querySelector(':scope > span');
      if (saleLabel) saleLink.querySelector(':scope > span');
      if (saleLabel) saleLabel.classList.add('cz-mobile-menu__sale-label');
      var offer = document.createElement('span');
      offer.className = 'cz-mobile-menu__sale-offer';
      offer.textContent = 'UP TO 24% OFF';
      saleLink.appendChild(offer);
    }
  }

  document.addEventListener('DOMContentLoaded', enhanceMobileMenu);
  enhanceMobileMenu();

  document.addEventListener('click', function (event) {
    if (!window.matchMedia('(max-width: 700px)').matches) return;
    var toggle = event.target.closest('.mobile-navigation-drawer .navigation__tier-2 > .navigation__item > .navigation__children-toggle');
    if (!toggle) return;
    closeSiblingGroups(toggle.parentElement);
  }, true);
})();