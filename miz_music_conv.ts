// ===========================================================================
/*!
 * @brief MIDI Music
 * @author @MizunagiKB
 */
// -------------------------------------------------------------- reference(s)
/// <reference path="./miz_music.ts" />
/// <reference path="./miz_music_conv_smf.ts" />
/// <reference path="./miz_music_conv_rcp.ts" />


// -------------------------------------------------------------- interface(s)
// ---------------------------------------------------------------- declare(s)
// ------------------------------------------------------------------- enum(s)
enum E_EXTRACT_TYPE
{
    E_EXTRACT_TYPE_I16_LE,
    E_EXTRACT_TYPE_U16_LE,
    E_EXTRACT_TYPE_I16,
    E_EXTRACT_TYPE_U16,
    E_EXTRACT_TYPE_I32
}

// ----------------------------------------------------------------- global(s)
// ------------------------------------------------------------------ class(s)
// ---------------------------------------------------------------------------
/*!
 */
class CMusicParser
{
    m_aryData: Uint8Array;

    constructor(raw: ArrayBuffer)
    {
        this.m_aryData = new Uint8Array(raw);
    }

    extract_number(eET: E_EXTRACT_TYPE, nPos: number): number
    {
        let nValue: number = 0;

        switch(eET)
        {
            case E_EXTRACT_TYPE.E_EXTRACT_TYPE_I16_LE:
            case E_EXTRACT_TYPE.E_EXTRACT_TYPE_U16_LE:
                {
                    nValue |= this.m_aryData[nPos + 0];
                    nValue |= this.m_aryData[nPos + 1] << 8;

                    if(eET == E_EXTRACT_TYPE.E_EXTRACT_TYPE_I16_LE)
                    {
                        if((nValue & 0x1000) != 0)
                        {
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

                    if(eET == E_EXTRACT_TYPE.E_EXTRACT_TYPE_I16)
                    {
                        if((nValue & 0x1000) != 0)
                        {
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

        return(nValue);
    }

    // 文字列情報の取得
    extract_string(nPos: number, nLen: number): string
    {
        console.assert(nPos >= 0);
        console.assert(nLen >= 1);
        //

        console.assert(nPos < this.m_aryData.length);
        console.assert((nPos + nLen) < this.m_aryData.length);

        let strBuffer: string = "";

        for(let n: number = nPos; n < (nPos + nLen); n ++)
        {
            strBuffer += String.fromCharCode(this.m_aryData[n]);
        }

        return(strBuffer);
    }
}


// --------------------------------------------------------------- function(s)
// ===========================================================================
/*!
 */
function music_reader(raw: ArrayBuffer): miz.music.CMIDIMusic
{
    var o: CMusicParser = new CMusicParser(raw);

    var oCSMF: CMusicParserSMF = new CMusicParserSMF(o);
    var oCRCP: CMusicParserRCP = new CMusicParserRCP(o);
    var oCMIDIMusic: miz.music.CMIDIMusic = null;

    oCMIDIMusic = oCSMF.parse();

    if(oCMIDIMusic == null)
    {
        oCMIDIMusic = oCRCP.parse();
    }

    return(oCMIDIMusic);
}


// --------------------------------------------------------------------- [EOF]
