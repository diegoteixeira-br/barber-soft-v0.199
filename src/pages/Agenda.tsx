import { useState, useMemo } from "react";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CalendarHeader, type CalendarViewType } from "@/components/agenda/CalendarHeader";
import { CalendarWeekView } from "@/components/agenda/CalendarWeekView";
import { CalendarDayView } from "@/components/agenda/CalendarDayView";
import { CalendarMonthView } from "@/components/agenda/CalendarMonthView";
import { CancellationHistoryTab } from "@/components/agenda/CancellationHistoryTab";
import { AppointmentHistoryTab } from "@/components/agenda/AppointmentHistoryTab";
import { AppointmentFormModal } from "@/components/agenda/AppointmentFormModal";
import { AppointmentDetailsModal } from "@/components/agenda/AppointmentDetailsModal";
import { QuickServiceModal } from "@/components/agenda/QuickServiceModal";
import { useAppointments, type Appointment, type AppointmentFormData, type QuickServiceFormData } from "@/hooks/useAppointments";
import { useBarbers } from "@/hooks/useBarbers";
import { useServices } from "@/hooks/useServices";
import { useCurrentUnit } from "@/contexts/UnitContext";
import { useAppointmentNotification } from "@/hooks/useAppointmentNotification";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { useUnits } from "@/hooks/useUnits";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, History, CheckCircle2, XCircle } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppointmentStatus = Database["public"]["Enums"]["appointment_status"];

export default function Agenda() {
  const { currentUnitId } = useCurrentUnit();
  
  // Enable vocal notification for new appointments
  useAppointmentNotification();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarViewType>("week");
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"calendar" | "history">("calendar");
  const [isCompactMode, setIsCompactMode] = useState(() => {
    const saved = localStorage.getItem("agenda-compact-mode");
    return saved === "true";
  });
  
  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isQuickServiceModalOpen, setIsQuickServiceModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [initialSlotDate, setInitialSlotDate] = useState<Date | undefined>();
  const [initialSlotBarberId, setInitialSlotBarberId] = useState<string | undefined>();

  const handleToggleCompactMode = () => {
    setIsCompactMode(prev => {
      const newValue = !prev;
      localStorage.setItem("agenda-compact-mode", String(newValue));
      return newValue;
    });
  };

  // Calculate date range based on view
  const dateRange = useMemo(() => {
    switch (view) {
      case "day":
        return { start: startOfDay(currentDate), end: endOfDay(currentDate) };
      case "week":
        return { start: startOfWeek(currentDate, { weekStartsOn: 0 }), end: endOfWeek(currentDate, { weekStartsOn: 0 }) };
      case "month":
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        return { 
          start: startOfWeek(monthStart, { weekStartsOn: 0 }), 
          end: endOfWeek(monthEnd, { weekStartsOn: 0 }) 
        };
    }
  }, [currentDate, view]);

  const { barbers, isLoading: barbersLoading } = useBarbers(currentUnitId);
  const { services, isLoading: servicesLoading } = useServices(currentUnitId);
  const { settings: businessSettings } = useBusinessSettings();
  const { units } = useUnits();
  
  // Get current unit's timezone
  const currentUnit = useMemo(() => {
    return units?.find(u => u.id === currentUnitId);
  }, [units, currentUnitId]);
  
  const { 
    appointments: allAppointments, 
    isLoading: appointmentsLoading,
    isFetching: appointmentsFetching,
    refetch: refetchAppointments,
    createAppointment, 
    updateAppointment,
    updateStatus,
    deleteAppointment,
    createQuickService,
  } = useAppointments(dateRange.start, dateRange.end, selectedBarberId);

  // Filter out cancelled appointments from main view
  const appointments = useMemo(() => {
    return allAppointments.filter(apt => apt.status !== 'cancelled');
  }, [allAppointments]);

  const isLoading = barbersLoading || servicesLoading || appointmentsLoading;

  const handleSlotClick = (date: Date, barberId?: string) => {
    setSelectedAppointment(null);
    setInitialSlotDate(date);
    setInitialSlotBarberId(barberId);
    setIsFormModalOpen(true);
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailsModalOpen(true);
  };

  const handleDayClick = (date: Date) => {
    setCurrentDate(date);
    setView("day");
  };

  const handleNewAppointment = () => {
    setSelectedAppointment(null);
    setInitialSlotDate(new Date());
    setInitialSlotBarberId(undefined);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (data: AppointmentFormData) => {
    if (selectedAppointment) {
      await updateAppointment.mutateAsync({ id: selectedAppointment.id, ...data });
    } else {
      await createAppointment.mutateAsync(data);
    }
    setIsFormModalOpen(false);
    setSelectedAppointment(null);
  };

  const handleEditFromDetails = () => {
    setIsDetailsModalOpen(false);
    setInitialSlotDate(selectedAppointment ? new Date(selectedAppointment.start_time) : undefined);
    setInitialSlotBarberId(selectedAppointment?.barber_id || undefined);
    setIsFormModalOpen(true);
  };

  const handleStatusChange = async (status: AppointmentStatus, isNoShow: boolean = false) => {
    if (selectedAppointment) {
      await updateStatus.mutateAsync({ id: selectedAppointment.id, status, isNoShow });
      setIsDetailsModalOpen(false);
    }
  };

  const handleNoShow = async () => {
    if (selectedAppointment) {
      await handleStatusChange("cancelled", true);
    }
  };

  const handleDelete = async () => {
    if (selectedAppointment) {
      await deleteAppointment.mutateAsync(selectedAppointment.id);
      setIsDetailsModalOpen(false);
      setSelectedAppointment(null);
    }
  };

  const handleDeleteFromForm = async () => {
    if (selectedAppointment) {
      await deleteAppointment.mutateAsync(selectedAppointment.id);
      setIsFormModalOpen(false);
      setSelectedAppointment(null);
    }
  };

  const handleQuickServiceSubmit = async (data: QuickServiceFormData) => {
    await createQuickService.mutateAsync(data);
    setIsQuickServiceModalOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col flex-1 min-h-0">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "calendar" | "history")} className="flex flex-col flex-1 min-h-0">
          <div className="border-b border-border bg-card/50 px-4 pt-2 shrink-0">
            <TabsList className="grid w-[300px] grid-cols-2">
              <TabsTrigger value="calendar" className="gap-2">
                <Calendar className="h-4 w-4" />
                Calendário
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="h-4 w-4" />
                Histórico
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="calendar" className="flex-1 flex flex-col mt-0 min-h-0 overflow-hidden">
            <CalendarHeader
              currentDate={currentDate}
              view={view}
              barbers={barbers}
              selectedBarberId={selectedBarberId}
              onDateChange={setCurrentDate}
              onViewChange={setView}
              onBarberChange={setSelectedBarberId}
              onNewAppointment={handleNewAppointment}
              onQuickService={() => setIsQuickServiceModalOpen(true)}
              onRefresh={() => refetchAppointments()}
              isRefreshing={appointmentsFetching}
              isCompactMode={isCompactMode}
              onToggleCompactMode={handleToggleCompactMode}
            />

            {isLoading ? (
              <div className="flex-1 p-4">
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-[500px] w-full" />
                </div>
              </div>
            ) : (
              <>
                {view === "week" && (
                  <CalendarWeekView
                    currentDate={currentDate}
                    appointments={appointments}
                    barbers={barbers}
                    selectedBarberId={selectedBarberId}
                    onAppointmentClick={handleAppointmentClick}
                    onSlotClick={handleSlotClick}
                    openingTime={businessSettings?.opening_time || undefined}
                    closingTime={businessSettings?.closing_time || undefined}
                    timezone={currentUnit?.timezone || undefined}
                    isCompactMode={isCompactMode}
                  />
                )}
                {view === "day" && (
                  <CalendarDayView
                    currentDate={currentDate}
                    appointments={appointments}
                    barbers={barbers}
                    selectedBarberId={selectedBarberId}
                    onAppointmentClick={handleAppointmentClick}
                    onSlotClick={handleSlotClick}
                    openingTime={businessSettings?.opening_time || undefined}
                    closingTime={businessSettings?.closing_time || undefined}
                    timezone={currentUnit?.timezone || undefined}
                    isCompactMode={isCompactMode}
                  />
                )}
                {view === "month" && (
                  <CalendarMonthView
                    currentDate={currentDate}
                    appointments={appointments}
                    onAppointmentClick={handleAppointmentClick}
                    onDayClick={handleDayClick}
                  />
                )}
              </>
            )}
          </TabsContent>
          
          <TabsContent value="history" className="flex-1 mt-0 overflow-auto">
            <div className="p-6">
              <Tabs defaultValue="appointments" className="space-y-4">
                <TabsList className="grid w-[320px] grid-cols-2">
                  <TabsTrigger value="appointments" className="gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Atendimentos
                  </TabsTrigger>
                  <TabsTrigger value="cancellations" className="gap-2">
                    <XCircle className="h-4 w-4" />
                    Cancelamentos
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="appointments" className="mt-4">
                  <AppointmentHistoryTab />
                </TabsContent>
                
                <TabsContent value="cancellations" className="mt-4">
                  <CancellationHistoryTab />
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>
        </Tabs>

        <AppointmentFormModal
          open={isFormModalOpen}
          onOpenChange={setIsFormModalOpen}
          barbers={barbers}
          services={services}
          initialDate={initialSlotDate}
          initialBarberId={initialSlotBarberId}
          appointment={selectedAppointment}
          onSubmit={handleFormSubmit}
          onDelete={handleDeleteFromForm}
          isLoading={createAppointment.isPending || updateAppointment.isPending}
          isDeleting={deleteAppointment.isPending}
        />

        <AppointmentDetailsModal
          open={isDetailsModalOpen}
          onOpenChange={setIsDetailsModalOpen}
          appointment={selectedAppointment}
          onEdit={handleEditFromDetails}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
          onNoShow={handleNoShow}
          isLoading={updateStatus.isPending || deleteAppointment.isPending}
        />

        <QuickServiceModal
          open={isQuickServiceModalOpen}
          onOpenChange={setIsQuickServiceModalOpen}
          barbers={barbers}
          services={services}
          onSubmit={handleQuickServiceSubmit}
          isLoading={createQuickService.isPending}
        />
      </div>
    </DashboardLayout>
  );
}
