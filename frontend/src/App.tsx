import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationsPage } from './pages/NotificationsPage';
import { PriorityPage } from './pages/PriorityPage';
import { Bell, Sparkles, User } from 'lucide-react';

const queryClient = new QueryClient();

// Predefined mock profiles that match the database seed script
const STUDENTS = [
  { id: 1, name: 'John Doe', email: 'john.doe@university.edu' },
  { id: 2, name: 'Jane Smith', email: 'jane.smith@university.edu' },
  { id: 3, name: 'Alice Johnson', email: 'alice.j@university.edu' },
];

function NavigationHeader({
  activeStudent,
  onStudentChange,
}: {
  activeStudent: number;
  onStudentChange: (id: number) => void;
}) {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/notifications" className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/20 border border-primary/30 rounded-lg text-primary">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <span className="font-extrabold text-sm sm:text-base tracking-wider uppercase bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Campus Notifications
            </span>
          </Link>

          <nav className="hidden md:flex gap-1 text-sm font-medium">
            <Link
              to="/notifications"
              className={`px-3 py-2 rounded-lg transition-all duration-300 border ${
                location.pathname === '/notifications'
                  ? 'bg-primary/10 text-primary glow-primary border-primary/20'
                  : 'text-muted-foreground hover:text-foreground border-transparent'
              }`}
            >
              Live Feed
            </Link>
            <Link
              to="/priority"
              className={`px-3 py-2 rounded-lg transition-all duration-300 flex items-center gap-1.5 border ${
                location.pathname === '/priority'
                  ? 'bg-secondary/10 text-secondary glow-secondary border-secondary/20'
                  : 'text-muted-foreground hover:text-foreground border-transparent'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Priority Inbox</span>
            </Link>
          </nav>
        </div>

        {/* Dynamic student switcher widget */}
        <div className="flex items-center gap-3">
          {/* Mobile navigation shortcuts */}
          <div className="flex md:hidden gap-1 text-xs">
            <Link
              to="/notifications"
              className={`px-2.5 py-1.5 rounded-lg font-semibold ${
                location.pathname === '/notifications' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
              }`}
            >
              Feed
            </Link>
            <Link
              to="/priority"
              className={`px-2.5 py-1.5 rounded-lg font-semibold ${
                location.pathname === '/priority' ? 'bg-secondary/10 text-secondary' : 'text-muted-foreground'
              }`}
            >
              Priority
            </Link>
          </div>

          <div className="flex items-center gap-2 bg-card border border-border rounded-full pl-3 pr-2 py-1">
            <User className="w-3.5 h-3.5 text-primary" />
            <select
              value={activeStudent}
              onChange={(e) => onStudentChange(Number(e.target.value))}
              className="bg-transparent border-none text-xs font-semibold text-foreground focus:outline-none cursor-pointer pr-1"
            >
              {STUDENTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.email.split('@')[0]})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function App() {
  const [activeStudentId, setActiveStudentId] = useState(1);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="bg-gradient-to-br from-[#02000c] via-[#05001a] to-[#0c002b] min-h-screen text-slate-100 flex flex-col">
          <NavigationHeader
            activeStudent={activeStudentId}
            onStudentChange={(id) => setActiveStudentId(id)}
          />

          <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route
                path="/notifications"
                element={<NotificationsPage studentId={activeStudentId} />}
              />
              <Route
                path="/priority"
                element={<PriorityPage studentId={activeStudentId} />}
              />
              <Route path="*" element={<Navigate to="/notifications" replace />} />
            </Routes>
          </main>

          <footer className="border-t border-border/20 py-6 text-center text-xs text-muted-foreground/30 font-medium">
            &copy; {new Date().getFullYear()} Placement Portal Notification System. Built with clean architecture.
          </footer>
        </div>
      </Router>
    </QueryClientProvider>
  );
}
