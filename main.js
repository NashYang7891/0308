// 简单的平滑滚动与导航交互逻辑，无需外部框架
(function () {
  function smoothScrollTo(targetSelector) {
    var el = document.querySelector(targetSelector);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  document.querySelectorAll("[data-scroll]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var target = btn.getAttribute("data-scroll");
      if (target) smoothScrollTo(target);
    });
  });

  document.querySelectorAll(".nav-links a, .nav-mobile-menu a").forEach(function (link) {
    link.addEventListener("click", function (e) {
      var href = link.getAttribute("href");
      if (href && href.startsWith("#")) {
        e.preventDefault();
        smoothScrollTo(href);
        // 关闭移动端菜单
        var menu = document.getElementById("navMobileMenu");
        if (menu && menu.classList.contains("open")) {
          menu.classList.remove("open");
        }
      }
    });
  });

  // 移动端菜单开关
  var toggle = document.getElementById("navToggle");
  var menu = document.getElementById("navMobileMenu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      menu.classList.toggle("open");
    });
  }

  // 页脚年份
  var yearSpan = document.getElementById("copyrightYear");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
})();

