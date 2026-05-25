/**
 * 全站倒计时组件
 * 支持格式：YYYY-MM-DD HH:mm (24小时制)
 */
class GlobalCountdown {
  constructor() {
    this.container = document.getElementById("GlobalCountdown");
    this.endTime = null;
    this.timer = null;
    this.isMobile = false;
    this.isSmall = false;

    if (this.container) {
      this.isSmall = this.container.classList.contains("global-countdown-container--small");
      this.init();
      this.isMobile = this.checkIsMobile();
    }
  }

  /**
   * 调试方法：输出时间信息
   */
  debugTimeInfo() {
    const localTime = new Date();
    const pacificTime = this.getPacificTime();
    
    console.log('=== Global Countdown 时间调试信息 ===');
    console.log('本地时间:', localTime.toLocaleString());
    console.log('美西时间:', pacificTime.toLocaleString());
    console.log('结束时间:', this.endTime ? this.endTime.toLocaleString() : '未设置');
    console.log('时区差异 (小时):', (localTime.getTime() - pacificTime.getTime()) / (1000 * 60 * 60));
    console.log('=====================================');
  }

  /**
   * 初始化倒计时
   */
  init() {
    // 从HTML数据属性或全局变量获取结束时间
    const endTimeStr = this.getEndTimeFromSettings();

    if (!endTimeStr) {
      console.warn("Global countdown: 未设置结束时间");
      return;
    }

    this.endTime = this.parseEndTime(endTimeStr);

    if (!this.endTime) {
      console.error("Global countdown: 时间格式错误，请使用 YYYY-MM-DD HH:mm 格式");
      return;
    }

    // 输出调试信息
    this.debugTimeInfo();

    // 立即更新一次显示
    this.updateDisplay();

    // 启动定时器，每秒更新一次
    this.startTimer();
  }

  /**
   * 判断是否是手机端
   */
  checkIsMobile(threshold = 768) {
    return window.innerWidth < threshold;
  }

  /**
   * 从Shopify设置中获取结束时间
   * 这里需要从Liquid模板传递的数据中获取
   */
  getEndTimeFromSettings() {
    // 尝试从容器的data属性获取
    if (this.container.dataset.endTime) {
      return this.container.dataset.endTime;
    }

    // 尝试从全局变量获取（需要在Liquid模板中设置）
    if (window.globalCountdownEndTime) {
      return window.globalCountdownEndTime;
    }

    return null;
  }

  /**
   * 解析时间字符串 (YYYY-MM-DD HH:mm)
   * @param {string} timeStr - 时间字符串
   * @returns {Date|null} - 解析后的Date对象或null
   */
  parseEndTime(timeStr) {
    // 验证格式：YYYY-MM-DD HH:mm
    const regex = /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/;
    const match = timeStr.match(regex);

    if (!match) {
      return null;
    }

    const [, year, month, day, hour, minute] = match;

    // 创建Date对象 (月份需要减1，因为JavaScript月份从0开始)
    const date = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
      0 // 秒数设为0
    );

    // 验证日期是否有效
    if (isNaN(date.getTime())) {
      return null;
    }

    return date;
  }

  /**
   * 获取美西时间 (Pacific Time)
   * 自动处理夏令时 (PDT) 和标准时间 (PST)
   * @returns {Date} - 美西时间的Date对象
   */
  getPacificTime() {
    // 创建当前UTC时间
    const now = new Date();
    
    // 使用Intl.DateTimeFormat获取美西时间
    // 'America/Los_Angeles' 时区会自动处理夏令时
    const pacificTime = new Date(now.toLocaleString("en-US", {
      timeZone: "America/Los_Angeles"
    }));
    
    return pacificTime;
  }

  /**
   * 计算剩余时间
   * @returns {Object} - 包含天、时、分、秒的对象
   */
  calculateTimeRemaining() {
    // 使用美西时间而不是本地时间
    const now = this.getPacificTime();
    const timeDiff = this.endTime.getTime() - now.getTime();

    // 如果时间已过，返回全零
    if (timeDiff <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: true,
      };
    }

    // 计算各个时间单位
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

    return {
      days,
      hours,
      minutes,
      seconds,
      isExpired: false,
    };
  }

  /**
   * 更新显示
   */
  updateDisplay() {
    const timeRemaining = this.calculateTimeRemaining();

    // 如果倒计时结束
    if (timeRemaining.isExpired) {
      //   this.onCountdownExpired();
      this.stopTimer();
      return;
    }

    // 更新各个时间单位的显示
    this.updateTimeUnit("day", timeRemaining.days);
    this.updateTimeUnit("hour", timeRemaining.hours);
    this.updateTimeUnit("minute", timeRemaining.minutes);
    this.updateTimeUnit("second", timeRemaining.seconds);
  }

  /**
   * 更新单个时间单位的显示
   * @param {string} unit - 时间单位 (day, hour, minute, second)
   * @param {number} value - 时间值
   */
  updateTimeUnit(unit, value) {
    const element = this.container.querySelector(`.countdown__${unit} .countdown-item__value`);
    if (element) {
      // 确保显示两位数
      const padded = value.toString().padStart(2, "0");
      element.textContent = this.isMobile && unit === "day" && !this.isSmall
        ? `${value}DAYS`
        : padded;
    }
  }

  /**
   * 启动定时器
   */
  startTimer() {
    // 清除现有定时器
    if (this.timer) {
      clearInterval(this.timer);
    }

    // 每秒更新一次
    this.timer = setInterval(() => {
      this.updateDisplay();
    }, 1000);
  }

  /**
   * 停止定时器
   */
  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * 倒计时结束时的处理
   */
  onCountdownExpired() {
    console.log("Global countdown: 倒计时结束");

    // 停止定时器
    this.stopTimer();

    // 隐藏倒计时组件
    if (this.container) {
      this.container.style.display = "none";
    }

    // 可以在这里添加其他结束后的逻辑
    // 比如显示促销结束消息、重定向等
  }

  /**
   * 销毁倒计时实例
   */
  destroy() {
    this.stopTimer();
  }
}

// 当DOM加载完成后初始化倒计时
document.addEventListener("DOMContentLoaded", function () {
  // 创建全局倒计时实例
  window.globalCountdownInstance = new GlobalCountdown();
});

// 页面卸载时清理定时器
window.addEventListener("beforeunload", function () {
  if (window.globalCountdownInstance) {
    window.globalCountdownInstance.destroy();
  }
});
