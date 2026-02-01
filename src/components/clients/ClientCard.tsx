import { Phone, Calendar, Clock, Edit2, Trash2, Building2, BellOff, Eye, Users, Gift, Sparkles, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Client } from "@/hooks/useClients";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCurrentUnit } from "@/contexts/UnitContext";
import { useUnits } from "@/hooks/useUnits";
import { useSyncClientFidelity } from "@/hooks/useSyncClientFidelity";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ClientCardProps {
  client: Client;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onView?: (client: Client) => void;
  showUnit?: boolean;
}

export function ClientCard({ client, onEdit, onDelete, onView, showUnit = false }: ClientCardProps) {
  const { currentUnitId } = useCurrentUnit();
  const { units } = useUnits();
  const currentUnit = units.find(u => u.id === currentUnitId);
  const fidelityEnabled = currentUnit?.fidelity_program_enabled ?? false;
  const fidelityThreshold = currentUnit?.fidelity_cuts_threshold ?? 10;
  const syncFidelity = useSyncClientFidelity();

  const initials = client.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const formatBirthDate = (date: string | null) => {
    if (!date) return null;
    const [, month, day] = date.split('-');
    return `${day}/${month}`;
  };

  const formatLastVisit = (date: string | null) => {
    if (!date) return "Nunca visitou";
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
  };

  const tagColors: Record<string, string> = {
    VIP: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    Sumido: "bg-red-500/20 text-red-400 border-red-500/30",
    Novo: "bg-green-500/20 text-green-400 border-green-500/30",
    Frequente: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };

  return (
    <Card className="border-border bg-card transition-all hover:border-primary/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border border-primary/30">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">{client.name}</h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span>{client.phone}</span>
              </div>
              {showUnit && client.unit_name && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <Building2 className="h-3 w-3 text-primary" />
                  <span className="truncate">{client.unit_name}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            {onView && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onView(client)}
                className="h-8 w-8 text-muted-foreground hover:text-primary"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(client)}
              className="h-8 w-8 text-muted-foreground hover:text-primary"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(client)}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
          {client.birth_date && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>{formatBirthDate(client.birth_date)}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span className="truncate">{formatLastVisit(client.last_visit_at)}</span>
          </div>
          <div className="text-right text-muted-foreground">
            <span className="font-medium text-foreground">{client.total_visits}</span> visitas
          </div>
        </div>

        {/* Fidelity Progress */}
        {fidelityEnabled && (
          <div className="mt-3 flex items-center gap-2">
            {client.available_courtesies > 0 ? (
              <Badge
                variant="outline"
                className="bg-green-500/20 text-green-400 border-green-500/30 gap-1"
              >
                <Sparkles className="h-3 w-3" />
                {client.available_courtesies} cortesia{client.available_courtesies > 1 ? "s" : ""} disponível
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="bg-primary/20 text-primary border-primary/30 gap-1"
              >
                <Gift className="h-3 w-3" />
                {client.loyalty_cuts || 0}/{fidelityThreshold} cortes
              </Badge>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    syncFidelity.syncSingle.mutate(client.id);
                  }}
                  disabled={syncFidelity.syncSingle.isPending}
                  className="h-6 w-6 text-muted-foreground hover:text-primary"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${syncFidelity.syncSingle.isPending ? "animate-spin" : ""}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Sincronizar fidelidade</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {(client.dependents_count && client.dependents_count > 0) || client.marketing_opt_out || (client.tags && client.tags.length > 0) ? (
          <div className="mt-3 flex flex-wrap gap-1">
            {client.dependents_count && client.dependents_count > 0 && (
              <Badge
                variant="outline"
                className="bg-primary/20 text-primary border-primary/30 gap-1"
              >
                <Users className="h-3 w-3" />
                {client.dependents_count} dependente{client.dependents_count > 1 ? "s" : ""}
              </Badge>
            )}
            {client.marketing_opt_out && (
              <Badge
                variant="outline"
                className="bg-destructive/20 text-destructive border-destructive/30 gap-1"
              >
                <BellOff className="h-3 w-3" />
                Descadastrado
              </Badge>
            )}
            {client.tags?.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className={tagColors[tag] || "bg-secondary text-secondary-foreground"}
              >
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
