import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, Edit2, Tag } from 'lucide-react';
import { useState } from 'react';

const DEFAULT_ITEM_CATEGORIES: string[] = [];
const DEFAULT_MANUAL_CATEGORIES: Array<{ value: string; label: string }> = [];

export default function AdminCategories() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  
  // localStorage에서 카테고리 로드
  const [itemCategories, setItemCategories] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('itemCategories');
      return stored ? JSON.parse(stored) : DEFAULT_ITEM_CATEGORIES;
    } catch {
      return DEFAULT_ITEM_CATEGORIES;
    }
  });
  
  const [manualCategories, setManualCategories] = useState(() => {
    try {
      const stored = localStorage.getItem('manualCategories');
      return stored ? JSON.parse(stored) : DEFAULT_MANUAL_CATEGORIES;
    } catch {
      return DEFAULT_MANUAL_CATEGORIES;
    }
  });
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isAddManualOpen, setIsAddManualOpen] = useState(false);
  const [editingItemIdx, setEditingItemIdx] = useState<number | null>(null);
  const [editingManualIdx, setEditingManualIdx] = useState<number | null>(null);
  const [newItemCategory, setNewItemCategory] = useState('');
  const [newManualValue, setNewManualValue] = useState('');
  const [newManualLabel, setNewManualLabel] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    window.location.href = "/admin/login";
    return null;
  }

  // Item Categories
  const handleAddItemCategory = () => {
    if (!newItemCategory.trim()) {
      toast.error('카테고리명을 입력해주세요.');
      return;
    }
    if (itemCategories.includes(newItemCategory)) {
      toast.error('이미 존재하는 카테고리입니다.');
      return;
    }
    const updated = [...itemCategories, newItemCategory];
    setItemCategories(updated);
    localStorage.setItem('itemCategories', JSON.stringify(updated));
    setNewItemCategory('');
    setIsAddItemOpen(false);
    toast.success('카테고리가 추가되었습니다.');
  };

  const handleEditItemCategory = (idx: number, newName: string) => {
    if (!newName.trim()) {
      toast.error('카테고리명을 입력해주세요.');
      return;
    }
    const updated = [...itemCategories];
    updated[idx] = newName;
    setItemCategories(updated);
    localStorage.setItem('itemCategories', JSON.stringify(updated));
    setEditingItemIdx(null);
    toast.success('카테고리가 수정되었습니다.');
  };

  const handleDeleteItemCategory = (idx: number) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      const updated = itemCategories.filter((_, i) => i !== idx);
      setItemCategories(updated);
      localStorage.setItem('itemCategories', JSON.stringify(updated));
      toast.success('카테고리가 삭제되었습니다.');
    }
  };

  // Manual Categories
  const handleAddManualCategory = () => {
    if (!newManualValue.trim() || !newManualLabel.trim()) {
      toast.error('모든 항목을 입력해주세요.');
      return;
    }
    if (manualCategories.some((cat: any) => cat.value === newManualValue)) {
      toast.error('이미 존재하는 카테고리입니다.');
      return;
    }
    const updated = [...manualCategories, { value: newManualValue, label: newManualLabel }];
    setManualCategories(updated);
    localStorage.setItem('manualCategories', JSON.stringify(updated));
    setNewManualValue('');
    setNewManualLabel('');
    setIsAddManualOpen(false);
    toast.success('카테고리가 추가되었습니다.');
  };

  const handleEditManualCategory = (idx: number, newValue: string, newLabel: string) => {
    if (!newValue.trim() || !newLabel.trim()) {
      toast.error('모든 항목을 입력해주세요.');
      return;
    }
    const updated = [...manualCategories];
    updated[idx] = { value: newValue, label: newLabel };
    setManualCategories(updated);
    localStorage.setItem('manualCategories', JSON.stringify(updated));
    setEditingManualIdx(null);
    toast.success('카테고리가 수정되었습니다.');
  };

  const handleDeleteManualCategory = (idx: number) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      const updated = manualCategories.filter((_: any, i: number) => i !== idx);
      setManualCategories(updated);
      localStorage.setItem('manualCategories', JSON.stringify(updated));
      toast.success('카테고리가 삭제되었습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container flex items-center h-14">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin')}
            className="mr-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold">카테고리 관리</h1>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Info Card */}
        <Card className="elegant-card overflow-hidden">
          <div className="bg-gradient-to-r from-cyan-500/10 to-primary/10 p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/80 flex items-center justify-center">
                <Tag className="w-7 h-7 text-cyan-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  카테고리 관리
                </h2>
                <p className="text-sm text-muted-foreground">
                  물품과 메뉴얼의 카테고리를 관리합니다
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="items" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="items">물품 카테고리</TabsTrigger>
            <TabsTrigger value="manuals">메뉴얼 카테고리</TabsTrigger>
          </TabsList>

          {/* Items Categories */}
          <TabsContent value="items" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    추가
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>물품 카테고리 추가</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>카테고리명</Label>
                      <Input
                        placeholder="카테고리명 입력"
                        value={newItemCategory}
                        onChange={(e) => setNewItemCategory(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleAddItemCategory} className="w-full">
                      추가
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-2">
              {itemCategories.map((category: string, idx: number) => (
                <Card key={idx} className="elegant-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      {editingItemIdx === idx ? (
                        <div className="flex-1 flex gap-2">
                          <Input
                            defaultValue={category}
                            onBlur={(e) => handleEditItemCategory(idx, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleEditItemCategory(idx, (e.target as HTMLInputElement).value);
                              }
                            }}
                            autoFocus
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingItemIdx(null)}
                          >
                            완료
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="font-medium">{category}</span>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingItemIdx(idx)}
                              className="h-8 w-8"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteItemCategory(idx)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Manuals Categories */}
          <TabsContent value="manuals" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isAddManualOpen} onOpenChange={setIsAddManualOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    추가
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>메뉴얼 카테고리 추가</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>카테고리 코드</Label>
                      <Input
                        placeholder="예: basic, duty"
                        value={newManualValue}
                        onChange={(e) => setNewManualValue(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>카테고리명</Label>
                      <Input
                        placeholder="예: 기본 안내"
                        value={newManualLabel}
                        onChange={(e) => setNewManualLabel(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleAddManualCategory} className="w-full">
                      추가
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-2">
              {manualCategories.map((category: any, idx: number) => (
                <Card key={idx} className="elegant-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      {editingManualIdx === idx ? (
                        <div className="flex-1 flex gap-2">
                          <Input
                            defaultValue={category.value}
                            placeholder="코드"
                            onBlur={(e) => {
                              const label = manualCategories[idx].label;
                              handleEditManualCategory(idx, e.target.value, label);
                            }}
                            className="flex-1"
                          />
                          <Input
                            defaultValue={category.label}
                            placeholder="이름"
                            onBlur={(e) => {
                              const value = manualCategories[idx].value;
                              handleEditManualCategory(idx, value, e.target.value);
                            }}
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingManualIdx(null)}
                          >
                            완료
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div>
                            <div className="font-medium">{category.label}</div>
                            <div className="text-xs text-muted-foreground">{category.value}</div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingManualIdx(idx)}
                              className="h-8 w-8"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteManualCategory(idx)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
