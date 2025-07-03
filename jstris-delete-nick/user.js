// ==UserScript==
// @name         delete 'nick' from localStorage
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Delete the 'nick' key from localStorage when accessing the site
// @author       You
// @match        https://jstris.jezevec10.com/*
// @exclude      https://jstris.jezevec10.com/replay/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=jezevec10.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    localStorage.removeItem('nick');
})();
