# Portal PME Fraiburgo — especificação aprovada

## Produto e limites atuais

Evolução explicitamente aprovada: formulário React próprio, backend Node em Vercel Functions, API oficial do Google Sheets para armazenamento. Substitui o Forms incorporado no fluxo do portal. Não usar endpoints não documentados. Não criar respostas no Google Forms nem migrar dados históricos automaticamente. Credenciais exclusivamente no servidor; catálogo legal imutável.

Problema opcional, proposta obrigatória e justificativa opcional são campos do portal. O backend valida contexto contra grupos/catálogo e campos antes de gravar. O contrato detalhado, limites e tratamento de erros ficam em [sheets-backend.md](sheets-backend.md). Não prometer autenticação, anonimato, deduplicação global ou persistência de rascunhos sem implementação e verificação correspondentes.

## Planilha legível — uma linha por contribuição

Usar uma única aba principal `Contribuições`; novos envios não criam abas. Colunas, nesta ordem: `Recebido em (Brasília)`, `Grupo de trabalho`, `Objetivo`, `Modalidade`, `Estratégia`, `Problema`, `Proposta`, `Justificativa`, `Protocolo`. Cabeçalho destacado/congelado com filtro, larguras legíveis, texto com quebra automática e linhas alternadas. Data/hora gerada no servidor no fuso America/Sao_Paulo. Protocolo técnico no fim, sem dominar a leitura humana.

Migrar registros existentes preservando todos os campos e protocolos, sem inventar datas ausentes; indicar `Não registrada (formato anterior)`. Conservar abas antigas ocultas como arquivo de segurança, não as apagar. Para novos envios, a criação de metadado de unicidade e a inclusão da linha pertencem à mesma operação atômica Sheets; nunca confirmar sem releitura exata nem repetir append cego após timeout. Não alterar cabeçalhos/protocolos manualmente durante coleta; filtros não alteram dados e o protocolo identifica registros mesmo após ordenação.

## Fluxo

1. Nenhum grupo inicial. Exibir objetivos somente depois de escolher grupo válido; nenhum objetivo automático.
2. Geral é modalidade padrão após escolher objetivo e mostra objetivo/metas integrais. Estratégia exige escolha explícita e mostra texto legal integral. Rádios não roubam foco nem avançam etapas por si.
3. SSR e primeira hidratação fechados: “Coleta ainda não aberta”. `App` não aceita config de build. Após hidratar, consultar `GET /api/collection`; indisponibilidade ou status fechado não habilitam envio. Preview estático não simula API aberta.
4. Com status aberto e contexto válido, permitir preparar formulário React. Assunto vinculado é distinto da leitura; navegar não perde rascunho em memória. Substituição do assunto exige confirmação; cancelar/Escape preserva texto e retorna foco. Grupos 3 A e 3 B são contextos distintos.
5. Enviar somente por `POST /api/contributions`, mesma origem. Proposta obrigatória e campos/contexto validados novamente no servidor. Mostrar sucesso somente após confirmação da API de gravação; falha preserva texto e permite correção/tentativa conforme contrato. Não confiar em evento load, contexto manipulável do cliente ou campos ocultos como segurança.

## Grupos (atribuição fornecida diretamente pelo usuário)

1 | Educação Infantil | 1,2,17
2 | Alfabetização | 3,17
3 A | Fundamental — Anos Iniciais | 4,17
3 B | Fundamental — Anos Finais | 4,17
4 | Ensino Médio | 5,17
5 | Educação Integral | 6,17
6 | Educação Digital | 7,17
7 | Sustentabilidade | 8
8 | Educação Indígena, do Campo e Quilombola | 9,17
9 | Educação Especial e Inclusiva | 10,17
10 | Educação de Jovens e Adultos | 11,17
11 | Educação Profissional e Tecnológica | 12,13,17
12 | Ensino Superior | 14,15,16
13 | Gestão Democrática | 18
14 | Financiamento da Educação | 19

3 A e 3 B recebem todas estratégias dos objetivos 4 e 17. Grupo é contexto de navegação e o backend deve validar o vínculo grupo/objetivo antes de gravar. Os rótulos oficiais completos estão no catálogo; não substituí-los por resumos. Rótulos de navegação editoriais devem estar separados.

## Visual

Interface clara e enxuta em pt-BR, sem dashboard, hero gigante, gradients, excesso de cartões ou indicadores. Cabeçalho institucional discreto; título PME Fraiburgo, descrição breve, etapas curtas, formulário de seletores e área de leitura confortável. Fontes do sistema sem dependência externa.

A identidade visual usa exclusivamente o PNG legítimo SME fornecido pelo usuário em `public/brand/sme-fraiburgo.png` (7342 × 1000, transparente). Origem exata: https://drive.google.com/file/d/1OOa2Rpf88djjHRnS_2MJi--6faQ4OSFp/view?usp=sharing . A arte contém brasão, separador, FRAIBURGO e SECRETARIA DE EDUCAÇÃO com lettering magenta. Preservar integralmente cores e proporção, sem crop, recoloração ou distorção. Cabeçalho com imagem fluida de altura automática, até 660px no desktop, sem legenda textual redundante. Manter o alt acessível “Fraiburgo — Secretaria de Educação” e o rodapé institucional “Município de Fraiburgo · Secretaria Municipal de Educação”.

Tokens: magenta principal #A8518A, variante escura #87396D para hover/links/foco e confirmação de troca, charcoal #373435, branco e fundos rosados muito claros. Bordas, avisos, rádios, botões e leitura usam essa identidade. Contrastes fornecidos para branco: magenta 4,989:1 e charcoal 12,316:1. Não atribuir significado semântico de erro à marca; cores semânticas podem ser definidas quando necessárias. O ativo municipal antigo e seu CSS de recorte não integram o build nem a allowlist do preview.

## Leitura estática, build e segurança

ReactDOMServer e hydrateRoot com árvore inicial consistente e fechada. Sem JS ou com falha do módulo, catálogo integral em details acessível, separado do fluxo interativo e sem edição. Não reconstruir textos legais manualmente nem ocultar fallback por marcador dependente do módulo.

Sem credenciais frontend, analytics ou persistência em localStorage/sessionStorage/IndexedDB/cookies de app. Rascunho somente em memória. Cliente acessa somente a API de mesma origem; acesso Google ocorre no servidor. Não expor chave privada, identificadores operacionais ou respostas brutas do provedor em HTML, bundle ou erros públicos.

Todos os ambientes Vercel usam o mesmo build estático em `dist/`. Nunca ler `institutional/forms.json` ou `PME_FORMS_CONFIG`, nem gerar cliente com configuração embutida. `--institutional` muda apenas a saída para `institutional/build/`, sem ativar coleta. O preview serve somente allowlist pública em loopback `127.0.0.1:4173`, nunca a raiz; caminhos privados, sources e credenciais retornam 404. Não há Functions no preview estático.

## Aceitação e validação

- Conferir todos os 464 rótulos/textos/posições e hash da fonte; HTML contém catálogo integral.
- Grupos e vínculos exatos, 3 A/3 B completos; seleção inválida nunca habilita contribuição.
- Estado fechado SSR; status runtime aberto/fechado/falho; formulário, confirmação de troca, preservação de texto e erros testados com API sintética interceptada.
- Backend valida abertura operacional, origem, contexto e campos e só confirma após gravação; detalhes e limites em sheets-backend.md. Credenciais ausentes ou coleta fechada não devem produzir gravações.
- Testes de build: Production ignora segredo/config legado; arquivo privado sintético ilegível não impede build nem é alterado; allowlist exata; falha do build propagada sem criar config temporária.
- Desktop/mobile 320/375px, teclado/foco, sem JS e falha de módulo, sem overflow nem cabeçalho sobre foco.
- Relatar separadamente testes locais e integração real. Não há Sheets end-to-end real validado nesta migração; abertura exige configuração e verificação operacional autorizadas. Nenhum deploy ou acesso Google faz parte desta implementação.

## Histórico separado

A incorporação do Forms e a resposta técnica recebida/relida via API pertencem à etapa anterior (ver README e validation.md). Não são critérios atuais de coleta nem prova de recebimento em Sheets. Configuração histórica permanece privada e não deve ser lida pelo build.

## UX aprovada e implementada — cinco recomendações

As modalidades têm explicações acessíveis junto aos rádios: Geral — sugestões sobre o conjunto de estratégias do objetivo; Estratégia — sugestão sobre uma estratégia específica. Sem estratégia escolhida, orientar a selecionar uma estratégia para ler o texto integral; nunca exibir article vazio.

Etapa 2: “Escolha o objetivo e consulte o conteúdo”. Troca: “Alterar o assunto da contribuição”; referência: “Assunto da contribuição”. Resumos concisos identificam grupo, objetivo, modalidade e estratégia quando aplicável, sem repetir texto legal ou empilhar banners. Modal informa possível perda de texto antes de substituir o assunto do formulário; cancelar/Escape preserva rascunho e retorna foco ao acionador.

Grupo e objetivo permanecem selects nativos. Estratégia usa um único `StrategyCombobox.jsx` React acessível, sem dependências novas, somente com objetivo válido e modalidade Estratégia. Label “Estratégia”, placeholder “Digite uma palavra ou escolha na lista” e seta integrada abrem a lista completa do objetivo. A consulta usa filterStrategies por texto/ID, sem distinção de acentos/case. Resultados mostram rótulos e textos oficiais literais, com quebra de linha e scroll limitado em desktop e 320/375px; leitura integral escolhida permanece abaixo.

Combobox com useId estável no SSR, aria-expanded/controls/autocomplete=list/activedescendant e listbox/option com aria-selected da seleção real. Setas mudam destaque, Enter confirma explicitamente; clique/toque confirma mantendo foco no campo. Escape, Tab, blur e clique fora fecham e restauram a exibição escolhida ou vazia, sem apagar a seleção. Reabrir pela seta ou pelo campo permite lista toda sem apagar texto longo; foco seleciona o texto exibido. Limpar pesquisa é affordance interna, sem alterar seleção. Contagem acessível, vazio orientado e indicação discreta de seleção preservada durante pesquisa; nunca inserir selecionado fora do filtro como resultado falso.

Texto livre, limpeza da consulta, destaque e blur nunca alteram estratégia, leitura escolhida ou assunto da contribuição. Grupo/objetivo limpam consulta/abertura/destaque/seleção dependentes, com Geral padrão, sem descartar o rascunho. Componente remonta por grupo/objetivo; o formulário de contribuição continua vinculado ao contexto confirmado. Não persistir query em URL, storage ou analytics.

Introdução curta e aviso compacto com “Coleta ainda não aberta” explícito, aproximando seletor em 320/375px sem ocultar aviso nem mudar logo, paleta ou cabeçalho sem legenda.
