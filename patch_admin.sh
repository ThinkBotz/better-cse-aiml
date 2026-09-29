#!/bin/bash
# Insert handleDeleteUser before handleCreateAssociate
sed -i '/const handleCreateAssociate = async/i \
  const handleDeleteUser = async (uid: string) => {\
    if (!window.confirm("Are you sure you want to delete this user? This cannot be undone.")) return;\
    try {\
      await deleteUserProfile(uid);\
      refreshData();\
    } catch (err) {\
      console.error(err);\
      alert("Failed to delete user.");\
    }\
  };\
\
  const handleDemoteUser = async (uid: string) => {\
    if (!window.confirm("Are you sure you want to revoke this user'\''s role? They will become a regular student.")) return;\
    try {\
      await updateUserProfile(uid, { role: "student", powers: {}, assignedEvents: [], position: "", responsibilities: "" });\
      refreshData();\
    } catch (err) {\
      console.error(err);\
      alert("Failed to demote user.");\
    }\
  };\
' src/components/AdminPanelView.tsx
