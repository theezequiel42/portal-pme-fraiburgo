# Plano — evolução aprovada React + Node + Sheets

## Decisão atual

O usuário aprovou implementar a evolução antes registrada apenas como ideia: formulário React próprio, Vercel Functions Node e API oficial do Google Sheets. A etapa Forms incorporado passa a ser histórica; não usar prefill/iframe como ativação da nova coleta. Não há migração automática de respostas ou configuração privada.

## Entregas da implementação

1. Preservar catálogo legal imutável, grupos, identidade SME, combobox e leitura integral sem JavaScript. Conferir todas as 464 linhas contra sources/numbered-rows.json.
2. Formulário próprio com problema opcional, proposta obrigatória e justificativa opcional. Separar assunto confirmado da leitura, rascunho em memória e confirmação explícita de troca; nenhuma persistência local.
3. SSR fechado e hidratação consistente. Buscar status em `GET /api/collection`, enviar por `POST /api/contributions`; credenciais somente na Function Node. Validar no servidor contexto/campos, abertura e origem; sucesso apenas após gravação oficial no Sheets.
4. Build único fechado para todos os ambientes. Retirar dependência de configuração Forms, sem ler institutional/forms.json ou PME_FORMS_CONFIG e sem incorporar segredos. Preservar build:institutional somente como saída estática fechada alternativa.
5. TDD para comportamento novo; testes sintéticos de API/build, suíte Node, build e verificação do catálogo. Navegador desktop/320/375px, teclado, sem JS e falha de módulo; registrar resultados efetivamente executados, não extrapolar histórico.

## Operação separada — ainda necessária

- Preparar conta de serviço e planilha institucional; conceder apenas o acesso necessário. Nenhuma criação ou alteração de recurso Google está autorizada nesta implementação.
- Configurar no servidor `COLLECTION_ENABLED`, `VERCEL_ENV` de produção, `COLLECTION_ORIGIN`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY` e `GOOGLE_SHEETS_ID`, conforme docs/sheets-backend.md.
- Definir privacidade, retenção, responsáveis, proteção contra abuso e procedimentos de reenvio/duplicidade conforme limites reais do backend.
- Validar integração real somente com autorização própria. Não há teste end-to-end real de Sheets comprovado nesta migração.
- Fazer deploy somente em operação explicitamente autorizada e verificar comportamento antes de abrir coleta. Esta implementação não faz deploy, commit nem chamadas Google.

## Histórico e limites de evidência

As verificações anteriores de prefill, iframe, rascunho e resposta técnica no Forms continuam documentadas como histórico em README e docs/validation.md. Não comprovam o armazenamento novo. Não inspecionar configuração institucional existente para testes; usar apenas fixtures sintéticas isoladas. Preview estático serve dist em loopback e permanece fechado sem Functions; nunca servir a raiz do repositório.
