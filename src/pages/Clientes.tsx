import { useState, useMemo } from "react";
import { Search, Users, Cake, Clock, Plus, Building2, Loader2, BellOff, RefreshCw } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientCard } from "@/components/clients/ClientCard";
import { ClientFormModal } from "@/components/clients/ClientFormModal";
import { ClientDetailsModal } from "@/components/clients/ClientDetailsModal";
import { useClients, Client, ClientFilter, CreateClientData } from "@/hooks/useClients";
import { useUnits } from "@/hooks/useUnits";
import { useCurrentUnit } from "@/contexts/UnitContext";
import { useSyncClientFidelity } from "@/hooks/useSyncClientFidelity";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function Clientes() {
  const [filter, setFilter] = useState<ClientFilter>("all");
  const [search, setSearch] = useState("");
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [unitFilter, setUnitFilter] = useState<string>("current");

  const { units } = useUnits();
  const { currentUnitId, isLoading: unitLoading } = useCurrentUnit();
  
  const effectiveUnitId = unitFilter === "all" 
    ? null 
    : (unitFilter === "current" ? currentUnitId : unitFilter);

  const { clients, isLoading, createClient, updateClient, deleteClient } = useClients({
    filter,
    unitIdFilter: effectiveUnitId,
  });

  const { syncAll } = useSyncClientFidelity();

  // Check if current unit has fidelity enabled
  const currentUnit = units.find(u => u.id === currentUnitId);
  const fidelityEnabled = currentUnit?.fidelity_program_enabled ?? false;

  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients;
    const searchLower = search.toLowerCase();
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(searchLower) ||
        client.phone.includes(search)
    );
  }, [clients, search]);

  const handleCreate = (data: CreateClientData) => {
    createClient.mutate(data, {
      onSuccess: () => setIsCreating(false),
    });
  };

  const handleSave = (data: Partial<Client> & { id: string }) => {
    updateClient.mutate(data, {
      onSuccess: () => setEditingClient(null),
    });
  };

  const handleDelete = () => {
    if (!deletingClient) return;
    deleteClient.mutate(deletingClient.id, {
      onSuccess: () => setDeletingClient(null),
    });
  };

  const showUnitBadge = unitFilter === "all" && units.length > 1;

  if (unitLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
            <p className="text-muted-foreground">
              Gerencie sua base de clientes e CRM
            </p>
          </div>
          <div className="flex gap-2">
            {fidelityEnabled && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={() => syncAll.mutate()}
                    disabled={syncAll.isPending}
                    className="gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${syncAll.isPending ? "animate-spin" : ""}`} />
                    <span className="hidden sm:inline">Sincronizar Fidelidade</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Recalcular cortes de fidelidade de todos os clientes</p>
                </TooltipContent>
              </Tooltip>
            )}
            <Button onClick={() => setIsCreating(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Cliente
            </Button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Unit Filter */}
            {units.length > 1 && (
              <Select value={unitFilter} onValueChange={setUnitFilter}>
                <SelectTrigger className="w-full sm:w-[220px]">
                  <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Filtrar por unidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Unidade Atual</SelectItem>
                  <SelectItem value="all">Todas as Unidades</SelectItem>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou telefone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Tabs value={filter} onValueChange={(v) => setFilter(v as ClientFilter)}>
            <TabsList className="bg-secondary">
              <TabsTrigger value="all" className="gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Todos</span>
              </TabsTrigger>
              <TabsTrigger value="birthday_month" className="gap-2">
                <Cake className="h-4 w-4" />
                <span className="hidden sm:inline">Aniversariantes</span>
              </TabsTrigger>
              <TabsTrigger value="inactive" className="gap-2">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Inativos</span>
              </TabsTrigger>
              <TabsTrigger value="opted_out" className="gap-2">
                <BellOff className="h-4 w-4" />
                <span className="hidden sm:inline">Descadastrados</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Stats */}
        <div className="text-sm text-muted-foreground">
          {isLoading ? (
            <Skeleton className="h-4 w-32" />
          ) : (
            <span>{filteredClients.length} cliente(s) encontrado(s)</span>
          )}
        </div>

        {/* Clients Grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-lg" />
            ))}
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed border-border bg-card/50">
            <div className="flex flex-col items-center gap-4 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50" />
              <div>
                <h3 className="text-lg font-medium text-foreground">
                  Nenhum cliente cadastrado
                </h3>
                <p className="text-sm text-muted-foreground">
                  Adicione seu primeiro cliente para começar
                </p>
              </div>
              <Button onClick={() => setIsCreating(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Cliente
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredClients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onView={setViewingClient}
                onEdit={setEditingClient}
                onDelete={setDeletingClient}
                showUnit={showUnitBadge}
              />
            ))}
          </div>
        )}
      </div>

      {/* Client Details Modal */}
      <ClientDetailsModal
        open={!!viewingClient}
        onOpenChange={(open) => !open && setViewingClient(null)}
        client={viewingClient}
        onEdit={(client) => {
          setViewingClient(null);
          setEditingClient(client);
        }}
        showUnit={showUnitBadge}
      />

      {/* Create Modal */}
      <ClientFormModal
        open={isCreating}
        onOpenChange={setIsCreating}
        onCreate={handleCreate}
        isLoading={createClient.isPending}
        units={units}
        defaultUnitId={effectiveUnitId || undefined}
      />

      {/* Edit Modal */}
      <ClientFormModal
        open={!!editingClient}
        onOpenChange={(open) => !open && setEditingClient(null)}
        client={editingClient}
        onSave={handleSave}
        isLoading={updateClient.isPending}
        units={units}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingClient} onOpenChange={(open) => !open && setDeletingClient(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{deletingClient?.name}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
