sed -i '/export async function updateUserProfile/i \
export async function deleteUserProfile(uid: string) {\
  try {\
    const docRef = doc(db, "users", uid);\
    await deleteDoc(docRef);\
  } catch (error) {\
    console.error("Error deleting user profile: ", error);\
    throw error;\
  }\
}\
' src/firebase.ts
