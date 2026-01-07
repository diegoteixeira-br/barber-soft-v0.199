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
const BARBER_SUBHEADER_HEIGHT = 24;

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

  // Filter active barbers
  const activeBarbers = useMemo(() => {
    return barbers.filter(b => b.is_active !== false);
  }, [barbers]);

  // Check if showing all barbers (multi-barber mode)
  const showAllBarbers = selectedBarberId === null && activeBarbers.length > 0;

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
    
    const headerOffset = showAllBarbers ? HEADER_HEIGHT + BARBER_SUBHEADER_HEIGHT : HEADER_HEIGHT;
    const availableHeight = effectiveHeight - headerOffset;
    const calculatedHeight = Math.floor(availableHeight / HOURS.length);
    return Math.max(MIN_HOUR_HEIGHT, calculatedHeight);
  }, [isCompactMode, containerHeight, HOURS.length, showAllBarbers]);

  // Organize appointments by day, barber, and hour for multi-barber mode
  const appointmentsByDayBarberAndHour = useMemo(() => {
    const map: Record<string, Record<string, Record<number, Appointment[]>>> = {};
    
    days.forEach(day => {
      const dayKey = format(day, "yyyy-MM-dd");
      map[dayKey] = {};
      
      activeBarbers.forEach(barber => {
        map[dayKey][barber.id] = {};
        HOURS.forEach(hour => {
          map[dayKey][barber.id][hour] = [];
        });
      });
    });

    appointments.forEach(apt => {
      const aptDate = new Date(apt.start_time);
      const dayKey = format(aptDate, "yyyy-MM-dd");
      const hour = aptDate.getHours();
      const barberId = apt.barber_id;
      
      if (barberId && map[dayKey]?.[barberId]?.[hour]) {
        map[dayKey][barberId][hour].push(apt);
      }
    });

    return map;
  }, [appointments, days, activeBarbers, HOURS]);

  // Original structure for single barber mode
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

  // Calculate column count: time column + 7 days (or days * barbers in multi mode)
  const totalDayColumns = showAllBarbers ? days.length : days.length;

  return (
    <div 
      ref={containerRef}
      data-calendar-container
      className={`flex-1 ${isCompactMode ? 'overflow-hidden' : 'overflow-auto'}`}
    >
      <div className={`h-full flex flex-col ${showAllBarbers ? 'min-w-[1200px]' : 'min-w-[800px]'}`}>
        {/* Header with days */}
        <div 
          className="border-b border-border sticky top-0 bg-card z-10 shrink-0"
          style={{ 
            display: 'grid',
            gridTemplateColumns: showAllBarbers 
              ? `80px repeat(${days.length}, 1fr)` 
              : `80px repeat(7, 1fr)`,
            minHeight: showAllBarbers ? HEADER_HEIGHT + BARBER_SUBHEADER_HEIGHT : HEADER_HEIGHT 
          }}
        >
          <div className="p-2 text-center text-xs text-muted-foreground border-r border-border flex items-center justify-center">
            Horário
          </div>
          {days.map(day => (
            <div
              key={day.toISOString()}
              className={`border-r border-border last:border-r-0 ${
                isToday(day) ? "bg-primary/10" : ""
              }`}
            >
              {/* Day header */}
              <div className="p-2 text-center flex flex-col items-center justify-center" style={{ height: HEADER_HEIGHT }}>
                <p className="text-xs text-muted-foreground capitalize">
                  {format(day, "EEE", { locale: ptBR })}
                </p>
                <p className={`text-lg font-semibold ${isToday(day) ? "text-primary" : ""}`}>
                  {format(day, "d")}
                </p>
              </div>
              
              {/* Barber sub-headers (only in multi-barber mode) */}
              {showAllBarbers && (
                <div 
                  className="grid border-t border-border"
                  style={{ 
                    gridTemplateColumns: `repeat(${activeBarbers.length}, 1fr)`,
                    height: BARBER_SUBHEADER_HEIGHT 
                  }}
                >
                  {activeBarbers.map((barber, idx) => (
                    <div
                      key={barber.id}
                      className={`text-[10px] text-center truncate px-0.5 flex items-center justify-center font-medium ${
                        idx < activeBarbers.length - 1 ? 'border-r border-border/50' : ''
                      }`}
                      style={{ 
                        borderBottom: `3px solid ${barber.calendar_color || '#6366f1'}`,
                        backgroundColor: `${barber.calendar_color || '#6366f1'}15`
                      }}
                      title={barber.name}
                    >
                      {barber.name.split(' ')[0]}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Time slots */}
        <div 
          className={`relative ${isCompactMode ? 'flex-1' : ''}`}
          style={{ 
            display: 'grid',
            gridTemplateColumns: showAllBarbers 
              ? `80px repeat(${days.length}, 1fr)` 
              : `80px repeat(7, 1fr)`
          }}
        >
          {/* Time column */}
          <div className="border-r border-border">
            {HOURS.map(hour => (
              <div
                key={hour}
                className={`border-b border-border p-1 text-xs text-muted-foreground text-right pr-2 flex items-start justify-end ${
                  isWithinBusinessHours(hour) ? "bg-blue-100/40 dark:bg-blue-900/20" : ""
                }`}
                style={{ height: hourHeight }}
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
                {/* Current time indicator */}
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
                  const slotDate = setMinutes(setHours(day, hour), 0);
                  const withinHours = isWithinBusinessHours(hour);

                  if (showAllBarbers) {
                    // Multi-barber mode: sub-columns for each barber
                    return (
                      <div
                        key={hour}
                        className={`border-b border-border grid ${
                          withinHours 
                            ? "bg-blue-100/40 dark:bg-blue-900/20" 
                            : ""
                        } ${isDayToday && withinHours ? "bg-blue-100/50 dark:bg-blue-900/30" : ""}`}
                        style={{ 
                          height: hourHeight,
                          gridTemplateColumns: `repeat(${activeBarbers.length}, 1fr)`
                        }}
                      >
                        {activeBarbers.map((barber, idx) => {
                          const slotAppointments = appointmentsByDayBarberAndHour[dayKey]?.[barber.id]?.[hour] || [];
                          
                          return (
                            <div
                              key={barber.id}
                              className={`p-0.5 cursor-pointer hover:bg-muted/30 transition-colors overflow-hidden ${
                                idx < activeBarbers.length - 1 ? 'border-r border-border/30' : ''
                              }`}
                              onClick={() => onSlotClick(slotDate, barber.id)}
                            >
                              <div className="space-y-0.5 h-full">
                                {slotAppointments.map(apt => (
                                  <CalendarEvent
                                    key={apt.id}
                                    appointment={apt}
                                    onClick={() => onAppointmentClick(apt)}
                                  />
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }

                  // Single barber mode (original behavior)
                  const slotAppointments = appointmentsByDayAndHour[dayKey]?.[hour] || [];

                  return (
                    <div
                      key={hour}
                      className={`border-b border-border p-0.5 cursor-pointer hover:bg-muted/30 transition-colors ${
                        withinHours 
                          ? "bg-blue-100/40 dark:bg-blue-900/20" 
                          : ""
                      } ${isDayToday && withinHours ? "bg-blue-100/50 dark:bg-blue-900/30" : ""}`}
                      style={{ height: hourHeight }}
                      onClick={() => onSlotClick(slotDate)}
                    >
                      <div className="space-y-0.5 overflow-hidden h-full">
                        {slotAppointments.map(apt => (
                          <CalendarEvent
                            key={apt.id}
                            appointment={apt}
                            onClick={() => onAppointmentClick(apt)}
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
  );
}
