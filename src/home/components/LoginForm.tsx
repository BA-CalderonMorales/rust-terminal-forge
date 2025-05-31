
// Home module - Login form component
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface LoginFormProps {
  onLogin: (username: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username.trim());
    }
  };

  return (
    <div className="min-h-screen bg-black text-green-400 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-mono text-green-300 mb-4">
            Rust Terminal
          </h1>
          <p className="text-green-500 font-mono text-sm sm:text-base">
            Enter your username to access the terminal
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label 
              htmlFor="username" 
              className="block text-green-300 font-mono text-sm mb-2"
            >
              Username
            </label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username..."
              className="bg-gray-900 border-green-600 text-green-400 placeholder-green-600 font-mono min-h-[44px] text-base"
              autoComplete="username"
              autoFocus
            />
          </div>
          
          <Button
            type="submit"
            disabled={!username.trim()}
            className="w-full bg-green-600 hover:bg-green-700 text-black font-mono min-h-[44px] text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Login
          </Button>
        </form>
        
        <div className="mt-8 text-center">
          <p className="text-green-600 font-mono text-xs sm:text-sm">
            Note: This uses local storage for demo purposes
          </p>
        </div>
      </div>
    </div>
  );
};
