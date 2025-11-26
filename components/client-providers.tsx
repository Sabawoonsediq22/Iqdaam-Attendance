"use client";

import React, { useState, createContext, useContext, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider, useSession } from "next-auth/react";

interface UserData {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  isApproved: boolean;
  createdAt: string;
}

const UserContext = createContext<{
  avatar: string;
  setAvatar: (avatar: string) => void;
  userData: UserData | null;
  setUserData: (userData: UserData | null) => void;
  isLoadingUserData: boolean;
  userDataError: string | null;
} | null>(null);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within UserProvider");
  return context;
};

function UserProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [avatar, setAvatar] = useState<string>("");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);
  const [userDataError, setUserDataError] = useState<string | null>(null);

  // Fetch user data from database when session changes
  React.useEffect(() => {
    const fetchUserData = async () => {
      if (!session?.user?.id) {
        setAvatar("");
        setUserData(null);
        setIsLoadingUserData(false);
        setUserDataError(null);
        return;
      }

      setIsLoadingUserData(true);
      setUserDataError(null);
      try {
        const response = await fetch(`/api/users/${session.user.id}`);
        if (response.ok) {
          const data = await response.json();
          setUserData(data.user);
          setAvatar(data.user.avatar || "");
        } else {
          setUserDataError("Failed to load user data");
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        setUserDataError("Network error while loading user data");
      } finally {
        setIsLoadingUserData(false);
      }
    };

    fetchUserData();
  }, [session?.user?.id]);

  return (
    <UserContext.Provider value={{ avatar, setAvatar, userData, setUserData, isLoadingUserData, userDataError }}>
      {children}
    </UserContext.Provider>
  );
}

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const [baseUrl] = useState<string>(() => typeof window !== 'undefined' ? window.location.origin : '');

  // Create QueryClient on the client to avoid passing class instances from server -> client
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Provide a sensible default queryFn so callers can use simple queryKey strings
            // (e.g. useQuery({ queryKey: ['/api/stats'] })) and it will fetch that URL.
            queryFn: async ({ queryKey }) => {
              const key = Array.isArray(queryKey) ? queryKey[0] : queryKey;
              const url = typeof key === "string" ? key : String(key);
              const res = await fetch(url);
              if (!res.ok) {
                throw new Error(`Request failed with status ${res.status}`);
              }
              return res.json();
            },
            staleTime: 1000 * 60 * 5,
            gcTime: 1000 * 60 * 10,
          },
        },
      })
  );

  return (
    <SessionProvider basePath="/api/auth" baseUrl={baseUrl}>
      <QueryClientProvider client={queryClient}>
        <UserProvider>{children}</UserProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
