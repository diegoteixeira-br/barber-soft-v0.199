import { AdminLayout } from "@/components/admin/AdminLayout";
import { PlanPricingCard } from "@/components/admin/PlanPricingCard";
import { PlanFeaturesCard } from "@/components/admin/PlanFeaturesCard";
import { TrackingPixelsCard } from "@/components/admin/TrackingPixelsCard";
import { MaintenanceCard } from "@/components/admin/MaintenanceCard";

export default function AdminSettings() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Configurações</h1>
          <p className="text-slate-400">Configurações globais do SaaS</p>
        </div>

        <PlanPricingCard />
        
        <PlanFeaturesCard />
        
        <div className="grid gap-6 lg:grid-cols-2">
          <TrackingPixelsCard />
          <MaintenanceCard />
        </div>
      </div>
    </AdminLayout>
  );
}
