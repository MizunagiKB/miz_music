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
export enum E_MIDI_MSG
{
    NOTE_OF = 0x80,
    NOTE_ON = 0x90,
    P_AFTER_TOUCH = 0xA0,
    CONTROL_CHANGE = 0xB0,
    PROGRAM_CHANGE = 0xC0,
    C_AFTER_TOUCH = 0xD0,
    PITCH = 0xE0,
    SYS_EX_F0 = 0xF0,
    SYS_EX_F7 = 0xF7,
    META_EVT = 0xFF
}

export enum E_META_EVT
{
    SEQUENCE_NUMBER = 0x00,
    TEXT = 0x01,
    COPYRIGHT = 0x02,
    TRACK_NAME = 0x03,
    INSTRUMENT_NAME = 0x04,
    LYRIC = 0x05,
    MARKER = 0x06,
    CUE = 0x07,
    END_OF_TRACK = 0x2F,
    TEMPO = 0x51,
    SMPTE_OFFSET = 0x54,
    TIME_SIGNATURE = 0x58,
    KEY_SIGNATURE = 0x59,
    SEQUENCER_SPECIFIC_META_EVT = 0x7F
}

// ----------------------------------------------------------------- global(s)
// ------------------------------------------------------------------ class(s)
// ---------------------------------------------------------------------------
/*!
 */
export class CMIDIData
{
    public m_nStep: number = 0;

    public m_eMMsg: E_MIDI_MSG = 0;
    public m_eMEvt: E_META_EVT = 0;
    public m_aryValue: Array<number> = [];
    public m_numValue: number = 0;
    public m_strValue: string = "";
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
    public m_strTitle: string = "";
    public m_listTrack: Array<CMIDITrack> = [];
}


} // module miz.music
// --------------------------------------------------------------------- [EOF]
