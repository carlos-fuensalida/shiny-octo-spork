'use client';

import { createContext, useContext, useEffect, useState } from 'react';

import { getCurrentUser } from '@/services';
import { HttpError } from '@/services/http';
import type { User } from '@/types';

interface UserContextValue {
  user: User | null;
  isLoading: boolean;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  isLoading: true,
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch((err) => {
        if (err instanceof HttpError && err.status === 401) {
          window.location.href = '/api/auth/logout';
        } else {
          setUser(null);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <UserContext.Provider value={{ user, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  return useContext(UserContext);
}
