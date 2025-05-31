
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
          <h1 className="text-2xl font-mono mb-2">Rust Terminal</h1>
          <p className="text-green-300 text-sm">Web-based Rust development environment</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-mono mb-2">
              Username:
            </label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-gray-900 border-green-600 text-green-400 font-mono focus:border-green-400"
              placeholder="Enter your username"
              autoFocus
            />
          </div>
          
          <Button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-black font-mono"
            disabled={!username.trim()}
          >
            Connect to Terminal
          </Button>
        </form>
        
        <div className="mt-6 text-xs text-green-600 font-mono text-center">
          <p>Type 'help' for available commands</p>
        </div>
      </div>
    </div>
  );
};
