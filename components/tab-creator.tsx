'use client';

import { useState } from 'react';
import { X, Sparkles, Save, Play } from 'lucide-react';

interface TabCreatorProps {
  onClose: () => void;
  onSave: (tab: any) => void;
  instrument: string;
}

// Technique notation for different instruments
const GUITAR_TECHNIQUES = [
  { symbol: 'h', name: 'Hammer-on', description: 'Play note then hammer finger down' },
  { symbol: 'p', name: 'Pull-off', description: 'Pull finger off to sound lower note' },
  { symbol: 'b', name: 'Bend', description: 'Bend string up (full, 1/2, 1/4, 3/4)' },
  { symbol: 'r', name: 'Release bend', description: 'Release bend back to original pitch' },
  { symbol: '/', name: 'Slide up', description: 'Slide from lower to higher fret' },
  { symbol: '\\', name: 'Slide down', description: 'Slide from higher to lower fret' },
  { symbol: '~', name: 'Vibrato', description: 'Rapid pitch variation' },
  { symbol: 'x', name: 'Mute', description: 'Muted/dead note' },
  { symbol: 'PM', name: 'Palm mute', description: 'Mute with palm of picking hand' },
  { symbol: '<>', name: 'Harmonic', description: 'Natural harmonic' },
  { symbol: 't', name: 'Tap', description: 'Right hand tapping' },
  { symbol: 'T', name: 'Tremolo picking', description: 'Rapid alternate picking' },
];

const BASS_TECHNIQUES = [
  { symbol: 'h', name: 'Hammer-on', description: 'Hammer finger down' },
  { symbol: 'p', name: 'Pull-off', description: 'Pull finger off' },
  { symbol: '/', name: 'Slide up', description: 'Slide up to note' },
  { symbol: '\\', name: 'Slide down', description: 'Slide down to note' },
  { symbol: 's', name: 'Slap', description: 'Slap with thumb' },
  { symbol: 'P', name: 'Pop', description: 'Pop with fingers' },
  { symbol: 'x', name: 'Ghost note', description: 'Muted percussive note' },
  { symbol: '~', name: 'Vibrato', description: 'Pitch variation' },
];

const DRUM_TECHNIQUES = [
  { symbol: 'X', name: 'Accent', description: 'Hit harder' },
  { symbol: 'o', name: 'Open hi-hat', description: 'Open hi-hat' },
  { symbol: '+', name: 'Closed hi-hat', description: 'Closed hi-hat' },
  { symbol: 'g', name: 'Ghost note', description: 'Very soft hit' },
  { symbol: 'f', name: 'Flam', description: 'Two notes almost together' },
  { symbol: 'd', name: 'Drag', description: 'Double stroke grace notes' },
  { symbol: 'R', name: 'Rim shot', description: 'Hit rim and head together' },
  { symbol: 'CC', name: 'Crash cymbal', description: 'Crash cymbal' },
  { symbol: 'RC', name: 'Ride cymbal', description: 'Ride cymbal' },
];

const PIANO_TECHNIQUES = [
  { symbol: 'pp', name: 'Pianissimo', description: 'Very soft' },
  { symbol: 'p', name: 'Piano', description: 'Soft' },
  { symbol: 'mp', name: 'Mezzo-piano', description: 'Moderately soft' },
  { symbol: 'mf', name: 'Mezzo-forte', description: 'Moderately loud' },
  { symbol: 'f', name: 'Forte', description: 'Loud' },
  { symbol: 'ff', name: 'Fortissimo', description: 'Very loud' },
  { symbol: 'ped', name: 'Sustain pedal', description: 'Sustain pedal down' },
  { symbol: '*', name: 'Release pedal', description: 'Release sustain pedal' },
  { symbol: '>', name: 'Accent', description: 'Emphasize note' },
  { symbol: 'tr', name: 'Trill', description: 'Rapid alternation' },
];

const VIOLIN_TECHNIQUES = [
  { symbol: '↓', name: 'Down bow', description: 'Bow moving down' },
  { symbol: '↑', name: 'Up bow', description: 'Bow moving up' },
  { symbol: 'pizz', name: 'Pizzicato', description: 'Pluck with finger' },
  { symbol: 'arco', name: 'Arco', description: 'Resume bowing' },
  { symbol: '~', name: 'Vibrato', description: 'Pitch oscillation' },
  { symbol: '<>', name: 'Harmonic', description: 'Natural harmonic' },
  { symbol: 'sul', name: 'Sul tasto', description: 'Bow near fingerboard' },
  { symbol: 'pont', name: 'Sul ponticello', description: 'Bow near bridge' },
  { symbol: 'tr', name: 'Trill', description: 'Rapid alternation' },
];

export default function TabCreator({ onClose, onSave, instrument }: TabCreatorProps) {
  const [songName, setSongName] = useState('');
  const [artistName, setArtistName] = useState('');
  const [tempo, setTempo] = useState(120);
  const [timeSignature, setTimeSignature] = useState('4/4');
  const [tuning, setTuning] = useState('Standard (E A D G B E)');
  const [capo, setCapo] = useState(0);
  const [tabContent, setTabContent] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const techniques =
    instrument === 'guitar' ? GUITAR_TECHNIQUES :
    instrument === 'bass' ? BASS_TECHNIQUES :
    instrument === 'drums' ? DRUM_TECHNIQUES :
    instrument === 'piano' ? PIANO_TECHNIQUES :
    instrument === 'violin' ? VIOLIN_TECHNIQUES :
    GUITAR_TECHNIQUES;

  async function generateWithAI() {
    if (!aiPrompt.trim()) return;

    setIsGenerating(true);

    try {
      const response = await fetch('/api/music/generate-tab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          instrument,
          tempo,
          timeSignature,
        }),
      });

      const data = await response.json();
      if (data.tab) {
        setTabContent(data.tab);
      }
    } catch (error) {
      console.error('AI generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  }

  function insertTechnique(symbol: string) {
    setTabContent(tabContent + symbol);
  }

  function handleSave() {
    const tab = {
      song: songName,
      artist: artistName,
      instrument,
      tuning,
      difficulty: 'Custom',
      tempo,
      timeSignature,
      capo,
      sections: [
        {
          name: 'Custom',
          bars: [],
        },
      ],
      tabNotation: tabContent,
    };

    onSave(tab);
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-6 text-white flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-3xl font-bold mb-1">Create Custom Tab</h2>
            <p className="text-white/90">
              Build your own tablature or use AI to help
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Song Info */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Song Name
              </label>
              <input
                type="text"
                value={songName}
                onChange={(e) => setSongName(e.target.value)}
                placeholder="Enter song name"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Artist Name
              </label>
              <input
                type="text"
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                placeholder="Enter artist name"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Settings */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tempo (BPM)</label>
              <input
                type="number"
                value={tempo}
                onChange={(e) => setTempo(Number(e.target.value))}
                min="40"
                max="200"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Time Signature
              </label>
              <select
                value={timeSignature}
                onChange={(e) => setTimeSignature(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:outline-none"
              >
                <option>4/4</option>
                <option>3/4</option>
                <option>6/8</option>
                <option>2/4</option>
                <option>5/4</option>
                <option>7/8</option>
              </select>
            </div>

            {(instrument === 'guitar' || instrument === 'bass' || instrument === 'ukulele') && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tuning</label>
                  <input
                    type="text"
                    value={tuning}
                    onChange={(e) => setTuning(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Capo</label>
                  <input
                    type="number"
                    value={capo}
                    onChange={(e) => setCapo(Number(e.target.value))}
                    min="0"
                    max="12"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:outline-none"
                  />
                </div>
              </>
            )}
          </div>

          {/* AI Assistant */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-purple-600" />
              <h3 className="text-lg font-bold text-gray-900">AI Tab Assistant</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Describe what you want to play, and AI will help create the tablature
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g., 'Simple C major chord progression' or 'Blues riff in E'"
                className="flex-1 px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-600 focus:outline-none"
              />
              <button
                onClick={generateWithAI}
                disabled={isGenerating || !aiPrompt.trim()}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Technique Shortcuts */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Technique Shortcuts</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {techniques.map((tech) => (
                <button
                  key={tech.symbol}
                  onClick={() => insertTechnique(tech.symbol)}
                  className="group relative p-3 bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-300 rounded-lg transition-all text-left"
                  title={tech.description}
                >
                  <div className="font-mono font-bold text-purple-600 text-lg mb-1">
                    {tech.symbol}
                  </div>
                  <div className="text-xs text-gray-600 truncate">{tech.name}</div>

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                    <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap">
                      {tech.description}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Editor */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tab Notation
            </label>
            <textarea
              value={tabContent}
              onChange={(e) => setTabContent(e.target.value)}
              placeholder={`Enter your tablature here...

Example for guitar:
e|---0---1---0---1---|
B|---1---0---1---0---|
G|---0---0---0---0---|
D|---2---2---2---2---|
A|---2---3---2---3---|
E|---0---0---0---0---|

Use technique symbols:
- h = hammer-on (e.g., 5h7)
- p = pull-off (e.g., 7p5)
- b = bend (e.g., 7b9 for full bend, 7b8 for 1/2 bend)
- b3/4 = 3/4 bend
- / = slide up (e.g., 5/7)
- ~ = vibrato
- PM = palm mute`}
              rows={15}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:outline-none font-mono text-sm resize-none"
            />
          </div>

          {/* Notation Guide */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
            <h4 className="font-bold text-blue-900 mb-3">Notation Examples:</h4>
            <div className="space-y-2 text-sm text-blue-800 font-mono">
              <div><strong>Bend 3/4:</strong> 7b8.5 or 7b3/4</div>
              <div><strong>Full bend:</strong> 7b9</div>
              <div><strong>Half bend:</strong> 7b8 or 7b1/2</div>
              <div><strong>Quarter bend:</strong> 7b7.5 or 7b1/4</div>
              <div><strong>Hammer-on:</strong> 5h7</div>
              <div><strong>Pull-off:</strong> 7p5</div>
              <div><strong>Slide up:</strong> 5/7</div>
              <div><strong>Vibrato:</strong> 7~</div>
              <div><strong>Palm mute section:</strong> PM----</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={!songName.trim() || !tabContent.trim()}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              Save Tab
            </button>
            <button
              onClick={onClose}
              className="px-8 py-4 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
