

# Plano: Mensagens Padrao Editaveis nas Automacoes de Marketing

## Resumo do Pedido

O usuario quer que:
1. As mensagens de template (Aniversario, Resgate, Lembrete) fiquem **sempre editaveis**, mesmo quando a automacao estiver desativada
2. As mensagens tenham os **valores padrao** que ele especificou
3. Na mensagem de Lembrete, as palavras **CONFIRMADO** e **CANCELAR** sejam fixas e nao editaveis

---

## Solucao Proposta

### 1. Remover Restricao de Edicao

Atualmente, os textareas ficam desabilitados (`disabled={!birthdayEnabled}`) quando o switch esta desligado. 

**Mudanca:** Remover o atributo `disabled` de TODOS os textareas de mensagem.

### 2. Definir Valores Padrao das Mensagens

Quando as configuracoes carregarem vazias, usar os textos fornecidos pelo usuario:

| Campo | Mensagem Padrao |
|-------|-----------------|
| Aniversario | "Salve {{nome}}! Hoje o dia e todo seu! ..." |
| Resgate | "E ai {{nome}}, sumido hein! ..." |
| Lembrete (editavel) | "Ola {{nome}}! ... Tmj" |
| Lembrete (fixo) | "CONFIRMADO / CANCELAR" - nao editavel |

### 3. Estrutura Especial para Lembrete

Para proteger as palavras CONFIRMADO e CANCELAR, vou dividir a mensagem de lembrete em duas partes:

```text
┌─────────────────────────────────────────────────────┐
│  PARTE EDITAVEL (textarea)                          │
│  "Ola {{nome}}! Lembrando do seu agendamento..."    │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│  PARTE FIXA (texto readonly cinza)                  │
│  "Para o sistema reconhecer, responda apenas:       │
│   CONFIRMADO / CANCELAR"                            │
└─────────────────────────────────────────────────────┘
```

A mensagem final enviada sera: `PARTE_EDITAVEL + "\n\n" + PARTE_FIXA`

---

## Mensagens Padrao Completas

### Aniversario
```text
Salve {{nome}}! Hoje o dia é todo seu! 🥳

👏 Passando aqui pra te desejar um feliz aniversário e tudo de melhor. 

Que você continue com essa vibe gente boa de sempre! Sucesso, meu parceiro! 

Quando quiser comemorar com aquele visual na régua, tamos aqui. 🍾✂️ 

Que tal aproveitar e já marcar seu horário? Manda um alô aqui que eu vejo a agenda pra você! 📅

(Se preferir não receber nossos avisos, digite SAIR. Tmj)
```

### Resgate
```text
E aí {{nome}}, sumido hein! 

👀 Rapaz, a gente tava aqui comentando... faz tempo que você não aparece! 

A cadeira tá sentindo sua falta e a resenha também. 😂 Bora renovar esse visual e colocar o papo em dia? 

O café tá quente e a tesoura tá afiada te esperando. ☕✂️ 

Que tal aproveitar e já marcar seu horário? Manda um alô aqui que eu vejo a agenda pra você! 📅

(Se não quiser receber esses toques, digite SAIR. Sem stress, a amizade continua! até mais👊)
```

### Lembrete (Parte Editavel)
```text
Olá {{nome}}! 👋

Lembrando do seu agendamento para HOJE às {{horario}} com {{profissional}}.

📍 {{servico}}

Aguardamos você! Se precisar remarcar, entre em contato. Tmj 💈
```

### Lembrete (Parte Fixa - NAO EDITAVEL)
```text
👇 Para o sistema reconhecer, responda apenas:

📌 *CONFIRMADO* para confirmar presença

📌 *CANCELAR* se não puder comparecer
```

---

## Mudancas Tecnicas

### Arquivo: src/components/marketing/AutomationsTab.tsx

1. **Definir constantes com valores padrao**
```typescript
const DEFAULT_BIRTHDAY_MESSAGE = `Salve {{nome}}! Hoje o dia é todo seu! 🥳...`;
const DEFAULT_RESCUE_MESSAGE = `E aí {{nome}}, sumido hein!...`;
const DEFAULT_REMINDER_MESSAGE = `Olá {{nome}}! 👋...`;
const FIXED_REMINDER_SUFFIX = `👇 Para o sistema reconhecer...`;
```

2. **Usar valores padrao no useEffect**
```typescript
setBirthdayMessage(settings.birthday_message_template || DEFAULT_BIRTHDAY_MESSAGE);
setRescueMessage(settings.rescue_message_template || DEFAULT_RESCUE_MESSAGE);
setReminderMessage(settings.appointment_reminder_template || DEFAULT_REMINDER_MESSAGE);
```

3. **Remover `disabled` dos textareas**
```diff
- disabled={!birthdayEnabled}
+ // sempre editavel
```

4. **Adicionar bloco fixo no Lembrete**
Mostrar a parte fixa abaixo do textarea como um card cinza readonly.

5. **Concatenar no save**
```typescript
appointment_reminder_template: reminderMessage + "\n\n" + FIXED_REMINDER_SUFFIX,
```

---

## Arquivos Modificados

| Arquivo | Mudanca |
|---------|---------|
| src/components/marketing/AutomationsTab.tsx | Valores padrao, remover disabled, parte fixa do lembrete |

---

## Resultado Visual Esperado

- Todos os textareas sempre editaveis
- Mensagens com texto padrao ao carregar pela primeira vez
- Bloco cinza abaixo do textarea de Lembrete mostrando a parte fixa (CONFIRMADO/CANCELAR) que sera adicionada automaticamente

