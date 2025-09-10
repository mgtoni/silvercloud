import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface Message {
  id: number;
  sender_id: string;
  content: string;
  timestamp: string;
}

const Messages: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');

  // In a real app, you'd get the user ID from the route
  const threadUserId = 'user-456'; 

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const session = await supabase.auth.getSession();
        if (!session.data.session) {
          throw new Error('Not authenticated');
        }

        const response = await fetch(`/api/messages/thread/${threadUserId}`, {
          headers: {
            'Authorization': `Bearer ${session.data.session.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }

        const data = await response.json();
        setMessages(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic to send a new message would go here
    console.log('Sending message:', newMessage);
    setNewMessage('');
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Messages with {threadUserId}</h1>
      <div className="space-y-4 mb-4">
        {messages.map(message => (
          <div key={message.id} className="p-2 border rounded-lg">
            <p>{message.content}</p>
            <p className="text-xs text-gray-500">{new Date(message.timestamp).toLocaleTimeString()}</p>
          </div>
        ))}
      </div>
      <form onSubmit={handleSendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="Type your message..."
        />
        <button type="submit" className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Send
        </button>
      </form>
    </div>
  );
};

export default Messages;
