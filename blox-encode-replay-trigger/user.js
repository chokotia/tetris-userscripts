// ==UserScript==
// @name         Encode Replay Trigger
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Pass replay data to Jstris replay page via URL
// @author       You
// @match        https://blox.askplays.com/map-maker*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Overriding the encodeReplay function
    function encodeReplay() {
        var t = r.saveReplay();
        var replay = {
            c: c,
            d: t
        };
        var compressedReplay = LZString.compressToEncodedURIComponent(JSON.stringify(replay));
        openReplay(compressedReplay, "blox");
        //openReplay(compressedReplay, "jstris");
    }

    // Open the Jstris replay page with replay data in the URL
    function openReplayInJstris(replayData) {
        const uriStr = `https://jstris.jezevec10.com/replay?data=${replayData}`;
        window.open(uriStr, '_blank');
    }

    function openReplay(replayData, siteName) {

        let uriStr = "";
        if (siteName == "blox" ){
            uriStr = 'https://blox.askplays.com/replay/?r=' + replayData;
        } else {
            uriStr = `https://jstris.jezevec10.com/replay?data=${replayData}`;
        }

        window.open(uriStr, '_blank');
    }

    // Create a button and style it
    const button = document.createElement('button');
    button.textContent = 'Run encodeReplay';
    button.style.position = 'fixed';
    button.style.top = '10px';
    button.style.left = '10px'; // Change from right to left
    button.style.zIndex = '10000';
    button.style.padding = '10px 20px';

    button.style.borderRadius = '5px';
    button.style.cursor = 'pointer';

    button.style.backgroundColor = 'rgba(200, 200, 200, 0.7)'; // 半透明の淡いグレー
    button.style.color = '#333'; // 暗めの文字色
    button.style.border = '1px solid #ccc'; // 控えめな枠線
    button.style.padding = '5px 10px'; // 小さい余白
    button.style.fontSize = '12px'; // 小さいフォントサイズ

    // Add the button to the page
    document.body.appendChild(button);

    // Add an event listener to the button
    button.addEventListener('click', () => {
        try {
            encodeReplay(); // Call the modified encodeReplay function
            //alert('Replay opened in Jstris with data in URL!');
        } catch (error) {
            console.error('Error executing encodeReplay():', error);
            alert('Error opening replay. Check the console for more details.');
        }
    });
})();
