// ===========================================================================
/*!
 * @brief Mizunagi Music Player for WebMIDI
 * @author @MizunagiKB
 */
// -------------------------------------------------------------- reference(s)
/// <reference path="./miz_music.ts" />


module miz.music_player
{
// -------------------------------------------------------------- interface(s)
// ---------------------------------------------------------------- declare(s)
// ------------------------------------------------------------------- enum(s)
enum E_PLAYER_STATUS
{
    E_PLAY,
    E_STOP
}


// ----------------------------------------------------------------- global(s)
// ------------------------------------------------------------------ class(s)
// ---------------------------------------------------------------------------
/*!
 */
class CTrStatus
{
    public m_nStepCurr: number;
    public m_nDataPos: number;
    public m_bEnable: boolean;
}


// ---------------------------------------------------------------------------
/*!
 */
class CChStatus
{
    public m_listNote: Array<number> = null;
}


// ---------------------------------------------------------------------------
/*!
 */
export class CPlayer
{
    static INSTANCE: CPlayer = null;

    static INTERVAL: number = 10;
    static MAX_CH: number = 16;
    static MIDI_I_LIST = [];
    static MIDI_O_LIST = [];

    private m_hMIDIO: any = null;
    private m_oCMIDIMusic: miz.music.CMIDIMusic = null;

    private m_ePlayerStatus: E_PLAYER_STATUS = E_PLAYER_STATUS.E_STOP;
    private m_nTimePrev: number = 0;
    private m_nTimeCurr: number = 0;

    private m_hTimer: number = null;

    public m_nTempo: number = 60000000 / 120;
    public m_nStepCurr: number = 0;
    public m_nTimeDiv: number = 0;
    public m_bSysEx: boolean = false;

    public m_listTrStatus: Array<CTrStatus> = [];
    public m_listChStatus: Array<CChStatus> = [];
    public evt_success = null;
    public evt_failure = null;

    constructor()
    {
        this.m_oCMIDIMusic = null;
        this.m_listChStatus = [];
        this.m_listTrStatus = [];

        for(let n = 0; n < CPlayer.MAX_CH; n ++)
        {
            let oCh = new CChStatus();

            oCh.m_listNote = [];

            for(let nNote = 0; nNote < 128; nNote ++)
            {
                oCh.m_listNote.push(0);
            }

            this.m_listChStatus.push(oCh);
        }
    }

    // 楽曲再生時に呼び出されるイベントハンドラ

    private update_track(oCTrStatus: CTrStatus, oCMIDITrack: miz.music.CMIDITrack): boolean
    {
        let bResult: boolean = false;
        let nPos: number = oCTrStatus.m_nDataPos

        while(nPos < oCMIDITrack.m_listData.length)
        {
            let midiData: miz.music.CMIDIData = oCMIDITrack.m_listData[nPos];

            bResult = true;

            if((oCTrStatus.m_nStepCurr + midiData.m_nStep) < this.m_nStepCurr)
            {
                oCTrStatus.m_nStepCurr += midiData.m_nStep;

                // テンポ情報が含まれていれば新しい値を設定
                if(midiData.m_nTempo > 0)
                {
                    this.m_nTempo = midiData.m_nTempo;
                }

                if(midiData.m_midiData.length > 0)
                {
                    let nEv = midiData.m_midiData[0] & 0xF0;
                    let nCh = midiData.m_midiData[0] & 0x0F;

                    switch(nEv)
                    {
                        case miz.music.E_MIDI_EV.NOTE_OF:
                            {
                                let nNote: number = midiData.m_midiData[1];
                                this.m_listChStatus[nCh].m_listNote[nNote] -= 1;
                            }
                            break;
                        case miz.music.E_MIDI_EV.NOTE_ON:
                            {
                                let nNote = midiData.m_midiData[1];
                                let nValo = midiData.m_midiData[2];

                                if(nValo > 0)
                                {
                                    this.m_listChStatus[nCh].m_listNote[nNote] += 1;
                                } else {
                                    this.m_listChStatus[nCh].m_listNote[nNote] -= 1;
                                }
                            }
                            break;
                    }

                    try
                    {
                        this.m_hMIDIO.send(midiData.m_midiData, 0);
                    } catch(e) {
                    }
                }

                nPos += 1;

            } else {

                break;
            }
        }

        oCTrStatus.m_nDataPos = nPos;

        return(bResult);
    }

    update(): void
    {
        if(this.m_ePlayerStatus == E_PLAYER_STATUS.E_PLAY)
        {
            let nTime: number = window.performance.now();
            let nSingleStep: number = (this.m_nTempo / 1000.0) / this.m_oCMIDIMusic.m_nTimeDiv;
            let nElapsedTime: number = 0;
            let nElapsedStep: number = 0;
            let bEnable: boolean = false;

            this.m_nTimeCurr = nTime;

            nElapsedTime = this.m_nTimeCurr - this.m_nTimePrev;
            nElapsedStep = nElapsedTime / nSingleStep;

            this.m_nStepCurr += nElapsedStep;
            this.m_nTimePrev = this.m_nTimeCurr;

            // console.log("this.m_nTimeCurr   " + this.m_nTimeCurr);
            // console.log("this.m_nStepCurr   " + this.m_nStepCurr);

            for(let nTr = 0; nTr < this.m_oCMIDIMusic.m_listTrack.length; nTr ++)
            {
                let oCTr = this.m_listTrStatus[nTr];

                if(oCTr.m_bEnable == true)
                {
                    oCTr.m_bEnable = this.update_track(
                        this.m_listTrStatus[nTr],
                        this.m_oCMIDIMusic.m_listTrack[nTr]
                    );

                    bEnable = true;
                }
            }

            if(bEnable == false)
            {
                this.stop();
            }
        }
    }

    public timer_ignite(): void
    {
        if(this.m_hTimer == null)
        {
            this.m_hTimer = setInterval(evt_update, CPlayer.INTERVAL);
        }
    }

    public timer_destroy(): void
    {
        if(this.m_hTimer != null)
        {
            clearInterval(this.m_hTimer);
            this.m_hTimer = null;
        }
    }

    public assign_midio(nDevice: number): any
    {
        this.m_hMIDIO = CPlayer.MIDI_O_LIST[nDevice];

        return(CPlayer.MIDI_O_LIST[nDevice]);
    }

    public is_play(): boolean
    {
        return(this.m_ePlayerStatus == E_PLAYER_STATUS.E_PLAY);
    }

    // パラメータ初期化
    public reset(): void
    {
        let nPerformance: number = window.performance.now();

        this.m_ePlayerStatus = E_PLAYER_STATUS.E_STOP;

        for(let nCh = 0; nCh < CPlayer.MAX_CH; nCh ++)
        {
            let oCh = this.m_listChStatus[nCh];
            let nTime: number = nPerformance + nCh * 20;

            if(this.m_hMIDIO != null)
            {
                this.m_hMIDIO.send([0xB0 + nCh, 0x01,  0], nTime);
                this.m_hMIDIO.send([0xB0 + nCh, 0x05,  0], nTime);
                this.m_hMIDIO.send([0xB0 + nCh, 0x0A, 64], nTime);
                this.m_hMIDIO.send([0xB0 + nCh, 0x40,  0], nTime);

                this.m_hMIDIO.send([0xB0 + nCh, 0x78, 0], nTime);
                this.m_hMIDIO.send([0xB0 + nCh, 0x79, 0], nTime);
                this.m_hMIDIO.send([0xB0 + nCh, 0x7B, 0], nTime);
            }
        }

        this.stop();
    }

    // 楽曲データの読み込み
    public load(oCMIDIMusic: miz.music.CMIDIMusic): void
    {
        this.stop();

        this.m_oCMIDIMusic = oCMIDIMusic;
        this.m_nTimeDiv = oCMIDIMusic.m_nTimeDiv;

        for(let n = 0; n < this.m_oCMIDIMusic.m_listTrack.length; n ++)
        {
            this.m_listTrStatus.push(new CTrStatus());
        }
    }

    //
    public play(): void
    {
        this.reset();

        this.m_nTimeCurr = window.performance.now();
        this.m_nTimePrev = this.m_nTimeCurr;

        this.m_nStepCurr = 0;

        this.m_nTempo = 60000000 / 120;

        for(let nTr = 0; nTr < this.m_oCMIDIMusic.m_listTrack.length; nTr ++)
        {
            this.m_listTrStatus[nTr].m_nStepCurr = 0;
            this.m_listTrStatus[nTr].m_nDataPos = 0;
            this.m_listTrStatus[nTr].m_bEnable = true;
        }

        this.m_ePlayerStatus = E_PLAYER_STATUS.E_PLAY;

        this.timer_ignite();


        //https://developer.mozilla.org/ja/docs/Web/API/Window/requestAnimationFrame
    }

    //
    public stop(): void
    {
        var nTimeCurr: number = window.performance.now();

        this.m_ePlayerStatus = E_PLAYER_STATUS.E_STOP;

        this.timer_destroy();

        for(let nCh = 0; nCh < CPlayer.MAX_CH; nCh ++)
        {
            let oCh = this.m_listChStatus[nCh];
            let nTime: number = nTimeCurr + nCh * 20;

            for(let nNote = 0; nNote < 0x80; nNote ++)
            {
                let nCount = oCh.m_listNote[nNote];

                while(nCount > 0)
                {
                    if(this.m_hMIDIO != null)
                    {
                        this.m_hMIDIO.send([0x80 + nCh, nNote, 0], nTime);
                    }
                    nCount --;
                }

                oCh.m_listNote[nNote] = 0;
            }
        }
    }
}


// --------------------------------------------------------------- function(s)
// ===========================================================================
/*!
 */
function evt_update()
{
    CPlayer.INSTANCE.update();
}


// ===========================================================================
/*!
 */
function evt_midi_success(oCEvt): void
{
    console.log(oCEvt);

    let iter = oCEvt.outputs.values();

    for(let o = iter.next(); !o.done; o = iter.next())
    {
        CPlayer.MIDI_O_LIST.push(o.value);
    }

    if(CPlayer.INSTANCE.evt_success != null)
    {
        CPlayer.INSTANCE.evt_success(
            oCEvt,
            CPlayer.MIDI_I_LIST,
            CPlayer.MIDI_O_LIST
        );

        CPlayer.INSTANCE.evt_success = null;
    }
}


// ===========================================================================
/*!
 */
function evt_midi_failure(oCEvt): void
{
    if(CPlayer.INSTANCE.evt_failure != null)
    {
        CPlayer.INSTANCE.evt_failure(oCEvt);

        CPlayer.INSTANCE.evt_failure = null;
    }
}


// ===========================================================================
/*!
 * @brief プレイヤーインスタンスの生成処理
 */
export function create_instance(bSysEx: boolean = false, evt_success=null, evt_failure=null): CPlayer
{
    let oCResult: CPlayer = null;

    if(CPlayer.INSTANCE != null)
    {
        oCResult = CPlayer.INSTANCE;

    } else {

        oCResult = new CPlayer();
        oCResult.reset();

        oCResult.m_bSysEx = bSysEx;
        oCResult.evt_success = evt_success;
        oCResult.evt_failure = evt_failure;

        navigator.requestMIDIAccess(
            {sysex: oCResult.m_bSysEx}
        ).then(evt_midi_success, evt_midi_failure);

        CPlayer.INSTANCE = oCResult;
    }

    return(oCResult);
}


} // module miz.music_player


// --------------------------------------------------------------------- [EOF]
