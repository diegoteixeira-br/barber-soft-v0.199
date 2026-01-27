

# Plano: Configuração Completa de Planos, Stripe e Pixels de Rastreamento

## Resumo

Este plano implementa uma configuração completa no painel de administração para:
1. **Gerenciamento de Planos** com features configuráveis e desconto anual
2. **Integração com Stripe** para cobranças automáticas
3. **Configuração de Pixels** (Meta, Google, TikTok) para rastreamento de campanhas

---

## Parte 1: Reestruturação dos Planos

### O que será feito
- Renomear os planos de "Profissional/Elite/Empire" para "Inicial/Profissional/Franquias" 
- Adicionar configuração de preço anual (com desconto de 20%)
- Criar sistema de features configuráveis por plano

### Interface no Admin
Será criada uma nova seção "Configuração de Planos" com:
- Cards para cada plano (Inicial, Profissional, Franquias)
- Preço mensal e anual editáveis
- Percentual de desconto anual configurável
- Lista de features com toggle para cada plano

---

## Parte 2: Configuração de Features por Plano

### Features disponíveis
| Feature | Inicial | Profissional | Franquias |
|---------|---------|--------------|-----------|
| Unidades | 1 | 1 | Ilimitado |
| Profissionais | Até 5 | Até 10 | Ilimitado |
| Agenda completa | Sim | Sim | Sim |
| Dashboard financeiro | Sim | Sim | Sim |
| Gestão de clientes | Sim | Sim | Sim |
| Controle de serviços | Sim | Sim | Sim |
| Integração WhatsApp | Nao | Sim | Sim |
| Jackson IA | Nao | Sim | Sim |
| Marketing e automacoes | Nao | Sim | Sim |
| Comissões automáticas | Nao | Sim | Sim |
| Controle de estoque | Nao | Sim | Sim |
| Relatórios avançados | Nao | Sim | Sim |
| Dashboard consolidado | Nao | Nao | Sim |

---

## Parte 3: Configuração de Pixels de Rastreamento

### Nova aba/card no Admin Settings
Será adicionado um novo componente "TrackingPixelsCard" com campos para:

**Meta Pixel (Facebook/Instagram)**
- Pixel ID
- Access Token (opcional, para API de conversões)

**Google Ads / Analytics**
- Google Tag ID (GT-XXXXX ou AW-XXXXX)
- Conversion ID (opcional)

**TikTok Pixel**
- Pixel ID

### Onde os pixels serão injetados
Os scripts serão inseridos no `index.html` ou via componente React que injeta no `<head>`, permitindo:
- Rastreamento de PageView em todas as páginas
- Evento de "Lead" no cadastro
- Evento de "Purchase" na assinatura confirmada

---

## Parte 4: Alterações no Banco de Dados

### Nova estrutura da tabela `saas_settings`
Serão adicionadas as seguintes colunas:

```sql
-- Preços dos planos renomeados
inicial_plan_price DECIMAL(10,2) DEFAULT 99.00,
inicial_plan_annual_price DECIMAL(10,2) DEFAULT 79.00,
profissional_plan_price DECIMAL(10,2) DEFAULT 199.00,
profissional_plan_annual_price DECIMAL(10,2) DEFAULT 159.00,
franquias_plan_price DECIMAL(10,2) DEFAULT 499.00,
franquias_plan_annual_price DECIMAL(10,2) DEFAULT 399.00,
annual_discount_percent INTEGER DEFAULT 20,

-- Pixels de rastreamento
meta_pixel_id TEXT,
meta_access_token TEXT,
google_tag_id TEXT,
google_conversion_id TEXT,
tiktok_pixel_id TEXT
```

### Nova tabela `plan_features`
Para armazenar features configuráveis por plano:

```sql
CREATE TABLE plan_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT NOT NULL,  -- ex: 'max_units', 'whatsapp_integration'
  feature_name TEXT NOT NULL, -- ex: 'Unidades', 'Integração WhatsApp'
  feature_type TEXT NOT NULL, -- 'limit' ou 'boolean'
  inicial_value TEXT,         -- '1' ou 'true'/'false'
  profissional_value TEXT,    -- '1' ou 'true'
  franquias_value TEXT,       -- 'unlimited' ou 'true'
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Parte 5: Novos Componentes

### 1. `PlanFeaturesCard.tsx`
- Gerenciar features de cada plano
- Interface em tabela com toggles/inputs para cada valor
- Botão para adicionar novas features

### 2. `TrackingPixelsCard.tsx`
- Campos para configurar pixels de cada plataforma
- Botão "Testar Pixel" para verificar se está funcionando
- Indicador de status (configurado/não configurado)

### 3. `TrackingScripts.tsx`
- Componente que lê as configurações de pixels
- Injeta scripts no head da página
- Dispara eventos de conversão

---

## Parte 6: Integração com Stripe

### Edge Function para criar sessão de checkout
Criar uma função que:
1. Recebe o plano selecionado e tipo de cobrança (mensal/anual)
2. Busca o preço correto na `saas_settings`
3. Cria ou recupera o `stripe_customer_id` da empresa
4. Gera sessão de checkout do Stripe
5. Retorna URL para redirecionamento

### Webhook do Stripe
Edge function para processar eventos:
- `checkout.session.completed` - Ativar assinatura
- `invoice.paid` - Renovação confirmada
- `invoice.payment_failed` - Marcar como inadimplente
- `customer.subscription.deleted` - Marcar como cancelado

### Disparo de eventos para Pixels
Quando uma assinatura for confirmada, disparar eventos de conversão para:
- Meta: `Purchase`
- Google: `conversion`
- TikTok: `CompletePayment`

---

## Ordem de Implementação

1. **Migração do banco** - Adicionar colunas na `saas_settings` e criar `plan_features`
2. **Hook `useSaasSettings`** - Atualizar para incluir novos campos
3. **PlanPricingCard** - Refatorar para usar novos nomes (Inicial/Profissional/Franquias)
4. **PlanFeaturesCard** - Criar componente de configuração de features
5. **TrackingPixelsCard** - Criar componente de configuração de pixels
6. **TrackingScripts** - Injetar scripts na aplicação
7. **Edge Functions** - Criar funções de checkout e webhook do Stripe
8. **Página de checkout** - Criar fluxo de assinatura no frontend

---

## Seção Técnica

### Arquivos a serem modificados
- `src/pages/admin/AdminSettings.tsx` - Adicionar novos cards
- `src/components/admin/PlanPricingCard.tsx` - Refatorar nomes dos planos
- `src/hooks/useSaasSettings.ts` - Adicionar novos campos

### Arquivos a serem criados
- `src/components/admin/PlanFeaturesCard.tsx`
- `src/components/admin/TrackingPixelsCard.tsx`
- `src/components/TrackingScripts.tsx`
- `supabase/functions/create-checkout-session/index.ts`
- `supabase/functions/stripe-webhook/index.ts`

### Migrações SQL necessárias
1. Adicionar colunas de pixels e preços anuais em `saas_settings`
2. Criar tabela `plan_features` com RLS para super_admin
3. Inserir dados iniciais das features

### Dependências
- Stripe Secret Key configurada nos secrets do backend
- IDs dos Pixels de cada plataforma (fornecidos por você)

