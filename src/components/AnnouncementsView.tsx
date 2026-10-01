import React, { useState } from 'react';
import { Volume2, Plus, X, Search, Calendar, User, ChevronLeft, ChevronRight } from 'lucide-react';
import ImageUploader from './ImageUploader';
import HoldButton from './HoldButton';
import { UserProfile, Announcement } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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


  const categories = ['All', 'Notice', 'Exam', 'Workshop', 'Result', 'News'];

  const filteredAnnouncements = [...announcements]
    .filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             item.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
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
    <div className="flex-1 flex flex-col min-h-0 bg-[var(--nb-bg)] text-[var(--nb-content)]">
      {/* Header and filters */}
      <div className="px-4 pt-4 pb-3 space-y-3 flex-shrink-0 border-b border-[var(--nb-divider)] bg-[var(--nb-surface)]">
        <div className="flex justify-between items-center gap-3">
          <div>
            <h3 className="nb-headline text-xl leading-none">Bulletin Board</h3>
            <p className="nb-label text-[11px] mt-1 text-[var(--nb-secondary)]">Department &amp; Association Circulars</p>
          </div>
          {(user.role === 'admin' || (user.role === 'associate' && user.powers?.canManageAnnouncements)) && (
            <button 
              onClick={() => setShowAddForm(true)}
              className="nb-btn text-xs py-2 px-3.5 !min-h-[38px] cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Notice</span>
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--nb-tertiary)]" />
          <input 
            type="text" 
            placeholder="Search circulars, titles, keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="nb-input !pl-10 text-xs !min-h-[40px] rounded-md"
          />
        </div>

        {/* Categories Tab Bar */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none pt-0.5">
          {categories.map((cat) => {
            const isSelected = activeCategory === cat;
            const getSelectedAnnounceCatClass = (category: string) => {
              switch (category) {
                case 'All': return 'nb-pill-yellow border-2 border-[var(--nb-ink)] shadow-[2.5px_2.5px_0_var(--nb-ink)]';
                case 'Notice': return 'nb-pill-cyan border-2 border-[var(--nb-ink)] shadow-[2.5px_2.5px_0_var(--nb-ink)]';
                case 'Exam': return 'nb-pill-coral border-2 border-[var(--nb-ink)] shadow-[2.5px_2.5px_0_var(--nb-ink)]';
                case 'Workshop': return 'nb-pill-blue border-2 border-[var(--nb-ink)] shadow-[2.5px_2.5px_0_var(--nb-ink)]';
                case 'Result': return 'nb-pill-green border-2 border-[var(--nb-ink)] shadow-[2.5px_2.5px_0_var(--nb-ink)]';
                case 'News': return 'nb-pill-pink border-2 border-[var(--nb-ink)] shadow-[2.5px_2.5px_0_var(--nb-ink)]';
                default: return 'nb-pill-yellow border-2 border-[var(--nb-ink)] shadow-[2.5px_2.5px_0_var(--nb-ink)]';
              }
            };

            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 text-xs font-mono font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-md transition-all cursor-pointer ${
                  isSelected 
                    ? getSelectedAnnounceCatClass(cat)
                    : 'bg-[var(--nb-surface-accent)] text-[var(--nb-secondary)] border-1.5 border-[var(--nb-divider)] hover:border-[var(--nb-ink)] hover:text-[var(--nb-content)]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Announcements Bulletin Feed */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-36 sm:pb-32 space-y-4">
        {filteredAnnouncements.length === 0 ? (
          <div 
            className="p-8 sm:p-10 text-center mt-4 rounded-xl bg-[var(--nb-surface)] relative overflow-hidden"
            style={{ 
              border: '2px solid var(--nb-ink)', 
              boxShadow: 'var(--shadow-hard)' 
            }}
          >
            {/* Top decorative badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-4 rounded-full nb-pill-cyan text-[var(--nb-cyan-fg)] text-xs font-mono font-bold tracking-wider uppercase border-1.5 border-black shadow-[2px_2px_0_#000]">
              <span>BULLETIN RADAR</span>
            </div>

            <div 
              className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center nb-card-yellow"
              style={{ border: '2px solid var(--nb-ink)', boxShadow: '3px 3px 0 var(--nb-ink)' }}
            >
              <Volume2 className="w-8 h-8 text-neutral-900 stroke-[2.5]" />
            </div>

            <h4 className="nb-headline text-lg sm:text-xl text-[var(--nb-content)] mb-1.5">
              {searchQuery ? 'NO MATCHING CIRCULARS' : 'ALL CAUGHT UP! NO ACTIVE NOTICES'}
            </h4>
            
            <p className="text-xs text-[var(--nb-secondary)] font-sans max-w-md mx-auto leading-relaxed mb-5">
              {searchQuery 
                ? `No circulars match "${searchQuery}". Check your keywords or clear your search query.`
                : activeCategory !== 'All'
                ? `No circulars posted under "${activeCategory}" yet. Official department circulars, timetable notices, and results will appear right here.`
                : 'All clear on the bulletin board. Check back soon for departmental circulars, semester exam updates, and guest lecture notices.'}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {(activeCategory !== 'All' || searchQuery) && (
                <button
                  type="button"
                  onClick={() => { setActiveCategory('All'); setSearchQuery(''); }}
                  className="nb-btn-ghost text-xs py-2 px-4 rounded-md cursor-pointer font-mono font-bold uppercase"
                  style={{ border: '1.5px solid var(--nb-ink)' }}
                >
                  Reset Filters
                </button>
              )}

              {(user.role === 'admin' || (user.role === 'associate' && user.powers?.canManageAnnouncements)) && (
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="nb-btn text-xs py-2 px-4 rounded-md cursor-pointer font-mono font-bold uppercase"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Post First Notice</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAnnouncements.map((item) => (
              <div 
                key={item.announcementId}
                className="p-4 sm:p-5 flex flex-col gap-3 rounded-lg bg-[var(--nb-surface)] transition-all"
                style={{ 
                  border: '2px solid var(--nb-ink)',
                  boxShadow: 'var(--shadow-hard-sm)'
                }}
              >
                <div className="flex justify-between items-start gap-2">
                  <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded border border-black shadow-[1.5px_1.5px_0_#000] uppercase ${
                    item.category === 'Exam' 
                      ? 'nb-pill-coral' 
                      : item.category === 'Workshop' 
                      ? 'nb-pill-blue'
                      : item.category === 'Result'
                      ? 'nb-pill-green'
                      : item.category === 'News'
                      ? 'nb-pill-pink'
                      : 'nb-pill-cyan'
                  }`}>
                    {item.category}
                  </span>
                  
                  <div className="flex items-center gap-1.5 text-xs text-[var(--nb-secondary)] font-mono font-medium">
                    <Calendar className="w-3.5 h-3.5 text-[var(--nb-accent)]" />
                    <span>{item.date}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="nb-headline text-base tracking-normal text-[var(--nb-content)] leading-snug">
                    {item.title}
                  </h4>
                  
                  <div className="text-sm text-[var(--nb-secondary)] leading-relaxed prose prose-sm prose-p:my-1 prose-headings:my-2 prose-headings:text-[var(--nb-content)] prose-a:text-[var(--nb-accent)] prose-a:underline max-w-none font-sans">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {item.content}
                    </ReactMarkdown>
                  </div>

                  {item.images && item.images.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 pt-1">
                      {item.images.map((img, idx) => (
                        <div 
                          key={idx} 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveImage({ urls: item.images!, index: idx });
                          }}
                          className="aspect-video rounded-md overflow-hidden cursor-pointer bg-[var(--nb-surface-accent)] hover:opacity-90 transition-opacity"
                          style={{ border: '1.5px solid var(--nb-ink)' }}
                        >
                          <img src={img} alt="Bulletin Attachment" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-[var(--nb-divider)] pt-3 mt-auto">
                  <div className="flex items-center gap-1.5 text-xs text-[var(--nb-secondary)]">
                    <User className="w-3.5 h-3.5 text-[var(--nb-accent)] flex-shrink-0" />
                    <span className="truncate">By: <strong className="text-[var(--nb-content)] font-bold">{item.author}</strong></span>
                  </div>
                  {(user.role === 'admin' || (user.role === 'associate' && user.powers?.canManageAnnouncements)) && (
                    <div>
                      <HoldButton
                        size="sm"
                        holdTime={1600}
                        radius={4}
                        backgroundColor="var(--nb-surface-accent)"
                        fillColor="var(--nb-accent)"
                        textColor="var(--nb-content)"
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
                        className="text-[10px] font-mono font-bold uppercase tracking-wider !h-7 !px-2.5 cursor-pointer"
                        style={{ border: '1.5px solid var(--nb-ink)' }}
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

      {/* CREATE BULLETIN MODAL */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 select-none">
          <div 
            className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-lg bg-[var(--nb-surface)] text-[var(--nb-content)] overflow-hidden"
            style={{ 
              border: '2px solid var(--nb-ink)',
              boxShadow: 'var(--shadow-hard-lg)'
            }}
          >
            {/* Header */}
            <div 
              className="p-3.5 sm:p-4 flex justify-between items-center flex-shrink-0 bg-[var(--nb-surface-accent)]"
              style={{ borderBottom: '2px solid var(--nb-ink)' }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-9 h-9 rounded bg-[var(--nb-surface)] flex items-center justify-center text-[var(--nb-content)] shrink-0"
                  style={{ border: '1.5px solid var(--nb-ink)', boxShadow: '2px 2px 0 var(--nb-ink)' }}
                >
                  <Volume2 className="w-4.5 h-4.5 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="nb-headline text-base text-[var(--nb-content)] truncate">Publish Notice Bulletin</h3>
                    <span
                      className="nb-tag text-[10px] font-mono font-bold bg-[var(--nb-accent)] text-black"
                      style={{ border: '1px solid var(--nb-ink)' }}
                    >
                      BROADCAST
                    </span>
                  </div>
                  <p className="nb-label text-[10px] text-[var(--nb-secondary)] truncate">BROADCASTING TO REAL-TIME DEPARTMENT FEED</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowAddForm(false)}
                className="nb-btn-close shrink-0"
                title="Close"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateNotice} className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
              <div>
                <label className="nb-label text-[10px] block mb-1">Notice Title *</label>
                <input 
                  type="text" 
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Mid Exams Schedule or Results Out"
                  className="nb-input text-xs"
                />
              </div>

              <div>
                <label className="nb-label text-[10px] block mb-1">Bulletin Category *</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="nb-input text-xs cursor-pointer"
                >
                  <option value="Notice">Notice</option>
                  <option value="Exam">Exam</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Result">Result</option>
                  <option value="News">News</option>
                </select>
              </div>

              <div>
                <label className="nb-label text-[10px] block mb-1">Notice Description / Content *</label>
                
                <textarea 
                  id="bulletin-content-textarea"
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Draft clear directions, instructions, dates, or contact person details..."
                  className="nb-input text-xs"
                />
              </div>

              <div>
                <label className="nb-label text-[10px] block mb-1">Optional Attachments</label>
                <ImageUploader 
                  maxFiles={4} 
                  onUploadSuccess={setImages} 
                  buttonLabel="Attach Images" 
                />
              </div>

              <button 
                type="submit"
                className="nb-btn w-full mt-2 cursor-pointer"
              >
                Broadcast Bulletin Notice
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {activeImage && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col">
          <div className="flex justify-between items-center p-4 border-b border-white/20 bg-black/80">
            <span className="nb-label text-white">
              {activeImage.index + 1} / {activeImage.urls.length}
            </span>
            <button 
              onClick={() => setActiveImage(null)}
              className="p-2 rounded bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 flex items-center justify-center relative p-4">
            {activeImage.urls.length > 1 && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImage(prev => prev ? { ...prev, index: prev.index > 0 ? prev.index - 1 : prev.urls.length - 1 } : null);
                }}
                className="absolute left-4 p-3 bg-black/70 hover:bg-black text-white rounded border border-white/20 cursor-pointer"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <img 
              src={activeImage.urls[activeImage.index]} 
              alt="Fullscreen attachment"
              className="max-w-full max-h-full object-contain rounded-md border border-white/20"
            />

            {activeImage.urls.length > 1 && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImage(prev => prev ? { ...prev, index: prev.index < prev.urls.length - 1 ? prev.index + 1 : 0 } : null);
                }}
                className="absolute right-4 p-3 bg-black/70 hover:bg-black text-white rounded border border-white/20 cursor-pointer"
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
