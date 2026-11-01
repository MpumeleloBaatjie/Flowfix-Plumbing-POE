/*
    FlowFix Plumbing Services - main.js (used on every page)
    Part 3: JavaScript functionality

    What this file does:
      1. Puts the current year in the footer.
      2. Fades sections in as the visitor scrolls (animation).
      3. Builds a "Back to top" button with the DOM and shows it
         only after the visitor has scrolled down.

    Sources (full references are in the README):
      - MDN Web Docs n.d.d  (document.createElement)
      - MDN Web Docs n.d.e  (Intersection Observer API)
      - MDN Web Docs n.d.f  (prefers-reduced-motion)
*/
(function () {
    'use strict'; // "strict mode" makes JavaScript report common coding mistakes.

    // Some visitors ask their device to reduce motion (for example,
    // people who get dizzy from animations). We respect that setting.
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- 1. Footer year ----------
       textContent is used (not innerHTML) because it only ever inserts
       plain text, which is safer. */
    var yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    /* ---------- 2. Scroll reveal animation ----------
       An IntersectionObserver tells us when an element enters the
       visible part of the screen, without us having to listen to every
       scroll event (which is slow). When that happens we add the class
       "reveal-visible", and the CSS transition fades the element in
       (MDN Web Docs n.d.e). */
    var revealTargets = document.querySelectorAll(
        'main section, .service-card, .location-card, .site-form, .gallery li'
    );

    if ('IntersectionObserver' in window && !reduceMotion) {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('reveal-visible');
                    observer.unobserve(entry.target); // animate once only
                }
            });
        }, { threshold: 0.1 });

        revealTargets.forEach(function (el) {
            el.classList.add('reveal'); // starts faded out (see style.css)
            observer.observe(el);
        });
    }
    // If the browser is old or motion is reduced, the elements are simply
    // left alone and show normally - nothing is ever hidden.

    /* ---------- 3. Back to top button (DOM manipulation) ----------
       The button does not exist in the HTML. We create it with
       createElement, set its properties, and add it to <body>
       (MDN Web Docs n.d.d). */
    var topButton = document.createElement('button');
    topButton.type = 'button';
    topButton.className = 'back-to-top';
    topButton.textContent = '\u2191'; // up arrow
    topButton.setAttribute('aria-label', 'Back to top');
    document.body.appendChild(topButton);

    topButton.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });

    // Show the button only after scrolling more than 400px down.
    window.addEventListener('scroll', function () {
        topButton.classList.toggle('is-visible', window.scrollY > 400);
    }, { passive: true }); // "passive" tells the browser we won't block scrolling.
})();
