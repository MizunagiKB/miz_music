// ===========================================================================
/*!
 * @brief Mizunagi Music Viewer for WebMIDI
 * @author @MizunagiKB
 */
// -------------------------------------------------------------- reference(s)
/// <reference path="./DefinitelyTyped/easeljs/easeljs.d.ts" />
/// <reference path="./miz_music_play.ts" />


module miz.music_prole
{
// -------------------------------------------------------------- interface(s)
// ---------------------------------------------------------------- declare(s)
// ------------------------------------------------------------------- enum(s)
// ----------------------------------------------------------------- global(s)
// ------------------------------------------------------------------ param(s)
// ------------------------------------------------------------------ class(s)
// ---------------------------------------------------------------------------
/*!
 */
class CNoteInfo
{
    public m_nCh: number = 0;
    public m_nNote: number = 0;
    public m_nStep: number = 0;
    public m_nGate: number = 0;
    public m_nVelo: number = 0;

    constructor(nCh: number, nNote: number, nStep: number, nGate: number, nVelo: number)
    {
        this.m_nCh = nCh;
        this.m_nNote = nNote;
        this.m_nStep = nStep;
        this.m_nGate = nGate;
        this.m_nVelo = nVelo;
    }
}


// ---------------------------------------------------------------------------
/*!
 */
export class CPRole
{
    static INSTANCE: CPRole = null;

    m_oCStage: createjs.Stage = null;
    m_listKb0: Array<createjs.Bitmap> = [];
    m_KBSheet: createjs.SpriteSheet = null;

    m_listShape: Array<createjs.Shape> = [];
    m_listKOn: Array<CNoteInfo> = [];

    m_listSprite: Array<createjs.Sprite> = [];

    m_listNote: Array<CNoteInfo> = [];
    m_listNoteMap = [];
    m_nPos: number = 0;

    constructor(strId: string)
    {
        this.m_oCStage = new createjs.Stage(strId);
        this.m_oCStage.canvas.width = 768;
        this.m_oCStage.canvas.height = 384;

        let oCKb0Base = new createjs.Bitmap("./assets/kbview_0.png");

        oCKb0Base.x = 8;
        oCKb0Base.y = (24 * 15) + 8;
        oCKb0Base.alpha = 0.75;

        this.m_listKb0.push(oCKb0Base);

        this.m_oCStage.addChild(oCKb0Base);

        this.m_listNoteMap = [
            [ 1, 6],
            [ 6, 3],
            [ 8, 6],
            [13, 3],
            [15, 6],
            [22, 6],
            [27, 3],
            [29, 6],
            [34, 3],
            [36, 6],
            [41, 3],
            [43, 6]
        ];

        let dictSheet = {
            images: ["./assets/kbview_1.png"],
            frames: [
                [  0,  0,  64, 16],
                [  0, 16,  64, 16],
                [  0, 32,  64, 16],
                [  0, 48,  64, 16],
                [  0, 64,  64, 16],
                [  0, 80,  64, 16],
                [  0, 96,  64, 16],
                [  0,112,  64, 16],
                [  0,128,  64, 16],
                [  0,144,  64, 16],
                [  0,160,  64, 16],
                [  0,176,  64, 16]
            ],
            animations: {
                "0": [0],
                "1": [1],
                "2": [2],
                "3": [3],
                "4": [4],
                "5": [5],
                "6": [6],
                "7": [7],
                "8": [8],
                "9": [9],
                "10": [10],
                "11": [11]
            }
        };

        this.m_KBSheet = new createjs.SpriteSheet(dictSheet);
    }

    // 楽曲再生時に呼び出されるイベントハンドラ
    private parse_track(oCMIDITrack: miz.music.CMIDITrack): void
    {
        let nStepCurr: number = 0;
        let listKbTrig: Array<CNoteInfo> = [];

        for (let i = 0; i < 0x80; i++)
        {
            listKbTrig.push(null);
        }

        for (let i = 0; i < oCMIDITrack.m_listData.length; i ++)
        {
            let mData: miz.music.CMIDIData = oCMIDITrack.m_listData[i];

            nStepCurr += mData.m_nStep;

            switch(mData.m_eMMsg)
            {
                case miz.music.E_MIDI_MSG.NOTE_OF:
                case miz.music.E_MIDI_MSG.NOTE_ON:
                    {
                        let nCh = mData.m_aryValue[0] & 0x0F;
                        let nNote: number = mData.m_aryValue[1];
                        let nVelo: number = mData.m_aryValue[2];

                        if (mData.m_eMMsg == miz.music.E_MIDI_MSG.NOTE_OF)
                            nVelo = 0;

                        if (nVelo > 0)
                        {
                            if (listKbTrig[nNote] == null)
                            {
                                let oCNInfo: CNoteInfo = new CNoteInfo(nCh, nNote, nStepCurr, 1, nVelo);

                                listKbTrig[nNote] = oCNInfo;
                            }
                        } else {
                            if (listKbTrig[nNote] != null)
                            {
                                let oCNInfo: CNoteInfo = listKbTrig[nNote];

                                oCNInfo.m_nGate = nStepCurr - oCNInfo.m_nStep;

                                this.m_listNote.push(oCNInfo);

                                listKbTrig[nNote] = null;
                            }
                        }
                    }
                    break;
            }
        }
    }

    public parse(oCMIDIMusic: miz.music.CMIDIMusic): void
    {
        this.m_listNote = [];
        this.m_listKOn = [];
        this.m_nPos = 0;

        for (let i = 0; i < oCMIDIMusic.m_listTrack.length; i ++)
        {
            this.parse_track(
                oCMIDIMusic.m_listTrack[i]
            );
        }

        this.m_listNote.sort(
            function(a: CNoteInfo, b: CNoteInfo)
            {
                return(a.m_nStep - b.m_nStep);
            }
        )

        console.log(this.m_listNote.length);
    }

    private update_role(nStepCurr: number): void
    {
        let nPRoleWidth: number = 384 - 16;

        for (let i = 0; i < this.m_listShape.length; i ++)
        {
            this.m_oCStage.removeChild(this.m_listShape[i]);
        }
        this.m_listShape = [];

        let nData = this.m_listKOn.length;
        for (let i = 0; i < this.m_listKOn.length; i ++)
        {
            let oCNInfo: CNoteInfo = this.m_listKOn[i];
            let oct = Math.floor(oCNInfo.m_nNote / 12);
            let n = Math.floor(oCNInfo.m_nNote % 12);

            let nY: number = ((nStepCurr - oCNInfo.m_nStep) + nPRoleWidth) - oCNInfo.m_nGate;
            let nW: number = nY + oCNInfo.m_nGate;

            if (nY < nPRoleWidth)
            {
                let nW: number = nY + oCNInfo.m_nGate;

                if (nW > nPRoleWidth)
                {
                    nW = nPRoleWidth - nY;
                } else {
                    nW = nW - nY;
                }

                let o = new createjs.Shape();

                o.graphics.beginFill("#377BB5").drawRect(
                    8 + (oct * 49) + this.m_listNoteMap[n][0],
                    nY,
                    this.m_listNoteMap[n][1],
                    nW
                );
                o.alpha = 1.0;

                this.m_listShape.push(o);
            }
        }

        let listKOn = [];
        for (let i = 0; i < this.m_listKOn.length; i ++)
        {
            let oCNInfo: CNoteInfo = this.m_listKOn[i];
            let nY: number = ((nStepCurr - oCNInfo.m_nStep) + nPRoleWidth) - oCNInfo.m_nGate;

            if (nY < 384)
            {
                listKOn.push(oCNInfo);
            }
        }

        this.m_listKOn = listKOn;

        for (let i = 0; i < this.m_listShape.length; i ++)
        {
            this.m_oCStage.addChild(this.m_listShape[i]);
        }
    }

    // 楽曲再生時に呼び出されるイベントハンドラ
    public update_debug(): void
    {
        for (let i = 0; i < 10; i++)
        {
            let oCNInfo: CNoteInfo = new CNoteInfo(0, 12 * i, 0, 8192, 0);

            this.m_listKOn.push(oCNInfo);
        }
    }

    private update_note(oCPlayer: miz.music_player.CPlayer): void
    {
        for (let n = 0; n < this.m_listSprite.length; n ++)
        {
            this.m_oCStage.removeChild(this.m_listSprite[n]);
        }
        this.m_listSprite = [];

        for (let n = 0; n < 16; n ++)
        {
            let listNote: Array<number> = oCPlayer.m_listChStatus[n].m_listNote;

            for (let nNote = 0; nNote < 0x80; nNote ++)
            {
                if(listNote[nNote] > 0)
                {
                    let o = new createjs.Sprite(this.m_KBSheet, Math.floor(nNote % 12));

                    o.x = 8 + Math.floor(nNote / 12) * 49;
                    o.y = 384 - 16;
                    o.alpha = listNote[nNote] / 127.0;

                    this.m_listSprite.push(o);
                }
            }
        }

        for(let n = 0; n < this.m_listSprite.length; n ++)
        {
            this.m_oCStage.addChild(this.m_listSprite[n]);
        }
    }

    // 楽曲再生時に呼び出されるイベントハンドラ
    public update(oCPlayer: miz.music_player.CPlayer): void
    {
        let nStepCurr: number = oCPlayer.m_nStepCurr;

        while (this.m_nPos < this.m_listNote.length)
        {
            let oCNInfo: CNoteInfo = this.m_listNote[this.m_nPos];

            if (oCNInfo.m_nStep < (nStepCurr + 384))
            {
                this.m_listKOn.push(oCNInfo);

                //this.update_debug();

                this.m_nPos += 1;
            } else {
                break;
            }
        }

        this.update_note(oCPlayer);
        this.update_role(nStepCurr);

        this.m_oCStage.update();
    }
}


// --------------------------------------------------------------- function(s)

 function handleTick(oCEvt)
 {
     CPRole.INSTANCE.m_oCStage.update();
 }

// ===========================================================================
/*!
 * @brief ディスプレイインスタンスの生成処理
 */
export function create_instance(strId: string): CPRole
{
    let oCResult: CPRole = null;

    if(CPRole.INSTANCE != null)
    {
        oCResult = CPRole.INSTANCE;

    } else {

        oCResult = new CPRole(strId);

        CPRole.INSTANCE = oCResult;
    }

    return(oCResult);
}


} // module miz.music_display


// --------------------------------------------------------------------- [EOF]
