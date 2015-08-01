// ===========================================================================
/*!
 * @brief MIDI Music
 * @author @MizunagiKB
 */
// -------------------------------------------------------------- reference(s)
var miz;
(function (miz) {
    var music;
    (function (music) {
        (function (E_MIDI_MSG) {
            E_MIDI_MSG[E_MIDI_MSG["NOTE_OF"] = 128] = "NOTE_OF";
            E_MIDI_MSG[E_MIDI_MSG["NOTE_ON"] = 144] = "NOTE_ON";
            E_MIDI_MSG[E_MIDI_MSG["P_AFTER_TOUCH"] = 160] = "P_AFTER_TOUCH";
            E_MIDI_MSG[E_MIDI_MSG["CONTROL_CHANGE"] = 176] = "CONTROL_CHANGE";
            E_MIDI_MSG[E_MIDI_MSG["PROGRAM_CHANGE"] = 192] = "PROGRAM_CHANGE";
            E_MIDI_MSG[E_MIDI_MSG["C_AFTER_TOUCH"] = 208] = "C_AFTER_TOUCH";
            E_MIDI_MSG[E_MIDI_MSG["PITCH"] = 224] = "PITCH";
            E_MIDI_MSG[E_MIDI_MSG["SYS_EX_F0"] = 240] = "SYS_EX_F0";
            E_MIDI_MSG[E_MIDI_MSG["SYS_EX_F7"] = 247] = "SYS_EX_F7";
            E_MIDI_MSG[E_MIDI_MSG["META_EVT"] = 255] = "META_EVT";
        })(music.E_MIDI_MSG || (music.E_MIDI_MSG = {}));
        var E_MIDI_MSG = music.E_MIDI_MSG;
        (function (E_META_EVT) {
            E_META_EVT[E_META_EVT["SEQUENCE_NUMBER"] = 0] = "SEQUENCE_NUMBER";
            E_META_EVT[E_META_EVT["TEXT"] = 1] = "TEXT";
            E_META_EVT[E_META_EVT["COPYRIGHT"] = 2] = "COPYRIGHT";
            E_META_EVT[E_META_EVT["TRACK_NAME"] = 3] = "TRACK_NAME";
            E_META_EVT[E_META_EVT["INSTRUMENT_NAME"] = 4] = "INSTRUMENT_NAME";
            E_META_EVT[E_META_EVT["LYRIC"] = 5] = "LYRIC";
            E_META_EVT[E_META_EVT["MARKER"] = 6] = "MARKER";
            E_META_EVT[E_META_EVT["CUE"] = 7] = "CUE";
            E_META_EVT[E_META_EVT["END_OF_TRACK"] = 47] = "END_OF_TRACK";
            E_META_EVT[E_META_EVT["TEMPO"] = 81] = "TEMPO";
            E_META_EVT[E_META_EVT["SMPTE_OFFSET"] = 84] = "SMPTE_OFFSET";
            E_META_EVT[E_META_EVT["TIME_SIGNATURE"] = 88] = "TIME_SIGNATURE";
            E_META_EVT[E_META_EVT["KEY_SIGNATURE"] = 89] = "KEY_SIGNATURE";
            E_META_EVT[E_META_EVT["SEQUENCER_SPECIFIC_META_EVT"] = 127] = "SEQUENCER_SPECIFIC_META_EVT";
        })(music.E_META_EVT || (music.E_META_EVT = {}));
        var E_META_EVT = music.E_META_EVT;
        /*!
         */
        var CMIDIData = (function () {
            function CMIDIData() {
                this.m_nStep = 0;
                this.m_eMMsg = 0;
                this.m_eMEvt = 0;
                this.m_aryValue = [];
                this.m_numValue = 0;
                this.m_strValue = "";
            }
            return CMIDIData;
        })();
        music.CMIDIData = CMIDIData;
        /*!
         */
        var CMIDITrack = (function () {
            function CMIDITrack() {
                this.m_listData = [];
            }
            return CMIDITrack;
        })();
        music.CMIDITrack = CMIDITrack;
        /*!
         */
        var CMIDIMusic = (function () {
            function CMIDIMusic() {
                this.m_nTimeDiv = 480;
                this.m_strTitle = "";
                this.m_listTrack = [];
            }
            return CMIDIMusic;
        })();
        music.CMIDIMusic = CMIDIMusic;
    })(music = miz.music || (miz.music = {}));
})(miz || (miz = {}));
