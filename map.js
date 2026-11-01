/*
    FlowFix Plumbing Services - map.js
    Part 3: Interactive maps with Leaflet (contact.html)

    Leaflet is a free JavaScript map library. It draws the map from
    "tiles" (small square pictures) supplied by OpenStreetMap, and lets
    the visitor drag, zoom and click markers. This file also adds a
    location-based feature: "Find my nearest branch".

    Sources (full references are in the README):
      - Leaflet 2023 (Leaflet library, version 1.9.4)
      - Leaflet n.d. (Leaflet quick start guide)
      - OpenStreetMap Foundation n.d. (tile usage policy and attribution)
      - MDN Web Docs n.d.h (Geolocation API)
      - Veness n.d. (haversine formula for distance)
*/
(function () {
    'use strict';

    // Leaflet creates a global object called "L". If the file did not
    // load (for example, no internet), stop and leave the fallback links.
    if (typeof L === 'undefined') { return; }

    // Tell Leaflet where its marker pictures are stored (self-hosted copy).
    L.Icon.Default.imagePath = 'js_assets/vendor/leaflet/images/';

    // Branch details. lat = latitude, lng = longitude (taken from the
    // addresses on the contact page).
    var branches = [
        { key: 'pretoria', mapId: 'map-pretoria', cardId: 'card-pretoria',
          name: 'Pretoria Central', address: '78 Andries Street, Pretoria Central, 0001',
          lat: -25.74244, lng: 28.18804 },
        { key: 'centurion', mapId: 'map-centurion', cardId: 'card-centurion',
          name: 'Centurion', address: '12 Ietermagog Street, Wierda Park, Centurion, 0157',
          lat: -25.85656, lng: 28.14171 }
    ];

    branches.forEach(function (branch) {
        var container = document.getElementById(branch.mapId);
        if (!container) { return; }

        container.textContent = ''; // remove the no-JavaScript fallback link

        // 1. Create the map. scrollWheelZoom is off so the page can still
        //    be scrolled with the mouse wheel when the cursor is over a map.
        var map = L.map(container, { scrollWheelZoom: false })
                   .setView([branch.lat, branch.lng], 15); // zoom 15 = street level

        // 2. Add the background tiles. The attribution text credits
        //    OpenStreetMap, which its licence requires.
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // 3. Add a marker with a popup. The popup is built from DOM
        //    elements (not an HTML string) to keep it safe.
        var popup = document.createElement('div');
        var title = document.createElement('strong');
        title.textContent = 'FlowFix ' + branch.name;
        var addr = document.createElement('div');
        addr.textContent = branch.address;
        popup.appendChild(title);
        popup.appendChild(addr);

        L.marker([branch.lat, branch.lng], { title: 'FlowFix ' + branch.name })
            .addTo(map)
            .bindPopup(popup);
    });

    /* ---------- Find my nearest branch (location-based feature) ---------- */
    var findButton = document.getElementById('find-nearest');
    var result = document.getElementById('nearest-result');

    // Only offer the button if the browser can find the visitor's location.
    if (!findButton || !('geolocation' in navigator)) { return; }
    findButton.hidden = false;

    // Haversine formula: the straight-line distance in km between two
    // latitude/longitude points on the Earth (Veness n.d.).
    function distanceKm(lat1, lng1, lat2, lng2) {
        var R = 6371; // Earth's radius in km
        var toRad = function (deg) { return deg * Math.PI / 180; };
        var dLat = toRad(lat2 - lat1);
        var dLng = toRad(lng2 - lng1);
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    findButton.addEventListener('click', function () {
        result.textContent = 'Finding your location...';

        // The browser asks the visitor for permission first. The location
        // is only used here, in the page - it is not stored or sent anywhere.
        navigator.geolocation.getCurrentPosition(function (position) {
            var nearest = null;
            var nearestDistance = Infinity;

            branches.forEach(function (branch) {
                var d = distanceKm(position.coords.latitude, position.coords.longitude, branch.lat, branch.lng);
                if (d < nearestDistance) { nearestDistance = d; nearest = branch; }
            });

            // Remove any old highlight, then highlight the nearest card.
            branches.forEach(function (b) {
                document.getElementById(b.cardId).classList.remove('nearest');
            });
            document.getElementById(nearest.cardId).classList.add('nearest');

            result.textContent = 'Your nearest branch is ' + nearest.name +
                ' (about ' + nearestDistance.toFixed(1) + ' km away).';
        }, function () {
            // The error callback runs if the visitor says no or it fails.
            result.textContent = 'We could not get your location. Please choose a branch from the list below.';
        });
    });
})();
