// ==UserScript==
// @name         blox Add invisible/no-ghost options
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Add options to the settings panel and handle their interactions
// @author       author
// @match        https://blox.askplays.com/map-maker*
// @grant        none
// ==/UserScript==


(function() {
    'use strict';

    var trim=a=>{a=a.slice(0,-1);a=a.substr(a.indexOf("{")+1);return a}
    var getParams=a=>{var params=a.slice(a.indexOf("(")+1);params=params.substr(0,params.indexOf(")")).split(",");return params}

    // ページが完全にロードされた後に処理を実行
    window.addEventListener('load', loadMain)

    function loadMain() {

        // 状態表示用のボックスを作成
        const statusBox = createStatusBox();

        // デフォルトの Piece.show メソッドを保存
        const originalPieceShow = Piece.prototype.show;

        // デフォルトの Block.show メソッドを保存
        const originalBlockShow = Block.prototype.show;

        // ゴーストなしモードの処理
        const pieceShowFunc = originalPieceShow.toString();
        const params = getParams(pieceShowFunc);
        const modifiedShowFunc = `if (t == true) {return;} ${trim(pieceShowFunc)}`;
        const noGhostShow = new Function(...params, modifiedShowFunc);

        const modifiedShowFunc2 = `if (t !== !1) {return;} ${trim(pieceShowFunc)}`;
        const noGhostShowPlus = new Function(...params, modifiedShowFunc2);

        // 透明モードの処理
        const invisibleShow = function() {
            // 何も表示しない（透明モード）
        };

        // 'expand-content' クラスを持つすべての div 要素を取得
        const expandContents = document.querySelectorAll('.expand-content');
        const lastExpandContent = expandContents[expandContents.length - 5];

        if (lastExpandContent) {
            // 初期値を localStorage から取得
            const invisibleModeInitial = localStorage.getItem('invisibleMode') === 'true';
            const pieceDisplayMode = localStorage.getItem('pieceDisplayMode') || 'normal';

            // 新しい HTML コンテンツを作成（ラジオボタン版）
            const newContent = `
    <div>
        <label for="invisible-mode">Invisible Mode:</label>
        <input id="invisible-mode" class="setting" type="checkbox" data-key="invisibleMode" ${invisibleModeInitial ? 'checked' : ''}>
        <br>
        <fieldset style="margin-top: 10px; border: 1px solid #ccc; padding: 10px;">
            <legend>Piece Display Mode:</legend>
            <label style="display: block; margin: 5px 0;">
                <input type="radio" name="piece-display" value="normal" ${pieceDisplayMode === 'normal' ? 'checked' : ''}>
                Normal (with ghost)
            </label>
            <label style="display: block; margin: 5px 0;">
                <input type="radio" name="piece-display" value="no-ghost" ${pieceDisplayMode === 'no-ghost' ? 'checked' : ''}>
                No Ghost
            </label>
            <label style="display: block; margin: 5px 0;">
                <input type="radio" name="piece-display" value="invisible" ${pieceDisplayMode === 'invisible' ? 'checked' : ''}>
                Invisible
            </label>
        </fieldset>
    </div>
`;

            // 最後の 'expand-content' 要素の末尾に新しいコンテンツを追加
            lastExpandContent.insertAdjacentHTML('beforeend', newContent);

            // チェックボックスの変更イベントリスナーを追加
            document.getElementById('invisible-mode').addEventListener('change', handleInvisibleModeChange);

            // ラジオボタンの変更イベントリスナーを追加
            document.addEventListener('change', function(event) {
                if (event.target.name === 'piece-display') {
                    handlePieceDisplayModeChange(event.target.value);
                }
            });

            // 初期状態のチェックボックス設定を反映
            handleInvisibleModeChange({ target: document.getElementById('invisible-mode') });

            // 初期状態のラジオボタン設定を反映
            handlePieceDisplayModeChange(pieceDisplayMode);
        }

        /**
        * Invisible Mode チェックボックスの状態が変わったときの処理
        */
        function handleInvisibleModeChange(event) {
            const isInvisible = event.target.checked;
            Block.prototype.show = isInvisible ? invisibleShow : originalBlockShow;
            // localStorage に設定を保存
            localStorage.setItem('invisibleMode', isInvisible);
        }

        /**
        * Piece Display Mode ラジオボタンの状態が変わったときの処理
        */
        function handlePieceDisplayModeChange(mode) {
            switch (mode) {
                case 'normal':
                    Piece.prototype.show = originalPieceShow;
                    break;
                case 'no-ghost':
                    Piece.prototype.show = noGhostShow;
                    break;
                case 'invisible':
                    Piece.prototype.show = noGhostShowPlus;
                    break;
            }

            // localStorage に設定を保存
            localStorage.setItem('pieceDisplayMode', mode);
        }

        function hasBlockAbove(x, y) {
            // 最上段には上にブロックがないので、チェックする必要がない
            if (y === 0) {
                return false;
            }

            // 対象のマスが空（null）であり、その上にブロックがあるかを確認
            return !(board[x][y] instanceof Block) && (board[x][y - 1] instanceof Block);
        }

        document.addEventListener('keydown', function(event) {

            if (event.key === '1') {
                // invisibleのチェック状態を反転させる
                const checkbox = document.getElementById('invisible-mode');
                if (checkbox) {
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change'));
                }
            }

            if (event.key === '2') {
                // piece display modeを順番に切り替える
                const currentMode = localStorage.getItem('pieceDisplayMode') || 'normal';
                const modes = ['normal', 'no-ghost', 'invisible'];
                const currentIndex = modes.indexOf(currentMode);
                const nextMode = modes[(currentIndex + 1) % modes.length];

                const radioButton = document.querySelector(`input[name="piece-display"][value="${nextMode}"]`);
                if (radioButton) {
                    radioButton.checked = true;
                    handlePieceDisplayModeChange(nextMode);
                }
            }

            if (event.key === 'r' || event.key === 'R') {
                updateStatusBox('nottiong');

                // invisibleのチェック状態を反転させる
                const checkbox = document.getElementById('invisible-mode');
                if (checkbox) {
                    checkbox.checked = true;
                    checkbox.dispatchEvent(new Event('change'));
                }
            }

            if (event.key === 'ArrowUp' || event.key === '\\') {
                setTimeout(() => {
                    updateBoardStatus();
                }, 10); // 非同期で後に実行
            }
        });

        // 盤面の状態をチェックしてステータスボックスを更新する関数
        function updateBoardStatus() {
            const grid = convertBoardToGrid(board);
            const result = countClosedSpaces(grid);
            const simpleResult = countClosedSpacesSimple();

            console.log(result, simpleResult);

            if ((result>1) && (simpleResult>1)) {
                updateStatusBox('red');
            } else if ((result==1) && (simpleResult>1)) {
                updateStatusBox('yellow');
            } else {
                updateStatusBox('nottiong');
            }
        }

        // 200ミリ秒ごとに処理を実行
        setInterval(updateBoardStatus, 200);

        function countClosedSpacesSimple(grid) {

            for (let x = 0; x < 10; x++) {
                for (let y = 1; y < 20; y++) {
                    if (hasBlockAbove(x, y)) {
                        return 2
                    }
                }
            }
            return 1
        }

        function countClosedSpaces(grid) {
            const rows = grid.length;
            const cols = grid[0].length;

            // 探索済みのマスを記録する配列
            const visited = Array.from({ length: rows }, () => Array(cols).fill(false));

            // 4方向の移動パターン（上、下、左、右）
            const directions = [
                [-1, 0], [1, 0], [0, -1], [0, 1]
            ];

            function isValid(x, y) {
                // 盤面内にあるかどうか
                return x >= 0 && x < rows && y >= 0 && y < cols;
            }

            function dfs(x, y) {
                // 現在の領域が閉鎖空間であるかどうかを示す
                let isClosed = true;
                const stack = [[x, y]];
                visited[x][y] = true;
                const area = [];

                while (stack.length > 0) {
                    const [cx, cy] = stack.pop();
                    area.push([cx, cy]);

                    for (const [dx, dy] of directions) {
                        const nx = cx + dx;
                        const ny = cy + dy;

                        if (!isValid(nx, ny)) {
                            // 盤面の端に到達した場合は閉鎖されていない
                            //isClosed = false; 何もしない
                        } else if (grid[nx][ny] === 0 && !visited[nx][ny]) {
                            // 未訪問の空白マスを探索
                            visited[nx][ny] = true;
                            stack.push([nx, ny]);
                        }
                    }
                }

                return isClosed ? area.length : 0;
            }

            let closedSpaceCount = 0;

            // 盤面を走査して閉鎖空間を数える
            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    if (grid[i][j] === 0 && !visited[i][j]) {
                        // 空白かつ未探索のマスがあればDFSで探索
                        const spaceSize = dfs(i, j);
                        if (spaceSize > 0) {
                            closedSpaceCount++;
                            if (closedSpaceCount > 1) {
                                return closedSpaceCount; // 2以上であることが確認できれば良いので、ここでreturnさせておく
                            }
                        }
                    }
                }
            }

            return closedSpaceCount;
        }

        function convertBoardToGrid(board) {
            const rows = 10;//board.length;
            const cols = 20;//board[0].length;
            const grid = Array.from({ length: rows }, () => Array(cols).fill(0));

            for (let x = 0; x < rows; x++) {
                for (let y = 0; y < cols; y++) {
                    // board[x][y]がBlockのインスタンスなら1、それ以外は0
                    grid[x][y] = board[x][y] instanceof Block ? 1 : 0;
                }
            }

            return grid;
        }

        /**
        * 状態表示用のボックスを作成する関数
        * @param {string} initialColor - ボックスの初期背景色（デフォルトは透明）
        * @param {string} position - ボックスの位置（デフォルトは固定位置）
        * @param {string} top - ボックスの上端位置（デフォルトは '10px'）
        * @param {string} right - ボックスの右端位置（デフォルトは '10px'）
        * @param {string} width - ボックスの幅（デフォルトは '50px'）
        * @param {string} height - ボックスの高さ（デフォルトは '50px'）
        * @returns {HTMLElement} 作成されたボックスの要素
        */
        function createStatusBox({
            initialColor = 'transparent',
            position = 'fixed',
            top = '10px',
            right = '10px',
            width = '50px',
            height = '50px',
            border = '2px solid black',
            zIndex = '1000'
        } = {}) {
            const box = document.createElement('div');
            box.style.position = position;
            box.style.top = top;
            box.style.right = right;
            box.style.width = width;
            box.style.height = height;
            box.style.border = border;
            box.style.backgroundColor = initialColor;
            box.style.zIndex = zIndex;
            document.body.appendChild(box);
            return box;
        }

        // ボックスの色を更新する関数
        function updateStatusBox(color) {
            // 許可されている色のマッピング
            const colors = {
                blue: 'blue',
                yellow: 'yellow',
                red: 'red',
                nottiong: 'transparent' // 'nottiong' を透明として扱う
            };

            // 入力された色が許可されたものか確認し、背景色を設定
            statusBox.style.backgroundColor = colors[color] || 'transparent';
        }
    };
})();