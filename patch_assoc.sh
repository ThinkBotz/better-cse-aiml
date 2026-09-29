sed -i '/<\/div>$/,/<\/div>$/!b;//!d;/<img /!b;n;n;n;n;n;n;n;n;n;n;n;n;n;a\
                    <div className="flex gap-2">\
                      <button onClick={() => handleDemoteUser(assoc.uid)} className="text-[10px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-2 py-1 rounded-xl transition-all border border-neutral-700">Demote</button>\
                      <button onClick={() => handleDeleteUser(assoc.uid)} className="text-[10px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-2 py-1 rounded-xl transition-all border border-rose-500/20">Delete</button>\
                    </div>\
' src/components/AdminPanelView.tsx
