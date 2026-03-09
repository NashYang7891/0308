// 简单的平滑滚动与导航交互逻辑，无需外部框架
(function () {
  function smoothScrollTo(targetSelector) {
    var el = document.querySelector(targetSelector);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function normalizeLang(lang) {
    if (!lang) return "";
    lang = String(lang).toLowerCase();
    if (lang.startsWith("ar")) return "ar";
    if (lang.startsWith("en")) return "en";
    return "";
  }

  function getQueryLang() {
    try {
      var params = new URLSearchParams(window.location.search || "");
      return normalizeLang(params.get("lang"));
    } catch (e) {
      return "";
    }
  }

  function getStoredLang() {
    try {
      return normalizeLang(window.localStorage.getItem("hxyr_lang"));
    } catch (e) {
      return "";
    }
  }

  function setStoredLang(lang) {
    try {
      window.localStorage.setItem("hxyr_lang", lang);
    } catch (e) {}
  }

  function isEnglishPage() {
    var l = (document.documentElement.getAttribute("lang") || "").toLowerCase();
    return l === "en" || l.startsWith("en-");
  }

  function isArabicPage() {
    var l = (document.documentElement.getAttribute("lang") || "").toLowerCase();
    return l === "ar" || l.startsWith("ar-");
  }

  function redirectToLang(lang) {
    var file = window.location.protocol === "file:";
    if (lang === "en") {
      if (!isEnglishPage()) {
        window.location.href = file ? "en/index.html" : "/en/";
      }
      return;
    }
    if (lang === "ar") {
      if (!isArabicPage()) {
        window.location.href = file ? "../index.html" : "/";
      }
    }
  }

  function countryToLang(country) {
    // Arabic default for MENA; English for others
    var arCountries = {
      AE: 1, SA: 1, QA: 1, KW: 1, BH: 1, OM: 1,
      EG: 1, JO: 1, LB: 1, IQ: 1, SY: 1, YE: 1,
      PS: 1, SD: 1, LY: 1, TN: 1, DZ: 1, MA: 1,
      MR: 1, SO: 1, DJ: 1
    };
    if (country && arCountries[String(country).toUpperCase()]) return "ar";
    return "en";
  }

  function countryToCurrency(country) {
    var c = (country || "").toUpperCase();
    var map = {
      SA: "SAR",
      AE: "AED",
      QA: "QAR",
      KW: "KWD",
      BH: "BHD",
      OM: "OMR",
      EG: "EGP",
      JO: "JOD",
      IQ: "IQD",
      TR: "TRY"
    };
    return map[c] || "USD";
  }

  function updateCurrencyUI(currency) {
    var pill = document.getElementById("currencyPill");
    if (pill) pill.textContent = currency || "—";
    document.documentElement.dataset.currency = currency || "";
  }

  function syncBillingCurrencyUI(currency) {
    var code = currency || "USD";

    var select = document.getElementById("billingCurrencySelect");
    if (select) {
      var hasOption = false;
      for (var i = 0; i < select.options.length; i++) {
        if (select.options[i].value === code) {
          hasOption = true;
          break;
        }
      }
      select.value = hasOption ? code : "USD";
    }

    var codeEl = document.getElementById("pricingCurrencyCode");
    if (codeEl) {
      codeEl.textContent = code;
    }
  }

  function setLocaleMeta(meta) {
    if (!meta) return;
    document.documentElement.dataset.country = meta.country || "";
    var cur = meta.currency || "";
    updateCurrencyUI(cur);
    syncBillingCurrencyUI(cur);
    try {
      window.HXYR_LOCALE = {
        country: meta.country || "",
        lang: meta.lang || "",
        currency: meta.currency || ""
      };
    } catch (e) {}
  }

  function parseCloudflareTrace(text) {
    // Example lines: loc=SA
    var m = String(text || "").match(/(?:^|\n)loc=([A-Z]{2})(?:\n|$)/i);
    return m ? m[1].toUpperCase() : "";
  }

  function detectCountry() {
    // Prefer Cloudflare edge country when site is behind Cloudflare
    return fetch("/cdn-cgi/trace", { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("trace_not_ok");
        return r.text();
      })
      .then(function (t) {
        return parseCloudflareTrace(t);
      })
      .catch(function () {
        return "";
      });
  }

  // 手动语言覆盖（优先级最高）
  var queryLang = getQueryLang();
  if (queryLang) setStoredLang(queryLang);
  var preferredLang = queryLang || getStoredLang();
  if (preferredLang) redirectToLang(preferredLang);

  // 绑定语言切换按钮（保存偏好，便于下次自动选择）
  document.querySelectorAll("[data-set-lang]").forEach(function (el) {
    el.addEventListener("click", function () {
      var l = normalizeLang(el.getAttribute("data-set-lang"));
      if (l) setStoredLang(l);
    });
  });

  // 国家识别 → 自动语言/币种（只有在用户未手动指定语言时才触发跳转）
  detectCountry().then(function (country) {
    var langFromCountry = country ? countryToLang(country) : "";
    if (!langFromCountry) {
      // 国家无法识别时，降级用浏览器语言；都不匹配则默认英文（更通用）
      langFromCountry = normalizeLang(navigator.language) || "en";
    }
    var currency = countryToCurrency(country);
    setLocaleMeta({ country: country, lang: langFromCountry, currency: currency });

    // 如果用户没有明确指定语言（query/localStorage），才按国家自动跳转
    var hasExplicitOverride = !!(getQueryLang() || getStoredLang());
    if (!hasExplicitOverride) {
      redirectToLang(langFromCountry);
    }
  });

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
        var pageLang = normalizeLang(document.documentElement.getAttribute("lang")) || "ar";
        alert(pageLang === "en" ? "Please fill in your name and contact info." : "يرجى إدخال الاسم وبيانات التواصل.");
        return;
      }

      var pageLang2 = normalizeLang(document.documentElement.getAttribute("lang")) || "ar";
      var locale = window.HXYR_LOCALE || {};
      var currency = locale.currency || document.documentElement.dataset.currency || "";
      var country = locale.country || document.documentElement.dataset.country || "";

      var subjectText =
        pageLang2 === "en"
          ? "New inquiry from hxyr.ltd"
          : "استفسار جديد من موقع hxyr.ltd";
      var subject = encodeURIComponent(subjectText);

      var body;
      if (pageLang2 === "en") {
        body =
          "Name: " +
          name +
          "\n" +
          "Contact: " +
          phone +
          "\n" +
          "Company: " +
          (company || "-") +
          "\n" +
          "Category: " +
          (categoryText || "-") +
          "\n" +
          "Preferred currency: " +
          (currency || "-") +
          "\n" +
          "Country (detected): " +
          (country || "-") +
          "\n" +
          "Message: " +
          (message || "-");
      } else {
        body =
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
          "عملة التسعير المفضلة: " +
          (currency || "-") +
          "\n" +
          "الدولة (تلقائياً): " +
          (country || "-") +
          "\n" +
          "وصف المشروع أو سيناريو الاستخدام: " +
          (message || "-");
      }

      var mailto =
        "mailto:hello@hxyr.ltd?subject=" +
        subject +
        "&body=" +
        encodeURIComponent(body);

      window.location.href = mailto;
    });
  }
})();

