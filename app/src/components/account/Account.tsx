import { useState, useRef, useEffect } from 'react';
import { 
  Edit2, 
  Camera,
  Save,
  X,
  Loader2,
  Shield,
  Bell,
  Moon,
  Trash2,
  LogOut
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import gsap from 'gsap';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export default function Account() {
  const { user, setUser, setCurrentView, darkMode, toggleDarkMode } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.full_name || '',
    email: user?.email || '',
  });
  
  // Settings
  const [notifications, setNotifications] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (containerRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          '.account-card',
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out' }
        );
      });
      
      return () => ctx.revert();
    }
  }, []);
  
  const handleSave = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      setUser({ ...user, full_name: formData.fullName });
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteAccount = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Delete user data
      await supabase.from('study_items').delete().eq('user_id', user.id);
      await supabase.from('topics').delete().eq('user_id', user.id);
      await supabase.from('chapters').delete().eq('user_id', user.id);
      await supabase.from('profiles').delete().eq('id', user.id);
      
      // Sign out
      await supabase.auth.signOut();
      setUser(null);
      setCurrentView('login');
      toast.success('Account deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete account');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogout = async () => {
    setIsLoading(true);
    
    // Timeout pour éviter le blocage
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      // Forcer la déconnexion côté client même si le serveur ne répond pas
      setUser(null);
      setCurrentView('login');
      toast.success('Logged out');
    }, 10000);
    
    try {
      const { error } = await supabase.auth.signOut();
      clearTimeout(timeoutId);
      
      if (error) {
        console.error('Logout error:', error);
        // On force quand même la déconnexion
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
    } finally {
      setIsLoading(false);
    }
  };
  
  const userStats = {
    chapters: 12,
    topics: 48,
    items: 156,
    joinedDate: new Date(user?.created_at || Date.now()).toLocaleDateString(),
  };
  
  return (
    <div ref={containerRef} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1f1f1f]">My Account</h1>
        <p className="text-[#626a72] mt-1">Manage your profile and preferences</p>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="account-card border-0 shadow-lg shadow-black/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl text-[#1f1f1f]">Profile Information</CardTitle>
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="rounded-xl"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#0070a0] to-[#2c90c9] flex items-center justify-center text-white text-3xl font-bold">
                    {user?.full_name?.[0] || user?.email?.[0] || 'U'}
                  </div>
                  {isEditing && (
                    <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-[#0070a0] hover:bg-gray-50 transition-colors">
                      <Camera className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {/* Info */}
                <div className="flex-1 space-y-4">
                  {isEditing ? (
                    <>
                      <div>
                        <Label>Full Name</Label>
                        <Input
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          className="border-[#c2cdd8] mt-1"
                        />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input
                          value={formData.email}
                          disabled
                          className="border-[#c2cdd8] mt-1 bg-gray-50"
                        />
                        <p className="text-xs text-[#626a72] mt-1">Email cannot be changed</p>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsEditing(false);
                            setFormData({
                              fullName: user?.full_name || '',
                              email: user?.email || '',
                            });
                          }}
                          className="rounded-xl"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSave}
                          disabled={isLoading}
                          className="pharma-gradient text-white rounded-xl"
                        >
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                          Save Changes
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-sm text-[#626a72]">Full Name</p>
                        <p className="text-lg font-medium text-[#1f1f1f]">
                          {user?.full_name || 'Not set'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-[#626a72]">Email</p>
                        <p className="text-lg font-medium text-[#1f1f1f]">{user?.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#626a72]">Member Since</p>
                        <p className="text-lg font-medium text-[#1f1f1f]">{userStats.joinedDate}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Settings */}
          <Card className="account-card border-0 shadow-lg shadow-black/5">
            <CardHeader>
              <CardTitle className="text-xl text-[#1f1f1f]">Preferences</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-[#1f1f1f]">Notifications</p>
                    <p className="text-sm text-[#626a72]">Receive study reminders</p>
                  </div>
                </div>
                <Switch
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
                    <Moon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium text-[#1f1f1f] dark:text-white">Dark Mode</p>
                    <p className="text-sm text-[#626a72] dark:text-gray-400">Toggle dark theme</p>
                  </div>
                </div>
                <Switch
                  checked={darkMode}
                  onCheckedChange={toggleDarkMode}
                />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <Card className="account-card border-0 shadow-lg shadow-black/5">
            <CardHeader>
              <CardTitle className="text-xl text-[#1f1f1f]">Study Stats</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-[#626a72]">Chapters</span>
                  <span className="font-bold text-[#1f1f1f]">{userStats.chapters}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-[#626a72]">Topics</span>
                  <span className="font-bold text-[#1f1f1f]">{userStats.topics}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-[#626a72]">Study Items</span>
                  <span className="font-bold text-[#1f1f1f]">{userStats.items}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Account Actions */}
          <Card className="account-card border-0 shadow-lg shadow-black/5">
            <CardHeader>
              <CardTitle className="text-xl text-[#1f1f1f]">Account Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-3">
              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full justify-start rounded-xl"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Log Out
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="w-full justify-start rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Delete Account Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your account? This will permanently delete all your data including chapters, topics, and study items. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteAccount}
              disabled={isLoading}
              variant="destructive"
              className="flex-1"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete Account'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
