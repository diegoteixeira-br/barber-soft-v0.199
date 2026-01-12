import { Building2, MapPin, Phone, User, MoreVertical, Pencil, Trash2, MessageCircle, Crown } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Unit } from "@/hooks/useUnits";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UnitCardProps {
  unit: Unit;
  onEdit: (unit: Unit) => void;
  onDelete: (unit: Unit) => void;
  onConfigureWhatsApp: (unit: Unit) => void;
  onSetHeadquarters?: (unit: Unit) => void;
}

type WhatsAppStatus = 'disconnected' | 'connected' | 'checking';

export function UnitCard({ unit, onEdit, onDelete, onConfigureWhatsApp, onSetHeadquarters }: UnitCardProps) {
  const [whatsappStatus, setWhatsappStatus] = useState<WhatsAppStatus>('checking');

  useEffect(() => {
    const checkWhatsAppStatus = async () => {
      // Se não tem instance_name configurado, está desconectado
      if (!unit.evolution_instance_name) {
        setWhatsappStatus('disconnected');
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setWhatsappStatus('disconnected');
          return;
        }

        const { data, error } = await supabase.functions.invoke('evolution-whatsapp', {
          body: { action: 'status', unit_id: unit.id }
        });

        if (error || !data?.success) {
          setWhatsappStatus('disconnected');
          return;
        }

        // Só mostra conectado se o state for "open"
        setWhatsappStatus(data.state === 'open' ? 'connected' : 'disconnected');
      } catch (err) {
        console.error('Error checking WhatsApp status:', err);
        setWhatsappStatus('disconnected');
      }
    };

    checkWhatsAppStatus();
  }, [unit.id, unit.evolution_instance_name]);

  return (
    <Card className="group relative overflow-hidden border-border bg-card transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground">{unit.name}</h3>
              {unit.is_headquarters && (
                <Badge className="text-xs bg-primary/20 text-primary border-primary/30">
                  <Crown className="mr-1 h-3 w-3" />
                  Matriz
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {whatsappStatus === 'checking' ? (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  <MessageCircle className="mr-1 h-3 w-3 animate-pulse" />
                  Verificando...
                </Badge>
              ) : whatsappStatus === 'connected' ? (
                <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                  <MessageCircle className="mr-1 h-3 w-3" />
                  WhatsApp Conectado
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  <MessageCircle className="mr-1 h-3 w-3" />
                  WhatsApp não conectado
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover">
            {!unit.is_headquarters && onSetHeadquarters && (
              <>
                <DropdownMenuItem onClick={() => onSetHeadquarters(unit)} className="cursor-pointer">
                  <Crown className="mr-2 h-4 w-4" />
                  Definir como Matriz
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={() => onConfigureWhatsApp(unit)} className="cursor-pointer">
              <MessageCircle className="mr-2 h-4 w-4" />
              Configurar WhatsApp
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(unit)} className="cursor-pointer">
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(unit)}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {unit.address && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary/70" />
            <span>{unit.address}</span>
          </div>
        )}
        
        {unit.phone && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4 text-primary/70" />
            <span>{unit.phone}</span>
          </div>
        )}
        
        {unit.manager_name && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4 text-primary/70" />
            <span>{unit.manager_name}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
