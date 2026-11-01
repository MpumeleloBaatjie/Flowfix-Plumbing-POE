/*
    FlowFix Plumbing Services - tips.js
    Part 3: Dynamic content (index.html)

    The plumbing tips are stored here as a JavaScript array and are
    turned into page elements with the DOM. Three tips show first and the
    "Load more tips" button adds three more each time, until none are left.

    Sources (full references are in the README):
      - MDN Web Docs n.d.d (document.createElement)
*/
(function () {
    'use strict';

    var list = document.getElementById('tips-list');
    var moreButton = document.getElementById('tips-more');
    if (!list || !moreButton) { return; }

    // The content: an array of objects, each with a title and some text.
    var tips = [
        { title: 'Know your main water valve',
          text: 'Find the main shut-off valve before you need it. In an emergency, turning it off stops the water quickly and limits the damage.' },
        { title: 'Keep grease out of the drain',
          text: 'Cooking oil and fat cool down and harden inside pipes. Wipe pans with paper first and put the paper in the bin.' },
        { title: 'Check for hidden leaks',
          text: 'Turn off all taps and appliances and note your water meter reading. If the number changes after an hour or two, you may have a leak.' },
        { title: 'Use drain strainers',
          text: 'A cheap strainer in the shower and basin catches hair and soap scraps - the most common causes of slow drains.' },
        { title: 'Watch the geyser overflow pipe',
          text: 'A geyser that keeps dripping from its overflow or drain pipe can mean a faulty valve. Have a plumber check it before it gets worse.' },
        { title: 'Go easy on chemical drain cleaners',
          text: 'Strong chemical cleaners used again and again can damage pipes. For a stubborn blockage, call a plumber instead.' }
    ];

    var PER_CLICK = 3;  // how many tips appear each time
    var shown = 0;      // how many tips are on the page so far

    // Builds ONE tip card using createElement (DOM manipulation).
    // textContent is used so the text can never be treated as HTML.
    function buildTip(tip) {
        var article = document.createElement('article');
        article.className = 'tip-card';

        var heading = document.createElement('h3');
        heading.textContent = tip.title;

        var paragraph = document.createElement('p');
        paragraph.textContent = tip.text;

        article.appendChild(heading);
        article.appendChild(paragraph);
        return article;
    }

    function showMore() {
        // A DocumentFragment collects the new cards off-screen, so the page
        // is only updated once (faster than adding cards one by one).
        var fragment = document.createDocumentFragment();
        var end = Math.min(shown + PER_CLICK, tips.length);

        for (var i = shown; i < end; i++) {
            fragment.appendChild(buildTip(tips[i]));
        }
        list.appendChild(fragment);
        shown = end;

        // When every tip is showing there is nothing left to load.
        if (shown >= tips.length) {
            moreButton.hidden = true;
        }
    }

    moreButton.hidden = false; // JavaScript works, so the button can be shown
    moreButton.addEventListener('click', showMore);
    showMore(); // show the first three tips straight away
})();
