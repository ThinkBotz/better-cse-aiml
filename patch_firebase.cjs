const fs = require('fs');
let code = fs.readFileSync('src/firebase.ts', 'utf-8');

code = code.replace(
  /export async function addAlbum\(item: Album\): Promise<void> {[\s\S]*?\n\}/,
  `export async function addAlbum(item: Album): Promise<void> {
  const path = \`albums/\${item.albumId}\`;
  try {
    const docRef = doc(db, 'albums', item.albumId);
    await setDoc(docRef, cleanUndefined(item));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteAlbum(albumId: string): Promise<void> {
  const path = \`albums/\${albumId}\`;
  try {
    const docRef = doc(db, 'albums', albumId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}`
);

fs.writeFileSync('src/firebase.ts', code);
