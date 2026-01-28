import { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Pill, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import MolecularBackground from './MolecularBackground';
import gsap from 'gsap';

export default function SignUp() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { setCurrentView } = useStore();
  const formRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const inputsRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        formRef.current,
        { x: 50, opacity: 0, scale: 0.95 },
        { x: 0, opacity: 1, scale: 1, duration: 0.8, delay: 0.2, ease: 'power3.out' }
      );
      
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
  
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName || !email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    if (!agreeTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      
      if (error) throw error;
      
      if (data.user) {
        // Create profile
        await supabase.from('profiles').insert({
          id: data.user.id,
          email,
          full_name: fullName,
        });
        
        toast.success('Account created successfully! Please check your email to verify.');
        setCurrentView('login');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };
  
  const passwordStrength = () => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };
  
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  
  return (
    <div className="min-h-screen w-full flex relative overflow-hidden">
      {/* Left side - Molecular Background */}
      <div className="hidden lg:block w-[55%] relative">
        <MolecularBackground />
        
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
        
        <div className="absolute bottom-12 left-8 right-8 z-10">
          <div className="glass-card rounded-2xl p-6 max-w-md">
            <h3 className="text-lg font-semibold text-[#1f1f1f] mb-3">
              Start Your Learning Journey
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: '📚', label: 'Organized Study' },
                { icon: '🧪', label: 'Molecular Tracking' },
                { icon: '🎯', label: 'Flashcards' },
                { icon: '📄', label: 'PDF Export' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-[#626a72]">
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side - Sign Up Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white/50 backdrop-blur-sm overflow-y-auto">
        <div 
          ref={formRef}
          className="w-full max-w-md space-y-6 py-8"
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
              Create Account
            </h2>
            <p className="text-[#626a72]">Join thousands of pharmacy students</p>
          </div>
          
          <form onSubmit={handleSignUp} className="space-y-4">
            <div ref={inputsRef} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-[#33383f]">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#626a72]" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 h-12 border-[#c2cdd8] input-focus-ring rounded-xl"
                  />
                </div>
              </div>
              
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
                    placeholder="Create a strong password"
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
                
                {/* Password strength indicator */}
                {password && (
                  <div className="space-y-1">
                    <div className="flex gap-1 h-1">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`flex-1 rounded-full transition-colors ${
                            i < passwordStrength() ? strengthColors[passwordStrength() - 1] : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs ${
                      passwordStrength() <= 2 ? 'text-red-500' : 
                      passwordStrength() <= 3 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {strengthLabels[passwordStrength() - 1] || 'Enter password'}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-[#33383f]">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#626a72]" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 h-12 border-[#c2cdd8] input-focus-ring rounded-xl"
                  />
                  {confirmPassword && password === confirmPassword && (
                    <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                  )}
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  checked={agreeTerms}
                  onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
                  className="mt-1"
                />
                <Label htmlFor="terms" className="text-sm text-[#626a72] cursor-pointer leading-relaxed">
                  I agree to the{' '}
                  <button type="button" className="text-[#0070a0] hover:underline">Terms of Service</button>
                  {' '}and{' '}
                  <button type="button" className="text-[#0070a0] hover:underline">Privacy Policy</button>
                </Label>
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
                    Create Account
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </div>
          </form>
          
          <p className="text-center text-sm text-[#626a72]">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => setCurrentView('login')}
              className="text-[#0070a0] hover:text-[#004968] font-medium transition-colors"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
