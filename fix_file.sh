#!/bin/bash
sed -i '1075,$d' src/components/AdminPanelView.tsx
cat << 'REPLACE_EOF' >> src/components/AdminPanelView.tsx
              {/* STUDENT LIST WITH GROUPING AND SEARCH */}
              <div className="flex items-center gap-2 bg-[#111111] border border-neutral-800 rounded-xl px-3 py-2">
                <Search className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search students by roll number or name..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="bg-transparent border-none text-xs text-white placeholder:text-neutral-600 outline-none w-full"
                />
              </div>

              <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
                {(() => {
                  const filteredStudents = allUsers.filter(u => u.role === 'student').filter(u => 
                    u.rollNumber?.toLowerCase().includes(studentSearch.toLowerCase()) ||
                    u.name.toLowerCase().includes(studentSearch.toLowerCase())
                  );

                  if (filteredStudents.length === 0) {
                    return (
                      <div className="text-center py-6 text-xs text-neutral-500">
                        No students found. Use the bulk importer above to populate the database!
                      </div>
                    );
                  }

                  const groupedStudents = filteredStudents.reduce((acc, student) => {
                    const key = `${student.year || 'Unknown Year'} - ${student.branch || 'Unknown Branch'} (Sec ${student.section || 'A'})`;
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(student);
                    return acc;
                  }, {} as Record<string, typeof filteredStudents>);

                  return Object.entries(groupedStudents).map(([groupKey, studentsInGroup]) => (
                    <div key={groupKey} className="bg-[#111111] border border-neutral-800 rounded-2xl p-4 shadow-sm">
                      <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-3 border-b border-neutral-800/80 pb-2">{groupKey} - {studentsInGroup.length} Students</div>
                      <div className="space-y-2">
                        {studentsInGroup.map((student) => (
                          <div key={student.uid} className="bg-[#000000] border border-neutral-800/80 rounded-2xl p-3 flex justify-between items-center gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 flex-shrink-0">
                                  {student.rollNumber || 'NO ROLL'}
                                </span>
                                <h5 className="text-xs font-bold text-white truncate">{student.name}</h5>
                              </div>
                              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-1 text-[10px] text-neutral-400">
                                <span className="truncate">Email: <strong className="text-neutral-300 font-mono">{student.email}</strong></span>
                                <span>Phone: <strong className="text-neutral-300">{student.phone || 'N/A'}</strong></span>
                                <span>Password: <strong className="text-indigo-400 font-mono select-all bg-indigo-500/10 px-1 py-0.2 rounded border border-indigo-500/20">{student.password || '••••••••'}</strong></span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5 flex-shrink-0">
                              <button
                                onClick={() => student.rollNumber && handleResetPassword(student.uid, student.rollNumber)}
                                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 text-[9px] font-bold uppercase py-1.5 px-3 rounded-xl transition-all cursor-pointer w-full"
                              >
                                Reset Pass
                              </button>
                              <button
                                onClick={() => handleDeleteUser(student.uid)}
                                className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[9px] font-bold uppercase py-1.5 px-3 rounded-xl transition-all cursor-pointer w-full"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
REPLACE_EOF
