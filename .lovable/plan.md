
# Plano: Simplificar Acesso à Integração do WhatsApp

## Problema Atual
1. A aba "Integração" nas Configurações apenas redireciona para Unidades - é uma etapa desnecessária
2. O botão "Configurar WhatsApp" está escondido em um menu dropdown (3 pontinhos) no card da unidade
3. O usuário precisa navegar por vários cliques para chegar à configuração

## Solução Proposta

### 1. Remover a aba "Integração" das Configurações
- Remover completamente a aba "Integração" pois é redundante
- Reduzir o grid de 9 para 8 colunas
- Resultado: Configurações ficam mais limpas e focadas

### 2. Melhorar o Card de Unidade
Adicionar um botão visível direto no card para configurar WhatsApp:
- Se **desconectado**: Mostrar botão "Conectar WhatsApp" diretamente no card (cor verde, chamativo)
- Se **conectado**: Mostrar badge verde de "Conectado" que também é clicável

Isso elimina a necessidade de abrir o menu para acessar a configuração mais importante.

### 3. Manter opção no menu dropdown
- Manter "Configurar WhatsApp" no menu para consistência
- Usuários que preferirem o menu ainda terão a opção

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/Configuracoes.tsx` | Remover aba "Integração" |
| `src/components/units/UnitCard.tsx` | Adicionar botão/badge clicável de WhatsApp no card |
| `src/components/configuracoes/IntegrationTab.tsx` | Pode ser removido (arquivo não mais utilizado) |

## Visual do Card de Unidade (Após Mudança)

```text
+------------------------------------------+
|  [icon] Barbearia Principal      [...]  |
|                                          |
|  📍 Rua Exemplo, 123                     |
|  📞 (65) 99999-9999                      |
|  👤 João Silva                           |
|                                          |
|  [ Conectar WhatsApp ]  <-- Botão verde  |
|       ou                                 |
|  [✓ WhatsApp Conectado] <-- Badge verde  |
+------------------------------------------+
```

## Benefícios
1. Menos cliques para configurar WhatsApp
2. Interface mais limpa em Configurações
3. Ação principal (WhatsApp) fica visível e acessível
4. Mantém compatibilidade com fluxo existente

## Detalhes Técnicos

### Modificação no UnitCard.tsx
- Adicionar botão no `CardContent` que aparece baseado no status do WhatsApp
- Reutilizar o estado `whatsappStatus` que já existe
- Chamar `onConfigureWhatsApp(unit)` ao clicar

### Modificação no Configuracoes.tsx
- Remover import do `IntegrationTab`
- Remover `Link2` dos imports
- Remover TabsTrigger e TabsContent da aba "integration"
- Ajustar grid de `grid-cols-9` para `grid-cols-8`
