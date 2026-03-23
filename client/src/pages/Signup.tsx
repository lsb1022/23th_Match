import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Shield, UserPlus } from 'lucide-react';

export default function Signup() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState({
    username: '',
    password: '',
    name: '',
    phone: '',
    department: '',
    studentId: '',
  });

  const signupMutation = trpc.memberAuth.signup.useMutation({
    onSuccess: () => {
      toast.success('회원가입 신청이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다.');
      navigate('/login');
    },
    onError: (error) => toast.error(error.message),
  });

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim()) return toast.error('아이디를 입력해주세요.');
    if (form.username.trim().length < 2) return toast.error('아이디는 2자 이상이어야 합니다.');
    if (!form.password) return toast.error('비밀번호를 입력해주세요.');
    if (form.password.length < 4) return toast.error('비밀번호는 4자리 이상이어야 합니다.');
    if (!form.name.trim()) return toast.error('이름을 입력해주세요.');

    signupMutation.mutate({
      username: form.username.trim(),
      password: form.password,
      name: form.name.trim(),
      phone: form.phone.trim() || undefined,
      department: form.department.trim() || undefined,
      studentId: form.studentId.trim() || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 px-4 py-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        <Button variant="ghost" className="w-fit px-0" onClick={() => navigate('/login')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> 로그인으로 돌아가기
        </Button>

        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">회원가입 신청</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            글로벌미디어학부 학생회 임원진 확인 후 계정이 승인됩니다.
          </p>
        </div>

        <Card className="elegant-card border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-lg">신청 정보 입력</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="username">아이디 *</Label>
                  <Input id="username" value={form.username} onChange={(e) => updateField('username', e.target.value)} placeholder="로그인에 사용할 아이디" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="password">비밀번호 *</Label>
                  <Input id="password" type="password" value={form.password} onChange={(e) => updateField('password', e.target.value)} placeholder="4자리 이상 입력" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="name">이름 *</Label>
                  <Input id="name" value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder="실명을 입력하세요" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="studentId">학번</Label>
                  <Input id="studentId" value={form.studentId} onChange={(e) => updateField('studentId', e.target.value)} placeholder="예: 20253307" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="department">학과</Label>
                  <Input id="department" value={form.department} onChange={(e) => updateField('department', e.target.value)} placeholder="글로벌미디어학부" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="phone">연락처</Label>
                  <Input id="phone" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="010-0000-0000" />
                </div>
              </div>

              <Button type="submit" className="h-11 w-full" disabled={signupMutation.isPending}>
                {signupMutation.isPending ? (
                  '신청 중...'
                ) : (
                  <span className="flex items-center gap-2">
                    회원가입 신청하기
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            로그인하세요.
          </Link>
        </p>
      </div>
    </div>
  );
}
