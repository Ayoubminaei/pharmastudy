import { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  ArrowLeft,
  Search,
  X,
  Loader2,
  Beaker,
  Pill,
  Zap,
  FileDown,
  Image as ImageIcon,
  Check,
  type LucideIcon
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { searchPubChem } from '@/services/pubchem';
import { exportItemsToPDF } from '@/services/pdfExport';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { StudyItem, ItemType, PubChemCompound } from '@/types';

const itemTypeConfig: Record<ItemType, { label: string; icon: LucideIcon; color: string; bgColor: string }> = {
  molecule: { 
    label: 'Molecules', 
    icon: Beaker, 
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50'
  },
  enzyme: { 
    label: 'Enzymes', 
    icon: Zap, 
    color: 'text-amber-600',
    bgColor: 'bg-amber-50'
  },
  medication: { 
    label: 'Medications', 
    icon: Pill, 
    color: 'text-rose-600',
    bgColor: 'bg-rose-50'
  },
};

export default function Items() {
  const { user, selectedChapter, selectedTopic, setSelectedTopic, setCurrentView } = useStore();
  const [items, setItems] = useState<StudyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<ItemType>('molecule');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPubChemDialogOpen, setIsPubChemDialogOpen] = useState(false);
  const [selectedItemForAction, setSelectedItemForAction] = useState<StudyItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // PubChem states
  const [pubchemQuery, setPubchemQuery] = useState('');
  const [pubchemResults, setPubchemResults] = useState<PubChemCompound[]>([]);
  const [isSearchingPubchem, setIsSearchingPubchem] = useState(false);
  
  const [formData, setFormData] = useState<{
    name: string;
    type: ItemType;
    description: string;
    image_url: string;
    structure_description: string;
    mechanism_description: string;
    uses: string;
    effects: string;
    pubchem_cid: string;
  }>({
    name: '',
    type: 'molecule',
    description: '',
    image_url: '',
    structure_description: '',
    mechanism_description: '',
    uses: '',
    effects: '',
    pubchem_cid: '',
  });
  
  const gridRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (selectedTopic) {
      fetchItems();
    } else {
      setCurrentView('topics');
    }
  }, [selectedTopic]);
  
  useEffect(() => {
    if (!isLoading && gridRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          '.item-card',
          { scale: 0, opacity: 0 },
          { 
            scale: 1, 
            opacity: 1, 
            duration: 0.4, 
            stagger: 0.05,
            ease: 'back.out(1.7)'
          }
        );
      });
      
      return () => ctx.revert();
    }
  }, [isLoading, items, activeTab]);
  
  const fetchItems = async () => {
    if (!user || !selectedTopic) return;
    
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      toast.error('Loading timeout - please refresh');
    }, 15000);
    
    try {
      const { data, error } = await supabase
        .from('study_items')
        .select('*')
        .eq('topic_id', selectedTopic.id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      console.error('Fetch items error:', error);
      toast.error(error.message || 'Failed to fetch items');
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };
  
  const handleSearchPubChem = async () => {
    if (!pubchemQuery.trim()) return;
    
    setIsSearchingPubchem(true);
    try {
      const results = await searchPubChem(pubchemQuery);
      setPubchemResults(results);
    } catch (error) {
      toast.error('Failed to search PubChem');
    } finally {
      setIsSearchingPubchem(false);
    }
  };
  
  const selectPubChemCompound = (compound: PubChemCompound) => {
    setFormData({
      ...formData,
      name: compound.name,
      description: compound.description || `Molecular Formula: ${compound.molecularFormula || 'N/A'}`,
      image_url: compound.imageUrl || '',
      pubchem_cid: compound.cid.toString(),
    });
    setIsPubChemDialogOpen(false);
    setPubchemResults([]);
    setPubchemQuery('');
    toast.success('Compound data imported from PubChem');
  };
  
  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a name');
      return;
    }
    
    if (!user || !selectedTopic) {
      toast.error('User or topic not available');
      return;
    }
    
    setIsSubmitting(true);
    
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setIsSubmitting(false);
      toast.error('Save timeout - please try again');
    }, 20000);
    
    try {
      // Convert blob URLs to PubChem direct URLs if needed
      let imageUrl = formData.image_url;
      if (imageUrl && imageUrl.startsWith('blob:')) {
        // Replace blob URL with direct PubChem URL if we have a CID
        if (formData.pubchem_cid) {
          imageUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${formData.pubchem_cid}/PNG`;
        } else {
          imageUrl = ''; // Clear invalid blob URL
        }
      }
      
      const { data, error } = await supabase
        .from('study_items')
        .insert({
          topic_id: selectedTopic.id,
          user_id: user.id,
          type: formData.type,
          name: formData.name.trim(),
          description: formData.description?.trim() || null,
          image_url: imageUrl || null,
          structure_description: formData.structure_description?.trim() || null,
          mechanism_description: formData.mechanism_description?.trim() || null,
          uses: formData.uses?.trim() || null,
          effects: formData.effects?.trim() || null,
          pubchem_cid: formData.pubchem_cid || null,
        })
        .select()
        .single();
      
      if (error) {
        console.error('Create item error:', error);
        throw error;
      }
      
      toast.success('Item added successfully');
      setItems([data, ...items]);
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Create item error:', error);
      toast.error(error.message || 'Failed to create item. Check your connection and try again.');
    } finally {
      clearTimeout(timeoutId);
      setIsSubmitting(false);
    }
  };
  
  const handleEdit = async () => {
    if (!selectedItemForAction || !formData.name.trim()) return;
    
    setIsSubmitting(true);
    
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setIsSubmitting(false);
      toast.error('Update timeout - please try again');
    }, 20000);
    
    try {
      // Convert blob URLs to PubChem direct URLs if needed
      let imageUrl = formData.image_url;
      if (imageUrl && imageUrl.startsWith('blob:')) {
        if (formData.pubchem_cid) {
          imageUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${formData.pubchem_cid}/PNG`;
        } else {
          imageUrl = '';
        }
      }
      
      const { error } = await supabase
        .from('study_items')
        .update({
          name: formData.name.trim(),
          description: formData.description?.trim() || null,
          image_url: imageUrl || null,
          structure_description: formData.structure_description?.trim() || null,
          mechanism_description: formData.mechanism_description?.trim() || null,
          uses: formData.uses?.trim() || null,
          effects: formData.effects?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedItemForAction.id);
      
      if (error) {
        console.error('Update item error:', error);
        throw error;
      }
      
      toast.success('Item updated successfully');
      setItems(items.map(i => 
        i.id === selectedItemForAction.id 
          ? { ...i, ...formData, image_url: imageUrl, updated_at: new Date().toISOString() }
          : i
      ));
      setIsEditDialogOpen(false);
      setSelectedItemForAction(null);
    } catch (error: any) {
      console.error('Update item error:', error);
      toast.error(error.message || 'Failed to update item. Check your connection and try again.');
    } finally {
      clearTimeout(timeoutId);
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = async () => {
    if (!selectedItemForAction) return;
    
    setIsSubmitting(true);
    
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setIsSubmitting(false);
      toast.error('Delete timeout - please try again');
    }, 15000);
    
    try {
      const { error } = await supabase
        .from('study_items')
        .delete()
        .eq('id', selectedItemForAction.id);
      
      if (error) {
        console.error('Delete item error:', error);
        throw error;
      }
      
      toast.success('Item deleted successfully');
      setItems(items.filter(i => i.id !== selectedItemForAction.id));
      setIsDeleteDialogOpen(false);
      setSelectedItemForAction(null);
    } catch (error: any) {
      console.error('Delete item error:', error);
      toast.error(error.message || 'Failed to delete item. Check your connection and try again.');
    } finally {
      clearTimeout(timeoutId);
      setIsSubmitting(false);
    }
  };
  
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const filteredItems = items.filter(i => i.type === activeTab);
      await exportItemsToPDF(
        filteredItems,
        `${itemTypeConfig[activeTab].label} - ${selectedTopic?.title}`,
        selectedChapter || undefined,
        selectedTopic || undefined
      );
      toast.success('PDF exported successfully');
    } catch (error) {
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };
  
  const openEditDialog = (item: StudyItem) => {
    setSelectedItemForAction(item);
    setFormData({
      name: item.name,
      type: item.type,
      description: item.description || '',
      image_url: item.image_url || '',
      structure_description: item.structure_description || '',
      mechanism_description: item.mechanism_description || '',
      uses: item.uses || '',
      effects: item.effects || '',
      pubchem_cid: item.pubchem_cid || '',
    });
    setIsEditDialogOpen(true);
  };
  
  const openDeleteDialog = (item: StudyItem) => {
    setSelectedItemForAction(item);
    setIsDeleteDialogOpen(true);
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      type: activeTab,
      description: '',
      image_url: '',
      structure_description: '',
      mechanism_description: '',
      uses: '',
      effects: '',
      pubchem_cid: '',
    });
  };
  
  const handleBack = () => {
    setSelectedTopic(null);
    setCurrentView('topics');
  };
  
  const filteredItems = items.filter(item => {
    const matchesType = item.type === activeTab;
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    return matchesType && matchesSearch;
  });
  
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
      <div className="mb-8">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-[#626a72] hover:text-[#0070a0] transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Topics
        </button>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1f1f1f]">{selectedTopic?.title}</h1>
            <p className="text-[#626a72] mt-1">Manage your study items</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#626a72]" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-48 border-[#c2cdd8] rounded-xl"
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
              onClick={handleExportPDF}
              disabled={isExporting || filteredItems.length === 0}
              variant="outline"
              className="rounded-xl"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              <span className="hidden sm:inline ml-2">Export PDF</span>
            </Button>
            
            <Button
              onClick={() => {
                resetForm();
                setFormData(prev => ({ ...prev, type: activeTab }));
                setIsCreateDialogOpen(true);
              }}
              className="pharma-gradient text-white rounded-xl hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ItemType)} className="mb-6">
        <TabsList className="bg-gray-100 p-1 rounded-xl">
          {(['molecule', 'enzyme', 'medication'] as ItemType[]).map((type) => {
            const config = itemTypeConfig[type];
            const Icon = config.icon;
            const count = items.filter(i => i.type === type).length;
            
            return (
              <TabsTrigger
                key={type}
                value={type}
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-4 py-2 flex items-center gap-2"
              >
                <Icon className={`w-4 h-4 ${config.color}`} />
                <span className="hidden sm:inline">{config.label}</span>
                <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">{count}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
        
        {(['molecule', 'enzyme', 'medication'] as ItemType[]).map((type) => (
          <TabsContent key={type} value={type}>
            {filteredItems.length > 0 ? (
              <div ref={gridRef} className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredItems.map((item) => {
                  const config = itemTypeConfig[item.type];
                  const Icon = config.icon;
                  
                  return (
                    <div
                      key={item.id}
                      className="item-card group bg-white rounded-2xl shadow-lg shadow-black/5 overflow-hidden hover-lift border border-transparent hover:border-[#0070a0]/20"
                    >
                      {/* Image */}
                      <div className="h-40 bg-gray-50 relative overflow-hidden">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Icon className={`w-16 h-16 ${config.color} opacity-30`} />
                          </div>
                        )}
                        
                        {/* Type Badge */}
                        <div className={`absolute top-3 left-3 px-2 py-1 rounded-lg ${config.bgColor} ${config.color} text-xs font-medium flex items-center gap-1`}>
                          <Icon className="w-3 h-3" />
                          {item.type}
                        </div>
                        
                        {/* Actions */}
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-2 rounded-lg bg-white/90 hover:bg-white shadow-sm transition-colors">
                                <MoreVertical className="w-4 h-4 text-[#626a72]" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(item)}>
                                <Edit2 className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => openDeleteDialog(item)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-semibold text-[#1f1f1f] mb-2 line-clamp-1 group-hover:text-[#0070a0] transition-colors">
                          {item.name}
                        </h3>
                        
                        {item.description && (
                          <p className="text-sm text-[#626a72] line-clamp-2 mb-3">
                            {item.description}
                          </p>
                        )}
                        
                        {/* Quick Info */}
                        <div className="flex flex-wrap gap-2">
                          {item.structure_description && (
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                              Structure
                            </span>
                          )}
                          {item.mechanism_description && (
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                              Mechanism
                            </span>
                          )}
                          {item.uses && (
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                              Uses
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Empty State */
              <div className="text-center py-20">
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                  {(() => {
                    const Icon = itemTypeConfig[activeTab].icon;
                    return <Icon className="w-12 h-12 text-[#c2cdd8]" />;
                  })()}
                </div>
                <h3 className="text-xl font-semibold text-[#1f1f1f] mb-2">
                  {searchQuery ? 'No items found' : `No ${itemTypeConfig[activeTab].label.toLowerCase()} yet`}
                </h3>
                <p className="text-[#626a72] mb-6 max-w-md mx-auto">
                  {searchQuery 
                    ? 'Try adjusting your search query'
                    : `Start adding ${itemTypeConfig[activeTab].label.toLowerCase()} to your topic`
                  }
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => {
                      resetForm();
                      setFormData(prev => ({ ...prev, type: activeTab }));
                      setIsCreateDialogOpen(true);
                    }}
                    className="pharma-gradient text-white rounded-xl hover:opacity-90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add {itemTypeConfig[activeTab].label}
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
      
      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setIsEditDialogOpen(false);
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? 'Edit Item' : `Add New ${itemTypeConfig[formData.type]?.label || 'Item'}`}
            </DialogTitle>
            <DialogDescription>
              {isEditDialogOpen ? 'Update the details of this item' : 'Fill in the details for your study item'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            {/* Type Selection (only for create) */}
            {!isEditDialogOpen && (
              <div className="space-y-2">
                <Label>Type</Label>
                <div className="flex gap-2">
                  {(Object.keys(itemTypeConfig) as ItemType[]).map((type) => {
                    const config = itemTypeConfig[type];
                    const Icon = config.icon;
                    return (
                      <button
                        key={type}
                        onClick={() => setFormData({ ...formData, type })}
                        className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                          formData.type === type 
                            ? 'border-[#0070a0] bg-[#0070a0]/5' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${config.color}`} />
                        <span className="text-sm font-medium">{config.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Name with PubChem Search */}
            <div className="space-y-2">
              <Label>Name *</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Aspirin"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="flex-1 border-[#c2cdd8]"
                />
                {!isEditDialogOpen && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setPubchemQuery(formData.name || '');
                      setIsPubChemDialogOpen(true);
                    }}
                    className="whitespace-nowrap"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    PubChem
                  </Button>
                )}
              </div>
            </div>
            
            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="General description..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="border-[#c2cdd8] min-h-[80px]"
              />
            </div>
            
            {/* Image URL */}
            <div className="space-y-2">
              <Label>Image URL</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://..."
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="flex-1 border-[#c2cdd8]"
                />
                {formData.image_url && (
                  <div className="w-10 h-10 rounded-lg border overflow-hidden flex-shrink-0">
                    <img 
                      src={formData.image_url} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            
            {/* Structure Description */}
            <div className="space-y-2">
              <Label>Structure Description</Label>
              <Textarea
                placeholder="Describe the molecular structure..."
                value={formData.structure_description}
                onChange={(e) => setFormData({ ...formData, structure_description: e.target.value })}
                className="border-[#c2cdd8] min-h-[80px]"
              />
            </div>
            
            {/* Mechanism of Action (for medications) */}
            {(formData.type === 'medication' || formData.type === 'enzyme') && (
              <div className="space-y-2">
                <Label>Mechanism of Action</Label>
                <Textarea
                  placeholder="How does it work?"
                  value={formData.mechanism_description}
                  onChange={(e) => setFormData({ ...formData, mechanism_description: e.target.value })}
                  className="border-[#c2cdd8] min-h-[80px]"
                />
              </div>
            )}
            
            {/* Uses (for medications) */}
            {formData.type === 'medication' && (
              <div className="space-y-2">
                <Label>Uses / Indications</Label>
                <Textarea
                  placeholder="What is it used for?"
                  value={formData.uses}
                  onChange={(e) => setFormData({ ...formData, uses: e.target.value })}
                  className="border-[#c2cdd8] min-h-[80px]"
                />
              </div>
            )}
            
            {/* Effects */}
            <div className="space-y-2">
              <Label>Effects / Side Effects</Label>
              <Textarea
                placeholder="What are the effects?"
                value={formData.effects}
                onChange={(e) => setFormData({ ...formData, effects: e.target.value })}
                className="border-[#c2cdd8] min-h-[80px]"
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setIsEditDialogOpen(false);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={isEditDialogOpen ? handleEdit : handleCreate}
                disabled={isSubmitting}
                className="flex-1 pharma-gradient text-white"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEditDialogOpen ? 'Save Changes' : 'Add Item')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* PubChem Search Dialog */}
      <Dialog open={isPubChemDialogOpen} onOpenChange={setIsPubChemDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Search PubChem</DialogTitle>
            <DialogDescription>
              Find compounds from the PubChem database
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search for compounds..."
                value={pubchemQuery}
                onChange={(e) => setPubchemQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchPubChem()}
                className="flex-1 border-[#c2cdd8]"
              />
              <Button
                onClick={handleSearchPubChem}
                disabled={isSearchingPubchem}
                className="pharma-gradient text-white"
              >
                {isSearchingPubchem ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
            
            {pubchemResults.length > 0 && (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {pubchemResults.map((compound) => (
                  <button
                    key={compound.cid}
                    onClick={() => selectPubChemCompound(compound)}
                    className="w-full flex items-center gap-4 p-3 rounded-xl border border-gray-200 hover:border-[#0070a0] hover:bg-[#0070a0]/5 transition-all text-left"
                  >
                    {compound.imageUrl ? (
                      <img 
                        src={compound.imageUrl} 
                        alt={compound.name}
                        className="w-16 h-16 object-contain bg-white rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-[#1f1f1f] truncate">{compound.name}</h4>
                      {compound.molecularFormula && (
                        <p className="text-sm text-[#626a72]">Formula: {compound.molecularFormula}</p>
                      )}
                      {compound.molecularWeight && (
                        <p className="text-sm text-[#626a72]">Weight: {compound.molecularWeight} g/mol</p>
                      )}
                      <p className="text-xs text-[#0070a0]">CID: {compound.cid}</p>
                    </div>
                    <Check className="w-5 h-5 text-[#0070a0]" />
                  </button>
                ))}
              </div>
            )}
            
            {pubchemResults.length === 0 && !isSearchingPubchem && pubchemQuery && (
              <p className="text-center text-[#626a72] py-4">No results found</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedItemForAction?.name}"? This action cannot be undone.
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
