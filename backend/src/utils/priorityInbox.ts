import { NotificationType } from '@prisma/client';

export interface NotificationItem {
  id: string;
  studentId: number;
  type: NotificationType | 'Event' | 'Result' | 'Placement';
  message: string;
  isRead: boolean;
  createdAt: Date | string;
}

export interface HeapElement {
  score: number;
  notification: NotificationItem;
}

export class MinHeap {
  private heap: HeapElement[] = [];

  constructor() {}

  public size(): number {
    return this.heap.length;
  }

  public peek(): HeapElement | null {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  public insert(element: HeapElement): void {
    this.heap.push(element);
    this.bubbleUp(this.heap.length - 1);
  }

  public extractMin(): HeapElement | null {
    if (this.heap.length === 0) return null;
    const min = this.heap[0];
    const end = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = end;
      this.bubbleDown(0);
    }
    return min;
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.compare(index, parentIndex) < 0) {
        this.swap(index, parentIndex);
        index = parentIndex;
      } else {
        break;
      }
    }
  }

  private bubbleDown(index: number): void {
    const length = this.heap.length;
    while (true) {
      let smallestIndex = index;
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;

      if (leftChild < length && this.compare(leftChild, smallestIndex) < 0) {
        smallestIndex = leftChild;
      }
      if (rightChild < length && this.compare(rightChild, smallestIndex) < 0) {
        smallestIndex = rightChild;
      }

      if (smallestIndex !== index) {
        this.swap(index, smallestIndex);
        index = smallestIndex;
      } else {
        break;
      }
    }
  }

  /**
   * Compares two heap elements.
   * Returns negative if element A has LOWER priority than element B (meaning it should be popped sooner, closer to root).
   * Positive if element A has HIGHER priority than element B.
   * Zero if equal.
   * 
   * Since this is a MIN heap representing the top K elements, the root of the heap
   * must always be the element with the minimum priority among the top K.
   * 
   * Priority comparison:
   * 1. Lower score is lower priority.
   * 2. If scores are equal, older createdAt is lower priority.
   */
  private compare(idxA: number, idxB: number): number {
    const elA = this.heap[idxA];
    const elB = this.heap[idxB];

    if (elA.score !== elB.score) {
      return elA.score - elB.score;
    }

    // Tie-breaker: older notification has lower priority (smaller timestamp)
    const timeA = new Date(elA.notification.createdAt).getTime();
    const timeB = new Date(elB.notification.createdAt).getTime();
    return timeA - timeB;
  }

  private swap(idxA: number, idxB: number): void {
    const temp = this.heap[idxA];
    this.heap[idxA] = this.heap[idxB];
    this.heap[idxB] = temp;
  }
}

/**
 * Calculates priority score for a notification:
 * Placement = 20 points
 * Result = 10 points
 * Event = 5 points
 * Unread notifications get +10 points.
 */
export function calculatePriorityScore(notification: NotificationItem): number {
  let score = 0;
  if (notification.type === 'Placement') {
    score += 20;
  } else if (notification.type === 'Result') {
    score += 10;
  } else if (notification.type === 'Event') {
    score += 5;
  }

  if (!notification.isRead) {
    score += 10; // Extra weight for unread
  }

  return score;
}

/**
 * Returns top K notifications from a list of notifications.
 * Time Complexity: O(N log K)
 * Space Complexity: O(K)
 */
export function getTopKNotifications(notifications: NotificationItem[], k = 10): HeapElement[] {
  const minHeap = new MinHeap();

  for (const notif of notifications) {
    const score = calculatePriorityScore(notif);
    const element: HeapElement = { score, notification: notif };

    if (minHeap.size() < k) {
      minHeap.insert(element);
    } else {
      const root = minHeap.peek();
      if (root) {
        // Compare new element with the root (which is the current minimum of the top K)
        // If the new element has higher priority (greater score, or same score but newer),
        // we replace the root with the new element.
        let isHigherPriority = false;
        if (score > root.score) {
          isHigherPriority = true;
        } else if (score === root.score) {
          const newTime = new Date(notif.createdAt).getTime();
          const rootTime = new Date(root.notification.createdAt).getTime();
          if (newTime > rootTime) {
            isHigherPriority = true;
          }
        }

        if (isHigherPriority) {
          minHeap.extractMin();
          minHeap.insert(element);
        }
      }
    }
  }

  // Extract elements and sort them descending (highest priority first)
  const result: HeapElement[] = [];
  while (minHeap.size() > 0) {
    result.push(minHeap.extractMin()!);
  }

  // Since extractMin gives smallest elements first, reverse it to get descending order
  return result.reverse();
}
