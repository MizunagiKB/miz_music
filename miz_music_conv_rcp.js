// ===========================================================================
/*!
 * @brief MIDI Music
 * @author @MizunagiKB
 */
// -------------------------------------------------------------- reference(s)
/// <reference path="./miz_music.ts" />
/// <reference path="./miz_music_conv.ts" />
/*!
 */
var CRCPTrackWork = (function () {
    function CRCPTrackWork() {
        this.m_nCh = 0;
        this.m_nTrackSize = 0;
        this.m_nTrackAddr = 0;
        this.m_nStepTotal = 0;
        this.m_nStepBreak = 0;
        this.m_nSequence = 0;
        this.m_nPos = 0;
    }
    CRCPTrackWork.prototype.create_copy = function () {
        var oCResult = new CRCPTrackWork();
        oCResult.m_nCh = this.m_nCh;
        oCResult.m_nTrackSize = this.m_nTrackSize;
        oCResult.m_nTrackAddr = this.m_nTrackAddr;
        oCResult.m_nStepTotal = this.m_nStepTotal;
        oCResult.m_nStepBreak = this.m_nStepBreak;
        oCResult.m_nSequence = this.m_nSequence;
        oCResult.m_nPos = this.m_nPos;
        return (oCResult);
    };
    return CRCPTrackWork;
})();
/*!
 */
var CRCPStep = (function () {
    function CRCPStep() {
        this.m_nStep = 0;
        this.m_nSequence = 0;
        this.m_oCMIDIData = null;
    }
    return CRCPStep;
})();
var CRCPLoop = (function () {
    function CRCPLoop() {
        this.m_nPos = 0;
        this.m_nCount = 0;
    }
    return CRCPLoop;
})();
/*!
 */
var CMusicParserRCP = (function () {
    function CMusicParserRCP(o) {
        this.m_oCParser = o;
        this.m_nPos = 0;
    }
    CMusicParserRCP.prototype.convert_track = function (listCRCPStep) {
        var oCMIDITrack = new miz.music.CMIDITrack();
        var nStepCurr = 0;
        var listNote = [];
        for (var n = 0; n < 0x80; n++) {
            listNote.push(0);
        }
        for (var n = 0; n < listCRCPStep.length; n++) {
            var oCRCPStep = listCRCPStep[n];
            switch (oCRCPStep.m_oCMIDIData.m_eMMsg) {
                case miz.music.E_MIDI_MSG.NOTE_ON:
                    {
                        var nNote = oCRCPStep.m_oCMIDIData.m_aryValue[1];
                        var nVelo = oCRCPStep.m_oCMIDIData.m_aryValue[2];
                        if (nVelo == 0) {
                            if (listNote[nNote] == 1) {
                                var oCMIDIData = oCRCPStep.m_oCMIDIData;
                                oCMIDIData.m_nStep = oCRCPStep.m_nStep - nStepCurr;
                                oCMIDITrack.m_listData.push(oCMIDIData);
                                if (oCRCPStep.m_nStep > nStepCurr) {
                                    nStepCurr = oCRCPStep.m_nStep;
                                }
                            }
                            console.assert(listNote[nNote] > 0);
                            listNote[nNote] -= 1;
                        }
                        else {
                            if (listNote[nNote] == 0) {
                                var oCMIDIData = oCRCPStep.m_oCMIDIData;
                                oCMIDIData.m_nStep = oCRCPStep.m_nStep - nStepCurr;
                                oCMIDITrack.m_listData.push(oCMIDIData);
                                if (oCRCPStep.m_nStep > nStepCurr) {
                                    nStepCurr = oCRCPStep.m_nStep;
                                }
                            }
                            listNote[nNote] += 1;
                        }
                    }
                    break;
                default:
                    {
                        var oCMIDIData = oCRCPStep.m_oCMIDIData;
                        oCMIDIData.m_nStep = oCRCPStep.m_nStep - nStepCurr;
                        oCMIDITrack.m_listData.push(oCMIDIData);
                        if (oCRCPStep.m_nStep > nStepCurr) {
                            nStepCurr = oCRCPStep.m_nStep;
                        }
                    }
                    break;
            }
        }
        return (oCMIDITrack);
    };
    CMusicParserRCP.prototype.build_num = function (oCTWork, eMMsg, eMEvt, numValue) {
        var oCRCPStep = null;
        var oCMIDIData = null;
        oCMIDIData = new miz.music.CMIDIData();
        oCMIDIData.m_nStep = 0;
        oCMIDIData.m_eMMsg = eMMsg;
        oCMIDIData.m_eMEvt = eMEvt;
        oCMIDIData.m_numValue = numValue;
        oCRCPStep = new CRCPStep();
        oCRCPStep.m_nStep = oCTWork.m_nStepTotal;
        oCRCPStep.m_nSequence = oCTWork.m_nSequence;
        oCRCPStep.m_oCMIDIData = oCMIDIData;
        oCTWork.m_nSequence++;
        return (oCRCPStep);
    };
    CMusicParserRCP.prototype.build_array = function (oCTWork, eMMsg, eMEvt, aryValue) {
        var oCRCPStep = null;
        var oCMIDIData = null;
        oCMIDIData = new miz.music.CMIDIData();
        oCMIDIData.m_nStep = 0;
        oCMIDIData.m_eMMsg = eMMsg;
        oCMIDIData.m_eMEvt = eMEvt;
        oCMIDIData.m_aryValue = aryValue;
        oCRCPStep = new CRCPStep();
        oCRCPStep.m_nStep = oCTWork.m_nStepTotal;
        oCRCPStep.m_nSequence = oCTWork.m_nSequence;
        oCRCPStep.m_oCMIDIData = oCMIDIData;
        oCTWork.m_nSequence++;
        return (oCRCPStep);
    };
    CMusicParserRCP.prototype.build_note = function (oCTWork, nNote, nGate, nVelo) {
        var listCRCPStep = [];
        var oCRCPStep = null;
        var oCMIDIData = null;
        if (nGate > 0) {
            var oCRCPStep_1 = null;
            oCRCPStep_1 = this.build_array(oCTWork, miz.music.E_MIDI_MSG.NOTE_ON, 0, [0x90 + oCTWork.m_nCh, nNote, nVelo]);
            oCRCPStep_1.m_nStep = oCTWork.m_nStepTotal;
            listCRCPStep.push(oCRCPStep_1);
            oCRCPStep_1 = this.build_array(oCTWork, miz.music.E_MIDI_MSG.NOTE_ON, 0, [0x90 + oCTWork.m_nCh, nNote, 0x00]);
            oCRCPStep_1.m_nStep = oCTWork.m_nStepTotal + nGate;
            listCRCPStep.push(oCRCPStep_1);
        }
        return (listCRCPStep);
    };
    /*!
     */
    CMusicParserRCP.prototype.copy_event = function (_oCTWork, nMeasure, nOffsetAddr) {
        var listCRCPStep = [];
        var oCTWork = _oCTWork.create_copy();
        oCTWork.m_nPos = nOffsetAddr - 44;
        oCTWork.m_nStepBreak = oCTWork.m_nStepTotal + this.m_nStepBlock;
        listCRCPStep = this.make_event(oCTWork, true);
        _oCTWork.m_nStepTotal = oCTWork.m_nStepTotal;
        _oCTWork.m_nSequence = oCTWork.m_nSequence;
        return (listCRCPStep);
    };
    /*!
     */
    CMusicParserRCP.prototype.make_event = function (oCTWork, bCopyMeasure) {
        var listCRCPStep = [];
        var listLoopStack = [];
        var n = oCTWork.m_nPos;
        var bMeasureEnd = false;
        while (n < oCTWork.m_nTrackSize) {
            var nAddr = n + oCTWork.m_nTrackAddr;
            var nStep = 0;
            var nEv = this.m_oCParser.m_aryData[nAddr + 0];
            if (nEv < 0x80) {
                array_append(listCRCPStep, this.build_note(oCTWork, this.m_oCParser.m_aryData[nAddr + 0], this.m_oCParser.m_aryData[nAddr + 2], this.m_oCParser.m_aryData[nAddr + 3]));
                nStep = this.m_oCParser.m_aryData[nAddr + 1];
            }
            else {
                switch (nEv) {
                    case 0xE2:
                        {
                            var oCMIDIData = null;
                            var oCRCPStep = null;
                            listCRCPStep.push(this.build_array(oCTWork, miz.music.E_MIDI_MSG.CONTROL_CHANGE, 0, [
                                0xB0 + oCTWork.m_nCh,
                                0x20,
                                this.m_oCParser.m_aryData[nAddr + 3]
                            ]));
                            listCRCPStep.push(this.build_array(oCTWork, miz.music.E_MIDI_MSG.PROGRAM_CHANGE, 0, [
                                0xC0 + oCTWork.m_nCh,
                                this.m_oCParser.m_aryData[nAddr + 2]
                            ]));
                            nStep = this.m_oCParser.m_aryData[nAddr + 1];
                        }
                        break;
                    case 0xE7:
                        {
                            var nTempo = (this.m_nTempo * this.m_oCParser.m_aryData[nAddr + 2]) / 64.0;
                            listCRCPStep.push(this.build_num(oCTWork, miz.music.E_MIDI_MSG.META_EVT, miz.music.E_META_EVT.TEMPO, Math.floor(60000000 / nTempo)));
                            nStep = this.m_oCParser.m_aryData[nAddr + 1];
                        }
                        break;
                    case 0xEA:
                        {
                            listCRCPStep.push(this.build_array(oCTWork, miz.music.E_MIDI_MSG.C_AFTER_TOUCH, 0, [
                                0xD0 + oCTWork.m_nCh,
                                this.m_oCParser.m_aryData[nAddr + 2]
                            ]));
                            nStep = this.m_oCParser.m_aryData[nAddr + 1];
                        }
                        break;
                    case 0xEB:
                        {
                            listCRCPStep.push(this.build_array(oCTWork, miz.music.E_MIDI_MSG.CONTROL_CHANGE, 0, [
                                0xB0 + oCTWork.m_nCh,
                                this.m_oCParser.m_aryData[nAddr + 2],
                                this.m_oCParser.m_aryData[nAddr + 3]
                            ]));
                            nStep = this.m_oCParser.m_aryData[nAddr + 1];
                        }
                        break;
                    case 0xEC:
                        {
                            listCRCPStep.push(this.build_array(oCTWork, miz.music.E_MIDI_MSG.PROGRAM_CHANGE, 0, [
                                0xC0 + oCTWork.m_nCh,
                                this.m_oCParser.m_aryData[nAddr + 2]
                            ]));
                            nStep = this.m_oCParser.m_aryData[nAddr + 1];
                        }
                        break;
                    case 0xED:
                        {
                            listCRCPStep.push(this.build_array(oCTWork, miz.music.E_MIDI_MSG.P_AFTER_TOUCH, 0, [
                                0xA0 + oCTWork.m_nCh,
                                this.m_oCParser.m_aryData[nAddr + 2],
                                this.m_oCParser.m_aryData[nAddr + 3]
                            ]));
                            nStep = this.m_oCParser.m_aryData[nAddr + 1];
                        }
                        break;
                    case 0xEE:
                        {
                            var oCMIDIData = null;
                            var oCRCPStep = null;
                            oCMIDIData = new miz.music.CMIDIData();
                            oCMIDIData.m_nStep = 0;
                            oCMIDIData.m_eMMsg = miz.music.E_MIDI_MSG.PITCH;
                            oCMIDIData.m_aryValue = [
                                0xE0 + oCTWork.m_nCh,
                                this.m_oCParser.m_aryData[nAddr + 2],
                                this.m_oCParser.m_aryData[nAddr + 3]
                            ];
                            oCRCPStep = new CRCPStep();
                            oCRCPStep.m_nStep = oCTWork.m_nStepTotal;
                            oCRCPStep.m_nSequence = oCTWork.m_nSequence;
                            oCRCPStep.m_oCMIDIData = oCMIDIData;
                            oCTWork.m_nSequence++;
                            listCRCPStep.push(oCRCPStep);
                            nStep = this.m_oCParser.m_aryData[nAddr + 1];
                        }
                        break;
                    case 0xF5:
                    case 0xF6:
                    case 0xF7:
                        nStep = 0;
                        break;
                    case 0xF8:
                        {
                            var oCLoop = listLoopStack.pop();
                            if (oCLoop.m_nCount == null) {
                                var nCount = this.m_oCParser.m_aryData[nAddr + 1];
                                if (nCount == 0) {
                                    oCLoop.m_nCount = 2;
                                }
                                else {
                                    oCLoop.m_nCount = this.m_oCParser.m_aryData[nAddr + 1];
                                }
                            }
                            else {
                                oCLoop.m_nCount -= 1;
                            }
                            if (oCLoop.m_nCount > 1) {
                                n = oCLoop.m_nPos;
                                listLoopStack.push(oCLoop);
                            }
                            nStep = 0;
                        }
                        break;
                    case 0xF9:
                        {
                            var oCLoop = new CRCPLoop();
                            oCLoop.m_nPos = n;
                            oCLoop.m_nCount = null;
                            listLoopStack.push(oCLoop);
                            nStep = 0;
                        }
                        break;
                    case 0xFC:
                        {
                            var nMe = 0;
                            var nOf = 0;
                            nMe |= this.m_oCParser.m_aryData[nAddr + 1];
                            nMe |= (this.m_oCParser.m_aryData[nAddr + 2] & 0x03) << 8;
                            nOf |= this.m_oCParser.m_aryData[nAddr + 3] << 8;
                            nOf |= (this.m_oCParser.m_aryData[nAddr + 2] & 0xFC);
                            console.assert(bCopyMeasure != true);
                            listCRCPStep = array_append(listCRCPStep, this.copy_event(oCTWork, nMe, nOf));
                            nStep = 0;
                        }
                        break;
                    case 0xFD:
                        bMeasureEnd = true;
                        nStep = 0;
                        break;
                    case 0xFE:
                        nStep = 0;
                        break;
                    default:
                        {
                            nStep = this.m_oCParser.m_aryData[nAddr + 1];
                        }
                        break;
                }
            }
            n += 4;
            oCTWork.m_nStepTotal += nStep;
            if (bCopyMeasure == true && bMeasureEnd == true) {
                break;
            }
        }
        return (listCRCPStep);
    };
    /*!
     */
    CMusicParserRCP.prototype.parse_track = function (nCh, nTrackSize) {
        var oCRCPStep = null;
        var listCRCPStep = [];
        var oCTWork = new CRCPTrackWork();
        oCTWork.m_nCh = nCh;
        oCTWork.m_nTrackSize = nTrackSize;
        oCTWork.m_nSequence = 0x100;
        oCTWork.m_nTrackAddr = this.m_nPos;
        oCTWork.m_nPos = 0;
        listCRCPStep = this.make_event(oCTWork, false);
        oCRCPStep = this.build_num(oCTWork, miz.music.E_MIDI_MSG.META_EVT, miz.music.E_META_EVT.TEMPO, Math.floor(60000000 / this.m_nTempo));
        oCRCPStep.m_nStep = 0;
        oCRCPStep.m_nSequence = 0;
        listCRCPStep.unshift(oCRCPStep);
        listCRCPStep.sort(function (a, b) {
            if (a.m_nStep == b.m_nStep) {
                return (a.m_nSequence - b.m_nSequence);
            }
            return (a.m_nStep - b.m_nStep);
        });
        return (this.convert_track(listCRCPStep));
    };
    CMusicParserRCP.prototype.parse_head = function () {
        var bResult = false;
        var strID = this.m_oCParser.extract_string(0, 2);
        switch (strID) {
            case "RC":
                bResult = true;
                break;
        }
        if (bResult == true) {
            this.m_nTimeDiv = 0;
            this.m_nTimeDiv |= this.m_oCParser.m_aryData[0x01C0] << 0x00;
            this.m_nTimeDiv |= this.m_oCParser.m_aryData[0x01E7] << 0x08;
            this.m_nTempo = this.m_oCParser.m_aryData[0x01C1];
            this.m_nBeat_Nume = this.m_oCParser.m_aryData[0x01C2];
            this.m_nBeat_Deno = this.m_oCParser.m_aryData[0x01C3];
            this.m_nStepBlock = this.m_nBeat_Nume * this.m_nTimeDiv;
            this.m_nKey = this.m_oCParser.m_aryData[0x01C4];
            this.m_nBias = this.m_oCParser.m_aryData[0x01C5];
            this.m_nTrk = this.m_oCParser.m_aryData[0x01E6];
            if (this.m_nTrk == 0) {
                this.m_nTrk = 36;
            }
            this.m_strTitle = Encoding.convert(this.m_oCParser.extract_string(0x0020, 64), {
                to: "UNICODE",
                type: "string"
            });
        }
        return (bResult);
    };
    CMusicParserRCP.prototype.parse = function () {
        var oCMIDIMusic = null;
        var oCMIDITrack = null;
        if (this.parse_head() == true) {
            this.m_nPos = 0x0586;
            oCMIDIMusic = new miz.music.CMIDIMusic();
            for (var nTrack = 0; nTrack < this.m_nTrk; nTrack++) {
                var nDataSize = this.m_oCParser.extract_number(E_EXTRACT_TYPE.E_EXTRACT_TYPE_U16_LE, this.m_nPos + 0);
                var nTr = this.m_oCParser.m_aryData[this.m_nPos + 2];
                var nCh = this.m_oCParser.m_aryData[this.m_nPos + 4];
                var nStep = this.m_oCParser.m_aryData[this.m_nPos + 6];
                var nNextPos = this.m_nPos + nDataSize;
                this.m_nPos += 0x2C;
                if (nCh < 0x10) {
                    oCMIDIMusic.m_listTrack.push(this.parse_track(nCh, nDataSize - 0x2C));
                }
                this.m_nPos = nNextPos;
                if (this.m_nPos < this.m_oCParser.m_aryData.length) {
                }
                else {
                    break;
                }
            }
            oCMIDIMusic.m_nTimeDiv = this.m_nTimeDiv;
            oCMIDIMusic.m_strTitle = this.m_strTitle;
        }
        return (oCMIDIMusic);
    };
    return CMusicParserRCP;
})();
function array_append(aryA, aryB) {
    for (var n = 0; n < aryB.length; n++) {
        aryA.push(aryB[n]);
    }
    return (aryA);
}
