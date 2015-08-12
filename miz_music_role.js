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
    var music_prole;
    (function (music_prole) {
        /*!
         */
        var CNoteInfo = (function () {
            function CNoteInfo(nCh, nNote, nStep, nGate, nVelo) {
                this.m_nCh = 0;
                this.m_nNote = 0;
                this.m_nStep = 0;
                this.m_nGate = 0;
                this.m_nVelo = 0;
                this.m_nCh = nCh;
                this.m_nNote = nNote;
                this.m_nStep = nStep;
                this.m_nGate = nGate;
                this.m_nVelo = nVelo;
            }
            return CNoteInfo;
        })();
        /*!
         */
        var CPRole = (function () {
            function CPRole(strId) {
                this.m_oCStage = null;
                this.m_listKb0 = [];
                this.m_KBSheet = null;
                this.m_listShape = [];
                this.m_listKOn = [];
                this.m_listSprite = [];
                this.m_listNote = [];
                this.m_listNoteMap = [];
                this.m_nPos = 0;
                this.m_oCStage = new createjs.Stage(strId);
                this.m_oCStage.canvas.width = 768;
                this.m_oCStage.canvas.height = 384;
                var oCKb0Base = new createjs.Bitmap("./assets/kbview_0.png");
                oCKb0Base.x = 8;
                oCKb0Base.y = (24 * 15) + 8;
                oCKb0Base.alpha = 0.75;
                this.m_listKb0.push(oCKb0Base);
                this.m_oCStage.addChild(oCKb0Base);
                this.m_listNoteMap = [
                    [1, 6],
                    [6, 3],
                    [8, 6],
                    [13, 3],
                    [15, 6],
                    [22, 6],
                    [27, 3],
                    [29, 6],
                    [34, 3],
                    [36, 6],
                    [41, 3],
                    [43, 6]
                ];
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
            CPRole.prototype.parse_track = function (oCMIDITrack) {
                var nStepCurr = 0;
                var listKbTrig = [];
                for (var i = 0; i < 0x80; i++) {
                    listKbTrig.push(null);
                }
                for (var i = 0; i < oCMIDITrack.m_listData.length; i++) {
                    var mData = oCMIDITrack.m_listData[i];
                    nStepCurr += mData.m_nStep;
                    switch (mData.m_eMMsg) {
                        case miz.music.E_MIDI_MSG.NOTE_OF:
                        case miz.music.E_MIDI_MSG.NOTE_ON:
                            {
                                var nCh = mData.m_aryValue[0] & 0x0F;
                                var nNote = mData.m_aryValue[1];
                                var nVelo = mData.m_aryValue[2];
                                if (mData.m_eMMsg == miz.music.E_MIDI_MSG.NOTE_OF)
                                    nVelo = 0;
                                if (nVelo > 0) {
                                    if (listKbTrig[nNote] == null) {
                                        var oCNInfo = new CNoteInfo(nCh, nNote, nStepCurr, 1, nVelo);
                                        listKbTrig[nNote] = oCNInfo;
                                    }
                                }
                                else {
                                    if (listKbTrig[nNote] != null) {
                                        var oCNInfo = listKbTrig[nNote];
                                        oCNInfo.m_nGate = nStepCurr - oCNInfo.m_nStep;
                                        this.m_listNote.push(oCNInfo);
                                        listKbTrig[nNote] = null;
                                    }
                                }
                            }
                            break;
                    }
                }
            };
            CPRole.prototype.parse = function (oCMIDIMusic) {
                this.m_listNote = [];
                this.m_listKOn = [];
                this.m_nPos = 0;
                for (var i = 0; i < oCMIDIMusic.m_listTrack.length; i++) {
                    this.parse_track(oCMIDIMusic.m_listTrack[i]);
                }
                this.m_listNote.sort(function (a, b) {
                    return (a.m_nStep - b.m_nStep);
                });
            };
            CPRole.prototype.update_role = function (nStepCurr) {
                var nPRoleWidth = 384 - 16;
                for (var i = 0; i < this.m_listShape.length; i++) {
                    this.m_oCStage.removeChild(this.m_listShape[i]);
                }
                this.m_listShape = [];
                var nData = this.m_listKOn.length;
                for (var i = 0; i < this.m_listKOn.length; i++) {
                    var oCNInfo = this.m_listKOn[i];
                    var oct = Math.floor(oCNInfo.m_nNote / 12);
                    var n = Math.floor(oCNInfo.m_nNote % 12);
                    var nY = ((nStepCurr - oCNInfo.m_nStep) + nPRoleWidth) - oCNInfo.m_nGate;
                    var nW = nY + oCNInfo.m_nGate;
                    if (nY < nPRoleWidth) {
                        var nW_1 = nY + oCNInfo.m_nGate;
                        if (nW_1 > nPRoleWidth) {
                            nW_1 = nPRoleWidth - nY;
                        }
                        else {
                            nW_1 = nW_1 - nY;
                        }
                        var o = new createjs.Shape();
                        o.graphics.beginFill("#377BB5").drawRect(8 + (oct * 49) + this.m_listNoteMap[n][0], nY, this.m_listNoteMap[n][1], nW_1);
                        o.alpha = 1.0;
                        this.m_listShape.push(o);
                    }
                }
                var listKOn = [];
                for (var i = 0; i < this.m_listKOn.length; i++) {
                    var oCNInfo = this.m_listKOn[i];
                    var nY = ((nStepCurr - oCNInfo.m_nStep) + nPRoleWidth) - oCNInfo.m_nGate;
                    if (nY < 384) {
                        listKOn.push(oCNInfo);
                    }
                }
                this.m_listKOn = listKOn;
                for (var i = 0; i < this.m_listShape.length; i++) {
                    this.m_oCStage.addChild(this.m_listShape[i]);
                }
            };
            CPRole.prototype.update_debug = function () {
                for (var i = 0; i < 10; i++) {
                    var oCNInfo = new CNoteInfo(0, 12 * i, 0, 8192, 0);
                    this.m_listKOn.push(oCNInfo);
                }
            };
            CPRole.prototype.update_note = function (oCPlayer) {
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
                            o.y = 384 - 16;
                            o.alpha = listNote[nNote] / 127.0;
                            this.m_listSprite.push(o);
                        }
                    }
                }
                for (var n = 0; n < this.m_listSprite.length; n++) {
                    this.m_oCStage.addChild(this.m_listSprite[n]);
                }
            };
            CPRole.prototype.update = function (oCPlayer) {
                var nStepCurr = oCPlayer.m_nStepCurr;
                while (this.m_nPos < this.m_listNote.length) {
                    var oCNInfo = this.m_listNote[this.m_nPos];
                    if (oCNInfo.m_nStep < (nStepCurr + 384)) {
                        this.m_listKOn.push(oCNInfo);
                        this.m_nPos += 1;
                    }
                    else {
                        break;
                    }
                }
                this.update_note(oCPlayer);
                this.update_role(nStepCurr);
                this.m_oCStage.update();
            };
            CPRole.INSTANCE = null;
            return CPRole;
        })();
        music_prole.CPRole = CPRole;
        function handleTick(oCEvt) {
            CPRole.INSTANCE.m_oCStage.update();
        }
        /*!
         * @brief ディスプレイインスタンスの生成処理
         */
        function create_instance(strId) {
            var oCResult = null;
            if (CPRole.INSTANCE != null) {
                oCResult = CPRole.INSTANCE;
            }
            else {
                oCResult = new CPRole(strId);
                CPRole.INSTANCE = oCResult;
            }
            return (oCResult);
        }
        music_prole.create_instance = create_instance;
    })(music_prole = miz.music_prole || (miz.music_prole = {}));
})(miz || (miz = {}));
