// ===========================================================================
/*!
 * @brief MIDI Music
 * @author @MizunagiKB
 */
// -------------------------------------------------------------- reference(s)
/// <reference path="./miz_music.ts" />
/// <reference path="./miz_music_conv_rcp.ts" />
var E_EXTRACT_TYPE;
(function (E_EXTRACT_TYPE) {
    E_EXTRACT_TYPE[E_EXTRACT_TYPE["E_EXTRACT_TYPE_I16_LE"] = 0] = "E_EXTRACT_TYPE_I16_LE";
    E_EXTRACT_TYPE[E_EXTRACT_TYPE["E_EXTRACT_TYPE_U16_LE"] = 1] = "E_EXTRACT_TYPE_U16_LE";
    E_EXTRACT_TYPE[E_EXTRACT_TYPE["E_EXTRACT_TYPE_I16"] = 2] = "E_EXTRACT_TYPE_I16";
    E_EXTRACT_TYPE[E_EXTRACT_TYPE["E_EXTRACT_TYPE_U16"] = 3] = "E_EXTRACT_TYPE_U16";
    E_EXTRACT_TYPE[E_EXTRACT_TYPE["E_EXTRACT_TYPE_I32"] = 4] = "E_EXTRACT_TYPE_I32";
})(E_EXTRACT_TYPE || (E_EXTRACT_TYPE = {}));
/*!
 */
var CMusicParserSMF = (function () {
    function CMusicParserSMF(o) {
        this.m_oCParser = o;
        this.m_nPos = 0;
    }
    CMusicParserSMF.prototype.decode_dvalue = function () {
        var nOffset = 0;
        var n = 0;
        var nDTime = 0;
        while (true) {
            n = this.m_oCParser.m_aryData[this.m_nPos];
            nDTime = nDTime << 7;
            nDTime |= (n & 0x7F);
            this.m_nPos += 1;
            if (n < 0x80) {
                break;
            }
        }
        return (nDTime);
    };
    CMusicParserSMF.prototype.decode_message_ev_std = function (nRaw) {
        var nEv = nRaw & 0xF0;
        var oCData = null;
        switch (nEv) {
            case miz.music.E_MIDI_MSG.NOTE_OF:
            case miz.music.E_MIDI_MSG.NOTE_ON:
            case miz.music.E_MIDI_MSG.P_AFTER_TOUCH:
            case miz.music.E_MIDI_MSG.CONTROL_CHANGE:
                {
                    oCData = new miz.music.CMIDIData();
                    oCData.m_nStep = this.m_nStep;
                    oCData.m_eMMsg = nEv;
                    oCData.m_aryValue = [
                        nRaw,
                        this.m_oCParser.m_aryData[this.m_nPos + 0],
                        this.m_oCParser.m_aryData[this.m_nPos + 1]
                    ];
                    this.m_nPos += 2;
                }
                break;
            case miz.music.E_MIDI_MSG.PROGRAM_CHANGE:
            case miz.music.E_MIDI_MSG.C_AFTER_TOUCH:
                {
                    oCData = new miz.music.CMIDIData();
                    oCData.m_nStep = this.m_nStep;
                    oCData.m_eMMsg = nEv;
                    oCData.m_aryValue = [
                        nRaw,
                        this.m_oCParser.m_aryData[this.m_nPos + 0]
                    ];
                    this.m_nPos += 1;
                }
                break;
            case miz.music.E_MIDI_MSG.PITCH:
                {
                    oCData = new miz.music.CMIDIData();
                    oCData.m_nStep = this.m_nStep;
                    oCData.m_eMMsg = nEv;
                    oCData.m_aryValue = [
                        nRaw,
                        this.m_oCParser.m_aryData[this.m_nPos + 0],
                        this.m_oCParser.m_aryData[this.m_nPos + 1]
                    ];
                    this.m_nPos += 2;
                }
                break;
            default:
                console.log("err std:" + nRaw);
                console.log(this.m_nPos);
                console.assert(false);
                break;
        }
        return (oCData);
    };
    CMusicParserSMF.prototype.decode_message_ev_met = function (nRaw) {
        var oCData = null;
        switch (nRaw) {
            case miz.music.E_MIDI_MSG.SYS_EX_F0:
                {
                    var nSize = this.decode_dvalue();
                    oCData = new miz.music.CMIDIData();
                    oCData.m_nStep = this.m_nStep;
                    oCData.m_aryValue = [0xF0];
                    oCData.m_eMMsg = nRaw;
                    for (var n = 0; n < nSize; n++) {
                        oCData.m_aryValue.push(this.m_oCParser.m_aryData[this.m_nPos + n]);
                    }
                    this.m_nPos += nSize;
                }
                break;
            case miz.music.E_MIDI_MSG.SYS_EX_F7:
                {
                    var nSize = this.decode_dvalue();
                    oCData = new miz.music.CMIDIData();
                    oCData.m_nStep = this.m_nStep;
                    oCData.m_aryValue = [];
                    oCData.m_eMMsg = nRaw;
                    for (var n = 0; n < nSize; n++) {
                        oCData.m_aryValue.push(this.m_oCParser.m_aryData[this.m_nPos + n]);
                    }
                    this.m_nPos += nSize;
                }
                break;
            case miz.music.E_MIDI_MSG.META_EVT:
                {
                    var nType = this.m_oCParser.m_aryData[this.m_nPos];
                    this.m_nPos += 1;
                    var nSize = this.decode_dvalue();
                    switch (nType) {
                        case 0x01:
                        case 0x02:
                        case 0x03:
                        case 0x04:
                        case 0x05:
                        case 0x06:
                        case 0x07:
                            {
                                var aryData = this.m_oCParser.m_aryData.subarray(this.m_nPos, this.m_nPos + nSize);
                                oCData = new miz.music.CMIDIData();
                                oCData.m_nStep = this.m_nStep;
                                oCData.m_eMMsg = nRaw;
                                oCData.m_eMEvt = nType;
                                oCData.m_strValue = Encoding.convert(aryData, {
                                    to: "UNICODE",
                                    type: "string"
                                });
                                if (nType == miz.music.E_META_EVT.TRACK_NAME) {
                                    if (this.m_strTitle == "") {
                                        console.log(oCData.m_eMEvt.toString(16) + " " + oCData.m_strValue);
                                        this.m_strTitle = oCData.m_strValue;
                                    }
                                }
                                this.m_nPos += nSize;
                            }
                            break;
                        case miz.music.E_META_EVT.END_OF_TRACK:
                            console.log("End of Track 0xFF" + " 0x" + nType.toString(16) + " " + nSize);
                            this.m_nPos += nSize;
                            break;
                        case miz.music.E_META_EVT.TEMPO:
                            {
                                var nTempo = 0;
                                nTempo |= this.m_oCParser.m_aryData[this.m_nPos + 0] << 16;
                                nTempo |= this.m_oCParser.m_aryData[this.m_nPos + 1] << 8;
                                nTempo |= this.m_oCParser.m_aryData[this.m_nPos + 2];
                                this.m_nPos += nSize;
                                oCData = new miz.music.CMIDIData();
                                oCData.m_nStep = this.m_nStep;
                                oCData.m_eMMsg = nRaw;
                                oCData.m_eMEvt = nType;
                                oCData.m_numValue = nTempo;
                            }
                            break;
                        default:
                            {
                                this.m_nPos += nSize;
                                oCData = new miz.music.CMIDIData();
                                oCData.m_nStep = this.m_nStep;
                                oCData.m_eMMsg = nRaw;
                                oCData.m_eMEvt = nType;
                            }
                            break;
                    }
                }
                break;
            default:
                console.log("err met:" + nRaw);
                console.log(this.m_nPos);
                console.assert(false);
                break;
        }
        return (oCData);
    };
    CMusicParserSMF.prototype.decode_message = function () {
        var nRaw = this.m_oCParser.m_aryData[this.m_nPos];
        var oCData = null;
        if (nRaw < 0x80) {
            if (this.m_nCurrentEv < 0xF0) {
                oCData = this.decode_message_ev_std(this.m_nCurrentEv);
            }
            else {
                oCData = this.decode_message_ev_met(this.m_nCurrentEv);
            }
        }
        else if (nRaw < 0xF0) {
            this.m_nPos += 1;
            this.m_nCurrentEv = nRaw;
            oCData = this.decode_message_ev_std(this.m_nCurrentEv);
        }
        else {
            this.m_nPos += 1;
            oCData = this.decode_message_ev_met(nRaw);
        }
        return (oCData);
    };
    CMusicParserSMF.prototype.parse_MThd = function () {
        var bResult = false;
        var strMThd = this.m_oCParser.extract_string(0, 4);
        if (strMThd == "MThd") {
            this.m_oCParser.extract_number(E_EXTRACT_TYPE.E_EXTRACT_TYPE_I32, 4);
            this.m_nFmt = this.m_oCParser.extract_number(E_EXTRACT_TYPE.E_EXTRACT_TYPE_U16, 8);
            this.m_nTrk = this.m_oCParser.extract_number(E_EXTRACT_TYPE.E_EXTRACT_TYPE_U16, 10);
            this.m_nTimeDiv = this.m_oCParser.extract_number(E_EXTRACT_TYPE.E_EXTRACT_TYPE_U16, 12);
            this.m_strTitle = "";
            bResult = true;
        }
        return (bResult);
    };
    CMusicParserSMF.prototype.parse_MTrk = function () {
        var oCMIDITrack = new miz.music.CMIDITrack();
        var oCData = null;
        this.m_oCParser.extract_string(this.m_nPos, 4);
        this.m_nPos += 4;
        var nTrackSize = this.m_oCParser.extract_number(E_EXTRACT_TYPE.E_EXTRACT_TYPE_I32, this.m_nPos);
        this.m_nPos += 4;
        var nCurrentPos = this.m_nPos;
        this.m_nStep = 0;
        while (true) {
            this.m_nStep = this.decode_dvalue();
            oCData = this.decode_message();
            if (oCData == null) {
                break;
            }
            oCMIDITrack.m_listData.push(oCData);
        }
        this.m_nPos = nCurrentPos + nTrackSize;
        return (oCMIDITrack);
    };
    CMusicParserSMF.prototype.parse = function () {
        var oCMIDIMusic = null;
        var oCMIDITrack = null;
        var nSize = this.m_oCParser.m_aryData.length;
        if (this.parse_MThd() == true) {
            this.m_nPos += 14;
            oCMIDIMusic = new miz.music.CMIDIMusic();
            for (var nTrack = 0; nTrack < this.m_nTrk; nTrack++) {
                this.m_nCurrentEv = null;
                oCMIDITrack = this.parse_MTrk();
                oCMIDIMusic.m_listTrack.push(oCMIDITrack);
            }
            oCMIDIMusic.m_nTimeDiv = this.m_nTimeDiv;
            oCMIDIMusic.m_strTitle = this.m_strTitle;
        }
        return (oCMIDIMusic);
    };
    return CMusicParserSMF;
})();
/*!
 */
var CMusicParser = (function () {
    function CMusicParser(raw) {
        this.m_raw = raw;
        this.m_aryData = new Uint8Array(raw);
    }
    CMusicParser.prototype.extract_number = function (eET, nPos) {
        var nValue = 0;
        switch (eET) {
            case E_EXTRACT_TYPE.E_EXTRACT_TYPE_I16_LE:
            case E_EXTRACT_TYPE.E_EXTRACT_TYPE_U16_LE:
                {
                    nValue |= this.m_aryData[nPos + 0];
                    nValue |= this.m_aryData[nPos + 1] << 8;
                    if (eET == E_EXTRACT_TYPE.E_EXTRACT_TYPE_I16_LE) {
                        if ((nValue & 0x1000) != 0) {
                            nValue -= 0x10000;
                        }
                    }
                }
                break;
            case E_EXTRACT_TYPE.E_EXTRACT_TYPE_I16:
            case E_EXTRACT_TYPE.E_EXTRACT_TYPE_U16:
                {
                    nValue |= this.m_aryData[nPos + 0] << 8;
                    nValue |= this.m_aryData[nPos + 1];
                    if (eET == E_EXTRACT_TYPE.E_EXTRACT_TYPE_I16) {
                        if ((nValue & 0x1000) != 0) {
                            nValue -= 0x10000;
                        }
                    }
                }
                break;
            case E_EXTRACT_TYPE.E_EXTRACT_TYPE_I32:
                {
                    nValue |= this.m_aryData[nPos + 0] << 24;
                    nValue |= this.m_aryData[nPos + 1] << 16;
                    nValue |= this.m_aryData[nPos + 2] << 8;
                    nValue |= this.m_aryData[nPos + 3];
                }
                break;
        }
        return (nValue);
    };
    CMusicParser.prototype.extract_string = function (nPos, nLen) {
        console.assert(nPos >= 0);
        console.assert(nLen >= 1);
        console.assert(nPos < this.m_aryData.length);
        console.assert((nPos + nLen) < this.m_aryData.length);
        var strBuffer = "";
        for (var n = nPos; n < (nPos + nLen); n++) {
            strBuffer += String.fromCharCode(this.m_aryData[n]);
        }
        return (strBuffer);
    };
    return CMusicParser;
})();
/*!
 */
function music_reader(raw) {
    var o = new CMusicParser(raw);
    var oCSMF = new CMusicParserSMF(o);
    var oCRCP = new CMusicParserRCP(o);
    var oCMIDIMusic = null;
    oCMIDIMusic = oCSMF.parse();
    if (oCMIDIMusic == null) {
        oCMIDIMusic = oCRCP.parse();
    }
    return (oCMIDIMusic);
}
