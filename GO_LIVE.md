# KRIO V2 - Go live sem Blaze

## Status do produto

O Krio esta configurado para venda manual por licenca. A publicacao usa somente recursos compativeis com Firebase Spark:

- Firebase Hosting
- Firebase Authentication
- Firebase Realtime Database

Nao ha dependencia de Cloud Functions, Stripe Checkout, webhook ou plano Blaze para o fluxo atual.

## Fluxo para vender manualmente

1. Apresente o Krio para a agencia.
2. Feche valor, condicoes e escopo fora do aplicativo.
3. Receba por Pix, boleto, transferencia ou contrato.
4. Peça para o cliente criar conta na URL publicada.
5. Liste as solicitacoes:

```powershell
npm.cmd run access:list
```

6. Copie o UID do cliente.
7. Libere o acesso:

```powershell
npm.cmd run access:grant -- `
  -Uid "UID_DO_CLIENTE" `
  -AgencyName "Nome da Agencia" `
  -OwnerName "Nome do Responsavel" `
  -OwnerEmail "email@agencia.com"
```

8. Avise o cliente para entrar novamente.

## Fluxo para publicar atualizacoes

Na raiz do projeto:

```powershell
npm.cmd run preflight
npm.cmd run release
```

O `release` publica regras do Realtime Database e Hosting. Ele nao tenta publicar Functions.

## Fluxo para bloquear um cliente

```powershell
npm.cmd run access:revoke -- `
  -Uid "UID_DO_CLIENTE" `
  -TenantId "TENANT_DO_CLIENTE"
```

## Checklist antes de vender

- Confirmar que Authentication esta ativo no Firebase.
- Confirmar provedores Email/Senha e Google, se quiser usar Google.
- Confirmar que as regras do Realtime Database foram publicadas.
- Definir preco, forma de pagamento e condicoes comerciais.
- Revisar Termos e Privacidade com apoio juridico antes de escala comercial.
- Definir canal de suporte e prazo de resposta.

## Quando migrar para SaaS automatizado

So faz sentido migrar para Blaze/Stripe quando voce ja tiver clientes pagando ou previsibilidade de receita. Ate la, o modelo manual protege caixa e mantem controle da validacao comercial.
