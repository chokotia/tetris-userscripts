// ==UserScript==
// @name         Fumen Tetris Piece Rotation with Hold
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Rotate tetris pieces with Z key and hold with Left Shift
// @match        https://fumen.zui.jp/*
// @grant        none
// ==/UserScript==
(function() {
    'use strict';
    // キーボードイベントリスナーを追加
    document.addEventListener('keydown', function(event) {
        // Xキーが押された場合（反時計回り）
        if (event.key === 'x' || event.key === 'X') {
            event.preventDefault(); // デフォルトの動作を防ぐ
            rotateCurrentPiece(-1); // 反時計回り
        }
        // Zキーが押された場合（時計回り）
        else if (event.key === 'z' || event.key === 'Z') {
            event.preventDefault(); // デフォルトの動作を防ぐ
            rotateCurrentPiece(1); // 時計回り
        }
        // Aキーが押された場合（次ボタンを押下）
        else if (event.key === 'a' || event.key === 'A') {
            event.preventDefault(); // デフォルトの動作を防ぐ
            clickNextButton(); // 次ボタンを押下
        }
        // 左シフトキーが押された場合（ホールド）
        else if (event.key === 'Shift' && event.location === 1) { // location === 1 は左シフト
            event.preventDefault(); // デフォルトの動作を防ぐ
            holdCurrentPiece(); // ホールド機能
        }
    });

    function clickNextButton() {
        // id="nx"のボタンを取得
        const nextButton = document.getElementById('nx');
        if (nextButton) {
            // ボタンのクリックイベントを発火
            nextButton.click();
            console.log('次ボタンが押されました');
        } else {
            console.log('次ボタンが見つかりません');
        }
    }

    function holdCurrentPiece() {
        // 現在選択されているラジオボタンを取得
        const selectedRadio = document.querySelector('input[name="mode"]:checked');
        if (!selectedRadio) {
            console.log('選択されているピースがありません');
            return;
        }

        // 現在のミノタイプを取得
        const currentMinoType = getCurrentMinoType(selectedRadio);
        if (currentMinoType === null) {
            console.log('現在のミノタイプを取得できませんでした');
            return;
        }

        // 選択可能な他のミノタイプを探す
        const availableMinoTypes = getAvailableMinoTypes();
        console.log('選択可能なミノタイプ:', availableMinoTypes);

        // 現在のミノタイプ以外の選択可能なミノタイプを探す
        const otherAvailableMinoTypes = availableMinoTypes.filter(type => type !== currentMinoType);
        
        if (otherAvailableMinoTypes.length === 0) {
            console.log('ホールドできるミノがありません');
            return;
        }

        // 最初の選択可能な他のミノタイプを選択（通常は1つだけのはず）
        const targetMinoType = otherAvailableMinoTypes[0];
        console.log(`ホールド: ${currentMinoType} → ${targetMinoType}`);

        // 対象のミノタイプの回転0のラジオボタンを探す
        const targetRadio = findRadioButton(targetMinoType, 0);
        if (targetRadio) {
            // 現在の選択を解除
            selectedRadio.checked = false;
            // 新しいラジオボタンを選択
            targetRadio.checked = true;
            // onmousemoveイベントを手動で実行してプレビューを更新
            if (targetRadio.getAttribute('onmousemove')) {
                eval(targetRadio.getAttribute('onmousemove'));
            }
            console.log('ホールド完了');
        } else {
            console.log('ホールド対象のラジオボタンが見つかりません');
        }
    }

    function getCurrentMinoType(radio) {
        const onmousemove = radio.getAttribute('onmousemove');
        if (!onmousemove) return null;
        
        const match = onmousemove.match(/previewpiece\(14,(\d+),(\d+)\)/);
        if (!match) return null;
        
        return parseInt(match[1]);
    }

    function getAvailableMinoTypes() {
        const availableTypes = new Set();
        const allRadios = document.querySelectorAll('input[name="mode"]');
        
        for (let radio of allRadios) {
            // ラジオボタンが選択可能かどうかをチェック
            if (isRadioAvailable(radio)) {
                const minoType = getCurrentMinoType(radio);
                if (minoType !== null) {
                    availableTypes.add(minoType);
                }
            }
        }
        
        return Array.from(availableTypes);
    }

    function isRadioAvailable(radio) {
        // disabled属性をチェック
        if (radio.disabled) {
            return false;
        }
        
        // CSSで非表示になっていないかチェック
        const style = window.getComputedStyle(radio);
        if (style.display === 'none' || style.visibility === 'hidden') {
            return false;
        }
        
        // 親要素が非表示になっていないかチェック
        let parent = radio.parentElement;
        while (parent && parent !== document.body) {
            const parentStyle = window.getComputedStyle(parent);
            if (parentStyle.display === 'none' || parentStyle.visibility === 'hidden') {
                return false;
            }
            parent = parent.parentElement;
        }
        
        return true;
    }

    function rotateCurrentPiece(direction) {
        // 現在選択されているラジオボタンを取得
        const selectedRadio = document.querySelector('input[name="mode"]:checked');
        if (!selectedRadio) {
            console.log('選択されているピースがありません');
            return;
        }
        // onmousemoveイベントから情報を抽出
        const onmousemove = selectedRadio.getAttribute('onmousemove');
        if (!onmousemove) {
            console.log('onmousemoveイベントが見つかりません');
            return;
        }
        // previewpiece(14,X,Y)の形式からX（ミノタイプ）とY（回転方向）を抽出
        const match = onmousemove.match(/previewpiece\(14,(\d+),(\d+)\)/);
        if (!match) {
            console.log('previewpiece関数が見つかりません');
            return;
        }
        const currentMinoType = parseInt(match[1]);
        const currentRotation = parseInt(match[2]);
        // 次の回転方向を計算
        // direction = 1: 時計回り (0→1→2→3→0)
        // direction = -1: 反時計回り (0→3→2→1→0)
        let nextRotation;
        if (direction === 1) {
            nextRotation = (currentRotation + 1) % 4;
        } else {
            nextRotation = (currentRotation - 1 + 4) % 4;
        }
        const rotationName = direction === 1 ? '時計回り' : '反時計回り';
        console.log(`現在のミノ: ${currentMinoType}, 回転: ${currentRotation} → 次の回転: ${nextRotation} (${rotationName})`);
        // 次の回転方向のラジオボタンを検索
        const nextRadio = findRadioButton(currentMinoType, nextRotation);
        if (nextRadio) {
            // 現在の選択を解除
            selectedRadio.checked = false;
            // 次のラジオボタンを選択
            nextRadio.checked = true;
            // onmousemoveイベントを手動で実行してプレビューを更新
            if (nextRadio.getAttribute('onmousemove')) {
                eval(nextRadio.getAttribute('onmousemove'));
            }
            console.log('回転完了');
        } else {
            console.log('次の回転方向のラジオボタンが見つかりません');
        }
    }
    
    function findRadioButton(minoType, rotation) {
        // すべてのラジオボタンを検索
        const allRadios = document.querySelectorAll('input[name="mode"]');
        for (let radio of allRadios) {
            const onmousemove = radio.getAttribute('onmousemove');
            if (onmousemove) {
                const match = onmousemove.match(/previewpiece\(14,(\d+),(\d+)\)/);
                if (match) {
                    const radioMinoType = parseInt(match[1]);
                    const radioRotation = parseInt(match[2]);
                    if (radioMinoType === minoType && radioRotation === rotation) {
                        return radio;
                    }
                }
            }
        }
        return null;
    }
    
    console.log('Fumen Tetris Piece Rotation with Hold スクリプトが読み込まれました');
})();