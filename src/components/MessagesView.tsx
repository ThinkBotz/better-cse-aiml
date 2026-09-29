import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Send, Inbox, Clock, Search, CheckCircle2, Check, CheckCheck, 
  XCircle, Sparkles, Loader2, UserCheck, Plus, MessageCircle,
  HelpCircle, AlertCircle, ChevronRight, CornerDownRight, User, Trash2, AlertTriangle
} from 'lucide-react';
import { onSnapshot, collection, query, where } from 'firebase/firestore';
import { UserProfile, UserInvitation, ChatRoom } from '../types';
import HoldButton from './HoldButton';
import { 
  getChatRoomId,
  sendChatMessage,
  respondToChatInvite,
  markMessagesAsRead,
  updateTypingStatus,
  deleteChatRoom,
  deleteChatMessage,
  db
} from '../firebase';

interface MessagesViewProps {
  user: UserProfile;
  allUsers: UserProfile[];
  initialTargetRoll?: string | null;
  onTargetHandled?: () => void;
}

interface Conversation {
  classmateRoll: string;
  classmateName: string;
  classmateProfile?: UserProfile;
  messages: UserInvitation[];
  lastMessageAt: string;
  typing?: string[];
}

export default function MessagesView({ user, allUsers, initialTargetRoll, onTargetHandled }: MessagesViewProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedRoll, setSelectedRoll] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // New conversation / Search state
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Message input state
  const [newMessageText, setNewMessageText] = useState('');
  const [messageType, setMessageType] = useState<'chat' | 'invite'>('chat');
  
  // Form status
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Delete Chat / Message Modals State
  const [chatToDelete, setChatToDelete] = useState<{ roll: string; name: string } | null>(null);
  const [isDeletingChat, setIsDeletingChat] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<{ id: string; text: string } | null>(null);
  const [isDeletingMessage, setIsDeletingMessage] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Determine if messages should be cleared based on roles
    useEffect(() => {
    if (initialTargetRoll) {
      const roll = initialTargetRoll.toUpperCase();
      const exists = conversations.some(c => c.classmateRoll.toUpperCase() === roll);
      if (!exists) {
        const recipient = allUsers.find(u => (u.rollNumber || u.uid).toUpperCase() === roll);
        if (recipient) {
          const dummyConv: Conversation = {
            classmateRoll: roll,
            classmateName: recipient.name,
            classmateProfile: recipient,
            messages: [],
            lastMessageAt: new Date().toISOString()
          };
          setConversations(prev => [dummyConv, ...prev]);
        }
      }
      setSelectedRoll(roll);
      if (onTargetHandled) onTargetHandled();
    }
  }, [initialTargetRoll, onTargetHandled, conversations, allUsers]);


  // Real-time listener for the unified chats where user is a participant
  useEffect(() => {
    if (!user || !user.rollNumber) return;
    
    setIsLoading(true);
    
    const qChats = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.rollNumber.trim().toUpperCase())
    );

    const unsubscribe = onSnapshot(qChats, (snapshot) => {
      const list: Conversation[] = [];
      snapshot.forEach((docSnap) => {
        const room = docSnap.data() as ChatRoom;
        
        // Find classmate's roll number (the other participant)
        const classmateRoll = room.participants.find(
          roll => roll.toUpperCase() !== user.rollNumber!.trim().toUpperCase()
        ) || user.rollNumber!.trim().toUpperCase(); // fallback to self if chatting with self
        
        // Find classmate's profile in allUsers
        const classmateProfile = allUsers.find(
          u => u.rollNumber && u.rollNumber.toUpperCase() === classmateRoll.toUpperCase()
        );
        
        // Find classmate name
        let classmateName = 'Unknown Student';
        if (classmateProfile) {
          classmateName = classmateProfile.name;
        } else {
          // Fallback from messages
          const firstOtherMsg = room.messages.find(m => m.senderRoll.toUpperCase() === classmateRoll.toUpperCase());
          const firstMyMsg = room.messages.find(m => m.recipientRoll.toUpperCase() === classmateRoll.toUpperCase());
          if (firstOtherMsg) classmateName = firstOtherMsg.senderName;
          else if (firstMyMsg) classmateName = firstMyMsg.recipientName;
        }
        
        // Sort messages in this conversation ascending by date
        const sortedMsgs = [...(room.messages || [])].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        list.push({
          classmateRoll,
          classmateName,
          classmateProfile,
          messages: sortedMsgs,
          lastMessageAt: room.lastMessageAt || new Date().toISOString(),
          typing: room.typing || []
        });
      });
      
      // Sort conversations descending by the time of the last message
      list.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
      
      setConversations(list);
      setIsLoading(false);
    }, (error) => {
      console.error("Error listening to chats:", error);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [user.rollNumber, allUsers]);

  // Automatically select the first conversation if none selected
  // Removed auto-select so mobile users see the chat list first.
  /*
  useEffect(() => {
    if (!selectedRoll && conversations.length > 0) {
      setSelectedRoll(conversations[0].classmateRoll);
    }
  }, [conversations, selectedRoll]);
  */

  // Cleanup viewed messages when leaving a chat
  const previousRollRef = useRef<string | null>(null);

  useEffect(() => {
    const prev = previousRollRef.current;
    if (prev && prev !== selectedRoll && user.rollNumber) {
      markMessagesAsRead(user.rollNumber, prev).catch(console.error);
    }
    previousRollRef.current = selectedRoll;
  }, [selectedRoll, user.rollNumber]);

  // Cleanup on unmount or tab close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (previousRollRef.current && user.rollNumber) {
        markMessagesAsRead(user.rollNumber, previousRollRef.current).catch(console.error);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (previousRollRef.current && user.rollNumber) {
        markMessagesAsRead(user.rollNumber, previousRollRef.current).catch(console.error);
      }
    };
  }, [user.rollNumber]);


  useEffect(() => {
    if (selectedRoll && user.rollNumber) {
      markMessagesAsRead(user.rollNumber, selectedRoll).catch(console.error);
    }
  }, [selectedRoll, user.rollNumber, conversations]);

  // Scroll to bottom when selected conversation changes or new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedRoll, conversations]);

  // Handle typing indicator update
  useEffect(() => {
    if (!user.rollNumber || !selectedRoll) return;
    const chatId = getChatRoomId(user.rollNumber, selectedRoll);
    
    if (newMessageText.trim().length > 0) {
      updateTypingStatus(chatId, user.rollNumber, true);
      
      const timeout = setTimeout(() => {
        if (user.rollNumber) {
          updateTypingStatus(chatId, user.rollNumber, false);
        }
      }, 5000);
      return () => {
        clearTimeout(timeout);
      };
    } else {
      updateTypingStatus(chatId, user.rollNumber, false);
    }
  }, [newMessageText, selectedRoll, user.rollNumber]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedRoll || !newMessageText.trim()) return;

    setActionError('');
    setActionSuccess('');

    const targetConv = conversations.find(c => c.classmateRoll.toUpperCase() === selectedRoll.toUpperCase());
    let recipientUid = '';
    let recipientName = 'Student';

    if (targetConv?.classmateProfile) {
      recipientUid = targetConv.classmateProfile.uid;
      recipientName = targetConv.classmateProfile.name;
    } else {
      // Find recipient in allUsers list
      const match = allUsers.find(
        u => u.rollNumber && u.rollNumber.toUpperCase() === selectedRoll.toUpperCase()
      );
      if (match) {
        recipientUid = match.uid;
        recipientName = match.name;
      }
    }

    if (!recipientUid) {
      setActionError("Cannot send message. Recipient student profile could not be found.");
      return;
    }

    try {
      await sendChatMessage(
        user,
        selectedRoll,
        recipientUid,
        recipientName,
        newMessageText,
        messageType
      );
      setNewMessageText('');
      // Reset type back to chat
      setMessageType('chat');
    } catch (err) {
      console.error("Failed to send message", err);
      setActionError("Failed to deliver message. Check internet connection.");
    }
  };

  const handleRespondToInvite = async (inviteId: string, status: 'Accepted' | 'Declined') => {
    if (!user || !user.rollNumber || !selectedRoll) return;
    try {
      const chatId = getChatRoomId(user.rollNumber, selectedRoll);
      await respondToChatInvite(chatId, inviteId, status);
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const confirmDeleteChat = async () => {
    if (!chatToDelete || !user.rollNumber) return;
    setIsDeletingChat(true);
    setActionError('');
    try {
      const chatId = getChatRoomId(user.rollNumber, chatToDelete.roll);
      await deleteChatRoom(chatId);
      
      // Optimistically remove conversation from local state
      setConversations(prev => prev.filter(c => c.classmateRoll.toUpperCase() !== chatToDelete.roll.toUpperCase()));
      
      if (selectedRoll?.toUpperCase() === chatToDelete.roll.toUpperCase()) {
        setSelectedRoll(null);
      }
      setChatToDelete(null);
    } catch (error) {
      console.error("Failed to delete chat:", error);
      setActionError("Failed to delete chat. Please try again.");
    } finally {
      setIsDeletingChat(false);
    }
  };

  const confirmDeleteMessage = async () => {
    if (!messageToDelete || !user.rollNumber || !selectedRoll) return;
    setIsDeletingMessage(true);
    setActionError('');
    try {
      const chatId = getChatRoomId(user.rollNumber, selectedRoll);
      await deleteChatMessage(chatId, messageToDelete.id);
      
      // Optimistic local state update
      setConversations(prev => prev.map(c => {
        if (c.classmateRoll.toUpperCase() === selectedRoll.toUpperCase()) {
          const remaining = c.messages.filter(m => m.invitationId !== messageToDelete.id);
          return {
            ...c,
            messages: remaining,
            lastMessageAt: remaining.length > 0 ? remaining[remaining.length - 1].createdAt : c.lastMessageAt
          };
        }
        return c;
      }));
      
      setMessageToDelete(null);
    } catch (error) {
      console.error("Failed to delete message:", error);
      setActionError("Failed to delete message. Please try again.");
    } finally {
      setIsDeletingMessage(false);
    }
  };

  const handleStartNewChat = (recipient: UserProfile) => {
    const roll = (recipient.rollNumber || recipient.uid).toUpperCase();
    
    // Check if conversation already exists in state
    const exists = conversations.some(c => c.classmateRoll.toUpperCase() === roll);
    if (!exists) {
      // Inject dummy/empty placeholder conversation in list so it displays instantly
      const dummyConv: Conversation = {
        classmateRoll: roll,
        classmateName: recipient.name,
        classmateProfile: recipient,
        messages: [],
        lastMessageAt: new Date().toISOString()
      };
      setConversations(prev => [dummyConv, ...prev]);
    }
    
    setSelectedRoll(roll);
    setShowNewChatModal(false);
    setSearchQuery('');
  };

  // Find active selected conversation
  const activeConversation = conversations.find(
    c => c.classmateRoll.toUpperCase() === (selectedRoll || '').toUpperCase()
  );

  // Filter students for starting new conversation
  const filteredStudentsForChat = allUsers.filter(u => {
    if (u.uid === user.uid) return false; // cannot chat with self
    if (!u.rollNumber) return false; // must have roll number
    
    const term = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(term) ||
      u.rollNumber.toLowerCase().includes(term) ||
      (u.department || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="flex-grow flex flex-col md:flex-row min-h-0 bg-background text-content overflow-hidden">
      {/* LEFT COLUMN: Active Chats List */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-divider/80 flex-col flex-shrink-0 bg-background h-full ${selectedRoll ? 'hidden md:flex' : 'flex'}`}>
        {/* Chat List Header */}
        <div className="p-3.5 border-b border-divider/80 flex justify-between items-center bg-surface">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-content flex items-center gap-1.5 font-display">
              <MessageCircle className="w-4 h-4 text-indigo-400" />
              Classmate Chats
            </h3>
            <p className="text-[8px] text-violet-400 font-mono tracking-widest uppercase mt-0.5 font-bold">
              Direct Peer Network
            </p>
          </div>
          
          <button
            onClick={() => {
              setShowNewChatModal(true);
              setActionError('');
              setActionSuccess('');
            }}
            className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all cursor-pointer active:scale-95 flex items-center justify-center shadow-md shadow-indigo-600/20"
            title="Start New Conversation"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Search for Chat locally or show New Chat Button */}
        <div className="p-3 border-b border-divider/80">
          <button
            onClick={() => setShowNewChatModal(true)}
            className="w-full bg-surface hover:bg-surface-accent border border-divider rounded-xl px-3 py-2 text-[10px] text-secondary flex items-center gap-2 transition-all text-left cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-tertiary" />
            Search Roll Number or Name...
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto scrollbar-none divide-y divide-neutral-800/60 pb-28">
          {isLoading && conversations.length === 0 ? (
            <div className="p-8 text-center text-secondary space-y-2">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-indigo-400" />
              <p className="text-[10px] font-mono">Syncing conversations...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-secondary space-y-3">
              <div className="w-10 h-10 rounded-full bg-surface-accent flex items-center justify-center mx-auto text-tertiary">
                <MessageSquare className="w-5 h-5" />
              </div>
              <p className="text-[11px] font-medium text-secondary leading-relaxed">No active chat sessions.</p>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="text-[9px] bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-bold transition-all uppercase cursor-pointer shadow-sm shadow-indigo-600/20"
              >
                Find Classmate
              </button>
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected = selectedRoll?.toUpperCase() === conv.classmateRoll.toUpperCase();
              const lastMsg = conv.messages[conv.messages.length - 1];
              
              // Count unread or pending actions
              const pendingCount = conv.messages.filter(
                m => m.recipientRoll.toUpperCase() === (user.rollNumber || '').toUpperCase() && m.status === 'Pending' && m.type === 'invite'
              ).length;
              
              const unreadCount = isSelected ? 0 : conv.messages.filter(
                m => m.recipientRoll.toUpperCase() === (user.rollNumber || '').toUpperCase() && m.type === 'chat' && !m.isRead
              ).length;

              const isTyping = conv.typing?.some(r => r.toUpperCase() === conv.classmateRoll.toUpperCase());

              return (
                <div
                  key={conv.classmateRoll}
                  onClick={() => setSelectedRoll(conv.classmateRoll)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedRoll(conv.classmateRoll); }}
                  className={`w-full text-left p-3 flex items-start gap-3 transition-all relative outline-none cursor-pointer group ${
                    isSelected 
                      ? 'bg-indigo-600/10 border-l-2 border-indigo-500' 
                      : unreadCount > 0 
                        ? 'bg-indigo-950/20 border-l-2 border-indigo-400' 
                        : 'hover:bg-surface-accent/40 border-l-2 border-transparent'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-surface-accent border border-divider/60 flex items-center justify-center text-content text-xs font-mono font-bold flex-shrink-0 overflow-hidden relative">
                    <img 
                      src={conv.classmateProfile?.profile_pic || `https://api.dicebear.com/9.x/notionists/svg?seed=${conv.classmateRoll}`} 
                      alt="avatar" 
                      className="w-full h-full object-cover" 
                    />
                    {unreadCount > 0 && (
                      <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-[#000000]"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className={`text-[11px] font-bold truncate pr-1 ${unreadCount > 0 ? 'text-indigo-400' : 'text-content'}`}>
                        {conv.classmateName}
                      </h4>
                      <span className={`text-[7px] font-mono flex-shrink-0 ${unreadCount > 0 ? 'text-indigo-400 font-bold' : 'text-tertiary'}`}>
                        {lastMsg ? new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    
                    <p className="text-[8px] text-violet-400 font-mono font-bold tracking-wider mt-0.5 uppercase">
                      {conv.classmateRoll}
                    </p>

                    <p className={`text-[10px] truncate mt-0.5 ${unreadCount > 0 ? 'text-content font-medium' : 'text-secondary'}`}>
                      {isTyping ? (
                        <span className="text-indigo-400 animate-pulse italic">typing...</span>
                      ) : lastMsg ? (
                        <>
                          <span className="font-bold text-tertiary mr-1">
                            {lastMsg.senderUid === user.uid ? 'You:' : 'Them:'}
                          </span>
                          {lastMsg.type === 'invite' ? '📬 Team Invite: ' : ''}
                          {lastMsg.message}
                        </>
                      ) : (
                        <span className="text-indigo-400/70 italic">Tap to start chat...</span>
                      )}
                    </p>
                  </div>

                  {/* Actions & Badges */}
                  <div className="flex items-center gap-1 self-center flex-shrink-0">
                    {/* Delete entire chat quick action */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setChatToDelete({ roll: conv.classmateRoll, name: conv.classmateName });
                      }}
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 text-secondary hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                      title="Delete Entire Chat"
                      aria-label="Delete Entire Chat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {pendingCount > 0 && (
                      <span className="bg-amber-500 text-black text-[8px] font-mono font-black w-4 h-4 rounded-full flex items-center justify-center shadow animate-pulse">
                        {pendingCount}
                      </span>
                    )}
                    {unreadCount > 0 && pendingCount === 0 && (
                      <span className="bg-indigo-500 text-white text-[8px] font-mono font-black w-4 h-4 rounded-full flex items-center justify-center shadow">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Chat Room / Thread View */}
      <div className={`flex-1 flex-col min-h-0 bg-background ${selectedRoll ? 'flex' : 'hidden md:flex'}`}>
        {activeConversation ? (
          <>
            {/* Thread Header */}
            <div className="p-3 border-b border-divider/80 bg-surface flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setSelectedRoll(null)}
                  className="p-1 -ml-1 text-secondary hover:text-content active:bg-surface-accent rounded-lg transition-colors cursor-pointer md:hidden"
                  title="Back to list"
                >
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                <div className="w-8 h-8 rounded-xl bg-surface-accent border border-divider/60 flex items-center justify-center text-content text-xs font-mono font-bold overflow-hidden">
                  <img 
                    src={activeConversation.classmateProfile?.profile_pic || `https://api.dicebear.com/9.x/notionists/svg?seed=${activeConversation.classmateRoll}`} 
                    alt="avatar" 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div>
                  <h3 className="text-[12px] font-bold text-content leading-tight">
                    {activeConversation.classmateName}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[8px] font-mono font-bold text-violet-400 uppercase bg-violet-500/10 px-1.5 py-0.2 rounded border border-violet-500/20">
                      {activeConversation.classmateRoll}
                    </span>
                    {activeConversation.classmateProfile && (
                      <span className="text-[8px] text-secondary font-mono">
                        ({activeConversation.classmateProfile.year} • Sect {activeConversation.classmateProfile.section})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-2 py-0.5 text-[8px] font-mono font-bold text-indigo-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                  SECURE
                </div>

                <button
                  type="button"
                  onClick={() => setChatToDelete({ roll: activeConversation.classmateRoll, name: activeConversation.classmateName })}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 text-[10px] font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
                  title="Delete entire conversation"
                  aria-label="Delete entire conversation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Delete Chat</span>
                </button>
              </div>
            </div>

            {/* Message History Feed */}
            {activeConversation.messages.some(m => m.type === 'invite' && m.status === 'Pending' && m.recipientRoll.toUpperCase() === (user.rollNumber || '').toUpperCase()) ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-background">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 relative">
                  <Sparkles className="w-7 h-7" />
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[#000000] animate-ping" />
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[#000000]" />
                </div>
                
                <h3 className="text-sm font-bold text-content mb-1.5">
                  New Conversation Request
                </h3>
                
                <p className="text-[11px] text-secondary max-w-sm mb-4 leading-relaxed">
                  <span className="text-content font-bold">{activeConversation.classmateName}</span> wants to connect and collaborate. Accept their invitation to unlock the chat interface.
                </p>

                <div className="bg-surface border border-divider p-3.5 rounded-xl max-w-sm w-full mb-5">
                   <p className="text-[11px] text-primary italic whitespace-pre-wrap">"{activeConversation.messages.find(m => m.type === 'invite' && m.status === 'Pending')?.message}"</p>
                </div>
                
                <div className="flex items-center justify-center gap-2.5 w-full max-w-sm">
                  <button
                    onClick={() => handleRespondToInvite(activeConversation.messages.find(m => m.type === 'invite' && m.status === 'Pending')!.invitationId, 'Declined')}
                    className="flex-1 py-2 rounded-xl border border-divider hover:bg-surface-accent text-secondary hover:text-content font-bold text-[11px] transition-all cursor-pointer"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => handleRespondToInvite(activeConversation.messages.find(m => m.type === 'invite' && m.status === 'Pending')!.invitationId, 'Accepted')}
                    className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                  >
                    Accept Request
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-background">
                {activeConversation.messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-secondary space-y-2.5">
                    <div className="w-10 h-10 rounded-full border border-dashed border-divider flex items-center justify-center text-tertiary">
                      <CornerDownRight className="w-5 h-5 animate-bounce" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-primary">Start the Conversation</h4>
                      <p className="text-[10px] text-secondary max-w-xs mx-auto mt-0.5 leading-relaxed">
                        Send a message or invite to coordinate events and hackathons!
                      </p>
                    </div>
                  </div>
                ) : (
                  activeConversation.messages.map((msg, idx) => {
                    const isMe = msg.senderUid === user.uid;
                    const isInvite = msg.type === 'invite';
                    const canDelete = isMe || user.role === 'admin' || user.role === 'coordinator' || user.role === 'president';

                    return (
                      <div 
                        key={msg.invitationId || idx} 
                        className={`group flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1 relative`}
                      >
                        {!isMe && (
                          <span className="text-[8px] text-secondary font-mono font-bold uppercase tracking-wider ml-1">
                            {msg.senderName} ({msg.senderRoll})
                          </span>
                        )}

                        <div className={`flex items-end gap-1.5 ${isMe ? 'flex-row-reverse' : 'flex-row'} max-w-[92%]`}>
                          <div className={`rounded-2xl p-3 shadow-md space-y-1.5 ${
                            isMe 
                              ? 'bg-indigo-600 text-white rounded-tr-xs' 
                              : 'bg-surface border border-divider text-content rounded-tl-xs'
                          }`}>
                            
                            {isInvite && (
                              <div className={`flex items-center gap-1.5 pb-1.5 border-b ${isMe ? 'border-indigo-400/30' : 'border-divider/60'}`}>
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                <span className="text-[9px] font-mono font-black uppercase tracking-wider text-amber-300">
                                  Team Collaboration Invite
                                </span>
                              </div>
                            )}

                            <p className="text-[11px] font-sans leading-relaxed whitespace-pre-wrap select-text">
                              {msg.message}
                            </p>

                            {isInvite && (
                              <div className={`pt-1.5 flex flex-col gap-1.5 ${isMe ? 'border-t border-indigo-400/30' : 'border-t border-divider/60'}`}>
                                <div className="flex items-center justify-between text-[8px] font-mono text-secondary">
                                  <span>Proposal Status:</span>
                                  <span className={`font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                    msg.status === 'Accepted'
                                      ? 'bg-indigo-500/20 text-indigo-400'
                                      : msg.status === 'Declined'
                                      ? 'bg-rose-500/20 text-rose-400'
                                      : 'bg-amber-500/20 text-amber-400'
                                  }`}>
                                    {msg.status}
                                  </span>
                                </div>

                                {msg.status === 'Pending' && !isMe && (
                                  <div className="flex gap-2 pt-1">
                                    <button
                                      onClick={() => handleRespondToInvite(msg.invitationId, 'Accepted')}
                                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[9px] uppercase py-1 rounded-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                                    >
                                      <CheckCircle2 className="w-3 h-3" />
                                      Accept
                                    </button>
                                    <button
                                      onClick={() => handleRespondToInvite(msg.invitationId, 'Declined')}
                                      className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-bold text-[9px] uppercase py-1 rounded-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                                    >
                                      <XCircle className="w-3 h-3" />
                                      Decline
                                    </button>
                                  </div>
                                )}

                                {msg.status !== 'Pending' && (
                                  <p className="text-[8px] italic text-secondary text-center font-mono pt-0.5">
                                    {msg.status === 'Accepted' 
                                      ? `✓ Accepted on ${new Date(msg.createdAt).toLocaleDateString()}`
                                      : `✕ Declined`}
                                  </p>
                                )}
                              </div>
                            )}

                            <div className={`flex justify-end items-center gap-1 text-[7px] font-mono mt-1 ${isMe ? 'text-indigo-200' : 'text-secondary'}`}>
                              <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {isMe && (
                                msg.isRead 
                                  ? <CheckCheck className="w-3 h-3 text-violet-400" />
                                  : <Check className="w-3 h-3 text-secondary" />
                              )}
                            </div>
                          </div>

                          {/* Individual Message Delete Button */}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMessageToDelete({ id: msg.invitationId, text: msg.message });
                              }}
                              className="opacity-70 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-1.5 text-secondary hover:text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer flex-shrink-0 self-center active:scale-90"
                              title="Delete message"
                              aria-label="Delete message"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                {activeConversation.typing?.some(r => r.toUpperCase() === activeConversation.classmateRoll.toUpperCase()) && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-surface-accent border border-divider flex items-center justify-center text-content text-[9px] font-mono font-bold flex-shrink-0 overflow-hidden">
                        <img 
                          src={activeConversation.classmateProfile?.profile_pic || `https://api.dicebear.com/9.x/notionists/svg?seed=${activeConversation.classmateRoll}`} 
                          alt="avatar" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="bg-surface border border-divider rounded-2xl rounded-tl-xs px-3.5 py-2 flex items-center gap-1">
                        <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}

            {/* Form Error / Alerts inside chat */}
            {actionError && (
              <div className="px-4 py-2 bg-rose-500/10 border-t border-rose-500/20 text-rose-400 text-[10px] flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Chat Input Bar */}
            {activeConversation.messages.some(m => m.type === 'invite' && m.status === 'Pending' && m.recipientRoll.toUpperCase() === (user.rollNumber || '').toUpperCase()) ? (
              <div className="p-3 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-3 border-t border-divider/80 bg-surface flex-shrink-0 text-center">
                <p className="text-[10px] text-amber-400 font-mono bg-amber-500/10 py-2.5 rounded-xl border border-amber-500/20">
                  Accept the invitation above to start messaging.
                </p>
              </div>
            ) : activeConversation.messages.some(m => m.type === 'invite' && m.status === 'Pending' && m.senderUid === user.uid) ? (
              <div className="p-3 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-3 border-t border-divider/80 bg-surface flex-shrink-0 text-center">
                <p className="text-[10px] text-secondary font-mono py-2.5 rounded-xl border border-divider bg-background">
                  Waiting for {activeConversation.classmateName} to accept your invitation...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="p-3 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-3 border-t border-divider/60 bg-surface/90 backdrop-blur-md flex-shrink-0">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessageText}
                    onChange={(e) => {
                      setNewMessageText(e.target.value);
                      setActionError('');
                    }}
                    placeholder={
                      (!activeConversation.messages || activeConversation.messages.length === 0)
                        ? `Send an invite to chat with ${activeConversation.classmateName}...` 
                        : `Message ${activeConversation.classmateName}...`
                    }
                    className="flex-1 bg-surface-accent/70 border border-divider/80 focus:border-rose-500/60 rounded-full px-4 py-2.5 text-xs text-content outline-none placeholder:text-secondary transition-all shadow-inner"
                  />
                  
                  <button
                    type="submit"
                    disabled={!newMessageText.trim()}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      newMessageText.trim()
                        ? (!activeConversation.messages || activeConversation.messages.length === 0)
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black active:scale-95 shadow-md shadow-amber-500/25'
                          : 'bg-gradient-to-r from-rose-500 to-rose-600 text-white active:scale-95 shadow-md shadow-rose-500/30'
                        : 'bg-surface-accent text-secondary cursor-not-allowed opacity-50'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </>
        ) : (
          /* Empty Active Session State */
          <div className="flex-1 flex flex-col relative">
            <div className="p-3 flex items-center justify-between absolute top-0 left-0 right-0 z-10">
              <button
                onClick={() => setSelectedRoll(null)}
                className="p-1 -ml-1 text-secondary hover:text-content active:bg-surface-accent rounded-lg transition-colors cursor-pointer"
                title="Back to list"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-secondary space-y-3">
              <div className="w-12 h-12 bg-surface border border-divider rounded-2xl flex items-center justify-center text-tertiary">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-primary">No Active Chat</h3>
                <p className="text-[11px] text-secondary max-w-xs mx-auto mt-0.5 leading-relaxed">
                  Select a classmate from the list or start a new conversation.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowNewChatModal(true);
                  setActionError('');
                  setActionSuccess('');
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer active:scale-95"
              >
                Start New Conversation
              </button>
            </div>
          </div>
        )}
      </div>

      {/* NEW CHAT MODAL SCREEN */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-[999] animate-fade-in">
          <div className="bg-surface border border-divider rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-3.5 border-b border-divider bg-surface-accent flex justify-between items-center">
              <div>
                <h4 className="text-xs font-bold text-content uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-indigo-400" />
                  Lookup Classmate
                </h4>
                <p className="text-[8px] text-violet-400 font-mono tracking-widest uppercase mt-0.5 font-bold">
                  NOTX Directory
                </p>
              </div>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="p-1 hover:bg-divider/60 rounded-lg text-secondary hover:text-content transition-all cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Search Input */}
            <div className="p-3 border-b border-divider bg-background">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter Name, Roll Number, or branch..."
                  className="w-full bg-surface border border-divider focus:border-indigo-500/50 rounded-xl pl-9 pr-8 py-2.5 text-xs text-content outline-none"
                  autoFocus
                />
                <Search className="w-3.5 h-3.5 text-tertiary absolute left-3 top-3" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-3 text-[10px] text-secondary hover:text-content"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Modal Student List */}
            <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/80 bg-background max-h-64 scrollbar-none">
              {filteredStudentsForChat.length === 0 ? (
                <div className="p-8 text-center text-tertiary text-xs">
                  No registered students match "{searchQuery}"
                </div>
              ) : (
                filteredStudentsForChat.map((student) => (
                  <button
                    key={student.uid}
                    onClick={() => handleStartNewChat(student)}
                    className="w-full text-left p-3 flex items-center justify-between hover:bg-surface-accent/40 transition-all outline-none cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-surface-accent border border-divider/60 flex items-center justify-center text-content font-mono font-bold text-xs flex-shrink-0 overflow-hidden">
                        <img 
                          src={student.profile_pic || `https://api.dicebear.com/9.x/notionists/svg?seed=${student.rollNumber || student.uid}`} 
                          alt="avatar" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div>
                        <h5 className="text-[11px] font-bold text-content">{student.name}</h5>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[8px] font-mono text-violet-400 uppercase font-bold">
                            {student.rollNumber || 'N/A'}
                          </span>
                          <span className="text-[8px] text-secondary">
                            • {student.year || '3rd Year'} ({student.department || 'CSE'})
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-tertiary" />
                  </button>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-2.5 bg-surface border-t border-divider text-center">
              <span className="text-[8px] font-mono text-secondary">
                Direct peer-to-peer communication
              </span>
            </div>
          </div>
        </div>
      )}

      {/* DELETE ENTIRE CHAT CONFIRMATION MODAL */}
      {chatToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-[1000] animate-fade-in">
          <div className="bg-surface border border-divider rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-content">Delete Entire Chat?</h4>
                <p className="text-[10px] text-secondary font-mono">Permanent wipeout</p>
              </div>
            </div>
            
            <p className="text-xs text-secondary leading-relaxed">
              Are you sure you want to permanently delete all messages and the entire chat history with <span className="font-bold text-content">{chatToDelete.name}</span> ({chatToDelete.roll})? This action cannot be undone.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                disabled={isDeletingChat}
                onClick={() => setChatToDelete(null)}
                className="flex-1 py-2 text-xs font-semibold rounded-xl border border-divider hover:bg-surface-accent text-secondary hover:text-content transition-all cursor-pointer"
              >
                Cancel
              </button>
              <HoldButton
                size="sm"
                holdTime={1800}
                backgroundColor="#18181b"
                fillColor="#e11d48"
                textColor="#ffffff"
                fillTextColor="#ffffff"
                radius={12}
                doneLabel="Chat Deleted"
                disabled={isDeletingChat}
                onHold={confirmDeleteChat}
                icon={<Trash2 className="w-3.5 h-3.5" />}
                className="flex-1"
              >
                Hold to Delete Chat
              </HoldButton>
            </div>
          </div>
        </div>
      )}

      {/* DELETE SINGLE MESSAGE CONFIRMATION MODAL */}
      {messageToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-[1000] animate-fade-in">
          <div className="bg-surface border border-divider rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-content">Delete Message?</h4>
                <p className="text-[10px] text-secondary font-mono">Remove from conversation</p>
              </div>
            </div>
            
            <p className="text-xs text-secondary leading-relaxed">
              Are you sure you want to delete this message? It will be removed for all participants.
            </p>

            <div className="bg-background border border-divider rounded-xl p-3 text-xs text-content italic line-clamp-3">
              "{messageToDelete.text}"
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                disabled={isDeletingMessage}
                onClick={() => setMessageToDelete(null)}
                className="flex-1 py-2 text-xs font-semibold rounded-xl border border-divider hover:bg-surface-accent text-secondary hover:text-content transition-all cursor-pointer"
              >
                Cancel
              </button>
              <HoldButton
                size="sm"
                holdTime={1600}
                backgroundColor="#18181b"
                fillColor="#e11d48"
                textColor="#ffffff"
                fillTextColor="#ffffff"
                radius={12}
                doneLabel="Deleted"
                disabled={isDeletingMessage}
                onHold={confirmDeleteMessage}
                icon={<Trash2 className="w-3.5 h-3.5" />}
                className="flex-1"
              >
                Hold to Delete
              </HoldButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
