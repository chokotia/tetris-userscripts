// ==UserScript==
// @name         pc-solver-initial-board-to-fumen
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Convert PC Solver board to Fumen on button click with next queue support
// @match        https://wirelyre.github.io/tetra-tools/pc-solver.html
// @grant        none
// @require      https://raw.githubusercontent.com/chokotia/tetris-userscripts/refs/heads/main/tetris-replay-fumen/lib/fumen.bundle.js
// ==/UserScript==
(function () {
    'use strict';
    const PCSolverToFumenConverter = (function () {
        function readBoardFromCheckboxes() {
            // テトリス盤面は通常10x20だが、上部16行は空白で補完
            const width = 10;
            const height = 20;
            // 盤面を初期化（すべて空白）
            const board = Array(width).fill(null).map(() => Array(height).fill('_'));
            // 40個のチェックボックスを読み取り（下4行分）
            for (let row = 0; row < 4; row++) {
                for (let col = 0; col < 10; col++) {
                    const cellId = `cell${row * 10 + col}`;
                    const checkbox = document.getElementById(cellId);
                    if (checkbox && checkbox.checked) {
                        // チェックされている場合はグレーブロック（'X'）として扱う
                        // rowは下から数えるので、そのまま使用
                        board[col][row] = 'X';
                    }
                }
            }
            return board;
        }

        function readNextQueue() {
            // id="queue"のinputタグから値を読み取る
            const queueInput = document.getElementById('queue');
            if (!queueInput) return '';

            const queueValue = queueInput.value.trim().toUpperCase();

            // 有効なテトリミノ文字のみを抽出
            const validPieces = ['L', 'J', 'T', 'S', 'Z', 'I', 'O'];
            const filteredQueue = queueValue.split('').filter(char => validPieces.includes(char));

            return filteredQueue.join('');
        }

        function formatNextQueueForFumen(queueString) {
            if (!queueString || queueString.length === 0) return '';

            // 最初のピースを現在のピースとして扱い、残りをネクストキューとする
            const currentPiece = queueString[0];
            const nextQueue = queueString.slice(1);

            // Fumen形式: #Q=[](current)next1next2...
            return `#Q=[](${currentPiece})${nextQueue}`;
        }

        function boardToFumenFieldString(board) {
            const height = board[0].length;
            const width = board.length;
            let result = '';
            // Fumenは上から下への順序で読み取る
            for (let y = height - 1; y >= 0; y--) {
                for (let x = 0; x < width; x++) {
                    result += board[x][y];
                }
            }
            return result;
        }

        function boardToFumenURL(board, nextQueue) {
            const fieldStr = boardToFumenFieldString(board);
            const field = tetrisFumen.Field.create(fieldStr);

            // ネクストキューのコメントを生成
            const nextComment = formatNextQueueForFumen(nextQueue);

            const pages = [{ field, comment: nextComment }];
            const fumen = tetrisFumen.encoder.encode(pages);
            return `https://knewjade.github.io/fumen-for-mobile/#?d=${fumen}`;
        }

        return {
            readBoardFromCheckboxes,
            readNextQueue,
            boardToFumenURL,
        };
    })();

    // =====================
    // 🔘 UIボタンを追加
    // =====================
    function createButton() {
        const btn = document.createElement('button');
        btn.textContent = '🧩 Export Fumen';
        btn.style.position = 'fixed';
        btn.style.bottom = '20px';
        btn.style.right = '20px';
        btn.style.zIndex = 9999;
        btn.style.padding = '10px';
        btn.style.backgroundColor = '#4CAF50';
        btn.style.color = 'white';
        btn.style.border = 'none';
        btn.style.borderRadius = '5px';
        btn.style.cursor = 'pointer';
        btn.style.fontSize = '14px';
        document.body.appendChild(btn);
        btn.addEventListener('click', handleExportClick);
    }

    function handleExportClick() {
        try {
            const board = PCSolverToFumenConverter.readBoardFromCheckboxes();
            const nextQueue = PCSolverToFumenConverter.readNextQueue();
            const url = PCSolverToFumenConverter.boardToFumenURL(board, nextQueue);

            console.log('[PC SOLVER FUMEN]', url);
            console.log('[NEXT QUEUE]', nextQueue);
            window.open(url, '_blank');
        } catch (e) {
            console.error(e);
            alert('Fumen生成中にエラーが発生しました: ' + e.message);
        }
    }

    // ページ読み込み完了後にボタンを作成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createButton);
    } else {
        createButton();
    }
})();