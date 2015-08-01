// ===========================================================================
/*!
 * @brief MIDI Music
 * @author @MizunagiKB
 */
// -------------------------------------------------------------- reference(s)


module miz.music
{
// -------------------------------------------------------------- interface(s)
// ---------------------------------------------------------------- declare(s)
// ------------------------------------------------------------------- enum(s)
export enum E_MIDI_EV
{
    NOTE_OF = 0x80,
    NOTE_ON = 0x90,
    P_AFTER_TOUCH = 0xA0,
    CONTROL_CHANGE = 0xB0,
    PROGRAM_CHANGE = 0xC0,
    C_AFTER_TOUCH = 0xD0,
    PITCH = 0xE0
}


// ----------------------------------------------------------------- global(s)
// ------------------------------------------------------------------ class(s)
// ---------------------------------------------------------------------------
/*!
 */
export class CMIDIData
{
    public m_nStep: number = 0;
    public m_nTempo: number = 0;
    public m_midiData: Array<number> = [];
}


// ---------------------------------------------------------------------------
/*!
 */
export class CMIDITrack
{
    public m_listData: Array<CMIDIData> = [];
}


// ---------------------------------------------------------------------------
/*!
 */
export class CMIDIMusic
{
    public m_nTimeDiv: number = 480;
    public m_listTrack: Array<CMIDITrack> = [];
}


} // module miz.music
// --------------------------------------------------------------------- [EOF]
