// ==UserScript==
// @name         YouTube Tetris Color Detector with Fumen Export
// @namespace    http://tampermonkey.net/
// @version      0.6
// @description  Detect Tetris board colors from YouTube video with 10x20 grid analysis and export to Fumen
// @author       You
// @match        https://www.youtube.com/watch*
// @grant        none
// @require      https://raw.githubusercontent.com/chokotia/tetris-userscripts/refs/heads/main/tetris-replay-fumen/lib/fumen.bundle.js
// ==/UserScript==

(function() {
    'use strict';

    let detectionFrame = null;
    let isDragging = false;
    let dragType = null; // 'move', 'resize-tl', 'resize-tr', 'resize-bl', 'resize-br'
    let dragStartX = 0;
    let dragStartY = 0;
    let frameStartX = 0;
    let frameStartY = 0;
    let frameStartWidth = 0;
    let frameStartHeight = 0;

    // テトリスミノの色定義（新しい判定ロジック）
    const TETRIS_COLORS = {
        'GRAY': { // せりあがりブロック（灰色）
            check: (r, g, b) => {return r > 50 || g > 50 || b > 50;},
            char: 'X'
        },
        'I': { // Iミノ（水色）
            check: (r, g, b) => {return false;},
            char: 'I'
        },
        'S': { // Sミノ（黄緑色）
            check: (r, g, b) => {return false;},
            char: 'S'
        },
        'Z': { // Zミノ（赤色）
            check: (r, g, b) => {return false;},
            char: 'Z'
        },
        'J': { // Jミノ（青色）
            check: (r, g, b) => {return false;},
            char: 'J'
        },
        'L': { // Lミノ（橙色）
            check: (r, g, b) => {return false;},
            char: 'L'
        },
        'O': { // Oミノ（黄色）
            check: (r, g, b) => {return false;},
            char: 'O'
        },
        'T': { // Tミノ（紫色）
            check: (r, g, b) => {return false;},
            char: 'T'
        }
    };

    // Fumen変換用のクラス
    const YouTubeToFumenConverter = (function () {
        // YouTubeの検出結果からFumen用の文字列に変換
        function boardToFumenFieldString(board) {
            let result = '';
            const reversed = [...board].reverse();  // ← ここで逆順
            for (const row of reversed) {
                result += row.join('');
            }
            return result;
        }

        function boardToFumenURL(board) {
            try {
                const fieldStr = boardToFumenFieldString(board);
                const field = tetrisFumen.Field.create(fieldStr);

                const pages = [{ field, comment: '' }];
                const fumen = tetrisFumen.encoder.encode(pages);
                return `https://knewjade.github.io/fumen-for-mobile/#?d=${fumen}`;
            } catch (error) {
                console.error('Fumen URL generation failed:', error);
                return null;
            }
        }

        return {
            boardToFumenURL,
        };
    })();

    // 色からミノの種類を判定（新しいロジック）
    function identifyMino(color) {
        const { r, g, b } = color;

        // 各ミノの判定を順番に実行
        for (const [minoType, minoData] of Object.entries(TETRIS_COLORS)) {
            if (minoData.check(r, g, b)) {
                return minoData.char;
            }
        }

        return '_'; // 背景
    }

    // 検出ボタンを作成
    function createDetectionButton() {
        const button = document.createElement('button');
        button.id = 'tetris-detect-button';
        button.textContent = 'Detect Tetris';
        button.style.position = 'fixed';
        button.style.top = '10px';
        button.style.right = '10px';
        button.style.zIndex = '10002';
        button.style.padding = '10px 20px';
        button.style.backgroundColor = '#ff0000';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '5px';
        button.style.cursor = 'pointer';
        button.style.fontSize = '14px';
        button.style.fontWeight = 'bold';

        button.addEventListener('click', () => {
            const board = detectTetrisBoard();
            if (board) {
                displayTetrisBoard(board);
            }
        });

        return button;
    }

    // 矩形フレームを作成
    function createDetectionFrame() {
        const frame = document.createElement('div');
        frame.id = 'color-detection-frame';
        frame.style.position = 'absolute';
        frame.style.border = '2px solid red';
        frame.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
        frame.style.zIndex = '10000';
        frame.style.width = '200px';
        frame.style.height = '400px';
        frame.style.cursor = 'move';
        frame.style.userSelect = 'none';

        // グリッドラインを追加
        createGridLines(frame);

        // リサイズハンドルを作成
        createResizeHandles(frame);

        // イベントリスナーを追加
        addFrameEventListeners(frame);

        return frame;
    }

    // 10×20のグリッドラインを作成
    function createGridLines(frame) {
        // 縦線（9本）
        for (let i = 1; i < 10; i++) {
            const line = document.createElement('div');
            line.style.position = 'absolute';
            line.style.left = (i * 10) + '%';
            line.style.top = '0';
            line.style.width = '1px';
            line.style.height = '100%';
            line.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
            line.style.pointerEvents = 'none';
            frame.appendChild(line);
        }

        // 横線（19本）
        for (let i = 1; i < 20; i++) {
            const line = document.createElement('div');
            line.style.position = 'absolute';
            line.style.left = '0';
            line.style.top = (i * 5) + '%';
            line.style.width = '100%';
            line.style.height = '1px';
            line.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
            line.style.pointerEvents = 'none';
            frame.appendChild(line);
        }
    }

    // リサイズハンドルを作成
    function createResizeHandles(frame) {
        const handleSize = 10;
        const handleStyle = {
            position: 'absolute',
            width: handleSize + 'px',
            height: handleSize + 'px',
            backgroundColor: 'red',
            border: '1px solid white',
            zIndex: '10001',
            userSelect: 'none'
        };

        // 左上ハンドル
        const topLeft = document.createElement('div');
        topLeft.className = 'resize-handle resize-tl';
        Object.assign(topLeft.style, handleStyle);
        topLeft.style.left = '-' + (handleSize/2) + 'px';
        topLeft.style.top = '-' + (handleSize/2) + 'px';
        topLeft.style.cursor = 'nw-resize';

        // 右上ハンドル
        const topRight = document.createElement('div');
        topRight.className = 'resize-handle resize-tr';
        Object.assign(topRight.style, handleStyle);
        topRight.style.right = '-' + (handleSize/2) + 'px';
        topRight.style.top = '-' + (handleSize/2) + 'px';
        topRight.style.cursor = 'ne-resize';

        // 左下ハンドル
        const bottomLeft = document.createElement('div');
        bottomLeft.className = 'resize-handle resize-bl';
        Object.assign(bottomLeft.style, handleStyle);
        bottomLeft.style.left = '-' + (handleSize/2) + 'px';
        bottomLeft.style.bottom = '-' + (handleSize/2) + 'px';
        bottomLeft.style.cursor = 'sw-resize';

        // 右下ハンドル
        const bottomRight = document.createElement('div');
        bottomRight.className = 'resize-handle resize-br';
        Object.assign(bottomRight.style, handleStyle);
        bottomRight.style.right = '-' + (handleSize/2) + 'px';
        bottomRight.style.bottom = '-' + (handleSize/2) + 'px';
        bottomRight.style.cursor = 'se-resize';

        frame.appendChild(topLeft);
        frame.appendChild(topRight);
        frame.appendChild(bottomLeft);
        frame.appendChild(bottomRight);
    }

    // フレームのイベントリスナーを追加
    function addFrameEventListeners(frame) {
        frame.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }

    // マウスダウンイベント
    function handleMouseDown(e) {
        e.preventDefault();
        isDragging = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;

        const frameRect = detectionFrame.getBoundingClientRect();
        frameStartX = frameRect.left;
        frameStartY = frameRect.top;
        frameStartWidth = frameRect.width;
        frameStartHeight = frameRect.height;

        if (e.target.classList.contains('resize-handle')) {
            // リサイズハンドルがクリックされた場合
            if (e.target.classList.contains('resize-tl')) {
                dragType = 'resize-tl';
            } else if (e.target.classList.contains('resize-tr')) {
                dragType = 'resize-tr';
            } else if (e.target.classList.contains('resize-bl')) {
                dragType = 'resize-bl';
            } else if (e.target.classList.contains('resize-br')) {
                dragType = 'resize-br';
            }
        } else {
            // フレーム本体がクリックされた場合（移動）
            dragType = 'move';
        }
    }

    // マウス移動イベント
    function handleMouseMove(e) {
        if (!isDragging || !detectionFrame) return;

        const deltaX = e.clientX - dragStartX;
        const deltaY = e.clientY - dragStartY;

        if (dragType === 'move') {
            // 移動
            detectionFrame.style.left = (frameStartX + deltaX) + 'px';
            detectionFrame.style.top = (frameStartY + deltaY) + 'px';
        } else if (dragType.startsWith('resize-')) {
            // リサイズ
            let newLeft = frameStartX;
            let newTop = frameStartY;
            let newWidth = frameStartWidth;
            let newHeight = frameStartHeight;

            if (dragType === 'resize-tl') {
                newLeft = frameStartX + deltaX;
                newTop = frameStartY + deltaY;
                newWidth = frameStartWidth - deltaX;
                newHeight = frameStartHeight - deltaY;
            } else if (dragType === 'resize-tr') {
                newTop = frameStartY + deltaY;
                newWidth = frameStartWidth + deltaX;
                newHeight = frameStartHeight - deltaY;
            } else if (dragType === 'resize-bl') {
                newLeft = frameStartX + deltaX;
                newWidth = frameStartWidth - deltaX;
                newHeight = frameStartHeight + deltaY;
            } else if (dragType === 'resize-br') {
                newWidth = frameStartWidth + deltaX;
                newHeight = frameStartHeight + deltaY;
            }

            // 最小サイズを制限
            const minSize = 50;
            if (newWidth < minSize || newHeight < minSize) {
                return;
            }

            detectionFrame.style.left = newLeft + 'px';
            detectionFrame.style.top = newTop + 'px';
            detectionFrame.style.width = newWidth + 'px';
            detectionFrame.style.height = newHeight + 'px';
        }
    }

    // マウスアップイベント
    function handleMouseUp(e) {
        isDragging = false;
        dragType = null;
    }

    // video要素の中央に矩形を配置（初期位置）
    function positionFrame() {
        const video = document.querySelector('video');
        if (!video || !detectionFrame) return;

        const videoRect = video.getBoundingClientRect();
        const frameWidth = 200;
        const frameHeight = 400;

        // video要素の中央に配置
        const centerX = videoRect.left + (videoRect.width - frameWidth) / 2;
        const centerY = videoRect.top + (videoRect.height - frameHeight) / 2;

        detectionFrame.style.left = centerX + 'px';
        detectionFrame.style.top = centerY + 'px';
    }

    // N（最小必要票数）を定義
    const MIN_REQUIRED_VOTES = 2;

    function detectTetrisBoard() {
        const video = document.querySelector('video');
        if (!video || !detectionFrame) return null;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        try {
            ctx.drawImage(video, 0, 0);

            const videoRect = video.getBoundingClientRect();
            const frameRect = detectionFrame.getBoundingClientRect();

            const scaleX = video.videoWidth / videoRect.width;
            const scaleY = video.videoHeight / videoRect.height;

            const frameStartX = (frameRect.left - videoRect.left) * scaleX;
            const frameStartY = (frameRect.top - videoRect.top) * scaleY;
            const frameWidth = frameRect.width * scaleX;
            const frameHeight = frameRect.height * scaleY;

            const board = [];
            for (let row = 0; row < 20; row++) {
                const rowData = [];
                for (let col = 0; col < 10; col++) {
                    const cellX0 = frameStartX + col * (frameWidth / 10);
                    const cellY0 = frameStartY + row * (frameHeight / 20);
                    const cellW = frameWidth / 10;
                    const cellH = frameHeight / 20;

                    // 各セルに 3x3 = 9点を配置
                    const votes = {};
                    for (let dy = 1; dy <= 3; dy++) {
                        for (let dx = 1; dx <= 3; dx++) {
                            const px = cellX0 + (dx / 4) * cellW;
                            const py = cellY0 + (dy / 4) * cellH;
                            const imageData = ctx.getImageData(px, py, 1, 1);
                            const data = imageData.data;

                            const color = { r: data[0], g: data[1], b: data[2], a: data[3] };
                            const mino = identifyMino(color);

                            votes[mino] = (votes[mino] || 0) + 1;
                        }
                    }

                    // 最頻値を判定
                    let bestMino = 'X';
                    let bestCount = 0;
                    for (const [mino, count] of Object.entries(votes)) {
                        if (count > bestCount) {
                            bestMino = mino;
                            bestCount = count;
                        }
                    }

                    // 判定条件：最低 MIN_REQUIRED_VOTES 以上なければ背景と見なす
                    if (bestCount < MIN_REQUIRED_VOTES) {
                        rowData.push('X');
                    } else {
                        rowData.push(bestMino);
                    }
                }
                board.push(rowData);
            }

            return board;

        } catch (error) {
            console.error('Tetris board detection failed:', error);
            return null;
        }
    }

    // テトリス盤面をコンソールに出力
    function displayTetrisBoard(board) {
        if (!board) return;

        console.log('=== TETRIS BOARD ===');
        console.log('I=水色, O=黄, T=紫, S=黄緑, Z=赤, J=青, L=橙, X=灰（せり上がり）, _=背景');
        console.log('====================');

        for (let row = 0; row < board.length; row++) {
            const rowString = board[row].join(' ');
            console.log(`${row.toString().padStart(2, '0')}: ${rowString}`);
        }

        console.log('====================');

        // Fumen URLを生成して出力
        const fumenUrl = YouTubeToFumenConverter.boardToFumenURL(board);
        if (fumenUrl) {
            console.log('🧩 FUMEN URL:', fumenUrl);
            console.log('====================');
        } else {
            console.log('❌ Fumen URL generation failed');
            console.log('====================');
        }
    }

    // 初期化
    function init() {
        const video = document.querySelector('video');
        if (!video) {
            console.log('Video element not found, retrying...');
            setTimeout(init, 2000);
            return;
        }

        console.log('Video element found, initializing Tetris detector...');

        // 矩形フレームを作成
        detectionFrame = createDetectionFrame();
        document.body.appendChild(detectionFrame);

        // 検出ボタンを作成
        const detectButton = createDetectionButton();
        document.body.appendChild(detectButton);

        // 位置を設定
        positionFrame();

        // ウィンドウサイズ変更時に位置を再調整（初回のみ）
        window.addEventListener('resize', () => {
            if (!isDragging) {
                positionFrame();
            }
        });

        console.log('Tetris detector initialized! Drag the red rectangle to move, use corner handles to resize.');
        console.log('Grid shows 10x20 Tetris board layout. Click "Detect Tetris" button to analyze.');
    }

    // ページ読み込み後に実行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(init, 3000);
        });
    } else {
        setTimeout(init, 3000);
    }

    console.log('YouTube Tetris Color Detector with Fumen Export loaded (Button-based Detection).');
})();