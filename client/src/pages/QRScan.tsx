import { useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, KeyRound, Clock3 } from 'lucide-react';
import { useMemberAuth } from '@/contexts/MemberAuthContext';
import { trpc } from '@/lib/trpc';

export default function QRScan() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useMemberAuth();
  const qrCode = useMemo(() => new URLSearchParams(window.location.search).get('code') || '', []);

  useEffect(() => {
    if (!qrCode) return;
    if (!isAuthenticated) {
      navigate(`/login?next=${encodeURIComponent(`/qr-scan?code=${encodeURIComponent(qrCode)}`)}`);
    }
  }, [isAuthenticated, navigate, qrCode]);

  const { data: scanInfo, isLoading, error } = trpc.qr.getScanInfo.useQuery(
    { qrCode },
    {
      enabled: !!qrCode && isAuthenticated,
      refetchInterval: 5000,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      staleTime: 0,
    },
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-2 border-primary/20">
          <CardContent className="py-10 text-center text-muted-foreground">로그인 페이지로 이동하는 중...</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            돌아가기
          </Button>
        </div>

        <Card className="elegant-card border-2 border-primary/20">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl">QR 출석 안내</CardTitle>
            <div className="mt-3 space-y-1">
              <CardDescription className="text-sm">QR이 확인되었습니다.</CardDescription>
              <p className="text-base font-medium text-foreground">현재 시간대 4자리 인증 코드를 확인하세요.</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="text-center py-10 text-muted-foreground">인증 코드를 불러오는 중...</div>
            ) : error ? (
              <div className="text-center py-10 text-red-500">{error.message}</div>
            ) : (
              <>
                <div className="p-5 rounded-xl bg-primary/5 border border-primary/10 text-center">
                  <div className="text-xs text-muted-foreground mb-2 flex items-center justify-center gap-1">
                    <KeyRound className="w-3.5 h-3.5" />
                    현재 시간대 4자리 인증 코드
                  </div>
                  <div className="font-mono text-5xl tracking-[0.3em] text-primary font-bold pl-[0.3em]">
                    {scanInfo?.currentCode ?? '----'}
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    {scanInfo?.currentTimeSlotLabel ? `${scanInfo.currentTimeSlotLabel} 시간대 코드` : '현재 출석 가능한 시간대가 아닙니다.'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-muted/50 border space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock3 className="w-4 h-4" />
                    현재 기준 시각
                  </div>
                  <div className="font-medium">{scanInfo?.currentTimeLabel ?? '-'}</div>
                  {scanInfo?.nextChangeTimeLabel && (
                    <div className="text-xs text-muted-foreground">다음 코드 변경: {scanInfo.nextChangeTimeLabel}</div>
                  )}
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  아래 버튼을 누르면 고정 QR과 현재 시간대 인증 코드가 적용된 출석 페이지로 이동합니다.
                </p>

                <Button
                  className="w-full"
                  onClick={() => navigate(`/attendance?code=${encodeURIComponent(qrCode)}&pin=${encodeURIComponent(scanInfo?.currentCode ?? '')}`)}
                  disabled={!qrCode || !scanInfo?.currentCode}
                >
                  출석 페이지로 이동
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
