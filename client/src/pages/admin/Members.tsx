import { useMemo, useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ArrowLeft, Users, Plus, Edit, Trash2, User, Phone, Building, CreditCard, UserCheck, UserX, Clock3 } from 'lucide-react';

type MemberFormState = {
  username: string;
  password: string;
  name: string;
  phone: string;
  department: string;
  studentId: string;
};

const EMPTY_FORM: MemberFormState = {
  username: '',
  password: '',
  name: '',
  phone: '',
  department: '',
  studentId: '',
};

export default function AdminMembers() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<'approved' | 'pending'>('approved');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [form, setForm] = useState<MemberFormState>(EMPTY_FORM);

  const { data: members, isLoading: membersLoading, refetch: refetchMembers } = trpc.members.list.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'admin',
  });
  const { data: pendingMembers, isLoading: pendingLoading, refetch: refetchPending } = trpc.members.pending.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const refreshAll = async () => {
    await Promise.all([refetchMembers(), refetchPending()]);
  };

  const createMutation = trpc.members.create.useMutation({
    onSuccess: async () => {
      toast.success('회원이 추가되었습니다.');
      await refreshAll();
      setForm(EMPTY_FORM);
      setIsAddOpen(false);
    },
    onError: (error) => toast.error(error.message),
  });

  const updateMutation = trpc.members.update.useMutation({
    onSuccess: async () => {
      toast.success('회원 정보가 수정되었습니다.');
      await refreshAll();
      setForm(EMPTY_FORM);
      setEditingMember(null);
    },
    onError: (error) => toast.error(error.message),
  });

  const approveMutation = trpc.members.approve.useMutation({
    onSuccess: async () => {
      toast.success('회원가입 신청을 승인했습니다.');
      await refreshAll();
    },
    onError: (error) => toast.error(error.message),
  });

  const rejectMutation = trpc.members.reject.useMutation({
    onSuccess: async () => {
      toast.success('회원가입 신청을 반려했습니다.');
      await refreshAll();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = trpc.members.delete.useMutation({
    onSuccess: async () => {
      toast.success('회원이 삭제되었습니다.');
      await refreshAll();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateField = (key: keyof MemberFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => setForm(EMPTY_FORM);

  const handleEdit = (member: any) => {
    setEditingMember(member);
    setForm({
      username: member.username,
      password: '',
      name: member.name,
      phone: member.phone || '',
      department: member.department || '',
      studentId: member.studentId || '',
    });
  };

  const validateForm = (isEdit = false) => {
    if (!isEdit) {
      if (!form.username.trim()) return '아이디를 입력해주세요.';
      if (form.username.trim().length < 2) return '아이디는 2자 이상이어야 합니다.';
      if (!form.password) return '비밀번호를 입력해주세요.';
    }
    if (form.password && form.password.length < 4) return '비밀번호는 4자리 이상이어야 합니다.';
    if (!form.name.trim()) return '이름을 입력해주세요.';
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateForm(Boolean(editingMember));
    if (error) return toast.error(error);

    if (editingMember) {
      updateMutation.mutate({
        id: editingMember.id,
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        department: form.department.trim() || undefined,
        studentId: form.studentId.trim() || undefined,
        password: form.password || undefined,
      });
      return;
    }

    createMutation.mutate({
      username: form.username.trim(),
      password: form.password,
      name: form.name.trim(),
      phone: form.phone.trim() || undefined,
      department: form.department.trim() || undefined,
      studentId: form.studentId.trim() || undefined,
    });
  };

  const activeMembers = useMemo(() => (members ?? []).filter((member: any) => member.approvalStatus !== 'rejected'), [members]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    window.location.href = '/admin/login';
    return null;
  }

  const renderMemberCard = (member: any, mode: 'approved' | 'pending') => (
    <div key={member.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="font-semibold text-foreground">{member.name}</div>
              {mode === 'pending' ? (
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700">승인 대기</span>
              ) : !member.isActive ? (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">비활성</span>
              ) : null}
            </div>
            <div className="truncate text-sm text-muted-foreground">@{member.username}</div>
          </div>
        </div>

        {mode === 'approved' ? (
          <div className="flex shrink-0 items-center gap-1">
            <Dialog open={editingMember?.id === member.id} onOpenChange={(open) => {
              if (!open) {
                setEditingMember(null);
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => handleEdit(member)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>회원 정보 수정</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                  <div className="space-y-1.5">
                    <Label>아이디</Label>
                    <Input value={form.username} disabled />
                  </div>
                  <div className="space-y-1.5">
                    <Label>이름 *</Label>
                    <Input value={form.name} onChange={(e) => updateField('name', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>비밀번호 (변경 시만 입력)</Label>
                    <Input type="password" value={form.password} onChange={(e) => updateField('password', e.target.value)} placeholder="새 비밀번호" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>연락처</Label>
                    <Input value={form.phone} onChange={(e) => updateField('phone', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>학과</Label>
                    <Input value={form.department} onChange={(e) => updateField('department', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>학번</Label>
                    <Input value={form.studentId} onChange={(e) => updateField('studentId', e.target.value)} />
                  </div>
                  <Button className="w-full" type="submit" disabled={updateMutation.isPending}>
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
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ) : (
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Button size="sm" onClick={() => approveMutation.mutate({ id: member.id })} disabled={approveMutation.isPending || rejectMutation.isPending}>
              <UserCheck className="mr-1 h-4 w-4" /> 승인
            </Button>
            <Button size="sm" variant="outline" onClick={() => rejectMutation.mutate({ id: member.id })} disabled={approveMutation.isPending || rejectMutation.isPending}>
              <UserX className="mr-1 h-4 w-4" /> 반려
            </Button>
          </div>
        )}
      </div>

      <div className="mt-3 grid gap-1.5 text-sm text-muted-foreground">
        {member.phone ? <div className="flex items-center gap-2"><Phone className="h-4 w-4" />{member.phone}</div> : null}
        {member.department ? <div className="flex items-center gap-2"><Building className="h-4 w-4" />{member.department}</div> : null}
        {member.studentId ? <div className="flex items-center gap-2"><CreditCard className="h-4 w-4" />{member.studentId}</div> : null}
        {!member.phone && !member.department && !member.studentId ? <div>추가 정보 없음</div> : null}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur">
        <div className="container flex h-14 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="mr-1 shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="truncate font-semibold">회원 관리</h1>
          </div>
          <Dialog open={isAddOpen} onOpenChange={(open) => {
            setIsAddOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="shrink-0">
                <Plus className="mr-1 h-4 w-4" /> 추가
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>관리자 직접 계정 발급</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                <div className="space-y-1.5"><Label>아이디 *</Label><Input value={form.username} onChange={(e) => updateField('username', e.target.value)} /></div>
                <div className="space-y-1.5"><Label>비밀번호 *</Label><Input type="password" value={form.password} onChange={(e) => updateField('password', e.target.value)} /></div>
                <div className="space-y-1.5"><Label>이름 *</Label><Input value={form.name} onChange={(e) => updateField('name', e.target.value)} /></div>
                <div className="space-y-1.5"><Label>연락처</Label><Input value={form.phone} onChange={(e) => updateField('phone', e.target.value)} /></div>
                <div className="space-y-1.5"><Label>학과</Label><Input value={form.department} onChange={(e) => updateField('department', e.target.value)} /></div>
                <div className="space-y-1.5"><Label>학번</Label><Input value={form.studentId} onChange={(e) => updateField('studentId', e.target.value)} /></div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>{createMutation.isPending ? '추가 중...' : '회원 추가'}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container space-y-4 py-5 sm:py-6">
        <Card className="elegant-card overflow-hidden">
          <CardContent className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
            <div className="rounded-2xl bg-primary/5 p-4">
              <div className="text-sm text-muted-foreground">승인된 회원</div>
              <div className="mt-1 text-2xl font-bold text-foreground">{activeMembers.length}</div>
            </div>
            <div className="rounded-2xl bg-amber-500/10 p-4">
              <div className="text-sm text-muted-foreground">승인 대기</div>
              <div className="mt-1 text-2xl font-bold text-foreground">{pendingMembers?.length ?? 0}</div>
            </div>
            <div className="rounded-2xl bg-muted/60 p-4">
              <div className="text-sm text-muted-foreground">관리 방식</div>
              <div className="mt-1 text-sm font-medium text-foreground">회원가입 신청 → 관리자 승인</div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={tab} onValueChange={(value) => setTab(value as 'approved' | 'pending')} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="approved">회원 목록</TabsTrigger>
            <TabsTrigger value="pending">승인 대기</TabsTrigger>
          </TabsList>

          <TabsContent value="approved">
            <Card className="elegant-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-primary" /> 전체 회원 ({activeMembers.length}명)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {membersLoading ? (
                  <div className="py-10 text-center text-muted-foreground">회원 정보를 불러오는 중...</div>
                ) : activeMembers.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground">등록된 회원이 없습니다.</div>
                ) : (
                  <div className="space-y-3">{activeMembers.map((member: any) => renderMemberCard(member, 'approved'))}</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending">
            <Card className="elegant-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock3 className="h-5 w-5 text-amber-600" /> 관리자 승인 탭 ({pendingMembers?.length ?? 0}건)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingLoading ? (
                  <div className="py-10 text-center text-muted-foreground">신청 내역을 불러오는 중...</div>
                ) : !pendingMembers || pendingMembers.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground">승인 대기 중인 회원가입 신청이 없습니다.</div>
                ) : (
                  <div className="space-y-3">{pendingMembers.map((member: any) => renderMemberCard(member, 'pending'))}</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
