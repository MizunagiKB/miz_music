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
        (function (E_MIDI_EV) {
            E_MIDI_EV[E_MIDI_EV["NOTE_OF"] = 128] = "NOTE_OF";
            E_MIDI_EV[E_MIDI_EV["NOTE_ON"] = 144] = "NOTE_ON";
            E_MIDI_EV[E_MIDI_EV["P_AFTER_TOUCH"] = 160] = "P_AFTER_TOUCH";
            E_MIDI_EV[E_MIDI_EV["CONTROL_CHANGE"] = 176] = "CONTROL_CHANGE";
            E_MIDI_EV[E_MIDI_EV["PROGRAM_CHANGE"] = 192] = "PROGRAM_CHANGE";
            E_MIDI_EV[E_MIDI_EV["C_AFTER_TOUCH"] = 208] = "C_AFTER_TOUCH";
            E_MIDI_EV[E_MIDI_EV["PITCH"] = 224] = "PITCH";
        })(music.E_MIDI_EV || (music.E_MIDI_EV = {}));
        var E_MIDI_EV = music.E_MIDI_EV;
        /*!
         */
        var CMIDIData = (function () {
            function CMIDIData() {
                this.m_nStep = 0;
                this.m_nTempo = 0;
                this.m_midiData = [];
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
                this.m_listTrack = [];
            }
            return CMIDIMusic;
        })();
        music.CMIDIMusic = CMIDIMusic;
    })(music = miz.music || (miz.music = {}));
})(miz || (miz = {}));
