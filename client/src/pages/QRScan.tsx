import { useMemo } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, ArrowLeft, LogIn } from 'lucide-react';
import { useMemberAuth } from '@/contexts/MemberAuthContext';

export default function QRScan() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useMemberAuth();
  const code = useMemo(() => new URLSearchParams(window.location.search).get('code') || '', []);

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
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-primary/10">
                <QrCode className="w-8 h-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">QR 출석 안내</CardTitle>
            <CardDescription className="mt-2">학생회실 출석용 QR이 확인되었습니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-muted/50 border">
              <div className="text-xs text-muted-foreground mb-1">인식된 QR 코드</div>
              <div className="font-mono break-all text-sm">{code || '코드가 없습니다.'}</div>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {isAuthenticated ? '아래 버튼을 누르면 QR 코드가 자동으로 입력된 출석 페이지로 이동합니다.' : '로그인 후 QR 코드가 자동 입력된 출석 페이지에서 출석을 진행하세요.'}
            </p>
            <Button className="w-full" onClick={() => navigate(`/attendance?code=${encodeURIComponent(code)}`)} disabled={!code}>
              {isAuthenticated ? '출석 페이지로 이동' : <><LogIn className="w-4 h-4 mr-2" />로그인 후 출석 페이지로 이동</>}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
