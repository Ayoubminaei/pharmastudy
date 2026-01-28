import { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Target,
  ChevronRight,
  ArrowLeft,
  Search,
  X,
  Loader2,
  Beaker,
  FileText
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
import type { Topic } from '@/types';

export default function Topics() {
  const { user, selectedChapter, setSelectedChapter, setSelectedTopic, setCurrentView } = useStore();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTopicForAction, setSelectedTopicForAction] = useState<Topic | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (selectedChapter) {
      fetchTopics();
    } else {
      setCurrentView('chapters');
    }
  }, [selectedChapter]);
  
  useEffect(() => {
    if (!isLoading && timelineRef.current) {
      const ctx = gsap.context(() => {
        // Timeline spine animation
        gsap.fromTo(
          '.timeline-spine',
          { height: 0 },
          { height: '100%', duration: 1, ease: 'power2.out' }
        );
        
        // Topic nodes spiral in
        gsap.fromTo(
          '.topic-node',
          { rotateY: 180, opacity: 0, x: -50 },
          { 
            rotateY: 0, 
            opacity: 1, 
            x: 0,
            duration: 0.7, 
            stagger: 0.15,
            ease: 'back.out(1.7)'
          }
        );
      });
      
      return () => ctx.revert();
    }
  }, [isLoading, topics]);
  
  const fetchTopics = async () => {
    if (!user || !selectedChapter) return;
    
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('chapter_id', selectedChapter.id)
        .eq('user_id', user.id)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      
      // Get item counts
      const topicsWithCounts = await Promise.all(
        (data || []).map(async (topic) => {
          const { count } = await supabase
            .from('study_items')
            .select('*', { count: 'exact' })
            .eq('topic_id', topic.id);
          
          return { ...topic, item_count: count || 0 };
        })
      );
      
      setTopics(topicsWithCounts);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch topics');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCreate = async () => {
    if (!formData.title.trim()) {
      toast.error('Please enter a topic title');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase
        .from('topics')
        .insert({
          chapter_id: selectedChapter!.id,
          user_id: user!.id,
          title: formData.title,
          description: formData.description,
          order_index: topics.length,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success('Topic created successfully');
      const newTopic: Topic = { ...data, item_count: 0 };
      setTopics([...topics, newTopic]);
      setIsCreateDialogOpen(false);
      setFormData({ title: '', description: '' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to create topic');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEdit = async () => {
    if (!selectedTopicForAction || !formData.title.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('topics')
        .update({
          title: formData.title,
          description: formData.description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedTopicForAction.id);
      
      if (error) throw error;
      
      toast.success('Topic updated successfully');
      setTopics(topics.map(t => 
        t.id === selectedTopicForAction.id 
          ? { ...t, title: formData.title, description: formData.description, updated_at: new Date().toISOString() }
          : t
      ));
      setIsEditDialogOpen(false);
      setSelectedTopicForAction(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update topic');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = async () => {
    if (!selectedTopicForAction) return;
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('topics')
        .delete()
        .eq('id', selectedTopicForAction.id);
      
      if (error) throw error;
      
      toast.success('Topic deleted successfully');
      setTopics(topics.filter(t => t.id !== selectedTopicForAction.id));
      setIsDeleteDialogOpen(false);
      setSelectedTopicForAction(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete topic');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const openEditDialog = (topic: Topic) => {
    setSelectedTopicForAction(topic);
    setFormData({
      title: topic.title,
      description: topic.description || '',
    });
    setIsEditDialogOpen(true);
  };
  
  const openDeleteDialog = (topic: Topic) => {
    setSelectedTopicForAction(topic);
    setIsDeleteDialogOpen(true);
  };
  
  const handleTopicClick = (topic: Topic) => {
    setSelectedTopic(topic);
    setCurrentView('items');
  };
  
  const handleBack = () => {
    setSelectedChapter(null);
    setCurrentView('chapters');
  };
  
  const filteredTopics = topics.filter(topic =>
    topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (topic.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-[#0070a0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  return (
    <div ref={containerRef} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-[#626a72] hover:text-[#0070a0] transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Chapters
        </button>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div 
              className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg"
              style={{ backgroundColor: selectedChapter?.color || '#0070a0' }}
            >
              {selectedChapter?.title[0]}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1f1f1f]">{selectedChapter?.title}</h1>
              <p className="text-[#626a72]">{topics.length} topics</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#626a72]" />
              <Input
                placeholder="Search topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-56 border-[#c2cdd8] rounded-xl"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#626a72]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="pharma-gradient text-white rounded-xl hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Topic
            </Button>
          </div>
        </div>
        
        {selectedChapter?.description && (
          <p className="mt-4 text-[#626a72] max-w-2xl">{selectedChapter.description}</p>
        )}
      </div>
      
      {/* Topics Timeline */}
      {filteredTopics.length > 0 ? (
        <div ref={timelineRef} className="relative">
          {/* Timeline Spine */}
          <div className="timeline-spine absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#0070a0] via-[#2c90c9] to-[#0070a0]" />
          
          <div className="space-y-6">
            {filteredTopics.map((topic, index) => (
              <div
                key={topic.id}
                className="topic-node relative pl-16"
              >
                {/* Timeline Node */}
                <div 
                  className="absolute left-0 w-12 h-12 rounded-full bg-white border-4 border-[#0070a0] flex items-center justify-center shadow-lg z-10"
                >
                  <span className="text-sm font-bold text-[#0070a0]">{index + 1}</span>
                </div>
                
                {/* Topic Card */}
                <div
                  onClick={() => handleTopicClick(topic)}
                  className="group bg-white rounded-2xl shadow-lg shadow-black/5 p-6 hover-lift cursor-pointer border border-transparent hover:border-[#0070a0]/20 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-[#1f1f1f] mb-2 group-hover:text-[#0070a0] transition-colors">
                        {topic.title}
                      </h3>
                      {topic.description && (
                        <p className="text-sm text-[#626a72] line-clamp-2 mb-4">
                          {topic.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-[#626a72]">
                        <div className="flex items-center gap-1.5">
                          <Beaker className="w-4 h-4" />
                          <span>{topic.item_count || 0} items</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-4 h-4" />
                          <span>Notes</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 rounded-lg hover:bg-gray-100 text-[#626a72] transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditDialog(topic); }}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => { e.stopPropagation(); openDeleteDialog(topic); }}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      
                      <ChevronRight className="w-5 h-5 text-[#c2cdd8] group-hover:text-[#0070a0] group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-20">
          <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
            <Target className="w-12 h-12 text-[#c2cdd8]" />
          </div>
          <h3 className="text-xl font-semibold text-[#1f1f1f] mb-2">
            {searchQuery ? 'No topics found' : 'No topics yet'}
          </h3>
          <p className="text-[#626a72] mb-6 max-w-md mx-auto">
            {searchQuery 
              ? 'Try adjusting your search query'
              : 'Start adding topics to organize your study materials'
            }
          </p>
          {!searchQuery && (
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="pharma-gradient text-white rounded-xl hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Topic
            </Button>
          )}
        </div>
      )}
      
      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Topic</DialogTitle>
            <DialogDescription>
              Create a new topic in "{selectedChapter?.title}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                placeholder="e.g., Drug Absorption"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="border-[#c2cdd8]"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Brief description of this topic..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="border-[#c2cdd8] min-h-[100px]"
              />
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
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Topic'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Topic</DialogTitle>
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
                className="border-[#c2cdd8] min-h-[100px]"
              />
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
            <DialogTitle>Delete Topic</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedTopicForAction?.title}"? This will also delete all items within this topic. This action cannot be undone.
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
