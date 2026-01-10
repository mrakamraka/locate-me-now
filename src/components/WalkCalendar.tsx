import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, ChevronLeft, ChevronRight, Footprints, MapPin, Coins, X, TrendingUp } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { DailyWalkStats } from '@/hooks/useDailyWalkStats';
import { cn } from '@/lib/utils';

interface WalkCalendarProps {
  dailyStats: DailyWalkStats[];
  fetchMonthStats: (year: number, month: number) => Promise<DailyWalkStats[]>;
}

const WalkCalendar: React.FC<WalkCalendarProps> = ({ dailyStats, fetchMonthStats }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthStats, setMonthStats] = useState<DailyWalkStats[]>([]);
  const [selectedDay, setSelectedDay] = useState<DailyWalkStats | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch stats when month changes
  const loadMonthStats = useCallback(async () => {
    setLoading(true);
    const stats = await fetchMonthStats(currentMonth.getFullYear(), currentMonth.getMonth());
    setMonthStats(stats);
    setLoading(false);
  }, [currentMonth, fetchMonthStats]);

  useEffect(() => {
    loadMonthStats();
  }, [loadMonthStats]);

  // Get days in current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get starting day offset (0 = Sunday)
  const startOffset = getDay(monthStart);

  // Get stats for a specific day
  const getStatsForDay = (date: Date): DailyWalkStats | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return monthStats.find(s => s.date === dateStr);
  };

  // Calculate monthly totals
  const monthlyTotals = {
    steps: monthStats.reduce((sum, s) => sum + s.total_steps, 0),
    distance: monthStats.reduce((sum, s) => sum + Number(s.total_distance_km), 0),
    coins: monthStats.reduce((sum, s) => sum + s.total_coins, 0),
    activeDays: monthStats.length,
  };

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handleDayClick = (date: Date) => {
    const stats = getStatsForDay(date);
    if (stats) {
      setSelectedDay(stats);
      setIsModalOpen(true);
    }
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Get intensity color based on steps
  const getIntensityColor = (steps: number): string => {
    if (steps === 0) return 'bg-crypto-dark/30';
    if (steps < 2000) return 'bg-crypto-green/20 border-crypto-green/30';
    if (steps < 5000) return 'bg-crypto-green/40 border-crypto-green/50';
    if (steps < 10000) return 'bg-crypto-green/60 border-crypto-green/70';
    return 'bg-crypto-green/80 border-crypto-green';
  };

  return (
    <>
      <Card className="bg-crypto-card/80 backdrop-blur-xl border-crypto-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <div className="p-2 rounded-lg bg-crypto-purple/10 border border-crypto-purple/30">
                <Calendar className="w-4 h-4 text-crypto-purple" />
              </div>
              Walk Calendar
            </CardTitle>
            
            {/* Month Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevMonth}
                className="h-8 w-8 text-crypto-muted hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-white font-medium min-w-[120px] text-center">
                {format(currentMonth, 'MMMM yyyy', { locale: enUS })}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextMonth}
                className="h-8 w-8 text-crypto-muted hover:text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Monthly Summary */}
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center p-2 rounded-lg bg-crypto-dark/50 border border-crypto-border">
              <Footprints className="w-3.5 h-3.5 text-crypto-purple mx-auto mb-1" />
              <p className="text-white font-bold text-xs">{monthlyTotals.steps.toLocaleString()}</p>
              <p className="text-crypto-muted text-[10px]">steps</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-crypto-dark/50 border border-crypto-border">
              <MapPin className="w-3.5 h-3.5 text-crypto-blue mx-auto mb-1" />
              <p className="text-white font-bold text-xs">{monthlyTotals.distance.toFixed(1)}</p>
              <p className="text-crypto-muted text-[10px]">km</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-crypto-dark/50 border border-crypto-border">
              <Coins className="w-3.5 h-3.5 text-crypto-gold mx-auto mb-1" />
              <p className="text-white font-bold text-xs">{monthlyTotals.coins.toLocaleString()}</p>
              <p className="text-crypto-muted text-[10px]">coins</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-crypto-dark/50 border border-crypto-border">
              <TrendingUp className="w-3.5 h-3.5 text-crypto-green mx-auto mb-1" />
              <p className="text-white font-bold text-xs">{monthlyTotals.activeDays}</p>
              <p className="text-crypto-muted text-[10px]">active days</p>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="space-y-2">
            {/* Week day headers */}
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map(day => (
                <div key={day} className="text-center text-crypto-muted text-xs font-medium py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for offset */}
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              
              {/* Day cells */}
              {days.map(day => {
                const stats = getStatsForDay(day);
                const hasStats = !!stats;
                const isCurrentDay = isToday(day);
                
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => handleDayClick(day)}
                    disabled={!hasStats}
                    className={cn(
                      "aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all relative border",
                      hasStats 
                        ? `${getIntensityColor(stats.total_steps)} cursor-pointer hover:scale-105` 
                        : 'bg-crypto-dark/20 border-transparent cursor-default',
                      isCurrentDay && 'ring-2 ring-crypto-gold ring-offset-1 ring-offset-crypto-dark',
                      !isSameMonth(day, currentMonth) && 'opacity-30'
                    )}
                  >
                    <span className={cn(
                      "font-medium",
                      hasStats ? 'text-white' : 'text-crypto-muted'
                    )}>
                      {format(day, 'd')}
                    </span>
                    {hasStats && (
                      <span className="text-[8px] text-crypto-muted mt-0.5">
                        {(stats.total_steps / 1000).toFixed(1)}k
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <span className="text-crypto-muted text-[10px]">Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded bg-crypto-dark/30 border border-crypto-border" />
              <div className="w-3 h-3 rounded bg-crypto-green/20 border border-crypto-green/30" />
              <div className="w-3 h-3 rounded bg-crypto-green/40 border border-crypto-green/50" />
              <div className="w-3 h-3 rounded bg-crypto-green/60 border border-crypto-green/70" />
              <div className="w-3 h-3 rounded bg-crypto-green/80 border border-crypto-green" />
            </div>
            <span className="text-crypto-muted text-[10px]">More</span>
          </div>
        </CardContent>
      </Card>

      {/* Day Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-crypto-card border-crypto-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-crypto-purple" />
              {selectedDay && format(new Date(selectedDay.date), 'MMMM d, yyyy', { locale: enUS })}
            </DialogTitle>
          </DialogHeader>
          
          {selectedDay && (
            <div className="space-y-4 pt-2">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-crypto-dark/50 border border-crypto-border text-center">
                  <Footprints className="w-6 h-6 text-crypto-purple mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">
                    {selectedDay.total_steps.toLocaleString()}
                  </p>
                  <p className="text-crypto-muted text-sm">steps</p>
                </div>
                
                <div className="p-4 rounded-xl bg-crypto-dark/50 border border-crypto-border text-center">
                  <MapPin className="w-6 h-6 text-crypto-blue mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">
                    {Number(selectedDay.total_distance_km).toFixed(2)}
                  </p>
                  <p className="text-crypto-muted text-sm">kilometers</p>
                </div>
                
                <div className="p-4 rounded-xl bg-crypto-dark/50 border border-crypto-border text-center">
                  <Coins className="w-6 h-6 text-crypto-gold mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">
                    {selectedDay.total_coins.toLocaleString()}
                  </p>
                  <p className="text-crypto-muted text-sm">coins earned</p>
                </div>
                
                <div className="p-4 rounded-xl bg-crypto-dark/50 border border-crypto-border text-center">
                  <TrendingUp className="w-6 h-6 text-crypto-green mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">
                    {selectedDay.sessions_count}
                  </p>
                  <p className="text-crypto-muted text-sm">sessions</p>
                </div>
              </div>

              {/* Average stats */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-crypto-purple/10 to-crypto-blue/10 border border-crypto-border">
                <p className="text-crypto-muted text-xs text-center">
                  Average: <span className="text-white font-medium">
                    {Math.round(selectedDay.total_steps / selectedDay.sessions_count).toLocaleString()} steps
                  </span> per session
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WalkCalendar;
