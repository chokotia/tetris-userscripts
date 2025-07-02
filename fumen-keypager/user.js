// ==UserScript==
// @name         [Fumen] 左右とPage Up/Downキーでページを移動する機能を追加
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Navigate fumen pages with arrow keys (left/right: single, pageup/pagedown: 10x)
// @author       You
// @match        https://knewjade.github.io/fumen-for-mobile/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.io
// @grant        none
// ==/UserScript==
(function() {
    'use strict';

    // ==== 設定定数 ====
    const MULTI_CLICK_COUNT = 200; // Page Up/Downキーでの移動回数

    // 次へボタン（<a>タグ）のクリックをシミュレーションする関数
    function simulateNextButtonClick() {
        const nextButton = document.querySelector('a[datatest="btn-next-page"]');
        if (nextButton) {
            nextButton.click();
            console.log('次へボタンをクリックしました。');
            return true;
        } else {
            console.log('次へボタンが見つかりませんでした。');
            return false;
        }
    }

    // 戻るボタン（<a>タグ）のクリックをシミュレーションする関数
    function simulateBackButtonClick() {
        const backButton = document.querySelector('a[datatest="btn-back-page"]');
        if (backButton) {
            backButton.click();
            console.log('戻るボタンをクリックしました。');
            return true;
        } else {
            console.log('戻るボタンが見つかりませんでした。');
            return false;
        }
    }

    // 複数回のクリックを順次実行する関数
    function simulateMultipleClicks(clickFunction, count) {
        for (let i = 0; i < count; i++) {
            if (!clickFunction()) {
                console.log(`${i}回実行後、ボタンが見つからなくなりました。`);
                break;
            }
        }
        console.log(`${count}回の実行が完了しました。`);
    }

    // キーボードイベントリスナーを追加
    document.addEventListener('keydown', function(event) {
        // フォーカスされている要素がinputやtextareaでない場合のみ実行
        const activeElement = document.activeElement;
        const isInputField = activeElement.tagName === 'INPUT' ||
                            activeElement.tagName === 'TEXTAREA' ||
                            activeElement.contentEditable === 'true';

        if (!isInputField) {
            switch (event.key) {
                case 'ArrowRight':
                    event.preventDefault(); // デフォルトの動作を防ぐ
                    simulateNextButtonClick();
                    break;
                case 'ArrowLeft':
                    event.preventDefault(); // デフォルトの動作を防ぐ
                    simulateBackButtonClick();
                    break;
                case 'PageUp':
                    event.preventDefault(); // デフォルトの動作を防ぐ
                    console.log(`Page Upキー: 次へを${MULTI_CLICK_COUNT}回実行開始`);
                    simulateMultipleClicks(simulateNextButtonClick, MULTI_CLICK_COUNT);
                    break;
                case 'PageDown':
                    event.preventDefault(); // デフォルトの動作を防ぐ
                    console.log(`Page Downキー: 戻るを${MULTI_CLICK_COUNT}回実行開始`);
                    simulateMultipleClicks(simulateBackButtonClick, MULTI_CLICK_COUNT);
                    break;
            }
        }
    });

    console.log('Fumen Navigation UserScript が読み込まれました。');
    console.log('左矢印キー: 戻る, 右矢印キー: 次へ');
    console.log(`Page Upキー: 次へを${MULTI_CLICK_COUNT}回, Page Downキー: 戻るを${MULTI_CLICK_COUNT}回`);
})();
