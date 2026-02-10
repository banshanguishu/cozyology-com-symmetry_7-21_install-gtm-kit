(function() {
    const DEFAULT_DURATION = 2000;
    let container = null;
    function ensureContainer() {
      if (container && document.body.contains(container)) return container;
      container = document.createElement('div');
      container.id = 'global_message_container';
      container.className = 'global-message-container';
      document.body.appendChild(container);
      return container;
    }
    function createMessageEl(text, type) {
      const el = document.createElement('div');
      el.className = 'global-message';
      const typeClass = type === 'error' ? 'global-message-error' : 'global-message-success';
      el.classList.add(typeClass);
      // 文本
      const textEl = document.createElement('span');
      textEl.className = 'global-message-content';
      textEl.textContent = (text == null ? '' : String(text));
      el.appendChild(textEl);
      return el;
    }
    function normalizeOptions(options) {
      if (typeof options === 'string') {
        return { message: options, type: 'success', duration: DEFAULT_DURATION };
      }
      const opt = options || {};
      const type = (opt.type === 'error' || opt.type === 'success') ? opt.type : 'success';
      let duration = parseInt(opt.duration, 10);
      if (!(duration > 0)) duration = DEFAULT_DURATION;
      const message = opt.message != null ? String(opt.message) : '';
      return { message, type, duration };
    }
    function closeMessage(el) {
      if (!el) return;
      // 退出动画（通过类控制）
      el.classList.remove('is-show');
      const removeNode = () => {
        try { el.remove(); } catch(_) {}
        if (container && container.childElementCount === 0) {
          try { container.remove(); } catch(_) {}
          container = null;
        }
      };
      el.addEventListener('transitionend', removeNode, { once: true });
      setTimeout(removeNode, 300);
    }
    function Message(options) {
      try {
        const { message, type, duration } = normalizeOptions(options);
        const parent = ensureContainer();
        const el = createMessageEl(message, type);
        parent.appendChild(el);
        // 进场（通过类控制）
        requestAnimationFrame(() => {
          el.classList.add('is-show');
        });
        const timer = setTimeout(() => closeMessage(el), duration);
        return {
          close: () => { clearTimeout(timer); closeMessage(el); }
        };
      } catch (err) {
        console.error('Message error:', err);
        return { close: () => {} };
      }
    }
    window.CozyMessage = Message
    console.log("global-message 已经挂载-=====")
})()