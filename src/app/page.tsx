'use client'

import React, { useState } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { addEmailToList } from '@/services/supabaseClientFunctions';

const App = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError('');
    try {
      await addEmailToList(email);
      setIsSubmitted(true);
      setEmail('');
    } catch (error) {
      console.error('Failed to add email:', error);
      setError('Failed to add email. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center p-4 bg-white">
        <div className="text-2xl font-bold text-gray-800 flex items-center">
          <img src="https://gdtffvonnguufizhazwx.supabase.co/storage/v1/object/public/test/11cee88b-c974-4ddf-a7b1-58c775dfc37e.png" alt="Logo" className="h-6 w-auto mr-2" />
        </div>
        <button className="bg-gradient-to-r from-cyan-500 to-green-500 text-white font-bold py-3 px-5 rounded-md transition duration-300 ease-in-out hover:opacity-90">
          Coming Soon
        </button>
      </div>
      <div className="text-center font-semibold mt-4">
        <h1 className="text-center capitalize text-5xl mt-0 mb-0 pb-2.5">
          <span className="text-cyan-600 block mb-2">AI-powered</span>
          <span className="text-green-500 block">Code & UI Generator</span>
        </h1>
        <h2 className="text-lg text-gray-600 mt-0 mb-3 opacity-90 font-medium">
          Create custom websites with Ease | Full control over design & code
        </h2>
        <div className="flex flex-col items-center p-[60px_40px_40px_40px]">
          <div className="relative rounded-lg shadow-md p-[60px_20px_20px_20px] bg-gray-100">
            <img src="https://gdtffvonnguufizhazwx.supabase.co/storage/v1/object/public/test/00915955-9790-4660-acc6-cefb91a11884.gif" className="rounded-lg max-w-full h-auto" />
            <div className="absolute top-5 left-5 flex gap-1.5 pb-2.5">
              <div className="w-3 h-3 rounded-full bg-[#ff605c]"></div>
              <div className="w-3 h-3 rounded-full bg-[#ffbd44]"></div>
              <div className="w-3 h-3 rounded-full bg-[#00ca4e]"></div>
            </div>
          </div>
        </div>
        <div className="w-full p-[80px_20px_120px_20px] box-border">
          <div className="p-10 font-bold text-2xl opacity-80">Join the Beta Program</div>
          <form onSubmit={handleSubmit} className="flex items-center justify-center">
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-gray-300 rounded-full py-4 px-4 mr-2.5 w-3/5 max-w-[300px]"
              required
            />
            <button
              type="submit"
              className={`bg-black text-white font-bold py-4 px-5 rounded-full cursor-pointer transition-all duration-300 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-800'
              }`}
              disabled={isLoading}
            >
              {isLoading ? 'Submitting...' : 'Get Early Access'}
            </button>
          </form>
          {isSubmitted && (
            <div className="mt-4 flex items-center justify-center text-green-500 animate-fade-in-down">
              <CheckCircle className="mr-2" />
              <span>You have been added to the list!</span>
            </div>
          )}
          {error && (
            <div className="mt-4 flex items-center justify-center text-red-500 animate-fade-in-down">
              <AlertCircle className="mr-2" />
              <span>{error}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-center p-10">
          <div className="flex gap-5">
            <img src="https://cdn.jsdelivr.net/npm/simple-icons@v5/icons/twitter.svg" alt="Twitter" className="w-6 h-6" />
            <img src="https://cdn.jsdelivr.net/npm/simple-icons@v5/icons/discord.svg" alt="Discord" className="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;