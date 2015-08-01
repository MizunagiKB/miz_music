// ===========================================================================
/*!
 * @brief MIDI Music
 * @author @MizunagiKB
 */
// -------------------------------------------------------------- reference(s)
/// <reference path="./miz_music.ts" />
var E_EXTRACT_TYPE;
(function (E_EXTRACT_TYPE) {
    E_EXTRACT_TYPE[E_EXTRACT_TYPE["E_EXTRACT_TYPE_I16"] = 0] = "E_EXTRACT_TYPE_I16";
    E_EXTRACT_TYPE[E_EXTRACT_TYPE["E_EXTRACT_TYPE_U16"] = 1] = "E_EXTRACT_TYPE_U16";
    E_EXTRACT_TYPE[E_EXTRACT_TYPE["E_EXTRACT_TYPE_I32"] = 2] = "E_EXTRACT_TYPE_I32";
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
            case 0x80:
            case 0x90:
            case 0xA0:
            case 0xB0:
                {
                    oCData = new miz.music.CMIDIData();
                    oCData.m_nStep = this.m_nStep;
                    oCData.m_nTempo = 0;
                    oCData.m_midiData = [
                        nRaw,
                        this.m_oCParser.m_aryData[this.m_nPos + 0],
                        this.m_oCParser.m_aryData[this.m_nPos + 1]
                    ];
                    if (this.m_oCParser.m_aryData[this.m_nPos + 1] > 0x7F) {
                        console.log(this.m_nPos);
                        for (var p = 0; p < 16; p++) {
                            console.log(this.m_oCParser.m_aryData[this.m_nPos + p].toString(16));
                        }
                        console.assert(false);
                        var x = 32 / 0;
                    }
                    this.m_nPos += 2;
                }
                break;
            case 0xC0:
            case 0xD0:
                {
                    oCData = new miz.music.CMIDIData();
                    oCData.m_nStep = this.m_nStep;
                    oCData.m_nTempo = 0;
                    oCData.m_midiData = [
                        nRaw,
                        this.m_oCParser.m_aryData[this.m_nPos + 0]
                    ];
                    this.m_nPos += 1;
                }
                break;
            case 0xE0:
                {
                    oCData = new miz.music.CMIDIData();
                    oCData.m_nStep = this.m_nStep;
                    oCData.m_nTempo = 0;
                    oCData.m_midiData = [
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
            case 0xF0:
                {
                    var nSize = this.decode_dvalue();
                    oCData = new miz.music.CMIDIData();
                    oCData.m_nStep = this.m_nStep;
                    oCData.m_nTempo = 0;
                    oCData.m_midiData = [0xF0];
                    for (var n = 0; n < nSize; n++) {
                        oCData.m_midiData.push(this.m_oCParser.m_aryData[this.m_nPos + n]);
                    }
                    this.m_nPos += nSize;
                }
                break;
            case 0xF7:
                {
                    var nSize = this.decode_dvalue();
                    oCData = new miz.music.CMIDIData();
                    oCData.m_nStep = this.m_nStep;
                    oCData.m_nTempo = 0;
                    oCData.m_midiData = [];
                    for (var n = 0; n < nSize; n++) {
                        oCData.m_midiData.push(this.m_oCParser.m_aryData[this.m_nPos + n]);
                    }
                    this.m_nPos += nSize;
                }
                break;
            case 0xFF:
                {
                    var nType = this.m_oCParser.m_aryData[this.m_nPos];
                    this.m_nPos += 1;
                    var nSize = this.decode_dvalue();
                    switch (nType) {
                        case 0x2F:
                            console.log("End of Track 0xFF" + " 0x" + nType.toString(16) + " " + nSize);
                            this.m_nPos += nSize;
                            break;
                        case 0x51:
                            var nTempo = 0;
                            nTempo |= this.m_oCParser.m_aryData[this.m_nPos + 0] << 16;
                            nTempo |= this.m_oCParser.m_aryData[this.m_nPos + 1] << 8;
                            nTempo |= this.m_oCParser.m_aryData[this.m_nPos + 2];
                            console.log("Tempo            " + nTempo);
                            console.log("TimeDiv          " + this.m_nTimeDiv);
                            this.m_nPos += nSize;
                            oCData = new miz.music.CMIDIData();
                            oCData.m_nStep = this.m_nStep;
                            oCData.m_nTempo = nTempo;
                            break;
                        default:
                            this.m_nPos += nSize;
                            oCData = new miz.music.CMIDIData();
                            oCData.m_nStep = this.m_nStep;
                            oCData.m_nTempo = 0;
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
        this.m_oCParser.extract_string(0, 4);
        this.m_oCParser.extract_number(E_EXTRACT_TYPE.E_EXTRACT_TYPE_I32, 4);
        this.m_nFmt = this.m_oCParser.extract_number(E_EXTRACT_TYPE.E_EXTRACT_TYPE_U16, 8);
        this.m_nTrk = this.m_oCParser.extract_number(E_EXTRACT_TYPE.E_EXTRACT_TYPE_U16, 10);
        this.m_nTimeDiv = this.m_oCParser.extract_number(E_EXTRACT_TYPE.E_EXTRACT_TYPE_U16, 12);
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
        var oCMIDIMusic = new miz.music.CMIDIMusic;
        var oCMIDITrack = null;
        var nSize = this.m_oCParser.m_aryData.length;
        this.parse_MThd();
        this.m_nPos += 14;
        oCMIDIMusic.m_nTimeDiv = this.m_nTimeDiv;
        console.log("n " + this.m_nTrk);
        for (var nTrack = 0; nTrack < this.m_nTrk; nTrack++) {
            this.m_nCurrentEv = null;
            oCMIDITrack = this.parse_MTrk();
            oCMIDIMusic.m_listTrack.push(oCMIDITrack);
        }
        console.log("nSize: " + nSize);
        console.log("nPos:  " + this.m_nPos);
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
    return (oCSMF.parse());
}
