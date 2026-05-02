# Teste manual do fluxo Stripe Connect pela interface

Este roteiro valida o fluxo Stripe usando a UI do Hubly. A conta Stripe Connect é uma configuração da organização, acessível em `Configurações`, e não uma configuração por profissional.

## Premissas

- Backend rodando em `http://localhost:3333`.
- Frontend rodando em `http://localhost:3000`.
- Banco com seed carregada.
- Conta Stripe em modo teste.
- Variáveis Stripe configuradas nos arquivos `.env`.
- Stripe CLI rodando o forward de webhook:

```bash
stripe listen --forward-to localhost:3333/v1/public/payments/stripe/webhooks
```

Use o `whsec_...` exibido pelo listener em `STRIPE_WEBHOOK_SECRET` e reinicie o backend.

## Dados padrão do seed

| Item | Valor |
| --- | --- |
| Admin | `admin@organization.test` |
| Senha | `password123` |
| Slug público | `organizationa-exemplo` |
| Serviço | `Consulta inicial` |
| Preço do serviço | `R$ 180,00` |
| Taxa da plataforma | `10%` |
| Taxa esperada | `R$ 18,00` |
| Líquido esperado | `R$ 162,00` |

## 1. Login

1. Acesse `http://localhost:3000/login`.
2. Entre com `admin@organization.test` e `password123`.

## 2. Configurar pagamentos da organização

1. Acesse `http://localhost:3000/settings`.
2. Na área `Verificação de identidade`, confira se a identidade está `Não iniciada`, `Pendente`, `Com pendências` ou `Verificada`.

## 3. Verificar identidade

1. Ainda em `Configurações`, clique em `Verificar identidade`.
2. Complete o onboarding da Stripe em modo teste.
3. Ao retornar para o Hubly, clique em `Atualizar status`.

Resultado esperado:

- `Status` fica `verified`;
- `Pagamentos online` fica `Ativos`;
- sem pendências bloqueantes na área de Stripe.

## 4. Validar vitrine, serviço e agenda

1. Acesse `http://localhost:3000/dashboard/storefront`.
2. Confirme no checklist:
   - perfil público completo;
   - vitrine publicada;
   - profissional ativo;
   - serviço com preço;
   - Stripe Connect ativo;
   - agenda disponível;
   - conta pronta para venda.
3. Acesse `http://localhost:3000/dashboard/providers`.
4. Confirme que o serviço `Consulta inicial` tem preço `R$ 180,00`.

## 5. Criar agendamento público com pagamento online

1. Acesse `http://localhost:3000/clientes/organizationa-exemplo`.
2. Escolha o profissional `Dra. Ana Souza`.
3. Escolha o serviço `Consulta inicial`.
4. Escolha uma data futura com disponibilidade.
5. Selecione um horário livre.
6. Selecione `Pagar online`.
7. Preencha:
   - nome: `Cliente Stripe Manual`;
   - e-mail: `cliente-stripe-manual@test.local`;
   - telefone: `+5511999999999`;
   - senha: `password123`.
8. Clique em `Confirmar e ir para pagamento`.

Resultado esperado:

- redirecionamento para `/clientes/organizationa-exemplo/pagamento?bookingId=...`;
- Payment Element da Stripe visível.

## 6. Pagar com cartão de teste

Na tela de pagamento:

1. Use `4242 4242 4242 4242`.
2. Use validade futura, CVC de 3 dígitos, nome e CEP aceitos pela tela.
3. Clique em `Pagar com segurança`.

Resultado esperado:

- a Stripe confirma o pagamento;
- a tela mostra pagamento recebido ou em processamento enquanto o webhook atualiza o backend.

## 7. Conferir confirmação no dashboard

1. Acesse `http://localhost:3000/dashboard/bookings`.
2. Localize o agendamento criado.
3. Confirme:
   - status `confirmed`;
   - etiqueta `Pagamento aprovado`.

## 8. Conferir split, taxa e histórico

1. Acesse `http://localhost:3000/settings`.
2. Na área `Histórico financeiro`, confirme uma entrada de pagamento.
3. Para o pagamento de `R$ 180,00`, confirme:
   - taxa: `R$ 18,00`;
   - líquido: `R$ 162,00`.
4. Na área `Saldo Stripe`, confirme saldo `pendente` ou `disponível` em BRL.

## 9. Testar saque

Execute apenas quando houver saldo disponível suficiente.

1. Acesse `http://localhost:3000/settings`.
2. Na área `Saldo Stripe`, informe o valor do saque.
3. Clique em `Sacar`.
4. Confirme no `Histórico financeiro` uma entrada de saque solicitado.

## 10. Teste negativo rápido

1. Em `Configurações`, use uma organização sem conta Stripe Connect verificada ou deixe o onboarding incompleto.
2. Tente criar um agendamento público com `Pagar online`.

Resultado esperado:

- o frontend exibe erro de conta Stripe obrigatória ou não verificada;
- nenhum pagamento aprovado é criado.

## Checklist final de aceite

- [ ] Admin iniciou verificação de identidade em `Configurações`.
- [ ] Organização recebeu conta Stripe durante a verificação.
- [ ] Onboarding Express foi finalizado.
- [ ] Status da conta ficou `verified`.
- [ ] Cliente escolheu `Pagar online`.
- [ ] Payment Element carregou.
- [ ] Pagamento com cartão de teste foi aprovado.
- [ ] Agendamento ficou `confirmed`.
- [ ] Dashboard mostrou `Pagamento aprovado`.
- [ ] Histórico financeiro mostrou taxa de `R$ 18,00` e líquido de `R$ 162,00`.
- [ ] Saldo Stripe apareceu em `Configurações`.
- [ ] Saque pôde ser solicitado pela interface quando havia saldo disponível.
