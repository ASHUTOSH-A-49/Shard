import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Sun, 
  Moon, 
  Bell, 
  Github, 
  Settings,
  Menu,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useThemeStore } from '@/store/themeStore';
import { useAuth } from '@/hooks/useAuth';
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavbarProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export function Navbar({ onMenuClick, showMenuButton }: NavbarProps) {
  const { theme, toggleTheme } = useThemeStore();
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // 1️⃣ Dynamic Breadcrumb Logic
  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case '/dashboard': return 'Dashboard';
      case '/upload': return 'Upload Invoice';
      case '/activity': return 'Activity Feed';
      case '/review-queue': return 'Review Queue';
      case '/analytics': return 'Analytics';
      case '/settings': return 'Settings';
      case '/history': return 'History';
      default: return pathname.includes('/inv/') ? 'Invoice Details' : 'Dashboard';
    }
  };

  const pageTitle = getPageTitle(location.pathname);

  // 2️⃣ FIX: Async Logout & Clear Storage
  const handleLogout = async () => {
    try {
      // Clear manual storage items we set in other components
      localStorage.removeItem('username');
      localStorage.removeItem('token');
      
      // Perform the actual logout logic
      await logout();
      
      // Redirect immediately
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
      // Force redirect even if logout errors
      navigate('/auth');
    }
  };

  return (
    <header className="h-16 bg-card/80 backdrop-blur-xl border-b border-border sticky top-0 z-30 transition-colors">
      <div className="h-full px-4 flex items-center justify-between">
        
        {/* LEFT SIDE: Menu & Breadcrumbs */}
        <div className="flex items-center gap-4">
          {showMenuButton && (
            <Button variant="ghost" size="icon" onClick={onMenuClick} className="md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          )}
          
          <nav className="hidden md:flex items-center gap-2 text-sm">
            <span className="text-muted-foreground font-semibold">InvoiceAI</span>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-foreground font-medium animate-in fade-in slide-in-from-left-2">
              {pageTitle}
            </span>
          </nav>
        </div>

        {/* RIGHT SIDE: Actions & Profile */}
        <div className="flex items-center gap-1 sm:gap-2">
          
          {/* GitHub Link (Hidden on mobile) */}
          <Button variant="ghost" size="icon" className="hidden sm:flex text-muted-foreground" asChild>
            <a href="https://github.com/ASHUTOSH-A-49/Shard" target="_blank" rel="noopener noreferrer">
              <Github className="w-4 h-4 sm:w-5 sm:h-5" />
            </a>
          </Button>

          {/* Notifications */}
          {/* <Button variant="ghost" size="icon" className="relative text-muted-foreground">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-card" />
          </Button> */}

          {/* Theme Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-muted-foreground"
              >
                <motion.div
                  initial={false}
                  animate={{ rotate: theme === 'dark' ? 180 : 0, scale: theme === 'dark' ? 1 : 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10 }}
                >
                  {theme === 'light' ? (
                    <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </motion.div>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle theme</p>
            </TooltipContent>
          </Tooltip>

          <div className="w-px h-6 bg-border mx-1 hidden sm:block" />

          {/* User Profile / Logout */}
          <div className="flex items-center gap-2 pl-1">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-sm font-semibold leading-none">
                {user?.name || localStorage.getItem('username') || 'User'}
              </span>
              <span className="text-[10px] text-muted-foreground">Admin</span>
            </div>
            
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs sm:text-sm">
              {user?.name?.charAt(0).toUpperCase() || <UserIcon className="w-4 h-4"/>}
            </div>

            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>

        </div>
      </div>
    </header>
  );
}