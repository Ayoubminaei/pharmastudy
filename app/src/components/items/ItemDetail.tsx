import { useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Beaker, 
  Pill, 
  Zap, 
  ExternalLink,
  Edit2,
  Trash2,
  FileDown
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import gsap from 'gsap';
import type { ItemType, StudyItem } from '@/types';

const itemTypeConfig: Record<ItemType, { label: string; icon: typeof Beaker; color: string; bgColor: string; borderColor: string }> = {
  molecule: { 
    label: 'Molecule', 
    icon: Beaker, 
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200'
  },
  enzyme: { 
    label: 'Enzyme', 
    icon: Zap, 
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200'
  },
  medication: { 
    label: 'Medication', 
    icon: Pill, 
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200'
  },
};

interface ItemDetailProps {
  item: StudyItem;
  onEdit: (item: StudyItem) => void;
  onDelete: (item: StudyItem) => void;
  onExport: () => void;
}

export default function ItemDetail({ item, onEdit, onDelete, onExport }: ItemDetailProps) {
  const { setCurrentView } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const config = itemTypeConfig[item.type];
  const Icon = config.icon;
  
  useEffect(() => {
    if (containerRef.current) {
      const ctx = gsap.context(() => {
        // Animate image
        gsap.fromTo(
          imageRef.current,
          { scale: 0.9, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.6, ease: 'power3.out' }
        );
        
        // Animate content
        gsap.fromTo(
          contentRef.current?.children || [],
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, delay: 0.2, ease: 'power2.out' }
        );
      });
      
      return () => ctx.revert();
    }
  }, []);
  
  const handleBack = () => {
    setCurrentView('items');
  };
  
  const openPubChem = () => {
    if (item.pubchem_cid) {
      window.open(`https://pubchem.ncbi.nlm.nih.gov/compound/${item.pubchem_cid}`, '_blank');
    }
  };
  
  return (
    <div ref={containerRef} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-[#626a72] hover:text-[#0070a0] transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Items
        </button>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl ${config.bgColor} flex items-center justify-center`}>
              <Icon className={`w-7 h-7 ${config.color}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className={`${config.color} ${config.borderColor}`}>
                  {config.label}
                </Badge>
                {item.pubchem_cid && (
                  <Badge variant="outline" className="text-blue-600 border-blue-200">
                    PubChem CID: {item.pubchem_cid}
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1f1f1f] dark:text-white">
                {item.name}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {item.pubchem_cid && (
              <Button
                variant="outline"
                onClick={openPubChem}
                className="rounded-xl"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View on PubChem
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onExport}
              className="rounded-xl"
            >
              <FileDown className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => onEdit(item)}
              className="rounded-xl"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              onClick={() => onDelete(item)}
              className="rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Image Section */}
        <div ref={imageRef} className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg shadow-black/5 border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="aspect-square bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-8">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-contain hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400">
                  <Icon className="w-24 h-24 mb-4 opacity-30" />
                  <p>No image available</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Quick Info */}
          <div className="grid grid-cols-2 gap-4">
            {item.structure_description && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800">
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mb-1">Structure</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">Available</p>
              </div>
            )}
            {item.mechanism_description && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">Mechanism</p>
                <p className="text-xs text-blue-700 dark:text-blue-300">Available</p>
              </div>
            )}
            {item.uses && (
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800">
                <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">Uses</p>
                <p className="text-xs text-purple-700 dark:text-purple-300">Available</p>
              </div>
            )}
            {item.effects && (
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-100 dark:border-amber-800">
                <p className="text-sm text-amber-600 dark:text-amber-400 font-medium mb-1">Effects</p>
                <p className="text-xs text-amber-700 dark:text-amber-300">Available</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Details Section */}
        <div ref={contentRef} className="space-y-6">
          {/* Description */}
          {item.description && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg shadow-black/5 border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-[#1f1f1f] dark:text-white mb-3 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 text-sm">i</span>
                </div>
                Description
              </h2>
              <p className="text-[#626a72] dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {item.description}
              </p>
            </div>
          )}
          
          {/* Structure Description */}
          {item.structure_description && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg shadow-black/5 border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-[#1f1f1f] dark:text-white mb-3 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Beaker className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                Structure
              </h2>
              <p className="text-[#626a72] dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {item.structure_description}
              </p>
            </div>
          )}
          
          {/* Mechanism of Action */}
          {item.mechanism_description && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg shadow-black/5 border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-[#1f1f1f] dark:text-white mb-3 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                Mechanism of Action
              </h2>
              <p className="text-[#626a72] dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {item.mechanism_description}
              </p>
            </div>
          )}
          
          {/* Uses */}
          {item.uses && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg shadow-black/5 border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-[#1f1f1f] dark:text-white mb-3 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Pill className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                Uses / Indications
              </h2>
              <p className="text-[#626a72] dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {item.uses}
              </p>
            </div>
          )}
          
          {/* Effects */}
          {item.effects && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg shadow-black/5 border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-[#1f1f1f] dark:text-white mb-3 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <span className="text-amber-600 dark:text-amber-400 text-sm">!</span>
                </div>
                Effects / Side Effects
              </h2>
              <p className="text-[#626a72] dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {item.effects}
              </p>
            </div>
          )}
          
          {/* Metadata */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[#626a72] dark:text-gray-400">Created:</span>
                <span className="ml-2 text-[#1f1f1f] dark:text-gray-200">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-[#626a72] dark:text-gray-400">Updated:</span>
                <span className="ml-2 text-[#1f1f1f] dark:text-gray-200">
                  {new Date(item.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
