const MAP_CODE_DEFAULT = '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';

class ExerciseManager {

    static GAME_MODE = {
        NORMAL: 'normal',
        WEAK_POINT: 'weak_point',
    };

    constructor(exercise) {
        // IDとタイトルを受け取る
        this.id = exercise.id || 'default_id';
        this.title = exercise.title || 'Default Title';

        // win_conditionを受け取り、デフォルト値を設定
        this.winCondition = exercise.win_condition || {
            type: 0, // "0"Lines, "1"PC, "2"No Garbage
            count: 10
        };

        // board_listを受け取り、デフォルト値を設定
        this.boardList = exercise.board_list || [{
            holdPiece: '',
            prevFixedQueue: '',
            pieceQueue: '',
            mapCode: MAP_CODE_DEFAULT
        }];

        // 現在のゲームカウント
        this.currentGameCount = 1;

        this.SEED_SUFFIX = Math.random().toString(36).substr(2, 4);
        this.NOTIFY_USER_GAME_COUNT = 100;

        // 苦手問題の番号を記憶するための配列
        this.weakPointGameList = [];

        this.GAME_MODE = ExerciseManager.GAME_MODE.NORMAL;
    }

    /**
    * 現在のゲームカウントをインクリメントします。
    */
    incrementGameCount() {
        this.currentGameCount++;
        this.notifyUserWhenCountModZero();
    }

    /**
    * 現在のゲームカウントをデクリメントします。
    * ただし、カウントが1未満にならないようにします。
    */
    decrementGameCount() {
        if (this.currentGameCount > 1) {
            this.currentGameCount--;
        }
    }

    /**
    * タイトルを取得
    */
    getTitle() {
        return this.title;
    }

    /**
    * 現在のエクササイズに対応するランダムなボードを取得します。
    */
    getCurrentExercise() {

        // シード値の算出
        let seed = `${this.currentGameCount}_${this.SEED_SUFFIX}`;

        // 苦手ゲームモードの場合は、weakPointGameList配列からランダム（シード値固定）で取得する
        if (this.GAME_MODE == ExerciseManager.GAME_MODE.WEAK_POINT) {
            const gameCount = getRandomElementFromList(this.weakPointGameList, seed);
            seed = `${gameCount}_${this.SEED_SUFFIX}`;
        }

        const selectedBoard = getRandomElementFromList(this.boardList, seed);

        return {
            map_code: selectedBoard.mapCode,
            piece_queue: (selectedBoard.prevFixedQueue || '') + (selectedBoard.pieceQueue ? shuffleString(selectedBoard.pieceQueue, seed) : ''),
            hold_piece: selectedBoard.holdPiece || '',
            win_condition: this.winCondition,
            seed: seed,
        };
    }

    /**
    * Notify the user when the game count reaches a specified number.
    */
    notifyUserWhenCountModZero() {

        if ((this.currentGameCount % this.NOTIFY_USER_GAME_COUNT === 0) && (this.currentGameCount >= this.NOTIFY_USER_GAME_COUNT)) {
            console.log(`Game count reached ${this.currentGameCount}, which is a multiple of ${this.NOTIFY_USER_GAME_COUNT}!`);
            alert(`Game count reached ${this.currentGameCount}, which is a multiple of ${this.NOTIFY_USER_GAME_COUNT}!`);
        }
    }

    // 現在の問題を苦手問題に追加
    addCurGameToWeakPointList(){
        // まだ登録されていない場合のみ登録する
        if ((this.GAME_MODE != ExerciseManager.GAME_MODE.WEAK_POINT)
            && (!this.weakPointGameList.includes(this.currentGameCount))) {
            this.weakPointGameList.push(this.currentGameCount);
            showNotification(`#${this.currentGameCount}を苦手問題として登録しました。`);
        }
    }


    // 問題をカウント1ずつアップさせるのではなく、苦手問題から選出するように変更する
    changeGameModeToWeakPoint(){

        if (this.GAME_MODE != ExerciseManager.GAME_MODE.WEAK_POINT) {
            if (this.weakPointGameList.length > 0 ) {
                this.GAME_MODE = ExerciseManager.GAME_MODE.WEAK_POINT
                showNotification("苦手問題モードに移行します。");
            } else {
                showNotification("まだ苦手問題が登録されていませんので苦手問題モードへは移行できません。");
            }
        }
    }

}
