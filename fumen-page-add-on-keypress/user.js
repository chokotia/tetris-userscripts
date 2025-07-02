// ==UserScript==
// @name         「a」キー入力でページ追加を実施
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  「a」キーを押したときにページ追加のための「＋」ボタンを押下した際の処理を実行する。
// @author       You
// @match        https://knewjade.github.io/fumen-for-mobile/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.io
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // キーイベントのリスナーを追加
    document.addEventListener('keydown', function(event) {
        // 「a」キーが押されたかチェック (キーコード: 65)
        if (event.key === 'a' || event.keyCode === 65) {
            // テキスト入力フィールドでキーが押された場合は無視
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.isContentEditable) {
                return;
            }

            // 対象のボタン要素を取得
            const button = document.querySelector('[datatest="btn-next-page"]');

            // ボタンが存在する場合はクリック
            if (button) {
                // クリックイベントを作成して発火
                const clickEvent = new MouseEvent('click', {
                    view: window,
                    bubbles: true,
                    cancelable: true
                });
                button.dispatchEvent(clickEvent);

            }
        }
    });
})();
