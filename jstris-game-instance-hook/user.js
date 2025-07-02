// ==UserScript==
// @name         jstris-game-instance-hook
// @namespace    http://tampermonkey.net/
// @version      2025-06-30
// @description  jstris（v1.40.1）において、Gameクラスのインスタンスを外部からアクセスできるようにWindowオブジェクトに登録します。
// @author       chokotia
// @match        https://jstris.jezevec10.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=jezevec10.com
// @grant        none
// @run-at       document-start
// @require      https://raw.githubusercontent.com/chokotia/tetris-userscripts-internal/refs/heads/main/jstris-game-instance-hook/onloadWrapper.js
// ==/UserScript==

(function () {
    'use strict';

    // 既存 onload を無効化
    Object.defineProperty(window, 'onload', {
        configurable: true,
        enumerable: true,
        get: function () {
            return null;
        },
        set: function (fn) {
            console.log('Tampermonkey: window.onload 無効化');
        }
    });

    // 自前の onload を使う
    window.addEventListener('load', MyOnLoad);
})();
