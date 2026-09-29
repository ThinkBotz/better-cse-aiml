import React, { useState } from 'react';
import { UserProfile, Album } from '../types';
import { addAlbum, deleteAlbum, updateAlbum } from '../firebase';
import { 
  Image as ImageIcon, 
  X, 
  Plus, 
  Calendar, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  Edit3, 
  Upload, 
  Check, 
  AlertTriangle, 
  Link as LinkIcon,
  Sparkles,
  Loader2
} from 'lucide-react';
import ImageUploader from './ImageUploader';
import HoldButton from './HoldButton';

interface GalleryViewProps {
  user: UserProfile;
  albums: Album[];
  refreshData: () => void;
}

export default function GalleryView({ user, albums, refreshData }: GalleryViewProps) {
  const isAdminOrCoordinator = Boolean(
    user.role === 'admin' || 
    user.role === 'coordinator' || 
    user.role === 'president' || 
    user.powers?.canManageGallery
  );

  const canModifyAlbum = (album?: Album | null) => {
    if (!album) return false;
    return Boolean(
      isAdminOrCoordinator || 
      (album.uploadedBy && album.uploadedBy.toLowerCase() === user.name.toLowerCase())
    );
  };
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState<number | null>(null);
  
  // Create Album Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Album['category']>('Cultural Events');
  const [images, setImages] = useState<string[]>([]);
  const [createUrlInput, setCreateUrlInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Edit Album Form State
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState<Album['category']>('Cultural Events');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editThumbnailUrl, setEditThumbnailUrl] = useState('');
  const [editUrlInput, setEditUrlInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState('');

  // Confirmation Modals State
  const [albumToDelete, setAlbumToDelete] = useState<Album | null>(null);
  const [photoToDeleteIdx, setPhotoToDeleteIdx] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Open Edit Modal
  const openEditModal = (album: Album, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingAlbum(album);
    setEditTitle(album.title);
    setEditDescription(album.description);
    setEditCategory(album.category);
    setEditImages([...album.images]);
    setEditThumbnailUrl(album.thumbnailUrl || album.images[0] || '');
    setEditUrlInput('');
    setEditError('');
  };

  // Add photo via URL in Create Modal
  const handleAddCreateUrl = () => {
    const trimmed = createUrlInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setError('Please provide a valid web image URL starting with http:// or https://');
      return;
    }
    setImages(prev => [...prev, trimmed]);
    setCreateUrlInput('');
    setError('');
  };

  // Add photo via URL in Edit Modal
  const handleAddEditUrl = () => {
    const trimmed = editUrlInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setEditError('Please provide a valid web image URL starting with http:// or https://');
      return;
    }
    setEditImages(prev => [...prev, trimmed]);
    setEditUrlInput('');
    setEditError('');
  };

  // Create Album
  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || images.length === 0) {
      setError("Please provide title, description, and at least one image.");
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const albumId = `album_${Date.now()}`;
      const newAlbum: Album = {
        albumId,
        title: title.trim(),
        description: description.trim(),
        thumbnailUrl: images[0],
        images,
        category,
        uploadedBy: user.name,
        createdAt: new Date().toISOString()
      };
      
      await addAlbum(newAlbum);
      refreshData();
      setShowAddModal(false);
      
      // Reset form
      setTitle('');
      setDescription('');
      setCategory('Cultural Events');
      setImages([]);
      setCreateUrlInput('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create album');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Edited Album
  const handleUpdateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAlbum) return;
    if (!editTitle.trim() || !editDescription.trim() || editImages.length === 0) {
      setEditError("Please provide an album title, description, and at least one photo.");
      return;
    }

    setIsUpdating(true);
    setEditError('');

    const finalThumbnail = editImages.includes(editThumbnailUrl) 
      ? editThumbnailUrl 
      : (editImages[0] || '');

    try {
      const updates: Partial<Album> = {
        title: editTitle.trim(),
        description: editDescription.trim(),
        category: editCategory,
        images: editImages,
        thumbnailUrl: finalThumbnail
      };

      await updateAlbum(editingAlbum.albumId, updates);
      
      const updatedAlbumState: Album = {
        ...editingAlbum,
        ...updates
      };

      if (selectedAlbum && selectedAlbum.albumId === editingAlbum.albumId) {
        setSelectedAlbum(updatedAlbumState);
      }

      refreshData();
      setEditingAlbum(null);
    } catch (err: any) {
      console.error(err);
      setEditError(err.message || 'Failed to update album');
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete Individual Photo Confirm
  const confirmDeletePhoto = async () => {
    if (photoToDeleteIdx === null || !selectedAlbum) return;
    setIsDeleting(true);

    const idxToRemove = photoToDeleteIdx;
    const newImages = selectedAlbum.images.filter((_, idx) => idx !== idxToRemove);
    const newThumbnailUrl = newImages.length > 0 
      ? (selectedAlbum.thumbnailUrl === selectedAlbum.images[idxToRemove] ? newImages[0] : selectedAlbum.thumbnailUrl)
      : '';

    try {
      await updateAlbum(selectedAlbum.albumId, { 
        images: newImages, 
        thumbnailUrl: newThumbnailUrl 
      });

      const updatedAlbum: Album = {
        ...selectedAlbum,
        images: newImages,
        thumbnailUrl: newThumbnailUrl
      };

      setSelectedAlbum(updatedAlbum);
      refreshData();

      // If viewing active image in lightbox
      if (activeImageIdx !== null) {
        if (newImages.length === 0) {
          setActiveImageIdx(null);
        } else if (activeImageIdx >= newImages.length) {
          setActiveImageIdx(newImages.length - 1);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
      setPhotoToDeleteIdx(null);
    }
  };

  // Delete Entire Album Confirm
  const confirmDeleteAlbum = async () => {
    if (!albumToDelete) return;
    setIsDeleting(true);
    try {
      await deleteAlbum(albumToDelete.albumId);
      refreshData();
      if (selectedAlbum?.albumId === albumToDelete.albumId) {
        setSelectedAlbum(null);
      }
      setAlbumToDelete(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  // ==========================================
  // INSIDE ALBUM VIEW
  // ==========================================
  if (selectedAlbum) {
    return (
      <div className="flex-1 overflow-y-auto bg-background text-content pb-36 sm:pb-32">
        {/* Album Header Bar */}
        <div className="sticky top-0 bg-surface/95 backdrop-blur-md z-30 border-b border-divider p-4 shadow-sm">
          <div className="flex justify-between items-start sm:items-center gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20 uppercase tracking-wider">
                  {selectedAlbum.category}
                </span>
                <span className="font-mono text-[11px] text-secondary">
                  {selectedAlbum.images.length} Photos
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-display font-bold text-content mt-1">{selectedAlbum.title}</h2>
              <div className="flex items-center gap-3 text-[10px] text-secondary font-mono mt-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-tertiary" /> 
                  {new Date(selectedAlbum.createdAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3 text-tertiary" /> 
                  Uploaded by {selectedAlbum.uploadedBy}
                </span>
              </div>
            </div>

            {/* Album Header Actions */}
            <div className="flex items-center gap-2">
              {canModifyAlbum(selectedAlbum) && (
                <>
                  <button 
                    type="button"
                    onClick={() => openEditModal(selectedAlbum)}
                    className="flex items-center gap-1.5 bg-indigo-600/15 hover:bg-indigo-600 text-indigo-400 hover:text-white px-3 py-1.5 rounded-xl transition-all cursor-pointer border border-indigo-500/30 text-xs font-semibold shadow-xs"
                    title="Edit Name, Description & Photos"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Album</span>
                  </button>

                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAlbumToDelete(selectedAlbum);
                    }}
                    className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white px-3 py-1.5 rounded-xl transition-all cursor-pointer border border-rose-500/20 text-xs font-semibold shadow-xs"
                    title="Delete Album"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Delete Album</span>
                  </button>
                </>
              )}

              <button 
                type="button"
                onClick={() => setSelectedAlbum(null)}
                className="bg-surface-accent hover:bg-divider p-2 rounded-xl transition-colors cursor-pointer text-secondary hover:text-content border border-divider/60"
                title="Back to Gallery"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {selectedAlbum.description && (
            <p className="text-xs text-secondary mt-3 leading-relaxed max-w-3xl bg-surface-accent/40 p-2.5 rounded-xl border border-divider/40">
              {selectedAlbum.description}
            </p>
          )}
        </div>
        
        {/* Photo Gallery Grid */}
        <div className="p-4">
          {selectedAlbum.images.length === 0 ? (
            <div className="py-16 text-center bg-surface border border-divider rounded-2xl p-6">
              <ImageIcon className="w-10 h-10 text-secondary mx-auto mb-2 opacity-50" />
              <h4 className="text-sm font-bold text-content">No photos in this album</h4>
              <p className="text-xs text-secondary mt-1">Use the Edit Album button above to add pictures.</p>
              {canModifyAlbum(selectedAlbum) && (
                <button
                  type="button"
                  onClick={() => openEditModal(selectedAlbum)}
                  className="mt-4 inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Photos Now
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {selectedAlbum.images.map((img, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setActiveImageIdx(idx)}
                  className="relative group aspect-square rounded-2xl overflow-hidden border border-divider bg-surface shadow-xs transition-all hover:border-indigo-500/50 hover:shadow-lg cursor-pointer"
                >
                  <img 
                    src={img} 
                    alt={`${selectedAlbum.title} ${idx + 1}`} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  />

                  {/* Individual Photo Delete Button */}
                  {canModifyAlbum(selectedAlbum) && (
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPhotoToDeleteIdx(idx);
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-rose-600 text-white rounded-xl backdrop-blur-md transition-all shadow-md z-[2] border border-white/10 cursor-pointer opacity-90 group-hover:opacity-100 active:scale-95"
                      title="Delete this photo"
                      aria-label="Delete this photo"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-300 group-hover:text-white" />
                    </button>
                  )}

                  {/* Photo Index Tag */}
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded-md text-[9px] font-mono text-white/90 border border-white/10 pointer-events-none">
                    #{idx + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lightbox Modal */}
        {activeImageIdx !== null && selectedAlbum.images[activeImageIdx] && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex flex-col animate-fade-in select-none">
            <div className="flex justify-between items-center p-3.5 sm:p-4 border-b border-white/10 bg-black/60 backdrop-blur-md flex-shrink-0">
              <span className="text-xs font-mono font-bold text-neutral-300">
                Photo {activeImageIdx + 1} of {selectedAlbum.images.length}
              </span>
              <div className="flex items-center gap-2">
                {canModifyAlbum(selectedAlbum) && (
                  <button 
                    type="button"
                    onClick={() => setPhotoToDeleteIdx(activeImageIdx)}
                    className="flex items-center gap-1.5 bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white px-3 py-1.5 rounded-xl border border-rose-500/30 transition-all cursor-pointer text-xs font-semibold"
                    title="Delete Photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Photo</span>
                  </button>
                )}
                <button 
                  type="button"
                  onClick={() => setActiveImageIdx(null)}
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors cursor-pointer text-white"
                  title="Close Fullscreen"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 flex items-center justify-center relative p-3 sm:p-6 overflow-hidden">
              {selectedAlbum.images.length > 1 && (
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIdx((prev) => prev !== null ? (prev > 0 ? prev - 1 : selectedAlbum.images.length - 1) : null);
                  }}
                  className="absolute left-3 sm:left-6 p-2.5 sm:p-3 bg-black/60 hover:bg-black/90 rounded-full text-white backdrop-blur-sm transition-all border border-white/10 shadow-xl z-20 cursor-pointer active:scale-95"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              <img 
                src={selectedAlbum.images[activeImageIdx]} 
                alt={`${selectedAlbum.title} fullscreen`}
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl transition-all duration-200"
              />

              {selectedAlbum.images.length > 1 && (
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIdx((prev) => prev !== null ? (prev < selectedAlbum.images.length - 1 ? prev + 1 : 0) : null);
                  }}
                  className="absolute right-3 sm:right-6 p-2.5 sm:p-3 bg-black/60 hover:bg-black/90 rounded-full text-white backdrop-blur-sm transition-all border border-white/10 shadow-xl z-20 cursor-pointer active:scale-95"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Confirmation Modals (Rendered below for Album/Photo Deletion) */}
        {renderConfirmModals()}
        {renderEditModal()}
      </div>
    );
  }

  // ==========================================
  // MAIN GALLERY VIEW (ALBUMS LIST)
  // ==========================================
  return (
    <div className="flex-1 overflow-y-auto bg-background text-content px-4 pt-4 pb-36 sm:pb-32 space-y-5">
      {/* Gallery Header */}
      <div className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-xl font-extrabold font-display tracking-tight text-content mb-1">Gallery Albums</h1>
          <p className="text-xs text-secondary">Cherish memories, snapshots, and milestones from department events.</p>
        </div>
        {isAdminOrCoordinator && (
          <button 
            type="button"
            onClick={() => setShowAddModal(true)}
            className="ref-pill-button text-xs font-bold py-2.5 px-4 shadow-lg shadow-rose-500/30 active:scale-95 transition-all cursor-pointer"
          >
            <div className="ref-icon-bubble w-5 h-5">
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <span>Create Album</span>
          </button>
        )}
      </div>

      {/* Albums Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {albums.map((album) => {
          const hasRights = canModifyAlbum(album);

          return (
            <div 
              key={album.albumId} 
              onClick={() => setSelectedAlbum(album)}
              className="group ref-card overflow-hidden transition-all cursor-pointer flex flex-col relative active:scale-[0.99]"
            >
              <div className="aspect-video relative overflow-hidden rounded-t-[28px] bg-surface">
                <img 
                  src={album.thumbnailUrl || album.images[0] || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format'} 
                  alt={album.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                {/* Management Action Buttons (Edit + Delete) */}
                {hasRights && (
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 z-[2]">
                    <button 
                      type="button"
                      onClick={(e) => openEditModal(album, e)}
                      className="p-2 bg-black/60 hover:bg-rose-600 text-white rounded-full backdrop-blur-md transition-all shadow-md cursor-pointer border border-white/20 active:scale-90"
                      title="Edit Album"
                      aria-label="Edit Album"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAlbumToDelete(album);
                      }}
                      className="p-2 bg-black/60 hover:bg-rose-600 text-rose-300 hover:text-white rounded-full backdrop-blur-md transition-all shadow-md cursor-pointer border border-white/20 active:scale-90"
                      title="Delete Album"
                      aria-label="Delete Album"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Photo Count Pill */}
                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-[10px] font-sans font-bold text-white flex items-center gap-1.5 shadow-md">
                  <ImageIcon className="w-3 h-3 text-rose-400" />
                  {album.images.length} Photos
                </div>

                <div className="absolute bottom-3 left-3">
                  <span className="text-[10px] font-sans font-bold text-rose-200 bg-rose-500/20 border border-rose-400/30 px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-md">
                    {album.category}
                  </span>
                </div>
              </div>

              <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
                <div>
                  <h3 className="font-display font-extrabold text-sm text-content line-clamp-1 group-hover:text-rose-400 transition-colors">
                    {album.title}
                  </h3>
                  <p className="text-xs text-secondary line-clamp-2 mt-1 leading-relaxed">
                    {album.description}
                  </p>
                </div>
                
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-divider/60 text-[10px] text-tertiary font-mono">
                  <span>By {album.uploadedBy}</span>
                  <span>{new Date(album.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          );
        })}

        {albums.length === 0 && (
          <div className="col-span-full py-16 text-center bg-surface border border-divider rounded-2xl p-6">
            <ImageIcon className="w-10 h-10 text-secondary mx-auto mb-3 opacity-50" />
            <h3 className="text-sm font-bold text-content">No albums available yet</h3>
            <p className="text-secondary text-xs mt-1">Start by creating the first album for recent department events!</p>
            {isAdminOrCoordinator && (
              <button 
                type="button"
                onClick={() => setShowAddModal(true)}
                className="mt-4 inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Create First Album
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Album Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface border border-divider w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-divider">
              <h3 className="text-sm font-display font-bold uppercase tracking-wider text-content flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-indigo-400" />
                Create New Album
              </h3>
              <button 
                type="button"
                onClick={() => setShowAddModal(false)} 
                className="text-secondary hover:text-content p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAlbum} className="p-4 overflow-y-auto space-y-4">
              {error && (
                <div className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              
              <div>
                <label className="block text-[10px] font-bold text-secondary uppercase mb-1">Album Title *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. AI & ML National Symposium 2026"
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  className="w-full bg-background border border-divider rounded-xl py-2 px-3 text-xs text-content outline-none focus:border-indigo-500" 
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-secondary uppercase mb-1">Description *</label>
                <textarea 
                  required 
                  rows={3} 
                  placeholder="Tell us what this album captures..."
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  className="w-full bg-background border border-divider rounded-xl py-2 px-3 text-xs text-content outline-none focus:border-indigo-500 resize-none" 
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-secondary uppercase mb-1">Category *</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value as any)} 
                  className="w-full bg-background border border-divider rounded-xl py-2 px-3 text-xs text-content outline-none focus:border-indigo-500"
                >
                  <option value="Workshops">Workshops</option>
                  <option value="Hackathons">Hackathons</option>
                  <option value="Seminars">Seminars</option>
                  <option value="Cultural Events">Cultural Events</option>
                  <option value="Club Meetings">Club Meetings</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Photos Upload & URL Section */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-secondary uppercase">
                  Photos ({images.length} selected) *
                </label>
                
                <ImageUploader 
                  maxFiles={20} 
                  onUploadSuccess={(urls) => setImages(urls)} 
                  buttonLabel="Upload Photos from Device"
                  uploadPreset={import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET}
                  initialImages={images}
                />

                {/* Or Add Photo via URL */}
                <div className="pt-2 border-t border-divider/60">
                  <span className="text-[10px] text-tertiary block mb-1">Or add photo via direct URL:</span>
                  <div className="flex gap-2">
                    <input 
                      type="url"
                      placeholder="https://example.com/photo.jpg"
                      value={createUrlInput}
                      onChange={(e) => setCreateUrlInput(e.target.value)}
                      className="flex-1 bg-background border border-divider rounded-xl py-1.5 px-3 text-xs text-content outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddCreateUrl}
                      className="bg-surface-accent hover:bg-divider text-content text-xs font-bold px-3 py-1.5 rounded-xl border border-divider cursor-pointer transition-colors"
                    >
                      Add URL
                    </button>
                  </div>
                </div>

                {/* Preview Selected Photos */}
                {images.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 max-h-32 overflow-y-auto">
                    {images.map((imgUrl, idx) => (
                      <div key={idx} className="relative group w-14 h-14 rounded-lg overflow-hidden border border-divider bg-background">
                        <img src={imgUrl} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-0.5 right-0.5 bg-black/75 hover:bg-rose-600 text-white p-0.5 rounded-md transition-colors"
                          title="Remove photo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isSubmitting || images.length === 0} 
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-wider text-xs py-3 rounded-xl disabled:opacity-50 transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Album...</span>
                    </>
                  ) : (
                    <span>Save & Publish Album</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Render Edit Album Modal */}
      {renderEditModal()}

      {/* Render Confirmation Modals */}
      {renderConfirmModals()}
    </div>
  );

  // ==========================================
  // EDIT ALBUM MODAL (NAME, DESCRIPTION & PHOTOS)
  // ==========================================
  function renderEditModal() {
    if (!editingAlbum) return null;

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in select-none">
        <div className="bg-surface border border-indigo-500/30 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-divider flex-shrink-0">
            <div>
              <h3 className="text-sm font-display font-bold uppercase tracking-wider text-content flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-indigo-400" />
                Edit Album
              </h3>
              <p className="text-[10px] text-secondary mt-0.5">Modify album details or add & remove photos</p>
            </div>
            <button 
              type="button"
              onClick={() => setEditingAlbum(null)} 
              className="text-secondary hover:text-content p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleUpdateAlbum} className="p-4 overflow-y-auto space-y-4 flex-1">
            {editError && (
              <div className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}
            
            {/* Album Title */}
            <div>
              <label className="block text-[10px] font-bold text-secondary uppercase mb-1">Album Name / Title *</label>
              <input 
                type="text" 
                required 
                value={editTitle} 
                onChange={(e) => setEditTitle(e.target.value)} 
                className="w-full bg-background border border-divider rounded-xl py-2 px-3 text-xs text-content outline-none focus:border-indigo-500" 
              />
            </div>
            
            {/* Description */}
            <div>
              <label className="block text-[10px] font-bold text-secondary uppercase mb-1">Description *</label>
              <textarea 
                required 
                rows={3} 
                value={editDescription} 
                onChange={(e) => setEditDescription(e.target.value)} 
                className="w-full bg-background border border-divider rounded-xl py-2 px-3 text-xs text-content outline-none focus:border-indigo-500 resize-none leading-relaxed" 
              />
            </div>
            
            {/* Category */}
            <div>
              <label className="block text-[10px] font-bold text-secondary uppercase mb-1">Category *</label>
              <select 
                value={editCategory} 
                onChange={(e) => setEditCategory(e.target.value as any)} 
                className="w-full bg-background border border-divider rounded-xl py-2 px-3 text-xs text-content outline-none focus:border-indigo-500"
              >
                <option value="Workshops">Workshops</option>
                <option value="Hackathons">Hackathons</option>
                <option value="Seminars">Seminars</option>
                <option value="Cultural Events">Cultural Events</option>
                <option value="Club Meetings">Club Meetings</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Photos Management */}
            <div className="space-y-3 pt-2 border-t border-divider/60">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-secondary uppercase flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                  Photos in Album ({editImages.length})
                </label>
                <span className="text-[9px] text-tertiary">Click photo to set as cover</span>
              </div>

              {/* Photos Thumbnail List with Remove and Cover selection */}
              {editImages.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-44 overflow-y-auto p-1 bg-background/60 rounded-xl border border-divider/60">
                  {editImages.map((imgUrl, idx) => {
                    const isCover = editThumbnailUrl === imgUrl || (!editThumbnailUrl && idx === 0);

                    return (
                      <div 
                        key={idx} 
                        onClick={() => setEditThumbnailUrl(imgUrl)}
                        className={`relative group aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                          isCover ? 'border-indigo-500 shadow-md ring-2 ring-indigo-500/20' : 'border-divider hover:border-indigo-400/50'
                        }`}
                        title="Click to set as album cover thumbnail"
                      >
                        <img src={imgUrl} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                        
                        {/* Cover Badge */}
                        {isCover && (
                          <div className="absolute top-1 left-1 bg-indigo-600 text-white text-[8px] font-bold uppercase px-1 py-0.2 rounded shadow-xs">
                            Cover
                          </div>
                        )}

                        {/* Remove Photo Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditImages(prev => {
                              const remaining = prev.filter((_, i) => i !== idx);
                              if (editThumbnailUrl === imgUrl) {
                                setEditThumbnailUrl(remaining[0] || '');
                              }
                              return remaining;
                            });
                          }}
                          className="absolute top-1 right-1 bg-black/75 hover:bg-rose-600 text-white p-1 rounded-md transition-colors"
                          title="Remove this photo from album"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-rose-400 py-2">Album must have at least one photo.</p>
              )}

              {/* Upload More Photos */}
              <div className="pt-2">
                <span className="text-[10px] font-bold text-secondary uppercase block mb-1.5">
                  + Add More Photos to Album:
                </span>
                
                <ImageUploader 
                  maxFiles={25} 
                  onUploadSuccess={(urls) => {
                    setEditImages(prev => {
                      const combined = [...prev];
                      for (const u of urls) {
                        if (!combined.includes(u)) combined.push(u);
                      }
                      return combined;
                    });
                  }} 
                  buttonLabel="Upload Additional Photos from Device"
                  uploadPreset={import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET}
                />
              </div>

              {/* Or Add Photo via Direct URL */}
              <div className="pt-2 border-t border-divider/60">
                <span className="text-[10px] text-tertiary block mb-1">Or add image via direct URL:</span>
                <div className="flex gap-2">
                  <input 
                    type="url"
                    placeholder="https://example.com/extra-photo.jpg"
                    value={editUrlInput}
                    onChange={(e) => setEditUrlInput(e.target.value)}
                    className="flex-1 bg-background border border-divider rounded-xl py-1.5 px-3 text-xs text-content outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddEditUrl}
                    className="bg-indigo-600/15 hover:bg-indigo-600 text-indigo-400 hover:text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-indigo-500/30 cursor-pointer transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-divider flex items-center justify-end gap-2">
              <button 
                type="button" 
                onClick={() => setEditingAlbum(null)}
                className="bg-surface-accent hover:bg-divider text-secondary hover:text-content text-xs font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isUpdating || editImages.length === 0} 
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-wider text-xs py-2.5 px-5 rounded-xl disabled:opacity-50 transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // CONFIRMATION MODALS (DELETE ALBUM & DELETE PHOTO)
  // ==========================================
  function renderConfirmModals() {
    return (
      <>
        {/* Delete Entire Album Modal */}
        {albumToDelete && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in select-none">
            <div className="bg-surface border border-rose-500/30 w-full max-w-sm rounded-2xl shadow-2xl p-5 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-500/15 text-rose-500 mx-auto flex items-center justify-center border border-rose-500/30">
                <Trash2 className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-display font-bold text-content">Delete Album?</h3>
                <p className="text-xs text-secondary mt-1.5 leading-relaxed">
                  Are you sure you want to delete <strong className="text-content">"{albumToDelete.title}"</strong> and all its {albumToDelete.images.length} photos? This action cannot be undone.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setAlbumToDelete(null)}
                  className="flex-1 bg-surface-accent hover:bg-divider text-secondary hover:text-content text-xs font-bold py-2.5 rounded-xl border border-divider cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <HoldButton
                  size="sm"
                  holdTime={2000}
                  backgroundColor="#18181b"
                  fillColor="#e11d48"
                  textColor="#ffffff"
                  fillTextColor="#ffffff"
                  radius={12}
                  doneLabel="Album Deleted"
                  disabled={isDeleting}
                  onHold={confirmDeleteAlbum}
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                  className="flex-1"
                >
                  Hold to Delete Album
                </HoldButton>
              </div>
            </div>
          </div>
        )}

        {/* Delete Individual Photo Modal */}
        {photoToDeleteIdx !== null && selectedAlbum && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in select-none">
            <div className="bg-surface border border-rose-500/30 w-full max-w-sm rounded-2xl shadow-2xl p-5 text-center space-y-4">
              {/* Photo Preview */}
              <div className="w-24 h-24 rounded-xl overflow-hidden mx-auto border-2 border-rose-500/40 shadow-md">
                <img 
                  src={selectedAlbum.images[photoToDeleteIdx]} 
                  alt="Delete preview" 
                  className="w-full h-full object-cover" 
                />
              </div>

              <div>
                <h3 className="text-base font-display font-bold text-content">Delete Photo?</h3>
                <p className="text-xs text-secondary mt-1 leading-relaxed">
                  Remove Photo #{photoToDeleteIdx + 1} from <strong className="text-content">"{selectedAlbum.title}"</strong>?
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setPhotoToDeleteIdx(null)}
                  className="flex-1 bg-surface-accent hover:bg-divider text-secondary hover:text-content text-xs font-bold py-2.5 rounded-xl border border-divider cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <HoldButton
                  size="sm"
                  holdTime={1600}
                  backgroundColor="#18181b"
                  fillColor="#e11d48"
                  textColor="#ffffff"
                  fillTextColor="#ffffff"
                  radius={12}
                  doneLabel="Photo Deleted"
                  disabled={isDeleting}
                  onHold={confirmDeletePhoto}
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                  className="flex-1"
                >
                  Hold to Delete
                </HoldButton>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
}
