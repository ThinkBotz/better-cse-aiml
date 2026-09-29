const fs = require('fs');
let code = fs.readFileSync('src/firebase.ts', 'utf-8');

if (!code.includes('updateAlbum')) {
  code = code.replace(
    /export async function deleteAlbum\(albumId: string\): Promise<void> \{/,
    `export async function updateAlbum(albumId: string, updates: Partial<Album>): Promise<void> {
  const path = \`albums/\${albumId}\`;
  try {
    const docRef = doc(db, 'albums', albumId);
    await updateDoc(docRef, cleanUndefined(updates) as any);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteAlbum(albumId: string): Promise<void> {`
  );
  fs.writeFileSync('src/firebase.ts', code);
}
