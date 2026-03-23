import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useMemberAuth } from '@/contexts/MemberAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Shield, User, Lock, ArrowRight } from 'lucide-react';

export default function Login() {
  const [, navigate] = useLocation();
  const { login, refetchMember } = useMemberAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const loginMutation = trpc.memberAuth.login.useMutation({
    onSuccess: async (data) => {
      login(data.member);
      await refetchMember();
      toast.success(`${data.member.name}님, 환영합니다!`);
      navigate('/');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }
    loginMutation.mutate({ username, password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 px-4 py-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-md flex-col gap-5">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 sm:h-16 sm:w-16">
            <Shield className="h-7 w-7 text-primary sm:h-8 sm:w-8" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">학생회실 지킴이</h1>
          <p className="mt-2 text-sm text-muted-foreground">글로벌미디어학부 학생회 출석 관리 시스템</p>
        </div>

        <Card className="elegant-card border-0 shadow-lg">
          <CardHeader className="pb-3 pt-5 sm:pb-4">
            <CardTitle className="text-center text-xl">로그인</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-sm font-medium">아이디</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="아이디를 입력하세요"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-11 border-0 bg-secondary/50 pl-10 transition-colors focus:bg-background"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium">비밀번호</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="비밀번호를 입력하세요"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 border-0 bg-secondary/50 pl-10 transition-colors focus:bg-background"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <Button type="submit" className="mt-1 h-11 w-full font-medium" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    로그인 중...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    로그인
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="rounded-2xl border border-border/60 bg-card/70 px-4 py-3 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">
            계정이 없으신가요?{' '}
            <Link href="/signup" className="font-semibold text-primary underline-offset-4 hover:underline">
              회원가입하세요.
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
