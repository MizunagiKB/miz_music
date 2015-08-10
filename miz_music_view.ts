// ===========================================================================
/*!
 * @brief Mizunagi Music Viewer for WebMIDI
 * @author @MizunagiKB
 */
// -------------------------------------------------------------- reference(s)
/// <reference path="./DefinitelyTyped/easeljs/easeljs.d.ts" />
/// <reference path="./miz_music_play.ts" />


module miz.music_viewer
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
export class CViewer
{
    static INSTANCE: CViewer = null;

    m_oCStage: createjs.Stage = null;
    m_listKb0: Array<createjs.Bitmap> = [];
    m_KBSheet: createjs.SpriteSheet = null;

    m_listPChange: Array<createjs.Text> = [];
    m_listShape: Array<createjs.Shape> = [];
    m_listSprite: Array<createjs.Sprite> = [];
    m_listKbTrig: Array<number> = [];

    constructor(strId: string)
    {
        this.m_oCStage = new createjs.Stage(strId);
        this.m_oCStage.canvas.width = 768;
        this.m_oCStage.canvas.height = 384;

        let oCKb0Base = new createjs.Bitmap("./assets/kbview_0.png");

        for (let n = 0; n < 16; n ++)
        {
            let oCKB0 = oCKb0Base.clone();

            oCKB0.x = 8;
            oCKB0.y = (24 * n) + 8;
            oCKB0.alpha = 0.75;

            this.m_listKb0.push(oCKB0);
            this.m_listKbTrig.push(0);

            this.m_oCStage.addChild(oCKB0);
        }

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

    private update_cc(oCPlayer: miz.music_player.CPlayer): void
    {
        let g = new createjs.Graphics();

        for (let n = 0; n < this.m_listShape.length; n ++)
        {
            this.m_oCStage.removeChild(this.m_listShape[n]);
        }
        this.m_listShape = [];

        for (let nCh = 0; nCh < 16; nCh ++)
        {
            let listCC: Array<number> = oCPlayer.m_listChStatus[nCh].m_listCCange;

            for (let nCC = 0; nCC < 0x80; nCC++)
            {
                if(listCC[nCC] > 0)
                {
                    let o = new createjs.Shape();
                    let v = listCC[nCC] >> 3;

                    o.graphics.beginFill("#FFFFFF").drawRect(
                        768 - 128 + nCC,
                        (8 + (16 - v)) + 24 * nCh,
                        1,
                        v
                    );

                    this.m_listShape.push(o);
                }
            }

            if(this.m_listKbTrig[nCh] > 0)
            {
                let o = new createjs.Shape();
                let v = this.m_listKbTrig[nCh] >> 3;

                o.graphics.beginFill("#377BB5").drawRect(
                    2,
                    (8 + (16 - v))+ 24 * nCh,
                    4,
                    v
                );

                this.m_listShape.push(o);
            }
        }

        for(let n = 0; n < this.m_listShape.length; n ++)
        {
            this.m_oCStage.addChild(this.m_listShape[n]);
        }
    }

    private update_pc(oCPlayer: miz.music_player.CPlayer): void
    {
        for (let n = 0; n < this.m_listPChange.length; n ++)
        {
            this.m_oCStage.removeChild(this.m_listPChange[n]);
        }
        this.m_listPChange = [];

        for (let nCh = 0; nCh < 16; nCh ++)
        {
            let nPChange: number = oCPlayer.m_listChStatus[nCh].m_nPChange;
            let o = new createjs.Text("" + nPChange, "12px Monospace", "#FFFFFF");

            o.textAlign = "right";
            o.x = 570;
            o.y = 10 + 24 * nCh;

            this.m_listPChange.push(o);
        }

        for(let n = 0; n < this.m_listPChange.length; n ++)
        {
            this.m_oCStage.addChild(this.m_listPChange[n]);
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

            if(this.m_listKbTrig[n] > 0)
            {
                this.m_listKbTrig[n] -= 1;
            }

            for (let nNote = 0; nNote < 0x80; nNote ++)
            {
                if(listNote[nNote] > 0)
                {
                    let o = new createjs.Sprite(this.m_KBSheet, Math.floor(nNote % 12));

                    o.x = 8 + Math.floor(nNote / 12) * 49;
                    o.y = 8 + (24 * n);
                    o.alpha = listNote[nNote] / 127.0;

                    this.m_listSprite.push(o);

                    this.m_listKbTrig[n] = 127;
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
        this.update_cc(oCPlayer);
        this.update_pc(oCPlayer);
        this.update_note(oCPlayer);
        this.m_oCStage.update();
    }
}


// --------------------------------------------------------------- function(s)

 function handleTick(oCEvt)
 {
     CViewer.INSTANCE.m_oCStage.update();
 }

// ===========================================================================
/*!
 * @brief ディスプレイインスタンスの生成処理
 */
export function create_instance(strId: string): CViewer
{
    let oCResult: CViewer = null;

    if(CViewer.INSTANCE != null)
    {
        oCResult = CViewer.INSTANCE;

    } else {

        oCResult = new CViewer(strId);

        CViewer.INSTANCE = oCResult;
    }

    return(oCResult);
}


} // module miz.music_display


// --------------------------------------------------------------------- [EOF]
