// ===========================================================================
/*!
 * @brief Web MIDI Player / Play module.
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
    public m_nStepCurr: number = 0;
    public m_nDataPos: number = 0;
    public m_bEnable: boolean = false;
}


// ---------------------------------------------------------------------------
/*!
 */
class CChStatus
{
    public m_listNote: Array<number> = [];
    public m_listCCange: Array<number> = [];
    public m_nPChange: number = 0;
    public m_nPitch: number = 0;

    constructor()
    {
        for (let n = 0; n < 0x80; n++)
        {
            this.m_listNote.push(0);
            this.m_listCCange.push(0);
        }
    }
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
            this.m_listChStatus.push(oCh);
        }
    }

    private update_track_cc(mData: miz.music.CMIDIData): void
    {
        let nCh = mData.m_aryValue[0] & 0x0F;
        let nEntry: number = mData.m_aryValue[1];
        let nValue: number = mData.m_aryValue[2];

        this.m_listChStatus[nCh].m_listCCange[nEntry] = nValue;
    }

    private update_track_pc(mData: miz.music.CMIDIData): void
    {
        let nCh = mData.m_aryValue[0] & 0x0F;
        let nValue: number = mData.m_aryValue[1];

        this.m_listChStatus[nCh].m_nPChange = nValue;
    }

    private update_track_note(mData: miz.music.CMIDIData): void
    {
        let nCh = mData.m_aryValue[0] & 0x0F;
        let nNote: number = mData.m_aryValue[1];
        let nVelo: number = mData.m_aryValue[2];

        if (mData.m_eMMsg == miz.music.E_MIDI_MSG.NOTE_OF)
            nVelo = 0;

        this.m_listChStatus[nCh].m_listNote[nNote] = nVelo;
    }

    // 楽曲再生時に呼び出されるイベントハンドラ
    private update_track(oCTrStatus: CTrStatus, oCMIDITrack: miz.music.CMIDITrack): boolean
    {
        let bResult: boolean = false;
        let nPos: number = oCTrStatus.m_nDataPos

        while(nPos < oCMIDITrack.m_listData.length)
        {
            let mData: miz.music.CMIDIData = oCMIDITrack.m_listData[nPos];

            bResult = true;

            if((oCTrStatus.m_nStepCurr + mData.m_nStep) < this.m_nStepCurr)
            {
                oCTrStatus.m_nStepCurr += mData.m_nStep;

                switch(mData.m_eMMsg)
                {
                    case miz.music.E_MIDI_MSG.NOTE_OF:
                    case miz.music.E_MIDI_MSG.NOTE_ON:
                        this.update_track_note(mData);
                        break;

                    case miz.music.E_MIDI_MSG.CONTROL_CHANGE:
                        this.update_track_cc(mData);
                        break;

                    case miz.music.E_MIDI_MSG.PROGRAM_CHANGE:
                        this.update_track_pc(mData);
                        break;

                    case miz.music.E_MIDI_MSG.META_EVT:
                        {
                            switch(mData.m_eMEvt)
                            {
                                case miz.music.E_META_EVT.TEMPO:
                                    {
                                        this.m_nTempo = mData.m_numValue;
                                    }
                                    break;
                            }
                        }
                        break;
                }

                if(mData.m_aryValue.length > 0)
                {
                    try
                    {
                        this.m_hMIDIO.send(mData.m_aryValue, 0);
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

    public update(nTime: number): void
    {
        // 演奏停止状態の場合は以降の処理は行わない。
        if(this.m_ePlayerStatus != E_PLAYER_STATUS.E_PLAY)
        {
            return;
        }

        let nSingleStep: number = (this.m_nTempo / 1000.0) / this.m_oCMIDIMusic.m_nTimeDiv;
        let nElapsedTime: number = nTime - this.m_nTimeCurr;
        let nElapsedStep: number = nElapsedTime / nSingleStep;

        this.m_nTimeCurr = nTime;

        this.m_nStepCurr += nElapsedStep;

        for(let n = 0; n < this.m_oCMIDIMusic.m_listTrack.length; n ++)
        {
            let oCTr = this.m_listTrStatus[n];

            if(oCTr.m_bEnable == true)
            {
                oCTr.m_bEnable = this.update_track(
                    this.m_listTrStatus[n],
                    this.m_oCMIDIMusic.m_listTrack[n]
                );
            }
        }

        // 演奏中のトラックが存在していない場合は演奏終了状態に遷移。
        if(this.is_play() == false)
        {
            this.stop();
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
        if(this.m_ePlayerStatus == E_PLAYER_STATUS.E_PLAY)
        {
            for(let n = 0; n < this.m_oCMIDIMusic.m_listTrack.length; n ++)
            {
                if(this.m_listTrStatus[n].m_bEnable == true)
                {
                    return(true);
                }
            }
        }

        return(false);
    }

    // パラメータ初期化
    public reset(): void
    {
        let nPerformance: number = window.performance.now();

        this.m_ePlayerStatus = E_PLAYER_STATUS.E_STOP;

        for (let nCh = 0; nCh < CPlayer.MAX_CH; nCh ++)
        {
            let oCh = this.m_listChStatus[nCh];
            let nTime: number = nPerformance + nCh * 20;

            if(this.m_hMIDIO != null)
            {
                // Reset All Controller
                this.m_hMIDIO.send([0xB0 + nCh, 0x79, 0], 0);
                // All Note Off
                this.m_hMIDIO.send([0xB0 + nCh, 0x7B, 0], 0);
                // All Sound Off
                this.m_hMIDIO.send([0xB0 + nCh, 0x78, 0], 0);
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

        this.m_nStepCurr = 0;

        // SMF準拠のタイマー計算
        this.m_nTempo = 60000000 / 120;

        for (let nTr = 0; nTr < this.m_oCMIDIMusic.m_listTrack.length; nTr ++)
        {
            this.m_listTrStatus[nTr].m_nStepCurr = 0;
            this.m_listTrStatus[nTr].m_nDataPos = 0;
            this.m_listTrStatus[nTr].m_bEnable = true;
        }

        this.m_ePlayerStatus = E_PLAYER_STATUS.E_PLAY;

        this.timer_ignite();
    }

    //
    public stop(): void
    {
        this.m_ePlayerStatus = E_PLAYER_STATUS.E_STOP;

        this.timer_destroy();

        for (let nCh = 0; nCh < CPlayer.MAX_CH; nCh ++)
        {
            let oCh = this.m_listChStatus[nCh];

            for (let nNote = 0; nNote < 0x80; nNote ++)
            {
                if (oCh.m_listNote[nNote] > 0)
                {
                    if (this.m_hMIDIO != null)
                    {
                        this.m_hMIDIO.send([0x80 + nCh, nNote, 0], 0);
                    }
                }

                oCh.m_listNote[nNote] = 0;
                oCh.m_listCCange[nNote] = 0;
            }

            oCh.m_nPChange = 0;
        }
    }
}


// --------------------------------------------------------------- function(s)
// ===========================================================================
/*!
 */
function evt_update()
{
    CPlayer.INSTANCE.update(
        window.performance.now()
    );
}


// ===========================================================================
/*!
 */
function evt_midi_success(oCEvt): void
{
    // console.log(oCEvt);

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
export function init(bSysEx: boolean = false, evt_success=null, evt_failure=null): CPlayer
{
    let oCResult: CPlayer = null;

    if(CPlayer.INSTANCE != null)
    {
        oCResult = CPlayer.INSTANCE;

    } else {

        oCResult = new CPlayer();
        oCResult.reset();

        if(navigator.requestMIDIAccess != undefined)
        {
            oCResult.m_bSysEx = bSysEx;
            oCResult.evt_success = evt_success;
            oCResult.evt_failure = evt_failure;

            navigator.requestMIDIAccess(
                {sysex: oCResult.m_bSysEx}
            ).then(evt_midi_success, evt_midi_failure);
        }

        CPlayer.INSTANCE = oCResult;
    }

    return(oCResult);
}


// ===========================================================================
/*!
 * @brief プレイヤーインスタンスの破棄処理
 */
export function term(): void
{
    if(CPlayer.INSTANCE != null)
    {
        CPlayer.INSTANCE.evt_success = null;
        CPlayer.INSTANCE.evt_failure = null;

        CPlayer.INSTANCE = null;
    }
}


} // module miz.music_player


// --------------------------------------------------------------------- [EOF]
