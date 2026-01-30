import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Phone, User, Scissors, Clock, DollarSign, Calendar, Edit, Trash2, CheckCircle, XCircle, UserX, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { StatusBadge, getNextStatus } from "./StatusBadge";
import { PaymentMethodModal, type PaymentMethod } from "@/components/financeiro/PaymentMethodModal";
import { useFidelityCourtesy } from "@/hooks/useFidelityCourtesy";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { useToast } from "@/hooks/use-toast";
import type { Appointment } from "@/hooks/useAppointments";
import type { Database } from "@/integrations/supabase/types";

type AppointmentStatus = Database["public"]["Enums"]["appointment_status"];

interface AppointmentDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  onEdit: () => void;
  onDelete: (reason?: string) => void;
  onStatusChange: (status: AppointmentStatus, paymentMethod?: string, courtesyReason?: string) => void;
  onNoShow?: () => void;
  isLoading?: boolean;
}

export function AppointmentDetailsModal({
  open,
  onOpenChange,
  appointment,
  onEdit,
  onDelete,
  onStatusChange,
  onNoShow,
  isLoading,
}: AppointmentDetailsModalProps) {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDeleteWithReasonOpen, setIsDeleteWithReasonOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [availableCourtesies, setAvailableCourtesies] = useState(0);
  const [isFreeCut, setIsFreeCut] = useState(false);
  const [loyaltyCuts, setLoyaltyCuts] = useState(0);
  const courtesiesBeforeRef = useRef<number>(0);
  
  const { toast } = useToast();
  const { settings } = useBusinessSettings();
  const { useCourtesy, getClientCourtesies, checkIfNextCutIsFree, checkCycleCompletion } = useFidelityCourtesy();
  const fidelityEnabled = settings?.fidelity_program_enabled ?? false;
  const fidelityThreshold = settings?.fidelity_cuts_threshold ?? 5;

  // Fetch client's available courtesies and check if this is a free cut
  useEffect(() => {
    if (open && appointment?.client_phone && appointment?.unit_id && fidelityEnabled) {
      // Get available courtesies
      getClientCourtesies(appointment.client_phone, appointment.unit_id).then((courtesies) => {
        setAvailableCourtesies(courtesies);
        courtesiesBeforeRef.current = courtesies;
      });
      
      // Check if this is the free cut (6th cut scenario)
      checkIfNextCutIsFree(
        appointment.client_phone,
        appointment.unit_id,
        appointment.company_id,
        appointment.total_price
      ).then((result) => {
        setIsFreeCut(result.isFreeCut);
        setLoyaltyCuts(result.loyaltyCuts);
      });
    } else {
      setAvailableCourtesies(0);
      setIsFreeCut(false);
      setLoyaltyCuts(0);
      courtesiesBeforeRef.current = 0;
    }
  }, [open, appointment?.client_phone, appointment?.unit_id, appointment?.company_id, appointment?.total_price, fidelityEnabled]);
  
  if (!appointment) return null;

  const startTime = new Date(appointment.start_time);
  const endTime = new Date(appointment.end_time);
  const barberColor = appointment.barber?.calendar_color || "#FF6B00";
  const nextStatus = getNextStatus(appointment.status);

  const handleFinalizar = () => {
    // Open payment method modal instead of directly completing
    setIsPaymentModalOpen(true);
  };

  const handlePaymentConfirm = async (paymentMethod: PaymentMethod, courtesyReason?: string) => {
    // If using fidelity courtesy, add automatic reason
    const reason = paymentMethod === "fidelity_courtesy" 
      ? `[Fidelidade] Cortesia por ${settings?.fidelity_cuts_threshold || 10} cortes acumulados`
      : courtesyReason;
    
    // Store courtesies before completing
    const courtesiesBefore = courtesiesBeforeRef.current;
    const clientName = appointment.client_name;
    const clientPhone = appointment.client_phone;
    const unitId = appointment.unit_id;
    
    // Complete the appointment
    onStatusChange("completed", paymentMethod, reason);
    setIsPaymentModalOpen(false);
    
    // Check if a fidelity cycle was completed (with a small delay to allow trigger to execute)
    if (fidelityEnabled && clientPhone && paymentMethod !== "courtesy" && paymentMethod !== "fidelity_courtesy") {
      setTimeout(async () => {
        const result = await checkCycleCompletion(clientPhone, unitId, courtesiesBefore);
        if (result.earned) {
          toast({
            title: "🎉 Ciclo Completo!",
            description: `O cliente ${clientName} ganhou 1 cortesia.`,
          });
        }
      }, 1500); // Wait for trigger to execute
    }
  };

  const handleUseFidelityCourtesy = () => {
    if (appointment.client_phone && appointment.unit_id) {
      useCourtesy.mutate({
        clientPhone: appointment.client_phone,
        unitId: appointment.unit_id,
      });
    }
  };

  const getNextStatusLabel = (status: AppointmentStatus) => {
    switch (status) {
      case "confirmed":
        return "Confirmar";
      case "completed":
        return "Finalizar";
      default:
        return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-12 rounded-full"
              style={{ backgroundColor: barberColor }}
            />
            <div>
              <DialogTitle className="text-xl">{appointment.client_name}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {format(startTime, "EEEE, d 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <StatusBadge status={appointment.status} />
            <span className="text-lg font-bold text-primary">
              R$ {Number(appointment.total_price).toFixed(2)}
            </span>
          </div>

          <Separator />

          <div className="grid gap-3">
            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                {format(startTime, "HH:mm")} - {format(endTime, "HH:mm")}
              </span>
            </div>

            {appointment.client_phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{appointment.client_phone}</span>
              </div>
            )}


            {appointment.barber && (
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: barberColor }}
                  />
                  {appointment.barber.name}
                </div>
              </div>
            )}

            {appointment.service && (
              <div className="flex items-center gap-3 text-sm">
                <Scissors className="h-4 w-4 text-muted-foreground" />
                <span>
                  {appointment.service.name} ({appointment.service.duration_minutes} min)
                </span>
              </div>
            )}

            {appointment.notes && (
              <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">{appointment.notes}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Status change buttons */}
          {appointment.status !== "completed" && appointment.status !== "cancelled" && (
            <div className="flex gap-2">
              {nextStatus === "confirmed" && (
                <Button
                  className="flex-1"
                  onClick={() => onStatusChange("confirmed")}
                  disabled={isLoading}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmar
                </Button>
              )}
              {nextStatus === "completed" && (
                <Button
                  className="flex-1"
                  onClick={handleFinalizar}
                  disabled={isLoading}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Finalizar
                </Button>
              )}
              {onNoShow && (
                <Button
                  variant="outline"
                  onClick={onNoShow}
                  disabled={isLoading}
                  className="text-destructive border-destructive hover:bg-destructive/10"
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Faltou
                </Button>
              )}
              <Button
                variant="destructive"
                onClick={() => onStatusChange("cancelled")}
                disabled={isLoading}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-between pt-2">
            {/* For confirmed/completed, use special delete with reason */}
            {(appointment.status === "confirmed" || appointment.status === "completed") ? (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  setDeleteReason("");
                  setIsDeleteWithReasonOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir agendamento?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. O agendamento será removido permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete()} className="bg-destructive hover:bg-destructive/90">
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Payment Method Modal */}
      <PaymentMethodModal
        open={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        onConfirm={handlePaymentConfirm}
        totalPrice={appointment.total_price}
        isLoading={isLoading}
        availableCourtesies={fidelityEnabled ? availableCourtesies : 0}
        onUseFidelityCourtesy={handleUseFidelityCourtesy}
        isFreeCut={fidelityEnabled && isFreeCut}
        loyaltyCuts={loyaltyCuts}
        loyaltyThreshold={fidelityThreshold}
      />

      {/* Delete with Reason Modal - for confirmed/completed appointments */}
      <Dialog open={isDeleteWithReasonOpen} onOpenChange={setIsDeleteWithReasonOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Exclusão com Registro
            </DialogTitle>
            <DialogDescription>
              Este agendamento já foi {appointment.status === "completed" ? "finalizado" : "confirmado"}.
              A exclusão será registrada para auditoria financeira. Informe o motivo:
            </DialogDescription>
          </DialogHeader>
          <Textarea 
            placeholder="Motivo da exclusão (obrigatório)"
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteWithReasonOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              disabled={!deleteReason.trim() || isLoading}
              onClick={() => {
                onDelete(deleteReason.trim());
                setIsDeleteWithReasonOpen(false);
              }}
            >
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
