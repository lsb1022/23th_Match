import { trpc } from '@/lib/trpc';
import { useMemberAuth } from '@/contexts/MemberAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Package, Search, MapPin, Box } from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'wouter';

export default function Items() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useMemberAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: items = [], isLoading } = trpc.items.list.useQuery();

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  // Filter items by search query
  const filteredItems = searchQuery
    ? items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  const categoryIcons: Record<string, string> = {
    '사무용품': '📎',
    '전자기기': '💻',
    '청소도구': '🧹',
    '음료/간식': '☕',
    '기타': '📦',
  };

  const displayItems = groupedItems;

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
          <h1 className="font-semibold">물품 위치</h1>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">물품 정보를 불러오는 중...</p>
            </div>
          </div>
        )}

        {!isLoading && (
          <>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="물품명 또는 위치 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-card"
              />
            </div>

            {/* Search Results */}
            {filteredItems && (
              <Card className="elegant-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    검색 결과 ({filteredItems.length}건)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredItems.length === 0 ? (
                    <p className="text-center py-4 text-muted-foreground">
                      검색 결과가 없습니다.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {filteredItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                        >
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Box className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {item.name}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              {item.location}
                            </div>
                          </div>
                          {item.quantity && (
                            <span className="text-xs text-muted-foreground">
                              {item.quantity}개
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Items by Category */}
            {!searchQuery && (
              <>
                {/* Intro Card */}
                <Card className="elegant-card overflow-hidden">
                  <div className="bg-gradient-to-r from-rose-500/10 to-primary/10 p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-white/80 flex items-center justify-center">
                        <Package className="w-7 h-7 text-rose-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-foreground">
                          학생회실 물품 안내
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          물품의 위치와 수량을 확인하세요
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                {Object.entries(displayItems).length === 0 ? (
                  <Card className="elegant-card">
                    <CardContent className="py-8">
                      <p className="text-center text-muted-foreground">
                        등록된 물품이 없습니다.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  Object.entries(displayItems).map(([category, categoryItems]) => (
                    <Card key={category} className="elegant-card">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <span>{categoryIcons[category] || '📦'}</span>
                          {category}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {categoryItems?.map((item: any) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm">{item.name}</div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                  <MapPin className="w-3 h-3" />
                                  {item.location}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {item.quantity && (
                                  <span className="px-2 py-1 rounded-full bg-muted text-xs">
                                    {item.quantity}개
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
