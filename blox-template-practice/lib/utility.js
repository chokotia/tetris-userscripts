/**
 * キーイベントをシミュレートして、特定のキーが押されたことをエミュレートします。
 * 
 * @param {string} key シミュレートするキーの名前（例: 'a', 'Enter'）
 * 
 * @example
 * simulateKeyPress('a');
 */
function simulateKeyPress(key) {
    const keyEventInit = {
        key: key,
        code: `Key${key.toUpperCase()}`,
        keyCode: key.toUpperCase().charCodeAt(0),
        which: key.toUpperCase().charCodeAt(0),
        bubbles: true,
        cancelable: true
    };

    document.dispatchEvent(new KeyboardEvent('keydown', keyEventInit));
    document.dispatchEvent(new KeyboardEvent('keyup', keyEventInit));
}

/**
 * 文字列をハッシュ化して数値シードを生成します。
 * 
 * @param {string} str ハッシュ化する文字列
 * @returns {number} 生成された数値シード
 */
function stringToSeed(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

/**
 * シード値に基づいた単一の乱数を生成します。
 * 
 * @param {number} seed シード値
 * @returns {number} 生成された乱数
 */
function generateRandom(seed) {
    let m = 0x80000000; // 2**31
    let a = 1103515245;
    let c = 12345;

    seed = seed % m;
    return (a * seed + c) % m / (m - 1);
}

/**
 * 文字列をランダムにシャッフルします。
 * 
 * @param {string} str シャッフルする文字列
 * @returns {string} シャッフルされた文字列
 * 
 * @example
 * // 出力例: 'cba'
 * console.log(shuffleString('abc'));
 */
function shuffleString(str, seed = 'defaultSeed') {
    const arr = str.split('');
    let numericSeed = stringToSeed(seed);
    
    for (let i = arr.length - 1; i > 0; i--) {
        numericSeed = generateRandom(numericSeed);
        const j = Math.floor(numericSeed * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
}

/**
 * シード値を用いてリストからランダムに要素を取得します。
 * 
 * @param {Array} list ランダムに要素を取得するリスト
 * @param {string|number} seed シード値（文字列または数値）
 * @returns {*} リストから取得されたランダムな要素
 * 
 * @example
 * // 出力例: 'banana'
 * console.log(getRandomElementFromList(['apple', 'banana', 'cherry'], 'seed123'));
 */
function getRandomElementFromList(list, seed) {
    
    const index = stringToSeed(seed) % list.length;
    return list[index];
}

/**
 * 入力文字列からhold_minoとqueue_pieceを抽出します。
 * 
 * @param {string} input 入力文字列。形式は"[(一文字)](0文字以上の文字列)"です。
 * @returns {{hold_mino: string, queue_piece: string}} hold_minoとqueue_pieceのオブジェクト
 * 
 * @example
 * // 出力例: { hold_mino: 'o', queue_piece: 'tsj' }
 * console.log(extractHoldAndQueue("[o]tsj"));
 */
function extractHoldAndQueue(input) {
    // 正規表現を使用してホールドミノとキューピースを抽出
    const match = input.match(/^\[(.)\](.*)$/);
    
    if (match) {
        const hold_mino = match[1]; // 一文字
        const queue_piece = match[2]; // 残りの文字列
        return { hold_mino, queue_piece };
    } else {
        // 入力が想定される形式ではない場合、nullを返す
        return null;
    }
}

/**
 * Tetriminoの文字を対応する色に変換します。
 * 
 * @param {string} piece 変換するTetriminoの文字 (例: 'i', 'o', 't')
 * @returns {string} 対応する色 (例: 'teal', 'yellow', 'purple')
 * 
 * @example
 * // 出力例: 'teal'
 * console.log(convertToColor('i'));
 */
function convertToColor(piece) {
    // 文字と色のマッピングを保持するオブジェクト
    const pieceToColorMap = {
        "i": "teal",
        "o": "yellow",
        "t": "purple",
        "l": "orange",
        "j": "blue",
        "s": "green",
        "z": "red"
    };

    // 入力文字に対応する色を返す
    return pieceToColorMap[piece] || "unknown";
}

// 通知を表示する関数
function showNotification(message) {
    const notification = document.createElement("div");
    notification.textContent = message;

    // CSSクラスを追加
    notification.classList.add("notification");

    document.body.appendChild(notification);

    // 表示時にフェードイン
    setTimeout(() => {
        notification.style.opacity = "1";
    }, 100);

    // 2秒後にフェードアウト
    setTimeout(() => {
        notification.style.opacity = "0";
        setTimeout(() => {
            notification.remove();
        }, 500); // フェードアウト完了後に削除
    }, 2000);
}
