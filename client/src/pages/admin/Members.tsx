import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Users, 
  Plus,
  Edit,
  Trash2,
  User,
  Phone,
  Building,
  CreditCard
} from 'lucide-react';

export default function AdminMembers() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [studentId, setStudentId] = useState('');

  const { data: members, isLoading, refetch } = trpc.members.list.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const createMutation = trpc.members.create.useMutation({
    onSuccess: () => {
      toast.success('회원이 추가되었습니다.');
      refetch();
      resetForm();
      setIsAddOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.members.update.useMutation({
    onSuccess: () => {
      toast.success('회원 정보가 수정되었습니다.');
      refetch();
      resetForm();
      setEditingMember(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.members.delete.useMutation({
    onSuccess: () => {
      toast.success('회원이 삭제되었습니다.');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setName('');
    setPhone('');
    setDepartment('');
    setStudentId('');
  };

  const handleEdit = (member: any) => {
    setEditingMember(member);
    setUsername(member.username);
    setPassword('');
    setName(member.name);
    setPhone(member.phone || '');
    setDepartment(member.department || '');
    setStudentId(member.studentId || '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingMember) {
      if (!name.trim()) {
        toast.error('이름을 입력해주세요.');
        return;
      }
      if (password && password.length < 4) {
        toast.error('비밀번호는 4자리 이상이어야 합니다.');
        return;
      }
      updateMutation.mutate({
        id: editingMember.id,
        name,
        phone: phone || undefined,
        department: department || undefined,
        studentId: studentId || undefined,
        password: password || undefined,
      });
    } else {
      if (!username.trim()) {
        toast.error('아이디를 입력해주세요.');
        return;
      }
      if (username.trim().length < 2) {
        toast.error('아이디는 2자 이상이어야 합니다.');
        return;
      }
      if (!password) {
        toast.error('비밀번호를 입력해주세요.');
        return;
      }
      if (password.length < 4) {
        toast.error('비밀번호는 4자리 이상이어야 합니다.');
        return;
      }
      if (!name.trim()) {
        toast.error('이름을 입력해주세요.');
        return;
      }
      createMutation.mutate({
        username,
        password,
        name,
        phone: phone || undefined,
        department: department || undefined,
        studentId: studentId || undefined,
      });
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
            <h1 className="font-semibold">회원 관리</h1>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                추가
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>새 회원 추가</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>아이디 *</Label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="로그인에 사용할 아이디"
                  />
                </div>
                <div className="space-y-2">
                  <Label>비밀번호 *</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호 (4자리 이상)"
                  />
                </div>
                <div className="space-y-2">
                  <Label>이름 *</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="실명"
                  />
                </div>
                <div className="space-y-2">
                  <Label>연락처</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="010-0000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>학과</Label>
                  <Input
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="소속 학과"
                  />
                </div>
                <div className="space-y-2">
                  <Label>학번</Label>
                  <Input
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="학번"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? '추가 중...' : '회원 추가'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">회원 정보를 불러오는 중...</p>
            </div>
          </div>
        )}

        {!isLoading && (
          <>
            {/* Members List */}
            <Card className="elegant-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  전체 회원 ({members?.length ?? 0}명)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {members?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>등록된 회원이 없습니다.</p>
                    <p className="text-sm">새 회원을 추가해주세요.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {members?.map((member) => (
                      <div
                        key={member.id}
                        className={`p-4 rounded-lg border ${
                          member.isActive ? 'border-border' : 'border-border/50 bg-muted/30'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {member.name}
                                {!member.isActive && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                    비활성
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                @{member.username}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Dialog open={editingMember?.id === member.id} onOpenChange={(open) => {
                              if (!open) setEditingMember(null);
                            }}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(member)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>회원 정보 수정</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                                  <div className="space-y-2">
                                    <Label>아이디</Label>
                                    <Input value={username} disabled />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>이름 *</Label>
                                    <Input
                                      value={name}
                                      onChange={(e) => setName(e.target.value)}
                                      placeholder="실명"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>비밀번호 (변경할 경우만 입력)</Label>
                                    <Input
                                      type="password"
                                      value={password}
                                      onChange={(e) => setPassword(e.target.value)}
                                      placeholder="새 비밀번호 (4자리 이상)"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>연락처</Label>
                                    <Input
                                      value={phone}
                                      onChange={(e) => setPhone(e.target.value)}
                                      placeholder="010-0000-0000"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>학과</Label>
                                    <Input
                                      value={department}
                                      onChange={(e) => setDepartment(e.target.value)}
                                      placeholder="소속 학과"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>학번</Label>
                                    <Input
                                      value={studentId}
                                      onChange={(e) => setStudentId(e.target.value)}
                                      placeholder="학번"
                                    />
                                  </div>
                                  <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
                                    {updateMutation.isPending ? '수정 중...' : '정보 수정'}
                                  </Button>
                                </form>
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm('정말 삭제하시겠습니까?')) {
                                  deleteMutation.mutate({ id: member.id });
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        {member.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <Phone className="w-4 h-4" />
                            {member.phone}
                          </div>
                        )}
                        {member.department && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <Building className="w-4 h-4" />
                            {member.department}
                          </div>
                        )}
                        {member.studentId && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CreditCard className="w-4 h-4" />
                            {member.studentId}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
