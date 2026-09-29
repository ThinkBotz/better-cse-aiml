const fs = require('fs');
let code = fs.readFileSync('src/components/GalleryView.tsx', 'utf-8');

if (!code.includes('import { addAlbum, deleteAlbum, updateAlbum }')) {
  code = code.replace(
    "import { addAlbum, deleteAlbum } from '../firebase';",
    "import { addAlbum, deleteAlbum, updateAlbum } from '../firebase';"
  );
}

if (!code.includes('handleDeletePhoto')) {
  code = code.replace(
    /const handleDeleteAlbum = async \(albumId: string\) => \{/,
    `const handleDeletePhoto = async (e: React.MouseEvent, photoIndex: number) => {
    e.stopPropagation();
    if (!selectedAlbum) return;
    if (!window.confirm("Are you sure you want to delete this photo?")) return;
    
    const newImages = selectedAlbum.images.filter((_, idx) => idx !== photoIndex);
    const newThumbnailUrl = newImages.length > 0 
      ? (selectedAlbum.thumbnailUrl === selectedAlbum.images[photoIndex] ? newImages[0] : selectedAlbum.thumbnailUrl)
      : '';
      
    try {
      await updateAlbum(selectedAlbum.albumId, { 
        images: newImages, 
        thumbnailUrl: newThumbnailUrl 
      });
      
      setSelectedAlbum({
        ...selectedAlbum,
        images: newImages,
        thumbnailUrl: newThumbnailUrl
      });
      refreshData();
    } catch (error) {
      console.error(error);
      alert("Failed to delete photo.");
    }
  };

  const handleDeleteAlbum = async (albumId: string) => {`
  );
}

code = code.replace(
  /className="aspect-square rounded-xl overflow-hidden border border-divider bg-surface"/g,
  'className="relative group aspect-square rounded-xl overflow-hidden border border-divider bg-surface"'
);

const photoDeleteButton = `
              {isAdminOrCoordinator && (
                <button 
                  onClick={(e) => handleDeletePhoto(e, idx)}
                  className="absolute top-2 right-2 p-1.5 bg-rose-500/80 hover:bg-rose-500 rounded-lg text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all z-10"
                  title="Delete Photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
`;

if (!code.includes('handleDeletePhoto(e, idx)')) {
  code = code.replace(
    /(<img src={img} alt={\`\$\{selectedAlbum\.title\} \$\{idx\}\`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer" \/>)/g,
    `$1\n${photoDeleteButton}`
  );
}

fs.writeFileSync('src/components/GalleryView.tsx', code);
