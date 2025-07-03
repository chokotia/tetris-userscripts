// ==UserScript==
// @name         blox テンプレ練習
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  テトリスの練習のためのスクリプトであり、Blox上で苦手盤面を練習できるようになっています。
// @author       author
// @match        https://blox.askplays.com/map-maker
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @require      https://github.com/chokotia/tetris-userscripts/raw/refs/heads/main/blox-template-practice/css/add_styles.js
// @require      https://github.com/chokotia/tetris-userscripts/raw/refs/heads/main/blox-template-practice/lib/utility.js
// @require      https://github.com/chokotia/tetris-userscripts/raw/refs/heads/main/blox-template-practice/lib/exercise_manager.js
// @require      https://github.com/chokotia/tetris-userscripts/raw/refs/heads/main/blox-template-practice/lib/exercise_def.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 定数定義
    const GO_TO_NEXT_KEY = 'r'; // ！！注意！！　リトライキーと同じキーを設定すること
    const BACK_TO_PREVONE_KEY = 'R';
    const ADD_WEAK_POINT_LIST_KEY = 'a'
    const CHANGE_GAME_MODE_TO_WEAK_POINT_KEY = 'A'
    const SIMULATE_KEY_PRESS_DELAY = 100; // milliseconds

    // グローバル変数定義
    let g_manager; // 問題管理用のクラス

    // 環境の初期化処理
    function initEnv() {
        g_manager = null; // ユーザがリストから問題を選択した時点で設定するためここではnullを設定しておく

        // 画面下部にゲームモードのタイトルを表示するためのタグを作成しておく
        let exerciseTitleElement = document.createElement('div');
        exerciseTitleElement.id = 'exerciseTitle';
        document.body.appendChild(exerciseTitleElement);
    }

    function simulateGoToNextKeyPress(holdPiece = null) {
        setTimeout(() => {
            simulateKeyPress(GO_TO_NEXT_KEY);

            // holdPieceがnullでない場合にのみホールドミノを更新
            // ※ 補足
            //   updateFieldでなく、リトライキーを押下（シミュレート）した後にホールドを設定する背景については以下の通り。
            // 　ホールドについてはpiece queueやmap codeのように設定できるウインドウがない。
            // 　updateField時に内部変数の値を更新してもリトライ処理時にnullになってしまうため、rを押下した後（ゲーム開始直前）に設定することとする。
            if (holdPiece) {
                let pieceColor = convertToColor(holdPiece);
                holdBlock = new Piece(0, 0, pieceColor); // holdBlockはサイト側の変数。ここで直接参照して上書きする。
            }
        }, SIMULATE_KEY_PRESS_DELAY);
    }

     // UI上の盤面情報の更新
    function updateField(exercise) {

        // 勝利条件は値だけ変えても、load-mapボタン押下時に変更前の値が参照される（つまり、値だけ変えても内部的には設定が反映されない）。
        // そのため、変更イベントもあわせてdispatchしておく。
        const event = new Event("change");
        document.getElementById('win-con').value = exercise.win_condition.type;
        document.getElementById('win-con').dispatchEvent(event);
        document.getElementById('win-con-count').value = exercise.win_condition.count;
        document.getElementById('win-con-count').dispatchEvent(event);

        document.getElementById('piece-queue').value = exercise.piece_queue;
        document.getElementById('map-code').value = exercise.map_code;
        document.getElementById('map-seed').value = exercise.seed;
        document.getElementById('load-map').click();

    }

    // ゲームモードの選択画面の表示
    function showSelectGameModeWindow() {

        // オーバーレイの作成（画面全体にグレーのレイヤーを追加。ゲームモード選択画面はこの上に作成してく）
        let overlay = document.createElement('div');
        overlay.id = 'overlay';
        document.body.appendChild(overlay);

        // オーバーレイ上にゲームモード選択ウインドウを作成
        let selectionWindow = document.createElement('div');
        selectionWindow.id = 'selectionWindow';
        overlay.appendChild(selectionWindow);

        // ゲームモード選択ウインドウ上にタイトルを表示
        let title = document.createElement('h2');
        title.innerHTML = 'ゲームを選択してください';
        selectionWindow.appendChild(title);

        // ゲームモード選択ウインドウ上にドロップダウンを追加
        let dropdown = document.createElement('select');
        dropdown.id = 'gameModeSelector';
        EXERCISES.forEach(book => {
            let opt = document.createElement('option');
            opt.value = book.id;
            opt.innerHTML = book.title;
            dropdown.appendChild(opt);
        });
        selectionWindow.appendChild(dropdown);

        // 問題選択ウインドウ上に決定ボタンを追加
        let confirmButton = document.createElement('button');
        confirmButton.innerHTML = '決定';
        confirmButton.onclick = function() {

            // ユーザが指定したエクササイズをg_managerに設定
            let selectedValue = document.getElementById('gameModeSelector').value;
            let exerciseData = EXERCISES.find(book => book.id === selectedValue);
            g_manager = new ExerciseManager(exerciseData);

            // 作成したwindowをルートから削除
            document.body.removeChild(overlay);

            // 画面下部のタイトル文字列をアップデート
            let exerciseTitleElement = document.getElementById('exerciseTitle');
            exerciseTitleElement.innerHTML = g_manager.title;
        };
        selectionWindow.appendChild(confirmButton);
    }

    // 画面ロード時に行うメイン処理を定義
    function loadMain() {

        // ページ読み込み完了時にQキーを押下し、ToggleFocusModeにする処理
        simulateKeyPress('q');

        // チャット画面を閉じる
        document.getElementById('close-chat').click();

        initEnv();
        showSelectGameModeWindow();
    }

    // イベントリスナーの設定
    window.addEventListener('load', loadMain);

    document.addEventListener('keydown', function(event) {

        // 次の問題に進む
        // 補足：
        //   event.isTrustedによって実際に押下されたイベントか、javascript上で押下をシミュレートしたイベントかを判断しています。
        if (event.key === GO_TO_NEXT_KEY && event.isTrusted && g_manager) {
            event.preventDefault();
            g_manager.incrementGameCount();
            const exercise = g_manager.getCurrentExercise();
            updateField(exercise);
            simulateGoToNextKeyPress(exercise.hold_piece);
        }

        // 一つ前の問題に戻る
        if (event.key === BACK_TO_PREVONE_KEY) {
            g_manager.decrementGameCount();
            const exercise = g_manager.getCurrentExercise();
            updateField(exercise);
            simulateGoToNextKeyPress(exercise.hold_piece);
        }

        // 現在の問題を苦手問題に追加
        if (event.key === ADD_WEAK_POINT_LIST_KEY) {
            g_manager.addCurGameToWeakPointList();
        }

        // 問題をカウント1ずつアップさせるのではなく、苦手問題から選出するように変更する
        if (event.key === CHANGE_GAME_MODE_TO_WEAK_POINT_KEY) {
            g_manager.changeGameModeToWeakPoint();
        }
    });

})();
