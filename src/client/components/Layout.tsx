import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button, Separator, Badge } from '../../components/ui';
import { Home, Settings, FileSpreadsheet } from 'lucide-react';
import { motion } from 'framer-motion';

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <div className="hidden md:flex w-64 flex-col border-r bg-card">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-foreground">TaxNewsRadar</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Налоговый мониторинг
            </p>
          </div>
          <nav className="flex-1 px-4 space-y-1">
            <Link to="/">
              <Button
                variant={location.pathname === "/" ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                <Home className="mr-2 h-4 w-4" />
                Дашборд
              </Button>
            </Link>
            <Link to="/settings">
              <Button
                variant={location.pathname === "/settings" ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                <Settings className="mr-2 h-4 w-4" />
                Настройки
              </Button>
            </Link>
            <Link to="/reports">
              <Button
                variant={location.pathname === "/reports" ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Отчеты
              </Button>
            </Link>
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile header */}
          <header className="md:hidden border-b p-4 bg-card">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold">TaxNewsRadar</h1>
              <div className="flex space-x-2">
                <Link to="/">
                  <Button variant="ghost" size="icon">
                    <Home className="h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/settings">
                  <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/reports">
                  <Button variant="ghost" size="icon">
                    <FileSpreadsheet className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-auto p-6">
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
      </div>
    </div>
  );
}

export default Layout; 