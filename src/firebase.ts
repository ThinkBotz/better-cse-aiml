import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocFromServer,
  writeBatch,
  onSnapshot
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { 
  DepartmentEvent, 
  EventRegistration, 
  Album, 
  Announcement, 
  
  UserProfile,
  TeamMember,
  UserInvitation,
  ChatRoom,
  AppConfig,
  SupportInfo,
  DEFAULT_SUPPORT_INFO,
  CertificateTemplate,
  DEFAULT_CERTIFICATE_TEMPLATE,
  IssuedCertificate,
  EventWinner,
  AppBranding,
  DEFAULT_BRANDING
} from './types';

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Initial Seeding Data
const INITIAL_USERS: UserProfile[] = [
  {
    uid: "user_admin_syed",
    name: "Sameer Ahmed (Admin)",
    email: "syedsame2244@gmail.com",
    role: "admin",
    phone: "+91 9999999999",
    profile_pic: "",
    rollNumber: "ADMIN001",
    position: "Chief Admin (Student President)",
    department: "CSE (AI & ML)",
    responsibilities: "Administrator of NOTX Connect, HOD Executive coordinator, and technical/event approvals lead.",
    created_at: new Date().toISOString()
  },
  {
    uid: "user_admin",
    name: "Dr. XYZ Prasad",
    email: "xyz.prasad@aits.edu",
    role: "admin",
    phone: "+91 9876543210",
    profile_pic: "",
    rollNumber: "ADMIN002",
    position: "HOD & Association Chief Patron",
    department: "CSE (AI & ML)",
    responsibilities: "Overall administrative oversight, event approvals, and strategic vision for NOTX Association.",
    created_at: new Date().toISOString()
  },
  {
    uid: "user_associate_president",
    name: "Sameer Ahmed",
    email: "sameer.notx@aits.edu",
    role: "associate",
    phone: "+91 8765432109",
    profile_pic: "",
    rollNumber: "ASSOC001",
    position: "President, NOTX",
    department: "CSE (AI & ML)",
    year: "4th Year",
    linkedin: "https://linkedin.com/in/sameer-ai-ml",
    responsibilities: "Leading student initiatives, coordinating with HOD, and managing event schedules and notifications.",
    powers: {
      canManageEvents: true,
      canManageAnnouncements: true,
      canViewRegistrations: true,
      canManageGallery: true
    },
    created_at: new Date().toISOString()
  },
  {
    uid: "user_associate_tech",
    name: "John Doe",
    email: "john.doe@aits.edu",
    role: "associate",
    phone: "+91 7654321098",
    profile_pic: "",
    rollNumber: "ASSOC002",
    position: "Technical Lead",
    department: "CSE (AI & ML)",
    year: "3rd Year",
    linkedin: "https://linkedin.com/in/johndoe-tech",
    responsibilities: "Organizing hackathons, technical workshops, and mentoring students in GenAI models and AI pipelines.",
    powers: {
      canManageEvents: true,
      canManageAnnouncements: false,
      canViewRegistrations: true,
      canManageGallery: true
    },
    created_at: new Date().toISOString()
  }
];

const INITIAL_EVENTS: DepartmentEvent[] = [
  {
    eventId: "event_ai_builder",
    title: "AI Builder Arena Hackathon",
    category: "Hackathons",
    description: "Build cutting-edge GenAI solutions using Gemini API, LangChain, or direct LLM agents. Teams of 1 to 4 members. Prizes worth ₹50,000 to be won!",
    date: "2026-08-10",
    startTime: "10:00 AM",
    endTime: "05:00 PM",
    duration: "7 Hours",
    venue: "AI & ML Innovation Lab, Block 3",
    facultyCoordinator: "Dr. XYZ Prasad",
    studentCoordinators: "Sameer Ahmed, John Doe",
    maxParticipants: 100,
    registrationDeadline: "2026-08-08",
    posterImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&h=450&q=80",
    rules: "1. Open only to CSE/AML branch students.\n2. Projects must use some form of Artificial Intelligence or LLMs.\n3. Pre-existing codes are not allowed; GitHub history will be evaluated.\n4. Judgment criteria: Innovation, Technical Depth, UI/UX, and Pitch Presentation.",
    requirements: "Laptops, GitHub accounts, and active Google AI Studio API key.",
    createdAt: new Date().toISOString(),
    isTeamBased: true,
    maxTeamSize: 4
  },
  {
    eventId: "event_prompt_workshop",
    title: "Advanced Prompt Engineering & Agentic Workflow",
    category: "Workshops",
    description: "Hands-on masterclass focusing on system prompting, chain of thought, dynamic routing, and setting up Multi-Agent systems using AutoGen & CrewAI.",
    date: "2026-08-15",
    startTime: "11:00 AM",
    endTime: "02:00 PM",
    duration: "3 Hours",
    venue: "Seminar Hall-1",
    facultyCoordinator: "Mrs. M. Anuradha",
    studentCoordinators: "Neha Sharma, Sameer Ahmed",
    maxParticipants: 60,
    registrationDeadline: "2026-08-14",
    posterImage: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&h=450&q=80",
    rules: "1. Prior basic Python knowledge is recommended but not mandatory.\n2. Bring a fully-charged laptop with Google Colab set up.",
    requirements: "Web browser, Gmail account.",
    createdAt: new Date().toISOString(),
    isTeamBased: false
  },
  {
    eventId: "event_cultural_aml",
    title: "AML Tech-Fest & Creative Cultural Meet",
    category: "Cultural Events",
    description: "An offline celebration blending creative technical exhibits with cultural performances, AI art displays, stand-up comedy, and acoustic music.",
    date: "2026-08-25",
    startTime: "02:00 PM",
    endTime: "06:00 PM",
    duration: "4 Hours",
    venue: "Open Auditorium",
    facultyCoordinator: "Dr. XYZ Prasad",
    studentCoordinators: "Sameer Ahmed",
    maxParticipants: 300,
    registrationDeadline: "2026-08-24",
    posterImage: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&h=450&q=80",
    rules: "1. Registration is free for all association members.\n2. Registration mandatory for catering arrangements.",
    requirements: "Show app registration badge at the gate.",
    createdAt: new Date().toISOString(),
    isTeamBased: false
  }
];

const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    announcementId: "announce_mid_exam",
    title: "Mid-I Examinations Schedule (V-Semester)",
    content: "The Mid-I examinations for B.Tech IIIrd Year I-Sem (AI&ML) will commence from August 1st, 2026. The detailed timetable has been pinned on the notice board. Topics up to Unit-II are included. Clear all tuition fee dues immediately to get your hall ticket.",
    category: "Exam",
    date: "2026-07-01",
    author: "HOD Office"
  },
  {
    announcementId: "announce_notx_launch",
    title: "Registration Open for NOTX Connect App",
    content: "Welcome to our customized department app! All CSE (AI & ML) students are requested to create their profile, add their tech skills, and register for the upcoming AI Builder Hackathon directly via this application.",
    category: "News",
    date: "2026-07-01",
    author: "NOTX Association"
  },
  {
    announcementId: "announce_results_arena",
    title: "Prompt Engineering Workshop Registrations Live!",
    content: "Seats are limited to 60 for the upcoming Masterclass on Prompt Engineering on August 15th. Register right away from the events page. E-certificates will be provided to all attendees.",
    category: "Workshop",
    date: "2026-07-02",
    author: "Technical Committee"
  }
];

const INITIAL_ALBUMS: Album[] = [
  {
    albumId: 'album_1',
    title: 'Hackathon 2025 Highlights',
    description: 'Amazing moments from our annual hackathon.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80',
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80'
    ],
    category: 'Hackathons',
    uploadedBy: 'Admin',
    createdAt: new Date().toISOString()
  }
];


// Seeding engine
export async function seedDatabaseIfEmpty() {
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    if (usersSnap.empty) {
      console.log("Seeding database with default department ecosystem data...");
      
      // Seed Users
      for (const user of INITIAL_USERS) {
        await setDoc(doc(db, 'users', user.uid), user);
      }

      // Seed Events
      for (const event of INITIAL_EVENTS) {
        await setDoc(doc(db, 'events', event.eventId), event);
      }

      // Seed Announcements
      for (const announce of INITIAL_ANNOUNCEMENTS) {
        await setDoc(doc(db, 'announcements', announce.announcementId), announce);
      }

      // Seed Gallery
      for (const gallery of INITIAL_ALBUMS) {
        await setDoc(doc(db, 'albums', gallery.albumId), gallery);
      }


      console.log("Database seeded successfully!");
    } else {
      console.log("Database is already initialized with data.");
    }

    // Always ensure the user syedsame2244@gmail.com is present and marked as Admin
    const adminEmail = "syedsame2244@gmail.com";
    const q = query(collection(db, 'users'), where('email', '==', adminEmail));
    const adminSnap = await getDocs(q);
    if (adminSnap.empty) {
      console.log("Creating Admin account for syedsame2244@gmail.com...");
      const newAdmin: UserProfile = {
        uid: "user_admin_syed",
        name: "Sameer Ahmed (Admin)",
        email: adminEmail,
        role: "admin",
        phone: "+91 9999999999",
        profile_pic: "",
        rollNumber: "ADMIN001",
        position: "Chief Admin (Student President)",
        department: "CSE (AI & ML)",
        responsibilities: "Administrator of NOTX Connect, HOD Executive coordinator, and technical/event approvals lead.",
        created_at: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', newAdmin.uid), newAdmin);
    } else {
      // If user exists but is not Admin, update them to Admin
      adminSnap.forEach(async (docRef) => {
        const u = docRef.data() as UserProfile;
        if (u.role !== 'admin') {
          console.log(`Updating role of ${adminEmail} to admin...`);
          await updateDoc(doc(db, 'users', docRef.id), { role: 'admin' });
        }
      });
    }

    // Ensure sample certificates exist for demonstration of the database and peer features
    const certsSnap = await getDocs(collection(db, 'certificates'));
    if (certsSnap.empty) {
      const sampleCerts: IssuedCertificate[] = [
        {
          certificateId: "CERT-AIML-0501-A4B7",
          eventId: "event_1",
          eventTitle: "AI & Neural Networks Masterclass",
          eventDate: "2026-10-28",
          eventVenue: "Campus Auditorium, Block-3",
          studentId: "user_student_1",
          studentName: "Aarav Sharma",
          rollNumber: "22A91A0501",
          department: "CSE (AI & ML)",
          year: "III Year",
          section: "A",
          issueDate: "2026-10-28",
          issuedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          issuedBy: "Department Administration",
          status: "Issued",
          qrVerificationData: "https://notx-connect.edu/verify?id=CERT-AIML-0501-A4B7"
        },
        {
          certificateId: "CERT-AIML-0502-K9X3",
          eventId: "event_1",
          eventTitle: "AI & Neural Networks Masterclass",
          eventDate: "2026-10-28",
          eventVenue: "Campus Auditorium, Block-3",
          studentId: "user_student_2",
          studentName: "Ananya Iyer",
          rollNumber: "22A91A0502",
          department: "CSE (AI & ML)",
          year: "III Year",
          section: "A",
          issueDate: "2026-10-28",
          issuedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          issuedBy: "Department Administration",
          status: "Issued",
          qrVerificationData: "https://notx-connect.edu/verify?id=CERT-AIML-0502-K9X3"
        },
        {
          certificateId: "CERT-AIML-0503-M2P8",
          eventId: "event_1",
          eventTitle: "AI & Neural Networks Masterclass",
          eventDate: "2026-10-28",
          eventVenue: "Campus Auditorium, Block-3",
          studentId: "user_student_3",
          studentName: "Rohan Varma",
          rollNumber: "22A91A0503",
          department: "CSE (AI & ML)",
          year: "III Year",
          section: "B",
          issueDate: "2026-10-28",
          issuedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          issuedBy: "Department Administration",
          status: "Issued",
          qrVerificationData: "https://notx-connect.edu/verify?id=CERT-AIML-0503-M2P8"
        },
        {
          certificateId: "CERT-AIML-0504-H7T1",
          eventId: "event_2",
          eventTitle: "Prompt Engineering & GenAI Hackathon",
          eventDate: "2026-08-15",
          eventVenue: "Innovation Lab 314",
          studentId: "user_student_1",
          studentName: "Aarav Sharma",
          rollNumber: "22A91A0501",
          department: "CSE (AI & ML)",
          year: "III Year",
          section: "A",
          issueDate: "2026-08-15",
          issuedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
          issuedBy: "Department Administration",
          status: "Issued",
          qrVerificationData: "https://notx-connect.edu/verify?id=CERT-AIML-0504-H7T1"
        },
        {
          certificateId: "CERT-AIML-0505-L4D6",
          eventId: "event_2",
          eventTitle: "Prompt Engineering & GenAI Hackathon",
          eventDate: "2026-08-15",
          eventVenue: "Innovation Lab 314",
          studentId: "user_student_4",
          studentName: "Sneha Reddy",
          rollNumber: "22A91A0504",
          department: "CSE (AI & ML)",
          year: "III Year",
          section: "A",
          issueDate: "2026-08-15",
          issuedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
          issuedBy: "Department Administration",
          status: "Issued",
          qrVerificationData: "https://notx-connect.edu/verify?id=CERT-AIML-0505-L4D6"
        }
      ];

      for (const cert of sampleCerts) {
        await setDoc(doc(db, 'certificates', cert.certificateId), cert);
      }
    }

    // Seed Event Winners if collection is empty
    const winnersSnap = await getDocs(collection(db, 'event_winners'));
    if (winnersSnap.empty) {
      const sampleWinners: EventWinner[] = [
        {
          winnerId: "winner_prompt_hackathon_1",
          eventId: "event_2",
          eventTitle: "Prompt Engineering & GenAI Hackathon",
          eventDate: "2026-08-15",
          studentId: "user_student_1",
          studentName: "Aarav Sharma",
          rollNumber: "22A91A0501",
          department: "CSE (AI & ML)",
          year: "III Year",
          section: "A",
          studentPhoto: "https://api.dicebear.com/9.x/notionists/svg?seed=22A91A0501",
          position: "1st Place",
          prizeTitle: "🏆 1st Prize • Champion",
          awardDetails: "₹5,000 Cash Prize + Certificate of Excellence",
          projectTitle: "Project: MedPrompt AI Multi-Modal Diagnostic Agent",
          addedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
          addedBy: "Department Administration"
        },
        {
          winnerId: "winner_prompt_hackathon_2",
          eventId: "event_2",
          eventTitle: "Prompt Engineering & GenAI Hackathon",
          eventDate: "2026-08-15",
          studentId: "user_student_4",
          studentName: "Sneha Reddy",
          rollNumber: "22A91A0504",
          department: "CSE (AI & ML)",
          year: "III Year",
          section: "A",
          studentPhoto: "https://api.dicebear.com/9.x/notionists/svg?seed=22A91A0504",
          position: "2nd Place",
          prizeTitle: "🥈 2nd Prize • Runner-Up",
          awardDetails: "₹3,000 Cash Prize + Certificate of Merit",
          projectTitle: "Project: Smart Autonomous Code Optimizer",
          addedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
          addedBy: "Department Administration"
        },
        {
          winnerId: "winner_workshop_1",
          eventId: "event_1",
          eventTitle: "Full-Stack AI Agents Workshop",
          eventDate: "2026-08-10",
          studentId: "user_student_3",
          studentName: "Vikram Patel",
          rollNumber: "22A91A0503",
          department: "CSE (AI & ML)",
          year: "III Year",
          section: "B",
          studentPhoto: "https://api.dicebear.com/9.x/notionists/svg?seed=22A91A0503",
          position: "Special Mention",
          prizeTitle: "🌟 Best Innovation Showcase",
          awardDetails: "Citation of Excellence + Research Sponsorship",
          projectTitle: "Project: Autonomous Curriculum Graph Agent",
          addedAt: new Date(Date.now() - 86400000 * 8).toISOString(),
          addedBy: "Department Administration"
        }
      ];

      for (const w of sampleWinners) {
        await setDoc(doc(db, 'event_winners', w.winnerId), w);
      }
    }
  } catch (error) {
    console.error("Error seeding database: ", error);
  }
}

// ---------------- DATABASE ERROR HANDLING ----------------

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Helper to recursively remove undefined properties before writing to Firestore
function cleanUndefined<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (obj instanceof Date) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefined(item)) as unknown as T;
  }
  const result: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const val = (obj as any)[key];
      if (val !== undefined) {
        result[key] = cleanUndefined(val);
      }
    }
  }
  return result as T;
}

// ---------------- DATABASE ACTIONS ----------------

// Users
export async function fetchUsers(): Promise<UserProfile[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    const users: UserProfile[] = [];
    querySnapshot.forEach((doc) => {
      users.push(doc.data() as UserProfile);
    });
    return users;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'users');
  }
}

export async function fetchUserById(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function deleteUserProfile(uid: string) {
  try {
    const docRef = doc(db, "users", uid);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting user profile: ", error);
    throw error;
  }
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  const path = `users/${uid}`;
  try {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, cleanUndefined(data));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function createUserProfile(profile: UserProfile): Promise<void> {
  const path = `users/${profile.uid}`;
  try {
    const docRef = doc(db, 'users', profile.uid);
    await setDoc(docRef, cleanUndefined(profile));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function createMultipleUserProfiles(profiles: UserProfile[]): Promise<void> {
  if (profiles.length === 0) return;
  const path = 'users';
  try {
    const batchSize = 400;
    for (let i = 0; i < profiles.length; i += batchSize) {
      const chunk = profiles.slice(i, i + batchSize);
      const batch = writeBatch(db);
      for (const profile of chunk) {
        const docRef = doc(db, 'users', profile.uid);
        batch.set(docRef, cleanUndefined(profile));
      }
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function findUserForLogin(identifier: string): Promise<UserProfile | null> {
  const cleanId = identifier.trim();
  const lowerId = cleanId.toLowerCase();
  const upperId = cleanId.toUpperCase();

  // 1. Check direct doc lookup by student roll ID pattern
  try {
    const docRef = doc(db, 'users', `user_student_${lowerId}`);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
  } catch {
    // proceed
  }

  // 2. Query by rollNumber
  try {
    const qRoll = query(collection(db, 'users'), where('rollNumber', 'in', [upperId, cleanId, lowerId]));
    const snapRoll = await getDocs(qRoll);
    if (!snapRoll.empty) {
      return snapRoll.docs[0].data() as UserProfile;
    }
  } catch {
    // proceed
  }

  // 3. Query by email
  try {
    const qEmail = query(collection(db, 'users'), where('email', 'in', [lowerId, cleanId]));
    const snapEmail = await getDocs(qEmail);
    if (!snapEmail.empty) {
      return snapEmail.docs[0].data() as UserProfile;
    }
  } catch {
    // proceed
  }

  return null;
}

// Events
export async function fetchEvents(): Promise<DepartmentEvent[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'events'));
    const events: DepartmentEvent[] = [];
    querySnapshot.forEach((doc) => {
      events.push(doc.data() as DepartmentEvent);
    });
    // Sort by date ascending
    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'events');
  }
}

export async function createEvent(event: DepartmentEvent): Promise<void> {
  const path = `events/${event.eventId}`;
  try {
    const docRef = doc(db, 'events', event.eventId);
    await setDoc(docRef, cleanUndefined(event));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Registrations
export async function fetchRegistrations(): Promise<EventRegistration[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'registrations'));
    const registrations: EventRegistration[] = [];
    querySnapshot.forEach((doc) => {
      registrations.push(doc.data() as EventRegistration);
    });
    return registrations;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'registrations');
  }
}

export async function fetchRegistrationsByStudent(studentId: string): Promise<EventRegistration[]> {
  try {
    const q = query(collection(db, 'registrations'), where('studentId', '==', studentId));
    const querySnapshot = await getDocs(q);
    const registrations: EventRegistration[] = [];
    querySnapshot.forEach((doc) => {
      registrations.push(doc.data() as EventRegistration);
    });
    return registrations;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'registrations');
  }
}

export async function fetchRegistrationsByEvent(eventId: string): Promise<EventRegistration[]> {
  try {
    const q = query(collection(db, 'registrations'), where('eventId', '==', eventId));
    const querySnapshot = await getDocs(q);
    const registrations: EventRegistration[] = [];
    querySnapshot.forEach((doc) => {
      registrations.push(doc.data() as EventRegistration);
    });
    return registrations;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'registrations');
  }
}

export async function createRegistration(reg: EventRegistration): Promise<void> {
  const path = `registrations/${reg.registrationId}`;
  try {
    const docRef = doc(db, 'registrations', reg.registrationId);
    await setDoc(docRef, cleanUndefined(reg));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateRegistrationStatus(regId: string, status: 'Registered' | 'Attended' | 'Absent'): Promise<void> {
  const path = `registrations/${regId}`;
  try {
    const docRef = doc(db, 'registrations', regId);
    await updateDoc(docRef, { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateRegistrationTeamMembers(regId: string, teamMembers: TeamMember[]): Promise<void> {
  const path = `registrations/${regId}`;
  try {
    const docRef = doc(db, 'registrations', regId);
    await updateDoc(docRef, { teamMembers: cleanUndefined(teamMembers) });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Gallery
export async function fetchAlbums(): Promise<Album[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'albums'));
    const items: Album[] = [];
    querySnapshot.forEach((doc) => {
      items.push(doc.data() as Album);
    });
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'albums');
  }
}

export async function addAlbum(item: Album): Promise<void> {
  const path = `albums/${item.albumId}`;
  try {
    const docRef = doc(db, 'albums', item.albumId);
    await setDoc(docRef, cleanUndefined(item));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateAlbum(albumId: string, updates: Partial<Album>): Promise<void> {
  const path = `albums/${albumId}`;
  try {
    const docRef = doc(db, 'albums', albumId);
    await updateDoc(docRef, cleanUndefined(updates) as any);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteAlbum(albumId: string): Promise<void> {
  const path = `albums/${albumId}`;
  try {
    const docRef = doc(db, 'albums', albumId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Announcements
export async function fetchAnnouncements(): Promise<Announcement[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'announcements'));
    const items: Announcement[] = [];
    querySnapshot.forEach((doc) => {
      items.push(doc.data() as Announcement);
    });
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'announcements');
  }
}

export async function createAnnouncement(announce: Announcement): Promise<void> {
  const path = `announcements/${announce.announcementId}`;
  try {
    const docRef = doc(db, 'announcements', announce.announcementId);
    await setDoc(docRef, cleanUndefined(announce));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}
// User Invitations & Direct Messaging
export async function fetchReceivedInvitations(rollNumber: string): Promise<UserInvitation[]> {
  try {
    const q = query(collection(db, 'invitations'), where('recipientRoll', '==', rollNumber.trim().toUpperCase()));
    const querySnapshot = await getDocs(q);
    const list: UserInvitation[] = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.data() as UserInvitation);
    });
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'invitations');
    return [];
  }
}

export async function fetchSentInvitations(uid: string, rollNumber?: string): Promise<UserInvitation[]> {
  try {
    let q;
    if (rollNumber) {
      q = query(collection(db, 'invitations'), where('senderRoll', '==', rollNumber.trim().toUpperCase()));
    } else {
      q = query(collection(db, 'invitations'), where('senderUid', '==', uid));
    }
    const querySnapshot = await getDocs(q);
    const list: UserInvitation[] = [];
    querySnapshot.forEach((doc) => {
      list.push(doc.data() as UserInvitation);
    });
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'invitations');
    return [];
  }
}

export async function createInvitation(invite: UserInvitation): Promise<void> {
  const path = `invitations/${invite.invitationId}`;
  try {
    const docRef = doc(db, 'invitations', invite.invitationId);
    await setDoc(docRef, cleanUndefined(invite));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateInvitationStatus(inviteId: string, status: 'Pending' | 'Accepted' | 'Declined'): Promise<void> {
  const path = `invitations/${inviteId}`;
  try {
    const docRef = doc(db, 'invitations', inviteId);
    await updateDoc(docRef, { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Deletions
export async function updateEvent(event: DepartmentEvent): Promise<void> {
  const path = `events/${event.eventId}`;
  try {
    const docRef = doc(db, 'events', event.eventId);
    await setDoc(docRef, cleanUndefined(event), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteEvent(eventId: string): Promise<void> {
  const path = `events/${eventId}`;
  try {
    const docRef = doc(db, 'events', eventId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function deleteAnnouncement(announcementId: string): Promise<void> {
  const path = `announcements/${announcementId}`;
  try {
    const docRef = doc(db, 'announcements', announcementId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------- UNIFIED CHATS COLLECTION (USER'S JSON/ARRAY CHAT MODEL) ----------------

export function getChatRoomId(rollA: string, rollB: string): string {
  const rA = rollA.trim().toUpperCase();
  const rB = rollB.trim().toUpperCase();
  // Sort alphabetically to ensure same ID is generated for both (A->B and B->A)
  const sorted = [rA, rB].sort();
  return `CHAT_${sorted[0]}_${sorted[1]}`;
}

export async function sendChatMessage(
  sender: UserProfile,
  recipientRoll: string,
  recipientUid: string,
  recipientName: string,
  messageText: string,
  type: 'chat' | 'invite' = 'chat'
): Promise<void> {
  if (!sender.rollNumber) throw new Error("Sender has no roll number");
  
  const rRoll = recipientRoll.trim().toUpperCase();
  const sRoll = sender.rollNumber.trim().toUpperCase();
  const chatId = getChatRoomId(sRoll, rRoll);
  
  const path = `chats/${chatId}`;
  
  try {
    const chatDocRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatDocRef);
    
    let currentMessages: UserInvitation[] = [];
    let isNewChat = true;

    if (chatSnap.exists()) {
      const data = chatSnap.data() as ChatRoom;
      if (Array.isArray(data.messages)) {
        currentMessages = data.messages;
      }
      
      // If there are existing messages, it's not a new chat (unless they were all deleted, which counts as new chat again)
      if (currentMessages.length > 0) {
        isNewChat = false;
      }
    }
    
    // Force type to invite if this is a new chat to enforce request acceptance
    const actualType = isNewChat ? 'invite' : type;
    
    const newInvite: UserInvitation = {
      invitationId: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      senderUid: sender.uid,
      senderName: sender.name,
      senderRoll: sRoll,
      recipientUid,
      recipientRoll: rRoll,
      recipientName,
      message: messageText.trim(),
      status: 'Pending',
      createdAt: new Date().toISOString(),
      type: actualType,
      isRead: false
    };

    // Append new message
    currentMessages.push(newInvite);
    
    const updatedRoom: ChatRoom = {
      chatId,
      participants: [sRoll, rRoll],
      messages: currentMessages,
      lastMessageAt: newInvite.createdAt
    };

    await setDoc(chatDocRef, cleanUndefined(updatedRoom));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function markMessagesAsRead(
  userRoll: string,
  classmateRoll: string
): Promise<void> {
  const chatId = getChatRoomId(userRoll, classmateRoll);
  const path = `chats/${chatId}`;
  
  try {
    const chatDocRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatDocRef);
    if (!chatSnap.exists()) return;
    
    const data = chatSnap.data() as ChatRoom;
    if (!Array.isArray(data.messages)) return;
    
    const userRollUpper = userRoll.trim().toUpperCase();
    let updated = false;
    
    const updatedMessages = data.messages.map(msg => {
      const isRecipient = msg.recipientRoll.toUpperCase() === userRollUpper;
      const isChat = msg.type === 'chat';
      
      if (isRecipient && isChat && !msg.isRead) {
        updated = true;
        return { ...msg, isRead: true };
      }
      return msg;
    });
    
    if (updated) {
      await updateDoc(chatDocRef, {
        messages: cleanUndefined(updatedMessages)
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function respondToChatInvite(
  chatId: string,
  messageId: string,
  status: 'Accepted' | 'Declined'
): Promise<void> {
  const path = `chats/${chatId}`;
  try {
    const chatDocRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatDocRef);
    if (!chatSnap.exists()) return;
    
    const data = chatSnap.data() as ChatRoom;
    if (!Array.isArray(data.messages)) return;
    
    const updatedMessages = data.messages.map(msg => {
      if (msg.invitationId === messageId) {
        return { ...msg, status };
      }
      return msg;
    });
    
    await updateDoc(chatDocRef, {
      messages: cleanUndefined(updatedMessages)
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteChatRoom(chatId: string): Promise<void> {
  const path = `chats/${chatId}`;
  try {
    const chatDocRef = doc(db, 'chats', chatId);
    await deleteDoc(chatDocRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function deleteChatMessage(
  chatId: string,
  messageId: string
): Promise<void> {
  const path = `chats/${chatId}`;
  try {
    const chatDocRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatDocRef);
    if (!chatSnap.exists()) return;

    const data = chatSnap.data() as ChatRoom;
    if (!Array.isArray(data.messages)) return;

    const updatedMessages = data.messages.filter(msg => msg.invitationId !== messageId);
    const lastMsg = updatedMessages[updatedMessages.length - 1];

    await updateDoc(chatDocRef, {
      messages: cleanUndefined(updatedMessages),
      lastMessageAt: lastMsg ? lastMsg.createdAt : new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateTypingStatus(
  chatId: string,
  rollNumber: string,
  isTyping: boolean
): Promise<void> {
  const path = `chats/${chatId}`;
  try {
    const chatDocRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatDocRef);
    if (!chatSnap.exists()) return;

    const data = chatSnap.data() as ChatRoom;
    let typing = Array.isArray(data.typing) ? [...data.typing] : [];

    if (isTyping) {
      if (!typing.includes(rollNumber)) typing.push(rollNumber);
    } else {
      typing = typing.filter(r => r !== rollNumber);
    }

    await updateDoc(chatDocRef, { typing: cleanUndefined(typing) });
  } catch (error) {
    console.error('Error updating typing status:', error);
  }
}


export async function getAppConfig(): Promise<AppConfig> {
  const path = `appSettings/config`;
  try {
    const configDocRef = doc(db, 'appSettings', 'config');
    const configSnap = await getDoc(configDocRef);
    if (!configSnap.exists()) {
      const defaultConfig: AppConfig = { 
        isChatEnabled: true,
        isCertificatesEnabled: true,
        certificateTemplate: DEFAULT_CERTIFICATE_TEMPLATE,
        supportInfo: DEFAULT_SUPPORT_INFO,
        branding: DEFAULT_BRANDING
      };
      await setDoc(configDocRef, defaultConfig);
      return defaultConfig;
    }
    const data = configSnap.data() as AppConfig;
    if (!data.supportInfo) {
      data.supportInfo = DEFAULT_SUPPORT_INFO;
    }
    if (data.isCertificatesEnabled === undefined) {
      data.isCertificatesEnabled = true;
    }
    if (!data.certificateTemplate) {
      data.certificateTemplate = DEFAULT_CERTIFICATE_TEMPLATE;
    }
    if (!data.branding) {
      data.branding = DEFAULT_BRANDING;
    }
    return data;
  } catch (error) {
    console.error('Error getting app config:', error);
    return { 
      isChatEnabled: true, 
      isCertificatesEnabled: true,
      certificateTemplate: DEFAULT_CERTIFICATE_TEMPLATE,
      supportInfo: DEFAULT_SUPPORT_INFO,
      branding: DEFAULT_BRANDING
    };
  }
}

export async function updateAppConfig(isChatEnabled: boolean): Promise<void> {
  const path = `appSettings/config`;
  try {
    const configDocRef = doc(db, 'appSettings', 'config');
    await setDoc(configDocRef, { isChatEnabled }, { merge: true });
  } catch (error) {
    console.error('Error updating app config:', error);
  }
}

export async function toggleCertificatesEnabled(isCertificatesEnabled: boolean): Promise<void> {
  const path = `appSettings/config`;
  try {
    const configDocRef = doc(db, 'appSettings', 'config');
    await setDoc(configDocRef, { isCertificatesEnabled }, { merge: true });
  } catch (error) {
    console.error('Error toggling certificates enabled:', error);
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

export async function updateCertificateTemplate(template: Partial<CertificateTemplate>): Promise<void> {
  const path = `appSettings/config`;
  try {
    const configDocRef = doc(db, 'appSettings', 'config');
    await setDoc(configDocRef, { 
      certificateTemplate: cleanUndefined({
        ...DEFAULT_CERTIFICATE_TEMPLATE,
        ...template,
        updatedAt: new Date().toISOString()
      }) 
    }, { merge: true });
  } catch (error) {
    console.error('Error updating certificate template:', error);
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

export async function updateSupportInfo(supportInfo: Partial<SupportInfo>): Promise<void> {
  const path = `appSettings/config`;
  try {
    const configDocRef = doc(db, 'appSettings', 'config');
    await setDoc(configDocRef, { 
      supportInfo: cleanUndefined({
        ...DEFAULT_SUPPORT_INFO,
        ...supportInfo,
        updatedAt: new Date().toISOString()
      }) 
    }, { merge: true });
  } catch (error) {
    console.error('Error updating support info:', error);
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

export async function updateAppBranding(branding: Partial<AppBranding>): Promise<void> {
  const path = `appSettings/config`;
  try {
    const configDocRef = doc(db, 'appSettings', 'config');
    const existing = await getAppConfig();
    await setDoc(configDocRef, { 
      branding: cleanUndefined({
        ...DEFAULT_BRANDING,
        ...(existing.branding || {}),
        ...branding,
        updatedAt: new Date().toISOString()
      }) 
    }, { merge: true });
  } catch (error) {
    console.error('Error updating app branding:', error);
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

export function subscribeToAppConfig(callback: (config: AppConfig) => void): () => void {
  const configDocRef = doc(db, 'appSettings', 'config');
  return onSnapshot(configDocRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data() as AppConfig;
      if (!data.branding) data.branding = DEFAULT_BRANDING;
      if (!data.supportInfo) data.supportInfo = DEFAULT_SUPPORT_INFO;
      if (!data.certificateTemplate) data.certificateTemplate = DEFAULT_CERTIFICATE_TEMPLATE;
      if (data.isCertificatesEnabled === undefined) data.isCertificatesEnabled = true;
      callback(data);
    } else {
      callback({
        isChatEnabled: true,
        isCertificatesEnabled: true,
        certificateTemplate: DEFAULT_CERTIFICATE_TEMPLATE,
        supportInfo: DEFAULT_SUPPORT_INFO,
        branding: DEFAULT_BRANDING
      });
    }
  }, (err) => {
    console.error('Error in subscribeToAppConfig:', err);
  });
}

export interface SystemBackupData {
  meta: {
    exportDate: string;
    version: string;
    exportedBy?: string;
    totalRecords: number;
    department: string;
  };
  counts: Record<string, number>;
  collections: {
    users: UserProfile[];
    events: DepartmentEvent[];
    registrations: EventRegistration[];
    certificates: IssuedCertificate[];
    event_winners: EventWinner[];
    announcements: Announcement[];
    albums: Album[];
    gallery: any[];
    notifications: any[];
    invitations: any[];
    chats: any[];
    appSettings: any[];
  };
}

export async function exportAllDatabaseData(exportedByName?: string): Promise<SystemBackupData> {
  const collectionNames = [
    'users',
    'events',
    'registrations',
    'certificates',
    'event_winners',
    'announcements',
    'albums',
    'gallery',
    'notifications',
    'invitations',
    'chats',
    'appSettings'
  ];

  const backupData: SystemBackupData = {
    meta: {
      exportDate: new Date().toISOString(),
      version: '2.0.0',
      exportedBy: exportedByName || 'Department Administrator',
      totalRecords: 0,
      department: 'CSE (AI & ML) - NOTX Connect'
    },
    counts: {},
    collections: {
      users: [],
      events: [],
      registrations: [],
      certificates: [],
      event_winners: [],
      announcements: [],
      albums: [],
      gallery: [],
      notifications: [],
      invitations: [],
      chats: [],
      appSettings: []
    }
  };

  for (const name of collectionNames) {
    try {
      const snap = await getDocs(collection(db, name));
      const items: any[] = [];
      snap.forEach(d => {
        items.push(d.data());
      });
      (backupData.collections as any)[name] = items;
      backupData.counts[name] = items.length;
      backupData.meta.totalRecords += items.length;
    } catch (err) {
      console.warn(`Could not export collection ${name}:`, err);
      backupData.counts[name] = 0;
    }
  }

  return backupData;
}

export interface ResetSummary {
  deletedCounts: Record<string, number>;
  preservedAdmin: {
    uid: string;
    name: string;
    email: string;
  };
  resetTimestamp: string;
}

export async function resetEntireDatabaseForNewAssociation(
  currentAdmin: UserProfile,
  onProgress?: (stage: string, percent: number) => void
): Promise<ResetSummary> {
  const summary: ResetSummary = {
    deletedCounts: {},
    preservedAdmin: {
      uid: currentAdmin.uid,
      name: currentAdmin.name,
      email: currentAdmin.email
    },
    resetTimestamp: new Date().toISOString()
  };

  // Step 1: Collections to wipe completely
  const collectionsToWipe = [
    'events',
    'registrations',
    'certificates',
    'event_winners',
    'announcements',
    'albums',
    'gallery',
    'notifications',
    'invitations',
    'chats'
  ];

  let completedSteps = 0;
  const totalSteps = collectionsToWipe.length + 2;

  for (const collName of collectionsToWipe) {
    onProgress?.(`Wiping ${collName}...`, Math.round((completedSteps / totalSteps) * 100));
    try {
      const snap = await getDocs(collection(db, collName));
      const count = snap.size;
      const promises = snap.docs.map(d => deleteDoc(doc(db, collName, d.id)));
      await Promise.all(promises);
      summary.deletedCounts[collName] = count;
    } catch (err) {
      console.error(`Error wiping collection ${collName}:`, err);
      summary.deletedCounts[collName] = 0;
    }
    completedSteps++;
  }

  // Step 2: Wipe all users except current admin and root admin
  onProgress?.('Cleaning student and member accounts...', Math.round((completedSteps / totalSteps) * 100));
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    let userDeletedCount = 0;
    const userDeletePromises: Promise<any>[] = [];

    usersSnap.forEach(d => {
      const u = d.data() as UserProfile;
      const isCurrentAdmin = u.uid === currentAdmin.uid || (u.email && currentAdmin.email && u.email.toLowerCase() === currentAdmin.email.toLowerCase());
      const isRootAdmin = (u.email && u.email.toLowerCase() === 'syedsame2244@gmail.com') || u.uid === 'user_admin_syed';

      if (!isCurrentAdmin && !isRootAdmin) {
        userDeletePromises.push(deleteDoc(doc(db, 'users', d.id)));
        userDeletedCount++;
      }
    });

    await Promise.all(userDeletePromises);
    summary.deletedCounts['users'] = userDeletedCount;
  } catch (err) {
    console.error('Error cleaning users collection:', err);
    summary.deletedCounts['users'] = 0;
  }
  completedSteps++;

  // Step 3: Ensure current admin profile is clean and healthy
  onProgress?.('Re-initializing clean administrator state...', 95);
  try {
    const cleanAdminProfile: UserProfile = {
      ...currentAdmin,
      role: 'admin',
      position: 'Head Administrator',
      assignedEvents: [],
      powers: {
        canManageEvents: true,
        canManageAnnouncements: true,
        canViewRegistrations: true,
        canManageGallery: true
      }
    };
    await setDoc(doc(db, 'users', currentAdmin.uid), cleanUndefined(cleanAdminProfile));

    if (currentAdmin.email?.toLowerCase() !== 'syedsame2244@gmail.com') {
      const masterAdmin: UserProfile = {
        uid: "user_admin_syed",
        name: "Sameer Ahmed (Admin)",
        email: "syedsame2244@gmail.com",
        role: "admin",
        phone: "+91 9999999999",
        rollNumber: "ADMIN001",
        branch: "CSE (AI & ML)",
        year: "Faculty / Admin",
        section: "Department",
        position: "President / Head Admin",
        department: "CSE (AI & ML)",
        powers: {
          canManageEvents: true,
          canManageAnnouncements: true,
          canViewRegistrations: true,
          canManageGallery: true
        },
        created_at: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', 'user_admin_syed'), cleanUndefined(masterAdmin));
    }
  } catch (err) {
    console.error('Error re-initializing admin profile:', err);
  }

  // Clear local storage items that might hold cached event/user state
  try {
    localStorage.removeItem('active_event_draft');
    localStorage.removeItem('selected_event_id');
    localStorage.removeItem('chat_drafts');
    localStorage.removeItem('qr_scan_recent');
  } catch (e) {
    // ignore
  }

  onProgress?.('Association reset complete!', 100);
  return summary;
}

export const clearAllDatabaseData = async () => {
  const collections = ['users', 'events', 'registrations', 'albums', 'announcements', 'invitations', 'chats', 'certificates', 'event_winners', 'gallery', 'notifications'];
  
  for (const collectionName of collections) {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const deletePromises = querySnapshot.docs.map(docSnapshot => deleteDoc(doc(db, collectionName, docSnapshot.id)));
    await Promise.all(deletePromises);
  }
};

// ==========================================
// E-CERTIFICATE DATABASE & ISSUANCE SYSTEM
// ==========================================

export function generateCertificateId(rollNumber?: string, eventId?: string): string {
  const cleanRoll = (rollNumber || 'STU').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const shortRoll = cleanRoll.length > 6 ? cleanRoll.slice(-6) : cleanRoll;
  const cleanEvt = (eventId || 'AIML').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4);
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CERT-AIML-${shortRoll}-${cleanEvt}-${randomSuffix}`;
}

export async function issueCertificate(certData: Omit<IssuedCertificate, 'issuedAt'>): Promise<IssuedCertificate> {
  const certId = certData.certificateId || generateCertificateId(certData.rollNumber, certData.eventId);
  const path = `certificates/${certId}`;
  
  const fullCert: IssuedCertificate = {
    ...certData,
    certificateId: certId,
    issuedAt: new Date().toISOString(),
    status: certData.status || 'Issued',
    issueDate: certData.issueDate || new Date().toISOString().split('T')[0],
    qrVerificationData: certData.qrVerificationData || `https://notx-connect.edu/verify?id=${certId}`
  };

  try {
    const certDocRef = doc(db, 'certificates', certId);
    await setDoc(certDocRef, cleanUndefined(fullCert));
    return fullCert;
  } catch (error) {
    console.error('Error issuing certificate:', error);
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

export async function fetchCertificates(): Promise<IssuedCertificate[]> {
  const path = 'certificates';
  try {
    const querySnapshot = await getDocs(collection(db, 'certificates'));
    const certs: IssuedCertificate[] = [];
    querySnapshot.forEach(docSnap => {
      certs.push(docSnap.data() as IssuedCertificate);
    });
    // Sort by issuedAt descending
    return certs.sort((a, b) => new Date(b.issuedAt || 0).getTime() - new Date(a.issuedAt || 0).getTime());
  } catch (error) {
    console.error('Error fetching certificates:', error);
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export function subscribeToCertificates(callback: (certs: IssuedCertificate[]) => void): () => void {
  const path = 'certificates';
  return onSnapshot(
    collection(db, 'certificates'),
    (snapshot) => {
      const certs: IssuedCertificate[] = [];
      snapshot.forEach(docSnap => {
        certs.push(docSnap.data() as IssuedCertificate);
      });
      certs.sort((a, b) => new Date(b.issuedAt || 0).getTime() - new Date(a.issuedAt || 0).getTime());
      callback(certs);
    },
    (error) => {
      console.error('Error subscribing to certificates:', error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function fetchCertificatesByEvent(eventId: string): Promise<IssuedCertificate[]> {
  const path = 'certificates';
  try {
    const q = query(collection(db, 'certificates'), where('eventId', '==', eventId));
    const snapshot = await getDocs(q);
    const certs: IssuedCertificate[] = [];
    snapshot.forEach(docSnap => {
      certs.push(docSnap.data() as IssuedCertificate);
    });
    return certs.sort((a, b) => (a.studentName || '').localeCompare(b.studentName || ''));
  } catch (error) {
    console.error('Error fetching certificates by event:', error);
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function fetchCertificatesByStudent(studentId: string, rollNumber?: string): Promise<IssuedCertificate[]> {
  const path = 'certificates';
  try {
    const certs: IssuedCertificate[] = [];
    const q1 = query(collection(db, 'certificates'), where('studentId', '==', studentId));
    const snap1 = await getDocs(q1);
    snap1.forEach(docSnap => certs.push(docSnap.data() as IssuedCertificate));

    if (rollNumber) {
      const q2 = query(collection(db, 'certificates'), where('rollNumber', '==', rollNumber));
      const snap2 = await getDocs(q2);
      snap2.forEach(docSnap => {
        if (!certs.some(c => c.certificateId === docSnap.id)) {
          certs.push(docSnap.data() as IssuedCertificate);
        }
      });
    }

    return certs;
  } catch (error) {
    console.error('Error fetching certificates by student:', error);
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function verifyCertificateById(certificateId: string): Promise<IssuedCertificate | null> {
  const cleanId = (certificateId || '').trim();
  if (!cleanId) return null;
  const path = `certificates/${cleanId}`;
  try {
    const docRef = doc(db, 'certificates', cleanId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as IssuedCertificate;
    }
    // Also try case-insensitive / search match if users enter without dashes or lowercase
    const allCerts = await fetchCertificates();
    const match = allCerts.find(c => 
      c.certificateId.toLowerCase() === cleanId.toLowerCase() ||
      c.certificateId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === cleanId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
    );
    return match || null;
  } catch (error) {
    console.error('Error verifying certificate:', error);
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function deleteCertificate(certificateId: string): Promise<void> {
  const path = `certificates/${certificateId}`;
  try {
    await deleteDoc(doc(db, 'certificates', certificateId));
  } catch (error) {
    console.error('Error deleting certificate:', error);
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

export async function syncCertificatesForAttendees(
  events: DepartmentEvent[],
  registrations: EventRegistration[],
  allUsers: UserProfile[]
): Promise<{ newlyIssued: number; totalEligible: number }> {
  // Find all attended registrations
  const attendedRegs = registrations.filter(r => r.status === 'Attended');
  if (attendedRegs.length === 0) {
    return { newlyIssued: 0, totalEligible: 0 };
  }

  // Get currently issued certificates to avoid duplicates
  const existingCerts = await fetchCertificates();
  let newlyIssued = 0;

  for (const reg of attendedRegs) {
    const matchedEvent = events.find(e => e.eventId === reg.eventId);
    if (!matchedEvent) continue;

    // Check if certificate already exists for this student & event
    const exists = existingCerts.some(c => 
      c.eventId === reg.eventId && 
      (c.studentId === reg.studentId || (reg.rollNumber && c.rollNumber.toUpperCase() === reg.rollNumber.toUpperCase()))
    );

    if (!exists) {
      const studentUser = allUsers.find(u => u.uid === reg.studentId || (reg.rollNumber && u.rollNumber?.toUpperCase() === reg.rollNumber.toUpperCase()));
      const certId = generateCertificateId(reg.rollNumber || studentUser?.rollNumber, matchedEvent.eventId);
      
      const newCert: Omit<IssuedCertificate, 'issuedAt'> = {
        certificateId: certId,
        eventId: matchedEvent.eventId,
        eventTitle: matchedEvent.title,
        eventDate: matchedEvent.date,
        eventVenue: matchedEvent.venue,
        studentId: reg.studentId || studentUser?.uid || 'student_' + (reg.rollNumber || 'unknown'),
        studentName: reg.studentName || studentUser?.name || 'Student Participant',
        rollNumber: reg.rollNumber || studentUser?.rollNumber || 'N/A',
        department: studentUser?.department || 'CSE (AI & ML)',
        year: studentUser?.year || reg.year || 'III Year',
        section: studentUser?.section || 'A',
        issueDate: matchedEvent.date || new Date().toISOString().split('T')[0],
        status: 'Issued',
        issuedBy: 'Department Administration',
        qrVerificationData: `https://notx-connect.edu/verify?id=${certId}`
      };

      await issueCertificate(newCert);
      newlyIssued++;
    }
  }

  return { newlyIssued, totalEligible: attendedRegs.length };
}

export async function generateBatchCertificatesForEvent(
  eventId: string,
  options?: {
    specificStudentIds?: string[];
    issuedBy?: string;
    events?: DepartmentEvent[];
    registrations?: EventRegistration[];
    allUsers?: UserProfile[];
  }
): Promise<{ newlyIssued: number; totalAttended: number; alreadyIssued: number }> {
  // Get all registrations and events if not provided
  let allRegs = options?.registrations;
  if (!allRegs) {
    allRegs = await fetchRegistrations();
  }
  let allEvs = options?.events;
  if (!allEvs) {
    allEvs = await fetchEvents();
  }
  let usersList = options?.allUsers;
  if (!usersList) {
    usersList = await fetchUsers();
  }

  const matchedEvent = allEvs.find(e => e.eventId === eventId);
  if (!matchedEvent) {
    throw new Error(`Event ${eventId} not found.`);
  }

  // Filter registrations for this event with 'Attended' status
  let eventAttendedRegs = allRegs.filter(r => r.eventId === eventId && r.status === 'Attended');
  if (options?.specificStudentIds && options.specificStudentIds.length > 0) {
    const filterSet = new Set(options.specificStudentIds);
    eventAttendedRegs = eventAttendedRegs.filter(r => filterSet.has(r.studentId) || (r.rollNumber && filterSet.has(r.rollNumber.toUpperCase())));
  }

  const existingCerts = await fetchCertificates();
  let newlyIssued = 0;
  let alreadyIssued = 0;

  for (const reg of eventAttendedRegs) {
    // Check if certificate already exists
    const exists = existingCerts.some(c => 
      c.eventId === eventId && 
      (c.studentId === reg.studentId || (reg.rollNumber && c.rollNumber.toUpperCase() === reg.rollNumber.toUpperCase()))
    );

    if (exists) {
      alreadyIssued++;
      continue;
    }

    const studentUser = usersList.find(u => u.uid === reg.studentId || (reg.rollNumber && u.rollNumber?.toUpperCase() === reg.rollNumber.toUpperCase()));
    const certId = generateCertificateId(reg.rollNumber || studentUser?.rollNumber, matchedEvent.eventId);

    const newCert: Omit<IssuedCertificate, 'issuedAt'> = {
      certificateId: certId,
      eventId: matchedEvent.eventId,
      eventTitle: matchedEvent.title,
      eventDate: matchedEvent.date,
      eventVenue: matchedEvent.venue || 'Campus Auditorium',
      studentId: reg.studentId || studentUser?.uid || 'student_' + (reg.rollNumber || 'unknown'),
      studentName: reg.studentName || studentUser?.name || 'Student Participant',
      rollNumber: reg.rollNumber || studentUser?.rollNumber || 'N/A',
      department: studentUser?.department || 'CSE (AI & ML)',
      year: studentUser?.year || reg.year || 'III Year',
      section: studentUser?.section || 'A',
      issueDate: matchedEvent.date || new Date().toISOString().split('T')[0],
      status: 'Issued',
      issuedBy: options?.issuedBy || 'Department Administration',
      qrVerificationData: `https://notx-connect.edu/verify?id=${certId}`
    };

    await issueCertificate(newCert);
    newlyIssued++;
  }

  return { newlyIssued, totalAttended: eventAttendedRegs.length, alreadyIssued };
}

export async function revokeBatchCertificatesForEvent(
  eventId: string,
  specificStudentIds?: string[]
): Promise<{ revokedCount: number }> {
  const existingCerts = await fetchCertificates();
  const filterSet = specificStudentIds && specificStudentIds.length > 0 ? new Set(specificStudentIds) : null;

  const targetCerts = existingCerts.filter(c => {
    if (c.eventId !== eventId) return false;
    if (filterSet) {
      return filterSet.has(c.studentId) || (c.rollNumber && filterSet.has(c.rollNumber.toUpperCase()));
    }
    return true;
  });

  let revokedCount = 0;
  for (const cert of targetCerts) {
    await deleteCertificate(cert.certificateId);
    revokedCount++;
  }

  return { revokedCount };
}

// ---------------- EVENT WINNERS (HOME SPOTLIGHT) ----------------

export async function fetchEventWinners(): Promise<EventWinner[]> {
  const path = 'event_winners';
  try {
    const snap = await getDocs(collection(db, 'event_winners'));
    const winners: EventWinner[] = [];
    snap.forEach((d) => {
      winners.push(d.data() as EventWinner);
    });
    // Sort by addedAt descending
    return winners.sort((a, b) => new Date(b.addedAt || '').getTime() - new Date(a.addedAt || '').getTime());
  } catch (error) {
    console.error('Error fetching event winners:', error);
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export function subscribeToEventWinners(callback: (winners: EventWinner[]) => void): () => void {
  const path = 'event_winners';
  try {
    return onSnapshot(collection(db, 'event_winners'), (snapshot) => {
      const winners: EventWinner[] = [];
      snapshot.forEach((d) => {
        winners.push(d.data() as EventWinner);
      });
      winners.sort((a, b) => new Date(b.addedAt || '').getTime() - new Date(a.addedAt || '').getTime());
      callback(winners);
    }, (error) => {
      console.error('Error subscribing to event winners:', error);
      handleFirestoreError(error, OperationType.LIST, path);
    });
  } catch (error) {
    console.error('Error setting up event winners subscription:', error);
    handleFirestoreError(error, OperationType.LIST, path);
    return () => {};
  }
}

export async function addEventWinner(winnerData: Omit<EventWinner, 'winnerId' | 'addedAt'> & { winnerId?: string; addedAt?: string }): Promise<string> {
  const winnerId = winnerData.winnerId || `winner_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const path = `event_winners/${winnerId}`;
  try {
    const finalWinner: EventWinner = {
      ...winnerData,
      winnerId,
      addedAt: winnerData.addedAt || new Date().toISOString()
    };
    await setDoc(doc(db, 'event_winners', winnerId), cleanUndefined(finalWinner));
    return winnerId;
  } catch (error) {
    console.error('Error adding event winner:', error);
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

export async function updateEventWinner(winnerId: string, winnerData: Partial<EventWinner>): Promise<void> {
  const path = `event_winners/${winnerId}`;
  try {
    await updateDoc(doc(db, 'event_winners', winnerId), cleanUndefined(winnerData));
  } catch (error) {
    console.error('Error updating event winner:', error);
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

export async function deleteEventWinner(winnerId: string): Promise<void> {
  const path = `event_winners/${winnerId}`;
  try {
    await deleteDoc(doc(db, 'event_winners', winnerId));
  } catch (error) {
    console.error('Error deleting event winner:', error);
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}



