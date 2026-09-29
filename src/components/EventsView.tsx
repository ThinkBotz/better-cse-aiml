import React, { useState, useEffect } from 'react';
import { Search, Plus, Calendar, MapPin, Clock, Users, X, Check, Award, Download, Tag, FileText, Image as ImageIcon, ChevronLeft, ChevronRight, Sparkles, Layers, RotateCw, Lock, ShieldCheck, Zap } from 'lucide-react';
import ImageUploader from './ImageUploader';
import FlipCard from './FlipCard';
import HoldButton from './HoldButton';
import { UserProfile, DepartmentEvent, EventRegistration, IssuedCertificate } from '../types';
import { createEvent, createRegistration, updateRegistrationStatus, updateRegistrationTeamMembers, deleteEvent, updateEvent, subscribeToCertificates, generateBatchCertificatesForEvent } from '../firebase';

interface EventsViewProps {
  user: UserProfile;
  allUsers: UserProfile[];
  events: DepartmentEvent[];
  registrations: EventRegistration[];
  refreshEvents: () => void;
  refreshRegistrations: () => void;
  selectedEvent: DepartmentEvent | null;
  setSelectedEvent: (event: DepartmentEvent | null) => void;
  isLoading?: boolean;
  onMessageCoordinator?: (roll: string) => void;
}


export default function EventsView({
  user,
  allUsers,
  events,
  registrations,
  refreshEvents,
  refreshRegistrations,
  selectedEvent,
  setSelectedEvent,
  isLoading = false,
  onMessageCoordinator
}: EventsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [eventImageIdx, setEventImageIdx] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  
  // Create / Edit Event states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [confirmDeleteEvent, setConfirmDeleteEvent] = useState<boolean>(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventCategory, setEventCategory] = useState<'Workshops' | 'Hackathons' | 'Seminars' | 'Cultural Events' | 'Club Meetings'>('Workshops');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventStartTime, setEventStartTime] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [eventDuration, setEventDuration] = useState('');
  const [eventVenue, setEventVenue] = useState('');
  const [eventFaculty, setEventFaculty] = useState('');
  const [eventStudent, setEventStudent] = useState('');
  const [eventMaxParticipants, setEventMaxParticipants] = useState(100);
  const [eventDeadline, setEventDeadline] = useState('');
  const [eventPoster, setEventPoster] = useState('');
  const [eventPosterOrientation, setEventPosterOrientation] = useState<'auto' | 'portrait' | 'landscape'>('auto');
  const [posterOrientations, setPosterOrientations] = useState<Record<string, 'portrait' | 'landscape'>>({});
  const [posterMeta, setPosterMeta] = useState<Record<string, { orientation: 'portrait' | 'landscape'; ratio: number; width?: number; height?: number }>>({});
  const [eventImages, setEventImages] = useState<string[]>([]);
  const [eventRules, setEventRules] = useState('');
  const [eventReqs, setEventReqs] = useState('');
  const [eventIsTeamBased, setEventIsTeamBased] = useState(false);
  const [eventMaxTeamSize, setEventMaxTeamSize] = useState(4);

  // Dynamic Coordinator Picker States for Event Form
  const [showCoordPickerModal, setShowCoordPickerModal] = useState(false);
  const [coordSearchQuery, setCoordSearchQuery] = useState('');
  const [coordFilterRole, setCoordFilterRole] = useState<'all' | 'coordinator' | 'associate' | 'student'>('all');
  
  // Registration States
  const [teamName, setTeamName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [teamMembersInput, setTeamMembersInput] = useState<{name: string; rollNumber: string; year: string; section: string; phone: string;}[]>([]);
  const [draftRoll, setDraftRoll] = useState('');
  const [regFeedback, setRegFeedback] = useState('');
  const [dbCertificates, setDbCertificates] = useState<IssuedCertificate[]>([]);
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
  const [batchFeedback, setBatchFeedback] = useState('');

  useEffect(() => {
    const unsub = subscribeToCertificates((certs) => {
      setDbCertificates(certs);
    });
    return () => unsub();
  }, []);

  const handleGenerateBatchInModal = async (eventId: string) => {
    setIsGeneratingBatch(true);
    try {
      const res = await generateBatchCertificatesForEvent(eventId, {
        events,
        registrations,
        allUsers,
        issuedBy: user.name || 'Department Administration'
      });
      setBatchFeedback(`Batch generated! ${res.newlyIssued} new certificates generated (${res.alreadyIssued} already existed).`);
      setTimeout(() => setBatchFeedback(''), 4000);
      refreshRegistrations();
    } catch (err) {
      console.error(err);
      setBatchFeedback('Failed to generate batch certificates.');
      setTimeout(() => setBatchFeedback(''), 3000);
    } finally {
      setIsGeneratingBatch(false);
    }
  };

  // Display view mode state
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  
  // Calculate initial date for calendar view based on next upcoming event
  const getInitialCalendarDate = () => {
    if (events.length > 0) {
      const sorted = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const nextEvent = sorted.find(e => new Date(e.date).getTime() >= Date.now()) || sorted[0];
      if (nextEvent) {
        return new Date(nextEvent.date);
      }
    }
    return new Date();
  };
  const [calendarDate, setCalendarDate] = useState<Date>(() => getInitialCalendarDate());

  // Auto-detect and track poster orientations & aspect ratios (portrait vs landscape)
  useEffect(() => {
    events.forEach(ev => {
      const url = ev.posterImage;
      if (!url) return;
      if (!posterMeta[url]) {
        const img = new Image();
        img.onload = () => {
          const nw = img.naturalWidth || 1;
          const nh = img.naturalHeight || 1;
          const isPort = nh > nw;
          const orient = isPort ? 'portrait' : 'landscape';
          const ratio = nh / nw;
          setPosterMeta(prev => ({ ...prev, [url]: { orientation: orient, ratio, width: nw, height: nh } }));
          setPosterOrientations(prev => prev[url] === orient ? prev : ({ ...prev, [url]: orient }));
        };
        img.src = url;
      }
    });
  }, [events]);

  // Generate days for monthly calendar view
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0: Sunday, 1: Monday, etc.
    const totalDays = new Date(year, month + 1, 0).getDate();
    return { firstDayIndex, totalDays, year, month };
  };

  const { firstDayIndex, totalDays, year, month } = getDaysInMonth(calendarDate);
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    setCalendarDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(year, month + 1, 1));
  };

  const getEventsForDay = (day: number) => {
    if (!day) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const daysArray: (number | null)[] = [];
  // Trailing spaces
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  // Days of the month
  for (let d = 1; d <= totalDays; d++) {
    daysArray.push(d);
  }

  const categories = ['All', 'Workshops', 'Hackathons', 'Seminars', 'Cultural Events', 'Club Meetings'];

  const filteredEvents = events.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.venue.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || e.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const openCreateForm = () => {
    setEditingEventId(null);
    setEventTitle('');
    setEventCategory('Workshops');
    setEventDescription('');
    setEventDate('');
    setEventStartTime('');
    setEventEndTime('');
    setEventDuration('');
    setEventVenue('');
    setEventFaculty('');
    setEventStudent('');
    setEventMaxParticipants(100);
    setEventDeadline('');
    setEventPoster('');
    setEventPosterOrientation('auto');
    setEventImages([]);
    setEventRules('');
    setEventReqs('');
    setEventIsTeamBased(false);
    setEventMaxTeamSize(4);
    setShowAddForm(true);
  };

  const openEditForm = (evt: DepartmentEvent) => {
    setEditingEventId(evt.eventId);
    setEventTitle(evt.title);
    setEventCategory(evt.category);
    setEventDescription(evt.description);
    setEventDate(evt.date);
    setEventStartTime(evt.startTime);
    setEventEndTime(evt.endTime === 'N/A' ? '' : evt.endTime);
    setEventDuration(evt.duration === '3 Hours' ? '' : evt.duration);
    setEventVenue(evt.venue);
    setEventFaculty(evt.facultyCoordinator === 'Dr. XYZ Prasad' ? '' : evt.facultyCoordinator);
    setEventStudent(evt.studentCoordinators === user.name ? '' : evt.studentCoordinators);
    setEventMaxParticipants(evt.maxParticipants);
    setEventDeadline(evt.registrationDeadline === evt.date ? '' : evt.registrationDeadline);
    setEventPoster(evt.posterImage.includes('unsplash') ? '' : evt.posterImage);
    setEventPosterOrientation(evt.posterOrientation || 'auto');
    setEventImages(evt.images || []);
    setEventRules(evt.rules || '');
    setEventReqs(evt.requirements || '');
    setEventIsTeamBased(evt.isTeamBased || false);
    setEventMaxTeamSize(evt.maxTeamSize || 4);
    setShowAddForm(true);
  };

  const selectedCoordNames = eventStudent
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const toggleCoordinatorName = (name: string) => {
    const current = eventStudent.split(',').map(s => s.trim()).filter(Boolean);
    const exists = current.some(n => n.toLowerCase() === name.toLowerCase());
    let next: string[];
    if (exists) {
      next = current.filter(n => n.toLowerCase() !== name.toLowerCase());
    } else {
      next = [...current, name];
    }
    setEventStudent(next.join(', '));
  };

  const removeCoordinatorName = (nameToRemove: string) => {
    const current = eventStudent.split(',').map(s => s.trim()).filter(Boolean);
    const next = current.filter(n => n.toLowerCase() !== nameToRemove.toLowerCase());
    setEventStudent(next.join(', '));
  };

  const selectFacultyCoordinator = (facultyName: string) => {
    setEventFaculty(facultyName);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle || !eventDate || !eventStartTime || !eventVenue) return;

    try {
      const defaultPoster = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&h=450&q=80';
      const finalPoster = eventPoster || (eventImages.length > 0 ? eventImages[0] : defaultPoster);
      const resolvedOrientation = eventPosterOrientation !== 'auto' ? eventPosterOrientation : (posterOrientations[finalPoster] || 'landscape');
      
      if (editingEventId) {
        const existingEvent = events.find(ev => ev.eventId === editingEventId);
        if (!existingEvent) return;
        
        const updatedEvent: DepartmentEvent = {
          ...existingEvent,
          title: eventTitle,
          category: eventCategory,
          description: eventDescription,
          date: eventDate,
          startTime: eventStartTime,
          endTime: eventEndTime || 'N/A',
          duration: eventDuration || '3 Hours',
          venue: eventVenue,
          facultyCoordinator: eventFaculty || 'Dr. XYZ Prasad',
          studentCoordinators: eventStudent || user.name,
          maxParticipants: Number(eventMaxParticipants),
          registrationDeadline: eventDeadline || eventDate,
          posterImage: finalPoster,
          posterOrientation: resolvedOrientation,
          images: eventImages.length > 0 ? eventImages : undefined,
          rules: eventRules,
          requirements: eventReqs,
          isTeamBased: eventIsTeamBased,
          maxTeamSize: eventIsTeamBased ? Number(eventMaxTeamSize) : 1
        };
        
        await updateEvent(updatedEvent);
        if (selectedEvent?.eventId === editingEventId) {
          setSelectedEvent(updatedEvent);
        }
      } else {
        const eventId = `event_${Date.now()}`;
        const newEvent: DepartmentEvent = {
          eventId,
          title: eventTitle,
          category: eventCategory,
          description: eventDescription,
          date: eventDate,
          startTime: eventStartTime,
          endTime: eventEndTime || 'N/A',
          duration: eventDuration || '3 Hours',
          venue: eventVenue,
          facultyCoordinator: eventFaculty || 'Dr. XYZ Prasad',
          studentCoordinators: eventStudent || user.name,
          maxParticipants: Number(eventMaxParticipants),
          registrationDeadline: eventDeadline || eventDate,
          posterImage: finalPoster,
          posterOrientation: resolvedOrientation,
          images: eventImages.length > 0 ? eventImages : undefined,
          rules: eventRules,
          requirements: eventReqs,
          createdAt: new Date().toISOString(),
          isTeamBased: eventIsTeamBased,
          maxTeamSize: eventIsTeamBased ? Number(eventMaxTeamSize) : 1
        };

        await createEvent(newEvent);
      }

      refreshEvents();
      
      // Reset
      setShowAddForm(false);
      setEditingEventId(null);
      setEventTitle('');
      setEventDescription('');
      setEventDate('');
      setEventStartTime('');
      setEventEndTime('');
      setEventVenue('');
      setEventRules('');
      setEventReqs('');
      setEventPoster('');
    setEventImages([]);
      setEventIsTeamBased(false);
      setEventMaxTeamSize(4);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegister = async () => {
    if (!selectedEvent) return;
    setIsRegistering(true);

    try {
      const regId = `${user.uid}_${selectedEvent.eventId}`;
      const newReg: EventRegistration = {
        registrationId: regId,
        studentId: user.uid,
        eventId: selectedEvent.eventId,
        status: 'Registered',
        appliedAt: new Date().toISOString(),
        studentName: user.name,
        rollNumber: user.rollNumber || 'N/A',
        phone: user.phone || 'N/A',
        year: user.year || '3rd Year',
        isTeam: !!selectedEvent.isTeamBased,
      };

      if (selectedEvent.isTeamBased) {
        newReg.teamName = teamName || 'Unnamed Team';
        newReg.teamMembers = teamMembersInput;
      }

      await createRegistration(newReg);
      setTeamName('');
      setTeamMembersInput([]);
      refreshRegistrations();
    } catch (err) {
      console.error(err);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleAttendance = async (regId: string, currentStatus: 'Registered' | 'Attended' | 'Absent', newStatus: 'Registered' | 'Attended' | 'Absent') => {
    try {
      await updateRegistrationStatus(regId, newStatus);
      refreshRegistrations();
    } catch (err) {
      console.error(err);
    }
  };

  // Participant list for currently selected event
  const eventRegistrations = selectedEvent ? registrations.filter(r => r.eventId === selectedEvent.eventId) : [];
  const userRegistration = selectedEvent ? registrations.find(r => {
    if (r.eventId !== selectedEvent.eventId) return false;
    if (r.studentId === user.uid) return true;
    if (user.rollNumber && r.rollNumber?.toLowerCase() === user.rollNumber.toLowerCase()) return true;
    if (user.rollNumber && r.teamMembers) {
      const isMember = r.teamMembers.some(m => m.rollNumber?.toLowerCase() === user.rollNumber?.toLowerCase() && m.status !== 'Declined');
      if (isMember) return true;
    }
    return false;
  }) : null;
  const isUserRegistered = !!userRegistration;

  // Export to CSV function
  const exportParticipantsToCSV = () => {
    if (!selectedEvent || eventRegistrations.length === 0) return;
    
    const headers = ['Student Name', 'Roll Number', 'Year', 'Phone', 'Team Name', 'Teammates', 'Registration Date', 'Status'];
    const rows = eventRegistrations.map(r => [
      `"${r.studentName.replace(/"/g, '""')}"`,
      `"${r.rollNumber.replace(/"/g, '""')}"`,
      `"${r.year.replace(/"/g, '""')}"`,
      `"'${r.phone.replace(/"/g, '""')}"`,
      `"${(r.teamName || 'Individual').replace(/"/g, '""')}"`,
      `"${(r.teamMembers ? r.teamMembers.map(m => `${m.name} (${m.rollNumber} - ${m.year} Sec ${m.section})`).join('; ') : 'None').replace(/"/g, '""')}"`,
      `"${new Date(r.appliedAt).toLocaleDateString()}"`,
      `"${r.status}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `NOTX_Participants_${selectedEvent.title.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="flex-1 overflow-y-auto min-h-0 bg-background text-content scroll-smooth pb-36 sm:pb-32">
      
      {/* Header Search & Actions */}
      <div className="px-4 pt-4 pb-2 space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-display font-extrabold text-content leading-none">Events Arena</h3>
            <p className="text-[11px] text-secondary mt-1">Hackathons, masterclasses, and tech meets</p>
          </div>
          {(user.role === 'admin' || (user.role === 'associate' && user.powers?.canManageEvents)) && (
            <button 
              onClick={openCreateForm}
              className="ref-pill-button text-xs font-bold py-2 px-4 shadow-lg shadow-rose-500/30 active:scale-95 transition-all cursor-pointer"
            >
              <div className="ref-icon-bubble w-5 h-5">
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <span>Add Event</span>
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
          <input 
            type="text" 
            placeholder="Search events, topics, coordinators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-accent/60 backdrop-blur-md border border-divider focus:border-rose-500/50 text-xs text-content placeholder:text-secondary rounded-full py-2.5 pl-10 pr-10 outline-none transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-content p-1 cursor-pointer rounded-full"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Categories Tab Bar */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 text-[11px] font-bold px-3.5 py-1.5 rounded-full border transition-all cursor-pointer ${
                activeCategory === cat 
                  ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white border-transparent shadow-md shadow-rose-500/25' 
                  : 'bg-surface-accent/50 text-secondary border-divider/60 hover:text-content hover:bg-surface-accent'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* View Switcher segment */}
        <div className="flex border-t border-divider/60 pt-2.5 items-center justify-between">
          <span className="text-[10px] font-extrabold text-secondary uppercase tracking-widest font-sans">Display Mode</span>
          <div className="bg-surface-accent/70 p-1 rounded-full border border-divider/80 flex gap-1">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`text-[10px] font-bold px-3 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'list' ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md' : 'text-secondary hover:text-content'
              }`}
            >
              <RotateCw className="w-3 h-3" />
              Flip Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`text-[9px] font-bold px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'calendar' ? 'bg-indigo-600 text-white font-black shadow' : 'text-secondary hover:text-primary'
              }`}
            >
              Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Events */}
      <div className="px-4 pb-28 sm:pb-32 space-y-3.5">
        {viewMode === 'calendar' ? (
          <div className="bg-surface border border-divider/80 p-4 rounded-2xl space-y-3.5 shadow-xl animate-fade-in">
            {/* Calendar Header with navigation buttons */}
            <div className="flex justify-between items-center border-b border-divider/80 pb-2.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-7.5 h-7.5 bg-background hover:bg-surface-accent rounded-lg flex items-center justify-center text-secondary hover:text-content transition-all font-bold text-sm border border-divider cursor-pointer"
              >
                &larr;
              </button>
              
              <div className="text-center">
                <h4 className="text-xs font-display font-black text-content tracking-wide uppercase">
                  {monthNames[month]} {year}
                </h4>
                <p className="text-[8px] text-violet-400 font-bold font-mono tracking-wider mt-0.5 uppercase">
                  Department Schedules
                </p>
              </div>
              
              <button
                type="button"
                onClick={handleNextMonth}
                className="w-7.5 h-7.5 bg-background hover:bg-surface-accent rounded-lg flex items-center justify-center text-secondary hover:text-content transition-all font-bold text-sm border border-divider cursor-pointer"
              >
                &rarr;
              </button>
            </div>

            {/* Days of week titles */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                <span key={day} className="text-[9px] font-bold text-tertiary uppercase tracking-wider py-1 font-mono">
                  {day}
                </span>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {daysArray.map((day, index) => {
                const dayEvents = getEventsForDay(day || 0);
                const hasEvents = dayEvents.length > 0;
                
                // Highlight current active system date
                const today = new Date();
                const isToday = day && 
                                today.getDate() === day && 
                                today.getMonth() === month && 
                                today.getFullYear() === year;

                return (
                  <div
                    key={index}
                    className={`min-h-[52px] p-1 border rounded-lg flex flex-col justify-between transition-all relative ${
                      !day
                        ? 'bg-transparent border-transparent pointer-events-none'
                        : isToday
                        ? 'bg-indigo-500/10 border-indigo-500 text-indigo-700 dark:text-indigo-400'
                        : hasEvents
                        ? 'bg-background hover:bg-surface-accent border-divider text-content cursor-pointer hover:border-indigo-500/40'
                        : 'bg-background/60 border-divider/60 text-tertiary'
                    }`}
                  >
                    <span className={`text-[9px] font-mono font-bold leading-none ${
                      isToday ? 'text-indigo-400' : 'text-secondary'
                    }`}>
                      {day}
                    </span>

                    {/* Day scheduled event marks */}
                    {day && hasEvents && (
                      <div className="space-y-0.5 mt-1">
                        {dayEvents.map(ev => (
                          <div
                            key={ev.eventId}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(ev);
                            }}
                            className="text-[7px] font-bold px-1 py-0.5 rounded leading-none truncate bg-indigo-600/80 text-white border border-indigo-500/30 hover:bg-indigo-500 transition-all cursor-pointer"
                            title={ev.title}
                          >
                            {ev.title}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Upcoming schedules checklist summary */}
            <div className="border-t border-divider/80 pt-3 space-y-2">
              <span className="block text-[8px] font-bold text-secondary uppercase tracking-widest font-mono">Upcoming deadlines this month</span>
              <div className="space-y-1.5">
                {events
                  .filter(e => {
                    const eDate = new Date(e.date);
                    return eDate.getMonth() === month && eDate.getFullYear() === year;
                  })
                  .map(e => {
                    const regCount = registrations.filter(r => r.eventId === e.eventId).length;
                    return (
                      <div 
                        key={e.eventId}
                        onClick={() => setSelectedEvent(e)}
                        className="bg-background hover:bg-surface-accent border border-divider p-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all hover:border-indigo-500/30"
                      >
                        <div className="min-w-0 flex-1">
                          <h5 className="text-[11px] font-bold text-content truncate">{e.title}</h5>
                          <div className="flex gap-2 items-center text-[8px] text-secondary mt-1">
                            <span className="font-mono text-violet-400 font-bold bg-violet-500/10 border border-violet-500/20 px-1 py-0.2 rounded">
                              {e.date}
                            </span>
                            <span>Deadline: <strong className="text-primary">{e.registrationDeadline}</strong></span>
                          </div>
                        </div>
                        <span className="text-[8px] font-bold uppercase text-secondary bg-surface-accent/60 border border-divider/60 px-2 py-0.5 rounded">
                          {regCount} Joined
                        </span>
                      </div>
                    );
                  })}
                {events.filter(e => {
                  const eDate = new Date(e.date);
                  return eDate.getMonth() === month && eDate.getFullYear() === year;
                }).length === 0 && (
                  <p className="text-[10px] text-tertiary italic text-center py-2">No department schedules set for this month.</p>
                )}
              </div>
            </div>
          </div>
        ) : isLoading ? (
          [1, 2, 3, 4].map((i) => (
            <div 
              key={i}
              className="bg-surface border border-divider rounded-xl overflow-hidden shadow flex flex-col animate-pulse"
            >
              <div className="relative h-28 bg-surface-accent flex-shrink-0">
                <div className="absolute top-2.5 left-2.5 w-16 h-4 bg-divider rounded-md" />
                <div className="absolute bottom-2.5 left-2.5 w-24 h-5 bg-divider rounded-md" />
              </div>
              
              <div className="p-3 space-y-2.5 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="h-3.5 w-2/3 bg-divider rounded" />
                  <div className="h-2.5 w-full bg-divider rounded" />
                  <div className="h-2.5 w-4/5 bg-divider rounded" />
                </div>
                
                <div className="flex justify-between items-center border-t border-divider pt-2">
                  <div className="flex gap-3">
                    <div className="h-3 w-12 bg-divider rounded" />
                    <div className="h-3 w-12 bg-divider rounded" />
                  </div>
                  <div className="h-4 w-14 bg-divider rounded" />
                </div>
              </div>
            </div>
          ))
        ) : filteredEvents.length === 0 ? (
          <div className="bg-surface rounded-2xl p-8 text-center border border-divider/80 mt-6">
            <p className="text-xs text-secondary font-medium">No events found matching your filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4.5 w-full items-start">
            {filteredEvents.map((event) => {
            const myReg = registrations.find(r => {
              if (r.eventId !== event.eventId) return false;
              if (r.studentId === user.uid) return true;
              if (user.rollNumber && r.rollNumber?.toLowerCase() === user.rollNumber.toLowerCase()) return true;
              if (user.rollNumber && r.teamMembers) {
                const isMember = r.teamMembers.some(m => m.rollNumber?.toLowerCase() === user.rollNumber?.toLowerCase() && m.status !== 'Declined');
                if (isMember) return true;
              }
              return false;
            });
            const regCount = registrations.filter(r => r.eventId === event.eventId).length;
            
            const isTeammate = myReg && user.rollNumber && myReg.studentId !== user.uid;
            const teammateObj = isTeammate && myReg ? myReg.teamMembers?.find(m => m.rollNumber?.toLowerCase() === user.rollNumber?.toLowerCase()) : null;
            const isPendingInvite = teammateObj && (teammateObj.status === 'Pending' || !teammateObj.status);
            const eventCoordinators = allUsers.filter(u => u.role === 'coordinator' && u.assignedEvents?.includes(event.eventId));
            
            // Dynamic aspect ratio & orientation detection for card sizing
            const meta = posterMeta[event.posterImage];
            const isPortrait = (event.posterOrientation === 'portrait') || 
              (meta?.orientation === 'portrait') || 
              (posterOrientations[event.posterImage] === 'portrait');
            
            // Intrinsic aspect ratio (width / height)
            const rawAspect = (meta?.width && meta?.height) 
              ? (meta.width / meta.height) 
              : (meta?.ratio ? 1 / meta.ratio : (isPortrait ? 0.72 : 1.55));

            // Dynamic clamping within comfortable, generous UI boundary ranges:
            // Portrait: allows 0.65 (approx 2:3) to 0.85 (approx 4:5), max height 415px, min height 310px
            // Landscape: allows 1.25 (approx 5:4) to 1.78 (16:9), max height 265px, min height 210px
            const clampedAspect = isPortrait 
              ? Math.max(0.65, Math.min(0.85, rawAspect))
              : Math.max(1.25, Math.min(1.78, rawAspect));

            const cardAspect = clampedAspect.toFixed(3);
            const cardMaxHeight = isPortrait ? 415 : 265;
            const cardMinHeight = isPortrait ? 310 : 210;
            
            return (
              <div key={event.eventId} className="w-full">
                <FlipCard
                  front={
                    <div className="relative w-full h-full overflow-hidden flex flex-col justify-end group bg-neutral-950">
                      {/* Edge-to-edge uncropped poster image: matches card aspect ratio with zero space on sides */}
                      <img 
                        src={event.posterImage} 
                        alt={event.title} 
                        onLoad={(e) => {
                          const img = e.currentTarget;
                          const nw = img.naturalWidth || 1;
                          const nh = img.naturalHeight || 1;
                          const orient = nh > nw ? 'portrait' : 'landscape';
                          const ratio = nh / nw;
                          setPosterMeta(prev => {
                            if (prev[event.posterImage]?.ratio === ratio && prev[event.posterImage]?.width === nw) return prev;
                            return { ...prev, [event.posterImage]: { orientation: orient, ratio, width: nw, height: nh } };
                          });
                          if (posterOrientations[event.posterImage] !== orient) {
                            setPosterOrientations(prev => ({ ...prev, [event.posterImage]: orient }));
                          }
                        }}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 pointer-events-none" 
                      />

                      {/* Subtle gradient at bottom for text contrast without obscuring the poster artwork */}
                      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none z-10" />
                      
                      {/* Top Badges: Category only */}
                      {event.category && (
                        <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none">
                          <span className="bg-black/75 backdrop-blur-md text-violet-300 text-[9px] font-bold px-2 py-0.5 rounded-md border border-white/10 font-mono shadow-md">
                            {event.category}
                          </span>
                        </div>
                      )}

                      {/* Front face Bottom content: ONLY event name and date on cover */}
                      <div className="relative z-20 p-2.5 space-y-1 pointer-events-none">
                        <div className="inline-flex items-center gap-1.5 text-indigo-300 text-[9px] font-mono font-semibold bg-black/75 backdrop-blur-md border border-indigo-500/30 px-2 py-0.5 rounded-md shadow-sm">
                          <Calendar className="w-2.5 h-2.5 text-indigo-400" />
                          {event.date}
                        </div>

                        <h3 className="text-xs sm:text-sm font-display font-bold text-white tracking-tight drop-shadow-md line-clamp-2 leading-snug">
                          {event.title}
                        </h3>
                      </div>
                    </div>
                  }
                  back={
                    <div style={{ padding: isPortrait ? 13 : 10 }} className="h-full flex flex-col justify-between overflow-y-auto select-text text-neutral-100">
                      <div className="space-y-1.5">
                        {/* Header with category and flip back hint */}
                        <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                          <span className="text-[9px] font-mono font-bold text-violet-400 bg-violet-500/15 border border-violet-500/25 px-2 py-0.5 rounded-md">
                            {event.category}
                          </span>
                          <span className="text-[8px] font-mono text-neutral-400 flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                            <RotateCw className="w-2.5 h-2.5 text-indigo-400" />
                            Poster
                          </span>
                        </div>

                        <div>
                          <h3 className="text-xs font-display font-bold text-white tracking-tight leading-snug line-clamp-2">
                            {event.title}
                          </h3>
                          <p className="text-[9px] text-neutral-300 mt-0.5 line-clamp-2 leading-relaxed">
                            {event.description}
                          </p>
                        </div>

                        {/* Quick metadata grid */}
                        <div className="grid grid-cols-2 gap-1.5 pt-0.5 text-[8.5px]">
                          <div className="bg-neutral-800/80 border border-white/10 rounded-lg p-1.5">
                            <span className="text-[7.5px] font-mono text-neutral-400 uppercase flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5 text-indigo-400" /> Date & Time
                            </span>
                            <span className="font-bold text-white mt-0.5 block truncate">{event.date}</span>
                            <span className="text-[7.5px] text-neutral-400 font-mono block truncate">{event.startTime}</span>
                          </div>

                          <div className="bg-neutral-800/80 border border-white/10 rounded-lg p-1.5">
                            <span className="text-[7.5px] font-mono text-neutral-400 uppercase flex items-center gap-1">
                              <MapPin className="w-2.5 h-2.5 text-indigo-400" /> Venue
                            </span>
                            <span className="font-bold text-white mt-0.5 block truncate">{event.venue.split(',')[0]}</span>
                            <span className="text-[7.5px] text-neutral-400 font-mono block">Campus</span>
                          </div>
                        </div>

                        {/* Extra metadata if vertical room exists (portrait) */}
                        {isPortrait && (
                          <div className="space-y-1 text-[8.5px] bg-neutral-900/90 border border-white/10 p-1.5 rounded-lg font-mono">
                            <div className="flex justify-between items-center text-neutral-400">
                              <span>Deadline:</span>
                              <span className="font-bold text-amber-400">{event.registrationDeadline}</span>
                            </div>
                            <div className="flex justify-between items-center text-neutral-400">
                              <span>Student Lead:</span>
                              <span className="font-medium text-neutral-200 truncate max-w-[120px]">{event.studentCoordinators}</span>
                            </div>
                            <div className="flex justify-between items-center text-neutral-400">
                              <span>Capacity:</span>
                              <span className="text-violet-400 font-bold">{regCount} / {event.maxParticipants}</span>
                            </div>
                            {eventCoordinators.length > 0 && (
                              <div className="flex justify-between items-center text-neutral-400 pt-0.5 border-t border-white/5">
                                <span>Coordinators:</span>
                                <span className="text-indigo-300">{eventCoordinators.length} Assigned</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Bottom Actions on back face */}
                      <div className="pt-1.5 border-t border-white/10 flex items-center justify-between gap-1.5 mt-1 flex-shrink-0">
                        {myReg ? (
                          <div className="flex items-center gap-1">
                            <span className={`text-[8.5px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border ${
                              isPendingInvite
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : myReg.status === 'Attended'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                            }`}>
                              <Check className="w-2.5 h-2.5" />
                              {isPendingInvite ? 'Invited' : myReg.status}
                            </span>

                            {myReg.status === 'Attended' && (() => {
                              const myCert = dbCertificates.find(c => c.eventId === event.eventId && (c.studentId === user.uid || (user.rollNumber && c.rollNumber.toUpperCase() === user.rollNumber.toUpperCase())));
                              const isCertUnlocked = Boolean(myCert && myCert.status !== 'Revoked');
                              return (
                                <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 border ${
                                  isCertUnlocked 
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                }`} title={isCertUnlocked ? "Official Certificate Generated" : "Certificate Locked - Pending Admin Batch Generation"}>
                                  {isCertUnlocked ? <Award className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                                  <span>{isCertUnlocked ? 'Cert Issued' : 'Cert Locked'}</span>
                                </span>
                              );
                            })()}
                          </div>
                        ) : null}

                        <button
                          data-no-flip="true"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(event);
                            setEventImageIdx(0);
                          }}
                          className="flex-1 py-1.5 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[9.5px] font-bold tracking-tight transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer active:scale-98"
                        >
                          <FileText className="w-3 h-3" />
                          View Event & Register
                        </button>
                      </div>
                    </div>
                  }
                  axis="y"
                  flipOnClick={true}
                  draggable={true}
                  dragDistance={0}
                  tilt={false}
                  tiltMax={0}
                  glare={false}
                  glareOpacity={0}
                  hoverScale={1.01}
                  perspective={1000}
                  stiffness={170}
                  damping={20}
                  width="100%"
                  aspectRatio={cardAspect}
                  maxHeight={cardMaxHeight}
                  minHeight={cardMinHeight}
                  maxWidth="100%"
                  radius={16}
                  background="#18181b"
                  color="#f5f5f5"
                  shadow={true}
                  shadowColor="#000000"
                  shadowOpacity={0.3}
                  onFlipChange={flipped => console.log('Event card flipped:', event.title, flipped)}
                />
              </div>
            );
          })}
          </div>
        )}
      </div>

      
  {/* EVENT DETAIL SLIDING OVERLAY PANEL */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex flex-col justify-end md:justify-center md:items-center p-0 md:p-6 select-none">
          <div className="bg-background rounded-t-[28px] md:rounded-[28px] border-t md:border border-divider/80 h-[88%] md:h-auto md:max-h-[85vh] w-full md:max-w-2xl flex flex-col overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-3.5 border-b border-divider/80 flex justify-between items-center flex-shrink-0 bg-surface">
              <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 px-2.5 py-0.5 rounded-md border border-violet-500/20 font-mono">
                {selectedEvent.category}
              </span>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="w-7.5 h-7.5 rounded-full bg-surface-accent flex items-center justify-center text-secondary hover:text-content border border-divider cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Event Media / Photos */}
              {(selectedEvent.images && selectedEvent.images.length > 1) ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-tertiary px-1 font-mono">
                    <span className="flex items-center gap-1.5 text-indigo-400 font-bold">
                      <ImageIcon className="w-3.5 h-3.5" /> Event Photos
                    </span>
                    <span>{eventImageIdx + 1} / {selectedEvent.images.length} Photos</span>
                  </div>
                  <div className="relative rounded-2xl overflow-hidden bg-black/60 border border-divider aspect-video w-full flex items-center justify-center group">
                    <img 
                      src={selectedEvent.images[eventImageIdx] || selectedEvent.posterImage} 
                      alt={`${selectedEvent.title} photo ${eventImageIdx + 1}`} 
                      className="w-full h-full object-contain"
                    />
                    {/* Prev Button */}
                    <button
                      type="button"
                      onClick={() => setEventImageIdx(prev => (prev === 0 ? selectedEvent.images!.length - 1 : prev - 1))}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm border border-white/20 transition-all opacity-80 group-hover:opacity-100 cursor-pointer shadow-md"
                      aria-label="Previous photo"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {/* Next Button */}
                    <button
                      type="button"
                      onClick={() => setEventImageIdx(prev => (prev === selectedEvent.images!.length - 1 ? 0 : prev + 1))}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm border border-white/20 transition-all opacity-80 group-hover:opacity-100 cursor-pointer shadow-md"
                      aria-label="Next photo"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  {/* Thumbnail Strip */}
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {selectedEvent.images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEventImageIdx(idx)}
                        className={`relative flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                          idx === eventImageIdx ? 'border-indigo-500 scale-105 shadow-md' : 'border-divider opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                (() => {
                  const modalImg = selectedEvent.images?.[0] || selectedEvent.posterImage;
                  const isModalPortrait = (selectedEvent.posterOrientation === 'portrait') || (posterOrientations[modalImg] === 'portrait');
                  return (
                    <div className={`rounded-2xl overflow-hidden bg-black/60 relative border border-divider flex items-center justify-center group ${
                      isModalPortrait ? 'max-h-[460px] aspect-[3/4] mx-auto w-full max-w-sm' : 'max-h-[300px] aspect-video w-full'
                    }`}>
                      <img 
                        src={modalImg} 
                        alt={selectedEvent.title} 
                        className="w-full h-full object-contain" 
                      />
                    </div>
                  );
                })()
              )}

              <div>
                <h3 className="text-base font-display font-extrabold text-content leading-snug">{selectedEvent.title}</h3>
                <p className="text-xs text-secondary mt-2 leading-relaxed">{selectedEvent.description}</p>
              </div>

              {/* Coordinators Contact Box */}
              {(() => {
                const modalCoordinators = allUsers.filter(u => u.role === 'coordinator' && u.assignedEvents?.includes(selectedEvent.eventId));
                if (modalCoordinators.length === 0) return null;
                return (
                  <div className="bg-surface-accent/50 border border-indigo-500/20 p-3 rounded-xl space-y-2.5">
                    <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Event Coordinators</h4>
                    <div className="flex flex-col gap-2">
                      {modalCoordinators.map(coord => (
                        <div key={coord.uid} className="flex justify-between items-center bg-background p-2 rounded-lg border border-divider/80">
                          <div className="flex items-center gap-2.5">
                            <img src={coord.profile_pic || `https://api.dicebear.com/9.x/notionists/svg?seed=${coord.rollNumber || coord.uid}`} alt={coord.name} className="w-7 h-7 rounded-full border border-indigo-500/20 bg-surface object-cover" />
                            <div>
                              <div className="text-[11px] font-bold text-primary">{coord.name}</div>
                              <div className="text-[9px] text-tertiary font-mono">{coord.rollNumber}</div>
                            </div>
                          </div>
                          {user.uid !== coord.uid && onMessageCoordinator && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); onMessageCoordinator(coord.rollNumber || coord.uid); }}
                              className="text-[9px] bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 px-3 py-1.5 rounded-lg border border-indigo-500/30 font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              Message
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
              
              {/* Event Timing Stats */}
              <div className="grid grid-cols-2 gap-2 bg-surface p-3 rounded-xl border border-divider">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <div>
                    <div className="text-[9px] font-bold text-secondary uppercase tracking-wide">Date</div>
                    <div className="text-xs font-mono font-medium text-primary mt-0.5">{selectedEvent.date}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <div>
                    <div className="text-[9px] font-bold text-secondary uppercase tracking-wide">Time & Duration</div>
                    <div className="text-xs font-mono font-medium text-primary mt-0.5">{selectedEvent.startTime} • {selectedEvent.duration}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 col-span-2 border-t border-divider pt-2 mt-1">
                  <MapPin className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <div>
                    <div className="text-[9px] font-bold text-secondary uppercase tracking-wide">Venue</div>
                    <div className="text-xs font-medium text-primary mt-0.5">{selectedEvent.venue}</div>
                  </div>
                </div>
              </div>

              {/* Coordinators */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-surface p-3 rounded-xl border border-divider">
                  <div className="text-[9px] font-bold text-secondary uppercase tracking-wide">Faculty Lead</div>
                  <div className="text-xs font-bold text-primary mt-1 truncate">{selectedEvent.facultyCoordinator}</div>
                </div>
                <div className="bg-surface p-3 rounded-xl border border-divider">
                  <div className="text-[9px] font-bold text-secondary uppercase tracking-wide">Student Lead</div>
                  <div className="text-xs font-bold text-primary mt-1 truncate">{selectedEvent.studentCoordinators}</div>
                </div>
              </div>

              {/* Rules & Requirements */}
              {selectedEvent.rules && (
                <div>
                  <h4 className="font-display text-xs font-bold uppercase text-secondary tracking-wider mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    Event Rules
                  </h4>
                  <div className="bg-surface border border-divider p-3 rounded-xl">
                    <p className="text-[11px] text-secondary whitespace-pre-line leading-relaxed">{selectedEvent.rules}</p>
                  </div>
                </div>
              )}

              {selectedEvent.requirements && (
                <div>
                  <h4 className="font-display text-xs font-bold uppercase text-secondary tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-indigo-400" />
                    Prerequisites & Materials
                  </h4>
                  <div className="bg-surface border border-divider p-3 rounded-xl">
                    <p className="text-[11px] text-secondary leading-relaxed">{selectedEvent.requirements}</p>
                  </div>
                </div>
              )}
              {/* REGISTRATION ACTION BUTTONS */}
              {user && (
                <div className="border-t border-divider pt-3.5 mt-2">
                  {isUserRegistered ? (
                    userRegistration?.studentId !== user.uid && userRegistration?.teamMembers?.some(m => m.rollNumber?.toLowerCase() === user.rollNumber?.toLowerCase() && (m.status === 'Pending' || !m.status)) ? (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex flex-col items-center text-center">
                        <div className="w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 mb-2 animate-pulse">
                          <Users className="w-5 h-5" />
                        </div>
                        <h4 className="text-xs font-bold text-content">Team Invitation</h4>
                        <p className="text-[10px] text-secondary mt-1 leading-relaxed">
                          You have been invited to join team <span className="text-indigo-400 font-bold">"{userRegistration.teamName}"</span> led by <span className="text-content font-semibold">{userRegistration.studentName}</span>.
                        </p>
                        
                        <div className="flex gap-2.5 mt-3.5 w-full">
                          <button
                            onClick={async () => {
                              if (!userRegistration) return;
                              const updatedMembers = userRegistration.teamMembers?.map(m => {
                                if (m.rollNumber?.toLowerCase() === user.rollNumber?.toLowerCase()) {
                                  return { ...m, status: 'Accepted' as const };
                                }
                                return m;
                              }) || [];
                              await updateRegistrationTeamMembers(userRegistration.registrationId, updatedMembers);
                              refreshRegistrations();
                            }}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider py-2 rounded-xl transition-all cursor-pointer active:scale-95"
                          >
                            Accept
                          </button>
                          <button
                            onClick={async () => {
                              if (!userRegistration) return;
                              const updatedMembers = userRegistration.teamMembers?.map(m => {
                                if (m.rollNumber?.toLowerCase() === user.rollNumber?.toLowerCase()) {
                                  return { ...m, status: 'Declined' as const };
                                }
                                return m;
                              }) || [];
                              await updateRegistrationTeamMembers(userRegistration.registrationId, updatedMembers);
                              refreshRegistrations();
                            }}
                            className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-bold uppercase tracking-wider py-2 rounded-xl border border-rose-500/20 transition-all cursor-pointer active:scale-95"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
) : (
                      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 flex flex-col items-center text-center">
                        <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-2">
                          <Check className="w-5 h-5" />
                        </div>
                        <h4 className="text-xs font-bold text-content">Registration Confirmed</h4>
                        <p className="text-[10px] text-secondary mt-1">Status: <span className="text-violet-400 font-semibold">{userRegistration?.status}</span></p>
                        {userRegistration?.teamName && (
                          <p className="text-[10px] text-secondary">Team: <span className="text-content font-semibold">{userRegistration.teamName}</span></p>
                        )}
                        {userRegistration?.teamMembers && userRegistration.teamMembers.length > 0 && (
                          <div className="mt-2.5 w-full bg-background p-2.5 rounded-xl border border-divider text-left text-[10px] space-y-1.5">
                            <span className="text-secondary uppercase font-bold text-[8px] tracking-wider block">Teammates Status:</span>
                            {userRegistration.teamMembers.map((m, i) => (
                              <div key={i} className="text-secondary text-[10px] flex justify-between items-center bg-surface p-1.5 rounded border border-divider">
                                <span className="truncate max-w-[150px]">• {m.name} ({m.rollNumber})</span>
                                <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                  m.status === 'Accepted'
                                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                    : m.status === 'Declined'
                                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}>
                                  {m.status || 'Pending'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {userRegistration?.status === 'Attended' && (() => {
                          const myCert = dbCertificates.find(c => c.eventId === selectedEvent.eventId && (c.studentId === user.uid || (user.rollNumber && c.rollNumber.toUpperCase() === user.rollNumber.toUpperCase())));
                          const isCertUnlocked = Boolean(myCert && myCert.status !== 'Revoked');
                          return (
                            <div className={`mt-3 w-full p-2.5 rounded-xl border text-left text-xs ${
                              isCertUnlocked
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                            }`}>
                              <div className="flex items-center gap-1.5 font-bold text-xs">
                                {isCertUnlocked ? <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" /> : <Lock className="w-4 h-4 text-amber-400 shrink-0" />}
                                <span>{isCertUnlocked ? 'Official Certificate Issued & Unlocked' : 'Certificate Locked (Pending Admin Batch Release)'}</span>
                              </div>
                              <p className="text-[10px] mt-1 text-secondary leading-relaxed">
                                {isCertUnlocked 
                                  ? `Official Certificate ID: ${myCert?.certificateId}. Your verified credential can be viewed, downloaded, or shared from your Profile tab.`
                                  : 'Attendance confirmed. The department administrator releases certificates in batches. Once generated by the admin, your certificate will automatically unlock in your Profile.'}
                              </p>
                            </div>
                          );
                        })()}

                        <p className="text-[9px] text-secondary mt-2">Present your registration roll number at the venue.</p>
                      </div>
                    )
                  ) : (
                    <div className="space-y-3 bg-surface p-3.5 rounded-2xl border border-divider">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold text-content">Register for this event</h4>
                        {selectedEvent.isTeamBased ? (
                          <span className="text-[8px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-md border border-indigo-500/20 font-bold uppercase tracking-wider font-mono">
                            Team (Max {selectedEvent.maxTeamSize || 4})
                          </span>
                        ) : (
                          <span className="text-[8px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-md border border-indigo-500/20 font-bold uppercase tracking-wider font-mono">
                            Individual
                          </span>
                        )}
                      </div>

                      {selectedEvent.isTeamBased ? (
                        <div className="space-y-2.5">
                          <div>
                            <label className="block text-[9px] font-bold text-secondary uppercase tracking-wider mb-1">Team Name *</label>
                            <input 
                              type="text" 
                              required
                              placeholder="e.g. Neurons Crew"
                              value={teamName}
                              onChange={(e) => setTeamName(e.target.value)}
                              className="w-full bg-background border border-divider focus:border-indigo-500/50 text-xs text-content rounded-lg py-2 px-3 outline-none transition-all"
                            />
                          </div>

                          {/* Dynamic Teammates list */}
                          {teamMembersInput.length > 0 && (
                            <div className="space-y-1 bg-background p-2 rounded-xl border border-divider">
                              <div className="text-[8px] font-bold text-secondary uppercase tracking-wider px-1">
                                Added Teammates ({teamMembersInput.length + 1} of {selectedEvent.maxTeamSize || 4})
                              </div>
                              {teamMembersInput.map((m, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-surface p-1.5 rounded-lg border border-divider text-[11px]">
                                  <div>
                                    <div className="font-semibold text-content">{m.name}</div>
                                    <div className="text-[9px] text-secondary">Roll: {m.rollNumber} • {m.year} Sec {m.section}</div>
                                  </div>
                                  <button 
                                    type="button"
                                    onClick={() => setTeamMembersInput(teamMembersInput.filter((_, i) => i !== idx))}
                                    className="text-rose-400 hover:text-rose-300 text-[10px] font-bold px-2 py-0.5 cursor-pointer"
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Subform to add teammate */}
                          {teamMembersInput.length < (selectedEvent.maxTeamSize || 4) - 1 ? (
                            <div className="p-2.5 bg-background rounded-xl border border-divider space-y-2 text-xs">
                              <span className="block text-[9px] font-bold text-indigo-400 uppercase tracking-wider">Add Team Member</span>
                              
                              <div>
                                <label className="block text-[8px] font-bold text-secondary uppercase tracking-wider mb-0.5">Roll Number *</label>
                                <input 
                                  type="text" 
                                  placeholder="Enter Roll Number"
                                  value={draftRoll}
                                  onChange={(e) => setDraftRoll(e.target.value)}
                                  className="w-full bg-surface border border-divider text-xs text-content rounded py-1.5 px-2 outline-none focus:border-indigo-500/40"
                                />
                              </div>
                              <button 
                                type="button"
                                onClick={() => {
                                  if (!draftRoll.trim()) {
                                    setRegFeedback('Teammate Roll Number is required.');
                                    return;
                                  }
                                  
                                  const searchRoll = draftRoll.trim().toLowerCase();
                                  if (searchRoll === user.rollNumber?.toLowerCase()) {
                                    setRegFeedback('You cannot add yourself as a teammate.');
                                    return;
                                  }
                                  if (teamMembersInput.some(m => m.rollNumber.toLowerCase() === searchRoll)) {
                                    setRegFeedback('Teammate is already added to the list.');
                                    return;
                                  }

                                  const teammateUser = allUsers.find(u => u.rollNumber?.toLowerCase() === searchRoll);
                                  
                                  if (!teammateUser) {
                                    setRegFeedback('No student found with this roll number. They must be registered in NOTX Connect.');
                                    return;
                                  }

                                  setRegFeedback('');
                                  setTeamMembersInput([...teamMembersInput, {
                                    name: teammateUser.name,
                                    rollNumber: teammateUser.rollNumber || draftRoll.trim().toUpperCase(),
                                    year: teammateUser.year || 'N/A',
                                    section: teammateUser.section || 'A',
                                    phone: teammateUser.phone || 'N/A'
                                  }]);
                                  
                                  setDraftRoll('');
                                }}
                                className="w-full bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 text-[10px] font-bold py-1.5 rounded-lg transition-all cursor-pointer border border-indigo-500/20"
                              >
                                + Add Member to Team List
                              </button>
                            </div>
                          ) : (
                            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-2.5 text-center text-[10px] text-primary font-medium">
                              Maximum team size reached.
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-[11px] text-secondary bg-background p-2.5 rounded-xl border border-divider">
                          Registering as an individual. Your student credentials will be linked automatically.
                        </div>
                      )}

                      <button 
                        onClick={() => {
                          if (selectedEvent.isTeamBased && !teamName.trim()) {
                            setRegFeedback('Please enter a Team Name.');
                            return;
                          }
                          handleRegister();
                        }}
                        disabled={isRegistering}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl py-3 shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center cursor-pointer"
                      >
                        {isRegistering ? (
                          <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                        ) : "Submit Registration"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* PARTICIPANTS & ATTENDANCE DASHBOARD */}
              {(user.role === 'admin' || 
                (user.role === 'associate' && user.powers?.canViewRegistrations) || 
                (user.role === 'coordinator' && user.assignedEvents?.includes(selectedEvent.eventId))) && (
                <div className="border-t border-divider pt-4 mt-3 space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-content uppercase tracking-wide">Participants Management</h4>
                      <p className="text-[9px] text-secondary mt-0.5">{eventRegistrations.length} Students registered</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button 
                        type="button"
                        onClick={() => handleGenerateBatchInModal(selectedEvent.eventId)}
                        disabled={isGeneratingBatch || !eventRegistrations.some(r => r.status === 'Attended')}
                        className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-xs active:scale-95"
                        title="Generate batch certificates for all attended students of this event"
                      >
                        <Zap className={`w-3 h-3 ${isGeneratingBatch ? 'animate-spin' : 'text-amber-300'}`} />
                        <span>{isGeneratingBatch ? 'Generating...' : '⚡ Generate Batch Certs'}</span>
                      </button>

                      {eventRegistrations.length > 0 && (
                        <button 
                          onClick={exportParticipantsToCSV}
                          className="flex items-center gap-1 bg-surface hover:bg-surface-accent text-primary text-[10px] font-bold px-2.5 py-1 rounded-lg border border-divider transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-indigo-400" />
                          Export Excel
                        </button>
                      )}
                    </div>
                  </div>

                  {batchFeedback && (
                    <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-semibold flex items-center justify-between">
                      <span>{batchFeedback}</span>
                      <button onClick={() => setBatchFeedback('')} className="text-secondary hover:text-content cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {eventRegistrations.length === 0 ? (
                    <div className="bg-surface/40 rounded-xl p-5 text-center border border-divider">
                      <p className="text-[11px] text-secondary font-medium">No registrations submitted yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                      {eventRegistrations.map((reg) => {
                        const regCert = dbCertificates.find(c => c.eventId === selectedEvent.eventId && (c.studentId === reg.studentId || (reg.rollNumber && c.rollNumber.toUpperCase() === reg.rollNumber.toUpperCase())));
                        const isRegCertIssued = Boolean(regCert && regCert.status !== 'Revoked');

                        return (
                          <div key={reg.registrationId} className="bg-surface p-2.5 rounded-xl border border-divider flex justify-between items-center gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-semibold text-content truncate">{reg.studentName}</span>
                                <span className="font-mono text-[9px] text-secondary">{reg.rollNumber}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] text-secondary">{reg.year}</span>
                                {reg.teamName && (
                                  <span className="text-[8px] bg-background text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/10">
                                    Team: {reg.teamName}
                                  </span>
                                )}
                              </div>
                              {reg.teamMembers && reg.teamMembers.length > 0 && (
                                <div className="mt-1 pl-2 border-l border-divider space-y-0.5">
                                  <span className="text-[8px] text-tertiary uppercase font-bold tracking-wider block">Teammates:</span>
                                  {reg.teamMembers.map((m, idx) => (
                                    <div key={idx} className="text-[9px] text-secondary">
                                      • {m.name} ({m.rollNumber}) - {m.year} Sec {m.section}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Attendance & Certificate indicators */}
                            <div className="flex items-center gap-1.5">
                              {reg.status === 'Attended' && (
                                <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border flex items-center gap-0.5 ${
                                  isRegCertIssued 
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                }`} title={isRegCertIssued ? `Certificate ID: ${regCert?.certificateId}` : 'Certificate Locked - Pending Admin Batch Generation'}>
                                  {isRegCertIssued ? <ShieldCheck className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                                  <span>{isRegCertIssued ? 'Issued' : 'Locked'}</span>
                                </span>
                              )}

                              {/* Attendance Switches */}
                              <div className="flex gap-1">
                                <button 
                                  onClick={() => handleAttendance(reg.registrationId, reg.status, 'Attended')}
                                  className={`text-[9px] font-bold px-2 py-1 rounded transition-colors cursor-pointer ${
                                    reg.status === 'Attended' 
                                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' 
                                      : 'bg-background hover:bg-surface-accent text-secondary border border-divider'
                                  }`}
                                >
                                  Present
                                </button>
                                <button 
                                  onClick={() => handleAttendance(reg.registrationId, reg.status, 'Absent')}
                                  className={`text-[9px] font-bold px-2 py-1 rounded transition-colors cursor-pointer ${
                                    reg.status === 'Absent' 
                                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                                      : 'bg-background hover:bg-surface-accent text-secondary border border-divider'
                                  }`}
                                >
                                  Absent
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ADMIN ACTIONS (EDIT / DELETE EVENT) */}
              {(user.role === 'admin' || (user.role === 'associate' && user.powers?.canManageEvents)) && (
                <div className="border-t border-divider pt-4 mt-3 flex flex-col gap-2">
                  <div className="bg-surface border border-divider rounded-xl p-3.5 flex flex-col items-center text-center">
                    <h4 className="text-xs font-bold text-primary">Manage Event</h4>
                    <p className="text-[10px] text-secondary mt-0.5 leading-relaxed">
                      Modify details or permanently delete this event.
                    </p>
                    <div className="flex gap-2 mt-3 w-full max-w-xs justify-center">
                      <button
                        type="button"
                        onClick={() => openEditForm(selectedEvent)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider py-2 px-4 rounded-xl transition-all cursor-pointer flex-1"
                      >
                        Edit Event
                      </button>
                      <HoldButton
                        size="sm"
                        holdTime={2000}
                        backgroundColor="rgba(244, 63, 94, 0.15)"
                        fillColor="#e11d48"
                        textColor="#fda4af"
                        fillTextColor="#ffffff"
                        radius={12}
                        doneLabel="Deleted"
                        onHold={async () => {
                          try {
                            await deleteEvent(selectedEvent.eventId);
                            setConfirmDeleteEvent(false);
                            setSelectedEvent(null);
                            refreshEvents();
                          } catch (err) {
                            console.error("Failed to delete event", err);
                          }
                        }}
                        className="flex-1 border border-rose-500/30 text-[10px] font-bold uppercase tracking-wider"
                      >
                        Hold to Delete
                      </HoldButton>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT EVENT FULL OVERLAY FORM */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex flex-col justify-end md:justify-center md:items-center p-0 md:p-6 select-none">
          <div className="bg-background rounded-t-[28px] md:rounded-[28px] border-t md:border border-divider/80 h-[92%] md:h-auto md:max-h-[85vh] w-full md:max-w-2xl flex flex-col overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-3.5 border-b border-divider flex justify-between items-center flex-shrink-0 bg-surface">
              <h3 className="text-xs font-extrabold uppercase text-primary tracking-wider">
                {editingEventId ? 'Edit Department Event' : 'Create New Department Event'}
              </h3>
              <button 
                onClick={() => {
                  setShowAddForm(false);
                  setEditingEventId(null);
                }}
                className="w-7.5 h-7.5 rounded-full bg-surface-accent flex items-center justify-center text-secondary hover:text-content border border-divider cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form */}
            <form onSubmit={handleCreateEvent} className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Event Title *</label>
                <input 
                  type="text" 
                  required
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g. AI Builder Arena Hackathon"
                  className="w-full bg-surface border border-divider text-xs text-content rounded-lg py-2 px-3 outline-none focus:border-indigo-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Category *</label>
                  <select 
                    value={eventCategory} 
                    onChange={(e) => setEventCategory(e.target.value as any)}
                    className="w-full bg-surface border border-divider text-xs text-primary rounded-lg py-2 px-2 outline-none focus:border-indigo-500/50"
                  >
                    <option value="Workshops">Workshops</option>
                    <option value="Hackathons">Hackathons</option>
                    <option value="Seminars">Seminars</option>
                    <option value="Cultural Events">Cultural Events</option>
                    <option value="Club Meetings">Club Meetings</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Venue *</label>
                  <input 
                    type="text" 
                    required
                    value={eventVenue}
                    onChange={(e) => setEventVenue(e.target.value)}
                    placeholder="e.g. Seminar Hall-1 or AI Lab"
                    className="w-full bg-surface border border-divider text-xs text-content rounded-lg py-2 px-3 outline-none focus:border-indigo-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Description *</label>
                <textarea 
                  required
                  rows={3}
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  placeholder="Provide details about registration incentives, topics, target participants..."
                  className="w-full bg-surface border border-divider text-xs text-content rounded-lg py-2 px-3 outline-none resize-none focus:border-indigo-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Date *</label>
                  <input 
                    type="date" 
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full bg-surface border border-divider text-xs text-primary rounded-lg py-2 px-2 outline-none focus:border-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Start Time *</label>
                  <input 
                    type="text" 
                    required
                    value={eventStartTime}
                    onChange={(e) => setEventStartTime(e.target.value)}
                    placeholder="e.g. 10:00 AM"
                    className="w-full bg-surface border border-divider text-xs text-content rounded-lg py-2 px-3 outline-none focus:border-indigo-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Duration</label>
                  <input 
                    type="text" 
                    value={eventDuration}
                    onChange={(e) => setEventDuration(e.target.value)}
                    placeholder="e.g. 3 Hours"
                    className="w-full bg-surface border border-divider text-xs text-content rounded-lg py-2 px-3 outline-none focus:border-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Max Participants</label>
                  <input 
                    type="number" 
                    value={eventMaxParticipants}
                    onChange={(e) => setEventMaxParticipants(Number(e.target.value))}
                    className="w-full bg-surface border border-divider text-xs text-content rounded-lg py-2 px-3 outline-none focus:border-indigo-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 bg-surface p-3 rounded-xl border border-divider">
                <div className="flex items-center justify-between col-span-2">
                  <div>
                    <span className="block text-[10px] font-bold text-content uppercase tracking-wider">Team-Based Event</span>
                    <span className="text-[9px] text-secondary">Students register as a team</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={eventIsTeamBased}
                    onChange={(e) => setEventIsTeamBased(e.target.checked)}
                    className="w-4 h-4 rounded border-divider bg-background text-indigo-600 focus:ring-indigo-500"
                  />
                </div>
                {eventIsTeamBased && (
                  <div className="col-span-2 pt-2 border-t border-divider animate-fade-in">
                    <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Max Team Size</label>
                    <input 
                      type="number" 
                      min={2}
                      max={10}
                      value={eventMaxTeamSize}
                      onChange={(e) => setEventMaxTeamSize(Number(e.target.value))}
                      className="w-full bg-background border border-divider text-xs text-content rounded-lg py-2 px-3 outline-none focus:border-indigo-500/50"
                    />
                  </div>
                )}
              </div>

              {/* DYNAMIC COORDINATOR SELECTION (FACULTY & STUDENT DB COORDINATORS) */}
              <div className="space-y-3 bg-surface p-3.5 rounded-2xl border border-divider shadow-sm">
                <div className="flex items-center justify-between border-b border-divider/60 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[10px] font-bold text-content uppercase tracking-wider">
                      Event Coordinators (Dynamic DB Selection)
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-tertiary">
                    {allUsers.filter(u => u.role === 'coordinator').length} Official Coordinators in DB
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Faculty Coordinator */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                        Faculty Coordinator
                      </label>
                      <span className="text-[8.5px] text-tertiary font-mono">Quick Pick</span>
                    </div>

                    <input 
                      type="text" 
                      value={eventFaculty}
                      onChange={(e) => setEventFaculty(e.target.value)}
                      placeholder="Dr. XYZ Prasad"
                      className="w-full bg-background border border-divider text-xs text-content rounded-lg py-2 px-3 outline-none focus:border-indigo-500/50"
                    />

                    {/* Quick Faculty Picks */}
                    <div className="flex flex-wrap gap-1 items-center pt-0.5">
                      <span className="text-[8.5px] text-tertiary font-mono mr-0.5">DB Leads:</span>
                      {allUsers.filter(u => u.role === 'faculty').length > 0 ? (
                        allUsers.filter(u => u.role === 'faculty').map(f => (
                          <button
                            key={f.uid}
                            type="button"
                            onClick={() => selectFacultyCoordinator(f.name)}
                            className={`text-[9px] px-1.5 py-0.5 rounded border transition-all cursor-pointer ${
                              eventFaculty.toLowerCase() === f.name.toLowerCase()
                                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 font-bold'
                                : 'bg-surface hover:bg-surface-accent text-secondary border-divider'
                            }`}
                          >
                            👨‍🏫 {f.name}
                          </button>
                        ))
                      ) : (
                        ['Dr. XYZ Prasad', 'Prof. A. Sharma', 'Dr. V. Rao'].map(fac => (
                          <button
                            key={fac}
                            type="button"
                            onClick={() => selectFacultyCoordinator(fac)}
                            className={`text-[9px] px-1.5 py-0.5 rounded border transition-all cursor-pointer ${
                              eventFaculty.toLowerCase() === fac.toLowerCase()
                                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 font-bold'
                                : 'bg-surface hover:bg-surface-accent text-secondary border-divider'
                            }`}
                          >
                            👨‍🏫 {fac}
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Student Coordinators */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                        Student Coordinators
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowCoordPickerModal(true)}
                        className="inline-flex items-center gap-1 text-[9.5px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 rounded-lg transition-all cursor-pointer"
                      >
                        <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                        <span>Fetch from DB</span>
                      </button>
                    </div>

                    {/* Chips for selected student coordinators */}
                    {selectedCoordNames.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-1">
                        {selectedCoordNames.map(name => {
                          const matchedUser = allUsers.find(u => u.name.toLowerCase() === name.toLowerCase());
                          return (
                            <span
                              key={name}
                              className="inline-flex items-center gap-1 bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-md text-[10px] font-semibold"
                            >
                              <span>{name}</span>
                              {matchedUser?.rollNumber && (
                                <span className="text-[8.5px] font-mono text-tertiary">({matchedUser.rollNumber})</span>
                              )}
                              <button
                                type="button"
                                onClick={() => removeCoordinatorName(name)}
                                className="text-indigo-400 hover:text-rose-400 p-0.5 cursor-pointer"
                                title="Remove coordinator"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}

                    <input 
                      type="text" 
                      value={eventStudent}
                      onChange={(e) => setEventStudent(e.target.value)}
                      placeholder="e.g. Sameer, John (or click Fetch from DB)"
                      className="w-full bg-background border border-divider text-xs text-content rounded-lg py-2 px-3 outline-none focus:border-indigo-500/50"
                    />

                    {/* Quick DB Coordinator pills */}
                    <div className="pt-0.5">
                      <div className="text-[8.5px] text-tertiary font-mono mb-1">Quick Add DB Coordinators:</div>
                      <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pr-1">
                        {allUsers
                          .filter(u => u.role === 'coordinator' || u.role === 'associate')
                          .map(c => {
                            const isSelected = selectedCoordNames.some(n => n.toLowerCase() === c.name.toLowerCase());
                            return (
                              <button
                                key={c.uid}
                                type="button"
                                onClick={() => toggleCoordinatorName(c.name)}
                                className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded border transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                                    : 'bg-surface hover:bg-surface-accent text-secondary border-divider'
                                }`}
                              >
                                <span>{isSelected ? '✓' : '+'}</span>
                                <span>{c.name}</span>
                                {c.rollNumber && (
                                  <span className="font-mono text-[8px] opacity-70">({c.rollNumber})</span>
                                )}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Event Poster / Cover Images</label>
                <ImageUploader 
                  maxFiles={5} 
                  onUploadSuccess={(urls) => {
                    setEventImages(urls);
                    if (urls.length > 0) {
                      if (!eventPoster) setEventPoster(urls[0]);
                      const img = new Image();
                      img.onload = () => {
                        const orient = img.naturalHeight > img.naturalWidth ? 'portrait' : 'landscape';
                        setPosterOrientations(prev => ({ ...prev, [urls[0]]: orient }));
                      };
                      img.src = urls[0];
                    }
                  }} 
                  buttonLabel="Upload Event Photos" 
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Poster Orientation</label>
                  <select
                    value={eventPosterOrientation}
                    onChange={(e) => setEventPosterOrientation(e.target.value as any)}
                    className="w-full bg-surface border border-divider text-xs text-primary rounded-lg py-2 px-2 outline-none focus:border-indigo-500/50"
                  >
                    <option value="auto">Auto-detect from image</option>
                    <option value="portrait">Portrait (Tall)</option>
                    <option value="landscape">Landscape (Wide)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Direct Poster URL (Optional)</label>
                  <input
                    type="url"
                    value={eventPoster}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEventPoster(val);
                      if (val) {
                        const img = new Image();
                        img.onload = () => {
                          const orient = img.naturalHeight > img.naturalWidth ? 'portrait' : 'landscape';
                          setPosterOrientations(prev => ({ ...prev, [val]: orient }));
                        };
                        img.src = val;
                      }
                    }}
                    placeholder="https://..."
                    className="w-full bg-surface border border-divider text-xs text-content rounded-lg py-2 px-3 outline-none focus:border-indigo-500/50 truncate"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Event Rules</label>
                <textarea 
                  rows={2}
                  value={eventRules}
                  onChange={(e) => setEventRules(e.target.value)}
                  placeholder="1. Open only to CSE students&#10;2. Max 4 members..."
                  className="w-full bg-surface border border-divider text-xs text-content rounded-lg py-2 px-3 outline-none resize-none focus:border-indigo-500/50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Requirements</label>
                <input 
                  type="text" 
                  value={eventReqs}
                  onChange={(e) => setEventReqs(e.target.value)}
                  placeholder="e.g. Laptops, GitHub ID, etc."
                  className="w-full bg-surface border border-divider text-xs text-content rounded-lg py-2 px-3 outline-none focus:border-indigo-500/50"
                />
              </div>

              <div className="pt-3 flex gap-2.5 mt-2">
                <button 
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingEventId(null);
                  }}
                  className="flex-1 bg-surface border border-divider hover:bg-surface-accent text-secondary font-bold text-xs uppercase tracking-wider rounded-xl py-3 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-[2] bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl py-3 shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
                >
                  {editingEventId ? 'Save Changes' : 'Publish & Notify'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic DB Coordinator Picker Modal */}
      {showCoordPickerModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-60 flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-150">
          <div className="bg-surface border border-divider/90 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-divider/70 flex items-center justify-between bg-surface-accent/40 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-content font-display">Fetch Coordinators from Database</h3>
                  <p className="text-[10.5px] text-secondary">Dynamically assign registered students and coordinators to lead this event</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCoordPickerModal(false)}
                className="w-7 h-7 rounded-xl bg-surface-accent hover:bg-divider text-secondary hover:text-content border border-divider flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 space-y-3 flex-1 overflow-y-auto">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                <input
                  type="text"
                  placeholder="Search by student name, roll number, or department..."
                  value={coordSearchQuery}
                  onChange={(e) => setCoordSearchQuery(e.target.value)}
                  className="w-full bg-background border border-divider text-xs text-content rounded-xl pl-9 pr-3 py-2 outline-none focus:border-indigo-500/50"
                />
              </div>

              {/* Role Filter Tabs */}
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {(['all', 'coordinator', 'associate', 'student'] as const).map((r) => {
                  const count = r === 'all' 
                    ? allUsers.filter(u => u.uid !== 'admin_master').length
                    : allUsers.filter(u => u.role === r).length;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setCoordFilterRole(r)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer capitalize shrink-0 ${
                        coordFilterRole === r
                          ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30'
                          : 'bg-background text-secondary border-divider hover:text-content'
                      }`}
                    >
                      {r === 'all' ? 'All in DB' : `${r}s`} ({count})
                    </button>
                  );
                })}
              </div>

              {/* User Results List */}
              <div className="space-y-1.5 max-h-72 overflow-y-auto divide-y divide-divider/40">
                {allUsers
                  .filter(u => {
                    if (u.uid === 'admin_master') return false;
                    if (coordFilterRole !== 'all' && u.role !== coordFilterRole) return false;
                    const q = coordSearchQuery.toLowerCase().trim();
                    if (!q) return true;
                    return (u.name || '').toLowerCase().includes(q) ||
                           (u.rollNumber || '').toLowerCase().includes(q) ||
                           (u.department || '').toLowerCase().includes(q);
                  })
                  .map((u) => {
                    const isSelected = selectedCoordNames.some(n => n.toLowerCase() === u.name.toLowerCase());
                    return (
                      <div
                        key={u.uid}
                        className="pt-2 pb-2 flex items-center justify-between gap-3 hover:bg-surface-accent/40 px-2 rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-surface-accent overflow-hidden shrink-0 border border-divider">
                            <img
                              src={u.profile_pic || `https://api.dicebear.com/9.x/notionists/svg?seed=${u.rollNumber || u.uid}`}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-content text-xs truncate">{u.name}</span>
                              <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 uppercase">
                                {u.role}
                              </span>
                            </div>
                            <div className="text-[10px] text-secondary font-mono truncate">
                              {u.rollNumber || 'N/A'} • {u.department || 'CSE (AI & ML)'} • {u.year || '3rd Year'}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleCoordinatorName(u.name)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
                            isSelected
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-surface hover:bg-indigo-600/15 text-indigo-300 border-divider hover:border-indigo-500/40'
                          }`}
                        >
                          {isSelected ? '✓ Assigned' : '+ Assign'}
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Footer Summary & Done Button */}
            <div className="p-3 border-t border-divider/70 bg-surface-accent/30 flex items-center justify-between shrink-0">
              <div className="text-[10px] text-secondary font-mono">
                <strong className="text-content">{selectedCoordNames.length}</strong> coordinator(s) selected
              </div>
              <button
                type="button"
                onClick={() => setShowCoordPickerModal(false)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-600/20"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
