# KRIO V2 - Produto de venda manual

## Modelo recomendado agora

O melhor caminho inicial e vender o Krio como uma plataforma licenciada por cliente, sem assinatura automatica, sem Stripe e sem Firebase Blaze.

Voce fecha a venda diretamente com a agencia, recebe por Pix, boleto, transferencia ou contrato, e depois libera o acesso manualmente. Esse modelo reduz custo fixo, evita dependencia de Cloud Functions e permite validar preco, promessa comercial e suporte antes de transformar em SaaS.

## Como o acesso funciona

1. O cliente acessa a pagina publica do Krio.
2. Ele cria conta ou entra com Google.
3. O app registra uma solicitacao em `accessRequests/{uid}`.
4. Enquanto nao houver liberacao, o cliente nao entra no workspace.
5. Apos a venda, voce libera o UID com o script `access:grant`.
6. O script cria o workspace em `tenants/{tenantId}` e vincula o cliente em `memberships/{uid}/{tenantId}`.
7. No proximo login, o cliente entra no app com licenca ativa.

## Por que este modelo e melhor neste momento

- Nao exige plano Blaze.
- Nao exige Stripe.
- Evita que qualquer pessoa crie um workspace sem pagar.
- Mantem controle comercial na sua mao.
- Funciona com Firebase Hosting, Authentication e Realtime Database.
- Permite vender como produto exclusivo, implantacao, licenca vitalicia, licenca anual ou acesso por contrato.

## Oferta comercial sugerida

Venda como implantacao + licenca:

- Setup inicial do ambiente.
- Liberacao do acesso para a agencia.
- Treinamento rapido de uso.
- Suporte por periodo combinado.
- Atualizacoes enquanto o contrato estiver ativo.

Voce pode precificar como:

- Licenca unica de implantacao.
- Licenca anual.
- Licenca mensal cobrada manualmente.
- Projeto exclusivo para uma agencia maior.

## Controle operacional

Listar solicitacoes:

```powershell
npm.cmd run access:list
```

Liberar cliente:

```powershell
npm.cmd run access:grant -- `
  -Uid "UID_DO_CLIENTE" `
  -AgencyName "Nome da Agencia" `
  -OwnerName "Nome do Responsavel" `
  -OwnerEmail "email@agencia.com"
```

Revogar cliente:

```powershell
npm.cmd run access:revoke -- `
  -Uid "UID_DO_CLIENTE" `
  -TenantId "TENANT_DO_CLIENTE"
```

Publicar atualizacoes:

```powershell
npm.cmd run release
```

## O que fica para uma fase futura

Quando houver caixa e validacao comercial, voce pode voltar a estudar:

- Firebase Blaze.
- Stripe Checkout.
- Portal de assinatura.
- Webhooks automaticos.
- Painel administrativo interno.
- Multiusuarios convidados pela propria agencia.
