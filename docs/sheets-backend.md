# Backend de contribuições — Google Sheets

A evolução autorizada usa React → Vercel Functions Node → API oficial do Sheets. Não gera resposta no Google Forms. Nenhum recurso Google, segredo, publicação ou coleta real foi configurado por esta implementação. O preview estático continua sem backend; não servir a raiz do repositório para obter estas rotas.

## Configuração exclusivamente no servidor

Definir apenas no ambiente **Production** da Vercel (sem prefixos públicos):

- `COLLECTION_ENABLED=true` (literal; qualquer outro valor fecha a coleta).
- `VERCEL_ENV=production` é fornecido pela plataforma. Preview/development permanecem fechados mesmo com outras variáveis herdadas; não sobrescrever esta proteção para abrir previews.
- `GOOGLE_AUTH_MODE`: `oauth` para autorização de usuário existente; `service_account` para conta de serviço. Ausência mantém conta de serviço por compatibilidade. Qualquer outro valor, inclusive vazio, diferenças de caixa ou espaços, fecha a coleta; não há fallback entre modos.
- No modo `oauth`, são obrigatórias **todas**: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` e `GOOGLE_OAUTH_REFRESH_TOKEN`, strings não vazias/não brancas. Devem corresponder à mesma autorização de usuário existente (por exemplo, a autorização Google já aprovada no Hermes), fornecidas por operador autorizado **somente como variáveis do servidor**. O backend não descobre, lê ou modifica arquivos de credenciais/configuração do Hermes. Não requer email/chave de conta de serviço neste modo.
- No modo `service_account` (ou modo ausente), `GOOGLE_SERVICE_ACCOUNT_EMAIL`: email da conta de serviço institucional; `GOOGLE_PRIVATE_KEY`: chave RSA privada PEM, mínimo 2048 bits, aceita quebras reais ou `\n` escapado.
- Nunca colocar credenciais, refresh token ou access token em repositório, build, browser, respostas ou logs; não usar prefixos públicos como `VITE_`.
- `GOOGLE_SHEETS_ID`: identificador da planilha dedicada, sem URL.
- `COLLECTION_ORIGIN`: origem HTTPS exata do portal, sem barra final, caminho ou parâmetros. Não é derivada de Host ou X-Forwarded-Host.
- `COLLECTION_MAX_RECORDS`: opcional, inteiro 1–1000, padrão 500; limite operacional conservador de linhas de contribuição, não promessa de capacidade do Google nem limite global atômico.

A instituição deverá habilitar Sheets API, garantir edição da planilha pela identidade escolhida e definir privacidade/retenção antes de abrir. Para conta de serviço, provisionar conta dedicada, compartilhar apenas a planilha necessária e não conceder acesso a outros documentos. Para OAuth, a identidade é o **usuário que autorizou**: permissões sobre arquivos e escopos já concedidos determinam o alcance efetivo. `GOOGLE_SHEETS_ID` limita os destinos usados por este código, **não** restringe os poderes de uma credencial comprometida. Uma autorização existente com escopos amplos pode alcançar outros documentos/serviços do usuário; reutilizá-la não constitui privilégio mínimo e aumenta o raio de impacto. Revisar esse risco institucionalmente, proteger/rotacionar/revogar credenciais conforme política e não compartilhar edição com clientes que contornem o protocolo do ledger.

O refresh token pode expirar ou ser revogado. Em particular, aplicativos OAuth externos em **Testing** podem emitir refresh tokens com validade de sete dias (conforme configuração e escopos); não assumir autorização permanente. Falha na renovação mantém os envios sem recibo e exige intervenção autorizada, sem reconsentimento automático. Este backend não solicita escopos novos nem amplia os existentes; se a autorização não permitir Sheets, o operador precisa resolver as permissões fora deste fluxo.

Não ler/copiar segredos existentes para executar testes. A configuração completa significa configuração local estruturalmente válida, **não** conectividade/permissões Google verificadas: o status não envia sondagem ao Google.

## Contrato HTTP

`GET /api/collection` retorna `{ "enabled": false }` por padrão ou `{ "enabled": true }` somente com configuração válida e ambiente production. Sem segredos, IDs ou origem na resposta; `Cache-Control: no-store`. Outros métodos: 405.

`POST /api/contributions`, Content-Type `application/json`, Origin igual à origem configurada. Quando presente, Sec-Fetch-Site precisa ser `same-origin`. Sem CORS permissivo. Corpo exato:

```js
{
  requestId: crypto.randomUUID(),
  context: { group, objective, mode, strategy },
  problem: "", proposal: "Texto obrigatório", justification: "", website: ""
}
```

Contexto deve ser exatamente o retornado por `contextFor` em `src/domain.js`, validado contra grupos e catálogo legal no servidor. Não aceitar IDs abreviados, textos editados, relações inventadas de meta/estratégia ou campos extras. Em Geral, strategy precisa ser vazio. Em Estratégia, rótulo e texto legal precisam ser literais e pertencer ao objetivo/grupo. 3 A e 3 B são contextos diferentes.

Limites em unidades UTF-16 (iguais a JS `string.length`): problema/justificativa até 4000 cada; proposta não branca até 8000; corpo até 32768 bytes UTF-8, inclusive quando o runtime já fez parsing. Strings são preservadas, sem trim/normalização do conteúdo; controles não textuais são rejeitados, tab/newline/CR permitidos. Honeypot `website` deve ser string vazia. UUID minúsculo canônico, versão 1–8 e variante RFC, sem normalizar identificador do cliente.

- 200: **somente após releitura exata**, `{ "receipt": requestId, "status": "recorded" }`.
- 400: conteúdo inválido; 403: origem; 405: método; 413: tamanho; 415: tipo.
- 409: UUID já possui conteúdo diferente (não substituir o conteúdo registrado).
- 503: fechado, erro Google, capacidade ou resultado desconhecido. Preservar **mesmo UUID e corpo** para consultar/repetir; não emitir outro UUID para contornar incerteza.

Erros não expõem resposta Google, dados, credenciais ou detalhes técnicos. Nenhum recibo é baseado apenas em resposta de escrita. Todos os retornos são JSON sem cache.

## Uma linha por contribuição e ledger de metadados

A aba fixa **`Contribuições`** deve existir antes da abertura, com cabeçalho A1:I1 exatamente nesta ordem (acentos e caixa fazem parte do schema):

1. Recebido em (Brasília)
2. Grupo de trabalho
3. Objetivo
4. Modalidade
5. Estratégia
6. Problema
7. Proposta
8. Justificativa
9. Protocolo

Cada contribuição ocupa uma linha. A data é texto humano `yyyy-MM-dd HH:mm:ss`, gerado no servidor com `America/Sao_Paulo`; o cabeçalho explicita Brasília, sem offset anexado ao texto. O protocolo é o UUID original na coluna I. Repetir o mesmo UUID/corpo preserva linha e data originais; a resposta HTTP continua somente `{ receipt, status }`.

Antes de escrever, o backend lê `spreadsheets.get` com `fields=sheets(properties(sheetId,title)),developerMetadata(metadataId,metadataKey,metadataValue)`, resolve o ID numérico da aba e lê **todo** o intervalo limitado `'Contribuições'!A1:I(maximum+1)` por `values.get?valueRenderOption=UNFORMATTED_VALUE`. O padrão é A1:I501; o máximo configurável é A1:I1001. Cabeçalho ausente/editado, aba ausente/ID inválido e linhas incompletas impedem gravação. Protocolos repetidos são rejeitados. Para o UUID encontrado, exige timestamp não branco e comparação literal dos sete campos de contexto/texto e UUID. Conteúdo diferente retorna 409. Timestamp vazio, claim sem linha ou linha sem claim determinístico retorna 503, sem recibo.

A busca prévia **não** garante unicidade. Para contribuição nova, há **uma única chamada** `spreadsheets.batchUpdate`, contendo, em ordem:

```js
{
  requests: [
    {
      createDeveloperMetadata: {
        developerMetadata: {
          metadataId,
          metadataKey: "pme_request",
          metadataValue: requestId,
          location: { spreadsheet: true },
          visibility: "DOCUMENT",
        },
      },
    },
    {
      appendCells: {
        sheetId: existingContributionsSheetId,
        rows: [
          {
            values: nineStrings.map((stringValue) => ({
              userEnteredValue: { stringValue },
            })),
          },
        ],
        fields: "userEnteredValue",
      },
    },
    {
      autoResizeDimensions: {
        dimensions: {
          sheetId: existingContributionsSheetId,
          dimension: "ROWS",
          startIndex: 1,
        },
      },
    },
  ];
}
```

`metadataId = (SHA256(requestId).readUInt32BE(0) & 0x7fffffff) || 1`: primeiros 32 bits big-endian, mascarados para inteiro positivo de 31 bits. O ID é único **na planilha**, não apenas por chave. Hashes podem colidir: ID ocupado por outro UUID/chave retorna 503, **nunca** escolhe novo ID. Claim do UUID sob ID inesperado também fecha a operação. `server/sheet-schema.mjs` exporta `SHEET_TITLE`, `SHEET_HEADERS`, `METADATA_KEY`, `metadataIdFor` e `brasiliaTimestamp` para migração autorizada separada.

A atomicidade documentada de `batchUpdate` aplica os três pedidos juntos ou nenhum. O terceiro ajusta a altura de todas as linhas de dados (índice inicial 1 exclui cabeçalho; endIndex omitido abrange as linhas existentes), após o append, para leitura de texto com quebra. A aba deve ser previamente formatada com WRAP; o POST não reaplica estilos. Duas requisições do mesmo UUID disputam o mesmo metadata ID; a colisão invalida o lote perdedor e impede seu append. Não há `addSheet`, `values.update` nem append separado no POST. UUIDs distintos acrescentam linhas na mesma aba. Cada célula usa exclusivamente `userEnteredValue.stringValue`: `=`, `+`, `-`, `@`, acentos e quebras permanecem texto literal, sem fórmulas. Exportadores CSV precisam de proteção própria; texto literal no Sheets não sanitiza exportações.

Após sucesso **ou falha** da resposta do lote, o backend apenas relê metadados e o intervalo completo e compara a linha por protocolo. Nenhum recibo sem confirmação. Falha/timeout nunca causa nova escrita na mesma requisição. Se a resposta se perdeu depois do commit, a releitura pode confirmar; caso contrário retorna 503. Uma próxima requisição com mesmo UUID/corpo pode consultar a gravação ou repetir o mesmo claim atômico, nunca com outro ID. Metadado sem linha exige investigação autorizada, não reparo automático.

`COLLECTION_MAX_RECORDS` limita conservadoramente a contagem de linhas, não é quota atômica global: UUIDs distintos concorrentes podem ultrapassá-lo, e linhas fora do intervalo limitado não são reconhecidas como recibos. Investigar/reconciliar antes de continuar nesse caso. Recibos dentro do intervalo são aceitos mesmo na capacidade. O protocolo exige escritores compatíveis e preservação de metadados, schema e linhas; edição/apagamento manual, restauração de backup ou clientes externos invalidam suas garantias. Não há promessa de exactly-once global contra esses agentes.

### Histórico: uma aba por UUID

O ledger anterior criava `request-<UUID>` (1 × 8), reivindicando o título e depois escrevendo A1:H1 por `values.update` RAW. Uma falha entre criação e escrita podia deixar aba vazia. Esse formato é **histórico**, não o destino atual do POST. Migração, preservação de recibos e formatação são operações separadas, autorizadas e verificadas pelo operador; o backend não consolida, cria ou apaga abas automaticamente. A implantação exige schema e claims migrados antes de reabrir coleta.

## Abuso e limites reais

Origem exata, JSON, honeypot, validação, corpo limitado, timeout de 10 s por chamada e limite durável de registros mitigam erros e abuso simples. **Não autenticam pessoas e não bloqueiam um bot que forja Origin.** Não há rate limit distribuído por IP, CAPTCHA ou autenticação nesta implementação; não vender estas proteções como suficientes para coleta pública hostil. Antes da abertura pública, a instituição precisa configurar firewall/rate limiting da plataforma (com política e orçamento adequados) ou integrar proteção durável adicional. O limite de registros pode ser esgotado por atacante; autenticação de participação, limite por pessoa e moderação não estão implementados. Nenhum IP é armazenado pelo código de coleta.

No modo conta de serviço, OAuth usa JWT RS256 assinado por `node:crypto`, audiência `https://oauth2.googleapis.com/token`, scope `https://www.googleapis.com/auth/spreadsheets`, expiração de 5 minutos (comportamento anterior preservado).

No modo `oauth`, cada envio válido renova o access token com `POST https://oauth2.googleapis.com/token`, `Content-Type: application/x-www-form-urlencoded`, corpo contendo **somente** `grant_type=refresh_token`, `client_id`, `client_secret` e `refresh_token`, codificados por `URLSearchParams`. Não gera JWT/assertion, não envia `scope`, não abre login/consentimento e não solicita autorização adicional. O access token é usado apenas em memória na requisição atual; não há cache persistente nem alteração/gravação de refresh token. Resposta HTTP malsucedida, falha de transporte/JSON ou access token ausente, não string ou branco retorna 503 genérico sem acesso ao Sheets nem recibo. Configuração OAuth incompleta fecha o status e o POST sem qualquer chamada Google, mesmo que haja credenciais de conta de serviço disponíveis.

Ambos os modos usam somente endpoints OAuth e Sheets oficiais, recusam redirects e mantêm timeout por chamada, sem dependência nova. Não há credenciais em frontend nem uso de endpoint interno/não documentado.

Referências oficiais: [OAuth refresh token](https://developers.google.com/identity/protocols/oauth2/web-server#refresh), [expiração de refresh tokens](https://developers.google.com/identity/protocols/oauth2#expiration), [OAuth service accounts](https://developers.google.com/identity/protocols/oauth2/service-account), [batchUpdate](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/batchUpdate), [CreateDeveloperMetadataRequest](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/request#CreateDeveloperMetadataRequest), [DeveloperMetadata e unicidade do metadataId](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/developerMetadata#DeveloperMetadata), [AppendCellsRequest](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/request#AppendCellsRequest), [AutoResizeDimensionsRequest](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/request#AutoResizeDimensionsRequest), [DimensionRange com limites omitidos](https://developers.google.com/workspace/sheets/api/reference/rest/v4/DimensionRange), [ExtendedValue/stringValue](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/other#ExtendedValue), [spreadsheets.get](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/get), [values.get](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/get).

## Verificação sem Google

`tests/contributions-api.test.mjs` injeta transporte oficial fictício: sem rede, sem recurso real, chave RSA criada somente em memória para teste. O ciclo RED → GREEN da migração começou pelo transporte JWT com novo schema/lote: falhou com 503 em vez de 200 no backend antigo e passou após implementar linha e claim atômicos. O conjunto focado mantém JWT verificado criptograficamente, formulário OAuth exato e proteções existentes; cobre duplicidade entre handlers, concorrência do mesmo UUID e UUIDs distintos, resposta perdida, lote não aplicado, colisão de metadata ID, claim órfão, cabeçalho inválido, literal multilinha, conteúdo alterado/ausente, timestamp vazio, capacidade e ausência de addSheet. A data usa formato e instante fixo, sem presumir a data real.

Comando focado (não roda a suíte global): `node --experimental-test-isolation=none --test tests/contributions-api.test.mjs`. Não lê credenciais reais nem equivale a integração Google/Vercel. Migração real, formatos e implantação precisam de verificação operacional separada; não foram executados como parte desta alteração de backend.
