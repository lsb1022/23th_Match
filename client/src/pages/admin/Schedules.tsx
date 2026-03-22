import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  ArrowLeft, 
  Calendar,
  Plus,
  Trash2,
  User,
  Clock
} from 'lucide-react';

export default function AdminSchedules() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  // Form states
  const [selectedMember, setSelectedMember] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkAssignments, setBulkAssignments] = useState<Record<number, Record<number, string>>>(
    Object.fromEntries([1, 2, 3, 4, 5].map(day => [day, {}]))
  );

  const { data: schedules, refetch } = trpc.schedule.list.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const { data: members } = trpc.members.list.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const createMutation = trpc.schedule.create.useMutation({
    onSuccess: () => {
      toast.success('스케줄이 추가되었습니다.');
      refetch();
      resetForm();
      setIsAddOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.schedule.delete.useMutation({
    onSuccess: () => {
      toast.success('스케줄이 삭제되었습니다.');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const bulkAssignMutation = trpc.schedule.bulkAssign.useMutation({
    onSuccess: () => {
      toast.success('일괄배정이 완료되었습니다.');
      refetch();
      setIsBulkOpen(false);
      setBulkAssignments(
        Object.fromEntries([1, 2, 3, 4, 5].map(day => [day, {}]))
      );
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setSelectedMember('');
    setSelectedDay('');
    setSelectedSlot('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !selectedDay || !selectedSlot) {
      toast.error('모든 항목을 선택해주세요.');
      return;
    }
    createMutation.mutate({
      memberId: parseInt(selectedMember),
      dayOfWeek: parseInt(selectedDay),
      timeSlot: parseInt(selectedSlot),
    });
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
            <h1 className="font-semibold">스케줄 관리</h1>
          </div>
          <div className="flex gap-2">
            <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Calendar className="w-4 h-4 mr-1" />
                  일괄배정
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>주간 스케줄 일괄배정</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4 max-h-96 overflow-y-auto">
                  {[1, 2, 3, 4, 5].map((day) => (
                    <div key={day} className="space-y-2">
                      <h3 className="font-semibold text-sm">{dayNames[day]}요일</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {timeSlots.map((slot) => (
                          <div key={slot.slot} className="space-y-1">
                            <Label className="text-xs text-muted-foreground">{slot.label}</Label>
                            <Select
                              value={bulkAssignments[day]?.[slot.slot] || ''}
                              onValueChange={(value) => {
                                setBulkAssignments(prev => ({
                                  ...prev,
                                  [day]: {
                                    ...prev[day],
                                    [slot.slot]: value
                                  }
                                }));
                              }}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="선택" />
                              </SelectTrigger>
                              <SelectContent>
                                {members?.filter(m => m.isActive).map((member) => (
                                  <SelectItem key={member.id} value={member.id.toString()}>
                                    {member.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  className="w-full mt-4"
                  onClick={() => {
                    const assignments = [];
                    for (let day = 1; day <= 5; day++) {
                      for (let slot = 1; slot <= 4; slot++) {
                        if (bulkAssignments[day]?.[slot]) {
                          assignments.push({
                            dayOfWeek: day,
                            timeSlot: slot,
                            memberId: parseInt(bulkAssignments[day][slot]),
                          });
                        }
                      }
                    }
                    if (assignments.length === 0) {
                      toast.error('최소 하나 이상의 스케줄을 선택해주세요.');
                      return;
                    }
                    bulkAssignMutation.mutate({ assignments });
                  }}
                  disabled={bulkAssignMutation.isPending}
                >
                  {bulkAssignMutation.isPending ? '배정 중...' : '일괄배정'}
                </Button>
              </DialogContent>
            </Dialog>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  추가
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>스케줄 추가</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>담당자</Label>
                    <Select value={selectedMember} onValueChange={setSelectedMember}>
                      <SelectTrigger>
                        <SelectValue placeholder="담당자 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {members?.filter(m => m.isActive).map((member) => (
                          <SelectItem key={member.id} value={member.id.toString()}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>요일</Label>
                    <Select value={selectedDay} onValueChange={setSelectedDay}>
                      <SelectTrigger>
                        <SelectValue placeholder="요일 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((day) => (
                          <SelectItem key={day} value={day.toString()}>
                            {dayNames[day]}요일
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>시간대</Label>
                    <Select value={selectedSlot} onValueChange={setSelectedSlot}>
                      <SelectTrigger>
                        <SelectValue placeholder="시간대 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((slot) => (
                          <SelectItem key={slot.slot} value={slot.slot.toString()}>
                            {slot.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                    {createMutation.isPending ? '추가 중...' : '스케줄 추가'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Schedule Grid */}
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

                  return (
                    <div
                      key={slot.slot}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        schedule ? 'border-primary/20 bg-primary/5' : 'border-border'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{slot.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {schedule?.member ? (
                          <>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium">
                                {schedule.member.name}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                if (confirm('이 스케줄을 삭제하시겠습니까?')) {
                                  deleteMutation.mutate({ id: schedule.id });
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">미배정</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </main>
    </div>
  );
}
