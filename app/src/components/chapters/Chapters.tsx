import { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  BookOpen,
  ChevronRight,
  Search,
  X,
  Loader2
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import gsap from 'gsap';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Chapter } from '@/types';

const colorOptions = [
  '#0070a0', '#2c90c9', '#1b9cca', '#004968',
  '#10b981', '#059669', '#34d399',
  '#8b5cf6', '#7c3aed', '#a78bfa',
  '#f54d4d', '#ef4444', '#f87171',
  '#f59e0b', '#d97706', '#fbbf24',
];

export default function Chapters() {
  const { user, chapters, setChapters, setSelectedChapter, setCurrentView } = useStore();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedChapterForAction, setSelectedChapterForAction] = useState<Chapter | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    color: '#0070a0',
  });
  
  const gridRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    fetchChapters();
  }, [user]);
  
  useEffect(() => {
    if (!isLoading) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          headerRef.current,
          { y: -20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
        );
        
        if (gridRef.current) {
          gsap.fromTo(
            gridRef.current.children,
            { y: 30, opacity: 0, rotateX: 45 },
            { 
              y: 0, 
              opacity: 1, 
              rotateX: 0,
              duration: 0.6, 
              stagger: 0.1, 
              delay: 0.2,
              ease: 'power2.out'
            }
          );
        }
      });
      
      return () => ctx.revert();
    }
  }, [isLoading, chapters]);
  
  const fetchChapters = async () => {
    if (!user) return;
    
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      toast.error('Loading timeout - please refresh');
    }, 15000);
    
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Get topic counts
      const chaptersWithCounts = await Promise.all(
        (data || []).map(async (chapter) => {
          const { count } = await supabase
            .from('topics')
            .select('*', { count: 'exact' })
            .eq('chapter_id', chapter.id);
          
          return { ...chapter, topic_count: count || 0 };
        })
      );
      
      setChapters(chaptersWithCounts);
    } catch (error: any) {
      console.error('Fetch chapters error:', error);
      toast.error(error.message || 'Failed to fetch chapters');
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };
  
  const handleCreate = async () => {
    if (!formData.title.trim()) {
      toast.error('Please enter a chapter title');
      return;
    }
    
    if (!user) {
      toast.error('User not authenticated');
      return;
    }
    
    setIsSubmitting(true);
    
    const timeoutId = setTimeout(() => {
      setIsSubmitting(false);
      toast.error('Save timeout - please try again');
    }, 20000);
    
    try {
      const { data, error } = await supabase
        .from('chapters')
        .insert({
          user_id: user.id,
          title: formData.title.trim(),
          description: formData.description?.trim() || null,
          color: formData.color,
        })
        .select()
        .single();
      
      if (error) {
        console.error('Create chapter error:', error);
        throw error;
      }
      
      toast.success('Chapter created successfully');
      const newChapter: Chapter = { ...data, topic_count: 0 };
      setChapters([newChapter, ...chapters]);
      setIsCreateDialogOpen(false);
      setFormData({ title: '', description: '', color: '#0070a0' });
    } catch (error: any) {
      console.error('Create chapter error:', error);
      toast.error(error.message || 'Failed to create chapter. Check your connection and try again.');
    } finally {
      clearTimeout(timeoutId);
      setIsSubmitting(false);
    }
  };
  
  const handleEdit = async () => {
    if (!selectedChapterForAction || !formData.title.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('chapters')
        .update({
          title: formData.title,
          description: formData.description,
          color: formData.color,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedChapterForAction.id);
      
      if (error) throw error;
      
      toast.success('Chapter updated successfully');
      setChapters(chapters.map(c => 
        c.id === selectedChapterForAction.id 
          ? { ...c, title: formData.title, description: formData.description, color: formData.color, updated_at: new Date().toISOString() }
          : c
      ));
      setIsEditDialogOpen(false);
      setSelectedChapterForAction(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update chapter');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = async () => {
    if (!selectedChapterForAction) return;
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('chapters')
        .delete()
        .eq('id', selectedChapterForAction.id);
      
      if (error) throw error;
      
      toast.success('Chapter deleted successfully');
      setChapters(chapters.filter(c => c.id !== selectedChapterForAction.id));
      setIsDeleteDialogOpen(false);
      setSelectedChapterForAction(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete chapter');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const openEditDialog = (chapter: Chapter) => {
    setSelectedChapterForAction(chapter);
    setFormData({
      title: chapter.title,
      description: chapter.description || '',
      color: chapter.color || '#0070a0',
    });
    setIsEditDialogOpen(true);
  };
  
  const openDeleteDialog = (chapter: Chapter) => {
    setSelectedChapterForAction(chapter);
    setIsDeleteDialogOpen(true);
  };
  
  const handleChapterClick = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setCurrentView('topics');
  };
  
  const filteredChapters = chapters.filter(chapter =>
    chapter.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (chapter.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-[#0070a0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div ref={headerRef} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1f1f1f]">My Chapters</h1>
          <p className="text-[#626a72] mt-1">Organize your study materials into chapters</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#626a72]" />
            <Input
              placeholder="Search chapters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full sm:w-64 border-[#c2cdd8] rounded-xl"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#626a72] hover:text-[#1f1f1f] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Create Button */}
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="pharma-gradient text-white rounded-xl hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chapter
          </Button>
        </div>
      </div>
      
      {/* Chapters Grid */}
      {filteredChapters.length > 0 ? (
        <div ref={gridRef} className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredChapters.map((chapter) => (
            <div
              key={chapter.id}
              className="group relative bg-white rounded-2xl shadow-lg shadow-black/5 overflow-hidden hover-lift cursor-pointer card-3d"
              onClick={() => handleChapterClick(chapter)}
              style={{ perspective: '1000px' }}
            >
              {/* Color Header */}
              <div 
                className="h-24 relative overflow-hidden"
                style={{ backgroundColor: chapter.color || '#0070a0' }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                <div className="absolute top-3 right-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditDialog(chapter); }}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => { e.stopPropagation(); openDeleteDialog(chapter); }}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                {/* Icon */}
                <div className="absolute bottom-0 left-6 transform translate-y-1/2">
                  <div className="w-14 h-14 rounded-xl bg-white shadow-lg flex items-center justify-center">
                    <BookOpen 
                      className="w-7 h-7" 
                      style={{ color: chapter.color || '#0070a0' }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Content */}
              <div className="pt-10 pb-6 px-6">
                <h3 className="text-lg font-semibold text-[#1f1f1f] mb-2 line-clamp-1 group-hover:text-[#0070a0] transition-colors">
                  {chapter.title}
                </h3>
                {chapter.description && (
                  <p className="text-sm text-[#626a72] line-clamp-2 mb-4">
                    {chapter.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-[#626a72]">
                    <BookOpen className="w-4 h-4" />
                    <span>{chapter.topic_count || 0} topics</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#c2cdd8] group-hover:text-[#0070a0] group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-20">
          <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-12 h-12 text-[#c2cdd8]" />
          </div>
          <h3 className="text-xl font-semibold text-[#1f1f1f] mb-2">
            {searchQuery ? 'No chapters found' : 'No chapters yet'}
          </h3>
          <p className="text-[#626a72] mb-6 max-w-md mx-auto">
            {searchQuery 
              ? 'Try adjusting your search query'
              : 'Start organizing your study materials by creating your first chapter'
            }
          </p>
          {!searchQuery && (
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="pharma-gradient text-white rounded-xl hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Chapter
            </Button>
          )}
        </div>
      )}
      
      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Chapter</DialogTitle>
            <DialogDescription>
              Add a new chapter to organize your study materials
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                placeholder="e.g., Pharmacology 101"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="border-[#c2cdd8]"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Brief description of this chapter..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="border-[#c2cdd8] min-h-[80px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-lg transition-all ${
                      formData.color === color ? 'ring-2 ring-offset-2 ring-[#0070a0] scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isSubmitting}
                className="flex-1 pharma-gradient text-white"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Chapter'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Chapter</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="border-[#c2cdd8]"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="border-[#c2cdd8] min-h-[80px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-lg transition-all ${
                      formData.color === color ? 'ring-2 ring-offset-2 ring-[#0070a0] scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEdit}
                disabled={isSubmitting}
                className="flex-1 pharma-gradient text-white"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Chapter</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedChapterForAction?.title}"? This will also delete all topics and items within this chapter. This action cannot be undone.
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
              onClick={handleDelete}
              disabled={isSubmitting}
              variant="destructive"
              className="flex-1"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
