import { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  X,
  LayoutDashboard,
  Calendar,
  DollarSign,
  Users,
  MessageCircle,
  Megaphone,
  Building2,
  TrendingUp,
  Clock,
  Scissors,
  Star,
  CheckCircle,
  QrCode,
  Send,
  Bell,
  Gift,
  BarChart3,
  Volume2,
  VolumeX,
  Loader2,
} from "lucide-react";

interface DemoTourModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Narration texts for each slide
const narrationTexts = [
  "Painel de Controle Inteligente. Visualize seu faturamento, agendamentos, quantidade de clientes e ticket médio em tempo real. Acompanhe o desempenho semanal e os próximos horários agendados.",
  "Agenda Completa. Visualize seus agendamentos por dia, semana ou mês. Filtre por profissional e veja todos os detalhes de cada atendimento em um calendário visual e intuitivo.",
  "Controle Financeiro Total. Acompanhe sua receita, despesas e lucro em tempo real. Veja as comissões de cada profissional e tenha controle total do seu caixa.",
  "Gestão de Clientes. Acesse o histórico completo de cada cliente, identifique os clientes VIP, veja a frequência de visitas e nunca mais perca um aniversário.",
  "Integração WhatsApp. Conecte seu WhatsApp escaneando um QR Code e configure mensagens automáticas para lembretes de agendamento, aniversários e resgate de clientes inativos.",
  "Marketing Inteligente. Crie campanhas em massa, acompanhe a taxa de abertura e conversões. Automatize lembretes de aniversário e recupere clientes que não voltaram.",
  "Gestão Multi-Unidades. Gerencie todas as suas filiais de forma centralizada. Acompanhe o faturamento, agendamentos e desempenho de cada unidade em um só lugar.",
];

// Dashboard Preview Slide
const DashboardSlide = () => (
  <div className="bg-background/95 rounded-xl border border-border/50 p-4 md:p-6 h-full">
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
        <LayoutDashboard className="w-4 h-4 text-primary" />
      </div>
      <span className="text-sm font-medium text-foreground">Dashboard</span>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      {[
        { label: "Faturamento", value: "R$ 12.450", icon: DollarSign, change: "+12%" },
        { label: "Agendamentos", value: "48", icon: Calendar, change: "+8%" },
        { label: "Clientes", value: "156", icon: Users, change: "+5%" },
        { label: "Ticket Médio", value: "R$ 85", icon: TrendingUp, change: "+3%" },
      ].map((metric, i) => (
        <div 
          key={i} 
          className="bg-card/50 rounded-lg p-3 border border-border/30 animate-fade-in"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="flex items-center gap-2 mb-1">
            <metric.icon className="w-3 h-3 text-primary" />
            <span className="text-[10px] text-muted-foreground">{metric.label}</span>
          </div>
          <div className="text-lg font-bold text-foreground">{metric.value}</div>
          <span className="text-[10px] text-green-400">{metric.change}</span>
        </div>
      ))}
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-card/30 rounded-lg p-3 border border-border/30">
        <div className="text-xs text-muted-foreground mb-2">Faturamento Semanal</div>
        <div className="flex items-end gap-1 h-20">
          {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
            <div 
              key={i} 
              className="flex-1 bg-gradient-to-t from-primary/60 to-primary rounded-t animate-scale-in"
              style={{ height: `${h}%`, animationDelay: `${i * 50}ms` }}
            />
          ))}
        </div>
      </div>
      <div className="bg-card/30 rounded-lg p-3 border border-border/30">
        <div className="text-xs text-muted-foreground mb-2">Próximos Horários</div>
        <div className="space-y-2">
          {[
            { time: "10:00", client: "João Silva", service: "Corte" },
            { time: "10:30", client: "Pedro Santos", service: "Barba" },
            { time: "11:00", client: "Carlos Lima", service: "Combo" },
          ].map((apt, i) => (
            <div key={i} className="flex items-center gap-2 text-xs animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
              <Clock className="w-3 h-3 text-primary" />
              <span className="text-muted-foreground">{apt.time}</span>
              <span className="text-foreground">{apt.client}</span>
              <span className="text-primary ml-auto">{apt.service}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Agenda Preview Slide
const AgendaSlide = () => (
  <div className="bg-background/95 rounded-xl border border-border/50 p-4 md:p-6 h-full">
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
        <Calendar className="w-4 h-4 text-primary" />
      </div>
      <span className="text-sm font-medium text-foreground">Agenda</span>
      <div className="ml-auto flex gap-1">
        {["Dia", "Semana", "Mês"].map((v, i) => (
          <button key={i} className={`px-2 py-1 text-[10px] rounded ${i === 1 ? 'bg-primary text-primary-foreground' : 'bg-card/50 text-muted-foreground'}`}>
            {v}
          </button>
        ))}
      </div>
    </div>
    
    <div className="grid grid-cols-7 gap-1 mb-3">
      {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((day, i) => (
        <div key={i} className="text-center text-[10px] text-muted-foreground py-1">{day}</div>
      ))}
    </div>
    
    <div className="space-y-2">
      {[
        { time: "09:00", appointments: [{ name: "João", service: "Corte", barber: "Carlos", color: "bg-blue-500/30" }] },
        { time: "10:00", appointments: [{ name: "Pedro", service: "Barba", barber: "Carlos", color: "bg-green-500/30" }, { name: "Lucas", service: "Corte", barber: "André", color: "bg-purple-500/30" }] },
        { time: "11:00", appointments: [{ name: "Marcos", service: "Combo", barber: "André", color: "bg-primary/30" }] },
        { time: "14:00", appointments: [{ name: "Rafael", service: "Corte", barber: "Carlos", color: "bg-orange-500/30" }] },
      ].map((slot, i) => (
        <div key={i} className="flex gap-2 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
          <div className="w-12 text-[10px] text-muted-foreground pt-1">{slot.time}</div>
          <div className="flex-1 flex gap-1">
            {slot.appointments.map((apt, j) => (
              <div key={j} className={`flex-1 ${apt.color} rounded p-2 border border-border/30`}>
                <div className="text-xs font-medium text-foreground">{apt.name}</div>
                <div className="text-[10px] text-muted-foreground">{apt.service} • {apt.barber}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Financeiro Preview Slide
const FinanceiroSlide = () => (
  <div className="bg-background/95 rounded-xl border border-border/50 p-4 md:p-6 h-full">
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
        <DollarSign className="w-4 h-4 text-primary" />
      </div>
      <span className="text-sm font-medium text-foreground">Financeiro</span>
    </div>
    
    <div className="grid grid-cols-3 gap-3 mb-4">
      {[
        { label: "Receita", value: "R$ 15.800", color: "text-green-400" },
        { label: "Despesas", value: "R$ 3.200", color: "text-red-400" },
        { label: "Lucro", value: "R$ 12.600", color: "text-primary" },
      ].map((item, i) => (
        <div key={i} className="bg-card/50 rounded-lg p-3 border border-border/30 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
          <div className="text-[10px] text-muted-foreground mb-1">{item.label}</div>
          <div className={`text-lg font-bold ${item.color}`}>{item.value}</div>
        </div>
      ))}
    </div>
    
    <div className="bg-card/30 rounded-lg p-3 border border-border/30 mb-3">
      <div className="text-xs text-muted-foreground mb-2">Comissões do Mês</div>
      <div className="space-y-2">
        {[
          { name: "Carlos Silva", value: "R$ 2.450", services: 48 },
          { name: "André Santos", value: "R$ 1.980", services: 42 },
          { name: "Pedro Lima", value: "R$ 1.650", services: 35 },
        ].map((barber, i) => (
          <div key={i} className="flex items-center gap-2 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
              <Scissors className="w-3 h-3 text-primary" />
            </div>
            <span className="text-xs text-foreground flex-1">{barber.name}</span>
            <span className="text-[10px] text-muted-foreground">{barber.services} serviços</span>
            <span className="text-xs font-medium text-primary">{barber.value}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Clientes Preview Slide
const ClientesSlide = () => (
  <div className="bg-background/95 rounded-xl border border-border/50 p-4 md:p-6 h-full">
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
        <Users className="w-4 h-4 text-primary" />
      </div>
      <span className="text-sm font-medium text-foreground">Clientes</span>
      <span className="ml-auto text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full">256 cadastrados</span>
    </div>
    
    <div className="space-y-2">
      {[
        { name: "João Silva", phone: "(11) 99999-0001", visits: 12, lastVisit: "Há 5 dias", vip: true },
        { name: "Pedro Santos", phone: "(11) 99999-0002", visits: 8, lastVisit: "Há 12 dias", vip: false },
        { name: "Carlos Lima", phone: "(11) 99999-0003", visits: 15, lastVisit: "Hoje", vip: true },
        { name: "Rafael Costa", phone: "(11) 99999-0004", visits: 3, lastVisit: "Há 30 dias", vip: false },
        { name: "Lucas Oliveira", phone: "(11) 99999-0005", visits: 6, lastVisit: "Há 7 dias", vip: false },
      ].map((client, i) => (
        <div key={i} className="flex items-center gap-3 bg-card/30 rounded-lg p-2 border border-border/30 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-xs font-medium text-primary">{client.name.charAt(0)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-foreground truncate">{client.name}</span>
              {client.vip && <Star className="w-3 h-3 text-primary fill-primary" />}
            </div>
            <span className="text-[10px] text-muted-foreground">{client.phone}</span>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-foreground">{client.visits} visitas</div>
            <div className="text-[10px] text-muted-foreground">{client.lastVisit}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// WhatsApp Preview Slide
const WhatsAppSlide = () => (
  <div className="bg-background/95 rounded-xl border border-border/50 p-4 md:p-6 h-full">
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
        <MessageCircle className="w-4 h-4 text-green-500" />
      </div>
      <span className="text-sm font-medium text-foreground">WhatsApp</span>
      <span className="ml-auto flex items-center gap-1 text-[10px] text-green-400">
        <CheckCircle className="w-3 h-3" /> Conectado
      </span>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="flex flex-col items-center justify-center bg-card/30 rounded-lg p-4 border border-border/30">
        <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center mb-2 animate-scale-in">
          <QrCode className="w-20 h-20 text-background" />
        </div>
        <span className="text-[10px] text-muted-foreground">Escaneie para conectar</span>
      </div>
      
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground mb-2">Mensagens Automáticas</div>
        {[
          { icon: Bell, label: "Lembrete de Agendamento", active: true },
          { icon: Gift, label: "Aniversário do Cliente", active: true },
          { icon: Clock, label: "Resgate de Inativos", active: true },
          { icon: CheckCircle, label: "Confirmação de Horário", active: false },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-xs animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
            <item.icon className={`w-3 h-3 ${item.active ? 'text-green-400' : 'text-muted-foreground'}`} />
            <span className="text-foreground flex-1">{item.label}</span>
            <div className={`w-6 h-3 rounded-full ${item.active ? 'bg-green-500' : 'bg-muted'} flex items-center ${item.active ? 'justify-end' : 'justify-start'} p-0.5`}>
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Marketing Preview Slide
const MarketingSlide = () => (
  <div className="bg-background/95 rounded-xl border border-border/50 p-4 md:p-6 h-full">
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
        <Megaphone className="w-4 h-4 text-primary" />
      </div>
      <span className="text-sm font-medium text-foreground">Marketing</span>
    </div>
    
    <div className="grid grid-cols-3 gap-2 mb-4">
      {[
        { label: "Enviadas", value: "1.250", icon: Send },
        { label: "Abertas", value: "89%", icon: CheckCircle },
        { label: "Conversões", value: "32%", icon: TrendingUp },
      ].map((stat, i) => (
        <div key={i} className="bg-card/50 rounded-lg p-2 border border-border/30 text-center animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
          <stat.icon className="w-4 h-4 text-primary mx-auto mb-1" />
          <div className="text-sm font-bold text-foreground">{stat.value}</div>
          <div className="text-[10px] text-muted-foreground">{stat.label}</div>
        </div>
      ))}
    </div>
    
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground mb-1">Campanhas Recentes</div>
      {[
        { name: "Promoção de Verão", sent: 450, opens: "92%", status: "Enviada" },
        { name: "Black Friday", sent: 380, opens: "88%", status: "Enviada" },
        { name: "Aniversariantes Dezembro", sent: 45, opens: "95%", status: "Ativa" },
      ].map((campaign, i) => (
        <div key={i} className="flex items-center gap-2 bg-card/30 rounded-lg p-2 border border-border/30 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
          <Megaphone className="w-4 h-4 text-primary" />
          <div className="flex-1">
            <div className="text-xs font-medium text-foreground">{campaign.name}</div>
            <div className="text-[10px] text-muted-foreground">{campaign.sent} enviadas • {campaign.opens} abertas</div>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${campaign.status === 'Ativa' ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'}`}>
            {campaign.status}
          </span>
        </div>
      ))}
    </div>
  </div>
);

// Multi-Unidades Preview Slide
const UnidadesSlide = () => (
  <div className="bg-background/95 rounded-xl border border-border/50 p-4 md:p-6 h-full">
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
        <Building2 className="w-4 h-4 text-primary" />
      </div>
      <span className="text-sm font-medium text-foreground">Multi-Unidades</span>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {[
        { name: "Unidade Centro", address: "Rua Principal, 123", revenue: "R$ 18.500", appointments: 85, barbers: 4 },
        { name: "Unidade Shopping", address: "Av. Brasil, 456", revenue: "R$ 22.300", appointments: 102, barbers: 5 },
        { name: "Unidade Zona Sul", address: "Rua das Flores, 789", revenue: "R$ 15.200", appointments: 68, barbers: 3 },
        { name: "Unidade Norte", address: "Av. Norte, 321", revenue: "R$ 12.800", appointments: 54, barbers: 3 },
      ].map((unit, i) => (
        <div key={i} className="bg-card/30 rounded-lg p-3 border border-border/30 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-foreground">{unit.name}</span>
          </div>
          <div className="text-[10px] text-muted-foreground mb-2">{unit.address}</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-xs font-bold text-primary">{unit.revenue}</div>
              <div className="text-[8px] text-muted-foreground">Receita</div>
            </div>
            <div>
              <div className="text-xs font-bold text-foreground">{unit.appointments}</div>
              <div className="text-[8px] text-muted-foreground">Agendamentos</div>
            </div>
            <div>
              <div className="text-xs font-bold text-foreground">{unit.barbers}</div>
              <div className="text-[8px] text-muted-foreground">Profissionais</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const slides = [
  {
    id: 1,
    title: "Painel de Controle Inteligente",
    description: "Visualize faturamento, agendamentos e métricas em tempo real",
    icon: LayoutDashboard,
    component: DashboardSlide,
  },
  {
    id: 2,
    title: "Agenda Completa",
    description: "Visualização diária, semanal e mensal. Filtre por profissional",
    icon: Calendar,
    component: AgendaSlide,
  },
  {
    id: 3,
    title: "Controle Financeiro Total",
    description: "Caixa, despesas, comissões e estoque em um só lugar",
    icon: DollarSign,
    component: FinanceiroSlide,
  },
  {
    id: 4,
    title: "Gestão de Clientes",
    description: "Histórico completo, aniversários e comportamento de visitas",
    icon: Users,
    component: ClientesSlide,
  },
  {
    id: 5,
    title: "Integração WhatsApp",
    description: "Atendimento automático 24h. Conecte escaneando o QR Code",
    icon: MessageCircle,
    component: WhatsAppSlide,
  },
  {
    id: 6,
    title: "Marketing Inteligente",
    description: "Campanhas em massa, lembretes de aniversário e resgate de inativos",
    icon: Megaphone,
    component: MarketingSlide,
  },
  {
    id: 7,
    title: "Gestão Multi-Unidades",
    description: "Gerencie todas as suas filiais de forma centralizada",
    icon: Building2,
    component: UnidadesSlide,
  },
];

export const DemoTourModal = ({ open, onOpenChange }: DemoTourModalProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCache = useRef<Map<number, string>>(new Map());

  const playNarration = useCallback(async (slideIndex: number) => {
    if (isMuted) return;
    
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Check cache first
    if (audioCache.current.has(slideIndex)) {
      const audioUrl = audioCache.current.get(slideIndex)!;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.play().catch(console.error);
      return;
    }

    setIsLoadingAudio(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            text: narrationTexts[slideIndex],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Cache the audio URL
      audioCache.current.set(slideIndex, audioUrl);

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      await audio.play();
    } catch (error) {
      console.error("Failed to play narration:", error);
    } finally {
      setIsLoadingAudio(false);
    }
  }, [isMuted]);

  // Preload all audio in background when modal opens
  const preloadAllAudio = useCallback(async () => {
    const preloadPromises = narrationTexts.map(async (text, index) => {
      // Skip if already cached
      if (audioCache.current.has(index)) return;

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ text }),
          }
        );

        if (response.ok) {
          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          audioCache.current.set(index, audioUrl);
          console.log(`Preloaded audio for slide ${index + 1}`);
        }
      } catch (error) {
        console.error(`Failed to preload audio for slide ${index + 1}:`, error);
      }
    });

    // Load all in parallel
    await Promise.allSettled(preloadPromises);
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  // Preload all audio when modal opens
  useEffect(() => {
    if (open) {
      preloadAllAudio();
    }
  }, [open, preloadAllAudio]);

  // Play narration when slide changes
  useEffect(() => {
    if (open && !isMuted) {
      playNarration(currentSlide);
    }
  }, [currentSlide, open, isMuted, playNarration]);


  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
      if (e.key === "Escape") onOpenChange(false);
      if (e.key === "m" || e.key === "M") {
        setIsMuted((prev) => !prev);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, nextSlide, prevSlide, onOpenChange]);

  // Reset and cleanup on open/close
  useEffect(() => {
    if (open) {
      setCurrentSlide(0);
    } else {
      // Stop audio when modal closes
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    }
  }, [open]);

  // Toggle mute handler
  const handleToggleMute = useCallback(() => {
    if (!isMuted) {
      // Muting - stop current audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    } else {
      // Unmuting - play current slide narration
      playNarration(currentSlide);
    }
    setIsMuted((prev) => !prev);
  }, [isMuted, currentSlide, playNarration]);

  const CurrentSlideComponent = slides[currentSlide].component;
  const CurrentIcon = slides[currentSlide].icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 bg-background/95 backdrop-blur-xl border-primary/20 overflow-hidden">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-background to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <CurrentIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">{slides[currentSlide].title}</h3>
              <p className="text-sm text-muted-foreground">{slides[currentSlide].description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Audio loading indicator */}
            {isLoadingAudio && (
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
            )}
            
            {/* Mute/Unmute button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleMute}
              className="text-muted-foreground hover:text-foreground"
              title={isMuted ? "Ativar narração (M)" : "Silenciar narração (M)"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground hover:text-foreground"
              title="Fechar (ESC)"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="h-full pt-20 pb-24 px-4 md:px-8 overflow-hidden">
          <div className="h-full flex items-center justify-center">
            <div className="w-full max-w-4xl animate-fade-in" key={currentSlide}>
              <CurrentSlideComponent />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-background to-transparent">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={prevSlide}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            
            {/* Progress Indicators */}
            <div className="flex items-center gap-2">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? "w-8 bg-primary"
                      : "w-2 bg-muted hover:bg-muted-foreground"
                  }`}
                />
              ))}
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={nextSlide}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>
          
          {/* Slide Counter */}
          <div className="text-center mt-2">
            <span className="text-xs text-muted-foreground">
              {currentSlide + 1} / {slides.length}
            </span>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
};
