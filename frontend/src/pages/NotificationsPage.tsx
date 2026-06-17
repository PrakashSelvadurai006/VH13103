import React, { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationCard } from '../components/NotificationCard';
import { Filters } from '../components/Filters';
import { SearchBar } from '../components/SearchBar';
import { Pagination } from '../components/Pagination';
import { sendBulkNotifications } from '../services/api';
import { Bell, ShieldAlert, CheckSquare, PlusCircle, Users, RefreshCw } from 'lucide-react';

interface NotificationsPageProps {
  studentId: number;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ studentId }) => {
  // Feed Filters
  const [selectedType, setSelectedType] = useState('All');
  const [selectedRead, setSelectedRead] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const limit = 6;

  // Bulk Notification Form State
  const [bulkType, setBulkType] = useState('Placement');
  const [bulkMessage, setBulkMessage] = useState('');
  const [isBulkSending, setIsBulkSending] = useState(false);
  const [bulkResult, setBulkResult] = useState<string | null>(null);

  // Single Notification Form State
  const [singleType, setSingleType] = useState('Event');
  const [singleMessage, setSingleMessage] = useState('');
  const [isSingleSending, setIsSingleSending] = useState(false);

  const {
    notifications,
    meta,
    isLoading,
    isError,
    error,
    markAsRead,
    deleteNotification,
    createNotification,
    refetch,
  } = useNotifications(studentId, {
    type: selectedType,
    isRead: selectedRead,
    limit,
    offset,
  });

  // Client-side text search over fetched notifications for instant responsiveness
  const filteredNotifications = notifications.filter((notif) =>
    notif.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle Mark All as Read (by looping through unread items in current page)
  const handleMarkAllRead = () => {
    notifications.forEach((notif) => {
      if (!notif.isRead) {
        markAsRead({ id: notif.id, status: true });
      }
    });
  };

  // Trigger Bulk Dispatch (simulates 50,000 students enqueued in BullMQ)
  const handleTriggerBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkMessage.trim()) return;

    setIsBulkSending(true);
    setBulkResult(null);
    try {
      const response = await sendBulkNotifications(bulkType, bulkMessage);
      setBulkResult(`Job enqueued! targeted: ${response.data.totalStudentsCount} students across ${response.data.jobsEnqueued} BullMQ worker tasks.`);
      setBulkMessage('');
    } catch (err: any) {
      setBulkResult(`Error triggering bulk: ${err.message}`);
    } finally {
      setIsBulkSending(false);
    }
  };

  // Trigger Single Placement Alert (adds a notification to active student)
  const handleTriggerSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleMessage.trim()) return;

    setIsSingleSending(true);
    try {
      createNotification({ type: singleType, message: singleMessage });
      setSingleMessage('');
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSingleSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Notification feed section */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold tracking-tight text-foreground">Live Feed</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => refetch()}
              className="p-2 bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground transition-all duration-300"
              title="Refresh Feed"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleMarkAllRead}
              className="px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 transition-all duration-200 flex items-center gap-1.5"
            >
              <CheckSquare className="w-4 h-4" />
              <span>Mark Page Read</span>
            </button>
          </div>
        </div>

        <SearchBar value={searchQuery} onChange={(val) => { setSearchQuery(val); setOffset(0); }} />
        
        <Filters
          selectedType={selectedType}
          onTypeChange={(type) => { setSelectedType(type); setOffset(0); }}
          selectedRead={selectedRead}
          onReadChange={(read) => { setSelectedRead(read); setOffset(0); }}
        />

        {/* Loading and Error handlers */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-24 rounded-xl border border-border bg-card/40 animate-pulse" />
            ))}
          </div>
        )}

        {isError && (
          <div className="p-6 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 flex-shrink-0" />
            <div className="text-sm">
              <span className="font-bold">Failed to load feed:</span> {error instanceof Error ? error.message : 'Unknown error'}
            </div>
          </div>
        )}

        {/* List of items */}
        {!isLoading && !isError && (
          <div className="space-y-4">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-xl bg-card/20 text-muted-foreground text-sm">
                No notifications found. Select options to filter, or trigger a mock alert from the sidebar console.
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <NotificationCard
                  key={notif.id}
                  notification={notif}
                  onMarkRead={(id, status) => markAsRead({ id, status })}
                  onDelete={(id) => deleteNotification(id)}
                />
              ))
            )}
          </div>
        )}

        <Pagination meta={meta} onOffsetChange={(val) => setOffset(val)} />
      </div>

      {/* Admin Simulator panel */}
      <div className="space-y-6">
        {/* Single Mock Notification Panel */}
        <div className="p-6 rounded-xl border border-border bg-card/30 glass glow-primary space-y-4">
          <div className="flex items-center gap-2 border-b border-border/40 pb-3">
            <PlusCircle className="w-4.5 h-4.5 text-primary" />
            <h3 className="font-bold text-sm text-foreground">Create Mock Alert</h3>
          </div>
          <form onSubmit={handleTriggerSingle} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Type</label>
              <select
                value={singleType}
                onChange={(e) => setSingleType(e.target.value)}
                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none"
              >
                <option value="Placement">Placement (20 pts)</option>
                <option value="Result">Result (10 pts)</option>
                <option value="Event">Event (5 pts)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Message</label>
              <textarea
                value={singleMessage}
                onChange={(e) => setSingleMessage(e.target.value)}
                rows={3}
                placeholder="Alert text body..."
                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none resize-none placeholder:text-muted-foreground/30"
              />
            </div>
            <button
              type="submit"
              disabled={isSingleSending || !singleMessage.trim()}
              className="w-full py-2 px-4 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/95 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none glow-primary"
            >
              {isSingleSending ? 'Dispatching...' : 'Dispatch Alert'}
            </button>
          </form>
        </div>

        {/* Bulk Notification Panel */}
        <div className="p-6 rounded-xl border border-border bg-card/30 glass glow-secondary space-y-4">
          <div className="flex items-center gap-2 border-b border-border/40 pb-3">
            <Users className="w-4.5 h-4.5 text-secondary" />
            <h3 className="font-bold text-sm text-foreground">Bulk Send Console (50k Users)</h3>
          </div>
          <form onSubmit={handleTriggerBulk} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Type</label>
              <select
                value={bulkType}
                onChange={(e) => setBulkType(e.target.value)}
                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none"
              >
                <option value="Placement">Placement (20 pts)</option>
                <option value="Result">Result (10 pts)</option>
                <option value="Event">Event (5 pts)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Message</label>
              <textarea
                value={bulkMessage}
                onChange={(e) => setBulkMessage(e.target.value)}
                rows={3}
                placeholder="Message targeting all students..."
                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none resize-none placeholder:text-muted-foreground/30"
              />
            </div>
            <button
              type="submit"
              disabled={isBulkSending || !bulkMessage.trim()}
              className="w-full py-2 px-4 bg-secondary text-white rounded-lg text-xs font-semibold hover:bg-secondary/95 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none glow-secondary"
            >
              {isBulkSending ? 'Enqueuing Batch...' : 'Enqueue Bulk Blast'}
            </button>
          </form>

          {bulkResult && (
            <div className="p-3 rounded-lg border border-border bg-card/60 text-[10px] text-muted-foreground leading-normal mt-2">
              {bulkResult}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
