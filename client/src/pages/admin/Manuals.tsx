import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, Edit2, BookOpen } from 'lucide-react';
import { useState } from 'react';

const DEFAULT_CATEGORIES: Array<{ value: string; label: string }> = [];

function getCategories(): typeof DEFAULT_CATEGORIES {
  try {
    const stored = localStorage.getItem('manualCategories');
    return stored ? JSON.parse(stored) : DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

function setCategories(categories: typeof DEFAULT_CATEGORIES): void {
  localStorage.setItem('manualCategories', JSON.stringify(categories));
}

export default function AdminManuals() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    content: '',
    orderIndex: '0',
  });

  const { data: manuals, refetch } = trpc.manuals.list.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const createMutation = trpc.manuals.create.useMutation({
    onSuccess: () => {
      toast.success('메뉴얼이 추가되었습니다.');
      setIsAddOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.manuals.update.useMutation({
    onSuccess: () => {
      toast.success('메뉴얼이 수정되었습니다.');
      setEditingId(null);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.manuals.delete.useMutation({
    onSuccess: () => {
      toast.success('메뉴얼이 삭제되었습니다.');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      category: '',
      content: '',
      orderIndex: '0',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.category || !formData.content) {
      toast.error('필수 항목을 입력해주세요.');
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        title: formData.title,
        category: formData.category,
        content: formData.content,
        orderIndex: parseInt(formData.orderIndex) || 0,
      });
    } else {
      createMutation.mutate({
        title: formData.title,
        category: formData.category,
        content: formData.content,
        orderIndex: parseInt(formData.orderIndex) || 0,
      });
    }
  };

  const handleEdit = (manual: any) => {
    setFormData({
      title: manual.title,
      category: manual.category,
      content: manual.content,
      orderIndex: manual.orderIndex?.toString() || '0',
    });
    setEditingId(manual.id);
    setIsAddOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      deleteMutation.mutate({ id });
    }
  };

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

  // Group manuals by category
  const groupedManuals = manuals?.reduce((acc, manual) => {
    if (!acc[manual.category]) {
      acc[manual.category] = [];
    }
    acc[manual.category].push(manual);
    return acc;
  }, {} as Record<string, typeof manuals>);

  const categoryLabels: Record<string, string> = {
    basic: '기본 안내',
    duty: '업무 가이드',
    emergency: '비상 상황',
    etc: '기타',
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin')}
              className="mr-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-semibold">메뉴얼 관리</h1>
          </div>
          <Dialog open={isAddOpen} onOpenChange={(open) => {
            setIsAddOpen(open);
            if (!open) {
              resetForm();
              setEditingId(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                추가
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? '메뉴얼 수정' : '메뉴얼 추가'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>제목 *</Label>
                  <Input
                    placeholder="메뉴얼 제목 입력"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>카테고리 *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="카테고리 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {getCategories().map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>내용 * (마크다운 지원)</Label>
                  <Textarea
                    placeholder="메뉴얼 내용 입력 (마크다운 형식 지원)"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label>순서</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.orderIndex}
                    onChange={(e) => setFormData({ ...formData, orderIndex: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingId ? '수정' : '추가'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Info Card */}
        <Card className="elegant-card overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500/10 to-primary/10 p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/80 flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  지킴이 메뉴얼 관리
                </h2>
                <p className="text-sm text-muted-foreground">
                  총 {manuals?.length || 0}개의 메뉴얼을 관리 중입니다
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Manuals by Category */}
        {groupedManuals && Object.keys(groupedManuals).length > 0 ? (
          Object.entries(groupedManuals).map(([category, categoryManuals]) => (
            <Card key={category} className="elegant-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{categoryLabels[category] || category}</CardTitle>
                <CardDescription>{categoryManuals?.length || 0}개</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {categoryManuals?.map((manual: any) => (
                    <div
                      key={manual.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{manual.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          순서: {manual.orderIndex} | 상태: {manual.isPublished ? '공개' : '비공개'}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {manual.content}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(manual)}
                          className="h-8 w-8"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(manual.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="elegant-card">
            <CardContent className="py-8 text-center text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>등록된 메뉴얼이 없습니다.</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
