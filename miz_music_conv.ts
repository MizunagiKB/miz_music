// ===========================================================================
/*!
 * @brief MIDI Music
 * @author @MizunagiKB
 */
// -------------------------------------------------------------- reference(s)
/// <reference path="./miz_music.ts" />


// -------------------------------------------------------------- interface(s)
// ---------------------------------------------------------------- declare(s)
// ------------------------------------------------------------------- enum(s)
enum E_EXTRACT_TYPE
{
    E_EXTRACT_TYPE_I16,
    E_EXTRACT_TYPE_U16,
    E_EXTRACT_TYPE_I32
}

// ----------------------------------------------------------------- global(s)
// ------------------------------------------------------------------ class(s)
// ---------------------------------------------------------------------------
/*!
 */
class CMusicParserSMF
{
    m_oCParser: CMusicParser;
    m_nPos: number;
    m_nFmt: number;
    m_nTrk: number;
    m_nTimeDiv: number;
    m_strTitle: string;

    m_nStep: number;
    m_nCurrentEv: number;

    constructor(o: CMusicParser)
    {
        this.m_oCParser = o;
        this.m_nPos = 0;
    }

    decode_dvalue(): number
    {
        let nOffset: number = 0;
        let n = 0;
        let nDTime = 0;

        while(true)
        {
            n = this.m_oCParser.m_aryData[this.m_nPos];
            nDTime = nDTime << 7;
            nDTime |= (n & 0x7F);
            this.m_nPos += 1;

            if(n < 0x80)
            {
                break;
            }
        }

        return(nDTime);
    }

    decode_message_ev_std(nRaw: number): miz.music.CMIDIData
    {
        let nEv: number = nRaw & 0xF0;
        let oCData: miz.music.CMIDIData = null;

        switch(nEv)
        {
            // 0x80
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

        return(oCData);
    }

    decode_message_ev_met(nRaw: number): miz.music.CMIDIData
    {
        let oCData: miz.music.CMIDIData = null;

        switch(nRaw)
        {
            case miz.music.E_MIDI_MSG.SYS_EX_F0:
                {
                    let nSize: number = this.decode_dvalue();

                    oCData = new miz.music.CMIDIData();
                    oCData.m_nStep = this.m_nStep;

                    oCData.m_aryValue = [0xF0];

                    oCData.m_eMMsg = nRaw;
                    for(let n = 0; n < nSize; n ++)
                    {
                        oCData.m_aryValue.push(
                            this.m_oCParser.m_aryData[this.m_nPos + n]
                        );
                    }

                    this.m_nPos += nSize;
                }
                break;

            case miz.music.E_MIDI_MSG.SYS_EX_F7:
                {
                    let nSize: number = this.decode_dvalue();

                    oCData = new miz.music.CMIDIData();
                    oCData.m_nStep = this.m_nStep;

                    oCData.m_aryValue = [];

                    oCData.m_eMMsg = nRaw;
                    for(let n = 0; n < nSize; n ++)
                    {
                        oCData.m_aryValue.push(
                            this.m_oCParser.m_aryData[this.m_nPos + n]
                        );
                    }

                    this.m_nPos += nSize;
                }
                break;

            case miz.music.E_MIDI_MSG.META_EVT:
                {
                    let nType: number = this.m_oCParser.m_aryData[this.m_nPos];
                    this.m_nPos += 1;

                    let nSize: number = this.decode_dvalue();

                    switch(nType)
                    {
                        case 0x01:
                        case 0x02:
                        case 0x03:
                        case 0x04:
                        case 0x05:
                        case 0x06:
                        case 0x07:
                            {
                                let aryData = this.m_oCParser.m_aryData.subarray(this.m_nPos, this.m_nPos + nSize);

                                oCData = new miz.music.CMIDIData();
                                oCData.m_nStep = this.m_nStep;

                                oCData.m_eMMsg = nRaw;
                                oCData.m_eMEvt = nType;
                                oCData.m_strValue = Encoding.convert(
                                    aryData,
                                    {
                                        to: "UNICODE",
                                        type: "string"
                                    }
                                );

                                if(nType == miz.music.E_META_EVT.TRACK_NAME)
                                {
                                    if(this.m_strTitle == "")
                                    {
                                        console.log(oCData.m_eMEvt.toString(16) + " " + oCData.m_strValue);
                                        this.m_strTitle = oCData.m_strValue;
                                    }
                                }

                                this.m_nPos += nSize;
                            }
                            break;

                        // case 0x20: switch port
                        // case 0x21: switch channel
                        case miz.music.E_META_EVT.END_OF_TRACK:
                            console.log("End of Track 0xFF" + " 0x" + nType.toString(16) + " " + nSize);
                            this.m_nPos += nSize;
                            break;

                        case miz.music.E_META_EVT.TEMPO:
                            {
                                let nTempo: number = 0;
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

        return(oCData);
    }

    decode_message(): miz.music.CMIDIData
    {
        let nRaw: number = this.m_oCParser.m_aryData[this.m_nPos];
        let oCData: miz.music.CMIDIData = null;

        if(nRaw < 0x80)
        {
            if(this.m_nCurrentEv < 0xF0)
            {
                oCData = this.decode_message_ev_std(this.m_nCurrentEv);
            } else {
                oCData = this.decode_message_ev_met(this.m_nCurrentEv);
            }
        } else if(nRaw < 0xF0) {
            this.m_nPos += 1;
            this.m_nCurrentEv = nRaw;
            oCData = this.decode_message_ev_std(this.m_nCurrentEv);
        } else {
            this.m_nPos += 1;
            oCData = this.decode_message_ev_met(nRaw);
        }

        return(oCData);
    }



    parse_MThd(): boolean
    {
        let bResult: boolean = false;
        let strMThd: string = this.m_oCParser.extract_string(0, 4);

        if(strMThd == "MThd")
        {
            this.m_oCParser.extract_number(E_EXTRACT_TYPE.E_EXTRACT_TYPE_I32, 4);
            this.m_nFmt = this.m_oCParser.extract_number(E_EXTRACT_TYPE.E_EXTRACT_TYPE_U16, 8);
            this.m_nTrk = this.m_oCParser.extract_number(E_EXTRACT_TYPE.E_EXTRACT_TYPE_U16, 10);
            this.m_nTimeDiv = this.m_oCParser.extract_number(E_EXTRACT_TYPE.E_EXTRACT_TYPE_U16, 12);
            this.m_strTitle = ""

            bResult = true;
        }

        return(bResult);
    }

    parse_MTrk(): miz.music.CMIDITrack
    {
        let oCMIDITrack: miz.music.CMIDITrack = new miz.music.CMIDITrack();
        let oCData: miz.music.CMIDIData = null;

        this.m_oCParser.extract_string(this.m_nPos, 4);
        this.m_nPos += 4;

        let nTrackSize: number = this.m_oCParser.extract_number(E_EXTRACT_TYPE.E_EXTRACT_TYPE_I32, this.m_nPos);
        this.m_nPos += 4;

        let nCurrentPos: number = this.m_nPos;

        //
        this.m_nStep = 0;

        while(true)
        {
            this.m_nStep = this.decode_dvalue();

            oCData = this.decode_message();

            if(oCData == null)
            {
                break;
            }

            oCMIDITrack.m_listData.push(oCData);
        }

        this.m_nPos = nCurrentPos + nTrackSize;

        return(oCMIDITrack);
    }

    parse(): miz.music.CMIDIMusic
    {
        let oCMIDIMusic: miz.music.CMIDIMusic = null;
        let oCMIDITrack: miz.music.CMIDITrack = null;
        let nSize = this.m_oCParser.m_aryData.length;

        // parse MThd

        if(this.parse_MThd() == true)
        {
            this.m_nPos += 14;

            oCMIDIMusic = new miz.music.CMIDIMusic();

            for(let nTrack: number = 0; nTrack < this.m_nTrk; nTrack ++)
            {
                this.m_nCurrentEv = null;
                oCMIDITrack = this.parse_MTrk();

                oCMIDIMusic.m_listTrack.push(oCMIDITrack);
            }

            oCMIDIMusic.m_nTimeDiv = this.m_nTimeDiv;
            oCMIDIMusic.m_strTitle = this.m_strTitle;
        }

        // console.log("m_nTimeDiv: " + oCMIDIMusic.m_nTimeDiv);
        // console.log("m_strTitle: " + oCMIDIMusic.m_strTitle);
        // console.log("nSize: " + nSize);
        // console.log("nPos:  " + this.m_nPos);

        return(oCMIDIMusic);
    }
}

// ---------------------------------------------------------------------------
/*!
 */
class CMusicParser
{
    m_raw: ArrayBuffer;
    m_aryData: Uint8Array;

    constructor(raw:ArrayBuffer)
    {
        this.m_raw = raw;
        this.m_aryData = new Uint8Array(raw);
    }

    extract_number(eET: E_EXTRACT_TYPE, nPos: number): number
    {
        let nValue: number = 0;

        switch(eET)
        {
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

    //oCSMF.parse();

    return(oCSMF.parse());
}


// --------------------------------------------------------------------- [EOF]
