// ==UserScript==
// @name         Jstris Replay のスキンをinvisible/visibleに切り替え
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Replay中にスキンをvisibleとinvisibleで切り替えられるUIを右下に追加（Set Skinラベル付き）
// @author       You
// @match        https://jstris.jezevec10.com/replay/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    function setSkin(bsValue) {
        try {
            const encoded = document.getElementById('rep0')?.value?.trim();
            if (!encoded) throw new Error('Replay data not found in rep0 textarea');

            const json = LZString.decompressFromEncodedURIComponent(encoded);
            if (!json) throw new Error('Failed to decompress data');

            const obj = JSON.parse(json);
            if (!obj?.c) throw new Error('Invalid replay data structure (missing c)');

            obj.c.bs = bsValue;

            const recompressed = LZString.compressToEncodedURIComponent(JSON.stringify(obj));
            if (!recompressed) throw new Error('Failed to recompress modified data');

            document.getElementById('rep0').value = recompressed;

            console.log(`[Replay Modifier] Skin set to ${bsValue === 1 ? 'Visible (1)' : 'Invisible (100)'}`);
            alert(`スキンを ${bsValue === 1 ? 'Visible' : 'Invisible'} に設定しました。\nページ下の「Load Replay」ボタンを再度押してください。`);
        } catch (err) {
            console.error('[Replay Modifier]', err.message);
        }
    }

    function createButtons() {
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.bottom = '10px';
        container.style.right = '10px';
        container.style.zIndex = '9999';
        container.style.background = '#222';
        container.style.padding = '10px';
        container.style.borderRadius = '8px';
        container.style.boxShadow = '0 0 8px rgba(0,0,0,0.3)';
        container.style.color = 'white';
        container.style.fontFamily = 'sans-serif';
        container.style.fontSize = '14px';

        const label = document.createElement('div');
        label.textContent = 'Set Skin';
        label.style.marginBottom = '6px';
        label.style.fontWeight = 'bold';
        label.style.textAlign = 'center';

        const btnContainer = document.createElement('div');
        btnContainer.style.display = 'flex';
        btnContainer.style.gap = '6px';
        btnContainer.style.justifyContent = 'center';

        const btnInvisible = document.createElement('button');
        btnInvisible.textContent = 'Invisible';
        btnInvisible.style = baseButtonStyle();
        btnInvisible.addEventListener('click', () => setSkin(100));  // ← ここ修正

        const btnVisible = document.createElement('button');
        btnVisible.textContent = 'Visible';
        btnVisible.style = baseButtonStyle();
        btnVisible.addEventListener('click', () => setSkin(1));  // ← ここ修正

        btnContainer.appendChild(btnInvisible);
        btnContainer.appendChild(btnVisible);
        container.appendChild(label);
        container.appendChild(btnContainer);
        document.body.appendChild(container);
    }

    function baseButtonStyle() {
        return `
            padding: 6px 12px;
            background-color: #555;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `;
    }

    window.addEventListener('load', createButtons);
})();
