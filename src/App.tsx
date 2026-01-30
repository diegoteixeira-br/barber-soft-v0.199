import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import { HelmetProvider } from "react-helmet-async";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { SuperAdminGuard } from "@/components/auth/SuperAdminGuard";
import { SubscriptionGuard } from "@/components/auth/SubscriptionGuard";
import { UnitProvider } from "@/contexts/UnitContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import LandingPage from "./pages/LandingPage";
import Auth from "./pages/Auth";
import BarberAuth from "./pages/BarberAuth";
import BarberDashboard from "./pages/BarberDashboard";
import BarberInvite from "./pages/BarberInvite";
import Dashboard from "./pages/Dashboard";
import Agenda from "./pages/Agenda";
import Clientes from "./pages/Clientes";
import Profissionais from "./pages/Profissionais";
import Servicos from "./pages/Servicos";
import Financeiro from "./pages/Financeiro";
import Unidades from "./pages/Unidades";
import Marketing from "./pages/Marketing";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCompanies from "./pages/admin/AdminCompanies";
import AdminFeedbacks from "./pages/admin/AdminFeedbacks";
import AdminSettings from "./pages/admin/AdminSettings";

// Institutional pages
import API from "./pages/institucional/API";
import Sobre from "./pages/institucional/Sobre";
import Blog from "./pages/institucional/Blog";
import BlogPost from "./pages/institucional/BlogPost";
import Carreiras from "./pages/institucional/Carreiras";
import Contato from "./pages/institucional/Contato";
import CentralAjuda from "./pages/institucional/CentralAjuda";
import Documentacao from "./pages/institucional/Documentacao";
import Status from "./pages/institucional/Status";
import WhatsAppPage from "./pages/institucional/WhatsAppPage";
import Privacidade from "./pages/institucional/Privacidade";
import Termos from "./pages/institucional/Termos";
import LGPD from "./pages/institucional/LGPD";
import EscolherPlano from "./pages/EscolherPlano";
import ResetDeletionPassword from "./pages/ResetDeletionPassword";

const queryClient = new QueryClient();

import AgendaDisplay from "./pages/AgendaDisplay";

import Assinatura from "./pages/Assinatura";

const ProtectedRoutes = () => (
  <SubscriptionProvider>
    <SubscriptionGuard>
      <UnitProvider>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/agenda/display" element={<AgendaDisplay />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/profissionais" element={<Profissionais />} />
          <Route path="/servicos" element={<Servicos />} />
          <Route path="/financeiro" element={<Financeiro />} />
          <Route path="/unidades" element={<Unidades />} />
          <Route path="/marketing" element={<Marketing />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route path="/assinatura" element={<Assinatura />} />
        </Routes>
      </UnitProvider>
    </SubscriptionGuard>
  </SubscriptionProvider>
);

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Public Landing Page */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/escolher-plano" element={<EscolherPlano />} />
            
            {/* Barber Routes (separate auth flow) */}
            <Route path="/auth/barber" element={<BarberAuth />} />
            <Route path="/barbeiro" element={<BarberDashboard />} />
            <Route path="/convite/:token" element={<BarberInvite />} />
            
            {/* Super Admin Routes */}
            <Route path="/admin" element={<SuperAdminGuard><AdminDashboard /></SuperAdminGuard>} />
            <Route path="/admin/companies" element={<SuperAdminGuard><AdminCompanies /></SuperAdminGuard>} />
            <Route path="/admin/feedbacks" element={<SuperAdminGuard><AdminFeedbacks /></SuperAdminGuard>} />
            <Route path="/admin/settings" element={<SuperAdminGuard><AdminSettings /></SuperAdminGuard>} />
            
            {/* Institutional Pages */}
            <Route path="/api" element={<API />} />
            <Route path="/sobre" element={<Sobre />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/carreiras" element={<Carreiras />} />
            <Route path="/contato" element={<Contato />} />
            <Route path="/ajuda" element={<CentralAjuda />} />
            <Route path="/documentacao" element={<Documentacao />} />
            <Route path="/status" element={<Status />} />
            <Route path="/whatsapp" element={<WhatsAppPage />} />
            <Route path="/privacidade" element={<Privacidade />} />
            <Route path="/termos" element={<Termos />} />
            <Route path="/lgpd" element={<LGPD />} />
            <Route path="/reset-deletion-password" element={<ResetDeletionPassword />} />
            
            {/* Protected Routes */}
            <Route path="/*" element={
              <AuthGuard>
                <ProtectedRoutes />
              </AuthGuard>
            } />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
