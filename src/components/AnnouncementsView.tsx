import React, { useState } from 'react';
import { Volume2, Plus, X, Search, Calendar, User, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import ImageUploader from './ImageUploader';
import HoldButton from './HoldButton';
import { UserProfile, Announcement } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bold, Italic, List, ListOrdered, Link, Heading1, Heading2, Quote, Code } from 'lucide-react';
import { createAnnouncement, deleteAnnouncement } from '../firebase';

interface AnnouncementsViewProps {
  user: UserProfile;
  announcements: Announcement[];
  refreshAnnouncements: () => void;
}

export default function AnnouncementsView({ 
  user, 
  announcements, 
  refreshAnnouncements
}: AnnouncementsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [showAddForm, setShowAddForm] = useState(false);

  // Add Notice fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'Exam' | 'Workshop' | 'Result' | 'Notice' | 'News'>('Notice');
  const [images, setImages] = useState<string[]>([]);
  
  const [activeImage, setActiveImage] = useState<{urls: string[], index: number} | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('bulletin-content-textarea') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = content;
    const selectedText = text.substring(start, end);
    
    const newText = text.substring(0, start) + prefix + selectedText + suffix + text.substring(end);
    setContent(newText);
    
    // Reset focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };


  const categories = ['All', 'Notice', 'Exam', 'Workshop', 'Result', 'News'];

  const filteredAnnouncements = [...announcements]
    .filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             item.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      // Extract timestamps if they exist in the ID, fallback to date string comparison
      const tsA = parseInt(a.announcementId.split('_')[1] || '0', 10);
      const tsB = parseInt(b.announcementId.split('_')[1] || '0', 10);
      if (tsA && tsB) return tsB - tsA;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    try {
      const announceId = `announce_${Date.now()}`;
      const newNotice: Announcement = {
        announcementId: announceId,
        title,
        content,
        category,
        date: new Date().toISOString().split('T')[0],
        author: user.role === 'admin' ? 'HOD Office' : user.position || user.name,
        images: images.length > 0 ? images : undefined
      };
      await createAnnouncement(newNotice);
      // Create Push Notification
      // Reset
      setTitle('');
      setContent('');
      setImages([]);
      setShowAddForm(false);
      refreshAnnouncements();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background">
      {/* Header and filters */}
      <div className="px-4 pt-4 pb-2 space-y-3 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-display font-extrabold text-content tracking-tight">Bulletin Board</h3>
            <p className="text-[11px] text-secondary mt-0.5">Department & Association Circulars</p>
          </div>
          {(user.role === 'admin' || (user.role === 'associate' && user.powers?.canManageAnnouncements)) && (
            <button 
              onClick={() => setShowAddForm(true)}
              className="ref-pill-button text-xs font-bold py-2 px-4 shadow-lg shadow-rose-500/30 active:scale-95 transition-all cursor-pointer"
            >
              <div className="ref-icon-bubble w-5 h-5">
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <span>Add Notice</span>
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
          <input 
            type="text" 
            placeholder="Search circulars, titles, keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-accent/60 backdrop-blur-md border border-divider focus:border-rose-500/50 text-xs text-content placeholder:text-secondary rounded-full py-2.5 pl-10 pr-4 outline-none transition-all shadow-inner"
          />
        </div>

        {/* Categories Tab Bar */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 text-[11px] font-bold px-3.5 py-1.5 rounded-full border transition-all cursor-pointer ${
                activeCategory === cat 
                  ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white border-transparent shadow-md shadow-rose-500/25' 
                  : 'bg-surface-accent/50 text-secondary border-divider/60 hover:text-content hover:bg-surface-accent'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Announcements Bulletin Feed */}
      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-36 sm:pb-32 space-y-4">
        {filteredAnnouncements.length === 0 ? (
          <div className="ref-card p-8 text-center mt-6">
            <Volume2 className="w-10 h-10 text-rose-400 mx-auto mb-2 opacity-80 animate-float" />
            <p className="text-xs text-secondary font-medium">No notices found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAnnouncements.map((item) => (
            <div 
              key={item.announcementId}
              className="ref-card p-4 sm:p-5 flex flex-col gap-3 hover:border-rose-500/30 transition-all duration-200"
            >
              <div className="flex justify-between items-start">
                <span className={`text-[10px] font-sans font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${
                  item.category === 'Exam' 
                    ? 'bg-rose-500/20 text-rose-300 border-rose-400/30' 
                    : item.category === 'Workshop' 
                    ? 'bg-violet-500/20 text-violet-300 border-violet-400/30'
                    : item.category === 'Result'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                    : 'bg-pink-500/20 text-pink-300 border-pink-400/30'
                }`}>
                  {item.category}
                </span>
                
                <div className="flex items-center gap-1.5 text-[10px] text-secondary font-sans font-medium">
                  <Calendar className="w-3.5 h-3.5 text-rose-400" />
                  {item.date}
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-display font-bold text-content tracking-tight leading-snug">{item.title}</h4>
                
                <div className="text-[11px] text-secondary leading-relaxed mb-2 prose prose-invert prose-p:my-1 prose-headings:my-2 prose-headings:text-content prose-a:text-indigo-400 max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {item.content}
                  </ReactMarkdown>
                </div>

                {item.images && item.images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                    {item.images.map((img, idx) => (
                      <div 
                        key={idx} 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImage({ urls: item.images!, index: idx });
                        }}
                        className="aspect-video rounded-lg overflow-hidden border border-divider bg-surface cursor-pointer hover:border-indigo-500/50 transition-colors"
                      >
                        <img src={img} alt="Bulletin Attachment" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-divider/80 pt-2">
                <div className="flex items-center gap-1.5 text-[10px] text-secondary">
                  <User className="w-3 h-3 text-indigo-400" />
                  <span>Issued by: <span className="text-primary font-semibold">{item.author}</span></span>
                </div>
                {(user.role === 'admin' || (user.role === 'associate' && user.powers?.canManageAnnouncements)) && (
                  <div>
                    <HoldButton
                      size="sm"
                      holdTime={1600}
                      radius={8}
                      backgroundColor="rgba(244, 63, 94, 0.1)"
                      fillColor="#e11d48"
                      textColor="#fda4af"
                      fillTextColor="#ffffff"
                      doneLabel="Deleted"
                      onHold={async () => {
                        try {
                          await deleteAnnouncement(item.announcementId);
                          refreshAnnouncements();
                        } catch (err) {
                          console.error("Failed to delete notice", err);
                        }
                      }}
                      className="border border-rose-500/25 text-[9px] font-bold uppercase tracking-wider !h-7 !px-2.5"
                    >
                      Hold to Delete
                    </HoldButton>
                  </div>
                )}
              </div>
            </div>
          ))}
          </div>
        )}
      </div>

      {/* CREATE BULLETIN OVERLAY FORM */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex flex-col justify-end md:justify-center md:items-center p-0 md:p-6 select-none">
          <div className="bg-background rounded-t-[28px] md:rounded-[28px] border-t md:border border-divider/80 h-[80%] md:h-auto md:max-h-[85vh] w-full md:max-w-2xl flex flex-col overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-3.5 border-b border-divider flex justify-between items-center flex-shrink-0 bg-surface">
              <h3 className="text-xs font-extrabold uppercase text-primary tracking-wider">Publish Notice Bulletin</h3>
              <button 
                onClick={() => setShowAddForm(false)}
                className="w-7.5 h-7.5 rounded-full bg-surface-accent flex items-center justify-center text-secondary hover:text-content border border-divider cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateNotice} className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Notice Title *</label>
                <input 
                  type="text" 
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Mid Exams Schedule or Results Out"
                  className="w-full bg-surface border border-divider text-xs text-content rounded-lg py-2 px-3 outline-none focus:border-indigo-500/50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Bulletin Category *</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-surface border border-divider text-xs text-primary rounded-lg py-2 px-2 outline-none focus:border-indigo-500/50"
                >
                  <option value="Notice">Notice</option>
                  <option value="Exam">Exam</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Result">Result</option>
                  <option value="News">News</option>
                </select>
              </div>

              
              <div>
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Notice Description / Content *</label>
                
                {/* Markdown Formatting Toolbar */}
                <div className="flex flex-wrap items-center gap-1 bg-surface border border-divider border-b-0 rounded-t-lg p-1.5">
                  <button type="button" onClick={() => insertFormatting('**', '**')} className="p-1.5 hover:bg-surface-accent rounded text-secondary hover:text-primary transition-colors" title="Bold"><Bold className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => insertFormatting('*', '*')} className="p-1.5 hover:bg-surface-accent rounded text-secondary hover:text-primary transition-colors" title="Italic"><Italic className="w-3.5 h-3.5" /></button>
                  <div className="w-px h-4 bg-divider mx-1"></div>
                  <button type="button" onClick={() => insertFormatting('# ', '')} className="p-1.5 hover:bg-surface-accent rounded text-secondary hover:text-primary transition-colors" title="Heading 1"><Heading1 className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => insertFormatting('## ', '')} className="p-1.5 hover:bg-surface-accent rounded text-secondary hover:text-primary transition-colors" title="Heading 2"><Heading2 className="w-3.5 h-3.5" /></button>
                  <div className="w-px h-4 bg-divider mx-1"></div>
                  <button type="button" onClick={() => insertFormatting('- ', '')} className="p-1.5 hover:bg-surface-accent rounded text-secondary hover:text-primary transition-colors" title="Bullet List"><List className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => insertFormatting('1. ', '')} className="p-1.5 hover:bg-surface-accent rounded text-secondary hover:text-primary transition-colors" title="Numbered List"><ListOrdered className="w-3.5 h-3.5" /></button>
                  <div className="w-px h-4 bg-divider mx-1"></div>
                  <button type="button" onClick={() => insertFormatting('>', '')} className="p-1.5 hover:bg-surface-accent rounded text-secondary hover:text-primary transition-colors" title="Quote"><Quote className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => insertFormatting('`', '`')} className="p-1.5 hover:bg-surface-accent rounded text-secondary hover:text-primary transition-colors" title="Code"><Code className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => insertFormatting('[', '](url)')} className="p-1.5 hover:bg-surface-accent rounded text-secondary hover:text-primary transition-colors" title="Link"><Link className="w-3.5 h-3.5" /></button>
                </div>
                
                <textarea 
                  id="bulletin-content-textarea"
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Draft clear directions, instructions, dates, or contact person details..."
                  className="w-full bg-surface border border-divider text-xs text-content rounded-b-lg py-2 px-3 outline-none resize-none focus:border-indigo-500/50"
                />
              </div>


              <div>
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Optional Attachments</label>
                <ImageUploader 
                  maxFiles={4} 
                  onUploadSuccess={setImages} 
                  buttonLabel="Attach Images" 
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl py-3 shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center cursor-pointer mt-1"
              >
                Broadcast Bulletin Notice
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {activeImage && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex flex-col">
          <div className="flex justify-between items-center p-4 border-b border-white/10 bg-black/50">
            <span className="text-sm font-bold text-secondary">
              {activeImage.index + 1} / {activeImage.urls.length}
            </span>
            <button 
              onClick={() => setActiveImage(null)}
              className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-content" />
            </button>
          </div>
          
          <div className="flex-1 flex items-center justify-center relative p-4">
            {activeImage.urls.length > 1 && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImage(prev => prev ? { ...prev, index: prev.index > 0 ? prev.index - 1 : prev.urls.length - 1 } : null);
                }}
                className="absolute left-4 p-3 bg-black/50 hover:bg-black/80 rounded-full text-content backdrop-blur-sm transition-all"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <img 
              src={activeImage.urls[activeImage.index]} 
              alt="Fullscreen attachment"
              className="max-w-full max-h-full object-contain rounded-lg"
            />

            {activeImage.urls.length > 1 && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImage(prev => prev ? { ...prev, index: prev.index < prev.urls.length - 1 ? prev.index + 1 : 0 } : null);
                }}
                className="absolute right-4 p-3 bg-black/50 hover:bg-black/80 rounded-full text-content backdrop-blur-sm transition-all"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
