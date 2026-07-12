import React, { useState } from 'react';
import { Settings, X, RotateCcw, Save, Download, Upload, Copy, Check, Heart } from 'lucide-react';
import { AppConfig } from '../types';
import { defaultConfig } from '../data/defaultConfig';

interface PersonalizationPanelProps {
  config: AppConfig;
  onSave: (newConfig: AppConfig) => void;
  onReset: () => void;
  isFullPage?: boolean;
  onBack?: () => void;
}

export const PersonalizationPanel: React.FC<PersonalizationPanelProps> = ({ config, onSave, onReset, isFullPage = false, onBack }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [localConfig, setLocalConfig] = useState<AppConfig>({ ...config });
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  
  // Track active sub-tabs in customizer
  const [activeTab, setActiveTab] = useState<'basic' | 'timeline' | 'gallery' | 'clues' | 'letter' | 'reasons'>('basic');

  const triggerStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => {
      setStatusMsg(null);
    }, 4000);
  };

  const handleInputChange = (field: keyof AppConfig, value: any) => {
    setLocalConfig((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedChange = (field: 'timeline' | 'gallery' | 'clues' | 'futureWishes', index: number, nestedField: string, value: any) => {
    setLocalConfig((prev) => {
      const arr = [...(prev[field] as any[])];
      arr[index] = {
        ...arr[index],
        [nestedField]: value
      };
      return {
        ...prev,
        [field]: arr
      };
    });
  };

  const handleAddReason = () => {
    setLocalConfig((prev) => ({
      ...prev,
      reasons: [...prev.reasons, "A beautiful new reason..."]
    }));
  };

  const handleReasonChange = (index: number, val: string) => {
    setLocalConfig((prev) => {
      const arr = [...prev.reasons];
      arr[index] = val;
      return {
        ...prev,
        reasons: arr
      };
    });
  };

  const handleRemoveReason = (index: number) => {
    setLocalConfig((prev) => {
      const arr = prev.reasons.filter((_, idx) => idx !== index);
      return {
        ...prev,
        reasons: arr
      };
    });
  };

  const handleSave = () => {
    onSave(localConfig);
    if (isFullPage) {
      if (onBack) onBack();
    } else {
      setIsOpen(false);
    }
  };

  // Export JSON File
  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localConfig, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `birthday_story_${localConfig.herName}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON File
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.herName && parsed.specialDate) {
          setLocalConfig(parsed);
          onSave(parsed);
          triggerStatus("Successfully imported customized configuration! 🎉", "success");
        } else {
          triggerStatus("Invalid configuration structure.", "error");
        }
      } catch (err) {
        triggerStatus("Failed to parse JSON file.", "error");
      }
    };
    reader.readAsText(file);
  };

  // Compress & copy shareable URL link containing custom configuration
  const handleCopyShareLink = () => {
    try {
      const jsonStr = JSON.stringify(localConfig);
      // Base64 encode the config string to pass inside URL hash
      const base64Config = btoa(unescape(encodeURIComponent(jsonStr)));
      const shareUrl = `${window.location.origin}${window.location.pathname}#config=${base64Config}`;
      
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      triggerStatus("Share link copied to clipboard! 📋", "success");
    } catch (e) {
      triggerStatus("Failed to create shareable link.", "error");
    }
  };

  return (
    <>
      {/* Floating Sparkle Heart Settings Trigger */}
      {!isFullPage && (
        <button
          onClick={() => {
            setLocalConfig({ ...config });
            setIsOpen(true);
          }}
          className="fixed bottom-6 right-6 z-40 p-4 rounded-full bg-gradient-to-tr from-yellow-500/80 to-pink-500/80 text-white shadow-xl backdrop-blur-md cursor-pointer hover:scale-110 active:scale-95 transition-all flex items-center justify-center border border-white/20 group"
          id="open-customizer-btn"
          title="Personalize her birthday website"
        >
          <Settings size={22} className="animate-spin-[duration:10s] group-hover:rotate-90 transition-transform" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 text-xs font-semibold uppercase tracking-wider pl-0 group-hover:pl-2">
            Personalize ✨
          </span>
        </button>
      )}

      {/* Slide-out Customizer Panel or Full Page Content */}
      {(isOpen || isFullPage) && (
        <div 
          className={isFullPage ? "w-full max-w-2xl mx-auto bg-[#1b0815] border border-pink-900/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[85vh] md:h-[80vh] relative text-white" : "fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm"} 
          id={isFullPage ? "fullpage-customizer" : "customizer-panel-overlay"}
        >
          <div className={isFullPage ? "w-full h-full flex flex-col relative" : "w-full max-w-xl bg-[#1b0815] border-l border-pink-900/30 text-white h-full flex flex-col shadow-2xl relative animate-in slide-in-from-right duration-300"}>
            
            {/* Header */}
            <div className="p-6 border-b border-pink-950 flex items-center justify-between bg-[#12040e]">
              <div className="flex items-center gap-2">
                <Heart className="text-pink-400 fill-pink-400 animate-pulse" size={18} />
                <h2 className="font-serif text-lg font-semibold tracking-wide text-yellow-100">
                  Birthday Customization Studio
                </h2>
              </div>
              <button
                onClick={() => {
                  if (isFullPage) {
                    if (onBack) onBack();
                  } else {
                    setIsOpen(false);
                  }
                }}
                className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sub Tabs navigation */}
            <div className="flex bg-[#0d030a] border-b border-pink-950/40 p-2 overflow-x-auto no-scrollbar gap-1 text-xs">
              {(['basic', 'timeline', 'gallery', 'clues', 'letter', 'reasons'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-md font-medium capitalize shrink-0 transition ${
                    activeTab === tab 
                      ? 'bg-gradient-to-tr from-yellow-500/30 to-pink-500/30 text-yellow-200 border border-yellow-500/20' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Inline Status Message Banner */}
            {statusMsg && (
              <div className={`px-6 py-2.5 text-xs text-center font-medium transition-all ${
                statusMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-300 border-b border-emerald-500/20' : 'bg-red-500/10 text-red-300 border-b border-red-500/20'
              }`}>
                {statusMsg.text}
              </div>
            )}

            {/* Editable Content Workspace */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
              
              {/* BASIC SETTINGS TAB */}
              {activeTab === 'basic' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-pink-400/80 mb-2">Basic Info</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Her Name</label>
                      <input
                        type="text"
                        value={localConfig.herName}
                        onChange={(e) => handleInputChange('herName', e.target.value)}
                        className="w-full bg-[#0d030a] border border-pink-950/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Your Name</label>
                      <input
                        type="text"
                        value={localConfig.yourName}
                        onChange={(e) => handleInputChange('yourName', e.target.value)}
                        className="w-full bg-[#0d030a] border border-pink-950/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Our Special Date (Unlock Password)
                    </label>
                    <input
                      type="text"
                      value={localConfig.specialDate}
                      onChange={(e) => handleInputChange('specialDate', e.target.value)}
                      className="w-full bg-[#0d030a] border border-pink-950/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500 font-mono"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      Case-insensitive. e.g., "21/04/2023" or any custom phrase like "coffee" or "paris".
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Custom MP3 Audio URL (Optional)
                    </label>
                    <input
                      type="text"
                      value={localConfig.songUrl}
                      onChange={(e) => handleInputChange('songUrl', e.target.value)}
                      placeholder="e.g. https://domain.com/love_song.mp3"
                      className="w-full bg-[#0d030a] border border-pink-950/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500 font-mono"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      Leave empty to use our gorgeous built-in procedural Web Audio Ghibli piano loops!
                    </p>
                  </div>
                </div>
              )}

              {/* TIMELINE TAB */}
              {activeTab === 'timeline' && (
                <div className="space-y-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-pink-400/80 mb-2">Our Relationship Journey</h3>
                  {localConfig.timeline.map((chap, idx) => (
                    <div key={chap.id} className="p-4 rounded-xl bg-[#0d030a] border border-pink-950/40 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-yellow-400 uppercase tracking-widest">Chapter {idx + 1}</span>
                        <input
                          type="text"
                          value={chap.date}
                          onChange={(e) => handleNestedChange('timeline', idx, 'date', e.target.value)}
                          className="bg-transparent border-b border-transparent hover:border-pink-900 focus:border-pink-500 text-xs text-right font-mono outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[11px] text-gray-400">Chapter Title</label>
                        <input
                          type="text"
                          value={chap.title}
                          onChange={(e) => handleNestedChange('timeline', idx, 'title', e.target.value)}
                          className="w-full bg-[#130510] border border-pink-950/40 rounded-md px-3 py-1.5 text-sm outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[11px] text-gray-400">Memory Story</label>
                        <textarea
                          rows={3}
                          value={chap.story}
                          onChange={(e) => handleNestedChange('timeline', idx, 'story', e.target.value)}
                          className="w-full bg-[#130510] border border-pink-950/40 rounded-md px-3 py-1.5 text-xs outline-none resize-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[11px] text-gray-400">Memory Unsplash/Photo URL</label>
                        <input
                          type="text"
                          value={chap.image}
                          onChange={(e) => handleNestedChange('timeline', idx, 'image', e.target.value)}
                          className="w-full bg-[#130510] border border-pink-950/40 rounded-md px-3 py-1.5 text-xs outline-none font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* GALLERY TAB */}
              {activeTab === 'gallery' && (
                <div className="space-y-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-pink-400/80 mb-2">Museum of Memories (Polaroids)</h3>
                  {localConfig.gallery.map((g, idx) => (
                    <div key={g.id} className="p-4 rounded-xl bg-[#0d030a] border border-pink-950/40 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-yellow-400 uppercase tracking-widest">Polaroid {idx + 1}</span>
                        <input
                          type="text"
                          value={g.date}
                          onChange={(e) => handleNestedChange('gallery', idx, 'date', e.target.value)}
                          className="bg-transparent border-b border-transparent hover:border-pink-900 focus:border-pink-500 text-xs text-right font-mono outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] text-gray-400 mb-1">Title</label>
                          <input
                            type="text"
                            value={g.title}
                            onChange={(e) => handleNestedChange('gallery', idx, 'title', e.target.value)}
                            className="w-full bg-[#130510] border border-pink-950/40 rounded-md px-2.5 py-1 text-sm outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-gray-400 mb-1">Photo URL</label>
                          <input
                            type="text"
                            value={g.image}
                            onChange={(e) => handleNestedChange('gallery', idx, 'image', e.target.value)}
                            className="w-full bg-[#130510] border border-pink-950/40 rounded-md px-2.5 py-1 text-xs outline-none font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] text-gray-400 mb-1">Description Caption</label>
                        <input
                          type="text"
                          value={g.description}
                          onChange={(e) => handleNestedChange('gallery', idx, 'description', e.target.value)}
                          className="w-full bg-[#130510] border border-pink-950/40 rounded-md px-3 py-1.5 text-xs outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-gray-400 mb-1">Voice Surprise Transcript (Subtitles)</label>
                        <input
                          type="text"
                          value={g.voiceText || ""}
                          onChange={(e) => handleNestedChange('gallery', idx, 'voiceText', e.target.value)}
                          className="w-full bg-[#130510] border border-pink-950/40 rounded-md px-3 py-1.5 text-xs outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* CLUES TAB */}
              {activeTab === 'clues' && (
                <div className="space-y-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-pink-400/80 mb-2">Treasure Hunt Clues</h3>
                  {localConfig.clues.map((c, idx) => (
                    <div key={c.id} className="p-4 rounded-xl bg-[#0d030a] border border-pink-950/40 space-y-3">
                      <span className="text-xs font-semibold text-yellow-400 uppercase tracking-widest block">Clue {idx + 1}: {c.title}</span>
                      <div>
                        <label className="block text-[11px] text-gray-400 mb-1">Title Name</label>
                        <input
                          type="text"
                          value={c.title}
                          onChange={(e) => handleNestedChange('clues', idx, 'title', e.target.value)}
                          className="w-full bg-[#130510] border border-pink-950/40 rounded-md px-3 py-1 text-sm outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-gray-400 mb-1">The Clue Riddle</label>
                        <textarea
                          rows={2}
                          value={c.clue}
                          onChange={(e) => handleNestedChange('clues', idx, 'clue', e.target.value)}
                          className="w-full bg-[#130510] border border-pink-950/40 rounded-md px-3 py-1 text-xs outline-none resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] text-gray-400 mb-1">Hint</label>
                          <input
                            type="text"
                            value={c.hint}
                            onChange={(e) => handleNestedChange('clues', idx, 'hint', e.target.value)}
                            className="w-full bg-[#130510] border border-pink-950/40 rounded-md px-2.5 py-1 text-xs outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-gray-400 mb-1">Required Answer (Case-insensitive)</label>
                          <input
                            type="text"
                            value={c.answer}
                            onChange={(e) => handleNestedChange('clues', idx, 'answer', e.target.value)}
                            className="w-full bg-[#130510] border border-pink-950/40 rounded-md px-2.5 py-1 text-xs outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] text-gray-400 mb-1">Unlocked Secret Message</label>
                        <input
                          type="text"
                          value={c.secretMessage}
                          onChange={(e) => handleNestedChange('clues', idx, 'secretMessage', e.target.value)}
                          className="w-full bg-[#130510] border border-pink-950/40 rounded-md px-3 py-1 text-xs outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-gray-400 mb-1">Unlocked Clue Image URL / Path (e.g. /images/VIDEOCALL.jpeg)</label>
                        <input
                          type="text"
                          value={c.secretImage}
                          onChange={(e) => handleNestedChange('clues', idx, 'secretImage', e.target.value)}
                          className="w-full bg-[#130510] border border-pink-950/40 rounded-md px-3 py-1 text-xs outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* LETTER TAB */}
              {activeTab === 'letter' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-pink-400/80 mb-2">Love Letter (Markdown Support)</h3>
                  <p className="text-[10px] text-gray-400">
                    This letter unfolds with an elegant wax seal. Supports bold, italic, lists, and line breaks.
                  </p>
                  <textarea
                    rows={12}
                    value={localConfig.letterText}
                    onChange={(e) => handleInputChange('letterText', e.target.value)}
                    className="w-full bg-[#0d030a] border border-pink-950/40 rounded-lg p-4 text-xs font-mono outline-none focus:border-pink-500 resize-y"
                  />
                </div>
              )}

              {/* REASONS TAB */}
              {activeTab === 'reasons' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-pink-400/80">Reasons I Love You</h3>
                    <button
                      onClick={handleAddReason}
                      className="px-2 py-1 bg-pink-500 text-white rounded text-[11px] hover:bg-pink-400 font-semibold cursor-pointer"
                    >
                      + Add Reason
                    </button>
                  </div>
                  <div className="space-y-3">
                    {localConfig.reasons.map((reason, idx) => (
                      <div key={idx} className="flex gap-2 items-center bg-[#0d030a] border border-pink-950/40 p-2 rounded-lg">
                        <span className="text-[10px] font-mono text-yellow-400/80 w-6 text-center">{idx + 1}</span>
                        <input
                          type="text"
                          value={reason}
                          onChange={(e) => handleReasonChange(idx, e.target.value)}
                          className="flex-1 bg-transparent text-xs outline-none border-b border-transparent hover:border-pink-900 focus:border-pink-500 py-0.5"
                        />
                        <button
                          onClick={() => handleRemoveReason(idx)}
                          className="p-1 rounded text-red-400 hover:bg-red-500/10 text-xs cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Actions Footer */}
            <div className="p-6 border-t border-pink-950 bg-[#0d030a] space-y-4">
              {showConfirmReset ? (
                <div className="bg-[#240616] border border-red-500/30 p-3 rounded-lg text-center space-y-3">
                  <p className="text-xs text-red-200">Reset website back to default story and settings?</p>
                  <div className="flex justify-center gap-2 text-xs">
                    <button
                      onClick={() => {
                        onReset();
                        setLocalConfig({ ...defaultConfig });
                        setShowConfirmReset(false);
                        if (isFullPage) {
                          if (onBack) onBack();
                        } else {
                          setIsOpen(false);
                        }
                        triggerStatus("Reset completed!", "success");
                      }}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded font-semibold cursor-pointer"
                    >
                      Yes, Reset
                    </button>
                    <button
                      onClick={() => setShowConfirmReset(false)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <button
                      onClick={handleCopyShareLink}
                      className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-pink-700/80 hover:bg-pink-600 text-white font-medium transition active:scale-95 cursor-pointer border border-pink-500/30"
                    >
                      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      {copied ? "Link Copied!" : "Copy Share Link"}
                    </button>
                    <button
                      onClick={handleExport}
                      className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#240c1b] hover:bg-[#341227] text-white font-medium transition active:scale-95 cursor-pointer border border-pink-900/20"
                    >
                      <Download size={14} />
                      Export JSON
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <label className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md bg-[#240c1b] hover:bg-[#341227] text-white font-medium transition cursor-pointer border border-pink-900/20">
                      <Upload size={13} />
                      Import
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        className="hidden"
                      />
                    </label>
                    <button
                      onClick={() => setShowConfirmReset(true)}
                      className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md bg-[#240c1b] hover:bg-[#341227] text-red-300 font-medium transition cursor-pointer border border-pink-900/20"
                    >
                      <RotateCcw size={13} />
                      Reset
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md bg-gradient-to-tr from-yellow-500 to-pink-500 hover:brightness-110 text-white font-semibold transition active:scale-95 cursor-pointer col-span-1 shadow-lg shadow-pink-500/10"
                    >
                      <Save size={13} />
                      Save
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
};
