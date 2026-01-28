import { useEffect, useRef, useState } from 'react';
import { 
  BookOpen, 
  FlaskConical, 
  Pill, 
  Activity,
  TrendingUp,
  Clock,
  Target,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import gsap from 'gsap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Stats {
  chapters: number;
  topics: number;
  molecules: number;
  enzymes: number;
  medications: number;
  totalItems: number;
}

interface RecentActivity {
  id: string;
  type: 'chapter' | 'topic' | 'item';
  name: string;
  action: string;
  timestamp: string;
}

export default function Dashboard() {
  const { user, setCurrentView, setSelectedChapter, chapters, setChapters } = useStore();
  const [stats, setStats] = useState<Stats>({
    chapters: 0,
    topics: 0,
    molecules: 0,
    enzymes: 0,
    medications: 0,
    totalItems: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    fetchDashboardData();
  }, [user]);
  
  useEffect(() => {
    if (!isLoading && containerRef.current) {
      const ctx = gsap.context(() => {
        // Header animation
        gsap.fromTo(
          '.dashboard-header',
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
        );
        
        // Stats animation
        if (statsRef.current) {
          gsap.fromTo(
            statsRef.current.children,
            { y: 40, opacity: 0, scale: 0.9 },
            { y: 0, opacity: 1, scale: 1, duration: 0.5, stagger: 0.1, delay: 0.2, ease: 'back.out(1.7)' }
          );
        }
        
        // Cards animation
        if (cardsRef.current) {
          gsap.fromTo(
            cardsRef.current.children,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, delay: 0.4, ease: 'power2.out' }
          );
        }
      });
      
      return () => ctx.revert();
    }
  }, [isLoading]);
  
  const fetchDashboardData = async () => {
    if (!user) return;
    
    try {
      // Fetch chapters
      const { data: chaptersData } = await supabase
        .from('chapters')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (chaptersData) {
        setChapters(chaptersData);
      }
      
      // Fetch topics count
      const { count: topicsCount } = await supabase
        .from('topics')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id);
      
      // Fetch items by type
      const { data: itemsData } = await supabase
        .from('study_items')
        .select('type')
        .eq('user_id', user.id);
      
      const molecules = itemsData?.filter(i => i.type === 'molecule').length || 0;
      const enzymes = itemsData?.filter(i => i.type === 'enzyme').length || 0;
      const medications = itemsData?.filter(i => i.type === 'medication').length || 0;
      
      setStats({
        chapters: chaptersData?.length || 0,
        topics: topicsCount || 0,
        molecules,
        enzymes,
        medications,
        totalItems: itemsData?.length || 0,
      });
      
      // Generate recent activity
      const activity: RecentActivity[] = [];
      chaptersData?.slice(0, 3).forEach((chapter, i) => {
        activity.push({
          id: chapter.id,
          type: 'chapter',
          name: chapter.title,
          action: 'Created',
          timestamp: new Date(Date.now() - i * 86400000).toISOString(),
        });
      });
      setRecentActivity(activity);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const statCards = [
    { 
      label: 'Chapters', 
      value: stats.chapters, 
      icon: BookOpen, 
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    { 
      label: 'Topics', 
      value: stats.topics, 
      icon: Target, 
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    { 
      label: 'Molecules', 
      value: stats.molecules, 
      icon: FlaskConical, 
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600'
    },
    { 
      label: 'Medications', 
      value: stats.medications, 
      icon: Pill, 
      color: 'from-rose-500 to-rose-600',
      bgColor: 'bg-rose-50',
      textColor: 'text-rose-600'
    },
  ];
  
  const quickActions = [
    {
      label: 'Study Flashcards',
      description: 'Review your knowledge',
      icon: Activity,
      color: 'bg-gradient-to-br from-[#0070a0] to-[#2c90c9]',
      onClick: () => setCurrentView('flashcards'),
    },
    {
      label: 'Take a Quiz',
      description: 'Test your understanding',
      icon: TrendingUp,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      onClick: () => setCurrentView('quiz'),
    },
    {
      label: 'Browse Chapters',
      description: 'Explore your content',
      icon: BookOpen,
      color: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      onClick: () => setCurrentView('chapters'),
    },
  ];
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-[#0070a0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  return (
    <div ref={containerRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="dashboard-header mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-[#0070a0]" />
          <span className="text-sm text-[#626a72]">Welcome back</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#1f1f1f]">
          {user?.full_name ? `Hello, ${user.full_name.split(' ')[0]}!` : 'Hello!'}
        </h1>
        <p className="text-[#626a72] mt-2">
          Here's what's happening in your study universe today.
        </p>
      </div>
      
      {/* Stats Grid */}
      <div ref={statsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="hover-lift border-0 shadow-lg shadow-black/5">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-[#626a72] mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-[#1f1f1f]">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${stat.textColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Main Content Grid */}
      <div ref={cardsRef} className="grid lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-lg shadow-black/5">
            <CardHeader>
              <CardTitle className="text-xl text-[#1f1f1f]">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="grid sm:grid-cols-3 gap-4">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.label}
                      onClick={action.onClick}
                      className="group p-4 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-lg transition-all duration-300 text-left"
                    >
                      <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-[#1f1f1f] mb-1">{action.label}</h3>
                      <p className="text-sm text-[#626a72]">{action.description}</p>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Chapters */}
          <Card className="border-0 shadow-lg shadow-black/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl text-[#1f1f1f]">Recent Chapters</CardTitle>
              <button 
                onClick={() => setCurrentView('chapters')}
                className="text-sm text-[#0070a0] hover:text-[#004968] flex items-center gap-1 transition-colors"
              >
                View all
                <ChevronRight className="w-4 h-4" />
              </button>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {chapters.length > 0 ? (
                <div className="space-y-3">
                  {chapters.slice(0, 5).map((chapter) => (
                    <div
                      key={chapter.id}
                      onClick={() => {
                        setSelectedChapter(chapter);
                        setCurrentView('topics');
                      }}
                      className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-white hover:shadow-md transition-all duration-300 cursor-pointer group"
                    >
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: chapter.color || '#0070a0' }}
                      >
                        {chapter.title[0]}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-[#1f1f1f] group-hover:text-[#0070a0] transition-colors">
                          {chapter.title}
                        </h4>
                        {chapter.description && (
                          <p className="text-sm text-[#626a72] line-clamp-1">{chapter.description}</p>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#c2cdd8] group-hover:text-[#0070a0] group-hover:translate-x-1 transition-all" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-[#c2cdd8]" />
                  </div>
                  <h3 className="text-lg font-medium text-[#1f1f1f] mb-2">No chapters yet</h3>
                  <p className="text-sm text-[#626a72] mb-4">Start by creating your first chapter</p>
                  <button
                    onClick={() => setCurrentView('chapters')}
                    className="px-4 py-2 bg-[#0070a0] text-white rounded-lg hover:bg-[#004968] transition-colors"
                  >
                    Create Chapter
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Study Progress */}
          <Card className="border-0 shadow-lg shadow-black/5">
            <CardHeader>
              <CardTitle className="text-xl text-[#1f1f1f]">Study Progress</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-[#626a72]">Total Items</span>
                    <span className="font-medium text-[#1f1f1f]">{stats.totalItems}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#0070a0] to-[#2c90c9] rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(stats.totalItems * 2, 100)}%` }}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 pt-4">
                  {[
                    { label: 'Molecules', value: stats.molecules, color: 'bg-emerald-500' },
                    { label: 'Enzymes', value: stats.enzymes, color: 'bg-amber-500' },
                    { label: 'Meds', value: stats.medications, color: 'bg-rose-500' },
                  ].map((item) => (
                    <div key={item.label} className="text-center">
                      <div className={`w-3 h-3 rounded-full ${item.color} mx-auto mb-1`} />
                      <p className="text-lg font-bold text-[#1f1f1f]">{item.value}</p>
                      <p className="text-xs text-[#626a72]">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Activity */}
          <Card className="border-0 shadow-lg shadow-black/5">
            <CardHeader>
              <CardTitle className="text-xl text-[#1f1f1f] flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#0070a0]" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#0070a0] mt-2" />
                      <div>
                        <p className="text-sm text-[#1f1f1f]">
                          <span className="font-medium">{activity.action}</span>{' '}
                          {activity.type} <span className="text-[#0070a0]">"{activity.name}"</span>
                        </p>
                        <p className="text-xs text-[#626a72]">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#626a72] text-center py-4">
                  No recent activity
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
