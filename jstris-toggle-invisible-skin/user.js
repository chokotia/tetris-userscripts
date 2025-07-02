// ==UserScript==
// @name         jstris Toggle Invisible/Visible Skin
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Switch between invisible and visible skin with the 't' key
// @author       You
// @match        https://jstris.jezevec10.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const TOGGLE_KEY = 't'; // Key to switch to invisible skin

    const INVISIBLE_SKIN_ID = 'bs01';
    const VISIBLE_SKIN_ID = 'bs0';

    /**
     * Changes the skin, saves settings, focuses on the canvas, and clicks the specified element.
     * @param {string} skinId - The ID of the radio button to switch skins
     */
    function changeSkin(skinId) {
        // Click the settings button to display the settings window
        document.getElementById('settings').click();

        // Switch to the specified skin
        document.getElementById(skinId).click();

        // Save settings and close the window
        document.getElementById('settingsSave').click();

        // Focus on the canvas and click it
        document.getElementById('myCanvas').focus();
        document.getElementById('myCanvas').click();

        // Click the element labeled "click here to continue"
        document.querySelector('.gCapt').click();
    }

    function toggleSkin() {
        const selectedValue = document.querySelector('input[name="bSkin"]:checked')?.value;
        if (selectedValue == 6) {
            changeSkin(VISIBLE_SKIN_ID);
        }
        else {
            changeSkin(INVISIBLE_SKIN_ID);
        }
    }

    document.addEventListener('keydown', function(event) {
        if (event.key === TOGGLE_KEY) {
            toggleSkin();
        }
    });

})();
