# Neuronex — Adequação de Segurança, Governança e Asaas BaaS

## 1. Contexto

A Neuronex é uma plataforma voltada para psicólogos e processa dados pessoais, clínicos, financeiros, documentos, prontuários, transcrições, mensagens, dados de autenticação e informações relacionadas a operações financeiras.

A infraestrutura atual utiliza, principalmente:

* GitHub para versionamento;
* Vercel para hospedagem e deploy;
* Supabase Cloud para banco de dados, autenticação e Edge Functions;
* Cloudflare R2 para armazenamento privado de documentos;
* Asaas BaaS para funcionalidades financeiras;
* provedores externos de inteligência artificial e comunicação.

A Asaas enviou à Neuronex um questionário de segurança e governança que precisa ser respondido como parte do processo de aprovação da integração BaaS.

As perguntas desse formulário devem ser tratadas como requisitos reais do projeto, e não apenas como uma etapa documental de aprovação.

## 2. Objetivo deste documento

Este documento deve orientar agentes de desenvolvimento, auditorias e decisões técnicas relacionadas à adequação da Neuronex aos requisitos:

* do questionário de segurança da Asaas;
* de proteção de dados;
* de governança operacional;
* de desenvolvimento seguro;
* de controle de acesso;
* de continuidade do negócio;
* de resposta a incidentes;
* de gestão de fornecedores;
* de uso seguro de inteligência artificial;
* de LGPD;
* das obrigações aplicáveis ao nicho de psicologia.

O objetivo imediato é maximizar a quantidade de requisitos que possam ser atendidos e comprovados sem comprometer a estabilidade do MVP atualmente em produção.

## 3. Princípio central

Um requisito somente pode ser considerado atendido quando houver:

1. controle técnico ou operacional definido;
2. responsável identificado;
3. primeira execução realizada;
4. evidência verificável;
5. procedimento de manutenção ou revisão;
6. forma de comprovar o controle futuramente.

Não confundir:

* intenção futura com implementação;
* documentação com execução;
* código existente com controle seguro;
* RLS habilitada com política correta;
* rota protegida no frontend com autorização no backend;
* ausência de incidente conhecido com existência de monitoramento.

## 4. Diretriz de estabilidade

A estabilidade do MVP tem prioridade sobre mudanças estruturais realizadas com pressa.

Neste momento, não devem ser feitas alterações bruscas apenas para aumentar a quantidade de respostas positivas no formulário.

Evitar, sem plano, testes e aprovação:

* reestruturação completa do banco;
* exclusão em massa de tabelas ou colunas;
* migração de autenticação;
* substituição ampla de políticas RLS;
* alteração destrutiva de relacionamentos;
* migração completa de dados;
* modificação de fluxos financeiros críticos;
* alteração de chaves sem plano de rotação;
* mudanças diretas em produção;
* limpeza automática de componentes ou funções.

Toda alteração técnica deve ser:

* pequena;
* isolada;
* reversível;
* documentada;
* testável;
* acompanhada de rollback;
* aprovada antes de atingir produção.

## 5. Regras de segurança não negociáveis

### 5.1. Repositório público

A aplicação deve continuar segura mesmo que todo o código-fonte seja público.

Nunca depender do sigilo do código para proteger:

* dados;
* credenciais;
* regras de autorização;
* operações financeiras;
* endpoints;
* documentos;
* integrações externas.

### 5.2. Frontend

Nunca confiar no frontend como autoridade de segurança.

O frontend pode:

* esconder botões;
* controlar navegação;
* melhorar a experiência;
* bloquear visualmente páginas.

O frontend não pode ser o responsável final por:

* validar permissões;
* decidir quem pode acessar um paciente;
* autorizar operações financeiras;
* autorizar downloads;
* proteger tabelas;
* validar propriedade de registros;
* liberar ações administrativas.

Toda autorização relevante deve ocorrer no backend, banco de dados, Edge Function ou serviço responsável.

### 5.3. Segredos

Nunca armazenar no frontend ou no repositório:

* `service_role`;
* chaves privadas;
* chaves Asaas;
* credenciais R2;
* segredos de webhook;
* segredos OAuth;
* chaves de assinatura;
* tokens administrativos;
* senhas de banco;
* credenciais de provedores de IA.

Secrets devem permanecer somente em mecanismos apropriados, como:

* Supabase Edge Function Secrets;
* Vercel Environment Variables;
* GitHub Actions Secrets;
* Cloudflare Secrets;
* cofres de segredo;
* infraestrutura exclusivamente server-side.

### 5.4. Dados reais

Nunca copiar dados reais de pacientes para:

* ambiente local;
* seeds;
* testes;
* capturas públicas;
* documentação;
* issues;
* Pull Requests;
* prompts de agentes;
* ferramentas de depuração externas.

Todos os ambientes de desenvolvimento e testes devem utilizar dados fictícios.

### 5.5. Service role

A chave `service_role`:

* nunca pode chegar ao navegador;
* nunca pode estar em código frontend;
* nunca pode ser incluída em aplicativos distribuídos;
* nunca pode ser exibida em logs;
* deve ser usada apenas em operações server-side autorizadas;
* deve ter seu uso minimizado;
* deve ser rotacionada em caso de suspeita de exposição.

## 6. Governança para operação administrada por uma pessoa

A Neuronex atualmente é administrada por um único gestor.

Enquanto não houver equipe, a mesma pessoa pode acumular os papéis de:

* responsável pela segurança;
* responsável pela privacidade;
* responsável por incidentes;
* responsável por fornecedores;
* responsável por releases;
* responsável por suporte;
* responsável por continuidade.

A ausência de equipe não elimina a necessidade de processos.

Devem ser utilizados controles compensatórios, como:

* checklist obrigatório;
* registro de decisão;
* aprovação explícita antes de produção;
* logs de mudanças;
* Pull Requests;
* testes automatizados;
* relatórios de auditoria;
* revisão periódica de acessos;
* registro de incidentes;
* apoio externo pontual para áreas críticas;
* revisão independente quando possível.

Não inventar funcionários, equipes, departamentos ou revisores inexistentes nos documentos de compliance.

## 7. Estrutura documental

Devem existir duas áreas separadas.

### 7.1. Documentação pública

Diretório sugerido:

```text
docs/compliance-public/
```

Pode conter:

* visão geral de segurança;
* Política de Privacidade;
* Termos de Uso;
* lista de subprocessadores;
* canal de privacidade;
* canal de suporte;
* política de divulgação de vulnerabilidades;
* resumo sobre uso responsável de IA;
* informações públicas sobre tratamento de dados.

Essa documentação não deve revelar detalhes que facilitem ataques.

### 7.2. Documentação interna

Diretório sugerido:

```text
private-compliance/
```

Esse diretório deve ser adicionado ao `.gitignore`.

Deve conter:

```text
private-compliance/
├── 00-contexto-e-responsaveis.md
├── 01-matriz-questionario-asaas.md
├── 02-indice-de-evidencias.md
├── 03-plano-de-adequacao.md
├── 04-registro-de-aprovacoes.md
├── policies/
│   ├── security-policy.md
│   ├── access-control-policy.md
│   ├── incident-response-policy.md
│   ├── backup-disaster-recovery-policy.md
│   ├── vulnerability-management-policy.md
│   ├── supplier-management-policy.md
│   ├── data-retention-policy.md
│   ├── privacy-data-subject-policy.md
│   ├── secure-development-policy.md
│   └── ai-data-processing-policy.md
├── procedures/
│   ├── access-review-procedure.md
│   ├── production-release-procedure.md
│   ├── emergency-access-procedure.md
│   ├── incident-communication-procedure.md
│   ├── backup-restore-procedure.md
│   ├── vulnerability-scan-procedure.md
│   ├── support-escalation-procedure.md
│   └── data-subject-request-procedure.md
├── registers/
│   ├── access-register.md
│   ├── supplier-register.md
│   ├── vulnerability-register.md
│   ├── incident-register.md
│   ├── backup-register.md
│   └── change-register.md
└── evidence/
    ├── README.md
    └── evidence-register.md
```

## 8. Matriz do questionário da Asaas

Todas as perguntas recebidas no formulário devem ser transcritas para:

```text
private-compliance/01-matriz-questionario-asaas.md
```

Para cada pergunta, registrar:

* número;
* texto integral;
* resposta recomendada;
* status atual;
* justificativa;
* evidência existente;
* evidência necessária;
* risco de responder “Sim”;
* lacuna identificada;
* ação corretiva;
* responsável;
* prioridade;
* prazo;
* critério de conclusão;
* caminho da evidência;
* texto sugerido para colar no formulário.

Status permitidos:

* `COMPROVADO`;
* `PARCIAL`;
* `AUSENTE`;
* `NÃO APLICÁVEL`;
* `BLOQUEADO POR DECISÃO DO GESTOR`.

Quando um controle tiver sido implantado recentemente, a justificativa pode indicar:

> Controle formalizado e colocado em operação em sua primeira versão, com responsável definido, primeira execução registrada e processo de amadurecimento contínuo.

Essa formulação só pode ser utilizada quando a primeira execução realmente tiver ocorrido.

## 9. Auditoria técnica obrigatória

A auditoria deve analisar, no mínimo:

### 9.1. Autenticação

* login;
* recuperação de senha;
* confirmação de e-mail;
* MFA;
* sessões;
* expiração;
* revogação;
* proteção contra força bruta;
* proteção contra senhas comprometidas;
* separação entre conta de paciente e profissional.

### 9.2. Autorização

* políticas RLS;
* propriedade dos registros;
* acesso entre psicólogos;
* acesso entre pacientes;
* acesso administrativo;
* funções privilegiadas;
* bypasses;
* APIs públicas;
* autorização em Edge Functions;
* validação de tokens.

### 9.3. Supabase

Verificar:

* todas as tabelas;
* policies;
* grants de `anon`;
* grants de `authenticated`;
* funções `SECURITY DEFINER`;
* funções sem `search_path` fixo;
* RPCs expostas;
* tabelas sem policies;
* policies permissivas;
* uso de `service_role`;
* buckets;
* objetos públicos;
* migrações;
* diferenças entre código local e Cloud;
* Edge Functions existentes somente no Cloud;
* Edge Functions existentes somente no repositório.

### 9.4. Edge Functions

Funções com `verify_jwt=false` devem possuir justificativa explícita.

Motivos aceitáveis podem incluir:

* webhook com validação de assinatura;
* callback OAuth;
* token público de uso único;
* rota pública restrita;
* cron protegido por segredo;
* endpoint server-to-server autenticado.

Cada exceção deve possuir:

* razão;
* controle compensatório;
* proteção contra abuso;
* validação própria;
* rate limiting quando aplicável;
* logs;
* responsável;
* teste.

### 9.5. Storage e documentos

Documentos de pacientes e psicólogos devem:

* permanecer privados;
* utilizar URLs assinadas de curta duração;
* validar propriedade no backend;
* não usar URLs públicas permanentes;
* não ser listáveis publicamente;
* ter metadados vinculados ao proprietário;
* possuir exclusão controlada;
* não aparecer em logs.

O Supabase deve armazenar os metadados e regras de autorização.

O Cloudflare R2 deve ser utilizado como armazenamento privado de objetos quando definido pela arquitetura.

### 9.6. GitHub

Verificar:

* arquivos ignorados;
* histórico de secrets;
* regras de branch;
* Pull Requests;
* GitHub Actions;
* scans de secrets;
* análise de dependências;
* testes;
* build;
* revisão de alterações;
* arquivos legados ou sensíveis no repositório público.

### 9.7. Vercel

Verificar:

* variáveis por ambiente;
* configurações de Preview;
* configurações de Production;
* logs;
* headers;
* tratamento de erros;
* endpoints server-side;
* exposição de variáveis;
* proteção de deploy;
* domínios.

### 9.8. Asaas BaaS

Auditar:

* armazenamento de chaves;
* autenticação das operações;
* criação de subcontas;
* PIX;
* cobranças;
* transferências;
* pagamentos;
* webhooks;
* idempotência;
* logs de operação;
* respostas internas;
* tratamento de erros;
* conciliação;
* confirmação antes de saída de dinheiro;
* PIN financeiro;
* auditoria das operações;
* ambiente sandbox e produção.

## 10. Separação de ambientes

O modelo final desejado é:

```text
Desenvolvimento local
        ↓
Homologação
        ↓
Produção
```

Enquanto não houver homologação remota, o fluxo provisório deve ser:

```text
Supabase local
        ↓
Testes com dados fictícios
        ↓
Migration versionada
        ↓
Revisão humana
        ↓
Produção
```

Regras:

* desenvolvimento local não pode apontar automaticamente para produção;
* ausência de variáveis deve causar falha explícita;
* alterações de banco devem ser realizadas por migrations;
* dados reais não devem ser usados em desenvolvimento;
* produção não deve receber alterações experimentais;
* Preview da Vercel não deve possuir credenciais administrativas;
* alterações devem ter rollback;
* toda migration precisa ser revisada antes da aplicação.

## 11. Desenvolvimento seguro

O fluxo mínimo de mudança deve ser:

1. criar branch;
2. implementar alteração;
3. criar migration quando necessário;
4. executar TypeScript check;
5. executar testes;
6. executar build;
7. executar scans;
8. revisar impacto;
9. documentar rollback;
10. abrir Pull Request;
11. obter aprovação do gestor;
12. incorporar à `main`;
13. aplicar em produção;
14. validar produção;
15. registrar a mudança.

Mudanças diretas no dashboard do Supabase devem ser evitadas.

Quando forem inevitáveis, precisam ser posteriormente convertidas em migration e registradas.

## 12. Tratamento seguro de falhas

Quando uma operação falhar, o usuário não deve receber:

* stack trace;
* consulta SQL;
* nome interno de tabela;
* segredo;
* token;
* chave;
* payload integral do provedor;
* conteúdo de outro usuário;
* detalhes da infraestrutura.

A resposta deve ser segura e compreensível, por exemplo:

> Não foi possível concluir a operação. Tente novamente ou informe ao suporte o código de referência NX-12345.

Implementar ou planejar:

* códigos de correlação;
* logs técnicos minimizados;
* timeout;
* cancelamento;
* idempotência;
* retentativas seguras;
* circuit breaker quando aplicável;
* alertas;
* health checks;
* rollback;
* bloqueio temporário de funções críticas;
* página de status;
* mensagens genéricas para o usuário.

## 13. Logs e auditoria

Logs devem registrar apenas o necessário.

Evitar registrar:

* prontuários completos;
* mensagens clínicas completas;
* transcrições completas;
* documentos;
* senhas;
* tokens;
* chaves;
* números bancários completos;
* dados pessoais desnecessários.

Os logs devem permitir identificar:

* responsável;
* ação;
* recurso;
* data e horário;
* resultado;
* erro;
* origem quando necessária;
* código de correlação.

Logs críticos não devem poder ser alterados ou excluídos por usuários comuns.

Devem existir períodos de retenção definidos.

## 14. Gestão de acessos

Deve existir um inventário de acessos administrativos, incluindo:

* GitHub;
* Supabase;
* Vercel;
* Asaas;
* Cloudflare;
* provedores de IA;
* e-mail;
* domínio;
* serviços de comunicação;
* automações.

Para cada acesso, registrar:

* pessoa;
* serviço;
* nível de permissão;
* finalidade;
* data de concessão;
* MFA;
* última revisão;
* necessidade de manutenção;
* data de revogação, quando aplicável.

Realizar revisão periódica, mesmo que atualmente exista somente um responsável.

Contas administrativas devem ser separadas de contas comuns sempre que possível.

## 15. Gestão de incidentes

Deve existir procedimento para:

1. identificar;
2. registrar;
3. classificar;
4. conter;
5. preservar evidências;
6. investigar;
7. corrigir;
8. recuperar;
9. comunicar;
10. revisar o ocorrido.

Classificações sugeridas:

* baixa;
* média;
* alta;
* crítica.

Incidentes envolvendo dados pessoais devem ser avaliados quanto à necessidade de comunicação:

* ao controlador;
* aos titulares;
* à ANPD;
* à Asaas;
* a outros fornecedores envolvidos.

Deve ser realizada uma simulação simples de incidente e o resultado deve ser registrado.

## 16. Vulnerabilidades

O processo deve incluir:

* scan de dependências;
* scan de secrets;
* análise estática;
* Supabase Security Advisor;
* revisão de endpoints;
* revisão de RLS;
* revisão de bibliotecas desatualizadas;
* revisão de configurações públicas;
* testes manuais;
* pentest quando possível.

Cada vulnerabilidade deve possuir:

* descrição;
* severidade;
* impacto;
* sistema afetado;
* responsável;
* prazo;
* status;
* correção;
* evidência;
* risco residual.

Não publicar vulnerabilidades abertas no repositório público.

## 17. Backup e recuperação

Mesmo sem Supabase Pro, deve existir processo de backup lógico.

O procedimento deve contemplar:

* dump de roles;
* dump do schema;
* dump dos dados;
* criptografia;
* armazenamento externo;
* retenção;
* hash;
* controle de acesso;
* teste de restauração;
* registro do resultado.

Backups nunca devem ser:

* enviados ao GitHub;
* incluídos em prompts;
* armazenados sem criptografia;
* compartilhados por links públicos;
* utilizados como dados de desenvolvimento.

Devem ser definidos:

* RPO;
* RTO;
* frequência;
* retenção;
* responsável;
* procedimento de restauração.

Um backup só pode ser considerado comprovado quando uma restauração tiver sido testada.

## 18. Gestão de fornecedores

Criar inventário de fornecedores e subprocessadores, incluindo, quando aplicável:

* Supabase;
* Vercel;
* Cloudflare;
* Asaas;
* provedores de IA;
* provedores de voz;
* e-mail;
* WhatsApp;
* notificações;
* Google;
* Microsoft;
* Notion;
* ferramentas de monitoramento.

Para cada fornecedor, registrar:

* serviço;
* finalidade;
* dados processados;
* país ou região;
* contrato;
* política de privacidade;
* medidas de segurança;
* retenção;
* subprocessadores;
* risco;
* responsável;
* plano de substituição;
* situação da aprovação.

## 19. LGPD

Mapear todas as operações contendo:

* categoria de dados;
* categoria de titular;
* finalidade;
* base legal;
* controlador;
* operador;
* subprocessador;
* compartilhamento;
* retenção;
* descarte;
* medida de segurança;
* transferência internacional;
* canal para exercício de direitos.

Direitos dos titulares devem ser atendidos por procedimento, incluindo:

* confirmação de tratamento;
* acesso;
* correção;
* informação;
* portabilidade quando aplicável;
* eliminação quando legalmente possível;
* revogação de consentimento;
* oposição;
* revisão de decisões automatizadas quando aplicável.

A exclusão de uma conta não pode apagar automaticamente registros que precisem ser mantidos por obrigação legal ou profissional.

## 20. Requisitos relacionados ao CFP

A plataforma deve permitir que o psicólogo:

* mantenha registro documental atualizado;
* registre apenas informações necessárias;
* preserve sigilo;
* controle o acesso;
* exporte informações quando necessário;
* mantenha registros pelo prazo aplicável;
* restrinja materiais de avaliação psicológica;
* informe ao paciente quais tecnologias são utilizadas;
* preserve a confidencialidade nas comunicações;
* saiba quando a IA está sendo utilizada.

Documentos e funcionalidades clínicas devem respeitar as responsabilidades profissionais do psicólogo.

A Neuronex não deve apresentar o Synapse como substituto de julgamento clínico.

## 21. Uso seguro de inteligência artificial

O Synapse não deve:

* enviar mais dados do que o necessário;
* utilizar conteúdo clínico para treinamento sem autorização;
* registrar conteúdo clínico integral em logs técnicos;
* executar decisões clínicas autônomas;
* alterar definitivamente um prontuário sem confirmação;
* revelar informações de outro paciente;
* solicitar UUIDs ou identificadores técnicos ao profissional;
* inventar dados clínicos;
* ocultar que utiliza fornecedores externos.

Deve existir documentação sobre:

* quais dados são enviados;
* para qual fornecedor;
* por qual finalidade;
* por quanto tempo;
* em qual região;
* se há retenção;
* se há treinamento;
* como ocorre a minimização;
* como ocorre a revisão humana;
* como ocorre a exclusão;
* quais controles impedem acesso cruzado.

## 22. Acesso administrativo a dados clínicos

O acesso administrativo a conteúdo clínico deve ser excepcional.

Aplicar:

* proibição de acesso rotineiro;
* acesso somente por necessidade;
* autorização registrada;
* acesso temporário;
* conta administrativa separada;
* MFA;
* log de auditoria;
* justificativa;
* data e horário;
* registro das ações;
* encerramento do acesso;
* comunicação ao cliente quando apropriado.

Criar procedimento de acesso emergencial, conhecido como `break glass`.

O objetivo é impedir que o administrador consulte dados clínicos por conveniência.

Enquanto a arquitetura ainda permitir acesso técnico por credenciais administrativas, o risco deve ser reconhecido e compensado por controles operacionais e auditoria.

## 23. Suporte

Definir:

* canal oficial;
* horário;
* severidades;
* prazo de primeira resposta;
* prazo de atualização;
* forma de escalonamento;
* comunicação de indisponibilidade;
* tratamento de dados durante o suporte;
* autorização para investigação;
* registro de tickets.

O suporte não deve solicitar:

* senha;
* token;
* chave;
* prontuário completo;
* exportação indiscriminada do banco.

## 24. Evidências

Cada requisito deve possuir evidência adequada.

Exemplos:

* política datada;
* procedimento aprovado;
* captura de MFA;
* relatório de acessos;
* resultado do build;
* resultado dos testes;
* relatório de RLS;
* relatório do Security Advisor;
* lista de buckets;
* relatório de secrets;
* inventário de fornecedores;
* simulação de incidente;
* teste de restauração;
* log de mudança;
* Pull Request;
* migration;
* configuração de Edge Function;
* registro de aprovação.

Nunca incluir em evidências:

* valores de chaves;
* tokens;
* senhas;
* conteúdo clínico;
* documentos reais;
* dados bancários completos;
* informações desnecessárias de pacientes.

## 25. Plano de execução

### Fase 1 — Auditoria

Somente leitura, inventário e comparação.

### Fase 2 — Documentação

Criar matriz, políticas, procedimentos, registros e índice de evidências.

### Fase 3 — Execuções iniciais

Realizar:

* revisão de acessos;
* inventário de fornecedores;
* scan de vulnerabilidades;
* scan de secrets;
* relatório do Supabase;
* simulação de incidente;
* backup;
* teste de restauração;
* registro de mudanças.

### Fase 4 — Hardening de baixo risco

Corrigir pontos isolados e reversíveis.

### Fase 5 — Ambientes

Consolidar desenvolvimento local e, posteriormente, homologação remota.

### Fase 6 — Melhorias estruturais

Somente após o formulário e com planejamento:

* grants;
* policies;
* RPCs;
* criptografia;
* segregação;
* migração;
* arquitetura de administração;
* observabilidade;
* continuidade.

## 26. Entregáveis esperados do agente

O agente deve entregar:

1. resumo executivo;
2. matriz completa do formulário;
3. respostas recomendadas;
4. justificativas para cada resposta;
5. evidências existentes;
6. evidências faltantes;
7. lista de ações de 24 horas;
8. lista de ações de 7 dias;
9. lista de ações de 30 dias;
10. políticas;
11. procedimentos;
12. registros;
13. índice de evidências;
14. lista de riscos;
15. mudanças técnicas recomendadas;
16. impacto de cada mudança;
17. plano de rollback;
18. lista do que depende do gestor;
19. lista do que depende de revisão jurídica;
20. lista do que depende de revisão externa de segurança.

## 27. Regra de atuação do agente

Antes de qualquer implementação:

1. analisar;
2. documentar;
3. apresentar o plano;
4. identificar risco;
5. informar impacto;
6. informar rollback;
7. aguardar aprovação.

Não realizar alterações destrutivas ou amplas automaticamente.

## 28. Regra final

O objetivo não é apenas preencher o formulário com respostas positivas.

O objetivo é fazer com que cada resposta positiva seja:

* verdadeira;
* demonstrável;
* sustentável;
* repetível;
* auditável;
* compatível com a estabilidade do MVP.

Uma resposta “Sim” deve continuar verdadeira depois que o formulário for enviado.
