import { 
  BookOpen, 
  Layers, 
  CreditCard, 
  HelpCircle, 
  User, 
  LogOut,
  Menu,
  X,
  type LucideIcon
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  view: 'dashboard' | 'chapters' | 'flashcards' | 'quiz' | 'account';
}

const navItems: NavItem[] = [
  { id: 'chapters', label: 'Chapters', icon: BookOpen, view: 'chapters' },
  { id: 'flashcards', label: 'Flashcards', icon: CreditCard, view: 'flashcards' },
  { id: 'quiz', label: 'Quiz', icon: HelpCircle, view: 'quiz' },
  { id: 'account', label: 'My Account', icon: User, view: 'account' },
];

export default function Toolbar() {
  const { currentView, setCurrentView, user, setUser } = useStore();
  const [activeIndicator, setActiveIndicator] = useState({ left: 0, width: 0 });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const toolbarRef = useRef<HTMLElement>(null);
  
  useEffect(() => {
    const activeIndex = navItems.findIndex(item => item.view === currentView);
    if (activeIndex >= 0 && itemRefs.current[activeIndex]) {
      const item = itemRefs.current[activeIndex];
      const rect = item.getBoundingClientRect();
      const parentRect = item.parentElement?.getBoundingClientRect();
      if (parentRect) {
        setActiveIndicator({
          left: rect.left - parentRect.left,
          width: rect.width,
        });
      }
    }
  }, [currentView]);
  
  useEffect(() => {
    if (toolbarRef.current) {
      gsap.fromTo(
        toolbarRef.current,
        { y: -100, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'back.out(1.7)' }
      );
    }
  }, []);
  
  const handleLogout = async () => {
    // Timeout pour éviter le blocage
    const timeoutId = setTimeout(() => {
      // Forcer la déconnexion côté client
      setUser(null);
      setCurrentView('login');
      toast.success('Logged out');
    }, 10000);
    
    try {
      const { error } = await supabase.auth.signOut();
      clearTimeout(timeoutId);
      
      if (error) {
        console.error('Logout error:', error);
      }
      
      setUser(null);
      setCurrentView('login');
      toast.success('Logged out successfully');
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('Logout error:', error);
      // Forcer la déconnexion même en cas d'erreur
      setUser(null);
      setCurrentView('login');
      toast.success('Logged out');
    }
  };
  
  const handleNavClick = (view: NavItem['view'], index: number) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
    
    // Animate the click
    if (itemRefs.current[index]) {
      gsap.to(itemRefs.current[index], {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: 'power2.inOut',
      });
    }
  };
  
  return (
    <>
      {/* Desktop Toolbar */}
      <nav 
        ref={toolbarRef}
        className="hidden lg:flex fixed top-6 left-1/2 -translate-x-1/2 z-50"
      >
        <div className="glass-card rounded-2xl px-2 py-2 flex items-center gap-1 shadow-xl shadow-black/5">
          {/* Logo */}
          <div className="flex items-center gap-2 px-4 border-r border-[#c2cdd8]/50">
            <div className="w-8 h-8 rounded-lg pharma-gradient flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-[#1f1f1f]">PharmaStudy</span>
          </div>
          
          {/* Navigation Items */}
          <div ref={navRef} className="relative flex items-center gap-1 px-2">
            {/* Active indicator */}
            <div 
              className="absolute h-9 bg-[#0070a0]/10 rounded-xl transition-all duration-300 ease-out"
              style={{
                left: activeIndicator.left,
                width: activeIndicator.width,
              }}
            />
            
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = currentView === item.view;
              
              return (
                <button
                  key={item.id}
                  ref={(el) => { itemRefs.current[index] = el; }}
                  onClick={() => handleNavClick(item.view, index)}
                  className={`relative z-10 flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                    isActive 
                      ? 'text-[#0070a0]' 
                      : 'text-[#626a72] hover:text-[#33383f]'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
          
          {/* User & Logout */}
          <div className="flex items-center gap-2 px-2 border-l border-[#c2cdd8]/50">
            <div className="flex items-center gap-2 px-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0070a0] to-[#2c90c9] flex items-center justify-center text-white text-sm font-medium">
                {user?.full_name?.[0] || user?.email?.[0] || 'U'}
              </div>
              <span className="text-sm text-[#33383f] max-w-[100px] truncate">
                {user?.full_name || user?.email?.split('@')[0]}
              </span>
            </div>
            
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-[#626a72] hover:text-[#f54d4d] hover:bg-red-50 transition-all duration-300"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>
      
      {/* Mobile Header */}
      <nav className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-[#c2cdd8]/50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg pharma-gradient flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-[#1f1f1f]">PharmaStudy</span>
          </div>
          
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl text-[#626a72] hover:bg-gray-100 transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="border-t border-[#c2cdd8]/50 bg-white animate-slide-up">
            <div className="p-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.view;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.view, navItems.indexOf(item))}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                      isActive 
                        ? 'bg-[#0070a0]/10 text-[#0070a0]' 
                        : 'text-[#626a72] hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
              
              <div className="border-t border-[#c2cdd8]/50 pt-2 mt-2">
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0070a0] to-[#2c90c9] flex items-center justify-center text-white font-medium">
                    {user?.full_name?.[0] || user?.email?.[0] || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#1f1f1f] truncate">
                      {user?.full_name || 'User'}
                    </p>
                    <p className="text-sm text-[#626a72] truncate">{user?.email}</p>
                  </div>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#f54d4d] hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
      
      {/* Spacer for desktop */}
      <div className="hidden lg:block h-24" />
      
      {/* Spacer for mobile */}
      <div className="lg:hidden h-14" />
    </>
  );
}
