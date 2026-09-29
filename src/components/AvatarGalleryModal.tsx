import React, { useState, useMemo } from 'react';
import { X, Search, RefreshCw, Check, Sparkles } from 'lucide-react';
import { CRAFTWORK_SPECIAL_DATA_URL } from '../lib/craftworkAvatar';

interface AvatarGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAvatar: (url: string) => void;
  currentUrl: string;
  userSeed: string;
}

// Full DiceBear 9.x Avatar Styles categorized
const AVATAR_STYLES = [
  // Human & Notionists
  { style: 'notionists', name: 'Notionist', category: 'Human' },
  { style: 'lorelei', name: 'Lorelei', category: 'Human' },
  { style: 'open-peeps', name: 'Open Peeps', category: 'Human' },
  { style: 'avataaars', name: 'Avataaars', category: 'Human' },
  { style: 'avataaars-neutral', name: 'Avataaars Neutral', category: 'Human' },
  { style: 'micah', name: 'Micah', category: 'Human' },
  { style: 'personas', name: 'Personas', category: 'Human' },
  { style: 'miniavs', name: 'Miniavs', category: 'Human' },
  { style: 'big-ears', name: 'Big Ears', category: 'Human' },
  { style: 'big-ears-neutral', name: 'Big Ears Neutral', category: 'Human' },
  { style: 'dylan', name: 'Dylan', category: 'Human' },

  // Characters & Fantasy
  { style: 'adventurer', name: 'Adventurer', category: 'Characters' },
  { style: 'adventurer-neutral', name: 'Adventurer Neutral', category: 'Characters' },
  { style: 'croodles', name: 'Croodles', category: 'Characters' },
  { style: 'croodles-neutral', name: 'Croodles Neutral', category: 'Characters' },
  { style: 'toonies', name: 'Toonies', category: 'Characters' },
  { style: 'big-smile', name: 'Big Smile', category: 'Characters' },
  { style: 'fun-emoji', name: 'Fun Emoji', category: 'Characters' },

  // Robots & Sci-Fi
  { style: 'bottts', name: 'Bottts Robot', category: 'Robots' },
  { style: 'bottts-neutral', name: 'Bottts Neutral', category: 'Robots' },

  // Pixel & Retro
  { style: 'pixel-art', name: 'Pixel Art', category: 'Pixel' },
  { style: 'pixel-art-neutral', name: 'Pixel Neutral', category: 'Pixel' },

  // Abstract & Badges
  { style: 'thumbs', name: 'Thumbs', category: 'Abstract' },
  { style: 'identicon', name: 'Identicon', category: 'Abstract' },
  { style: 'initials', name: 'Initials', category: 'Abstract' },
  { style: 'shapes', name: 'Shapes', category: 'Abstract' },
  { style: 'rings', name: 'Rings', category: 'Abstract' },
  { style: 'glass', name: 'Glass', category: 'Abstract' },
  { style: 'spirit', name: 'Spirit', category: 'Abstract' },
];

const SEED_PREFIXES = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india', 'juliet'];

export const AvatarGalleryModal: React.FC<AvatarGalleryModalProps> = ({
  isOpen,
  onClose,
  onSelectAvatar,
  currentUrl,
  userSeed
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [seedOffset, setSeedOffset] = useState<number>(1);
  const [customInput, setCustomInput] = useState('');

  // Generate 4 seed variations per style => 30 styles * 4 = 120 avatar models + Craftwork Special = 121 models
  const allAvatars = useMemo(() => {
    const list: Array<{ id: string; name: string; style: string; category: string; url: string }> = [];

    // Always include Special Craftwork vector
    list.push({
      id: 'craftwork-special',
      name: 'Craftwork Special',
      style: 'craftwork',
      category: 'Human',
      url: CRAFTWORK_SPECIAL_DATA_URL
    });

    AVATAR_STYLES.forEach((item) => {
      // Create 4 seed variations per model style
      for (let i = 1; i <= 4; i++) {
        const seedVal = `${userSeed}-${SEED_PREFIXES[(i + seedOffset) % SEED_PREFIXES.length]}-${i}`;
        const avatarUrl = `https://api.dicebear.com/9.x/${item.style}/svg?seed=${seedVal}`;
        list.push({
          id: `${item.style}-${i}-${seedOffset}`,
          name: `${item.name} #${i}`,
          style: item.name,
          category: item.category,
          url: avatarUrl
        });
      }
    });

    return list;
  }, [userSeed, seedOffset]);

  if (!isOpen) return null;

  const categories = ['All', 'Human', 'Characters', 'Robots', 'Pixel', 'Abstract'];

  const filteredAvatars = allAvatars.filter((av) => {
    const matchesCategory = selectedCategory === 'All' || av.category === selectedCategory;
    const matchesSearch = av.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          av.style.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleRandomize = () => {
    setSeedOffset((prev) => prev + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-background border border-divider/80 rounded-3xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-divider flex items-center justify-between bg-surface">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-content flex items-center gap-2">
                Avatar Models Gallery
                <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                  {filteredAvatars.length} Models
                </span>
              </h2>
              <p className="text-[10px] text-secondary font-mono">120+ SVG styles and custom variants</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleRandomize}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-surface-accent hover:bg-divider text-secondary hover:text-content border border-divider text-xs font-semibold transition-all cursor-pointer"
              title="Shuffle avatar variations"
            >
              <RefreshCw className="w-3 h-3 text-indigo-400" />
              <span className="hidden sm:inline text-[11px]">Shuffle</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-secondary hover:text-content rounded-xl bg-surface-accent hover:bg-divider transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-3 border-b border-divider bg-background flex flex-col sm:flex-row gap-2.5 items-center justify-between">
          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 font-bold'
                    : 'bg-surface text-secondary hover:text-content hover:bg-surface-accent border border-divider'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -tranneutral-y-1/2 text-tertiary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search avatar..."
              className="w-full bg-surface border border-divider rounded-xl pl-8 pr-3 py-1.5 text-xs text-content placeholder:text-tertiary focus:outline-none focus:border-indigo-500/50 font-sans"
            />
          </div>
        </div>

        {/* Avatar Grid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2.5 bg-background">
          {filteredAvatars.map((av) => {
            const isSelected = currentUrl === av.url;
            return (
              <button
                key={av.id}
                onClick={() => {
                  onSelectAvatar(av.url);
                  onClose();
                }}
                className={`group relative flex flex-col items-center p-2 rounded-2xl border transition-all cursor-pointer bg-surface ${
                  isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-500/40 scale-105 shadow-lg shadow-indigo-600/20 bg-indigo-950/20'
                    : 'border-divider/80 hover:border-divider hover:scale-102 hover:bg-surface-accent'
                }`}
              >
                <div className="w-full aspect-square rounded-xl overflow-hidden bg-surface border border-divider flex items-center justify-center relative">
                  <img
                    src={av.url}
                    alt={av.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    loading="lazy"
                  />
                  {isSelected && (
                    <div className="absolute top-1 right-1 bg-indigo-600 text-white p-0.5 rounded-full shadow">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-medium text-secondary group-hover:text-content mt-1.5 truncate w-full text-center">
                  {av.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer with Custom URL Option */}
        <div className="p-3 border-t border-divider bg-surface flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-secondary whitespace-nowrap">Custom URL:</span>
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="https://..."
              className="bg-background border border-divider rounded-xl px-2.5 py-1 text-xs text-content w-full sm:w-72 outline-none focus:border-indigo-500"
            />
            {customInput && (
              <button
                onClick={() => {
                  onSelectAvatar(customInput);
                  onClose();
                }}
                className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold whitespace-nowrap cursor-pointer transition-colors"
              >
                Apply
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-1.5 rounded-xl bg-surface-accent hover:bg-divider text-primary text-xs font-semibold cursor-pointer transition-colors"
          >
            Close Gallery
          </button>
        </div>

      </div>
    </div>
  );
};
