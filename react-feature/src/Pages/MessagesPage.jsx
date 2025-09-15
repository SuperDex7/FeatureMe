import React, { useState,useEffect} from 'react';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import Stomp from 'stompjs'
import SockJS from 'sockjs-client'
import '../Styling/Messages.css';

const MessagesPage = () => {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState('');

  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState('')
  const [username, setUsername] = useState('')
  const [stompClient, setStompClient] = useState(null)

  useEffect(()=>{
    const socket = new SockJS('http:/localhost:8080/ws')
    const client = Stomp.over(socket)
    client.connect({}, ()=>{
      client.subscribe('/topic/messages', (message) =>{
        const recievedMessage = JSON.parse(message.body);
        setMessage((prevMessages) => [...prevMessages, recievedMessage]);
      }) 
    })
    setStompClient(client);

    return () => {
      client.disconnect();
    }
  })

  const handleNickNameChange = (e) =>{
    setUsername(e.target.value);
  }
  const handleMessageChange = (e) =>{
    setMessage(e.target.value);
  }

  const sendMessage = () =>{
    if(message.trim()){
      const chatMessage ={
        username,
        content: message
      };
      stompClient.send('/app/chat', {}, JSON.stringify(chatMessage));
    }
  }

  // Dummy conversation data
  const conversations = [
    {
      id: 1,
      name: 'Sarah Chen',
      avatar: '/dpp.jpg',
      lastMessage: 'Hey! I loved your latest track. Would you be interested in collaborating?',
      timestamp: '2 min ago',
      unread: 2,
      online: true
    },
    {
      id: 2,
      name: 'Mike Rodriguez',
      avatar: '/pb.jpg',
      lastMessage: 'The beat you sent is fire! When can we get in the studio?',
      timestamp: '1 hour ago',
      unread: 0,
      online: true
    },
    {
      id: 3,
      name: 'Alex Thompson',
      avatar: '/dpp.jpg',
      lastMessage: 'Thanks for the feedback on my demo. Really appreciate it!',
      timestamp: '3 hours ago',
      unread: 1,
      online: false
    },
    {
      id: 4,
      name: 'Emma Wilson',
      avatar: '/pb.jpg',
      lastMessage: 'Are you still looking for a vocalist for your project?',
      timestamp: 'Yesterday',
      unread: 0,
      online: false
    },
    {
      id: 5,
      name: 'David Park',
      avatar: '/dpp.jpg',
      lastMessage: 'Just dropped a new beat pack. Check it out!',
      timestamp: '2 days ago',
      unread: 0,
      online: true
    }
  ];

  // Dummy messages for selected conversation
  const getMessages = (conversationId) => {
    const messageData = {
      1: [
        { id: 1, text: 'Hey! I listened to your latest track on your profile', sender: 'other', timestamp: '10:30 AM' },
        { id: 2, text: 'It\'s absolutely incredible! The production quality is amazing', sender: 'other', timestamp: '10:31 AM' },
        { id: 3, text: 'Thank you so much! That means a lot coming from you', sender: 'me', timestamp: '10:45 AM' },
        { id: 4, text: 'I\'ve been following your work for a while now', sender: 'me', timestamp: '10:45 AM' },
        { id: 5, text: 'Would you be interested in collaborating on something?', sender: 'other', timestamp: '11:00 AM' },
        { id: 6, text: 'I have this melody idea that I think would work perfectly with your style', sender: 'other', timestamp: '11:01 AM' }
      ],
      2: [
        { id: 1, text: 'Yo! That beat you sent is absolutely fire 🔥', sender: 'other', timestamp: '2:15 PM' },
        { id: 2, text: 'I\'ve been playing it on repeat all day', sender: 'other', timestamp: '2:15 PM' },
        { id: 3, text: 'Haha glad you like it! Spent all night working on it', sender: 'me', timestamp: '2:30 PM' },
        { id: 4, text: 'When can we get in the studio to record over it?', sender: 'other', timestamp: '3:00 PM' }
      ]
    };
    return messageData[conversationId] || [];
  };

  const handleSendMessage = () => {
    if (messageText.trim() && selectedConversation) {
      // In a real app, you'd send this to your backend
      console.log('Sending message:', messageText);
      setMessageText('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="messages-page">
      <Header />
      
      <div className="messages-container">
        {/* Conversations Sidebar */}
        <div className="conversations-sidebar">
          <div className="sidebar-header">
            <h2>Messages</h2>
            <button className="new-message-btn">
              <span className="icon">✏️</span>
            </button>
          </div>
          
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input type="text" placeholder="Search conversations..." />
          </div>

          <div className="conversations-list">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`conversation-item ${selectedConversation?.id === conversation.id ? 'active' : ''}`}
                onClick={() => setSelectedConversation(conversation)}
              >
                <div className="conversation-avatar">
                  <img src={conversation.avatar} alt={conversation.name} />
                  {conversation.online && <div className="online-indicator"></div>}
                </div>
                
                <div className="conversation-content">
                  <div className="conversation-header">
                    <h3 className="conversation-name">{conversation.name}</h3>
                    <span className="conversation-time">{conversation.timestamp}</span>
                  </div>
                  <p className="conversation-preview">{conversation.lastMessage}</p>
                </div>
                
                {conversation.unread > 0 && (
                  <div className="unread-badge">{conversation.unread}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="chat-area">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="chat-header">
                <div className="chat-user-info">
                  <div className="chat-avatar">
                    <img src={selectedConversation.avatar} alt={selectedConversation.name} />
                    {selectedConversation.online && <div className="online-indicator"></div>}
                  </div>
                  <div className="chat-user-details">
                    <h3>{selectedConversation.name}</h3>
                    <span className="user-status">
                      {selectedConversation.online ? 'Active now' : 'Last seen recently'}
                    </span>
                  </div>
                </div>
                
                <div className="chat-actions">
                  <button className="chat-action-btn">📞</button>
                  <button className="chat-action-btn">📹</button>
                  <button className="chat-action-btn">ℹ️</button>
                </div>
              </div>

              {/* Messages */}
              <div className="messages-area">
                {getMessages(selectedConversation.id).map((message) => (
                  <div
                    key={message.id}
                    className={`message ${message.sender === 'me' ? 'message-sent' : 'message-received'}`}
                  >
                    <div className="message-bubble">
                      <p>{message.text}</p>
                      <span className="message-time">{message.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="message-input-area">
                <div className="message-input-container">
                  <button className="attach-btn">📎</button>
                  <div className="input-wrapper">
                    <textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      rows="1"
                    />
                  </div>
                  <button className="emoji-btn">😊</button>
                  <button 
                    className="send-btn"
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                  >
                    <span className="send-icon">➤</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* No conversation selected */
            <div className="no-conversation">
              <div className="no-conversation-content">
                <div className="no-conversation-icon">💬</div>
                <h3>Select a conversation</h3>
                <p>Choose from your existing conversations or start a new one</p>
                <button className="start-conversation-btn">Start New Conversation</button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MessagesPage;
