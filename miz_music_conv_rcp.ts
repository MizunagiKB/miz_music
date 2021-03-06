// ===========================================================================
/*!
 * @brief MIDI Music
 * @author @MizunagiKB
 */
// -------------------------------------------------------------- reference(s)
/// <reference path="./miz_music.ts" />
/// <reference path="./miz_music_conv.ts" />


// -------------------------------------------------------------- interface(s)
// ---------------------------------------------------------------- declare(s)
// ------------------------------------------------------------------- enum(s)
// ----------------------------------------------------------------- global(s)
// ------------------------------------------------------------------ class(s)
class CExc
{
    public m_oRCPStep: CRCPStep = null;
    public m_aryData: Array<number> = [];

    public m_nStep: number = 0;
    public m_nSequence: number = 0;
    public m_nCh: number = 0;
    public m_nGate: number = 0;
    public m_nVelo: number = 0;

    constructor(oCTWork: CRCPTrackWork = null, nGate: number = 0, nVelo: number = 0)
    {
        this.set_param(oCTWork, nGate, nVelo);
    }

    public set_param(oCTWork: CRCPTrackWork, nGate: number, nVelo: number): void
    {
        if(oCTWork != null)
        {
            this.m_nCh = oCTWork.m_nCh;
            this.m_nStep = oCTWork.m_nStepTotal;
            this.m_nSequence = oCTWork.m_nSequence;
        }

        this.m_nGate = nGate;
        this.m_nVelo = nVelo;
    }

    public build(): CRCPStep
    {
        let nCheckSum: number = 0;
        let aryResult: Array<number> = [];
        let oCRCPStep: CRCPStep = null;

        for (let i: number = 0; i < this.m_aryData.length; i ++)
        {
            let nValue: number = this.m_aryData[i];

            if (nValue == 0xF7)
            {
                let nSize: number = aryResult.length + 1;

                aryResult.push(0xF7);
                aryResult.unshift(0xF0);

                break;
            }

            switch (nValue)
            {
                // Gate
                case 0x80:
                    aryResult.push(this.m_nGate);
                    nCheckSum += this.m_nGate;
                    break;

                // Velo
                case 0x81:
                    aryResult.push(this.m_nVelo);
                    nCheckSum += this.m_nVelo;
                    break;

                // Channel
                case 0x82:
                    aryResult.push(this.m_nCh);
                    nCheckSum += this.m_nCh;
                    break;

                case 0x83:
                    nCheckSum = 0;
                    break;

                case 0x84:
                    aryResult.push(0x80 - (nCheckSum & 0x7F));
                    break;

                default:
                    aryResult.push(nValue);
                    nCheckSum += nValue;
                    break;
            }
        }

        oCRCPStep = new CRCPStep();
        oCRCPStep.m_nStep = this.m_nStep;
        oCRCPStep.m_nSequence = this.m_nSequence;

        oCRCPStep.m_oCMIDIData = new miz.music.CMIDIData();
        oCRCPStep.m_oCMIDIData.m_eMMsg = miz.music.E_MIDI_MSG.SYS_EX_F0;
        oCRCPStep.m_oCMIDIData.m_eMEvt = 0;
        oCRCPStep.m_oCMIDIData.m_aryValue = aryResult;

        return(oCRCPStep);
    }
}


class CExcRoland extends CExc
{
    public m_nDevice: number = 0;
    public m_nModel: number = 0;
    public m_nBaseAddr1: number = 0;
    public m_nBaseAddr2: number = 0;
    public m_nOffset: number = 0;
    public m_nParam: number = 0;

    public build(): CRCPStep
    {
        this.m_aryData = [];

        this.m_aryData.push(0x41);
        this.m_aryData.push(this.m_nDevice);
        this.m_aryData.push(this.m_nModel);
        this.m_aryData.push(0x12);
        this.m_aryData.push(0x83);
        this.m_aryData.push(this.m_nBaseAddr1);
        this.m_aryData.push(this.m_nBaseAddr2);
        this.m_aryData.push(this.m_nOffset);
        this.m_aryData.push(this.m_nParam);
        this.m_aryData.push(0x84);
        this.m_aryData.push(0xF7);

        return(super.build());
    }
}


// ---------------------------------------------------------------------------
/*!
 */
class CRCPTrackWork
{
    public m_nCh: number = 0;
    public m_nTrackSize: number = 0;
    public m_nTrackAddr: number = 0;
    public m_nStepTotal: number = 0;
    public m_nStepBreak: number = 0;
    public m_nSequence: number = 0;
    public m_nPos: number = 0;

    public create_copy(): CRCPTrackWork
    {
        let oCResult: CRCPTrackWork = new CRCPTrackWork();

        oCResult.m_nCh = this.m_nCh;
        oCResult.m_nTrackSize = this.m_nTrackSize;
        oCResult.m_nTrackAddr = this.m_nTrackAddr;
        oCResult.m_nStepTotal = this.m_nStepTotal;
        oCResult.m_nStepBreak = this.m_nStepBreak;
        oCResult.m_nSequence = this.m_nSequence;
        oCResult.m_nPos = this.m_nPos;

        return(oCResult);
    }
}


// ---------------------------------------------------------------------------
/*!
 */
class CRCPStep
{
    public m_nStep: number = 0;
    public m_nSequence: number = 0;
    public m_oCMIDIData: miz.music.CMIDIData = null;

    public ary_print(): void
    {
        let strResult: string = "";

        for (let i = 0; i < this.m_oCMIDIData.m_aryValue.length; i++)
        {
            strResult += (" " + this.m_oCMIDIData.m_aryValue[i].toString(16));
        }
    }
}

// ---------------------------------------------------------------------------
/*!
 */
class CRCPLoop
{
    public m_nPos: number = 0;
    public m_nCount: number = 0;
}

// ---------------------------------------------------------------------------
/*!
 */
class CMusicParserRCP
{
    m_oCParser: CMusicParser;
    m_listCExc: Array<CExc> = [];
    m_nPos: number = 0;
    m_nTrk: number;
    m_nTimeDiv: number;
    m_nTempo: number;
    m_nBeat_Nume: number;
    m_nBeat_Deno: number;
    m_nStepBlock: number;
    m_nKey: number;
    m_nBias: number;

    m_strTitle: string;

    constructor(o: CMusicParser)
    {
        this.m_oCParser = o;
        this.m_nPos = 0;
    }

    convert_track(listCRCPStep: Array<CRCPStep>): miz.music.CMIDITrack
    {
        let oCMIDITrack: miz.music.CMIDITrack = new miz.music.CMIDITrack();
        let nStepCurr: number = 0;
        let listNote: Array<number> = [];

        for(let n = 0; n < 0x80; n ++)
        {
            listNote.push(0);
        }

        for(let n = 0; n < listCRCPStep.length; n ++)
        {
            let oCRCPStep: CRCPStep = listCRCPStep[n];

            switch(oCRCPStep.m_oCMIDIData.m_eMMsg)
            {
                case miz.music.E_MIDI_MSG.NOTE_ON:
                    {
                        let nNote: number = oCRCPStep.m_oCMIDIData.m_aryValue[1];
                        let nVelo: number = oCRCPStep.m_oCMIDIData.m_aryValue[2];

                        if(nVelo == 0)
                        {
                            if(listNote[nNote] == 1)
                            {
                                let oCMIDIData: miz.music.CMIDIData = oCRCPStep.m_oCMIDIData;

                                oCMIDIData.m_nStep = oCRCPStep.m_nStep - nStepCurr;
                                oCMIDITrack.m_listData.push(oCMIDIData);

                                if(oCRCPStep.m_nStep > nStepCurr)
                                {
                                    nStepCurr = oCRCPStep.m_nStep;
                                }
                            }

                            // console.assert(listNote[nNote] > 0);
                            listNote[nNote] -= 1;

                        } else {

                            if(listNote[nNote] == 0)
                            {
                                let oCMIDIData: miz.music.CMIDIData = oCRCPStep.m_oCMIDIData;

                                oCMIDIData.m_nStep = oCRCPStep.m_nStep - nStepCurr;
                                oCMIDITrack.m_listData.push(oCMIDIData);

                                if(oCRCPStep.m_nStep > nStepCurr)
                                {
                                    nStepCurr = oCRCPStep.m_nStep;
                                }
                            }

                            listNote[nNote] += 1;
                        }
                    }
                    break;

                default:
                    {
                        let oCMIDIData: miz.music.CMIDIData = oCRCPStep.m_oCMIDIData;

                        oCMIDIData.m_nStep = oCRCPStep.m_nStep - nStepCurr;
                        oCMIDITrack.m_listData.push(oCMIDIData);

                        if(oCRCPStep.m_nStep > nStepCurr)
                        {
                            nStepCurr = oCRCPStep.m_nStep;
                        }
                    }
                    break;
            }

        }

        return(oCMIDITrack);
    }

    build_num(oCTWork: CRCPTrackWork, eMMsg: miz.music.E_MIDI_MSG, eMEvt: miz.music.E_META_EVT, numValue: number): CRCPStep
    {
        let oCRCPStep = null;
        let oCMIDIData = null;

        oCMIDIData = new miz.music.CMIDIData();
        oCMIDIData.m_nStep = 0;
        oCMIDIData.m_eMMsg = eMMsg;
        oCMIDIData.m_eMEvt = eMEvt;
        oCMIDIData.m_numValue = numValue;

        oCRCPStep = new CRCPStep();
        oCRCPStep.m_nStep = oCTWork.m_nStepTotal;
        oCRCPStep.m_nSequence = oCTWork.m_nSequence;
        oCRCPStep.m_oCMIDIData = oCMIDIData;

        oCTWork.m_nSequence ++;

        return(oCRCPStep);
    }

    build_array(oCTWork: CRCPTrackWork, eMMsg: miz.music.E_MIDI_MSG, eMEvt: miz.music.E_META_EVT, aryValue: Array<number>): CRCPStep
    {
        let oCRCPStep = null;
        let oCMIDIData = null;

        oCMIDIData = new miz.music.CMIDIData();
        oCMIDIData.m_nStep = 0;
        oCMIDIData.m_eMMsg = eMMsg;
        oCMIDIData.m_eMEvt = eMEvt;
        oCMIDIData.m_aryValue = aryValue;

        oCRCPStep = new CRCPStep();
        oCRCPStep.m_nStep = oCTWork.m_nStepTotal;
        oCRCPStep.m_nSequence = oCTWork.m_nSequence;
        oCRCPStep.m_oCMIDIData = oCMIDIData;

        oCTWork.m_nSequence ++;

        return(oCRCPStep);
    }

    build_note(oCTWork: CRCPTrackWork, nNote: number, nGate: number, nVelo: number): Array<CRCPStep>
    {
        let listCRCPStep: Array<CRCPStep> = [];
        let oCRCPStep: CRCPStep = null;
        let oCMIDIData: miz.music.CMIDIData = null;

        if(nGate > 0)
        {
            let oCRCPStep: CRCPStep = null;

            // KON
            oCRCPStep = this.build_array(
                oCTWork,
                miz.music.E_MIDI_MSG.NOTE_ON,
                0,
                [0x90 + oCTWork.m_nCh, nNote, nVelo]
            );

            oCRCPStep.m_nStep = oCTWork.m_nStepTotal;
            listCRCPStep.push(
                oCRCPStep
            );

            // KOF
            oCRCPStep = this.build_array(
                oCTWork,
                miz.music.E_MIDI_MSG.NOTE_ON,
                0,
                [0x90 + oCTWork.m_nCh, nNote, 0x00]
            );

            oCRCPStep.m_nStep = oCTWork.m_nStepTotal + nGate;
            listCRCPStep.push(
                oCRCPStep
            );
        }

        return(listCRCPStep);
    }

    // -----------------------------------------------------------------------
    /*!
     */
    copy_event(_oCTWork: CRCPTrackWork, nMeasure: number, nOffsetAddr: number): Array<CRCPStep>
    {
        let listCRCPStep: Array<CRCPStep> = [];
        let oCTWork: CRCPTrackWork = _oCTWork.create_copy();

        // 44Bytes = TrackHead
        oCTWork.m_nPos = nOffsetAddr - 44;
        oCTWork.m_nStepBreak = oCTWork.m_nStepTotal + this.m_nStepBlock;

        listCRCPStep = this.make_event(oCTWork, true);

        _oCTWork.m_nStepTotal = oCTWork.m_nStepTotal;
        _oCTWork.m_nSequence = oCTWork.m_nSequence;

        return(listCRCPStep);
    }

    // -----------------------------------------------------------------------
    /*!
     */
    make_event(oCTWork: CRCPTrackWork, bCopyMeasure: boolean): Array<CRCPStep>
    {
        let listCRCPStep: Array<CRCPStep> = [];
        let listLoopStack: Array<CRCPLoop> = [];
        let n: number = oCTWork.m_nPos;
        let bMeasureEnd: boolean = false;
//        let oCRCPExc: CRCPStep = null;
        let oCExc: any = null;
        let nEXCGate: number = 0;
        let nEXCVelo: number = 0;
        let nEXCCSum: number = 0;


        while(n < oCTWork.m_nTrackSize)
        {
            let nAddr: number = n + oCTWork.m_nTrackAddr;
            let nStep: number = 0;
            let nEv: number = this.m_oCParser.m_aryData[nAddr + 0];

            if(nEv < 0x80)
            {
                array_append(
                    listCRCPStep,
                    this.build_note(
                        oCTWork,
                        this.m_oCParser.m_aryData[nAddr + 0],
                        this.m_oCParser.m_aryData[nAddr + 2],
                        this.m_oCParser.m_aryData[nAddr + 3]
                    )
                );

                nStep = this.m_oCParser.m_aryData[nAddr + 1];

            } else {

                switch(nEv)
                {
                    case 0x90:
                    case 0x91:
                    case 0x92:
                    case 0x93:
                    case 0x94:
                    case 0x95:
                    case 0x96:
                    case 0x97:
                        {
                            let o: CExc = this.m_listCExc[nEv - 0x90];

                            o.set_param(
                                oCTWork,
                                this.m_oCParser.m_aryData[nAddr + 2],
                                this.m_oCParser.m_aryData[nAddr + 3]
                            );

                            //o.build().ary_print();
                            listCRCPStep.push(
                                o.build()
                            );

                            nStep = this.m_oCParser.m_aryData[nAddr + 1];
                        }
                        break;

                    case 0x98:
                        {
                            /*
                            console.assert(oCRCPExc == null);
                            console.log(
                                ""
                                + " " + this.m_oCParser.m_aryData[nAddr + 0].toString()
                                + " " + this.m_oCParser.m_aryData[nAddr + 1].toString()
                                + " " + this.m_oCParser.m_aryData[nAddr + 2].toString()
                                + " " + this.m_oCParser.m_aryData[nAddr + 3].toString()
                            );
                             */

                            oCExc = new CExc(
                                oCTWork,
                                this.m_oCParser.m_aryData[nAddr + 2],
                                this.m_oCParser.m_aryData[nAddr + 3]
                            );

                            nStep = this.m_oCParser.m_aryData[nAddr + 1];
                        }
                        break;

                    case 0x99:
                        nStep = 0;
                        break;

                    case 0xDD:
                        {
                            let o: CExcRoland = oCExc;

                            console.assert(oCExc != null);

                            o.m_nBaseAddr1 = this.m_oCParser.m_aryData[nAddr + 2];
                            o.m_nBaseAddr2 = this.m_oCParser.m_aryData[nAddr + 3];

                            nStep = this.m_oCParser.m_aryData[nAddr + 1];
                        }
                        break;

                    case 0xDE:
                        {
                            let o: CExcRoland = oCExc;

                            console.assert(oCExc != null);

                            o.m_nOffset = this.m_oCParser.m_aryData[nAddr + 2];
                            o.m_nParam = this.m_oCParser.m_aryData[nAddr + 3];

                            o.set_param(
                                oCTWork,
                                this.m_oCParser.m_aryData[nAddr + 2],
                                this.m_oCParser.m_aryData[nAddr + 3]
                            );

                            // o.build().ary_print();
                            listCRCPStep.push(
                                o.build()
                            );

                            nStep = this.m_oCParser.m_aryData[nAddr + 1];
                        }
                        break;

                    case 0xDF:
                        {
                            let o: CExcRoland = new CExcRoland(
                                oCTWork,
                                this.m_oCParser.m_aryData[nAddr + 2],
                                this.m_oCParser.m_aryData[nAddr + 3]
                            );

                            o.m_nDevice = this.m_oCParser.m_aryData[nAddr + 2];
                            o.m_nModel = this.m_oCParser.m_aryData[nAddr + 3];

                            oCExc = o;

                            nStep = this.m_oCParser.m_aryData[nAddr + 1];
                        }
                        break;

                    case 0xE2:
                        {
                            let oCMIDIData = null;
                            let oCRCPStep = null;

                            // BANK MSB
                            listCRCPStep.push(
                                this.build_array(
                                    oCTWork,
                                    miz.music.E_MIDI_MSG.CONTROL_CHANGE,
                                    0,
                                    [
                                        0xB0 + oCTWork.m_nCh,
                                        0x00,
                                        this.m_oCParser.m_aryData[nAddr + 3]
                                    ]
                                )
                            );

                            // BANK LSB
                            listCRCPStep.push(
                                this.build_array(
                                    oCTWork,
                                    miz.music.E_MIDI_MSG.CONTROL_CHANGE,
                                    0,
                                    [
                                        0xB0 + oCTWork.m_nCh,
                                        0x20,
                                        0
                                    ]
                                )
                            );

                            // Program Change
                            listCRCPStep.push(
                                this.build_array(
                                    oCTWork,
                                    miz.music.E_MIDI_MSG.PROGRAM_CHANGE,
                                    0,
                                    [
                                        0xC0 + oCTWork.m_nCh,
                                        this.m_oCParser.m_aryData[nAddr + 2]
                                    ]
                                )
                            );

                            nStep = this.m_oCParser.m_aryData[nAddr + 1];
                        }
                        break;

                    // TEMPO
                    case 0xE7:
                        {
                            let nTempo = (this.m_nTempo * this.m_oCParser.m_aryData[nAddr + 2]) / 64.0;

                            listCRCPStep.push(
                                this.build_num(
                                    oCTWork,
                                    miz.music.E_MIDI_MSG.META_EVT,
                                    miz.music.E_META_EVT.TEMPO,
                                    Math.floor(60000000 / nTempo)
                                )
                            );

                            nStep = this.m_oCParser.m_aryData[nAddr + 1];
                        }
                        break;

                    case 0xEA:
                        {
                            listCRCPStep.push(
                                this.build_array(
                                    oCTWork,
                                    miz.music.E_MIDI_MSG.C_AFTER_TOUCH,
                                    0,
                                    [
                                        0xD0 + oCTWork.m_nCh,
                                        this.m_oCParser.m_aryData[nAddr + 2]
                                    ]
                                )
                            );

                            nStep = this.m_oCParser.m_aryData[nAddr + 1];
                        }
                        break;

                    case 0xEB:
                        {
                            listCRCPStep.push(
                                this.build_array(
                                    oCTWork,
                                    miz.music.E_MIDI_MSG.CONTROL_CHANGE,
                                    0,
                                    [
                                        0xB0 + oCTWork.m_nCh,
                                        this.m_oCParser.m_aryData[nAddr + 2],
                                        this.m_oCParser.m_aryData[nAddr + 3]
                                    ]
                                )
                            );

                            nStep = this.m_oCParser.m_aryData[nAddr + 1];
                        }
                        break;

                    case 0xEC:
                        {
                            listCRCPStep.push(
                                this.build_array(
                                    oCTWork,
                                    miz.music.E_MIDI_MSG.PROGRAM_CHANGE,
                                    0,
                                    [
                                        0xC0 + oCTWork.m_nCh,
                                        this.m_oCParser.m_aryData[nAddr + 2]
                                    ]
                                )
                            );

                            nStep = this.m_oCParser.m_aryData[nAddr + 1];
                        }
                        break;

                    case 0xED:
                        {
                            listCRCPStep.push(
                                this.build_array(
                                    oCTWork,
                                    miz.music.E_MIDI_MSG.P_AFTER_TOUCH,
                                    0,
                                    [
                                        0xA0 + oCTWork.m_nCh,
                                        this.m_oCParser.m_aryData[nAddr + 2],
                                        this.m_oCParser.m_aryData[nAddr + 3]
                                    ]
                                )
                            );

                            nStep = this.m_oCParser.m_aryData[nAddr + 1];
                        }
                        break;

                    case 0xEE:
                        {
                            let oCMIDIData = null;
                            let oCRCPStep = null;

                            // Pitch
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

                            oCTWork.m_nSequence ++;

                            listCRCPStep.push(oCRCPStep);

                            nStep = this.m_oCParser.m_aryData[nAddr + 1];
                        }
                        break;

                    case 0xF5:
                        nStep = 0;
                        break;

                    case 0xF6:
                        nStep = 0;
                        break;

                    case 0xF7:
                        {
                            if (oCExc != null)
                            {
                                for (let i: number = 2; i < 4; i ++)
                                {
                                    let nValue: number = this.m_oCParser.m_aryData[nAddr + i];

                                    oCExc.m_aryData.push(nValue);

                                    if (nValue == 0xF7)
                                    {
                                        //oCExc.build().ary_print();
                                        listCRCPStep.push(
                                            oCExc.build()
                                        );

                                        oCExc = null;
                                        break;
                                    }
                                }
                            }

                            nStep = 0;
                        }
                        break;

                    case 0xF8:
                        {
                            let oCLoop: CRCPLoop = listLoopStack.pop();

                            if(oCLoop.m_nCount == null)
                            {
                                let nCount: number = this.m_oCParser.m_aryData[nAddr + 1];

                                if(nCount == 0)
                                {
                                    oCLoop.m_nCount = 2;
                                } else {
                                    oCLoop.m_nCount = this.m_oCParser.m_aryData[nAddr + 1];
                                }
                            } else {
                                oCLoop.m_nCount -= 1;
                            }

                            if(oCLoop.m_nCount > 1)
                            {
                                n = oCLoop.m_nPos;
                                listLoopStack.push(oCLoop);
                            }

                            nStep = 0;
                        }
                        break;

                    case 0xF9:
                        {
                            let oCLoop: CRCPLoop = new CRCPLoop();

                            oCLoop.m_nPos = n;
                            oCLoop.m_nCount = null;

                            listLoopStack.push(oCLoop);

                            nStep = 0;
                        }
                        break;

                    case 0xFC:
                        {
                            let nMe: number = 0;
                            let nOf: number = 0;

                            nMe |= this.m_oCParser.m_aryData[nAddr + 1];
                            nMe |= (this.m_oCParser.m_aryData[nAddr + 2] & 0x03) << 8;

                            nOf |= this.m_oCParser.m_aryData[nAddr + 3] << 8;
                            nOf |= (this.m_oCParser.m_aryData[nAddr + 2] & 0xFC);

                            // console.assert(bCopyMeasure != true);
                            /*
                            console.log(
                                ""
                                + " " + this.m_oCParser.m_aryData[nAddr + 0].toString()
                                + " " + this.m_oCParser.m_aryData[nAddr + 1].toString()
                                + " " + this.m_oCParser.m_aryData[nAddr + 2].toString()
                                + " " + this.m_oCParser.m_aryData[nAddr + 3].toString()
                                + " " + nOf.toString()
                            );
                             */

                            listCRCPStep = array_append(
                                listCRCPStep,
                                this.copy_event(oCTWork, nMe, nOf)
                            )

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
                            /*
                            console.log(
                                ""
                                + " " + this.m_oCParser.m_aryData[nAddr + 0].toString()
                                + " " + this.m_oCParser.m_aryData[nAddr + 1].toString()
                                + " " + this.m_oCParser.m_aryData[nAddr + 2].toString()
                                + " " + this.m_oCParser.m_aryData[nAddr + 3].toString()
                            );
                             */

                            nStep = this.m_oCParser.m_aryData[nAddr + 1];
                        }
                        break;
                }
            }


            n += 4;
            oCTWork.m_nStepTotal += nStep;

            if(bCopyMeasure == true && bMeasureEnd == true)
            {
                break;
            }
        }

        return(listCRCPStep);
    }

    // -----------------------------------------------------------------------
    /*!
     */
    parse_track(nCh: number, nStep: number, nTrackSize: number): miz.music.CMIDITrack
    {
        let oCRCPStep: CRCPStep = null;
        let listCRCPStep: Array<CRCPStep> = [];
        let oCTWork: CRCPTrackWork = new CRCPTrackWork();

        oCTWork.m_nCh = nCh;
        oCTWork.m_nTrackSize = nTrackSize;
        oCTWork.m_nStepTotal = nStep;
        oCTWork.m_nSequence = 0x100;
        oCTWork.m_nTrackAddr = this.m_nPos;
        oCTWork.m_nPos = 0;

        listCRCPStep = this.make_event(oCTWork, false);

        // テンポ情報を先頭に追加
        oCRCPStep = this.build_num(
            oCTWork,
            miz.music.E_MIDI_MSG.META_EVT,
            miz.music.E_META_EVT.TEMPO,
            Math.floor(60000000 / this.m_nTempo)
        );

        oCRCPStep.m_nStep = 0;
        oCRCPStep.m_nSequence = 0;
        listCRCPStep.unshift(oCRCPStep);

        // console.log("STEP " + oCTWork.m_nStepTotal + " " + listCRCPStep.length);

        listCRCPStep.sort(
            function(a: CRCPStep, b: CRCPStep)
            {
                if(a.m_nStep == b.m_nStep)
                {
                    return(a.m_nSequence - b.m_nSequence);
                }

                return(a.m_nStep - b.m_nStep);
            }
        )

        return(
            this.convert_track(listCRCPStep)
        );
    }

    parse_head(): boolean
    {
        let bResult: boolean = false;
        let strID: string = this.m_oCParser.extract_string(0, 2);

        switch(strID)
        {
            case "RC":
                bResult = true;
                break;
        }

        if(bResult == true)
        {
            this.m_nTimeDiv = 0;
            this.m_nTimeDiv |= this.m_oCParser.m_aryData[0x01C0] << 0x00;
            this.m_nTimeDiv |= this.m_oCParser.m_aryData[0x01E7] << 0x08;

            //設定したいテンポ）÷（初期設定テンポ）×64

            this.m_nTempo = this.m_oCParser.m_aryData[0x01C1];
            this.m_nBeat_Nume = this.m_oCParser.m_aryData[0x01C2];
            this.m_nBeat_Deno = this.m_oCParser.m_aryData[0x01C3];

            this.m_nStepBlock = this.m_nBeat_Nume * this.m_nTimeDiv;

            this.m_nKey = this.m_oCParser.m_aryData[0x01C4];
            this.m_nBias = this.m_oCParser.m_aryData[0x01C5];

            this.m_nTrk = this.m_oCParser.m_aryData[0x01E6];
            if(this.m_nTrk == 0)
            {
                this.m_nTrk = 36;
            }

            this.m_strTitle = Encoding.convert(
                this.m_oCParser.extract_string(0x0020, 64),
                {
                    to: "UNICODE",
                    type: "string"
                }
            );

            for(let i: number = 0; i < 8; i ++)
            {
                let strComment: string = Encoding.convert(
                    this.m_oCParser.extract_string(0x0406 + (48 * i), 24),
                    {
                        to: "UNICODE",
                        type: "string"
                    }
                );

                let oCExc = new CExc();

                for(let j: number = 0; j < 24; j ++)
                {
                    oCExc.m_aryData.push(
                        this.m_oCParser.m_aryData[0x0406 + (48 * i) + 24 + j]
                    );
                }

                oCExc.m_aryData.push(0xF7);

                this.m_listCExc.push(oCExc);

                // console.log(strComment);
                // console.log(oCExc.m_aryData);
            }
        }

        return(bResult);
    }

    parse(): miz.music.CMIDIMusic
    {
        let oCMIDIMusic: miz.music.CMIDIMusic = null;
        let oCMIDITrack: miz.music.CMIDITrack = null;

        if(this.parse_head() == true)
        {
            this.m_nPos = 0x0586;

            oCMIDIMusic = new miz.music.CMIDIMusic();

            // console.log("parse Head" + this.m_nTrk);

            for(let nTrack: number = 0; nTrack < this.m_nTrk; nTrack ++)
            {
                let nDataSize: number = this.m_oCParser.extract_number(E_EXTRACT_TYPE.E_EXTRACT_TYPE_U16_LE, this.m_nPos + 0);
                let nTr: number = this.m_oCParser.m_aryData[this.m_nPos + 2];
                let nRy: number = this.m_oCParser.m_aryData[this.m_nPos + 3];
                let nCh: number = this.m_oCParser.m_aryData[this.m_nPos + 4];
                let nKe: number = this.m_oCParser.m_aryData[this.m_nPos + 5];
                let nStep: number = this.m_oCParser.m_aryData[this.m_nPos + 6];
                let nMode: number = this.m_oCParser.m_aryData[this.m_nPos + 7];
                let nNextPos: number = this.m_nPos + nDataSize;

                this.m_nPos += 0x2C;

                if(nMode == 0)
                {
                    if(nCh < 0x10)
                    {
                        // console.log("-");
                        // console.log("CH " + nCh + " : TR " + nTrack, " : ST " + nStep);

                        oCMIDIMusic.m_listTrack.push(
                            this.parse_track(nCh, nStep, nDataSize - 0x2C)
                        );
                    }
                }

                this.m_nPos = nNextPos;

                if(this.m_nPos < this.m_oCParser.m_aryData.length)
                {
                } else {
                    break;
                }
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


// --------------------------------------------------------------- function(s)
function array_append(aryA: Array<CRCPStep>, aryB: Array<CRCPStep>): Array<CRCPStep>
{
    for(let n = 0; n < aryB.length; n ++)
    {
        aryA.push(aryB[n]);
    }

    return(aryA);
}


// --------------------------------------------------------------------- [EOF]
