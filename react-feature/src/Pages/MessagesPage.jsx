import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../Components/Header';
import Dialog from '../Components/ui/Dialog';
import Icon from '../Components/ui/Icon';
import UserPicker from '../Components/ui/UserPicker';
import { ChatService, chatWebSocketService } from '../services/ChatService';
import api, { getCurrentUser } from '../services/AuthService';
import { validateChatFile, validateChatPhoto, getFileRestrictionsMessage } from '../utils/fileValidation';
import '../Styling/MessagesPage.css';

const DEFAULT_AVATAR = '/dpp.jpg';
const PAGE_SIZE = 15;
const SYSTEM_TYPES = ['JOIN', 'LEAVE', 'CREATE'];

// The chat list and the chat itself use different id field names
const chatIdOf = (chat) => chat?.ChatId || chat?.chatRoomId;

const showDefaultAvatar = (event) => {
  if (!event.currentTarget.src.endsWith(DEFAULT_AVATAR)) event.currentTarget.src = DEFAULT_AVATAR;
};

// ---------- Message text helpers ----------

// Files and chat photo changes arrive as text with "| FILE_URL:" style markers
function parseMessage(message) {
  const text = message.message || '';
  if (text.includes('| PHOTO_URL:')) {
    const url = text.match(/\| PHOTO_URL:([^|]+)/)?.[1]?.trim() || null;
    return { kind: 'system', text: text.split('|')[0].trim(), photo: url };
  }
  if (message.type === 'FILE' || text.includes('| FILE_URL:')) {
    const url = text.match(/\| FILE_URL:([^|]+)/)?.[1]?.trim() || null;
    const size = Number(text.match(/\| FILE_SIZE:(\d+)/)?.[1] || 0);
    const name = text.match(/sent a file: ([^|]+)/)?.[1]?.trim() || 'File';
    const target = url || name;
    let fileKind = 'other';
    if (/\.(jpe?g|png|gif|webp)(\?|$)/i.test(target)) fileKind = 'image';
    else if (/\.(mp3|wav|ogg|m4a)(\?|$)/i.test(target)) fileKind = 'audio';
    else if (/\.(mp4|mov|webm)(\?|$)/i.test(target)) fileKind = 'video';
    return { kind: 'file', fileKind, url, size, name };
  }
  if (SYSTEM_TYPES.includes(message.type)) return { kind: 'system', text };
  return { kind: 'text', text };
}

function previewText(text) {
  if (!text) return 'No messages yet';
  return text.split(/\s*\|\s*(?:PHOTO_URL|FILE_URL):/)[0];
}

function formatListTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const hours = (Date.now() - date) / 36e5;
  if (hours < 24) return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (hours < 24 * 7) return date.toLocaleDateString([], { weekday: 'short' });
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatClock(timestamp) {
  return timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
}

function dayLabel(timestamp) {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  });
}

function formatFileSize(bytes) {
  if (!bytes) return '';
  const units = ['bytes', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${parseFloat((bytes / 1024 ** i).toFixed(1))} ${units[i]}`;
}

async function downloadFile(url, name) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blobUrl = URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error('Download failed, opening the file instead', err);
    window.open(url, '_blank', 'noopener');
  }
}

// ---------- Page ----------

function MessagesPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [status, setStatus] = useState('loading');
  const [retryKey, setRetryKey] = useState(0);
  const [conversations, setConversations] = useState([]);
  const [query, setQuery] = useState('');

  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [fetchingOlder, setFetchingOlder] = useState(false);

  const [draft, setDraft] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [notice, setNotice] = useState(null);

  const [dialog, setDialog] = useState(null); // 'new' | 'add' | 'details' | 'leave' | null
  const [newChatUsers, setNewChatUsers] = useState([]);
  const [newChatName, setNewChatName] = useState('');
  const [newChatError, setNewChatError] = useState(null);
  const [creating, setCreating] = useState(false);

  const threadRef = useRef(null);
  const composerRef = useRef(null);
  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);
  // Read inside WebSocket callbacks, which outlive the render they were made in
  const activeIdRef = useRef(null);
  // Last messages shown per conversation, for instant switching back
  const chatCacheRef = useRef(new Map());
  const meRef = useRef(null);
  // What the next message update should do to the scroll position
  const scrollIntent = useRef({ type: 'none' });
  // Whether the reader is at the bottom of the thread (so new messages keep it there)
  const pinnedRef = useRef(true);

  const active = conversations.find((chat) => chatIdOf(chat) === activeId) || null;

  // ---------- Opening chats ----------

  const loadFirstPage = async (chatId) => {
    // A conversation opened before shows its last messages straight away
    // (from chatCacheRef) while the latest page loads in the background
    if (!chatCacheRef.current.has(chatId)) setLoadingMessages(true);
    try {
      const { data } = await ChatService.getChatMessagesPaged(chatId, 0, PAGE_SIZE);
      if (activeIdRef.current !== chatId) return;
      const list = Array.isArray(data) ? data : [];
      const ids = new Set(list.map((m) => m.id));
      const newest = list.length > 0 ? new Date(list[list.length - 1].time).getTime() : 0;
      scrollIntent.current = { type: 'bottom' };
      // Fresh page wins; keep only socket arrivals newer than it
      setMessages((prev) => [...list, ...prev.filter((m) => (!m.id || !ids.has(m.id)) && new Date(m.time).getTime() > newest)]);
      setPage(0);
      setHasMore(list.length === PAGE_SIZE);
    } catch (err) {
      console.error('Error loading messages:', err);
      if (activeIdRef.current === chatId) setNotice("Couldn't load this conversation.");
    } finally {
      if (activeIdRef.current === chatId) setLoadingMessages(false);
    }
  };

  const subscribe = (chatId) => {
    if (!chatWebSocketService.isWebSocketConnected()) return;
    // Subscribing twice to the same chat would show every message twice
    chatWebSocketService.unsubscribeFromChat(chatId);
    chatWebSocketService.subscribeToChat(chatId, (incoming) => {
      if (activeIdRef.current === chatId) {
        const mine = incoming.sender === meRef.current?.userName;
        scrollIntent.current = { type: pinnedRef.current || mine ? 'bottom' : 'none' };
        setMessages((prev) => [...prev, incoming]);
      }
      setConversations((prev) => prev.map((chat) => (
        chatIdOf(chat) === chatId ? { ...chat, message: incoming.message, time: incoming.time } : chat
      )));
    });
  };

  const openChat = (chatId) => {
    if (!chatId) return;
    const previous = activeIdRef.current;
    // Only listen to the open chat, so other chats' messages don't land in it
    if (previous && previous !== chatId) chatWebSocketService.unsubscribeFromChat(previous);
    activeIdRef.current = chatId;
    setActiveId(chatId);
    const seen = chatCacheRef.current.get(chatId);
    scrollIntent.current = { type: 'bottom' };
    setMessages(seen || []);
    setHasMore(false);
    setNotice(null);
    subscribe(chatId);
    loadFirstPage(chatId);
  };

  const closeChat = () => {
    if (activeIdRef.current) chatWebSocketService.unsubscribeFromChat(activeIdRef.current);
    activeIdRef.current = null;
    setActiveId(null);
    setMessages([]);
  };

  // ---------- Startup ----------

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      setStatus('loading');
      try {
        const user = await getCurrentUser();
        if (!user) throw new Error('Not logged in');
        await chatWebSocketService.connect();
        const { data } = await ChatService.getChats(0, 50);
        if (cancelled) return;
        const chats = data?.content || (Array.isArray(data) ? data : []);
        meRef.current = user;
        setMe(user);
        setConversations(chats);
        setStatus('ready');

        // "Message" on a profile links here with ?createChat=true&user=name
        const target = searchParams.get('user');
        if (searchParams.get('createChat') === 'true' && target && target !== user.userName) {
          navigate('/messages', { replace: true });
          const existing = chats.find((chat) => {
            const users = chat.users || [];
            return users.length === 2 && users.includes(target) && users.includes(user.userName);
          });
          if (existing) {
            openChat(chatIdOf(existing));
            return;
          }
          try {
            const { data: found } = await api.get(`/user/get/search/${encodeURIComponent(target)}?page=0&size=20`);
            const match = (found.content || []).find((u) => u.userName === target);
            if (!cancelled && match) setNewChatUsers([match]);
          } catch (err) {
            console.error('Error looking up user to message:', err);
          }
          if (!cancelled) setDialog('new');
        }
      } catch (err) {
        console.error('Error initializing chat:', err);
        if (!cancelled) setStatus('error');
      }
    };
    init();
    return () => {
      cancelled = true;
      chatWebSocketService.disconnect();
    };
    // Runs once per (re)try; the URL params are only read on arrival
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryKey]);

  // Remember the open conversation's messages for when you come back to it
  useEffect(() => {
    if (activeId) chatCacheRef.current.set(activeId, messages);
  }, [activeId, messages]);

  // ---------- Scrolling ----------

  useLayoutEffect(() => {
    const el = threadRef.current;
    if (!el) return;
    const intent = scrollIntent.current;
    if (intent.type === 'bottom') {
      el.scrollTop = el.scrollHeight;
      pinnedRef.current = true;
    } else if (intent.type === 'keep') {
      el.scrollTop = el.scrollHeight - intent.fromBottom;
    }
    scrollIntent.current = { type: 'none' };
  }, [messages]);

  // Images and players change height after they load; stay at the bottom if we were there
  const keepPinned = () => {
    const el = threadRef.current;
    if (el && pinnedRef.current) el.scrollTop = el.scrollHeight;
  };

  const loadOlder = async () => {
    const chatId = activeIdRef.current;
    if (!chatId || !hasMore || fetchingOlder) return;
    setFetchingOlder(true);
    try {
      const next = page + 1;
      const { data } = await ChatService.getChatMessagesPaged(chatId, next, PAGE_SIZE);
      if (activeIdRef.current !== chatId) return;
      const older = Array.isArray(data) ? data : [];
      const el = threadRef.current;
      scrollIntent.current = { type: 'keep', fromBottom: el ? el.scrollHeight - el.scrollTop : 0 };
      setMessages((prev) => {
        const ids = new Set(prev.map((m) => m.id));
        return [...older.filter((m) => !m.id || !ids.has(m.id)), ...prev];
      });
      setPage(next);
      setHasMore(older.length === PAGE_SIZE);
    } catch (err) {
      console.error('Error loading older messages:', err);
      setNotice("Couldn't load earlier messages.");
    } finally {
      setFetchingOlder(false);
    }
  };

  const handleThreadScroll = (event) => {
    const el = event.currentTarget;
    pinnedRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (el.scrollTop < 40) loadOlder();
  };

  // ---------- Composer ----------

  // Grow the box with its text, up to about six lines
  useLayoutEffect(() => {
    const el = composerRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [draft, activeId]);

  const send = () => {
    const text = draft.trim();
    const chatId = activeIdRef.current;
    if (!text || !chatId) return;
    if (!chatWebSocketService.isWebSocketConnected()) {
      setNotice('Connection lost. Refresh the page to reconnect.');
      return;
    }
    chatWebSocketService.sendMessage(chatId, text, me.userName);
    setDraft('');
  };

  const handleComposerKey = (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send();
    }
  };

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    const chatId = activeIdRef.current;
    if (!file || !chatId) return;
    const validation = validateChatFile(file, me.role);
    if (!validation.isValid) {
      setNotice(validation.error);
      return;
    }
    setUploading(true);
    setNotice(null);
    try {
      // The file message comes back over the socket
      await ChatService.uploadFileToChat(chatId, file);
    } catch (err) {
      console.error('Error uploading file:', err);
      setNotice("Couldn't send that file. Try again.");
    } finally {
      setUploading(false);
    }
  };

  // ---------- Chat settings ----------

  const handlePhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    const chatId = activeIdRef.current;
    if (!file || !chatId) return;
    const validation = validateChatPhoto(file, me.role);
    if (!validation.isValid) {
      setNotice(validation.error);
      return;
    }
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data: url } = await api.post('/s3/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await ChatService.updateChatPhoto(chatId, url);
      setConversations((prev) => prev.map((chat) => (
        chatIdOf(chat) === chatId
          ? { ...chat, chatPhoto: url, message: `${me.userName} changed the chat photo`, time: new Date().toISOString() }
          : chat
      )));
      // The "changed the chat photo" message isn't sent over the socket, so reload to show it
      if (activeIdRef.current === chatId) loadFirstPage(chatId);
    } catch (err) {
      console.error('Error uploading chat photo:', err);
      setNotice("Couldn't change the photo. Try again.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const addPerson = (user) => {
    const chatId = activeIdRef.current;
    if (!chatId) return;
    if (!chatWebSocketService.isWebSocketConnected()) {
      setNotice('Connection lost. Refresh the page to reconnect.');
      return;
    }
    chatWebSocketService.addUserToChat(chatId, user.userName, me.userName);
    setConversations((prev) => prev.map((chat) => (
      chatIdOf(chat) === chatId ? { ...chat, users: [...(chat.users || []), user.userName] } : chat
    )));
    setDialog(null);
  };

  const leaveChat = () => {
    const chatId = activeIdRef.current;
    if (!chatId) return;
    if (!chatWebSocketService.isWebSocketConnected()) {
      setNotice('Connection lost. Refresh the page to reconnect.');
      setDialog(null);
      return;
    }
    chatWebSocketService.leaveChat(chatId, me.userName);
    chatCacheRef.current.delete(chatId);
    closeChat();
    setConversations((prev) => prev.filter((chat) => chatIdOf(chat) !== chatId));
    setDialog(null);
  };

  // ---------- New conversation ----------

  const openNewChat = () => {
    setNewChatError(null);
    setDialog('new');
  };

  const closeNewChat = () => {
    setDialog(null);
    setNewChatUsers([]);
    setNewChatName('');
    setNewChatError(null);
  };

  const toggleNewChatUser = (user) => {
    setNewChatUsers((prev) => (
      prev.some((u) => u.userName === user.userName)
        ? prev.filter((u) => u.userName !== user.userName)
        : [...prev, user]
    ));
  };

  const defaultChatName = me ? [me.userName, ...newChatUsers.map((u) => u.userName)].join(', ') : '';

  const createChat = async () => {
    if (newChatUsers.length === 0 || creating) return;
    setCreating(true);
    setNewChatError(null);
    try {
      const { data: chat } = await ChatService.createChat(
        newChatUsers.map((u) => u.userName),
        newChatName.trim() || defaultChatName,
      );
      setConversations((prev) => [chat, ...prev.filter((c) => chatIdOf(c) !== chatIdOf(chat))]);
      closeNewChat();
      openChat(chatIdOf(chat));
    } catch (err) {
      console.error('Error creating chat:', err);
      setNewChatError("Couldn't start the conversation. Try again.");
    } finally {
      setCreating(false);
    }
  };

  // ---------- Render ----------

  if (status !== 'ready') {
    return (
      <div className="fm-page">
        <Header />
        <main className="fm-page__main">
          {status === 'loading' ? (
            <div className="fm-state" role="status">
              <div className="fm-spinner" />
              <p>Loading your messages…</p>
            </div>
          ) : (
            <div className="fm-state" role="alert">
              <h3>Couldn&apos;t connect to messages</h3>
              <p>Check your connection and try again.</p>
              <button type="button" className="fm-btn fm-btn--secondary" onClick={() => setRetryKey((k) => k + 1)}>Retry</button>
            </div>
          )}
        </main>
      </div>
    );
  }

  const term = query.trim().toLowerCase();
  const visibleChats = term
    ? conversations.filter((chat) => (
      (chat.chatName || '').toLowerCase().includes(term)
      || (chat.users || []).some((name) => name.toLowerCase().includes(term))
    ))
    : conversations;

  const members = active?.users || [];
  const others = members.filter((name) => name !== me.userName);
  const memberSummary = others.length === 0
    ? 'Just you'
    : others.length <= 3
      ? `You, ${others.join(', ')}`
      : `You, ${others.slice(0, 2).join(', ')} and ${others.length - 2} more`;

  return (
    <div className="fm-page">
      <Header />

      <main className="fm-page__main">
        <div className={`fm-msg${active ? ' has-active' : ''}`}>
          {/* Conversation list */}
          <aside className="fm-msg__list" aria-label="Conversations">
            <div className="fm-msg__list-head">
              <h1 className="fm-msg__title">Messages</h1>
              <button type="button" className="fm-icon-btn" onClick={openNewChat} aria-label="New conversation" title="New conversation">
                <Icon name="edit" />
              </button>
            </div>

            {conversations.length > 0 && (
              <div className="fm-search-field">
                <Icon name="search" size={18} />
                <input
                  type="search"
                  className="fm-input"
                  placeholder="Search conversations"
                  aria-label="Search conversations"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            )}

            {conversations.length === 0 ? (
              <div className="fm-msg__list-empty">
                <p>No conversations yet.</p>
                <button type="button" className="fm-btn fm-btn--secondary" onClick={openNewChat}>Start one</button>
              </div>
            ) : visibleChats.length === 0 ? (
              <p className="fm-msg__muted fm-msg__list-empty">No conversations match &ldquo;{query.trim()}&rdquo;.</p>
            ) : (
              <ul className="fm-msg__convos">
                {visibleChats.map((chat) => {
                  const id = chatIdOf(chat);
                  const isActive = id === activeId;
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        className={`fm-msg-convo${isActive ? ' is-active' : ''}`}
                        aria-current={isActive ? 'true' : undefined}
                        onClick={() => openChat(id)}
                      >
                        <img className="fm-msg-convo__avatar" src={chat.chatPhoto || DEFAULT_AVATAR} alt="" onError={showDefaultAvatar} />
                        <span className="fm-msg-convo__body">
                          <span className="fm-msg-convo__top">
                            <span className="fm-msg-convo__name">{chat.chatName || 'Untitled conversation'}</span>
                            <span className="fm-msg-convo__time">{formatListTime(chat.time)}</span>
                          </span>
                          <span className="fm-msg-convo__preview">{previewText(chat.message)}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>

          {/* Open conversation */}
          <section className="fm-msg__chat" aria-label={active ? active.chatName || 'Conversation' : 'Conversation'}>
            {active ? (
              <>
                <header className="fm-msg__chat-head">
                  <button type="button" className="fm-icon-btn fm-msg__back" onClick={closeChat} aria-label="Back to conversations">
                    <Icon name="chevronLeft" />
                  </button>
                  <button type="button" className="fm-msg__chat-id" onClick={() => setDialog('details')}>
                    <img src={active.chatPhoto || DEFAULT_AVATAR} alt="" onError={showDefaultAvatar} />
                    <span className="fm-msg__chat-text">
                      <span className="fm-msg__chat-name">{active.chatName || 'Untitled conversation'}</span>
                      <span className="fm-msg__chat-members">{memberSummary}</span>
                    </span>
                  </button>
                  <div className="fm-msg__chat-actions">
                    <button type="button" className="fm-icon-btn" onClick={() => setDialog('add')} aria-label="Add people" title="Add people">
                      <Icon name="userPlus" />
                    </button>
                    <button type="button" className="fm-icon-btn" onClick={() => setDialog('details')} aria-label="Conversation details" title="Details">
                      <Icon name="info" />
                    </button>
                  </div>
                </header>

                <div
                  className="fm-msg__thread"
                  ref={threadRef}
                  onScroll={handleThreadScroll}
                  role="log"
                  aria-label="Messages"
                >
                  {hasMore && (
                    <div className="fm-msg__older">
                      <button type="button" className="fm-btn fm-btn--secondary" onClick={loadOlder} disabled={fetchingOlder}>
                        {fetchingOlder ? 'Loading…' : 'Load earlier messages'}
                      </button>
                    </div>
                  )}
                  {loadingMessages && messages.length === 0 ? (
                    <div className="fm-state" role="status">
                      <div className="fm-spinner" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="fm-msg__thread-empty">
                      <p>No messages yet. Say hello and share what you&apos;re working on.</p>
                    </div>
                  ) : (
                    <MessageList messages={messages} me={me.userName} onMediaLoad={keepPinned} />
                  )}
                </div>

                <form className="fm-msg__composer" onSubmit={(e) => { e.preventDefault(); send(); }}>
                  <button
                    type="button"
                    className="fm-icon-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    aria-label={uploading ? 'Sending file' : 'Attach a file'}
                    title={getFileRestrictionsMessage(me.role)}
                  >
                    {uploading ? <span className="fm-mini-spinner" /> : <Icon name="paperclip" />}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    hidden
                    onChange={handleFile}
                    accept={me.role === 'USERPLUS'
                      ? 'image/jpeg,image/jpg,image/png,image/gif,audio/mp3,audio/mpeg,audio/wav'
                      : 'image/jpeg,image/jpg,image/png,audio/mp3,audio/mpeg'}
                  />
                  <textarea
                    ref={composerRef}
                    className="fm-msg__input"
                    rows={1}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={handleComposerKey}
                    placeholder="Write a message…"
                    aria-label="Message"
                  />
                  <button type="submit" className="fm-msg__send" disabled={!draft.trim()} aria-label="Send">
                    <Icon name="send" size={18} />
                  </button>
                </form>
              </>
            ) : (
              <div className="fm-state fm-msg__placeholder">
                <span className="fm-msg__placeholder-icon"><Icon name="message" size={28} /></span>
                <h2>Your messages</h2>
                <p>Pick a conversation, or start one with an artist you want to work with.</p>
                <button type="button" className="fm-btn fm-btn--primary" onClick={openNewChat}>
                  <Icon name="edit" size={18} />
                  New conversation
                </button>
              </div>
            )}
          </section>
        </div>

        {notice && (
          <div className="fm-msg__notice" role="alert">
            <span>{notice}</span>
            <button type="button" className="fm-icon-btn" onClick={() => setNotice(null)} aria-label="Dismiss">
              <Icon name="close" size={16} />
            </button>
          </div>
        )}
      </main>

      {/* New conversation */}
      <Dialog
        open={dialog === 'new'}
        onClose={closeNewChat}
        title="New conversation"
        footer={(
          <>
            <button type="button" className="fm-btn fm-btn--secondary" onClick={closeNewChat}>Cancel</button>
            <button type="button" className="fm-btn fm-btn--primary" onClick={createChat} disabled={newChatUsers.length === 0 || creating}>
              {creating ? 'Starting…' : 'Start conversation'}
            </button>
          </>
        )}
      >
        <div className="fm-msg-form">
          <UserPicker
            label="Who do you want to message?"
            exclude={[me.userName]}
            selected={newChatUsers.map((u) => u.userName)}
            onPick={toggleNewChatUser}
          />
          {newChatUsers.length > 0 && (
            <ul className="fm-person-chips" aria-label="Selected">
              {newChatUsers.map((user) => (
                <li key={user.userName} className="fm-person-chip">
                  <img src={user.profilePic || DEFAULT_AVATAR} alt="" onError={showDefaultAvatar} />
                  {user.userName}
                  <button type="button" onClick={() => toggleNewChatUser(user)} aria-label={`Remove ${user.userName}`}>
                    <Icon name="close" size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="fm-field">
            <label className="fm-field__label" htmlFor="fm-msg-chat-name">Conversation name</label>
            <input
              id="fm-msg-chat-name"
              className="fm-input"
              value={newChatName}
              onChange={(e) => setNewChatName(e.target.value)}
              placeholder={defaultChatName || 'Optional'}
              maxLength={80}
            />
            <span className="fm-field__hint">Optional. Leave it blank to use everyone&apos;s names.</span>
          </div>
          {newChatError && <p className="fm-field__error" role="alert">{newChatError}</p>}
        </div>
      </Dialog>

      {/* Add people */}
      {active && (
        <Dialog open={dialog === 'add'} onClose={() => setDialog(null)} title="Add people" size="sm">
          <UserPicker
            label={`Add someone to ${active.chatName || 'this conversation'}`}
            exclude={[me.userName, ...members]}
            onPick={addPerson}
            actionLabel="Add"
          />
        </Dialog>
      )}

      {/* Details */}
      {active && (
        <Dialog open={dialog === 'details'} onClose={() => setDialog(null)} title="Conversation details" size="sm">
          <div className="fm-msg-details">
            <div className="fm-msg-details__photo">
              <img src={active.chatPhoto || DEFAULT_AVATAR} alt="" onError={showDefaultAvatar} />
              <button
                type="button"
                className="fm-btn fm-btn--secondary"
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto}
              >
                <Icon name="camera" size={18} />
                {uploadingPhoto ? 'Uploading…' : 'Change photo'}
              </button>
              <span className="fm-field__hint">{me.role === 'USERPLUS' ? 'JPG, PNG or GIF' : 'JPG or PNG'}</span>
              <input
                ref={photoInputRef}
                type="file"
                hidden
                onChange={handlePhoto}
                accept={me.role === 'USERPLUS' ? 'image/jpeg,image/jpg,image/png,image/gif' : 'image/jpeg,image/jpg,image/png'}
              />
            </div>

            <div>
              <h3 className="fm-msg-details__heading">{members.length} {members.length === 1 ? 'member' : 'members'}</h3>
              <ul className="fm-msg-members">
                {members.map((name) => (
                  <li key={name}>
                    <a href={`/profile/${name}`} className="fm-msg-member">
                      <span className="fm-msg-member__initial" aria-hidden="true">{name.charAt(0).toUpperCase()}</span>
                      {name}
                      {name === me.userName && <span className="fm-msg__muted">(you)</span>}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="fm-msg-details__actions">
              <button type="button" className="fm-btn fm-btn--secondary" onClick={() => setDialog('add')}>
                <Icon name="userPlus" size={18} />
                Add people
              </button>
              <button type="button" className="fm-btn fm-btn--danger" onClick={() => setDialog('leave')}>
                <Icon name="logout" size={18} />
                Leave conversation
              </button>
            </div>
          </div>
        </Dialog>
      )}

      {/* Leave confirmation */}
      {active && (
        <Dialog
          open={dialog === 'leave'}
          onClose={() => setDialog(null)}
          title="Leave this conversation?"
          size="sm"
          footer={(
            <>
              <button type="button" className="fm-btn fm-btn--secondary" onClick={() => setDialog(null)}>Cancel</button>
              <button type="button" className="fm-btn fm-btn--danger" onClick={leaveChat}>Leave</button>
            </>
          )}
        >
          <p className="fm-msg-dialog-text">
            You&apos;ll stop getting messages from <strong>{active.chatName || 'this conversation'}</strong>.
            Someone in it will need to add you back if you want to return.
          </p>
        </Dialog>
      )}
    </div>
  );
}

// ---------- Thread ----------

function MessageList({ messages, me, onMediaLoad }) {
  const items = [];
  let lastDay = null;
  let lastSender = null;

  messages.forEach((message, index) => {
    const key = message.id || message.messageId || `${message.time}-${index}`;
    const day = message.time ? new Date(message.time).toDateString() : lastDay;
    if (day && day !== lastDay) {
      items.push(<li key={`day-${day}`} className="fm-msg-day"><span>{dayLabel(message.time)}</span></li>);
      lastDay = day;
      lastSender = null;
    }

    const parsed = parseMessage(message);
    if (parsed.kind === 'system') {
      items.push(
        <li key={key} className="fm-msg-system">
          <span>{parsed.text}</span>
          {parsed.photo && <img src={parsed.photo} alt="New conversation photo" onLoad={onMediaLoad} />}
        </li>,
      );
      lastSender = null;
      return;
    }

    const mine = message.sender === me;
    const first = message.sender !== lastSender;
    lastSender = message.sender;

    items.push(
      <li key={key} className={`fm-msg-row ${mine ? 'is-mine' : 'is-theirs'}${first ? ' is-first' : ''}`}>
        {!mine && first && (
          <a href={`/profile/${message.sender}`} className="fm-msg-row__sender">{message.sender}</a>
        )}
        <div className={`fm-msg-bubble${parsed.kind === 'file' && parsed.fileKind === 'image' ? ' fm-msg-bubble--media' : ''}`}>
          {parsed.kind === 'file' ? <FileContent file={parsed} onMediaLoad={onMediaLoad} /> : (
            <p className="fm-msg-bubble__text">{parsed.text}</p>
          )}
          <time className="fm-msg-bubble__time" dateTime={message.time}>{formatClock(message.time)}</time>
        </div>
      </li>,
    );
  });

  return <ol className="fm-msg-thread">{items}</ol>;
}

function FileContent({ file, onMediaLoad }) {
  if (!file.url) return <p className="fm-msg-bubble__text">{file.name}</p>;

  if (file.fileKind === 'image') {
    return (
      <a href={file.url} target="_blank" rel="noopener noreferrer" className="fm-msg-image">
        <img src={file.url} alt={file.name} onLoad={onMediaLoad} />
      </a>
    );
  }

  const meta = (
    <span className="fm-msg-file__meta">
      <span className="fm-msg-file__name">{file.name}</span>
      {file.size > 0 && <span className="fm-msg-file__size">{formatFileSize(file.size)}</span>}
    </span>
  );

  if (file.fileKind === 'audio' || file.fileKind === 'video') {
    return (
      <div className="fm-msg-file fm-msg-file--player">
        <span className="fm-msg-file__head">
          <Icon name={file.fileKind === 'audio' ? 'music' : 'play'} size={18} />
          {meta}
        </span>
        {file.fileKind === 'audio'
          ? <audio controls preload="metadata" src={file.url} onLoadedMetadata={onMediaLoad} />
          : <video controls preload="metadata" src={file.url} onLoadedMetadata={onMediaLoad} />}
      </div>
    );
  }

  return (
    <div className="fm-msg-file">
      <span className="fm-msg-file__head">
        <Icon name="file" size={18} />
        {meta}
      </span>
      <button type="button" className="fm-icon-btn" onClick={() => downloadFile(file.url, file.name)} aria-label={`Download ${file.name}`}>
        <Icon name="download" size={18} />
      </button>
    </div>
  );
}

export default MessagesPage;
