# Protocolo de Produção NeuroNex - V1.0

## 1. Otimização de Performance (Core Web Vitals)
- [ ] **Lazy Loading Granular**: Implementar `React.lazy` em rotas internas do dashboard (`Dashboard`, `Agenda`, `Patients`).
- [ ] **Image Optimization**: Converter assets estáticos (logo, backgrounds) para formato WebP ou AVIF.
- [ ] **Bundle Analysis**: Rodar `npm run build -- --stats` para identificar e dividir chunks grandes de JavaScript.
- [ ] **Memoization Audit**: Revisar componentes críticos (`Calendar`, `TiptapEditor`) para evitar re-renders desnecessários.

## 2. Hardening de Segurança
- [ ] **Audit de RLS (Row Level Security)**:
    - Garantir que `auth.uid()` seja checado em TODAS as políticas de `select`, `insert`, `update`, `delete`.
    - Verificar isolamento entre tenants (Psicólogos diferentes não podem ver dados uns dos outros).
- [ ] **Sanitização de Input**: Revisar todos os campos de formulário para prevenir XSS, especialmente nas notas ricas (Tiptap).
- [ ] **Limitação de Rate**: Configurar limites de requisição na Edge Function do Supabase para prevenir abuso de API.

## 3. Infraestrutura Financeira (NeuroBank)
- [ ] **Ambiente Sandbox Stripe**:
    - Validar fluxo completo de Onboarding Connect.
    - Testar webhooks de `payment_intent.succeeded` e `invoice.paid`.
- [ ] **Tratamento de Falhas**: Implementar UI para falha de pagamento e cartão recusado.
- [ ] **Logs de Transação**: Criar tabela de auditoria para todos os eventos financeiros críticos.

## 4. Experiência Mobile (Polimento Final)
- [ ] **Touch Targets**: Garantir que todos os botões tenham área de toque mínima de 44px.
- [ ] **Safe Areas**: Revisar preenchimento superior e inferior para iPhone 14/15/16 (Dynamic Island e Home Bar).
- [ ] **Gestures**: Implementar "swipe to delete" ou "swipe to action" nas listas de notificações e pacientes.

## 5. Analytics & Monitoramento (Privacidade First)
- [ ] **PostHog Self-Hosted**: Configurar instância para análise de uso sem compartilhar dados com terceiros.
- [ ] **Error Tracking**: Configurar Sentry para capturar erros de frontend silenciosos.
- [ ] **Logs de Acesso**: Monitorar logins suspeitos ou trocas de IP frequentes.

## 6. Lançamento
- [ ] **Domínio Final**: Configurar `neuronex.ai` (exemplo) com SSL/TLS rigoroso.
- [ ] **Warm-up**: Realizar soft-launch com 5 psicólogos parceiros para feedback real.
- [ ] **Marketing**: Preparar assets da loja de aplicativos (se houver PWA/Native wrapper).
