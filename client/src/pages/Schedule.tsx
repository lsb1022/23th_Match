import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useMemberAuth } from '@/contexts/MemberAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, User, Clock } from 'lucide-react';

export default function Schedule() {
  const [, navigate] = useLocation();
  const { member, isAuthenticated } = useMemberAuth();

  const { data: schedules, isLoading } = trpc.schedule.list.useQuery();

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const dayNames = ['', '월', '화', '수', '목', '금'];
  const timeSlots = [
    { slot: 1, label: '12:00 - 13:30' },
    { slot: 2, label: '13:30 - 15:00' },
    { slot: 3, label: '15:00 - 16:30' },
    { slot: 4, label: '16:30 - 18:00' },
  ];

  // Create schedule matrix
  const scheduleMatrix: Record<number, Record<number, any>> = {};
  for (let day = 1; day <= 5; day++) {
    scheduleMatrix[day] = {};
    for (let slot = 1; slot <= 4; slot++) {
      const schedule = schedules?.find(
        (s) => s.dayOfWeek === day && s.timeSlot === slot
      );
      scheduleMatrix[day][slot] = schedule;
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container flex items-center h-14">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="mr-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold">주간 스케줄</h1>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">스케줄을 불러오는 중...</p>
            </div>
          </div>
        )}

        {!isLoading && (
          <>
        {/* Intro Card */}
        <Card className="elegant-card overflow-hidden">
          <div className="bg-gradient-to-r from-cyan-500/10 to-primary/10 p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/80 flex items-center justify-center">
                <Calendar className="w-7 h-7 text-cyan-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  이번 주 지킴이 배정표
                </h2>
                <p className="text-sm text-muted-foreground">
                  각 시간대별 담당자를 확인하세요
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Schedule Grid - Mobile Optimized */}
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((day) => (
            <Card key={day} className="elegant-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {dayNames[day]}
                  </span>
                  {dayNames[day]}요일
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {timeSlots.map((slot) => {
                    const schedule = scheduleMatrix[day]?.[slot.slot];
                    const isMySchedule = schedule?.memberId === member?.id;

                    return (
                      <div
                        key={slot.slot}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          isMySchedule
                            ? 'border-primary/30 bg-primary/5'
                            : 'border-border'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {slot.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {schedule?.member ? (
                            <>
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span
                                className={`text-sm ${
                                  isMySchedule
                                    ? 'font-semibold text-primary'
                                    : 'text-foreground'
                                }`}
                              >
                                {schedule.member.name}
                                {isMySchedule && ' (나)'}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              미배정
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary/30" />
            <span>내 스케줄</span>
          </div>
        </div>
          </>
        )}
      </main>
    </div>
  );
}
