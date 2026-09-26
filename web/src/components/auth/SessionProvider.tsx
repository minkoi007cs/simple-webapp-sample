import { createContext, useContext, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import {
  authApi,
  type GroupRole,
  type SessionMembership,
  type SessionResponse,
  type SessionUser,
  type SystemRole,
} from '../../api/auth';

type ModuleKey =
  | 'DASHBOARD'
  | 'CATEGORY'
  | 'SAMPLE'
  | 'USER'
  | 'GROUP'
  | 'ADMIN';

type PermissionAction = 'view' | 'create' | 'update' | 'delete';

type PermissionMatrix = Record<string, Partial<Record<ModuleKey, PermissionAction[]>>>;

const ROLE_PERMISSIONS: PermissionMatrix = {
  APP_ADMIN: {
    ADMIN: ['view', 'create', 'update', 'delete'],
    GROUP: ['view', 'create', 'update', 'delete'],
    USER: ['view', 'create', 'update', 'delete'],
    DASHBOARD: ['view'],
    CATEGORY: ['view', 'create', 'update', 'delete'],
    SAMPLE: ['view', 'create', 'update', 'delete'],
  },
  GROUP_ADMIN: {
    GROUP: ['view', 'update'],
    USER: ['view', 'create', 'update', 'delete'],
    DASHBOARD: ['view'],
    CATEGORY: ['view', 'create', 'update', 'delete'],
    SAMPLE: ['view', 'create', 'update', 'delete'],
  },
  MEMBER: {
    GROUP: ['view'],
    USER: ['view'],
    DASHBOARD: ['view'],
    CATEGORY: ['view'],
    SAMPLE: ['view', 'create', 'update', 'delete'],
  },
};

type SessionContextValue = {
  session: SessionResponse | null;
  user: SessionUser | null;
  memberships: SessionMembership[];
  activeGroupId: string | null;
  activeGroupName: string | null;
  role: GroupRole;
  systemRole: SystemRole | null;
  isLoading: boolean;
  canAccess: (moduleKey: ModuleKey, action?: PermissionAction) => boolean;
  switchGroup: (groupId: string) => Promise<void>;
  isSwitchingGroup: boolean;
  createGroup: (name?: string) => Promise<void>;
  isCreatingGroup: boolean;
  refreshSession: () => Promise<SessionResponse | undefined>;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

const getStoredToken = () => localStorage.getItem('token');

const storeSession = (session: SessionResponse) => {
  localStorage.setItem('token', session.access_token);
  return session;
};

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();
  const token = getStoredToken();

  const sessionQuery = useQuery({
    queryKey: ['session'],
    enabled: Boolean(token),
    queryFn: async () => {
      const { data } = await authApi.me();
      return storeSession(data);
    },
  });

  const switchGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const { data } = await authApi.switchGroup(groupId);
      return storeSession(data);
    },
    onSuccess: (session) => {
      queryClient.setQueryData(['session'], session);
      queryClient.invalidateQueries({
        predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] !== 'session',
      });
      const activeName =
        session.user.memberships.find(
          (item) => item.groupId === session.user.groupId,
        )?.groupName || '';
      message.success(`Đã chuyển sang nhóm ${activeName}`.trim());
    },
    onError: () => {
      message.error('Không thể chuyển nhóm làm việc');
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: async (name?: string) => {
      const { data } = await authApi.createGroup(name);
      return storeSession(data);
    },
    onSuccess: (session) => {
      queryClient.setQueryData(['session'], session);
      queryClient.invalidateQueries({
        predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] !== 'session',
      });
      message.success(`Tạo nhóm mới thành công!`);
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Không thể tạo nhóm làm việc');
    },
  });

  const session = sessionQuery.data ?? null;
  const user = session?.user ?? null;
  const memberships = user?.memberships ?? [];

  const activeGroupId = user?.groupId || null;
  const activeGroupName =
    memberships.find((m) => m.groupId === activeGroupId)?.groupName ?? null;

  const role = user?.role ?? null;
  const systemRole = user?.systemRole ?? null;

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      user,
      memberships,
      activeGroupId,
      activeGroupName,
      role,
      systemRole,
      isLoading: sessionQuery.isLoading,
      canAccess: (moduleKey, action = 'view') => {
        if (systemRole === 'APP_ADMIN') {
          return true;
        }

        if (moduleKey === 'ADMIN') {
          return false;
        }

        if (!role) {
          return false;
        }

        return ROLE_PERMISSIONS[role]?.[moduleKey]?.includes(action) ?? false;
      },
      switchGroup: async (groupId: string) => {
        if (groupId === activeGroupId) {
          return;
        }
        await switchGroupMutation.mutateAsync(groupId);
      },
      isSwitchingGroup: switchGroupMutation.isPending,
      createGroup: async (name?: string) => {
        await createGroupMutation.mutateAsync(name);
      },
      isCreatingGroup: createGroupMutation.isPending,
      refreshSession: async () => {
        const next = await sessionQuery.refetch();
        return next.data;
      },
    }),
    [
      session,
      user,
      memberships,
      activeGroupId,
      activeGroupName,
      role,
      systemRole,
      sessionQuery,
      switchGroupMutation,
      createGroupMutation,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
};
