// ==UserScript==
// @name         Jstris Sprint ミノ順 固定化
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Jstris SprintモードでのRNG（疑似乱数生成器）が毎回同じ値を返すようにすることで、スプリントのミノ順を固定化させる。（ただし、懸念点はあり。もともと、timestamp()を初期値としているため、厳密には整合性が合わななくなる。）
// @author       you
// @match        https://jstris.jezevec10.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // GameInstanceが存在するか確認
    const waitForGameInstance = setInterval(() => {
        if (typeof window.GameInstance !== 'undefined') {
            clearInterval(waitForGameInstance);
            initUI();
        }
    }, 500);


    // CSSスタイルをJavaScriptで定義
    function addStyles() {
        const style = document.createElement('style');
        style.innerHTML = `
        #rngControlPanel {
            position: fixed;
            bottom: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 10px;
            border-radius: 8px;
            z-index: 9999;
            font-family: sans-serif;
        }

        #rngControlPanel input {
            width: 60px;
            margin-right: 5px;
        }

        #rngControlPanel button {
            cursor: pointer;
        }
        `;
        document.head.appendChild(style);
    }

    function initUI() {
        addStyles();

        const container = document.createElement('div');
        container.id = 'rngControlPanel';

        const label = document.createElement('label');
        label.textContent = 'RNG固定値 (0〜1): ';
        label.style.marginRight = '5px';

        const input = document.createElement('input');
        input.type = 'number';
        input.min = '0';
        input.max = '1';
        input.step = '0.0001';
        input.value = '0.99';

        const button = document.createElement('button');
        button.textContent = '固定化';

        button.onclick = () => {
            const val = parseFloat(input.value);
            if (isNaN(val) || val < 0 || val > 1) {
                alert('0〜1の範囲で数値を入力してください');
                return;
            }

            if (window.GameInstance) {
                window.GameInstance.RNG = function () {
                    return val;
                };
                alert(`RNGを ${val} に固定しました`);
            } else {
                alert('GameInstanceが存在しません');
            }
        };

        container.appendChild(label);
        container.appendChild(input);
        container.appendChild(button);
        document.body.appendChild(container);
    }
})();
