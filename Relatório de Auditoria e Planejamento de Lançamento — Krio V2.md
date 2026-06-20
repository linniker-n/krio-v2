# Relatório de Auditoria e Planejamento de Lançamento — Krio V2

Este documento apresenta uma análise técnica e de design aprofundada da plataforma **Krio V2**, uma solução de gestão criativa auto-hospedada voltada para agências de publicidade e design. A auditoria avalia a arquitetura técnica, a segurança de dados, a experiência do usuário (UI/UX), os fluxos operacionais e o modelo de licenciamento manual. O objetivo é mapear todos os gargalos e vulnerabilidades antes de declarar o produto pronto para o lançamento (*go-live*).

---

## 1. Visão Geral do Produto e Modelo Comercial

O Krio V2 foi arquitetado sob um modelo de **licenciamento manual direto**, rodando inteiramente sobre o plano gratuito do Firebase (Spark). Ele elimina a dependência de assinaturas automáticas e do plano pago (Blaze), reduzindo o custo operacional a zero até que a validação de mercado seja concluída.

```
[ Usuário Final ] ───► [ index.html (Auth/Onboarding) ] ───► [ Registro de Acesso (Pendente) ]
                                                                     │
[ Admin (Script) ] ──► [ PS1 Grant Access (Firebase CLI) ] ◄─────────┘
                               │
                               ▼
                    [ Criação de Workspace ] ───► [ Acesso Ativo (app.html) ]
```

### Funcionamento do Fluxo Comercial Atual
1. **Captação e Fechamento**: O processo de vendas, negociação de valores e faturamento ocorre inteiramente fora do software (via transferência, boleto ou Pix).
2. **Onboarding**: O cliente acessa a página pública, cria uma conta (e-mail/senha ou Google) e o sistema registra uma solicitação pendente no Firebase Realtime Database.
3. **Liberação Operacional**: O administrador da plataforma executa localmente um script PowerShell (`grant-client-access.ps1`) integrado ao Firebase CLI para criar o ambiente do cliente (*tenant*) e ativar a licença.
4. **Uso Ativo**: O cliente faz login novamente e é redirecionado para a aplicação principal (`app.html`), operando de forma independente.

---

## 2. Auditoria Técnica e de Segurança

A análise do código-fonte e das regras de segurança do Firebase Realtime Database revelou vulnerabilidades críticas que precisam ser mitigadas antes do lançamento comercial.

### 2.1 Vulnerabilidades de Segurança e Permissões (database.rules.json)

As regras de banco de dados do Firebase apresentam lacunas de autorização que expõem dados sensíveis e permitem manipulação indevida por usuários comuns.

| Caminho no Banco | Operação | Regra Atual | Risco Identificado | Correção Necessária |
| :--- | :--- | :--- | :--- | :--- |
| `tenants/$tenantId/meta` | Escrita | Parcialmente bloqueada | Qualquer membro ativo do tenant pode alterar configurações sensíveis se as regras não forem estritas. | Restringir toda a escrita do nó `meta` exclusivamente para o papel de `owner` (proprietário). |
| `tenants/$tenantId/tracker/weeks` | Escrita | `auth != null && ...status == 'active'` | Qualquer colaborador convidado (designer, editor) pode alterar, mover ou excluir demandas de outros membros e até apagar semanas inteiras de trabalho. | Restringir a criação/exclusão de semanas ao papel de `admin`/`owner`. Permitir que membros editem apenas suas próprias demandas. |
| `tenants/$tenantId/approval` | Escrita | `auth != null && ...status == 'active'` | Um colaborador comum pode criar clientes fictícios, aprovar peças ou apagar arquivos de aprovação sem autorização. | Limitar a criação de clientes e a aprovação final ao papel de `admin`/`owner`. |

### 2.2 Dependências e Limitações de Infraestrutura

* **Gargalo do Firebase Spark**: O Realtime Database no plano Spark possui um limite estrito de **100 conexões simultâneas**. Para um modelo de agências operando em tempo real (com listeners ativos), esse limite pode ser atingido rapidamente com apenas 5 a 10 agências ativas.
* **Armazenamento de Mídia (Imagens/Vídeos)**: O sistema de aprovação permite o upload de criativos. No entanto, o código atual converte imagens para **Data URLs (Base64)** e as salva diretamente como strings no Realtime Database.
  > **Risco Crítico**: O Firebase possui um limite de 10MB por nó individual. Salvar múltiplas imagens em Base64 no banco de dados causará estouro de memória, lentidão extrema na sincronização em tempo real e inviabilizará o uso de arquivos pesados (como vídeos). É obrigatório migrar o upload de arquivos para o **Firebase Storage**.

---

## 3. Análise de UI/UX e Experiência do Usuário

O Krio V2 possui uma interface moderna com estética escura (*dark mode* por padrão), utilizando transparências e desfoques (*backdrop-filter*). No entanto, a usabilidade apresenta gargalos de layout e inconsistências de fluxo.

### 3.1 Responsividade e Visualização Mobile

A folha de estilo `shell.css` tenta adaptar o painel para dispositivos móveis transformando a barra lateral em um menu horizontal superior (`flex-direction: row`). Isso gera problemas graves de espaço:

* **Conflito de Cabeçalhos**: Em telas menores que 720px, o cabeçalho do módulo ativo colide visualmente com a navegação superior adaptada, gerando sobreposição de textos e botões inacessíveis.
* **Overflow de Elementos**: Grids de três colunas (como no painel de Operações) quebram o layout em telas de smartphones de baixa resolução (abaixo de 360px), empurrando elementos para fora da tela.
* **Tabelas de Relatórios**: O relatório semanal gerado em HTML utiliza largura fixa de `1120px` em CSS. Isso impede a leitura em dispositivos móveis e exige rolagem horizontal infinita.

### 3.2 Densidade de Informação no Tracker

O módulo **Tracker** exibe colunas por profissional com seções de demandas. Quando uma agência possui mais de 5 profissionais ativos e cada um tem 10 demandas na semana, a interface sofre de **fadiga visual**:

```
[ Semana em Movimento ] ─────────────────────────────────────────── (Filtros: Todos)
 ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
 │ Ana Lima (Designer)  │ │ Rafa Costa (Editor)  │ │ Bruno Dias (Redator) │
 ├──────────────────────┤ ├──────────────────────┤ ├──────────────────────┤
 │ ▓ Mensal (3)         │ │ ▓ Avulso (1)         │ │ ▓ Mensal (2)         │
 │   [Card] Demand 1    │ │   [Card] Demand 4    │ │   [Card] Demand 5    │
 │   [Card] Demand 2    │ ├──────────────────────┤ │   [Card] Demand 6    │
 │   [Card] Demand 3    │ │ ▓ Acompanhamento (2) │ └──────────────────────┘
 └──────────────────────┘ └──────────────────────┘
```

* **Excesso de Controles Inline**: Cada card de demanda exibe simultaneamente: alça de arrasto, checkbox de conclusão, botão de play/pause do timer, botão de edição do tempo, botão de reset, data de entrega, badge de dificuldade e botão de comentários. Essa quantidade de micro-interações em um espaço reduzido gera cliques acidentais frequentemente.
* **Falta de Estados Vazios Amigáveis**: Quando o filtro de um tipo de demanda está ativo e um profissional não possui tarefas daquele tipo, a coluna exibe uma faixa cinza estéril escrita "Sem demandas por aqui", aumentando a rolagem vertical desnecessariamente.

---

## 4. Auditoria de Fluxos Operacionais

A análise dos fluxos de trabalho identificou pontos de atrito que podem frustrar os usuários e prejudicar a retenção pós-lançamento.

### 4.1 Fluxo de Registro de Acesso e Espera

O fluxo de onboarding atual é o ponto de maior atrito para novos clientes:

```
[ Cria Conta ] ──► [ Tela de Espera Estática ] ──► [ Bloqueio / Dúvida ] ──► [ Abandono ]
```

* **Barreira de Entrada**: O usuário cria uma conta e cai imediatamente em uma tela de "Aguardando aprovação". Não há qualquer instrução clara sobre como proceder, links de contato com o suporte ou um botão para acelerar a liberação. O usuário fica "no escuro".
* **Recuperação de Workspace Inconsistente**: O formulário de recuperação de workspace no `index.html` confunde o usuário comum ao sugerir que ele pode "criar um workspace como admin" se o banco de dados tiver sido zerado, misturando funções de desenvolvimento com a experiência do cliente final.

### 4.2 Fluxo de Aprovação de Peças (Cliente Final)

O fluxo de aprovação criativa é o coração do produto, mas possui gargalos de comunicação:

* **Ausência de Notificações**: Quando a agência move uma peça para o "Quadro do Cliente", o cliente não recebe nenhum aviso (não há envio de e-mail ou integração com WhatsApp/Slack). O cliente precisa adivinhar que há algo para aprovar ou a agência precisa avisá-lo manualmente.
* **Reprovação sem Contexto**: O cliente pode clicar em "Reprovar" uma peça. Embora exista um modal de justificativa, o fluxo de retorno para a agência (que move a peça de volta para "Refação") não destaca de forma clara para o designer qual foi o feedback do cliente diretamente no card principal, exigindo que ele abra o detalhe da peça e navegue pelos comentários.

---

## 5. Plano de Ação e Correções Necessárias (Checklist de Lançamento)

Para garantir um lançamento bem-sucedido, as seguintes correções foram divididas por prioridade e devem ser implementadas antes da abertura comercial da plataforma.

### Prioridade 1: Segurança e Estabilidade (Crítico)
- [ ] **Ajustar Regras do Firebase**: Atualizar o arquivo `database.rules.json` para garantir que apenas usuários com papel `owner` ou `admin` possam escrever nos nós de configuração, faturamento e criação de clientes.
- [ ] **Migrar Mídias para Firebase Storage**: Reescrever a função de upload de imagens no `app-shell.js` para salvar os arquivos no Storage e armazenar apenas a URL pública resultante no Realtime Database, eliminando o armazenamento de Base64 no banco.
- [ ] **Implementar Limites de Conexão**: Criar um mecanismo de aviso ou monitoramento para quando o workspace atingir o limite de conexões simultâneas do plano Spark, preparando o ambiente para migração rápida para o plano Blaze se necessário.

### Prioridade 2: Ajustes de UI/UX e Usabilidade (Alto)
- [ ] **Corrigir Responsividade do Menu Mobile**: Desenhar um menu inferior estilo *tab bar* ou um menu hambúrguer real para telas abaixo de 720px, evitando a sobreposição de cabeçalhos.
- [ ] **Reduzir Densidade Visual dos Cards**: Esconder os controles secundários do card de demanda (como reset de timer, edição de tempo acumulado e seletor de dificuldade) sob um menu de contexto de três pontos (`...`), mantendo visíveis apenas o título, o play/pause e a data de entrega.
- [ ] **Responsividade dos Relatórios**: Alterar o layout do relatório semanal para usar um design fluido baseado em porcentagens (`max-width: 100%`) e media queries, garantindo leitura perfeita em tablets e celulares.

### Prioridade 3: Melhorias de Fluxo e Onboarding (Médio)
- [ ] **Reformular Tela de Espera (Onboarding)**: Adicionar um botão de contato direto via WhatsApp ou e-mail de suporte na tela de "Aguardando aprovação", permitindo que o cliente solicite a liberação imediata da sua licença.
- [ ] **Ocultar Opções de Desenvolvimento**: Remover o formulário de "recuperação de workspace" do `index.html` em ambiente de produção, deixando-o ativo apenas em modo de desenvolvimento local ou sob flag específica.
- [ ] **Melhorar Visualização de Refações**: Destacar visualmente com bordas vermelhas ou badges de alerta os cards que retornaram do cliente com status de reprovados, exibindo a última justificativa diretamente no corpo do card.

---

## Conclusão

O **Krio V2** é um produto com excelente potencial de mercado. Sua arquitetura sem servidores complexos (*serverless*) e o modelo de licenciamento manual são escolhas inteligentes para uma validação comercial enxuta e de baixo custo.

A implementação das correções de segurança (especialmente a migração das mídias para o Firebase Storage e o fechamento das regras do banco de dados) combinada com o refinamento da usabilidade mobile transformará o Krio V2 em uma plataforma robusta, segura e pronta para escalar comercialmente.
