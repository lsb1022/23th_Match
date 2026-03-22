import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  QrCode, 
  RefreshCw, 
  Clock,
  ArrowLeft,
  Copy,
  CheckCircle2
} from 'lucide-react';

export default function QRManagement() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // 현재 코드 조회
  const { data: codeData, refetch: refetchCode, isLoading } = trpc.qr.getCurrentCode.useQuery(undefined, {
    refetchInterval: 5000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  // 코드 강제 생성
  const forceGenerateMutation = trpc.qr.forceGenerateCode.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetchCode();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // 자동 새로고침 - 30초마다
  useEffect(() => {
    const interval = setInterval(() => {
      refetchCode();
    }, 30000);
    return () => clearInterval(interval);
  }, [refetchCode]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('코드가 복사되었습니다');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleForceGenerate = () => {
    if (confirm('현재 시간대 인증 코드를 다시 확인하시겠습니까?')) {
      forceGenerateMutation.mutate();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    navigate('/');
    return null;
  }

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
          <h1 className="font-semibold">QR 코드 관리</h1>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Current Code Display */}
        <Card className="elegant-card border-2 border-primary/20">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary" />
              현재 시간대 인증 코드
            </CardTitle>
            <CardDescription>
              고정 QR을 스캔한 뒤 사용하는 4자리 인증 코드입니다
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">코드를 불러오는 중...</p>
              </div>
            ) : (
              <>
                {/* Current Code */}
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">현재 시간대 코드</div>
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                    <div className="text-6xl font-bold tracking-widest text-primary font-mono text-center mb-4">
                      {codeData?.currentCode || '----'}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => handleCopyCode(codeData?.currentCode || '')}
                    >
                      {copiedCode === codeData?.currentCode ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          복사됨
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          코드 복사
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Next Code */}
                <div className="space-y-3 pt-4 border-t">
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    다음 전환 코드
                  </div>
                  <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                    <div className="text-4xl font-bold tracking-widest text-foreground font-mono text-center mb-2">
                      {codeData?.nextCode || '----'}
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      {codeData?.nextChangeTimeLabel ? (
                        <>변경 예정: {codeData.nextChangeTimeLabel}</>
                      ) : (
                        <>현재 변경 예정 시간이 없습니다.</>
                      )}
                    </p>
                  </div>
                </div>

                {/* Last Updated */}
                <div className="text-xs text-muted-foreground text-center pt-2">
                  {codeData?.currentTime && (
                    <>
                      마지막 업데이트: {codeData.currentTimeLabel || codeData.currentTime}
                    </>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Force Generate Section */}
        <Card className="elegant-card">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-amber-500" />
              코드 강제 생성
            </CardTitle>
            <CardDescription>
              필요시 현재 시간대 기준 코드를 다시 확인합니다
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-sm text-amber-900">
                <span className="font-semibold">⚠️ 주의:</span> 고정 QR에서는 시간대별 4자리 인증 코드가 자동 계산됩니다. 이 버튼은 현재 값을 다시 불러오는 용도입니다.
              </p>
            </div>

            <Button
              onClick={handleForceGenerate}
              disabled={forceGenerateMutation.isPending}
              className="w-full h-11 gap-2"
              variant="outline"
            >
              {forceGenerateMutation.isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  현재 코드 다시 확인
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="elegant-card bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="space-y-2 text-sm text-blue-900">
              <p>
                <span className="font-semibold">ℹ️ 정보:</span> 코드는 각 1시간 30분 타임 기준으로 자동 변경됩니다.
              </p>
              <p>
                고정 QR은 그대로 유지되고, 현재 시간대의 4자리 인증 코드만 바뀝니다.
              </p>
              <p>
                사용자는 QR 스캔 후 현재 시간대 인증 코드를 가지고 출석을 진행합니다.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
