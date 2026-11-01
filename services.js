/*
    FlowFix Plumbing Services - services.js
    Part 3: Search, filter and sort (services.html)

    How it works: every service card in the HTML has data-category and
    data-price attributes. This script reads them, then hides cards that
    do not match the search / type, and re-orders the rest with the
    chosen sort. The cards are moved around in the DOM; nothing is
    re-written, so the original HTML stays the single source of content.

    Sources (full references are in the README):
      - MDN Web Docs n.d.d (DOM: createDocumentFragment / appendChild)
*/
(function () {
    'use strict';

    var grid = document.getElementById('service-grid');
    var form = document.getElementById('service-filter');
    if (!grid || !form) { return; }

    var searchBox = document.getElementById('service-search');
    var categorySelect = document.getElementById('service-category');
    var sortSelect = document.getElementById('service-sort');
    var resetButton = document.getElementById('service-reset');
    var countText = document.getElementById('results-count');
    var noResults = document.getElementById('no-results');

    // Turn the cards into a real array so array methods work on them.
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.service-card'));
    // Remember the original order so "Our usual order" can restore it.
    var originalOrder = cards.slice();

    form.hidden = false;                 // controls are shown now JavaScript works
    form.addEventListener('submit', function (e) { e.preventDefault(); }); // Enter key must not reload

    // Small helpers that read information from a card.
    function cardName(card) { return card.querySelector('h2').textContent.trim(); }
    function cardPrice(card) { return Number(card.dataset.price); } // dataset reads data-price

    function update() {
        var query = searchBox.value.trim().toLowerCase();
        var category = categorySelect.value;
        var sortMode = sortSelect.value;

        // FILTER: keep a card if the type matches AND the search word
        // appears anywhere in the card's text (name, price, description).
        var matches = originalOrder.filter(function (card) {
            var typeOk = category === 'all' || card.dataset.category === category;
            var textOk = card.textContent.toLowerCase().indexOf(query) !== -1;
            return typeOk && textOk;
        });

        // SORT: compare two cards at a time. A negative result puts the
        // first card before the second.
        if (sortMode === 'price-asc') {
            matches.sort(function (a, b) { return cardPrice(a) - cardPrice(b); });
        } else if (sortMode === 'price-desc') {
            matches.sort(function (a, b) { return cardPrice(b) - cardPrice(a); });
        } else if (sortMode === 'name-asc') {
            matches.sort(function (a, b) { return cardName(a).localeCompare(cardName(b)); });
        }

        // UPDATE THE PAGE: matching cards are shown in the new order,
        // the others are hidden. The fragment is added in one go.
        var fragment = document.createDocumentFragment();
        matches.forEach(function (card) {
            card.hidden = false;
            fragment.appendChild(card);
        });
        originalOrder.forEach(function (card) {
            if (matches.indexOf(card) === -1) {
                card.hidden = true;
                fragment.appendChild(card);
            }
        });
        grid.appendChild(fragment);

        // Tell the visitor (and screen readers) what happened.
        countText.textContent = 'Showing ' + matches.length + ' of ' + cards.length + ' services.';
        noResults.hidden = matches.length !== 0;
    }

    searchBox.addEventListener('input', update);      // runs on every keystroke
    categorySelect.addEventListener('change', update);
    sortSelect.addEventListener('change', update);

    resetButton.addEventListener('click', function () {
        searchBox.value = '';
        categorySelect.value = 'all';
        sortSelect.value = 'default';
        update();
        searchBox.focus();
    });

    update(); // run once so the "Showing 4 of 4" message appears on load
})();
