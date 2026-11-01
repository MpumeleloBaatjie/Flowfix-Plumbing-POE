/*
    FlowFix Plumbing Services - ui-jquery.js
    Part 3: Interactive elements built with jQuery

    Used on: index.html (modal) and services.html (accordion).

    What this file does:
      1. Accordion: FAQ answers slide open and closed.
      2. Modal: the "Plumbing emergency?" pop-up window.

    jQuery is the JavaScript library that makes it shorter to select
    elements ($('.class')), react to clicks (.on('click')) and animate
    (.slideToggle). The library file is self-hosted in
    js_assets/vendor so the page does not depend on another website.

    Sources (full references are in the README):
      - jQuery 2023 (jQuery library, version 3.7.1)
      - jQuery n.d. (slideToggle)
      - W3C n.d.a (accordion pattern), W3C n.d.b (modal dialog pattern)
*/
(function ($) {
    'use strict';

    // If jQuery failed to load, stop quietly. The page still works:
    // the FAQ answers stay visible and the modal button stays hidden.
    if (typeof $ === 'undefined') { return; }

    /* ================= 1. ACCORDION ================= */
    var $accordion = $('.accordion');

    if ($accordion.length) {
        // Close every answer when the page loads. This is done in
        // JavaScript (not in the HTML) so people without JavaScript can
        // still read all the answers.
        $accordion.find('.accordion-panel').hide();

        // One click handler on the container handles every question
        // button ("event delegation") - adding a new FAQ needs no new code.
        $accordion.on('click', '.accordion-trigger', function () {
            var $button = $(this);
            var $panel = $('#' + $button.attr('aria-controls'));
            var isOpen = $button.attr('aria-expanded') === 'true';

            // Close any other open answer so only one is open at a time.
            $accordion.find('.accordion-trigger[aria-expanded="true"]').not($button)
                .attr('aria-expanded', 'false')
                .next('.accordion-panel').slideUp(250);

            // Open or close the clicked answer. slideToggle animates the
            // height over 250 milliseconds (jQuery n.d.).
            $button.attr('aria-expanded', String(!isOpen));
            $panel.slideToggle(250);
        });
    }

    /* ================= 2. MODAL ================= */
    var $trigger = $('[data-modal-target]');
    var $lastFocused = null; // remembers which element opened the modal

    // The trigger buttons start hidden in the HTML. Show them now that
    // we know JavaScript is working.
    $trigger.prop('hidden', false);

    function openModal($modal) {
        $lastFocused = $(document.activeElement);
        $modal.addClass('is-open').attr('aria-hidden', 'false');
        $('body').addClass('modal-open'); // stops the page behind from scrolling
        $modal.find('.modal-content').trigger('focus'); // move focus into the pop-up
    }

    function closeModal($modal) {
        $modal.removeClass('is-open').attr('aria-hidden', 'true');
        $('body').removeClass('modal-open');
        if ($lastFocused) { $lastFocused.trigger('focus'); } // give focus back
    }

    // Open: each trigger button points at its modal with data-modal-target.
    $trigger.on('click', function () {
        openModal($($(this).data('modal-target')));
    });

    // Close: the X button, a click on the dark background, or the Escape key.
    $('.modal').on('click', function (event) {
        if ($(event.target).is('.modal') || $(event.target).is('.modal-close')) {
            closeModal($(this));
        }
    });

    $(document).on('keydown', function (event) {
        var $open = $('.modal.is-open');
        if (!$open.length) { return; }

        if (event.key === 'Escape') {
            closeModal($open);
        }

        // Keep keyboard focus inside the modal while it is open
        // (a "focus trap", recommended by W3C n.d.b).
        if (event.key === 'Tab') {
            var $focusable = $open.find('a[href], button');
            var first = $focusable.first()[0];
            var last = $focusable.last()[0];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault(); last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault(); first.focus();
            }
        }
    });
})(window.jQuery);
