import { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  RotateCw, 
  Shuffle, 
  Beaker,
  Pill,
  Zap,
  Layers,
  CheckCircle
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import gsap from 'gsap';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { StudyItem, ItemType, Chapter, Topic } from '@/types';

export default function Flashcards() {
  const { user } = useStore();
  const [items, setItems] = useState<StudyItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<StudyItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [studyMode, setStudyMode] = useState(false);
  const [masteredItems, setMasteredItems] = useState<Set<string>>(new Set());
  
  const cardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    fetchData();
  }, [user]);
  
  useEffect(() => {
    filterItems();
  }, [items, selectedChapter, selectedTopic, selectedType]);
  
  useEffect(() => {
    // Reset card animation when changing cards
    if (cardRef.current && !isFlipped) {
      gsap.fromTo(
        cardRef.current,
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.3, ease: 'power2.out' }
      );
    }
  }, [currentIndex]);
  
  const fetchData = async () => {
    if (!user) return;
    
    try {
      // Fetch all items
      const { data: itemsData } = await supabase
        .from('study_items')
        .select('*')
        .eq('user_id', user.id);
      
      if (itemsData) {
        setItems(itemsData);
        setFilteredItems(itemsData);
      }
      
      // Fetch chapters for filter
      const { data: chaptersData } = await supabase
        .from('chapters')
        .select('*')
        .eq('user_id', user.id);
      
      if (chaptersData) {
        setChapters(chaptersData);
      }
      
      // Fetch topics for filter
      const { data: topicsData } = await supabase
        .from('topics')
        .select('*')
        .eq('user_id', user.id);
      
      if (topicsData) {
        setTopics(topicsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const filterItems = () => {
    let filtered = [...items];
    
    if (selectedChapter !== 'all') {
      const chapterTopics = topics.filter(t => t.chapter_id === selectedChapter).map(t => t.id);
      filtered = filtered.filter(item => chapterTopics.includes(item.topic_id));
    }
    
    if (selectedTopic !== 'all') {
      filtered = filtered.filter(item => item.topic_id === selectedTopic);
    }
    
    if (selectedType !== 'all') {
      filtered = filtered.filter(item => item.type === selectedType);
    }
    
    setFilteredItems(filtered);
    setCurrentIndex(0);
    setIsFlipped(false);
  };
  
  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        rotateY: isFlipped ? 0 : 180,
        duration: 0.6,
        ease: 'power2.inOut',
      });
    }
  };
  
  const handleNext = () => {
    if (currentIndex < filteredItems.length - 1) {
      setIsFlipped(false);
      if (cardRef.current) {
        gsap.to(cardRef.current, {
          rotateY: 0,
          duration: 0.3,
          onComplete: () => setCurrentIndex(currentIndex + 1),
        });
      } else {
        setCurrentIndex(currentIndex + 1);
      }
    }
  };
  
  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      if (cardRef.current) {
        gsap.to(cardRef.current, {
          rotateY: 0,
          duration: 0.3,
          onComplete: () => setCurrentIndex(currentIndex - 1),
        });
      } else {
        setCurrentIndex(currentIndex - 1);
      }
    }
  };
  
  const handleShuffle = () => {
    const shuffled = [...filteredItems].sort(() => Math.random() - 0.5);
    setFilteredItems(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    toast.success('Cards shuffled!');
  };
  
  const toggleMastered = (itemId: string) => {
    const newMastered = new Set(masteredItems);
    if (newMastered.has(itemId)) {
      newMastered.delete(itemId);
      toast.info('Item marked as not mastered');
    } else {
      newMastered.add(itemId);
      toast.success('Item marked as mastered!');
    }
    setMasteredItems(newMastered);
  };
  
  const getTypeIcon = (type: ItemType) => {
    switch (type) {
      case 'molecule': return <Beaker className="w-5 h-5 text-emerald-600" />;
      case 'enzyme': return <Zap className="w-5 h-5 text-amber-600" />;
      case 'medication': return <Pill className="w-5 h-5 text-rose-600" />;
    }
  };
  
  const getTypeColor = (type: ItemType) => {
    switch (type) {
      case 'molecule': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'enzyme': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'medication': return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };
  
  const currentItem = filteredItems[currentIndex];
  const progress = filteredItems.length > 0 ? ((currentIndex + 1) / filteredItems.length) * 100 : 0;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-[#0070a0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  return (
    <div ref={containerRef} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[#1f1f1f] mb-2">Flashcards</h1>
        <p className="text-[#626a72]">Test your knowledge with interactive flashcards</p>
      </div>
      
      {/* Filters */}
      {!studyMode && (
        <div className="bg-white rounded-2xl shadow-lg shadow-black/5 p-6 mb-8">
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-[#33383f] mb-2 block">Chapter</label>
              <Select value={selectedChapter} onValueChange={setSelectedChapter}>
                <SelectTrigger className="border-[#c2cdd8]">
                  <SelectValue placeholder="All Chapters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Chapters</SelectItem>
                  {chapters.map((chapter) => (
                    <SelectItem key={chapter.id} value={chapter.id}>
                      {chapter.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-[#33383f] mb-2 block">Topic</label>
              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger className="border-[#c2cdd8]">
                  <SelectValue placeholder="All Topics" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Topics</SelectItem>
                  {topics
                    .filter(t => selectedChapter === 'all' || t.chapter_id === selectedChapter)
                    .map((topic) => (
                      <SelectItem key={topic.id} value={topic.id}>
                        {topic.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-[#33383f] mb-2 block">Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="border-[#c2cdd8]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="molecule">Molecules</SelectItem>
                  <SelectItem value="enzyme">Enzymes</SelectItem>
                  <SelectItem value="medication">Medications</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="mt-6 flex justify-center">
            <Button
              onClick={() => setStudyMode(true)}
              disabled={filteredItems.length === 0}
              className="pharma-gradient text-white rounded-xl px-8"
            >
              <Layers className="w-4 h-4 mr-2" />
              Start Studying ({filteredItems.length} cards)
            </Button>
          </div>
        </div>
      )}
      
      {/* Study Mode */}
      {studyMode && filteredItems.length > 0 && currentItem && (
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full pharma-gradient transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm text-[#626a72] whitespace-nowrap">
              {currentIndex + 1} / {filteredItems.length}
            </span>
          </div>
          
          {/* Flashcard */}
          <div className="relative h-[400px] sm:h-[500px]" style={{ perspective: '1000px' }}>
            <div
              ref={cardRef}
              onClick={handleFlip}
              className="relative w-full h-full cursor-pointer"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Front */}
              <div 
                className="absolute inset-0 bg-white rounded-3xl shadow-2xl shadow-black/10 p-8 flex flex-col items-center justify-center backface-hidden"
                style={{ backfaceVisibility: 'hidden' }}
              >
                {/* Type Badge */}
                <div className={`absolute top-6 left-6 px-3 py-1.5 rounded-full text-sm font-medium border flex items-center gap-2 ${getTypeColor(currentItem.type)}`}>
                  {getTypeIcon(currentItem.type)}
                  {currentItem.type.charAt(0).toUpperCase() + currentItem.type.slice(1)}
                </div>
                
                {/* Mastered Badge */}
                {masteredItems.has(currentItem.id) && (
                  <div className="absolute top-6 right-6 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-medium flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    Mastered
                  </div>
                )}
                
                {/* Image */}
                {currentItem.image_url ? (
                  <div className="flex-1 flex items-center justify-center w-full">
                    <img
                      src={currentItem.image_url}
                      alt={currentItem.name}
                      className="max-h-48 sm:max-h-64 object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    {getTypeIcon(currentItem.type)}
                  </div>
                )}
                
                {/* Hint */}
                <p className="text-sm text-[#626a72] mt-4 flex items-center gap-2">
                  <RotateCw className="w-4 h-4" />
                  Click to reveal answer
                </p>
              </div>
              
              {/* Back */}
              <div 
                className="absolute inset-0 bg-gradient-to-br from-[#0070a0] to-[#2c90c9] rounded-3xl shadow-2xl shadow-black/10 p-8 flex flex-col items-center justify-center text-white"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                <h3 className="text-2xl sm:text-3xl font-bold mb-4 text-center">
                  {currentItem.name}
                </h3>
                
                {currentItem.description && (
                  <p className="text-white/90 text-center mb-4 max-w-lg">
                    {currentItem.description}
                  </p>
                )}
                
                {/* Additional Info */}
                <div className="w-full max-w-lg space-y-3 mt-4">
                  {currentItem.structure_description && (
                    <div className="bg-white/10 rounded-xl p-4">
                      <h4 className="font-semibold mb-1">Structure</h4>
                      <p className="text-sm text-white/80">{currentItem.structure_description}</p>
                    </div>
                  )}
                  
                  {currentItem.mechanism_description && (
                    <div className="bg-white/10 rounded-xl p-4">
                      <h4 className="font-semibold mb-1">Mechanism</h4>
                      <p className="text-sm text-white/80">{currentItem.mechanism_description}</p>
                    </div>
                  )}
                  
                  {currentItem.uses && (
                    <div className="bg-white/10 rounded-xl p-4">
                      <h4 className="font-semibold mb-1">Uses</h4>
                      <p className="text-sm text-white/80">{currentItem.uses}</p>
                    </div>
                  )}
                  
                  {currentItem.effects && (
                    <div className="bg-white/10 rounded-xl p-4">
                      <h4 className="font-semibold mb-1">Effects</h4>
                      <p className="text-sm text-white/80">{currentItem.effects}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="w-14 h-14 rounded-full p-0"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            
            <Button
              variant="outline"
              onClick={handleFlip}
              className="w-14 h-14 rounded-full p-0"
            >
              <RotateCw className="w-6 h-6" />
            </Button>
            
            <Button
              variant="outline"
              onClick={handleShuffle}
              className="w-14 h-14 rounded-full p-0"
            >
              <Shuffle className="w-6 h-6" />
            </Button>
            
            <Button
              variant={masteredItems.has(currentItem.id) ? 'default' : 'outline'}
              onClick={() => toggleMastered(currentItem.id)}
              className={`w-14 h-14 rounded-full p-0 ${masteredItems.has(currentItem.id) ? 'bg-green-500 hover:bg-green-600' : ''}`}
            >
              <CheckCircle className="w-6 h-6" />
            </Button>
            
            <Button
              variant="outline"
              onClick={handleNext}
              disabled={currentIndex === filteredItems.length - 1}
              className="w-14 h-14 rounded-full p-0"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>
          
          {/* Exit Study Mode */}
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => {
                setStudyMode(false);
                setIsFlipped(false);
                setCurrentIndex(0);
              }}
              className="text-[#626a72]"
            >
              Exit Study Mode
            </Button>
          </div>
        </div>
      )}
      
      {/* Empty State */}
      {studyMode && filteredItems.length === 0 && (
        <div className="text-center py-20">
          <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
            <Layers className="w-12 h-12 text-[#c2cdd8]" />
          </div>
          <h3 className="text-xl font-semibold text-[#1f1f1f] mb-2">No cards found</h3>
          <p className="text-[#626a72] mb-6">Try adjusting your filters or add more study items</p>
          <Button
            variant="outline"
            onClick={() => setStudyMode(false)}
          >
            Back to Filters
          </Button>
        </div>
      )}
      
      {/* Stats */}
      {!studyMode && filteredItems.length > 0 && (
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 text-center shadow-lg shadow-black/5">
            <p className="text-2xl font-bold text-[#0070a0]">{filteredItems.length}</p>
            <p className="text-sm text-[#626a72]">Total Cards</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-lg shadow-black/5">
            <p className="text-2xl font-bold text-green-600">{masteredItems.size}</p>
            <p className="text-sm text-[#626a72]">Mastered</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-lg shadow-black/5">
            <p className="text-2xl font-bold text-amber-600">
              {Math.round((masteredItems.size / filteredItems.length) * 100)}%
            </p>
            <p className="text-sm text-[#626a72]">Progress</p>
          </div>
        </div>
      )}
    </div>
  );
}
