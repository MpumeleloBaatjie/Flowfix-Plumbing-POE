/*
    FlowFix Plumbing Services - forms.js
    Part 3: Form validation and submission

    Used on: inquiries.html (#enquiry-form) and contact.html (#contact-form).

    The file has three parts:
      1. Shared helpers: validation rules, error messages, character counters.
      2. Enquiry form: validate -> send with AJAX (fetch) -> show a cost
         estimate and availability.
      3. Contact form: validate -> compile an email -> let the visitor send
         it to the recipient set in RECIPIENT below.

    Sources (full references are in the README):
      - MDN Web Docs n.d.a (Constraint validation API)
      - MDN Web Docs n.d.d (document.createElement)
      - MDN Web Docs n.d.c (toLocaleDateString for readable dates)
      - MDN Web Docs n.d.g (Using the Fetch API)
      - JSONPlaceholder n.d. (free test API)
      - Duerst, Masinter and Zawinski 2010 (mailto links)
      - OWASP n.d. (output encoding: use textContent, not innerHTML)
*/
(function () {
    'use strict';

    /* ================= SETTINGS ================= */

    // The email address the contact form message is addressed to.
    // Change it here and the whole site updates.
    var RECIPIENT = 'flowfix@gmail.com';

    // Where the enquiry form data is posted with AJAX. JSONPlaceholder
    // accepts a POST and replies with success, but does not keep the data.
    // To send real enquiries, replace this with a form service address
    // (for example a Formspree or Netlify Forms endpoint).
    var ENQUIRY_ENDPOINT = 'https://jsonplaceholder.typicode.com/posts';

    // Starting prices copied from services.html. perM2 = true means the
    // price is charged per square meter.
    var SERVICES = {
        'leak-repairs':     { label: 'Leak Repairs',                   price: 300,  perM2: true },
        'geyser':           { label: 'Geyser Installation and Repair', price: 1000, perM2: false },
        'drain':            { label: 'Drain Unblocking',               price: 600,  perM2: false },
        'bathroom-kitchen': { label: 'Bathroom and Kitchen Plumbing',  price: 800,  perM2: true },
        'other':            { label: 'Something else / not sure',      price: null, perM2: false }
    };

    var BRANCHES = {
        pretoria:  { name: 'Pretoria Central', phone: '012 345 6789' },
        centurion: { name: 'Centurion',        phone: '012 654 3210' }
    };

    /* ================= 1. SHARED HELPERS ================= */

    // Regular expressions (patterns) used to check text formats.
    // \p{L} matches any letter, including letters with accents (u flag).
    var NAME_PATTERN = /^[\p{L}][\p{L}' .-]*$/u;
    var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    // South African numbers: +27 or 0, then 9 digits, first digit not 0.
    var PHONE_PATTERN = /^(\+27|0)[1-9][0-9]{8}$/;

    // Each rule gets the field's value and returns an error message,
    // or an empty string when the value is fine.
    var rules = {
        name: function (value) {
            if (value.length < 2) { return 'Please enter your name (at least 2 characters).'; }
            if (!NAME_PATTERN.test(value)) { return 'Names can only contain letters, spaces, apostrophes, full stops and hyphens.'; }
            return '';
        },
        email: function (value) {
            return EMAIL_PATTERN.test(value) ? '' : 'Please enter a valid email address, for example name@example.com.';
        },
        phone: function (value) {
            // Remove spaces, hyphens and brackets before checking.
            var digits = value.replace(/[\s\-()]/g, '');
            return PHONE_PATTERN.test(digits) ? '' : 'Please enter a valid South African number, for example 012 345 6789 or +27 12 345 6789.';
        },
        area: function (value) {
            var n = Number(value);
            if (!Number.isInteger(n) || n < 1 || n > 500) { return 'Enter a whole number between 1 and 500.'; }
            return '';
        },
        date: function (value) {
            // en-CA formats a date as YYYY-MM-DD in the visitor's own
            // time zone, which matches the value of a date input.
            var today = new Date().toLocaleDateString('en-CA');
            return value < today ? 'Please choose today or a future date.' : '';
        },
        problem: function (value) {
            return value.length < 10 ? 'Please describe the problem in at least 10 characters.' : '';
        },
        message: function (value) {
            return value.length < 10 ? 'Please write a message of at least 10 characters.' : '';
        }
    };

    // Finds the error <span> that belongs to a field (id + "-error").
    function errorBox(field) {
        return document.getElementById(field.id + '-error');
    }

    // Checks ONE field. Returns true when the field is valid.
    function validateField(field) {
        // Disabled fields and fields that are hidden by the page are skipped.
        if (field.disabled || field.closest('[hidden]')) { return true; }

        var value = field.value.trim();
        var message = '';

        if (field.required && value === '') {
            message = 'This field is required.';
        } else if (value !== '') {
            // 1) The browser's own built-in checks (Constraint Validation API).
            if (field.validity.tooLong) {
                message = 'Please use no more than ' + field.maxLength + ' characters.';
            } else if (rules[field.id]) {
                // 2) Our own, more specific rule for this field.
                message = rules[field.id](value);
            } else if (field.validity.typeMismatch || field.validity.patternMismatch) {
                message = 'Please check the format of this field.';
            }
        }

        // Show or clear the message. aria-invalid tells screen readers.
        var box = errorBox(field);
        if (box) { box.textContent = message; }
        field.setAttribute('aria-invalid', message ? 'true' : 'false');
        field.classList.toggle('invalid', Boolean(message));
        field.classList.toggle('valid', !message && value !== '');
        return message === '';
    }

    // Checks every field in the form. Focuses the first problem field.
    function validateForm(form) {
        var fields = Array.prototype.slice.call(form.querySelectorAll('input, select, textarea'));
        var firstBad = null;

        fields.forEach(function (field) {
            if (field.type === 'radio' || field.type === 'hidden' || field.classList.contains('honeypot-input')) { return; }
            if (field.name === 'website') { return; } // honeypot is not validated
            if (!validateField(field) && !firstBad) { firstBad = field; }
        });

        if (firstBad) { firstBad.focus(); }
        return firstBad === null;
    }

    // Adds live feedback: check a field when the visitor leaves it, and
    // re-check while typing once it has been marked wrong.
    function attachLiveValidation(form) {
        form.addEventListener('focusout', function (event) {
            var f = event.target;
            if (f.matches('input, select, textarea') && f.type !== 'radio' && f.name !== 'website') { validateField(f); }
        });
        form.addEventListener('input', function (event) {
            var f = event.target;
            if (f.classList && f.classList.contains('invalid')) { validateField(f); }
        });
    }

    // Shows "34 / 500" under a textarea and updates it while typing.
    function attachCounter(textarea, counter) {
        if (!textarea || !counter) { return; }
        var max = textarea.maxLength;
        function update() { counter.textContent = textarea.value.length + ' / ' + max; }
        textarea.addEventListener('input', update);
        update();
    }

    // Small DOM helper: makes <tag class="...">text</tag> in one line.
    function el(tag, className, text) {
        var node = document.createElement(tag);
        if (className) { node.className = className; }
        if (text !== undefined) { node.textContent = text; } // textContent = safe plain text
        return node;
    }

    // Formats a number as South African rand, e.g. "R3600" (same style as
    // the prices on the Services page).
    function rand(amount) {
        return 'R' + Math.round(amount);
    }

    /* ================= 2. ENQUIRY FORM ================= */
    var enquiryForm = document.getElementById('enquiry-form');

    if (enquiryForm) {
        var resultPanel = document.getElementById('enquiry-result');
        var serviceSelect = document.getElementById('service');
        var areaGroup = document.getElementById('area-group');
        var areaInput = document.getElementById('area');
        var dateGroup = document.getElementById('date-group');
        var dateInput = document.getElementById('date');
        var submitButton = enquiryForm.querySelector('button[type="submit"]');
        var urgencyRadios = enquiryForm.querySelectorAll('input[name="urgency"]');

        // Turn off the browser's own pop-up messages so ours are used.
        // Done here (not in the HTML) so the form still validates natively
        // if JavaScript is unavailable (MDN Web Docs n.d.a).
        enquiryForm.noValidate = true;
        attachLiveValidation(enquiryForm);
        attachCounter(document.getElementById('problem'), document.getElementById('problem-count'));

        // Earliest selectable date is today (local time).
        dateInput.min = new Date().toLocaleDateString('en-CA');

        // Show the area field only for services priced per square meter.
        function updateAreaField() {
            var service = SERVICES[serviceSelect.value];
            var needsArea = Boolean(service && service.perM2);
            areaGroup.hidden = !needsArea;
            areaInput.required = needsArea;
            if (!needsArea) { areaInput.value = ''; areaInput.classList.remove('invalid'); errorBox(areaInput).textContent = ''; }
        }

        // An emergency means "as soon as possible", so no date is needed.
        function updateDateField() {
            var emergency = enquiryForm.elements.urgency.value === 'emergency';
            dateGroup.hidden = emergency;
            dateInput.disabled = emergency;
            dateInput.required = !emergency;
        }

        serviceSelect.addEventListener('change', updateAreaField);
        urgencyRadios.forEach(function (r) { r.addEventListener('change', updateDateField); });
        updateAreaField();
        updateDateField();

        // Works out the cost estimate text for the chosen service.
        function buildEstimate(data) {
            var service = SERVICES[data.service];
            if (service.price === null) {
                return 'We will give you a quote once we have read your description.';
            }
            if (service.perM2) {
                var total = service.price * Number(data.area);
                return 'Estimated cost: from ' + rand(total) + ' (' + rand(service.price) +
                       ' per square meter x ' + data.area + ' square meters).';
            }
            return 'Estimated cost: from ' + rand(service.price) + '.';
        }

        // Works out the availability message from urgency and chosen date.
        function buildAvailability(data) {
            var branch = BRANCHES[data.branch];
            if (data.urgency === 'emergency') {
                return 'Emergency callouts are available at any time. Please call the ' +
                       branch.name + ' branch now on ' + branch.phone + '.';
            }
            // Split "2026-10-25" into numbers and build a local date.
            var parts = data.date.split('-').map(Number);
            var chosen = new Date(parts[0], parts[1] - 1, parts[2]);
            // toLocaleDateString turns a date into readable text, e.g. "Monday, 26 October 2026"
            // (MDN Web Docs n.d.c).
            var niceDate = chosen.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
            var shortDate = chosen.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });

            if (chosen.getDay() === 0) { // 0 = Sunday
                return shortDate + ' falls on a Sunday. Our standard hours are Monday to Saturday, 07:00-18:00, so we will suggest the next working day. For an emergency, call ' + branch.phone + '.';
            }
            return 'We are available on ' + niceDate + ' (Mon-Sat, 07:00-18:00). The ' +
                   branch.name + ' branch will confirm a time slot with you.';
        }

        // Builds the result panel with DOM methods and shows it.
        function showResult(data, sent) {
            resultPanel.textContent = ''; // clear any earlier result

            resultPanel.appendChild(el('h2', '', sent ? 'Thank you, ' + data.name + '!' : 'Your estimate is ready'));
            resultPanel.appendChild(el('p', sent ? 'status-ok' : 'status-warn', sent
                ? 'Your enquiry was sent successfully.'
                : 'We could not reach the server, so your enquiry was NOT sent. Please call the ' +
                  BRANCHES[data.branch].name + ' branch on ' + BRANCHES[data.branch].phone + ' or try again.'));

            var summary = el('ul', 'result-list');
            [
                ['Service', SERVICES[data.service].label],
                ['Branch', BRANCHES[data.branch].name],
                ['Cost', buildEstimate(data)],
                ['Availability', buildAvailability(data)]
            ].forEach(function (row) {
                var li = el('li');
                li.appendChild(el('strong', '', row[0] + ': '));
                li.appendChild(document.createTextNode(row[1]));
                summary.appendChild(li);
            });
            resultPanel.appendChild(summary);
            resultPanel.appendChild(el('p', 'small-print', 'This estimate uses the starting prices on our Services page. The final price is confirmed before any work starts.'));

            var again = el('button', 'btn-secondary', 'Make another enquiry');
            again.type = 'button';
            again.addEventListener('click', function () {
                enquiryForm.reset();
                resultPanel.hidden = true;
                enquiryForm.hidden = false;
                enquiryForm.querySelectorAll('.valid, .invalid').forEach(function (f) { f.classList.remove('valid', 'invalid'); });
                updateAreaField(); updateDateField();
                document.getElementById('problem-count').textContent = '0 / ' + document.getElementById('problem').maxLength;
                document.getElementById('name').focus();
            });
            resultPanel.appendChild(again);

            enquiryForm.hidden = true;
            resultPanel.hidden = false;
            resultPanel.focus(); // moves keyboard / screen reader focus to the result
        }

        // The submit handler. "async" lets us use "await" to wait for fetch.
        enquiryForm.addEventListener('submit', async function (event) {
            event.preventDefault(); // stop the normal page-reloading submit

            if (!validateForm(enquiryForm)) { return; }
            if (enquiryForm.elements.website.value !== '') { return; } // honeypot filled = bot

            var data = {
                name: enquiryForm.elements.name.value.trim(),
                email: enquiryForm.elements.email.value.trim(),
                phone: enquiryForm.elements.phone.value.trim(),
                service: serviceSelect.value,
                area: areaInput.value,
                branch: enquiryForm.elements.branch.value,
                urgency: enquiryForm.elements.urgency.value,
                date: dateInput.disabled ? '' : dateInput.value,
                problem: enquiryForm.elements.problem.value.trim()
            };

            // Stop double clicks while the request is running.
            submitButton.disabled = true;
            submitButton.textContent = 'Sending...';

            var sent = false;
            try {
                // AJAX: send the data in the background as JSON
                // (MDN Web Docs n.d.g; JSONPlaceholder n.d.).
                var response = await fetch(ENQUIRY_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
                    body: JSON.stringify(data)
                });
                sent = response.ok; // true for status codes 200-299
            } catch (error) {
                sent = false; // network problem: fetch throws an error
            }

            submitButton.disabled = false;
            submitButton.textContent = 'Send';
            showResult(data, sent);
        });
    }

    /* ================= 3. CONTACT FORM ================= */
    var contactForm = document.getElementById('contact-form');

    if (contactForm) {
        var previewPanel = document.getElementById('email-preview');

        contactForm.noValidate = true;
        attachLiveValidation(contactForm);
        attachCounter(document.getElementById('message'), document.getElementById('message-count'));

        // Compiles the validated answers into an email.
        function compileEmail(data) {
            var subject = 'FlowFix website: ' + data.type + ' from ' + data.name;
            var lines = [
                'Name: ' + data.name,
                'Email: ' + data.email,
                'Phone: ' + (data.phone || 'not provided'),
                'Type of message: ' + data.type,
                '',
                'Message:',
                data.message
            ];
            var body = lines.join('\r\n'); // \r\n = line break used in emails

            // A mailto: link opens the visitor's email app with the
            // recipient, subject and body filled in. encodeURIComponent
            // makes the text safe to place inside a web address
            // (Duerst, Masinter and Zawinski 2010).
            var link = 'mailto:' + RECIPIENT +
                       '?subject=' + encodeURIComponent(subject) +
                       '&body=' + encodeURIComponent(body);
            return { subject: subject, body: body, link: link };
        }

        function showPreview(email) {
            previewPanel.textContent = '';
            previewPanel.appendChild(el('h2', '', 'Your email is ready'));
            previewPanel.appendChild(el('p', '', 'Check the email below. It has NOT been sent yet - press the button to open it in your email app, then press Send there.'));

            var box = el('div', 'email-box');
            var toLine = el('p'); toLine.appendChild(el('strong', '', 'To: ')); toLine.appendChild(document.createTextNode(RECIPIENT));
            var subjLine = el('p'); subjLine.appendChild(el('strong', '', 'Subject: ')); subjLine.appendChild(document.createTextNode(email.subject));
            box.appendChild(toLine);
            box.appendChild(subjLine);
            box.appendChild(el('pre', '', email.body)); // <pre> keeps the line breaks
            previewPanel.appendChild(box);

            var send = el('a', 'cta-button', 'Open in my email app');
            send.href = email.link;
            previewPanel.appendChild(send);

            var edit = el('button', 'btn-secondary', 'Edit message');
            edit.type = 'button';
            edit.addEventListener('click', function () {
                previewPanel.hidden = true;
                contactForm.hidden = false;
                document.getElementById('message').focus();
            });
            previewPanel.appendChild(edit);

            contactForm.hidden = true;
            previewPanel.hidden = false;
            previewPanel.focus();
        }

        contactForm.addEventListener('submit', function (event) {
            event.preventDefault();

            if (!validateForm(contactForm)) { return; }
            if (contactForm.elements.website.value !== '') { return; } // honeypot

            showPreview(compileEmail({
                name: contactForm.elements.name.value.trim(),
                email: contactForm.elements.email.value.trim(),
                phone: contactForm.elements.phone.value.trim(),
                type: contactForm.elements.type.value,
                message: contactForm.elements.message.value.trim()
            }));
        });
    }
})();
