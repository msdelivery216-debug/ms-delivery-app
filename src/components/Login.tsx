import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Truck, Lock, User, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'Admin' && password === 'Admin@123') {
      localStorage.setItem('isLoggedIn', 'true');
      navigate('/');
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-indigo-100 border border-neutral-100 space-y-10">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mx-auto shadow-xl shadow-indigo-200">
              <Truck className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Welcome Back</h1>
              <p className="text-neutral-500">MS Delivery Services Admin Portal</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-700 ml-1">Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input 
                  required
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="Enter username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-700 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input 
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="Enter password"
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-red-600 text-sm font-medium bg-red-50 p-3 rounded-xl"
              >
                <AlertCircle className="w-4 h-4" />
                {error}
              </motion.div>
            )}

            <button 
              type="submit"
              className="w-full py-5 bg-indigo-600 text-white font-bold text-lg rounded-3xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200"
            >
              Sign In
            </button>
          </form>

          <div className="text-center">
            <p className="text-xs text-neutral-400">
              Authorized personnel only. For support contact IT.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
