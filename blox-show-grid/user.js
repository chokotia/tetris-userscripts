// ==UserScript==
// @name         グリッド表示
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  テトリス盤面に3×3,3×4,3×3のグリッドを表示する
// @author       sasa24
// @match        https://blox.askplays.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // グリッド描画に使用する設定
    const GRID_COLOR = 'lightblue'; // グリッドの色
    const GRID_LINE_WIDTH = 2; // 線の太さ
    //const GRID_COLUMN_DIVISIONS = [3, 7]; // 列の分割ポイント（3:4:3 の配置）
    const GRID_COLUMN_DIVISIONS = [5]; // 列の分割ポイント（3:4:3 の配置）
    const GRID_ROW_DIVISIONS = [2,5,8,11,14,17,20]; // 行の分割ポイント（6つの等間隔の分割）

    window.addEventListener('load', function() {
        // 盤面のcanvas要素とコンテナを取得
        const playingField = document.getElementById('back-canvas'); // 盤面のcanvas
        const container = document.getElementById('cv'); // 全体を囲むdiv

        if (!playingField || !container) {
            console.error("エラー: 必要な要素 (canvasまたはコンテナ) が見つかりません。スクリプトを終了します。");
            return;
        }

        // グリッドを表示するためのオーバーレイcanvasを作成
        const gridCanvas = createGridCanvas(playingField, container);
        const ctx = gridCanvas.getContext('2d');

        let cellWidth = gridCanvas.width / 10; // 10列
        let cellHeight = gridCanvas.height / 20; // 20行

        // グリッドを描画する関数
        function drawGrid() {
            ctx.clearRect(0, 0, gridCanvas.width, gridCanvas.height); // 既存の描画をクリア
            ctx.strokeStyle = GRID_COLOR;
            ctx.lineWidth = GRID_LINE_WIDTH;

            // 縦線を描画
            GRID_COLUMN_DIVISIONS.forEach(function(colIndex) {
                const x = colIndex * cellWidth;
                drawLine(ctx, x, 0, x, gridCanvas.height);
            });

            // 横線を描画
            GRID_ROW_DIVISIONS.forEach(function(rowIndex) {
                const y = rowIndex * cellHeight;
                drawLine(ctx, 0, y, gridCanvas.width, y);
            });
        }

        // 初回描画
        drawGrid();

        // ウィンドウサイズ変更時に再描画
        window.addEventListener('resize', handleResize);

        /**
         * グリッドキャンバスを作成し、コンテナに追加する関数
         * @param {HTMLElement} playingField - 盤面のcanvas要素
         * @param {HTMLElement} container - コンテナのdiv要素
         * @returns {HTMLCanvasElement} - 作成したグリッドキャンバス
         */
        function createGridCanvas(playingField, container) {
            const gridCanvas = document.createElement('canvas');

            // 盤面のサイズを設定（正確な幅と高さを取得）
            gridCanvas.width = playingField.width;  // 320px
            gridCanvas.height = playingField.height; // 640px

            // グリッドキャンバスのスタイルを設定
            gridCanvas.style.position = 'absolute';
            gridCanvas.style.left = '0px';
            gridCanvas.style.top = '0px';
            gridCanvas.style.pointerEvents = 'none'; // ゲーム操作の邪魔をしない
            gridCanvas.style.zIndex = '10'; // 必要に応じて調整
            gridCanvas.style.border = '2px solid lightblue'; // 境界線の色と幅

            container.appendChild(gridCanvas);
            return gridCanvas;
        }

        /**
         * 線を描画する関数
         * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
         * @param {number} x1 - 始点のx座標
         * @param {number} y1 - 始点のy座標
         * @param {number} x2 - 終点のx座標
         * @param {number} y2 - 終点のy座標
         */
        function drawLine(ctx, x1, y1, x2, y2) {
            ctx.beginPath();
            ctx.moveTo(x1 + 0.5, y1 + 0.5); // ピクセル境界の対処
            ctx.lineTo(x2 + 0.5, y2 + 0.5);
            ctx.stroke();
        }

        /**
         * リサイズ時にグリッドを再描画する関数
         */
        function handleResize() {
            // グリッドキャンバスのサイズを再設定
            gridCanvas.width = playingField.width;
            gridCanvas.height = playingField.height;

            // セルサイズを再計算
            cellWidth = gridCanvas.width / 10; // 10列
            cellHeight = gridCanvas.height / 20; // 20行

            // グリッドを再描画
            drawGrid();
        }
    });

})();
