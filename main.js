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

  // 联系表单提交（通过邮件客户端发送）
  // 线上如果表单没有 id，也通过选择器兜底匹配
  var contactForm =
    document.getElementById("contactForm") ||
    document.querySelector(".contact-card form");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();

      var name = (contactForm.elements["name"] && contactForm.elements["name"].value.trim()) || "";
      var phone = (contactForm.elements["phone"] && contactForm.elements["phone"].value.trim()) || "";
      var company = (contactForm.elements["company"] && contactForm.elements["company"].value.trim()) || "";
      var categorySelect = contactForm.elements["category"];
      var categoryText = "";
      if (categorySelect && categorySelect.selectedIndex >= 0) {
        categoryText = categorySelect.options[categorySelect.selectedIndex].text;
      }
      var message = (contactForm.elements["message"] && contactForm.elements["message"].value.trim()) || "";

      if (!name || !phone) {
        alert("请填写姓名和联系方式。");
        return;
      }

      // 邮件标题和内容使用阿拉伯语，面向中东客户
      var subject = encodeURIComponent("استفسار جديد من صفحة هنغ شيانغ يونغ روي");
      var body =
        "الاسم: " +
        name +
        "\n" +
        "بيانات التواصل: " +
        phone +
        "\n" +
        "اسم الشركة / الجهة: " +
        (company || "-") +
        "\n" +
        "مجال الطلب: " +
        (categoryText || "-") +
        "\n" +
        "وصف المشروع أو سيناريو الاستخدام: " +
        (message || "-");

      var mailto =
        "mailto:hello@hxyr.ltd?subject=" +
        subject +
        "&body=" +
        encodeURIComponent(body);

      window.location.href = mailto;
    });
  }
})();

