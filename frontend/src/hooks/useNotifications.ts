import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, getPriorityNotifications, markAsRead, deleteNotification, createNotification } from '../services/api';
import { getSocket } from '../services/socket';
import { Notification } from '../types';

/**
 * Custom hook to manage state, queries, and mutations for standard notifications feed and real-time syncing.
 */
export function useNotifications(studentId: number, filters: { type: string; isRead: string; limit: number; offset: number }) {
  const queryClient = useQueryClient();

  // Map string filters to appropriate query variables
  const queryType = filters.type === 'All' ? undefined : filters.type;
  const queryIsRead = filters.isRead === 'All' ? undefined : filters.isRead === 'Read';

  // 1. React Query feed query
  const feedQuery = useQuery({
    queryKey: ['notifications', studentId, queryType, queryIsRead, filters.limit, filters.offset],
    queryFn: () =>
      getNotifications({
        studentId,
        type: queryType,
        isRead: queryIsRead,
        limit: filters.limit,
        offset: filters.offset,
      }),
    placeholderData: (prev) => prev, // Keeps layout stable during re-fetches
  });

  // 2. Real-time Socket sync
  useEffect(() => {
    const socket = getSocket();

    // Join room for student
    socket.emit('join', { studentId });

    // Handle incoming notification
    const handleNewNotification = (notif: Notification) => {
      console.log('[Socket] Received new notification:', notif);
      
      // Invalidate queries so feed and priority update automatically
      queryClient.invalidateQueries({ queryKey: ['notifications', studentId] });
      queryClient.invalidateQueries({ queryKey: ['priorityInbox', studentId] });
    };

    socket.on('notification', handleNewNotification);

    return () => {
      socket.off('notification', handleNewNotification);
    };
  }, [studentId, queryClient]);

  // 3. Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: boolean }) => markAsRead(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', studentId] });
      queryClient.invalidateQueries({ queryKey: ['priorityInbox', studentId] });
    },
  });

  // 4. Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', studentId] });
      queryClient.invalidateQueries({ queryKey: ['priorityInbox', studentId] });
    },
  });

  // 5. Create notification mutation (useful for demo/placement simulator)
  const createMutation = useMutation({
    mutationFn: ({ type, message }: { type: string; message: string }) =>
      createNotification(studentId, type, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', studentId] });
      queryClient.invalidateQueries({ queryKey: ['priorityInbox', studentId] });
    },
  });

  return {
    notifications: feedQuery.data?.data || [],
    meta: feedQuery.data?.meta,
    isLoading: feedQuery.isLoading,
    isError: feedQuery.isError,
    error: feedQuery.error,
    refetch: feedQuery.refetch,
    markAsRead: markReadMutation.mutate,
    deleteNotification: deleteMutation.mutate,
    createNotification: createMutation.mutate,
  };
}

/**
 * Custom hook to manage queries for the Min-Heap based Priority Inbox.
 */
export function usePriorityInbox(studentId: number) {
  const queryClient = useQueryClient();

  const priorityQuery = useQuery({
    queryKey: ['priorityInbox', studentId],
    queryFn: () => getPriorityNotifications(studentId).then((res) => res.data),
  });

  return {
    notifications: priorityQuery.data || [],
    isLoading: priorityQuery.isLoading,
    isError: priorityQuery.isError,
    error: priorityQuery.error,
    refetch: priorityQuery.refetch,
  };
}
