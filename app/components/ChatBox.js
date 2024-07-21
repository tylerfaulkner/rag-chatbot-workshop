import { useChat } from 'ai/react';
import BotChatBubble from './BotChatBubble';
import UserChatBubble from './UserChatBubble';
import { useEffect, useRef } from 'react';
import LoadingMessage from './LoadingMessage';

export default function ChatBox() {
    const { messages, error, isLoading, input, handleInputChange, handleSubmit } = useChat();
    const messagesEndRef = useRef(null);
    console.log(messages)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView();
    };
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <div className="flex flex-col max-w-7xl h-full p-3 mx-auto stretch border-4 rounded-2xl bg-gradient-to-b from-slate-600 to-slate-800 relative shadow-inner">
      <div>
        <h1 className="text-3xl font-bold text-white">Knowledge Base Chat</h1>
      </div>
      {
        error && (
        <div className='flex justify-center'>
            <div className="text-red-500 p-2 rounded-lg bg-zinc-900">
                There was an error communicating with your chatbot:
                {error.message}
            </div>
          </div>
        )
      }
      <div className=' grow gap-2 my-2 p-4 flex flex-col overflow-y-auto'>
      {messages.map((m,i) => (
        m.role === 'user' ? <UserChatBubble key={m.id}>{m.content}</UserChatBubble> : <BotChatBubble key={m.id}>{m.content}</BotChatBubble>
      ))}
      {
        isLoading && messages[messages.length - 1]?.role != 'assistant' && (
          <LoadingMessage/>
        )
      }
      <div ref={messagesEndRef}></div>
      </div>
      <form onSubmit={handleSubmit}>
        <input
          className="w-full p-2 border border-gray-300 rounded shadow-inner"
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
        />
      </form>
    </div>
    )
}