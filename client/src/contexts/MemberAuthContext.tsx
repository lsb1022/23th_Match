import React, { createContext, useContext, ReactNode } from 'react';
import { trpc } from '@/lib/trpc';

interface Member {
  id: number;
  username: string;
  name: string;
  department?: string | null;
  studentId?: string | null;
}

interface MemberAuthContextType {
  member: Member | null;
  isAuthenticated: boolean;
  login: (member: Member) => void;
  logout: () => Promise<void>;
  loading: boolean;
  refetchMember: () => Promise<unknown>;
}

const MemberAuthContext = createContext<MemberAuthContextType | undefined>(undefined);

export function MemberAuthProvider({ children }: { children: ReactNode }) {
  const utils = trpc.useUtils();
  const { data, isLoading, refetch } = trpc.memberAuth.me.useQuery(undefined, {
    retry: false,
  });

  const logoutMutation = trpc.memberAuth.logout.useMutation({
    onSettled: async () => {
      await utils.memberAuth.me.invalidate();
    },
  });

  const login = (memberData: Member) => {
    utils.memberAuth.me.setData(undefined, { success: true, member: memberData });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  return (
    <MemberAuthContext.Provider value={{
      member: data?.member ?? null,
      isAuthenticated: !!data?.member,
      login,
      logout,
      loading: isLoading || logoutMutation.isPending,
      refetchMember: refetch,
    }}>
      {children}
    </MemberAuthContext.Provider>
  );
}

export function useMemberAuth() {
  const context = useContext(MemberAuthContext);
  if (context === undefined) {
    throw new Error('useMemberAuth must be used within a MemberAuthProvider');
  }
  return context;
}
