// ==UserScript==
// @name         YouTube Tetris Color Detector with Fumen Export
// @namespace    http://tampermonkey.net/
// @version      0.7
// @description  Detect Tetris board colors from YouTube video with 10x20 grid analysis and export to Fumen
// @author       You
// @match        https://www.youtube.com/watch*
// @grant        none
// @require      https://raw.githubusercontent.com/chokotia/tetris-userscripts/refs/heads/main/tetris-replay-fumen/lib/fumen.bundle.js
// ==/UserScript==

(function() {
    'use strict';

    // DetectionFrameクラス - 矩形の処理を分離
    class DetectionFrame {
        constructor(width = 200, height = 400) {
            this.element = null;
            this.isDragging = false;
            this.dragType = null; // 'move', 'resize-tl', 'resize-tr', 'resize-bl', 'resize-br'
            this.dragStartX = 0;
            this.dragStartY = 0;
            this.frameStartX = 0;
            this.frameStartY = 0;
            this.frameStartWidth = 0;
            this.frameStartHeight = 0;
            this.initialWidth = width;
            this.initialHeight = height;

            this.init();
        }

        init() {
            this.element = this.createFrameElement();
            this.createGridLines();
            this.createResizeHandles();
            this.addEventListeners();
        }

        createFrameElement() {
            const frame = document.createElement('div');
            frame.id = 'color-detection-frame';
            frame.style.position = 'absolute';
            frame.style.border = '2px solid red';
            frame.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
            frame.style.zIndex = '10000';
            frame.style.width = this.initialWidth + 'px';
            frame.style.height = this.initialHeight + 'px';
            frame.style.cursor = 'move';
            frame.style.userSelect = 'none';
            return frame;
        }

        // 10×20のグリッドラインを作成
        createGridLines() {
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
                this.element.appendChild(line);
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
                this.element.appendChild(line);
            }
        }

        // リサイズハンドルを作成
        createResizeHandles() {
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

            const handles = [
                { class: 'resize-tl', left: `-${handleSize/2}px`, top: `-${handleSize/2}px`, cursor: 'nw-resize' },
                { class: 'resize-tr', right: `-${handleSize/2}px`, top: `-${handleSize/2}px`, cursor: 'ne-resize' },
                { class: 'resize-bl', left: `-${handleSize/2}px`, bottom: `-${handleSize/2}px`, cursor: 'sw-resize' },
                { class: 'resize-br', right: `-${handleSize/2}px`, bottom: `-${handleSize/2}px`, cursor: 'se-resize' }
            ];

            handles.forEach(handleInfo => {
                const handle = document.createElement('div');
                handle.className = `resize-handle ${handleInfo.class}`;
                Object.assign(handle.style, handleStyle);
                handle.style.cursor = handleInfo.cursor;

                if (handleInfo.left) handle.style.left = handleInfo.left;
                if (handleInfo.right) handle.style.right = handleInfo.right;
                if (handleInfo.top) handle.style.top = handleInfo.top;
                if (handleInfo.bottom) handle.style.bottom = handleInfo.bottom;

                this.element.appendChild(handle);
            });
        }

        // イベントリスナーを追加
        addEventListeners() {
            this.element.addEventListener('mousedown', (e) => this.handleMouseDown(e));
            document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
            document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        }

        // マウスダウンイベント
        handleMouseDown(e) {
            e.preventDefault();
            this.isDragging = true;
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;

            const frameRect = this.element.getBoundingClientRect();
            this.frameStartX = frameRect.left;
            this.frameStartY = frameRect.top;
            this.frameStartWidth = frameRect.width;
            this.frameStartHeight = frameRect.height;

            if (e.target.classList.contains('resize-handle')) {
                // リサイズハンドルがクリックされた場合
                if (e.target.classList.contains('resize-tl')) {
                    this.dragType = 'resize-tl';
                } else if (e.target.classList.contains('resize-tr')) {
                    this.dragType = 'resize-tr';
                } else if (e.target.classList.contains('resize-bl')) {
                    this.dragType = 'resize-bl';
                } else if (e.target.classList.contains('resize-br')) {
                    this.dragType = 'resize-br';
                }
            } else {
                // フレーム本体がクリックされた場合（移動）
                this.dragType = 'move';
            }
        }

        // マウス移動イベント
        handleMouseMove(e) {
            if (!this.isDragging || !this.element) return;

            const deltaX = e.clientX - this.dragStartX;
            const deltaY = e.clientY - this.dragStartY;

            if (this.dragType === 'move') {
                // 移動
                this.element.style.left = (this.frameStartX + deltaX) + 'px';
                this.element.style.top = (this.frameStartY + deltaY) + 'px';
            } else if (this.dragType.startsWith('resize-')) {
                // リサイズ
                let newLeft = this.frameStartX;
                let newTop = this.frameStartY;
                let newWidth = this.frameStartWidth;
                let newHeight = this.frameStartHeight;

                if (this.dragType === 'resize-tl') {
                    newLeft = this.frameStartX + deltaX;
                    newTop = this.frameStartY + deltaY;
                    newWidth = this.frameStartWidth - deltaX;
                    newHeight = this.frameStartHeight - deltaY;
                } else if (this.dragType === 'resize-tr') {
                    newTop = this.frameStartY + deltaY;
                    newWidth = this.frameStartWidth + deltaX;
                    newHeight = this.frameStartHeight - deltaY;
                } else if (this.dragType === 'resize-bl') {
                    newLeft = this.frameStartX + deltaX;
                    newWidth = this.frameStartWidth - deltaX;
                    newHeight = this.frameStartHeight + deltaY;
                } else if (this.dragType === 'resize-br') {
                    newWidth = this.frameStartWidth + deltaX;
                    newHeight = this.frameStartHeight + deltaY;
                }

                // 最小サイズを制限
                const minSize = 50;
                if (newWidth < minSize || newHeight < minSize) {
                    return;
                }

                this.element.style.left = newLeft + 'px';
                this.element.style.top = newTop + 'px';
                this.element.style.width = newWidth + 'px';
                this.element.style.height = newHeight + 'px';
            }
        }

        // マウスアップイベント
        handleMouseUp(e) {
            this.isDragging = false;
            this.dragType = null;
        }

        // video要素の中央に矩形を配置
        positionToVideoCenter() {
            const video = document.querySelector('video');
            if (!video || !this.element) return;

            const videoRect = video.getBoundingClientRect();
            const frameWidth = this.element.offsetWidth;
            const frameHeight = this.element.offsetHeight;

            // video要素の中央に配置
            const centerX = videoRect.left + (videoRect.width - frameWidth) / 2;
            const centerY = videoRect.top + (videoRect.height - frameHeight) / 2;

            this.element.style.left = centerX + 'px';
            this.element.style.top = centerY + 'px';
        }

        // DOMに追加
        appendTo(parent) {
            parent.appendChild(this.element);
        }

        // 矩形の位置とサイズを取得
        getBoundingRect() {
            return this.element.getBoundingClientRect();
        }

        // 破棄
        destroy() {
            if (this.element && this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
        }
    }

    // TetrisBoardDetectorクラス - テトリス盤面検出処理を分離
    class TetrisBoardDetector {
        constructor(minRequiredVotes = 2) {
            this.minRequiredVotes = minRequiredVotes;
            this.tetrisColors = {
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
        }

        // 色からミノの種類を判定
        identifyMino(color) {
            const { r, g, b } = color;

            // 各ミノの判定を順番に実行
            for (const [minoType, minoData] of Object.entries(this.tetrisColors)) {
                if (minoData.check(r, g, b)) {
                    return minoData.char;
                }
            }

            return '_'; // 背景
        }

        // 単一セルの検出処理
        detectCell(ctx, cellX0, cellY0, cellW, cellH) {
            const votes = {};

            // 各セルに 3x3 = 9点を配置
            for (let dy = 1; dy <= 3; dy++) {
                for (let dx = 1; dx <= 3; dx++) {
                    const px = cellX0 + (dx / 4) * cellW;
                    const py = cellY0 + (dy / 4) * cellH;
                    const imageData = ctx.getImageData(px, py, 1, 1);
                    const data = imageData.data;

                    const color = { r: data[0], g: data[1], b: data[2], a: data[3] };
                    const mino = this.identifyMino(color);

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

            // 判定条件：最低 minRequiredVotes 以上なければ背景と見なす
            if (bestCount < this.minRequiredVotes) {
                return 'X';
            } else {
                return bestMino;
            }
        }

        // テトリス盤面全体の検出
        detectBoard(video, detectionFrame) {
            if (!video || !detectionFrame) return null;

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            try {
                ctx.drawImage(video, 0, 0);

                const videoRect = video.getBoundingClientRect();
                const frameRect = detectionFrame.getBoundingRect();

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

                        const cellResult = this.detectCell(ctx, cellX0, cellY0, cellW, cellH);
                        rowData.push(cellResult);
                    }
                    board.push(rowData);
                }

                return board;

            } catch (error) {
                console.error('Tetris board detection failed:', error);
                return null;
            }
        }

        // 最小必要票数を設定
        setMinRequiredVotes(votes) {
            this.minRequiredVotes = votes;
        }

        // 色定義を更新
        updateColorDefinition(minoType, checkFunction) {
            if (this.tetrisColors[minoType]) {
                this.tetrisColors[minoType].check = checkFunction;
            }
        }
    }

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
            const board = boardDetector.detectBoard(document.querySelector('video'), detectionFrame);
            if (board) {
                displayTetrisBoard(board);
            }
        });

        return button;
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


    // メインのアプリケーション
    let detectionFrame = null;
    let boardDetector = null;

    // 初期化
    function init() {
        const video = document.querySelector('video');
        if (!video) {
            console.log('Video element not found, retrying...');
            setTimeout(init, 2000);
            return;
        }

        console.log('Video element found, initializing Tetris detector...');

        // DetectionFrameクラスを使用して矩形フレームを作成
        detectionFrame = new DetectionFrame(200, 400);
        detectionFrame.appendTo(document.body);

        boardDetector = new TetrisBoardDetector();

        // 検出ボタンを作成
        const detectButton = createDetectionButton();
        document.body.appendChild(detectButton);

        // 位置を設定
        detectionFrame.positionToVideoCenter();

        // ウィンドウサイズ変更時に位置を再調整（初回のみ）
        window.addEventListener('resize', () => {
            if (!detectionFrame.isDragging) {
                detectionFrame.positionToVideoCenter();
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