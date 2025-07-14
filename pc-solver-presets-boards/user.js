// ==UserScript==
// @name         pc-solver-presets-boards
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Add preset buttons for Tetris board configurations
// @match        https://wirelyre.github.io/tetra-tools/pc-solver.html
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 盤面プリセット定義（40個のセル：true = グレー（チェック済み）、false = 空白）
    // 各プリセットは4行×10列の配列として定義
    const presets = {
        'パフェ積み（左）': [
            // Row 0 (bottom row)
            [true, true, true, false, false, false, false, true, true, true],
            // Row 1
            [true, true, true, true, false, false, false, true, true, true],
            // Row 2
            [true, true, true, false, false, false, false, true, true, true],
            // Row 3 (top row)
            [true, true, false, false, false, false, false, true, true, true]
        ],

        'パフェ積み（右）': [
            // Row 0 (bottom row)
            [true, true, true, false, false, false, false, true, true, true],
            // Row 1
            [true, true, true, false, false, false, true, true, true, true],
            // Row 2
            [true, true, true, false, false, false, false, true, true, true],
            // Row 3 (top row)
            [true, true, true, false, false, false, false, false, true, true]
        ],

        '4×4PC': [
            // Row 0 (bottom row)
            [true, true, true, true, true, true, false, false, false, false],
            // Row 1
            [true, true, true, true, true, true, false, false, false, false],
            // Row 2
            [true, true, true, true, true, true, false, false, false, false],
            // Row 3 (top row)
            [true, true, true, true, true, true, false, false, false, false]
        ],

        '5×4列PC': [
            // Row 0 (bottom row)
            [true, true, true, false, false, false, false, false, true, true],
            // Row 1
            [true, true, true, false, false, false, false, false, true, true],
            // Row 2
            [true, true, true, false, false, false, false, false, true, true],
            // Row 3 (top row)
            [true, true, true, false, false, false, false, false, true, true]
        ]
    };

    // 盤面を設定する関数
    function setBoardPreset(preset) {
        // 40個のセルを順番に設定
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 10; col++) {
                const cellId = `cell${row * 10 + col}`;
                const checkbox = document.getElementById(cellId);
                if (checkbox) {
                    checkbox.checked = preset[row][col];
                }
            }
        }
    }

    // ボタンコンテナを作成する関数
    function createButtonContainer() {
        const container = document.createElement('div');
        container.id = 'preset-buttons-container';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '5px';
        container.style.marginLeft = '20px'; // queryエリアとの間隔
        container.style.alignItems = 'flex-start';

        return container;
    }

    // ボタンを作成する関数
    function createPresetButton(name, preset) {
        const btn = document.createElement('button');
        btn.textContent = name;
        btn.style.padding = '8px 12px';
        btn.style.backgroundColor = '#2196F3';
        btn.style.color = 'white';
        btn.style.border = 'none';
        btn.style.borderRadius = '4px';
        btn.style.cursor = 'pointer';
        btn.style.fontSize = '12px';
        btn.style.minWidth = '120px';
        btn.style.whiteSpace = 'nowrap';

        // ホバー効果
        btn.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#1976D2';
        });
        btn.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '#2196F3';
        });

        btn.addEventListener('click', function() {
            setBoardPreset(preset);
        });

        return btn;
    }

    // 全てのプリセットボタンを作成
    function createAllButtons() {
        const queryDiv = document.getElementById('query');
        if (!queryDiv) {
            console.error('query div not found');
            return;
        }

        // queryDivの親要素を取得
        const parentElement = queryDiv.parentElement;
        if (!parentElement) {
            console.error('query div parent not found');
            return;
        }

        // queryDivとボタンを包むラッパーを作成
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'flex-start';
        wrapper.style.marginBottom = '20px'; // solutionsとの間隔

        // queryDivをラッパーに移動
        parentElement.insertBefore(wrapper, queryDiv);
        wrapper.appendChild(queryDiv);

        // ボタンコンテナを作成
        const container = createButtonContainer();

        // 各プリセットボタンを作成してコンテナに追加
        const presetNames = Object.keys(presets);
        presetNames.forEach((name) => {
            const button = createPresetButton(name, presets[name]);
            container.appendChild(button);
        });

        // ラッパーにコンテナを追加
        wrapper.appendChild(container);
    }

    // ページ読み込み完了後にボタンを作成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createAllButtons);
    } else {
        createAllButtons();
    }
})();