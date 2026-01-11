import { useMemo, useState, useRef, useLayoutEffect } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, setHours, setMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarEvent } from "./CalendarEvent";
import { useCurrentTime } from "@/hooks/useCurrentTime";
import type { Appointment } from "@/hooks/useAppointments";

interface Barber {
  id: string;
  name: string;
  calendar_color: string | null;
  is_active: boolean | null;
}

interface CalendarWeekViewProps {
  currentDate: Date;
  appointments: Appointment[];
  onAppointmentClick: (appointment: Appointment) => void;
  onSlotClick: (date: Date, barberId?: string) => void;
  openingTime?: string;
  closingTime?: string;
  timezone?: string;
  isCompactMode?: boolean;
  barbers?: Barber[];
  selectedBarberId?: string | null;
}

const DEFAULT_HOUR_HEIGHT = 80;
const MIN_HOUR_HEIGHT = 32;
const HEADER_HEIGHT = 56;

export function CalendarWeekView({ 
  currentDate, 
  appointments, 
  onAppointmentClick, 
  onSlotClick,
  openingTime,
  closingTime,
  timezone,
  isCompactMode = false,
  barbers = [],
  selectedBarberId = null,
}: CalendarWeekViewProps) {
  const weekStart = startOfWeek(currentDate, { locale: ptBR });
  const weekEnd = endOfWeek(currentDate, { locale: ptBR });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  const { hour: currentHour, minute: currentMinute, isToday } = useCurrentTime(timezone);

  // Check if showing all barbers (use ultra compact mode)
  const showAllBarbers = selectedBarberId === null && barbers.length > 0;

  // Parse opening and closing hours
  const openingHour = openingTime ? parseInt(openingTime.split(":")[0], 10) : 7;
  const closingHour = closingTime ? parseInt(closingTime.split(":")[0], 10) : 21;

  // Generate hours array based on business hours in compact mode
  const HOURS = useMemo(() => {
    if (isCompactMode) {
      return Array.from({ length: closingHour - openingHour }, (_, i) => i + openingHour);
    }
    return Array.from({ length: 14 }, (_, i) => i + 7);
  }, [isCompactMode, openingHour, closingHour]);

  // Calculate dynamic height for compact mode
  const [containerHeight, setContainerHeight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };
    
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(containerRef.current);
    
    return () => observer.disconnect();
  }, []);

  const hourHeight = useMemo(() => {
    if (!isCompactMode) return DEFAULT_HOUR_HEIGHT;
    
    const effectiveHeight = containerHeight > 0 
      ? containerHeight 
      : window.innerHeight - 220;
    
    const availableHeight = effectiveHeight - HEADER_HEIGHT;
    const calculatedHeight = Math.floor(availableHeight / HOURS.length);
    return Math.max(MIN_HOUR_HEIGHT, calculatedHeight);
  }, [isCompactMode, containerHeight, HOURS.length]);

  // Organize appointments by day and hour
  const appointmentsByDayAndHour = useMemo(() => {
    const map: Record<string, Record<number, Appointment[]>> = {};
    
    days.forEach(day => {
      const dayKey = format(day, "yyyy-MM-dd");
      map[dayKey] = {};
      HOURS.forEach(hour => {
        map[dayKey][hour] = [];
      });
    });

    appointments.forEach(apt => {
      const aptDate = new Date(apt.start_time);
      const dayKey = format(aptDate, "yyyy-MM-dd");
      const hour = aptDate.getHours();
      
      if (map[dayKey] && map[dayKey][hour]) {
        map[dayKey][hour].push(apt);
      }
    });

    return map;
  }, [appointments, days, HOURS]);

  // Calculate current time indicator position
  const firstHour = HOURS[0];
  const lastHour = HOURS[HOURS.length - 1];
  const showTimeIndicator = currentHour >= firstHour && currentHour < lastHour + 1;
  const timeIndicatorPosition = (currentHour - firstHour) * hourHeight + (currentMinute / 60) * hourHeight;

  const isWithinBusinessHours = (hour: number) => {
    return hour >= openingHour && hour < closingHour;
  };

  return (
    <div 
      ref={containerRef}
      data-calendar-container
      className="flex-1 flex flex-col overflow-hidden"
    >
      <div className="min-w-[800px] h-full flex flex-col">
        {/* Header with days - FIXED */}
        <div 
          className="grid grid-cols-8 border-b border-border bg-card z-10 shrink-0" 
          style={{ height: HEADER_HEIGHT }}
        >
          <div className="p-2 text-center text-xs text-muted-foreground border-r border-border flex items-center justify-center">
            Horário
          </div>
          {days.map(day => (
            <div
              key={day.toISOString()}
              className={`p-2 text-center border-r border-border last:border-r-0 flex flex-col items-center justify-center ${
                isToday(day) ? "bg-primary/10" : ""
              }`}
            >
              <p className="text-xs text-muted-foreground capitalize">
                {format(day, "EEE", { locale: ptBR })}
              </p>
              <p className={`text-lg font-semibold ${isToday(day) ? "text-primary" : ""}`}>
                {format(day, "d")}
              </p>
            </div>
          ))}
        </div>

        {/* Time slots - SCROLLABLE */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="grid grid-cols-8 relative">
            {/* Time column */}
            <div className="border-r border-border">
              {HOURS.map(hour => (
                <div
                  key={hour}
                  className={`border-b border-border p-1 text-xs text-muted-foreground text-right pr-2 flex items-start justify-end ${
                    isWithinBusinessHours(hour) ? "bg-blue-100/40 dark:bg-blue-900/20" : ""
                  }`}
                  style={{ height: DEFAULT_HOUR_HEIGHT }}
                >
                  {String(hour).padStart(2, "0")}:00
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map((day) => {
              const dayKey = format(day, "yyyy-MM-dd");
              const isDayToday = isToday(day);
              
              return (
                <div key={day.toISOString()} className="border-r border-border last:border-r-0 relative">
                  {/* Current time indicator - only on today's column */}
                  {isDayToday && showTimeIndicator && (
                    <div
                      className="absolute left-0 right-0 z-20 pointer-events-none"
                      style={{ top: `${timeIndicatorPosition}px` }}
                    >
                      <div className="relative flex items-center">
                        <div className="absolute -left-1.5 w-3 h-3 bg-red-500 rounded-full shadow-sm" />
                        <div className="w-full h-0.5 bg-red-500" />
                      </div>
                    </div>
                  )}
                  
                  {HOURS.map(hour => {
                    const slotAppointments = appointmentsByDayAndHour[dayKey]?.[hour] || [];
                    const slotDate = setMinutes(setHours(day, hour), 0);
                    const withinHours = isWithinBusinessHours(hour);

                    return (
                      <div
                        key={hour}
                        className={`border-b border-border p-0.5 cursor-pointer hover:bg-muted/30 transition-colors ${
                          withinHours 
                            ? "bg-blue-100/40 dark:bg-blue-900/20" 
                            : ""
                        } ${isDayToday && withinHours ? "bg-blue-100/50 dark:bg-blue-900/30" : ""}`}
                        style={{ height: DEFAULT_HOUR_HEIGHT }}
                        onClick={() => onSlotClick(slotDate)}
                      >
                        <div className="space-y-0.5 overflow-hidden h-full">
                          {slotAppointments.map(apt => (
                            <CalendarEvent
                              key={apt.id}
                              appointment={apt}
                              onClick={() => onAppointmentClick(apt)}
                              ultraCompact={showAllBarbers}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
