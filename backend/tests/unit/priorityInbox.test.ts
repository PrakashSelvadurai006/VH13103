import { calculatePriorityScore, getTopKNotifications, MinHeap, NotificationItem } from '../../src/utils/priorityInbox';

describe('Priority Inbox - Score Calculation', () => {
  test('should calculate correct scores based on type and read status', () => {
    const pUnread: NotificationItem = { id: '1', studentId: 1, type: 'Placement', message: 'test', isRead: false, createdAt: new Date() };
    const pRead: NotificationItem = { id: '2', studentId: 1, type: 'Placement', message: 'test', isRead: true, createdAt: new Date() };
    const rUnread: NotificationItem = { id: '3', studentId: 1, type: 'Result', message: 'test', isRead: false, createdAt: new Date() };
    const eRead: NotificationItem = { id: '4', studentId: 1, type: 'Event', message: 'test', isRead: true, createdAt: new Date() };

    expect(calculatePriorityScore(pUnread)).toBe(30); // 20 (Placement) + 10 (Unread)
    expect(calculatePriorityScore(pRead)).toBe(20);  // 20 (Placement)
    expect(calculatePriorityScore(rUnread)).toBe(20); // 10 (Result) + 10 (Unread)
    expect(calculatePriorityScore(eRead)).toBe(5);    // 5 (Event)
  });
});

describe('Priority Inbox - MinHeap', () => {
  test('should extract minimum score elements first', () => {
    const heap = new MinHeap();
    const notif = (id: string, score: number): any => ({
      score,
      notification: { id, studentId: 1, type: 'Event', message: 'test', isRead: true, createdAt: new Date() }
    });

    heap.insert(notif('A', 30));
    heap.insert(notif('B', 10));
    heap.insert(notif('C', 20));

    expect(heap.size()).toBe(3);
    expect(heap.peek()?.score).toBe(10);
    expect(heap.extractMin()?.notification.id).toBe('B');
    expect(heap.extractMin()?.notification.id).toBe('C');
    expect(heap.extractMin()?.notification.id).toBe('A');
  });

  test('should break ties using oldest timestamp first for eviction', () => {
    const heap = new MinHeap();
    const date1 = new Date('2026-06-17T10:00:00Z');
    const date2 = new Date('2026-06-17T11:00:00Z'); // newer

    heap.insert({
      score: 20,
      notification: { id: 'old', studentId: 1, type: 'Placement', message: 'old', isRead: true, createdAt: date1 }
    });
    heap.insert({
      score: 20,
      notification: { id: 'new', studentId: 1, type: 'Placement', message: 'new', isRead: true, createdAt: date2 }
    });

    // Old is "smaller" (lower priority), so it comes out first in a Min Heap
    expect(heap.extractMin()?.notification.id).toBe('old');
    expect(heap.extractMin()?.notification.id).toBe('new');
  });
});

describe('Priority Inbox - Top K Fetching', () => {
  test('should return top 10 elements sorted descending by priority score', () => {
    const items: NotificationItem[] = [];
    // Generate 15 items with different types and read statuses
    for (let i = 1; i <= 15; i++) {
      items.push({
        id: `id-${i}`,
        studentId: 1,
        type: i % 3 === 0 ? 'Placement' : i % 3 === 1 ? 'Result' : 'Event',
        isRead: i % 2 === 0,
        message: `msg-${i}`,
        createdAt: new Date(Date.now() + i * 1000)
      });
    }

    const top10 = getTopKNotifications(items, 10);
    expect(top10.length).toBe(10);

    // Verify it is sorted descending
    for (let i = 0; i < top10.length - 1; i++) {
      expect(top10[i].score).toBeGreaterThanOrEqual(top10[i + 1].score);
      if (top10[i].score === top10[i + 1].score) {
        // Newer timestamp should take precedence (listed first in sorted output)
        const timeA = new Date(top10[i].notification.createdAt).getTime();
        const timeB = new Date(top10[i + 1].notification.createdAt).getTime();
        expect(timeA).toBeGreaterThanOrEqual(timeB);
      }
    }
  });
});
