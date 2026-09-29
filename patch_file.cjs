const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanelView.tsx', 'utf8');

// 1. Add Demote and Delete buttons for Associates
code = code.replace(
  `                      </div>
                    </div>
                  </div>

                  {/* Real-time Permission Matrix */}`,
  `                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button onClick={() => handleDemoteUser(assoc.uid)} className="text-[10px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-2 py-1 rounded-xl transition-all border border-neutral-700 font-bold uppercase cursor-pointer">Revoke Role</button>
                      <button onClick={() => handleDeleteUser(assoc.uid)} className="text-[10px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-2 py-1 rounded-xl transition-all border border-rose-500/20 font-bold uppercase cursor-pointer">Delete</button>
                    </div>

                  </div>

                  {/* Real-time Permission Matrix */}`
);

// 2. Add Demote and Delete buttons for Coordinators
code = code.replace(
  `                    </div>
                    <button
                      onClick={() => setActiveEditingCoordId(activeEditingCoordId === coord.uid ? null : coord.uid)}
                      className="text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-3 py-1.5 rounded-xl border border-neutral-700 font-bold transition-all cursor-pointer"
                    >
                      {activeEditingCoordId === coord.uid ? 'Close' : 'Assign Events'}
                    </button>
                  </div>`,
  `                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <button
                        onClick={() => setActiveEditingCoordId(activeEditingCoordId === coord.uid ? null : coord.uid)}
                        className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer w-full"
                      >
                        {activeEditingCoordId === coord.uid ? 'Close' : 'Manage Events'}
                      </button>
                      <div className="flex gap-1">
                        <button onClick={() => handleDemoteUser(coord.uid)} className="text-[9px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-2 py-1 rounded-lg transition-all border border-neutral-700 font-bold uppercase cursor-pointer">Revoke</button>
                        <button onClick={() => handleDeleteUser(coord.uid)} className="text-[9px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-2 py-1 rounded-lg transition-all border border-rose-500/20 font-bold uppercase cursor-pointer">Delete</button>
                      </div>
                    </div>
                  </div>`
);

// 3. For students, modify the list rendering.
// First, find the student map section.
const studentMapStart = `                  .filter(u => u.role === 'student')
                  .filter(u => 
                    u.rollNumber?.toLowerCase().includes(studentSearch.toLowerCase()) ||
                    u.name.toLowerCase().includes(studentSearch.toLowerCase())
                  )
                  .map((student) => (`;
                  
const studentMapEnd = `                  ))}
                {allUsers.filter(u => u.role === 'student').length === 0 && (`;

// We'll replace it with grouped logic inside the render function.
code = code.replace(
  studentMapStart,
  `                  .filter(u => u.role === 'student')
                  .filter(u => 
                    u.rollNumber?.toLowerCase().includes(studentSearch.toLowerCase()) ||
                    u.name.toLowerCase().includes(studentSearch.toLowerCase())
                  )
                  // Grouping logic here
                  .reduce((acc, student) => {
                    const key = \`\${student.year || 'Unknown Year'} - \${student.branch || 'Unknown Branch'} (Sec \${student.section || '-'}) \`;
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(student);
                    return acc;
                  }, {} as Record<string, typeof allUsers>)
                  // Render grouped
                  ...(() => {
                    const groups = allUsers.filter(u => u.role === 'student')
                      .filter(u => u.rollNumber?.toLowerCase().includes(studentSearch.toLowerCase()) || u.name.toLowerCase().includes(studentSearch.toLowerCase()))
                      .reduce((acc, student) => {
                        const key = \`\${student.year || 'Unknown Year'} - \${student.branch || 'Unknown Branch'} (Sec \${student.section || 'A'})\`;
                        if (!acc[key]) acc[key] = [];
                        acc[key].push(student);
                        return acc;
                      }, {} as Record<string, typeof allUsers>);
                      
                    return Object.entries(groups).map(([groupKey, students]) => (
                      <div key={groupKey} className="mb-4">
                        <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-2 border-b border-neutral-800 pb-1">{groupKey} ({students.length})</div>
                        <div className="space-y-2">
                        {students.map(student => (`
);

// We need to fix the closing brace for the student mapping.
// Let's just do a simpler replacement. We can use a custom functional component inside the component.

fs.writeFileSync('src/components/AdminPanelView.tsx', code);
