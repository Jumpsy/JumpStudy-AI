'use client';

import { useState } from 'react';
import { useRef, useEffect } from 'react';
import {
  Music,
  Search,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Guitar,
  Disc,
  BookOpen,
  Plus,
  Edit3,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import TabCreator from './tab-creator';
import { createClient } from '@/lib/supabase/client';

interface MusicTab {
  id: string;
  song: string;
  artist: string;
  instrument: string;
  tab_data: any;
  source_url: string;
  created_at: string;
}

interface MusicTabsInterfaceProps {
  userId: string;
  savedTabs: MusicTab[];
  creditsBalance: number;
}

export default function MusicTabsInterface({
  userId,
  savedTabs,
  creditsBalance,
}: MusicTabsInterfaceProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInstrument, setSelectedInstrument] = useState('guitar');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentTab, setCurrentTab] = useState<any | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [tempo, setTempo] = useState(120);
  const [metronomeEnabled, setMetronomeEnabled] = useState(true);
  const [metronomeVolume, setMetronomeVolume] = useState(0.5);
  const [showTabCreator, setShowTabCreator] = useState(false);

  // Audio context for metronome
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const currentNoteRef = useRef(0);
  const timerIdRef = useRef<number | null>(null);

  const instruments = [
    { id: 'guitar', name: 'Guitar', icon: '🎸' },
    { id: 'bass', name: 'Bass', icon: '🎸' },
    { id: 'drums', name: 'Drums', icon: '🥁' },
    { id: 'piano', name: 'Piano', icon: '🎹' },
    { id: 'ukulele', name: 'Ukulele', icon: '🎸' },
    { id: 'violin', name: 'Violin', icon: '🎻' },
  ];

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);

    try {
      const [song, artist] = searchQuery.includes(' by ')
        ? searchQuery.split(' by ')
        : [searchQuery, ''];

      const response = await fetch('/api/music/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          song: song.trim(),
          artist: artist.trim(),
          instrument: selectedInstrument,
        }),
      });

      const data = await response.json();
      setSearchResults(data.sources || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }

  async function fetchTab(url: string) {
    try {
      const response = await fetch('/api/music/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          instrument: selectedInstrument,
        }),
      });

      const data = await response.json();
      if (data.tab) {
        setCurrentTab(data.tab);
        setTempo(data.tab.tempo || 120);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    }
  }

  async function handleSaveCustomTab(tab: any) {
    const supabase = createClient();

    // Save to database
    await supabase.from('music_tabs').insert({
      user_id: userId,
      song: tab.song,
      artist: tab.artist,
      instrument: tab.instrument,
      tab_data: tab,
      source_url: 'custom',
    });

    // Show the tab
    setCurrentTab(tab);
    setTempo(tab.tempo || 120);
    setShowTabCreator(false);

    // Refresh page to show in saved tabs
    window.location.reload();
  }

  // Metronome functions
  function playMetronomeClick(time: number, isDownbeat: boolean) {
    if (!audioContextRef.current || !metronomeEnabled) return;

    const osc = audioContextRef.current.createOscillator();
    const gain = audioContextRef.current.createGain();

    osc.connect(gain);
    gain.connect(audioContextRef.current.destination);

    // Higher pitch for downbeat, lower for other beats
    osc.frequency.value = isDownbeat ? 800 : 600;

    gain.gain.value = metronomeVolume;
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

    osc.start(time);
    osc.stop(time + 0.1);
  }

  function scheduleMetronome() {
    if (!audioContextRef.current) return;

    const secondsPerBeat = 60.0 / tempo;
    const lookahead = 0.1; // How frequently to schedule (100ms)
    const scheduleAheadTime = 0.1; // How far ahead to schedule (100ms)

    while (nextNoteTimeRef.current < audioContextRef.current.currentTime + scheduleAheadTime) {
      const timeSignature = currentTab?.timeSignature || '4/4';
      const beatsPerBar = parseInt(timeSignature.split('/')[0]);
      const isDownbeat = currentNoteRef.current % beatsPerBar === 0;

      playMetronomeClick(nextNoteTimeRef.current, isDownbeat);
      nextNoteTimeRef.current += secondsPerBeat;
      currentNoteRef.current++;
    }

    timerIdRef.current = window.setTimeout(scheduleMetronome, lookahead * 1000);
  }

  function startMetronome() {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    currentNoteRef.current = 0;
    nextNoteTimeRef.current = audioContextRef.current.currentTime;
    scheduleMetronome();
  }

  function stopMetronome() {
    if (timerIdRef.current) {
      clearTimeout(timerIdRef.current);
      timerIdRef.current = null;
    }
  }

  function togglePlay() {
    if (isPlaying) {
      stopMetronome();
      setIsPlaying(false);
    } else {
      startMetronome();
      setIsPlaying(true);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Tab Creator Modal */}
      {showTabCreator && (
        <TabCreator
          onClose={() => setShowTabCreator(false)}
          onSave={handleSaveCustomTab}
          instrument={selectedInstrument}
        />
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
                <Music className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Music Tabs</h1>
                <p className="text-sm text-gray-600">
                  Search, learn, and practice with animated tablature
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/tuner"
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all shadow-lg"
              >
                <Volume2 className="w-5 h-5" />
                Tuner
              </Link>
              <button
                onClick={() => setShowTabCreator(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Create Tab
              </button>
              <div className="text-sm text-gray-600">
                <span className="font-semibold">{creditsBalance.toFixed(0)}</span> credits
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <form onSubmit={handleSearch} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                What song do you want to learn?
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder='e.g., "Wonderwall by Oasis" or "Hotel California"'
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:outline-none text-lg"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Select your instrument
              </label>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {instruments.map((instrument) => (
                  <button
                    key={instrument.id}
                    type="button"
                    onClick={() => setSelectedInstrument(instrument.id)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedInstrument === instrument.id
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">{instrument.icon}</div>
                    <div className="text-sm font-medium text-gray-900">{instrument.name}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-lg text-lg"
            >
              {isSearching ? (
                <>
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Search for Tabs (20 credits)
                </>
              )}
            </button>
          </form>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Found tabs from {searchResults.length} sources:
              </h3>
              <div className="space-y-3">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Guitar className="w-5 h-5 text-purple-600" />
                      <div>
                        <div className="font-semibold text-gray-900">{result.name}</div>
                        <div className="text-xs text-gray-500">{result.url}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => fetchTab(result.url)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
                    >
                      Load Tab
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tab Player */}
        {currentTab && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Song Info */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-1">{currentTab.song}</h2>
                  <p className="text-white/90 text-lg">{currentTab.artist}</p>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <div className="text-white/70">Tuning</div>
                    <div className="font-semibold">{currentTab.tuning}</div>
                  </div>
                  <div>
                    <div className="text-white/70">Capo</div>
                    <div className="font-semibold">{currentTab.capo || 'None'}</div>
                  </div>
                  <div>
                    <div className="text-white/70">Difficulty</div>
                    <div className="font-semibold">{currentTab.difficulty}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="bg-gray-900 px-8 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCurrentTime(Math.max(0, currentTime - 1))}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <SkipBack className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={togglePlay}
                  className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-full transition-all shadow-lg"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-white" />
                  ) : (
                    <Play className="w-6 h-6 text-white" />
                  )}
                </button>
                <button
                  onClick={() => setCurrentTime(currentTime + 1)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <SkipForward className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <span className="text-white text-sm font-medium">Tempo:</span>
                  <input
                    type="range"
                    min="40"
                    max="200"
                    value={tempo}
                    onChange={(e) => setTempo(Number(e.target.value))}
                    className="w-32"
                  />
                  <span className="text-white font-mono font-bold text-sm w-12">
                    {tempo} BPM
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-white" />
                  <input type="range" min="0" max="100" defaultValue="80" className="w-24" />
                </div>
              </div>
            </div>

            {/* Tab Display - Songsterr Style */}
            <div className="p-8 bg-gray-50 overflow-x-auto">
              <div className="font-mono text-sm whitespace-pre bg-white border-2 border-gray-200 rounded-xl p-6 shadow-inner">
                <div className="mb-4 text-gray-600 text-xs">
                  {currentTab.timeSignature} | Tempo: {currentTab.tempo} BPM
                </div>
                <div className="space-y-6">
                  {currentTab.sections?.map((section: any, index: number) => (
                    <div key={index}>
                      <div className="font-bold text-purple-600 mb-2 text-base">
                        {section.name}
                      </div>
                      <div className="text-gray-900">{currentTab.tabNotation}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tab Legend */}
            <div className="bg-gray-100 px-8 py-4 border-t border-gray-200">
              <div className="flex items-center gap-8 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-gray-900">0</span> = Open string
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-gray-900">1-24</span> = Fret number
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-gray-900">h</span> = Hammer-on
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-gray-900">p</span> = Pull-off
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-gray-900">b</span> = Bend
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-gray-900">~</span> = Vibrato
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Saved Tabs */}
        {savedTabs.length > 0 && !currentTab && (
          <div className="mt-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Your Saved Tabs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.tab_data)}
                  className="group bg-white p-6 rounded-2xl shadow hover:shadow-lg transition-all border-2 border-gray-100 hover:border-purple-300 text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Music className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors truncate">
                        {tab.song}
                      </h4>
                      <p className="text-sm text-gray-600 truncate">{tab.artist}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                          {tab.instrument}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
