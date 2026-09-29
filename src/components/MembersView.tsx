import React from 'react';
import { Mail, Linkedin, Shield, Award, Terminal, Heart, Calendar } from 'lucide-react';
import { UserProfile, DepartmentEvent, AppBranding, DEFAULT_BRANDING } from '../types';

interface MembersViewProps {
  allUsers: UserProfile[];
  events: DepartmentEvent[];
  branding?: AppBranding;
}

export default function MembersView({ allUsers, events, branding = DEFAULT_BRANDING }: MembersViewProps) {
  // Sort users into sections
  const patrons = allUsers.filter(u => u.role === 'admin');
  const executive = allUsers.filter(u => u.role === 'president' || (u.role === 'associate' && u.position?.toLowerCase().includes('president')));
  const leads = allUsers.filter(u => u.role === 'associate' && !u.position?.toLowerCase().includes('president'));
  const coordinators = allUsers.filter(u => u.role === 'coordinator');
  const generalBody = allUsers.filter(u => u.role === 'student');

  // Group coordinators by event
  const coordinatorsByEvent: Record<string, UserProfile[]> = {};
  coordinators.forEach(coord => {
    if (coord.assignedEvents && coord.assignedEvents.length > 0) {
      coord.assignedEvents.forEach(eventId => {
        if (!coordinatorsByEvent[eventId]) coordinatorsByEvent[eventId] = [];
        coordinatorsByEvent[eventId].push(coord);
      });
    } else {
      if (!coordinatorsByEvent['unassigned']) coordinatorsByEvent['unassigned'] = [];
      coordinatorsByEvent['unassigned'].push(coord);
    }
  });

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 bg-background">
      
      {/* Title */}
      <div>
        <h3 className="text-base font-display font-bold text-content leading-none">Association Directory</h3>
        <p className="text-[10px] text-content/40 mt-1.5">Meet the thinkers and creators powering {branding.appName || 'NOTX'} {branding.tagline || 'Connect'}</p>
      </div>

      {/* 1. Patrons / Faculty Advisor */}
      {patrons.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-content/40 tracking-wider uppercase flex items-center gap-1.5 border-b border-divider-light pb-1.5">
            <Shield className="w-4 h-4 text-indigo-400" />
            Patrons & Faculty Advisory
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {patrons.map(member => (
              <div key={member.uid} className="bg-surface p-4 rounded-3xl border border-divider-light flex gap-4">
                <img src={member.profile_pic || `https://api.dicebear.com/9.x/notionists/svg?seed=${member.rollNumber || member.uid}`} alt={member.name} className="w-14 h-14 rounded-2xl border border-indigo-500/20 object-cover flex-shrink-0 bg-white/5" />
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-bold text-content">{member.name}</h5>
                  <p className="text-[10px] text-indigo-400 font-semibold mt-0.5">{member.position}</p>
                  <p className="text-[10px] text-content/60 mt-2 leading-relaxed">{member.responsibilities}</p>
                  
                  <div className="flex gap-2.5 mt-3 pt-2.5 border-t border-divider-light">
                    <a href={`mailto:${member.email}`} className="text-content/40 hover:text-content transition-colors">
                      <Mail className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Executive Committee */}
      {executive.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-content/40 tracking-wider uppercase flex items-center gap-1.5 border-b border-divider-light pb-1.5">
            <Award className="w-4 h-4 text-[#3D5AFE]" />
            Executive Leadership
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {executive.map(member => (
              <div key={member.uid} className="bg-surface p-4 rounded-3xl border border-divider-light flex gap-4">
                <img src={member.profile_pic || `https://api.dicebear.com/9.x/notionists/svg?seed=${member.rollNumber || member.uid}`} alt={member.name} className="w-14 h-14 rounded-2xl border border-[#3D5AFE]/20 object-cover flex-shrink-0 bg-white/5" />
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-bold text-content">{member.name}</h5>
                  <p className="text-[10px] text-[#3D5AFE] font-semibold mt-0.5">{member.position} • {member.year}</p>
                  <p className="text-[10px] text-content/60 mt-2 leading-relaxed">{member.responsibilities}</p>
                  
                  <div className="flex gap-3.5 mt-3 pt-2.5 border-t border-divider-light">
                    <a href={`mailto:${member.email}`} className="text-content/40 hover:text-content transition-colors">
                      <Mail className="w-4 h-4" />
                    </a>
                    {member.linkedin && (
                      <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="text-content/40 hover:text-[#3D5AFE] transition-colors">
                        <Linkedin className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Team Leads */}
      {leads.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-content/40 tracking-wider uppercase flex items-center gap-1.5 border-b border-divider-light pb-1.5">
            <Terminal className="w-4 h-4 text-[#3D5AFE]" />
            Technical & Creative Leads
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {leads.map(member => (
              <div key={member.uid} className="bg-surface p-4 rounded-3xl border border-divider-light flex gap-4">
                <img src={member.profile_pic || `https://api.dicebear.com/9.x/notionists/svg?seed=${member.rollNumber || member.uid}`} alt={member.name} className="w-14 h-14 rounded-2xl border border-[#3D5AFE]/20 object-cover flex-shrink-0 bg-white/5" />
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-bold text-content">{member.name}</h5>
                  <p className="text-[10px] text-[#3D5AFE] font-semibold mt-0.5">{member.position} • {member.year}</p>
                  <p className="text-[10px] text-content/60 mt-2 leading-relaxed">{member.responsibilities}</p>
                  
                  <div className="flex gap-3.5 mt-3 pt-2.5 border-t border-divider-light">
                    <a href={`mailto:${member.email}`} className="text-content/40 hover:text-content transition-colors">
                      <Mail className="w-4 h-4" />
                    </a>
                    {member.linkedin && (
                      <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="text-content/40 hover:text-[#3D5AFE] transition-colors">
                        <Linkedin className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

            {/* Coordinators by Event */}
      {coordinators.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-content/40 tracking-wider uppercase flex items-center gap-1.5 border-b border-divider-light pb-1.5">
            <Calendar className="w-4 h-4 text-orange-400" />
            Event Coordinators
          </h4>
          <div className="space-y-4">
            {Object.entries(coordinatorsByEvent).map(([eventId, eventCoordinators]) => {
              const event = events.find(e => e.eventId === eventId);
              const title = event ? event.title : (eventId === 'unassigned' ? 'General Coordinators' : 'Unknown Event');
              
              return (
                <div key={eventId} className="bg-surface p-4 rounded-3xl border border-divider-light space-y-3">
                  <h5 className="text-xs font-bold text-orange-400 uppercase tracking-wider border-b border-divider-light pb-2 mb-3">
                    {title}
                  </h5>
                  <div className="grid grid-cols-1 gap-3">
                    {eventCoordinators.map(member => (
                      <div key={member.uid} className="flex gap-4">
                        <img src={member.profile_pic || `https://api.dicebear.com/9.x/notionists/svg?seed=${member.rollNumber || member.uid}`} alt={member.name} className="w-12 h-12 rounded-2xl border border-orange-500/20 object-cover flex-shrink-0 bg-white/5" />
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-bold text-content">{member.name}</h5>
                          <p className="text-[10px] text-orange-400 font-semibold mt-0.5">{member.position} • {member.year}</p>
                          <div className="flex gap-3.5 mt-2">
                            <a href={`mailto:${member.email}`} className="text-content/40 hover:text-content transition-colors">
                              <Mail className="w-3.5 h-3.5" />
                            </a>
                            {member.linkedin && (
                              <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="text-content/40 hover:text-orange-400 transition-colors">
                                <Linkedin className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. General Body */}
      {generalBody.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-content/40 tracking-wider uppercase flex items-center gap-1.5 border-b border-divider-light pb-1.5">
            <Heart className="w-4 h-4 text-purple-400" />
            Active Student Registry ({generalBody.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {generalBody.map(member => (
              <div key={member.uid} className="bg-surface px-3.5 py-3 rounded-2xl border border-divider-light flex justify-between items-center">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={member.profile_pic || `https://api.dicebear.com/9.x/notionists/svg?seed=${member.rollNumber || member.uid}`} alt={member.name} className="w-8.5 h-8.5 rounded-lg object-cover border border-purple-500/15 bg-white/5" />
                  <div className="min-w-0">
                    <h5 className="text-xs font-semibold text-content truncate">{member.name}</h5>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-[9px] text-content/40 font-semibold">{member.rollNumber}</span>
                      <span className="text-[9px] text-content/30">• Sec {member.section} ({member.year})</span>
                    </div>
                  </div>
                </div>
                {member.skills && (
                  <span className="text-[8px] max-w-[100px] truncate bg-white/5 text-content/80 font-mono font-medium px-2 py-0.5 rounded border border-divider-light">
                    {member.skills.split(',')[0]}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
