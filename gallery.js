/*
    FlowFix Plumbing Services - gallery.js
    Part 3: Image gallery with lightbox (about.html)

    A lightbox shows a clicked picture larger, on top of the page, with
    a dark background. This script builds the lightbox with the DOM and
    connects it to the gallery links already in the HTML.

    Sources (full references are in the README):
      - MDN Web Docs n.d.d (document.createElement)
      - W3C n.d.b (modal dialog pattern: Escape key, focus handling)
*/
(function () {
    'use strict';

    var links = Array.prototype.slice.call(document.querySelectorAll('.gallery a'));
    if (!links.length) { return; }

    var current = 0;          // index of the picture being shown
    var lastFocused = null;   // element to return focus to when closing

    /* ----- Build the lightbox once and add it to the page ----- */
    var overlay = document.createElement('div');
    overlay.className = 'lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Image viewer');
    overlay.setAttribute('aria-hidden', 'true');

    var closeBtn = makeButton('lightbox-close', '\u00D7', 'Close image viewer');
    var prevBtn = makeButton('lightbox-prev', '\u2039', 'Previous image');
    var nextBtn = makeButton('lightbox-next', '\u203A', 'Next image');

    var figure = document.createElement('figure');
    var bigImage = document.createElement('img');
    var caption = document.createElement('figcaption');
    figure.appendChild(bigImage);
    figure.appendChild(caption);

    overlay.appendChild(closeBtn);
    overlay.appendChild(prevBtn);
    overlay.appendChild(figure);
    overlay.appendChild(nextBtn);
    document.body.appendChild(overlay);

    // Small helper so we do not repeat the same button-building code.
    function makeButton(className, symbol, label) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = className;
        b.textContent = symbol;
        b.setAttribute('aria-label', label);
        return b;
    }

    /* ----- Show a picture ----- */
    function show(index) {
        // The % (remainder) trick makes the gallery loop around:
        // after the last picture comes the first one again.
        current = (index + links.length) % links.length;
        var link = links[current];
        bigImage.src = link.getAttribute('href');                    // full-size file
        bigImage.alt = link.querySelector('img').alt;                // reuse the thumbnail's alt text
        caption.textContent = link.dataset.caption || '';
    }

    function open(index) {
        lastFocused = document.activeElement;
        show(index);
        overlay.classList.add('is-open');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        closeBtn.focus();
    }

    function close() {
        overlay.classList.remove('is-open');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
        if (lastFocused) { lastFocused.focus(); }
    }

    /* ----- Events ----- */
    links.forEach(function (link, index) {
        link.addEventListener('click', function (event) {
            event.preventDefault(); // stop the browser opening the plain image
            open(index);
        });
    });

    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', function () { show(current - 1); });
    nextBtn.addEventListener('click', function () { show(current + 1); });

    // Clicking the dark area (not the picture or buttons) closes the lightbox.
    overlay.addEventListener('click', function (event) {
        if (event.target === overlay) { close(); }
    });

    // Keyboard support: Escape closes, arrow keys move, Tab stays inside.
    document.addEventListener('keydown', function (event) {
        if (!overlay.classList.contains('is-open')) { return; }
        if (event.key === 'Escape') { close(); }
        if (event.key === 'ArrowLeft') { show(current - 1); }
        if (event.key === 'ArrowRight') { show(current + 1); }
        if (event.key === 'Tab') {
            var order = [closeBtn, prevBtn, nextBtn];
            var pos = order.indexOf(document.activeElement);
            event.preventDefault();
            var nextPos = event.shiftKey ? (pos - 1 + order.length) % order.length : (pos + 1) % order.length;
            order[nextPos].focus();
        }
    });
})();
