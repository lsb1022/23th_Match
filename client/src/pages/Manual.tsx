import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useMemberAuth } from '@/contexts/MemberAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, BookOpen, FileText } from 'lucide-react';
import { Streamdown } from 'streamdown';

export default function Manual() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useMemberAuth();

  const { data: manuals = [], isLoading } = trpc.manuals.list.useQuery();

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  // Group manuals by category
  const groupedManuals = manuals.reduce((acc, manual) => {
    if (!acc[manual.category]) {
      acc[manual.category] = [];
    }
    acc[manual.category].push(manual);
    return acc;
  }, {} as Record<string, typeof manuals>);

  const categoryLabels: Record<string, string> = {
    basic: '기본 안내',
    duty: '업무 가이드',
    emergency: '비상 상황',
    etc: '기타',
  };

  const displayManuals = groupedManuals;

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
          <h1 className="font-semibold">지킴이 메뉴얼</h1>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">메뉴얼을 불러오는 중...</p>
            </div>
          </div>
        )}

        {!isLoading && (
          <>
            {/* Intro Card */}
            <Card className="elegant-card overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500/10 to-primary/10 p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/80 flex items-center justify-center">
                    <BookOpen className="w-7 h-7 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      학생회실 지킴이 가이드
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      업무 수행에 필요한 모든 정보를 확인하세요
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Manual Sections */}
            {Object.entries(displayManuals).length === 0 ? (
              <Card className="elegant-card">
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">
                    등록된 메뉴얼이 없습니다.
                  </p>
                </CardContent>
              </Card>
            ) : (
              Object.entries(displayManuals).map(([category, items]) => (
                <Card key={category} className="elegant-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      {categoryLabels[category] || category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Accordion type="single" collapsible className="w-full">
                      {items?.map((manual: any, index: number) => (
                        <AccordionItem key={manual.id || index} value={`item-${index}`}>
                          <AccordionTrigger className="text-left hover:no-underline">
                            <span className="font-medium">{manual.title}</span>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="prose prose-sm max-w-none text-muted-foreground">
                              <Streamdown>{manual.content}</Streamdown>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))
            )}
          </>
        )}
      </main>
    </div>
  );
}
