import { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, Pill, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import MolecularBackground from './MolecularBackground';
import gsap from 'gsap';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { setUser, setCurrentView } = useStore();
  const formRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const inputsRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Form card entrance
      gsap.fromTo(
        formRef.current,
        { x: 50, opacity: 0, scale: 0.95 },
        { x: 0, opacity: 1, scale: 1, duration: 0.8, delay: 0.2, ease: 'power3.out' }
      );
      
      // Heading character animation
      if (headingRef.current) {
        const chars = headingRef.current.textContent?.split('') || [];
        headingRef.current.innerHTML = chars
          .map((char) => `<span class="inline-block">${char === ' ' ? '&nbsp;' : char}</span>`)
          .join('');
        
        gsap.fromTo(
          headingRef.current.querySelectorAll('span'),
          { y: '100%', opacity: 0 },
          { 
            y: '0%', 
            opacity: 1, 
            duration: 0.6, 
            delay: 0.1, 
            stagger: 0.03,
            ease: 'back.out(1.7)'
          }
        );
      }
      
      // Inputs staggered fade
      if (inputsRef.current) {
        gsap.fromTo(
          inputsRef.current.children,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, delay: 0.4, ease: 'power2.out' }
        );
      }
    });
    
    return () => ctx.revert();
  }, []);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    
    // Timeout pour éviter le blocage
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      toast.error('Login timeout - please check your connection and try again');
    }, 30000); // 30 secondes
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      clearTimeout(timeoutId);
      
      if (error) throw error;
      
      if (data.user) {
        // Récupération du profil avec timeout
        const profilePromise = supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        const { data: profile, error: profileError } = await profilePromise;
        
        if (profileError) {
          console.error('Profile fetch error:', profileError);
        }
        
        setUser({
          id: data.user.id,
          email: data.user.email!,
          full_name: profile?.full_name || null,
          avatar_url: profile?.avatar_url || null,
          created_at: data.user.created_at,
        });
        
        toast.success('Welcome back!');
        setCurrentView('dashboard');
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('Login error:', error);
      toast.error(error.message || 'Failed to login. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSocialLogin = async (provider: 'google' | 'github') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      });
      
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || `Failed to login with ${provider}`);
    }
  };
  
  return (
    <div className="min-h-screen w-full flex relative overflow-hidden">
      {/* Left side - Molecular Background */}
      <div className="hidden lg:block w-[55%] relative">
        <MolecularBackground />
        
        {/* Branding on left */}
        <div className="absolute top-8 left-8 z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl pharma-gradient flex items-center justify-center shadow-lg">
              <Pill className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1f1f1f]">PharmaStudy</h1>
              <p className="text-sm text-[#626a72]">Master Pharmacology</p>
            </div>
          </div>
        </div>
        
        {/* Feature highlights */}
        <div className="absolute bottom-12 left-8 right-8 z-10">
          <div className="glass-card rounded-2xl p-6 max-w-md">
            <h3 className="text-lg font-semibold text-[#1f1f1f] mb-3">
              Your Personal Pharmacy Lab
            </h3>
            <ul className="space-y-2">
              {[
                'Organize chapters and topics seamlessly',
                'Track molecules, enzymes, and medications',
                'Interactive flashcards for memorization',
                'Export your study materials to PDF'
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-[#626a72]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#0070a0]" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      
      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white/50 backdrop-blur-sm">
        <div 
          ref={formRef}
          className="w-full max-w-md space-y-6"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-8">
            <div className="w-12 h-12 rounded-xl pharma-gradient flex items-center justify-center shadow-lg">
              <Pill className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1f1f1f]">PharmaStudy</h1>
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <h2 
              ref={headingRef}
              className="text-3xl font-bold text-[#1f1f1f] overflow-hidden"
            >
              Welcome Back
            </h2>
            <p className="text-[#626a72]">Continue your journey to mastery</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div ref={inputsRef} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#33383f]">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#626a72]" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 border-[#c2cdd8] input-focus-ring rounded-xl"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#33383f]">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#626a72]" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 border-[#c2cdd8] input-focus-ring rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#626a72] hover:text-[#0070a0] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <Label htmlFor="remember" className="text-sm text-[#626a72] cursor-pointer">
                    Remember me
                  </Label>
                </div>
                <button
                  type="button"
                  className="text-sm text-[#0070a0] hover:text-[#004968] transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 pharma-gradient hover:opacity-90 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-[#0070a0]/25 group"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </div>
          </form>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#c2cdd8]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-[#626a72]">Or continue with</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleSocialLogin('google')}
              className="flex items-center justify-center gap-2 h-11 border border-[#c2cdd8] rounded-xl hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-sm font-medium text-[#33383f]">Google</span>
            </button>
            <button
              type="button"
              onClick={() => handleSocialLogin('github')}
              className="flex items-center justify-center gap-2 h-11 border border-[#c2cdd8] rounded-xl hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span className="text-sm font-medium text-[#33383f]">GitHub</span>
            </button>
          </div>
          
          <p className="text-center text-sm text-[#626a72]">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => setCurrentView('signup')}
              className="text-[#0070a0] hover:text-[#004968] font-medium transition-colors"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
