sed -i 's/handleToggleCoordEvent(coord.uid, ev.eventId, !!isAssigned)/handleToggleEventAssignment(coord.uid, ev.eventId)/g' src/components/AdminPanelView.tsx
sed -i 's/handleManualCheckIn/(e) => { e.preventDefault(); handleQRCheckIn(scannedRollInput); }/g' src/components/AdminPanelView.tsx
sed -i 's/handleUpdateRegStatus/handleUpdateStatus/g' src/components/AdminPanelView.tsx
