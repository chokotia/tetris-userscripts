// ==UserScript==
// @name         Blox Replayにてmapcode読み込み処理を追加
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  try to take over the world!
// @author       You
// @match        https://blox.askplays.com/replay/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=askplays.com
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // 既存関数書き換えのためのutility処理定義
    var trim=a=>{a=a.slice(0,-1);a=a.substr(a.indexOf("{")+1);return a}
    var getParams=a=>{var params=a.slice(a.indexOf("(")+1);params=params.substr(0,params.indexOf(")")).split(",");return params}

    document.addEventListener('DOMContentLoaded', function() {
        // ページ読み込み時に行われるconvert処理をスキップ
        window.convert = function(...args) {console.log('書き換えられたconvert関数');};

        // 少し遅延させてloadボタンを押下
        setTimeout(() => {
            document.getElementById('load').click();
        }, 1000);
    }, true); // キャプチャフェーズで実行

    // ページが完全にロードされた後に処理を実行
    window.addEventListener('load', loadMain)

    function loadMain() {
        // convert関数へ処理を挿入
        //const convertStr = convert.toString();
        const convertStr = 'function convert(e){if(clearTimeout(stepTimeout),"["!=e[0]){r=new Replayer;var i=LZString.decompressFromEncodedURIComponent(e);let t=JSON.parse(i);r.r.d=t.d,t.d=""+t.d,r.r.c=t.c,r.loadReplay(r.r.d),board=new Board(r)}else{i=JSON.parse(e);r.actions=[];const s=[];for(const h of i)if(16!=h.a)r.actions.push(h);else{var t=["teal","orange","blue","yellow","purple","red","green"][h.aux];const o=new Piece(4,0,t);"teal"!=t&&"yellow"!=t||(o.x=5),s.push(o)}r.r.a=r.actions,(board=new Board(r)).piece=s[0],board.queue=s.slice(1)}itr=0,prevTime=performance.now(),totalTime=0,ppsChart?updateGraph(document.getElementById("graph-average").value):ppsGraph(),document.getElementById("time-bar").style.animation="move-right "+(r.actions.at(-1).t-totalTime)/ffSpeed+"ms linear infinite",step()}'
        const params = getParams(convertStr);
        const originalBody = trim(convertStr);
        const modifiedConvertStr = `${originalBody.slice(0,196)},console.log("[debug] inserted script in convert func");if(t.map_code) {applyMapcodeToBoard(t.map_code, board);}; ${originalBody.slice(196)}`;
        const modifiedConvertFunc = new Function(...params, modifiedConvertStr);
        convert = modifiedConvertFunc;
    }

    // mapcodeをboard.bに反映する関数
    window.applyMapcodeToBoard = function(mapcode, board) {
        // 色の値から色名への変換マップ
        const colorMap = {
            0: null,        // 空
            1: "teal",
            2: "yellow",
            3: "purple",
            4: "orange",
            5: "blue",
            6: "green",
            7: "red",
            8: "garbage"
        };

        // mapcodeが200桁であることを確認
        if (mapcode.length !== 200) {
            return;
        }

        // 各桁を処理
        for (let i = 0; i < 200; i++) {
            const digit = parseInt(mapcode[i]);

            // 座標計算
            // i番目の桁は以下の座標に対応：
            // x = Math.floor(i / 20)
            // y = i % 20
            const x = Math.floor(i / 20);
            const y = i % 20;

            // 色の取得
            const color = colorMap[digit];

            // board.bに反映
            if (color === null) {
                // 空の場合はnullを設定
                board.b[x][y] = null;
            } else {
                // ブロックがある場合はBlockインスタンスを作成
                board.b[x][y] = new Block(x, y, color);
            }
        }
    }

})();