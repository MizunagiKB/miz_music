# miz_music
Web MIDI Player for Chrome

[Web MIDI](https://webaudio.github.io/web-midi-api/)を使用した、MIDI Playerです。
SMFとRCPが再生可能です。RCP形式の再生については、幾つかの機能が未実装です。

未実装部分
* エクスクルーシブ処理
* 16CH以上のMIDIチャンネル
* トラック単位のステップ調整
* トラック単位のトランスポーズ
* 無限ループ再生（検出された場合強制的に2ループにしています。）

RCP形式については、以下の資料を参考にしました。

* MCP/RCP/R36 → 標準MIDIファイルコンバータ [CSV](http://www.vector.co.jp/soft/dos/art/se021569.html)


文字コードの変換処理には、[encoding.js](https://github.com/polygonplanet/encoding.js)を使用しています。
