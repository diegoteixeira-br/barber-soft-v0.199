import { useMemo, useState, useRef, useLayoutEffect } from "react";
import { format, setHours, setMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarEvent } from "./CalendarEvent";
import { useCurrentTime } from "@/hooks/useCurrentTime";
import type { Appointment } from "@/hooks/useAppointments";
import type { Barber } from "@/hooks/useBarbers";

interface CalendarDayViewProps {
  currentDate: Date;
  appointments: Appointment[];
  barbers: Barber[];
  selectedBarberId: string | null;
  onAppointmentClick: (appointment: Appointment) => void;
  onSlotClick: (date: Date, barberId?: string) => void;
  openingTime?: string;
  closingTime?: string;
  timezone?: string;
  isCompactMode?: boolean;
}

const DEFAULT_HOUR_HEIGHT = 96;
const MIN_HOUR_HEIGHT = 32;
const HEADER_HEIGHT = 64;

export function CalendarDayView({
  currentDate,
  appointments,
  barbers,
  selectedBarberId,
  onAppointmentClick,
  onSlotClick,
  openingTime,
  closingTime,
  timezone,
  isCompactMode = false,
}: CalendarDayViewProps) {
  const activeBarbers = useMemo(
    () => barbers.filter(b => b.is_active && (!selectedBarberId || b.id === selectedBarberId)),
    [barbers, selectedBarberId]
  );

  const { hour: currentHour, minute: currentMinute, isToday } = useCurrentTime(timezone);
  const today = isToday(currentDate);

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
    
    // Use viewport fallback if container height is not yet measured
    const effectiveHeight = containerHeight > 0 
      ? containerHeight 
      : window.innerHeight - 220;
    
    const availableHeight = effectiveHeight - HEADER_HEIGHT;
    const calculatedHeight = Math.floor(availableHeight / HOURS.length);
    return Math.max(MIN_HOUR_HEIGHT, calculatedHeight);
  }, [isCompactMode, containerHeight, HOURS.length]);

  const appointmentsByBarberAndHour = useMemo(() => {
    const map: Record<string, Record<number, Appointment[]>> = {};
    
    activeBarbers.forEach(barber => {
      map[barber.id] = {};
      HOURS.forEach(hour => {
        map[barber.id][hour] = [];
      });
    });

    appointments.forEach(apt => {
      if (!apt.barber_id) return;
      const hour = new Date(apt.start_time).getHours();
      if (map[apt.barber_id] && map[apt.barber_id][hour]) {
        map[apt.barber_id][hour].push(apt);
      }
    });

    return map;
  }, [appointments, activeBarbers, HOURS]);

  // Calculate current time indicator position
  const firstHour = HOURS[0];
  const lastHour = HOURS[HOURS.length - 1];
  const showTimeIndicator = today && currentHour >= firstHour && currentHour < lastHour + 1;
  const timeIndicatorPosition = (currentHour - firstHour) * hourHeight + (currentMinute / 60) * hourHeight;

  const isWithinBusinessHours = (hour: number) => {
    return hour >= openingHour && hour < closingHour;
  };

  return (
    <div 
      ref={containerRef}
      data-calendar-day-container
      className="flex-1 flex flex-col overflow-hidden"
    >
      <div className={`min-w-[600px] ${activeBarbers.length > 3 ? "min-w-[900px]" : ""} h-full flex flex-col`}>
        {/* Header with barbers - FIXED */}
        <div 
          className="grid border-b border-border bg-card z-10 shrink-0" 
          style={{ gridTemplateColumns: `80px repeat(${activeBarbers.length}, 1fr)`, height: HEADER_HEIGHT }}
        >
          <div className="p-3 text-center border-r border-border flex flex-col items-center justify-center">
            <p className="text-sm text-muted-foreground capitalize">
              {format(currentDate, "EEEE", { locale: ptBR })}
            </p>
            <p className={`text-2xl font-bold ${today ? "text-primary" : ""}`}>
              {format(currentDate, "d")}
            </p>
          </div>
          {activeBarbers.map(barber => (
            <div
              key={barber.id}
              className="p-3 text-center border-r border-border last:border-r-0 flex items-center justify-center"
              style={{ borderTop: `3px solid ${barber.calendar_color || "#FF6B00"}` }}
            >
              <p className="font-semibold text-foreground">{barber.name}</p>
            </div>
          ))}
        </div>

        {/* Time slots - SCROLLABLE */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="grid relative" style={{ gridTemplateColumns: `80px repeat(${activeBarbers.length}, 1fr)` }}>
            {/* Current time indicator - spans across all columns */}
            {showTimeIndicator && (
              <div
                className="absolute left-0 right-0 z-20 pointer-events-none"
                style={{ top: `${timeIndicatorPosition}px` }}
              >
                <div className="relative flex items-center">
                  <div className="absolute left-[68px] w-3 h-3 bg-red-500 rounded-full shadow-sm" />
                  <div className="ml-[80px] flex-1 h-0.5 bg-red-500" />
                </div>
              </div>
            )}

            {/* Time column */}
            <div className="border-r border-border">
              {HOURS.map(hour => (
                <div
                  key={hour}
                  className={`border-b border-border flex items-start justify-end pr-2 pt-1 ${
                    isWithinBusinessHours(hour) ? "bg-blue-100/40 dark:bg-blue-900/20" : ""
                  }`}
                  style={{ height: DEFAULT_HOUR_HEIGHT }}
                >
                  <span className="text-sm text-muted-foreground">
                    {String(hour).padStart(2, "0")}:00
                  </span>
                </div>
              ))}
            </div>

            {/* Barber columns */}
            {activeBarbers.map(barber => (
              <div key={barber.id} className="border-r border-border last:border-r-0">
                {HOURS.map(hour => {
                  const slotAppointments = appointmentsByBarberAndHour[barber.id]?.[hour] || [];
                  const slotDate = setMinutes(setHours(currentDate, hour), 0);
                  const withinHours = isWithinBusinessHours(hour);

                  return (
                    <div
                      key={hour}
                      className={`border-b border-border p-1 cursor-pointer hover:bg-muted/30 transition-colors ${
                        withinHours 
                          ? "bg-blue-100/40 dark:bg-blue-900/20" 
                          : ""
                      } ${today && withinHours ? "bg-blue-100/50 dark:bg-blue-900/30" : ""}`}
                      style={{ height: DEFAULT_HOUR_HEIGHT }}
                      onClick={() => onSlotClick(slotDate, barber.id)}
                    >
                      <div className="space-y-1 overflow-hidden h-full">
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
