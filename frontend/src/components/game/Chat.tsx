'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';

interface ChatMessage {
  playerId: string;
  nickname: string;
  text: string;
  isCorrect: boolean;
  timestamp: number;
}

interface ChatProps {
  messages: ChatMessage[];
  onSendGuess: (word: string) => void;
  isGuessingEnabled: boolean;
  disabled?: boolean;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function Chat({
  messages,
  onSendGuess,
  isGuessingEnabled,
  disabled = false,
}: ChatProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messageCount = messages.length;
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messageCount]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = input.trim();
      if (!trimmed || !isGuessingEnabled || disabled) return;
      onSendGuess(trimmed);
      setInput('');
    },
    [input, onSendGuess, isGuessingEnabled, disabled],
  );

  return (
    <div className="flex h-full flex-col rounded-xl border border-white/10 bg-bg-secondary">
      {/* Header */}
      <div className="border-b border-white/10 px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">Chat</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-text-secondary">
            {disabled
              ? 'Chat is disabled.'
              : isGuessingEnabled
                ? 'No guesses yet. Start typing!'
                : 'Waiting...'}
          </p>
        )}

        {messages.map((msg) => (
          <div
            key={`${msg.playerId}-${msg.timestamp}`}
            className={clsx(
              'animate-fadeIn',
              msg.isCorrect &&
                'rounded-lg border border-success/30 bg-success/10 p-2',
            )}
          >
            <div className="flex items-baseline gap-2">
              <span
                className={clsx(
                  'text-xs font-semibold',
                  msg.isCorrect ? 'text-success' : 'text-text-secondary',
                )}
              >
                {msg.nickname}
              </span>
              <span className="text-xs text-text-secondary/50">
                {formatTime(msg.timestamp)}
              </span>
            </div>

            {msg.isCorrect ? (
              <p className="text-sm font-bold text-success">
                Correct guess! +10 pts
              </p>
            ) : (
              <p className="truncate text-sm text-text-primary">{msg.text}</p>
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 border-t border-white/10 p-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            isGuessingEnabled ? 'Type your guess...' : 'Waiting...'
          }
          disabled={!isGuessingEnabled || disabled}
          maxLength={100}
          className={clsx(
            'flex-1 rounded-lg border bg-bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/40',
            'focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50',
            'transition-colors duration-150',
            (!isGuessingEnabled || disabled) && 'cursor-not-allowed opacity-50',
          )}
          aria-label="Type your guess"
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!input.trim() || !isGuessingEnabled || disabled}
        >
          Send
        </Button>
      </form>
    </div>
  );
}
