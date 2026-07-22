/* ============================================================
   sleepbook · explained — scroll-driven narrative wiring.

   CSP-clean: no network, no inline handlers. Everything here is
   progressive enhancement over a page that is fully readable with
   JavaScript disabled and fully legible under prefers-reduced-motion.

   What it does:
   - marks each scene .is-in when it scrolls into view (drives the
     reveal + strip-fill animations declared in CSS);
   - fills a thin top progress rail as you move through the page;
   - counts the sleep-efficiency number up to 77.2% once its scene shows.
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- 1. Reveal scenes as they enter the viewport ---- */
  var scenes = Array.prototype.slice.call(
    document.querySelectorAll(".scene, .hero")
  );

  function showAll() {
    scenes.forEach(function (el) {
      el.classList.add("is-in");
    });
  }

  if (!("IntersectionObserver" in window) || reduceMotion) {
    // No observer support, or the user asked for no motion: reveal everything
    // immediately so nothing is ever stuck invisible.
    showAll();
  } else {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.15 }
    );
    scenes.forEach(function (el) {
      io.observe(el);
    });
    // Safety net: if anything is still hidden after load (e.g. very tall
    // viewport), reveal it so content is never lost.
    window.addEventListener("load", function () {
      window.setTimeout(function () {
        scenes.forEach(function (el) {
          var r = el.getBoundingClientRect();
          if (r.top < window.innerHeight) el.classList.add("is-in");
        });
      }, 400);
    });
  }

  /* ---- 2. Top progress rail ---- */
  var railFill = document.getElementById("railFill");
  if (railFill && !reduceMotion) {
    var ticking = false;
    function updateRail() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - doc.clientHeight;
      var pct = max > 0 ? (doc.scrollTop / max) * 100 : 0;
      railFill.style.width = pct.toFixed(2) + "%";
      ticking = false;
    }
    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          window.requestAnimationFrame(updateRail);
          ticking = true;
        }
      },
      { passive: true }
    );
    updateRail();
  }

  /* ---- 3. Count the sleep-efficiency number up ---- */
  var seVal = document.getElementById("seVal");
  if (seVal) {
    var target = 77.2; // matches the worked fixture (355 / 460 x 100)
    if (reduceMotion || !("IntersectionObserver" in window)) {
      seVal.innerHTML = target.toFixed(1) + '<span class="sefinal__pct">%</span>';
    } else {
      var counted = false;
      var seObs = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting && !counted) {
              counted = true;
              seObs.disconnect();
              runCount();
            }
          });
        },
        { threshold: 0.6 }
      );
      seObs.observe(seVal);

      function runCount() {
        var start = null;
        var dur = 900;
        function frame(ts) {
          if (start === null) start = ts;
          var t = Math.min((ts - start) / dur, 1);
          // ease-out
          var eased = 1 - Math.pow(1 - t, 3);
          var v = (target * eased).toFixed(1);
          seVal.innerHTML = v + '<span class="sefinal__pct">%</span>';
          if (t < 1) window.requestAnimationFrame(frame);
          else
            seVal.innerHTML =
              target.toFixed(1) + '<span class="sefinal__pct">%</span>';
        }
        window.requestAnimationFrame(frame);
      }
    }
  }
})();
