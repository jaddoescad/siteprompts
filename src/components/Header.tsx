'use client'
import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { UserCircle, ChevronDown } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Image from "next/image";

const supabase = createClient();

const Header = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="bg-black text-white p-4">
      <div className="flex justify-between items-center">
        <Image src="/logo.png" alt="SitePrompts Logo" width={162} height={162} />
        <nav>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center space-x-2">
                {user.user_metadata.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="User avatar"
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <UserCircle className="w-8 h-8" />
                )}
                <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  <span className="text-sm text-gray-700">{user.email}</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <button
                    onClick={handleSignOut}
                    className="text-sm text-red-600"
                  >
                    Sign Out
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/auth/login"
              className="bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded"
            >
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;