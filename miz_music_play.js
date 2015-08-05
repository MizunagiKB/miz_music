// ===========================================================================
/*!
 * @brief Mizunagi Music Player for WebMIDI
 * @author @MizunagiKB
 */
// -------------------------------------------------------------- reference(s)
/// <reference path="./miz_music.ts" />
var miz;
(function (miz) {
    var music_player;
    (function (music_player) {
        var E_PLAYER_STATUS;
        (function (E_PLAYER_STATUS) {
            E_PLAYER_STATUS[E_PLAYER_STATUS["E_PLAY"] = 0] = "E_PLAY";
            E_PLAYER_STATUS[E_PLAYER_STATUS["E_STOP"] = 1] = "E_STOP";
        })(E_PLAYER_STATUS || (E_PLAYER_STATUS = {}));
        /*!
         */
        var CTrStatus = (function () {
            function CTrStatus() {
            }
            return CTrStatus;
        })();
        /*!
         */
        var CChStatus = (function () {
            function CChStatus() {
                this.m_listNote = null;
            }
            return CChStatus;
        })();
        /*!
         */
        var CPlayer = (function () {
            function CPlayer() {
                this.m_hMIDIO = null;
                this.m_oCMIDIMusic = null;
                this.m_ePlayerStatus = E_PLAYER_STATUS.E_STOP;
                this.m_nTimePrev = 0;
                this.m_nTimeCurr = 0;
                this.m_hTimer = null;
                this.m_nTempo = 60000000 / 120;
                this.m_nStepCurr = 0;
                this.m_nTimeDiv = 0;
                this.m_bSysEx = false;
                this.m_listTrStatus = [];
                this.m_listChStatus = [];
                this.evt_success = null;
                this.evt_failure = null;
                this.m_oCMIDIMusic = null;
                this.m_listChStatus = [];
                this.m_listTrStatus = [];
                for (var n = 0; n < CPlayer.MAX_CH; n++) {
                    var oCh = new CChStatus();
                    oCh.m_listNote = [];
                    for (var nNote = 0; nNote < 128; nNote++) {
                        oCh.m_listNote.push(0);
                    }
                    this.m_listChStatus.push(oCh);
                }
            }
            CPlayer.prototype.update_track = function (oCTrStatus, oCMIDITrack) {
                var bResult = false;
                var nPos = oCTrStatus.m_nDataPos;
                while (nPos < oCMIDITrack.m_listData.length) {
                    var midiData = oCMIDITrack.m_listData[nPos];
                    bResult = true;
                    if ((oCTrStatus.m_nStepCurr + midiData.m_nStep) < this.m_nStepCurr) {
                        oCTrStatus.m_nStepCurr += midiData.m_nStep;
                        switch (midiData.m_eMMsg) {
                            case miz.music.E_MIDI_MSG.NOTE_OF:
                                {
                                    var nCh = midiData.m_aryValue[0] & 0x0F;
                                    var nNote = midiData.m_aryValue[1];
                                    if (this.m_listChStatus[nCh].m_listNote[nNote] > 0) {
                                        this.m_listChStatus[nCh].m_listNote[nNote] -= 1;
                                    }
                                }
                                break;
                            case miz.music.E_MIDI_MSG.NOTE_ON:
                                {
                                    var nCh = midiData.m_aryValue[0] & 0x0F;
                                    var nNote = midiData.m_aryValue[1];
                                    var nVelo = midiData.m_aryValue[2];
                                    if (nVelo > 0) {
                                        this.m_listChStatus[nCh].m_listNote[nNote] += 1;
                                    }
                                    else {
                                        if (this.m_listChStatus[nCh].m_listNote[nNote] > 0) {
                                            this.m_listChStatus[nCh].m_listNote[nNote] -= 1;
                                        }
                                    }
                                }
                                break;
                            case miz.music.E_MIDI_MSG.META_EVT:
                                {
                                    switch (midiData.m_eMEvt) {
                                        case miz.music.E_META_EVT.TEMPO:
                                            {
                                                this.m_nTempo = midiData.m_numValue;
                                            }
                                            break;
                                    }
                                }
                                break;
                        }
                        if (midiData.m_aryValue.length > 0) {
                            try {
                                this.m_hMIDIO.send(midiData.m_aryValue, 0);
                            }
                            catch (e) {
                            }
                        }
                        nPos += 1;
                    }
                    else {
                        break;
                    }
                }
                oCTrStatus.m_nDataPos = nPos;
                return (bResult);
            };
            CPlayer.prototype.update = function () {
                if (this.m_ePlayerStatus == E_PLAYER_STATUS.E_PLAY) {
                    var nTime = window.performance.now();
                    var nSingleStep = (this.m_nTempo / 1000.0) / this.m_oCMIDIMusic.m_nTimeDiv;
                    var nElapsedTime = 0;
                    var nElapsedStep = 0;
                    var bEnable = false;
                    this.m_nTimeCurr = nTime;
                    nElapsedTime = this.m_nTimeCurr - this.m_nTimePrev;
                    nElapsedStep = nElapsedTime / nSingleStep;
                    this.m_nStepCurr += nElapsedStep;
                    this.m_nTimePrev = this.m_nTimeCurr;
                    for (var nTr = 0; nTr < this.m_oCMIDIMusic.m_listTrack.length; nTr++) {
                        var oCTr = this.m_listTrStatus[nTr];
                        if (oCTr.m_bEnable == true) {
                            oCTr.m_bEnable = this.update_track(this.m_listTrStatus[nTr], this.m_oCMIDIMusic.m_listTrack[nTr]);
                            bEnable = true;
                        }
                    }
                    if (bEnable == false) {
                        this.stop();
                    }
                }
            };
            CPlayer.prototype.timer_ignite = function () {
                if (this.m_hTimer == null) {
                    this.m_hTimer = setInterval(evt_update, CPlayer.INTERVAL);
                }
            };
            CPlayer.prototype.timer_destroy = function () {
                if (this.m_hTimer != null) {
                    clearInterval(this.m_hTimer);
                    this.m_hTimer = null;
                }
            };
            CPlayer.prototype.assign_midio = function (nDevice) {
                this.m_hMIDIO = CPlayer.MIDI_O_LIST[nDevice];
                return (CPlayer.MIDI_O_LIST[nDevice]);
            };
            CPlayer.prototype.is_play = function () {
                return (this.m_ePlayerStatus == E_PLAYER_STATUS.E_PLAY);
            };
            CPlayer.prototype.reset = function () {
                var nPerformance = window.performance.now();
                this.m_ePlayerStatus = E_PLAYER_STATUS.E_STOP;
                for (var nCh = 0; nCh < CPlayer.MAX_CH; nCh++) {
                    var oCh = this.m_listChStatus[nCh];
                    var nTime = nPerformance + nCh * 20;
                    if (this.m_hMIDIO != null) {
                        this.m_hMIDIO.send([0xB0 + nCh, 0x79, 0], 0);
                        this.m_hMIDIO.send([0xB0 + nCh, 0x7B, 0], 0);
                        this.m_hMIDIO.send([0xB0 + nCh, 0x78, 0], 0);
                    }
                }
                this.stop();
            };
            CPlayer.prototype.load = function (oCMIDIMusic) {
                this.stop();
                this.m_oCMIDIMusic = oCMIDIMusic;
                this.m_nTimeDiv = oCMIDIMusic.m_nTimeDiv;
                for (var n = 0; n < this.m_oCMIDIMusic.m_listTrack.length; n++) {
                    this.m_listTrStatus.push(new CTrStatus());
                }
            };
            CPlayer.prototype.play = function () {
                this.reset();
                this.m_nTimeCurr = window.performance.now();
                this.m_nTimePrev = this.m_nTimeCurr;
                this.m_nStepCurr = 0;
                this.m_nTempo = 60000000 / 120;
                for (var nTr = 0; nTr < this.m_oCMIDIMusic.m_listTrack.length; nTr++) {
                    this.m_listTrStatus[nTr].m_nStepCurr = 0;
                    this.m_listTrStatus[nTr].m_nDataPos = 0;
                    this.m_listTrStatus[nTr].m_bEnable = true;
                }
                this.m_ePlayerStatus = E_PLAYER_STATUS.E_PLAY;
                this.timer_ignite();
            };
            CPlayer.prototype.stop = function () {
                this.m_ePlayerStatus = E_PLAYER_STATUS.E_STOP;
                this.timer_destroy();
                for (var nCh = 0; nCh < CPlayer.MAX_CH; nCh++) {
                    var oCh = this.m_listChStatus[nCh];
                    for (var nNote = 0; nNote < 0x80; nNote++) {
                        var nCount = oCh.m_listNote[nNote];
                        while (nCount > 0) {
                            if (this.m_hMIDIO != null) {
                                this.m_hMIDIO.send([0x80 + nCh, nNote, 0], 0);
                            }
                            nCount--;
                        }
                        oCh.m_listNote[nNote] = 0;
                    }
                }
            };
            CPlayer.INSTANCE = null;
            CPlayer.INTERVAL = 10;
            CPlayer.MAX_CH = 16;
            CPlayer.MIDI_I_LIST = [];
            CPlayer.MIDI_O_LIST = [];
            return CPlayer;
        })();
        music_player.CPlayer = CPlayer;
        /*!
         */
        function evt_update() {
            CPlayer.INSTANCE.update();
        }
        /*!
         */
        function evt_midi_success(oCEvt) {
            console.log(oCEvt);
            var iter = oCEvt.outputs.values();
            for (var o = iter.next(); !o.done; o = iter.next()) {
                CPlayer.MIDI_O_LIST.push(o.value);
            }
            if (CPlayer.INSTANCE.evt_success != null) {
                CPlayer.INSTANCE.evt_success(oCEvt, CPlayer.MIDI_I_LIST, CPlayer.MIDI_O_LIST);
                CPlayer.INSTANCE.evt_success = null;
            }
        }
        /*!
         */
        function evt_midi_failure(oCEvt) {
            if (CPlayer.INSTANCE.evt_failure != null) {
                CPlayer.INSTANCE.evt_failure(oCEvt);
                CPlayer.INSTANCE.evt_failure = null;
            }
        }
        /*!
         * @brief プレイヤーインスタンスの生成処理
         */
        function create_instance(bSysEx, evt_success, evt_failure) {
            if (bSysEx === void 0) { bSysEx = false; }
            if (evt_success === void 0) { evt_success = null; }
            if (evt_failure === void 0) { evt_failure = null; }
            var oCResult = null;
            if (CPlayer.INSTANCE != null) {
                oCResult = CPlayer.INSTANCE;
            }
            else {
                oCResult = new CPlayer();
                oCResult.reset();
                if (navigator.requestMIDIAccess != undefined) {
                    oCResult.m_bSysEx = bSysEx;
                    oCResult.evt_success = evt_success;
                    oCResult.evt_failure = evt_failure;
                    navigator.requestMIDIAccess({ sysex: oCResult.m_bSysEx }).then(evt_midi_success, evt_midi_failure);
                }
                CPlayer.INSTANCE = oCResult;
            }
            return (oCResult);
        }
        music_player.create_instance = create_instance;
        /*!
         * @brief プレイヤーインスタンスの破棄処理
         */
        function destroy_instance() {
            if (CPlayer.INSTANCE != null) {
                CPlayer.INSTANCE.evt_success = null;
                CPlayer.INSTANCE.evt_failure = null;
                CPlayer.INSTANCE = null;
            }
        }
        music_player.destroy_instance = destroy_instance;
    })(music_player = miz.music_player || (miz.music_player = {}));
})(miz || (miz = {}));
