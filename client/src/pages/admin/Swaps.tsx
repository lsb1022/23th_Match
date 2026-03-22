import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  User
} from 'lucide-react';

export default function AdminSwaps() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [adminNote, setAdminNote] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  const { data: pendingRequests, isLoading: pendingLoading, refetch: refetchPending } = trpc.swap.getPending.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const { data: allRequests, isLoading: allLoading, refetch: refetchAll } = trpc.swap.listAll.useQuery(
    { limit: 50 },
    { enabled: isAuthenticated && user?.role === 'admin' }
  );

  const isLoading = pendingLoading || allLoading;

  const approveMutation = trpc.swap.approve.useMutation({
    onSuccess: () => {
      toast.success('신청이 승인되었습니다.');
      refetchPending();
      refetchAll();
      closeDialog();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const rejectMutation = trpc.swap.reject.useMutation({
    onSuccess: () => {
      toast.success('신청이 거절되었습니다.');
      refetchPending();
      refetchAll();
      closeDialog();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const closeDialog = () => {
    setSelectedRequest(null);
    setAdminNote('');
    setActionType(null);
  };

  const handleAction = () => {
    if (!selectedRequest) return;
    
    if (actionType === 'approve') {
      approveMutation.mutate({ id: selectedRequest.id, adminNote: adminNote || undefined });
    } else if (actionType === 'reject') {
      rejectMutation.mutate({ id: selectedRequest.id, adminNote: adminNote || undefined });
    }
  };

  const timeSlotLabels: Record<number, string> = {
    1: '12:00-13:30',
    2: '13:30-15:00',
    3: '15:00-16:30',
    4: '16:30-18:00',
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return '승인됨';
      case 'rejected': return '거절됨';
      case 'pending': return '대기중';
      case 'cancelled': return '취소됨';
      default: return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-emerald-500/10 text-emerald-600';
      case 'rejected': return 'bg-red-500/10 text-red-500';
      case 'pending': return 'bg-amber-500/10 text-amber-600';
      case 'cancelled': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
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

  const renderRequestCard = (request: any, showActions = false) => (
    <div key={request.id} className="p-4 rounded-lg border border-border">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="font-medium text-sm">{request.requester?.name}</div>
            <div className="text-xs text-muted-foreground">
              {request.requestType === 'swap' ? '교대 신청' : '대타 신청'}
            </div>
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClass(request.status)}`}>
          {getStatusText(request.status)}
        </span>
      </div>

      <div className="space-y-2 text-sm mb-3">
        <div className="flex justify-between p-2 rounded bg-muted/30">
          <span className="text-muted-foreground">원래 일정</span>
          <span className="font-medium">
            {new Date(request.originalDate).toLocaleDateString('ko-KR')} {timeSlotLabels[request.originalTimeSlot]}
          </span>
        </div>
        {request.swapDate && (
          <div className="flex justify-between p-2 rounded bg-primary/5">
            <span className="text-muted-foreground">교대 일정</span>
            <span className="font-medium">
              {new Date(request.swapDate).toLocaleDateString('ko-KR')} {request.swapTimeSlot && timeSlotLabels[request.swapTimeSlot]}
            </span>
          </div>
        )}
      </div>

      {request.target && (
        <div className="flex justify-between p-2 rounded bg-muted/30 text-sm mb-3">
          <span className="text-muted-foreground">상대/대타자</span>
          <span className="font-medium">{request.target.name}</span>
        </div>
      )}

      {request.reason && (
        <p className="text-xs text-muted-foreground p-2 bg-muted/30 rounded mb-3">
          사유: {request.reason}
        </p>
      )}

      {request.adminNote && (
        <p className="text-xs text-primary p-2 bg-primary/5 rounded mb-3">
          관리자 메모: {request.adminNote}
        </p>
      )}

      {showActions && request.status === 'pending' && (
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1"
            onClick={() => {
              setSelectedRequest(request);
              setActionType('approve');
            }}
          >
            <CheckCircle2 className="w-4 h-4 mr-1" />
            승인
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => {
              setSelectedRequest(request);
              setActionType('reject');
            }}
          >
            <XCircle className="w-4 h-4 mr-1" />
            거절
          </Button>
        </div>
      )}
    </div>
  );

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
          <h1 className="font-semibold">교대/대타 승인</h1>
        </div>
      </header>

      <main className="container py-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">교대/대타 데이터를 불러오는 중...</p>
            </div>
          </div>
        )}

        {!isLoading && pendingRequests && allRequests && (
          <>
            {/* Action Dialog */}
            <Dialog open={!!selectedRequest && !!actionType} onOpenChange={() => closeDialog()}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {actionType === 'approve' ? '신청 승인' : '신청 거절'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="p-3 rounded-lg bg-muted/50 text-sm">
                    <div className="font-medium mb-1">{selectedRequest?.requester?.name}님의 신청</div>
                    <div className="text-muted-foreground">
                      {new Date(selectedRequest?.originalDate).toLocaleDateString('ko-KR')} {timeSlotLabels[selectedRequest?.originalTimeSlot]}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">관리자 메모 (선택)</label>
                    <Textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="메모를 남겨주세요"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={closeDialog}
                    >
                      취소
                    </Button>
                    <Button
                      className="flex-1"
                      variant={actionType === 'reject' ? 'destructive' : 'default'}
                      onClick={handleAction}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                    >
                      {actionType === 'approve' ? '승인하기' : '거절하기'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pending" className="relative">
                  대기 중
                  {pendingRequests && pendingRequests.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center">
                      {pendingRequests.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="all">전체 내역</TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="mt-4">
                <Card className="elegant-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="w-5 h-5 text-amber-500" />
                      승인 대기 ({pendingRequests?.length ?? 0}건)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pendingRequests?.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <ArrowRightLeft className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>대기 중인 신청이 없습니다.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pendingRequests?.map((request) => renderRequestCard(request, true))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="all" className="mt-4">
                <Card className="elegant-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ArrowRightLeft className="w-5 h-5 text-primary" />
                      전체 신청 내역
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {allRequests?.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <ArrowRightLeft className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>신청 내역이 없습니다.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {allRequests?.map((request) => renderRequestCard(request, false))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
}
