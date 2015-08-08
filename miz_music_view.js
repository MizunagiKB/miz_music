// ===========================================================================
/*!
 * @brief Mizunagi Music Viewer for WebMIDI
 * @author @MizunagiKB
 */
// -------------------------------------------------------------- reference(s)
/// <reference path="./DefinitelyTyped/easeljs/easeljs.d.ts" />
/// <reference path="./miz_music_play.ts" />
var miz;
(function (miz) {
    var music_viewer;
    (function (music_viewer) {
        /*!
         */
        var CViewer = (function () {
            function CViewer(strId) {
                this.m_oCStage = null;
                this.m_listKb0 = [];
                this.m_KBSheet = null;
                this.m_listShape = [];
                this.m_listSprite = [];
                this.m_oCStage = new createjs.Stage(strId);
                this.m_oCStage.canvas.width = 768;
                this.m_oCStage.canvas.height = 384;
                var oCKb0Base = new createjs.Bitmap("./assets/kbview_0.png");
                for (var n = 0; n < 16; n++) {
                    var oCKB0 = oCKb0Base.clone();
                    oCKB0.x = 8;
                    oCKB0.y = (24 * n) + 8;
                    oCKB0.alpha = 0.75;
                    this.m_listKb0.push(oCKB0);
                    this.m_oCStage.addChild(oCKB0);
                }
                var dictSheet = {
                    images: ["./assets/kbview_1.png"],
                    frames: [
                        [0, 0, 64, 16],
                        [0, 16, 64, 16],
                        [0, 32, 64, 16],
                        [0, 48, 64, 16],
                        [0, 64, 64, 16],
                        [0, 80, 64, 16],
                        [0, 96, 64, 16],
                        [0, 112, 64, 16],
                        [0, 128, 64, 16],
                        [0, 144, 64, 16],
                        [0, 160, 64, 16],
                        [0, 176, 64, 16]
                    ],
                    animations: {
                        "0": [0],
                        "1": [1],
                        "2": [2],
                        "3": [3],
                        "4": [4],
                        "5": [5],
                        "6": [6],
                        "7": [7],
                        "8": [8],
                        "9": [9],
                        "10": [10],
                        "11": [11]
                    }
                };
                this.m_KBSheet = new createjs.SpriteSheet(dictSheet);
            }
            CViewer.prototype.update_cc = function (oCPlayer) {
                var g = new createjs.Graphics();
                for (var n = 0; n < this.m_listShape.length; n++) {
                    this.m_oCStage.removeChild(this.m_listShape[n]);
                }
                this.m_listShape = [];
                for (var nCh = 0; nCh < 16; nCh++) {
                    var listCC = oCPlayer.m_listChStatus[nCh].m_listCCange;
                    for (var nCC = 0; nCC < 0x80; nCC++) {
                        if (listCC[nCC] > 0) {
                            var o = new createjs.Shape();
                            var v = listCC[nCC] >> 3;
                            o.graphics.beginFill("#FFFFFF").drawRect(768 - 128 + nCC, (8 + (16 - v)) + 24 * nCh, 1, v);
                            this.m_listShape.push(o);
                        }
                    }
                }
                for (var n = 0; n < this.m_listShape.length; n++) {
                    this.m_oCStage.addChild(this.m_listShape[n]);
                }
            };
            CViewer.prototype.update_note = function (oCPlayer) {
                for (var n = 0; n < this.m_listSprite.length; n++) {
                    this.m_oCStage.removeChild(this.m_listSprite[n]);
                }
                this.m_listSprite = [];
                for (var n = 0; n < 16; n++) {
                    var listNote = oCPlayer.m_listChStatus[n].m_listNote;
                    for (var nNote = 0; nNote < 0x80; nNote++) {
                        if (listNote[nNote] > 0) {
                            var o = new createjs.Sprite(this.m_KBSheet, Math.floor(nNote % 12));
                            o.x = 8 + Math.floor(nNote / 12) * 49;
                            o.y = 8 + (24 * n);
                            o.alpha = listNote[nNote] / 127.0;
                            this.m_listSprite.push(o);
                        }
                    }
                }
                for (var n = 0; n < this.m_listSprite.length; n++) {
                    this.m_oCStage.addChild(this.m_listSprite[n]);
                }
            };
            CViewer.prototype.update = function (oCPlayer) {
                this.update_cc(oCPlayer);
                this.update_note(oCPlayer);
                this.m_oCStage.update();
            };
            CViewer.INSTANCE = null;
            CViewer.INTERVAL = 100;
            CViewer.HEIGHT = 96;
            CViewer.PEAK_HISTORY = 136;
            return CViewer;
        })();
        music_viewer.CViewer = CViewer;
        function handleTick(oCEvt) {
            CViewer.INSTANCE.m_oCStage.update();
        }
        /*!
         * @brief ディスプレイインスタンスの生成処理
         */
        function create_instance(strId) {
            var oCResult = null;
            if (CViewer.INSTANCE != null) {
                oCResult = CViewer.INSTANCE;
            }
            else {
                oCResult = new CViewer(strId);
                CViewer.INSTANCE = oCResult;
            }
            return (oCResult);
        }
        music_viewer.create_instance = create_instance;
    })(music_viewer = miz.music_viewer || (miz.music_viewer = {}));
})(miz || (miz = {}));
