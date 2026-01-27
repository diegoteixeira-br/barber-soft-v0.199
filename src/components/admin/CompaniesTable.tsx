import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { AdminCompany, useAdminCompanies } from "@/hooks/useAdminCompanies";
import { MoreHorizontal, Search, Ban, CheckCircle, Clock, Eye, Trash2, UserX } from "lucide-react";
import { formatDistanceToNow, format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CompanyDetailsModal } from "./CompanyDetailsModal";

const statusColors: Record<string, string> = {
  trial: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  active: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  overdue: "bg-red-500/20 text-red-400 border-red-500/30",
};

const planColors: Record<string, string> = {
  professional: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  elite: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  empire: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

export function CompaniesTable() {
  const { companies, isLoading, blockCompany, extendTrial, updatePlan, deleteCompany, isDeletingCompany } = useAdminCompanies();
  const [search, setSearch] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<AdminCompany | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<AdminCompany | null>(null);

  const filteredCompanies = companies.filter(company => {
    const displayName = company.business_name || company.name;
    return displayName.toLowerCase().includes(search.toLowerCase()) ||
      (company.owner_email && company.owner_email.toLowerCase().includes(search.toLowerCase()));
  });

  const getTrialDaysLeft = (trialEndsAt: string | null) => {
    if (!trialEndsAt) return null;
    const days = differenceInDays(new Date(trialEndsAt), new Date());
    return days >= 0 ? days : 0;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar barbearia..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="rounded-lg border border-slate-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700 hover:bg-slate-800/50">
              <TableHead className="text-slate-300">Barbearia</TableHead>
              <TableHead className="text-slate-300">Plano</TableHead>
              <TableHead className="text-slate-300">Status</TableHead>
              <TableHead className="text-slate-300">Último Login</TableHead>
              <TableHead className="text-slate-300">Criado em</TableHead>
              <TableHead className="text-slate-300 w-[70px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCompanies.map((company) => {
              const trialDays = getTrialDaysLeft(company.trial_ends_at);
              
              return (
                <TableRow key={company.id} className="border-slate-700 hover:bg-slate-800/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-white font-bold">
                        {(company.business_name || company.name).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-white">{company.business_name || company.name}</p>
                        <p className="text-xs text-slate-400">{company.owner_email || "Email não disponível"}</p>
                        {company.is_blocked && (
                          <span className="text-xs text-red-400">Bloqueado</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={planColors[company.plan_type || 'professional']}>
                      {company.plan_type || 'professional'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant="outline" className={statusColors[company.plan_status || 'trial']}>
                        {company.plan_status || 'trial'}
                      </Badge>
                      {company.plan_status === 'trial' && trialDays !== null && (
                        <span className="text-xs text-slate-400">
                          {trialDays} dias restantes
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-400">
                    {company.last_login_at 
                      ? formatDistanceToNow(new Date(company.last_login_at), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })
                      : "Nunca"}
                  </TableCell>
                  <TableCell className="text-slate-400">
                    {company.created_at 
                      ? format(new Date(company.created_at), "dd/MM/yyyy")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                        <DropdownMenuItem 
                          className="text-slate-300 focus:text-white focus:bg-slate-700"
                          onClick={() => setSelectedCompany(company)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-700" />
                        {company.is_blocked ? (
                          <DropdownMenuItem 
                            className="text-green-400 focus:text-green-300 focus:bg-slate-700"
                            onClick={() => blockCompany({ companyId: company.id, blocked: false })}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Desbloquear
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem 
                            className="text-red-400 focus:text-red-300 focus:bg-slate-700"
                            onClick={() => blockCompany({ companyId: company.id, blocked: true })}
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            Bloquear
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          className="text-slate-300 focus:text-white focus:bg-slate-700"
                          onClick={() => extendTrial({ companyId: company.id, days: 7 })}
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          Estender Trial (+7 dias)
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-700" />
                        <DropdownMenuItem 
                          className="text-slate-300 focus:text-white focus:bg-slate-700"
                          onClick={() => updatePlan({ companyId: company.id, planStatus: 'cancelled' })}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Cancelar Assinatura
                        </DropdownMenuItem>
                        {company.plan_status === 'cancelled' && (
                          <DropdownMenuItem 
                            className="text-red-400 focus:text-red-300 focus:bg-slate-700"
                            onClick={() => setCompanyToDelete(company)}
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Excluir Permanentemente
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredCompanies.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-slate-400 py-8">
                  Nenhuma barbearia encontrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <CompanyDetailsModal 
        company={selectedCompany} 
        open={!!selectedCompany} 
        onOpenChange={(open) => !open && setSelectedCompany(null)} 
      />

      <AlertDialog open={!!companyToDelete} onOpenChange={(open) => !open && setCompanyToDelete(null)}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir Empresa Permanentemente</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Esta ação é <span className="text-red-400 font-semibold">irreversível</span>. 
              Todos os dados da empresa <span className="text-white font-medium">{companyToDelete?.business_name || companyToDelete?.name}</span> serão 
              excluídos permanentemente, incluindo:
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Todas as unidades e profissionais</li>
                <li>Todos os clientes e agendamentos</li>
                <li>Todo o histórico financeiro</li>
                <li>A conta do usuário proprietário</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={isDeletingCompany}
              onClick={() => {
                if (companyToDelete) {
                  deleteCompany({ companyId: companyToDelete.id });
                  setCompanyToDelete(null);
                }
              }}
            >
              {isDeletingCompany ? "Excluindo..." : "Excluir Permanentemente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
