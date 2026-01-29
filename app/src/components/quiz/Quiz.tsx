import { useState, useEffect } from 'react';
import { 
  HelpCircle,
  CheckCircle,
  XCircle,
  ArrowRight,
  RotateCw,
  Trophy,
  Target,
  Beaker,
  Pill,
  Zap
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import type { StudyItem, ItemType, Chapter, Topic } from '@/types';

interface QuizQuestion {
  item: StudyItem;
  options: string[];
  correctAnswer: number;
}

export default function Quiz() {
  const { user } = useStore();
  const [items, setItems] = useState<StudyItem[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [quizStarted, setQuizStarted] = useState(false);
  const [questionCount, setQuestionCount] = useState<number>(10);
  
  useEffect(() => {
    fetchData();
  }, [user]);
  
  const fetchData = async () => {
    if (!user) return;
    
    try {
      const { data: itemsData } = await supabase
        .from('study_items')
        .select('*')
        .eq('user_id', user.id);
      
      if (itemsData) {
        setItems(itemsData);
      }
      
      const { data: chaptersData } = await supabase
        .from('chapters')
        .select('*')
        .eq('user_id', user.id);
      
      if (chaptersData) {
        setChapters(chaptersData);
      }
      
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
  
  const generateQuiz = () => {
    let filteredItems = [...items];
    
    if (selectedChapter !== 'all') {
      const chapterTopics = topics.filter(t => t.chapter_id === selectedChapter).map(t => t.id);
      filteredItems = filteredItems.filter(item => chapterTopics.includes(item.topic_id));
    }
    
    if (selectedTopic !== 'all') {
      filteredItems = filteredItems.filter(item => item.topic_id === selectedTopic);
    }
    
    if (selectedType !== 'all') {
      filteredItems = filteredItems.filter(item => item.type === selectedType);
    }
    
    if (filteredItems.length < 4) {
      toast.error('Not enough items for a quiz. Need at least 4 items.');
      return;
    }
    
    // Shuffle and take requested number
    const shuffled = filteredItems.sort(() => Math.random() - 0.5).slice(0, questionCount);
    
    // Generate questions
    const generatedQuestions: QuizQuestion[] = shuffled.map((item) => {
      // Get 3 random wrong answers from other items
      const otherItems = filteredItems.filter(i => i.id !== item.id);
      const wrongAnswers = otherItems
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(i => i.name);
      
      // Combine and shuffle
      const options = [...wrongAnswers, item.name].sort(() => Math.random() - 0.5);
      
      return {
        item,
        options,
        correctAnswer: options.indexOf(item.name),
      };
    });
    
    setQuestions(generatedQuestions);
    setQuizStarted(true);
    setCurrentQuestionIndex(0);
    setScore(0);
    setQuizCompleted(false);
  };
  
  const handleAnswerSelect = (index: number) => {
    if (showResult) return;
    
    setSelectedAnswer(index);
    setShowResult(true);
    
    if (index === questions[currentQuestionIndex].correctAnswer) {
      setScore(score + 1);
    }
  };
  
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setQuizCompleted(true);
    }
  };
  
  const handleRestart = () => {
    setQuizStarted(false);
    setQuizCompleted(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setQuestions([]);
  };
  
  const getTypeIcon = (type: ItemType) => {
    switch (type) {
      case 'molecule': return <Beaker className="w-5 h-5 text-emerald-600" />;
      case 'enzyme': return <Zap className="w-5 h-5 text-amber-600" />;
      case 'medication': return <Pill className="w-5 h-5 text-rose-600" />;
    }
  };
  
  const getScoreMessage = () => {
    const percentage = (score / questions.length) * 100;
    if (percentage >= 90) return { message: 'Excellent!', color: 'text-green-600', icon: Trophy };
    if (percentage >= 70) return { message: 'Great job!', color: 'text-blue-600', icon: CheckCircle };
    if (percentage >= 50) return { message: 'Good effort!', color: 'text-amber-600', icon: Target };
    return { message: 'Keep practicing!', color: 'text-rose-600', icon: RotateCw };
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-[#0070a0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[#1f1f1f] mb-2">Quiz Mode</h1>
        <p className="text-[#626a72]">Test your knowledge with interactive quizzes</p>
      </div>
      
      {!quizStarted ? (
        /* Quiz Setup */
        <Card className="border-0 shadow-lg shadow-black/5">
          <CardContent className="p-6 space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
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
              
              <div>
                <label className="text-sm font-medium text-[#33383f] mb-2 block">Number of Questions</label>
                <Select 
                  value={questionCount.toString()} 
                  onValueChange={(v) => setQuestionCount(parseInt(v))}
                >
                  <SelectTrigger className="border-[#c2cdd8]">
                    <SelectValue placeholder="10 questions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 questions</SelectItem>
                    <SelectItem value="10">10 questions</SelectItem>
                    <SelectItem value="15">15 questions</SelectItem>
                    <SelectItem value="20">20 questions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-center pt-4">
              <Button
                onClick={generateQuiz}
                className="pharma-gradient text-white rounded-xl px-8"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                Start Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : quizCompleted ? (
        /* Quiz Results */
        <Card className="border-0 shadow-lg shadow-black/5">
          <CardContent className="p-8 text-center">
            {(() => {
              const { message, color, icon: Icon } = getScoreMessage();
              return (
                <>
                  <div className={`w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6 ${color}`}>
                    <Icon className="w-12 h-12" />
                  </div>
                  <h2 className={`text-3xl font-bold mb-2 ${color}`}>{message}</h2>
                  <p className="text-5xl font-bold text-[#1f1f1f] mb-2">
                    {score} / {questions.length}
                  </p>
                  <p className="text-[#626a72] mb-8">
                    You got {Math.round((score / questions.length) * 100)}% correct
                  </p>
                </>
              );
            })()}
            
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={handleRestart}
                className="rounded-xl"
              >
                <RotateCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button
                onClick={() => setQuizStarted(false)}
                className="pharma-gradient text-white rounded-xl"
              >
                New Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Active Quiz */
        <div className="space-y-6">
          {/* Progress */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full pharma-gradient transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
            <span className="text-sm text-[#626a72] whitespace-nowrap">
              {currentQuestionIndex + 1} / {questions.length}
            </span>
          </div>
          
          {/* Question */}
          <Card className="border-0 shadow-lg shadow-black/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                {getTypeIcon(questions[currentQuestionIndex].item.type)}
                <span className="text-sm text-[#626a72] capitalize">
                  {questions[currentQuestionIndex].item.type}
                </span>
              </div>
              
              <h3 className="text-xl font-semibold text-[#1f1f1f] mb-6">
                What is the name of this {questions[currentQuestionIndex].item.type}?
              </h3>
              
              {/* Image */}
              {questions[currentQuestionIndex].item.image_url && (
                <div className="flex justify-center mb-8">
                  <img
                    src={questions[currentQuestionIndex].item.image_url}
                    alt="Question"
                    className="max-h-48 object-contain rounded-xl"
                  />
                </div>
              )}
              
              {/* Options */}
              <div className="space-y-3">
                {questions[currentQuestionIndex].options.map((option, index) => {
                  const isSelected = selectedAnswer === index;
                  const isCorrect = index === questions[currentQuestionIndex].correctAnswer;
                  const showCorrectness = showResult && (isCorrect || isSelected);
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={showResult}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        showCorrectness
                          ? isCorrect
                            ? 'border-green-500 bg-green-50'
                            : isSelected
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200'
                          : isSelected
                          ? 'border-[#0070a0] bg-[#0070a0]/5'
                          : 'border-gray-200 hover:border-[#0070a0]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{option}</span>
                        {showCorrectness && (
                          isCorrect ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : isSelected ? (
                            <XCircle className="w-5 h-5 text-red-500" />
                          ) : null
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              
              {/* Next Button */}
              {showResult && (
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={handleNext}
                    className="pharma-gradient text-white rounded-xl"
                  >
                    {currentQuestionIndex < questions.length - 1 ? (
                      <>
                        Next Question
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    ) : (
                      'See Results'
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Score */}
          <div className="text-center text-sm text-[#626a72]">
            Current Score: {score} / {currentQuestionIndex + (showResult ? 1 : 0)}
          </div>
        </div>
      )}
    </div>
  );
}
