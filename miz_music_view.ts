// ===========================================================================
/*!
 * @brief Mizunagi Music Viewer for WebMIDI
 * @author @MizunagiKB
 */
// -------------------------------------------------------------- reference(s)
/// <reference path="./miz_music_play.ts" />
/// <reference path="./d3/d3.d.ts" />


module miz.music_viewer
{
// -------------------------------------------------------------- interface(s)
// ---------------------------------------------------------------- declare(s)
// ------------------------------------------------------------------- enum(s)
// ----------------------------------------------------------------- global(s)
// ------------------------------------------------------------------ class(s)
// ---------------------------------------------------------------------------
/*!
 */
export class CViewer
{
    static INSTANCE: CViewer = null;
    static INTERVAL: number = 100;
    static HEIGHT: number = 96;

    m_oCSVG: d3.Selection<any> = null;
    m_hTimer: number = null;

    m_oCGText: d3.Selection<any> = null;
    m_oCTextStatus: d3.Selection<any> = null;
    m_oCTextTempo: d3.Selection<any> = null;
    m_oCTextStep: d3.Selection<any> = null;
    m_oCTextTimebase: d3.Selection<any> = null;

    m_oCGLine: d3.Selection<any> = null;

    m_oCLineRenderer: any = null;
    m_oCSVGLine: d3.Selection<any> = null;
    m_listEventCount = [];
    m_listChannelPeak = [];

    constructor(strId: string)
    {
        this.m_oCSVG = d3.select(strId);
        this.m_oCSVG.attr("width", 512);
        this.m_oCSVG.attr("height", CViewer.HEIGHT);

        this.m_oCGText = this.m_oCSVG.append("g");

        let oCText = null;

        oCText = this.m_oCGText.append("text");
        oCText.text("TEMPO")
            .attr("font-size", "18px")
            .attr("text-anchor", "end")
            .attr("x", 384)
            .attr("y", 20)
            ;

        oCText = this.m_oCGText.append("text");
        oCText.text("STEP")
            .attr("font-size", "18px")
            .attr("text-anchor", "end")
            .attr("x", 384)
            .attr("y", 20 + 20)
            ;

        oCText = this.m_oCGText.append("text");
        oCText.text("TIMEBASE")
            .attr("font-size", "18px")
            .attr("text-anchor", "end")
            .attr("x", 384)
            .attr("y", 20 + 40)
            ;

        this.m_oCTextTempo = this.m_oCGText.append("text");
        this.m_oCTextTempo.text("0")
            .attr("font-size", "18px")
            .attr("text-anchor", "end")
            .attr("x", 506)
            .attr("y", 20)
            ;

        this.m_oCTextStep = this.m_oCGText.append("text");
        this.m_oCTextStep.text("0")
            .attr("font-size", "18px")
            .attr("text-anchor", "end")
            .attr("x", 506)
            .attr("y", 40)
            ;

        this.m_oCTextTimebase = this.m_oCGText.append("text");
        this.m_oCTextTimebase.text("0")
            .attr("font-size", "18px")
            .attr("text-anchor", "end")
            .attr("x", 506)
            .attr("y", 60)
            ;

        for(let n = 0; n < 16; n ++)
        {
            this.m_listChannelPeak.push(0);
        }

        for(let n = 0; n < 256; n ++)
        {
            this.m_listEventCount.push(0);
        }

        this.m_oCLineRenderer = d3.svg.line()
            .x(function(d, n) { return n * 2; })
            .y(function(d) { return(CViewer.HEIGHT - d); })
            ;

        this.m_oCSVGLine = this.m_oCSVG.append("path");

        this.m_oCSVGLine
            .datum(this.m_listEventCount)
            .attr('stroke', "#000000")
            .attr('stroke-width', '1')
            .attr('fill', 'transparent')
            .attr("d", this.m_oCLineRenderer)
            ;
    }

    public update_peak(): void
    {
        for(let nCh: number = 0; nCh < 16; nCh ++)
        {
            let oCCh = miz.music_player.CPlayer.INSTANCE.m_listChStatus[nCh];
            let nValue = this.m_listChannelPeak[nCh];
            let nValueNew = 0;

            for(let nNote = 0; nNote < 0x80; nNote ++)
            {
                if(oCCh.m_listNote[nNote] > 0)
                {
                    nValueNew += (CViewer.HEIGHT / 4);
                }
            }

            if(nValueNew > nValue)
            {
                nValue = nValueNew;
            }

            nValue -= 5;

            if(nValue > CViewer.HEIGHT) nValue = CViewer.HEIGHT;
            if(nValue < 1) nValue = 0;

            this.m_listChannelPeak[nCh] = nValue;
        }

        this.m_oCSVG.selectAll("rect.bar")
            .data(this.m_listChannelPeak)
            .attr("y", function(d) { return CViewer.HEIGHT - d; })
            .attr("height", function(d) { return d; })

            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", function(d, n) { return(n * 8); })
            .attr("width", 6)
            .attr("y", function(d) { return CViewer.HEIGHT - d; })
            .attr("height", function(d) { return CViewer.HEIGHT; })
            ;
    }

    public update_line(): void
    {
        let nValue: number = 0;

        for(let n: number = 0; n < 16; n ++)
        {
            nValue += this.m_listChannelPeak[n];
        }

        nValue /= 16;

        if(nValue > CViewer.HEIGHT)
        {
            nValue = CViewer.HEIGHT;
        }

        this.m_listEventCount.push(nValue);
        if(this.m_listEventCount.length > 256)
        {
            this.m_listEventCount = this.m_listEventCount.slice(1, 256);
        }

        this.m_oCSVGLine
            .datum(this.m_listEventCount)
            .attr('stroke', "#000000")
            .attr('stroke-width', '1')
            .attr('fill', 'transparent')
            .attr("d", this.m_oCLineRenderer)
            ;
    }

    // 楽曲再生時に呼び出されるイベントハンドラ
    public update(oCPlayer: miz.music_player.CPlayer): void
    {
        this.m_oCTextTempo.text(
            Math.floor(60000000 / oCPlayer.m_nTempo)
        );

        this.m_oCTextStep.text(
            Math.floor(oCPlayer.m_nStepCurr)
        );

        this.m_oCTextTimebase.text(
            Math.floor(oCPlayer.m_nTimeDiv)
        );

        this.update_line();
        this.update_peak();
    }
}


// --------------------------------------------------------------- function(s)
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
