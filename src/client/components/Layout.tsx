import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button, Separator, Badge } from '../../components/ui';
import { Home, Settings, FileSpreadsheet, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="w-64 bg-card p-4 flex flex-col justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary mb-8">TaxNewsRadar</h1>
          <nav className="space-y-2">
            <Link to="/" className="flex items-center gap-2 p-2 rounded-md hover:bg-accent">
              <Home className="h-5 w-5" />
              <span>Дашборд</span>
            </Link>
            <Link to="/reports" className="flex items-center gap-2 p-2 rounded-md hover:bg-accent">
              <FileSpreadsheet className="h-5 w-5" />
              <span>Отчеты</span>
            </Link>
            <Link to="/calendar" className="flex items-center gap-2 p-2 rounded-md hover:bg-accent">
              <Calendar className="h-5 w-5" />
              <span>Календарь</span>
            </Link>
            <Link to="/settings" className="flex items-center gap-2 p-2 rounded-md hover:bg-accent">
              <Settings className="h-5 w-5" />
              <span>Настройки</span>
            </Link>
          </nav>
        </div>
      </aside>
      <main className="flex-1 p-8">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}

export default Layout; 