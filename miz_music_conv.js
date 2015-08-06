// ===========================================================================
/*!
 * @brief MIDI Music
 * @author @MizunagiKB
 */
// -------------------------------------------------------------- reference(s)
/// <reference path="./miz_music.ts" />
/// <reference path="./miz_music_conv_smf.ts" />
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
var CMusicParser = (function () {
    function CMusicParser(raw) {
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
