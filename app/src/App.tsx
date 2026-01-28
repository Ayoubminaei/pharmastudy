import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import Login from '@/components/auth/Login';
import SignUp from '@/components/auth/SignUp';
import Toolbar from '@/components/shared/Toolbar';
import Dashboard from '@/components/dashboard/Dashboard';
import Chapters from '@/components/chapters/Chapters';
import Topics from '@/components/topics/Topics';
import Items from '@/components/items/Items';
import Flashcards from '@/components/flashcards/Flashcards';
import Quiz from '@/components/quiz/Quiz';
import Account from '@/components/account/Account';
import './App.css';

function App() {
  const { 
    setUser, 
    currentView, 
    setCurrentView, 
    setIsAuthenticated 
  } = useStore();
  const [isInitializing, setIsInitializing] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session?.user) {
          // Fetch user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          setUser({
            id: session.user.id,
            email: session.user.email!,
            full_name: profile?.full_name || null,
            avatar_url: profile?.avatar_url || null,
            created_at: session.user.created_at,
          });
          setIsAuthenticated(true);
          setCurrentView('dashboard');
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setIsInitializing(false);
      }
    };
    
    checkSession();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          setUser({
            id: session.user.id,
            email: session.user.email!,
            full_name: profile?.full_name || null,
            avatar_url: profile?.avatar_url || null,
            created_at: session.user.created_at,
          });
          setIsAuthenticated(true);
          setCurrentView('dashboard');
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsAuthenticated(false);
          setCurrentView('login');
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setIsAuthenticated, setCurrentView]);

  // Handle view routing
  const renderView = () => {
    switch (currentView) {
      case 'login':
        return <Login />;
      case 'signup':
        return <SignUp />;
      case 'dashboard':
        return <Dashboard />;
      case 'chapters':
        return <Chapters />;
      case 'topics':
        return <Topics />;
      case 'items':
        return <Items />;
      case 'flashcards':
        return <Flashcards />;
      case 'quiz':
        return <Quiz />;
      case 'account':
        return <Account />;
      default:
        return <Dashboard />;
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f7f9fa] to-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#0070a0] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#626a72]">Loading...</p>
        </div>
      </div>
    );
  }

  const isAuthView = currentView === 'login' || currentView === 'signup';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f9fa] to-white molecular-bg">
      <Toaster 
        position="top-right" 
        richColors 
        closeButton
        toastOptions={{
          style: {
            fontFamily: 'Inter, sans-serif',
          },
        }}
      />
      
      {!isAuthView && <Toolbar />}
      
      <main className={`${!isAuthView ? 'pb-8' : ''}`}>
        {renderView()}
      </main>
    </div>
  );
}

export default App;
