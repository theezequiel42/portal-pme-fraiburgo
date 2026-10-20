# Revisão UX — 20/10/2026

Avaliação heurística, sem teste com participantes. As observações abaixo foram relatadas pelo Hermes no navegador; não representam nova inspeção nesta alteração. Na avaliação UX original a coleta estava fechada. A ativação posterior incluiu conferência real do pré-preenchimento e preservação de rascunho no iframe; isso não equivale a teste de usabilidade com participantes. As cinco recomendações aprovadas foram implementadas nesta revisão e verificadas pelo Hermes no navegador, como conta de desenvolvimento, sem abrir a coleta.

## Observações anteriores à implementação

- Em mobile de 375px, antes da remoção da legenda institucional, o primeiro seletor começava em y=485. Após a remoção, a medição no navegador foi y=449.703125. Ainda existe espaço ocupado por introdução e aviso antes da primeira escolha; encurtar a orientação pode aproximar a tarefa principal sem ocultar o estado fechado da coleta.
- Os rádios “Geral” e “Estratégia” não explicam as modalidades antes da escolha.
- No grupo 12, o seletor de objetivo trunca o texto oficial longo do objetivo 14; as opções de estratégia também são muito extensas.
- Ao marcar “Estratégia” sem escolher um item, o article de leitura fica vazio, sem instrução.
- O cabeçalho da etapa 2 usa “escolha o contexto”, expressão técnica; os textos de contexto do Forms e de troca também usam termos técnicos.

## Recomendações aprovadas — implementadas

1. **Alta:** explicar as modalidades junto aos rádios em linguagem simples e apresentar uma mensagem curta quando nenhuma estratégia tiver sido escolhida.
2. **Alta:** orientar a navegação com um resumo humano da seleção e o próximo passo, evitando empilhar instruções; revisar “contexto” na etapa 2 e nos textos do Forms e de troca. Preservar selects nativos de grupo/objetivo e combobox aprovado de estratégia, referência visível durante a escrita, confirmação explícita de troca e estabilidade do iframe durante a navegação.
3. **Média:** facilitar a localização de estratégias, avaliando busca ou apoio editorial separado dos textos legais. Preservar IDs e textos oficiais integrais e o vínculo ao objetivo, sem inventar hierarquia com metas.

A validação em navegador fora do sandbox deve conferir compreensão, localização de itens longos e posição do seletor em mobile. A incorporação e o preenchimento real continuam sujeitos aos gates institucionais e à autorização própria.

## Implementação das cinco recomendações

1. Rádios com explicações associadas por aria-describedby, sem avanço automático ou mudança de foco.
2. Leitura sem estratégia apresenta orientação; zero resultados oferece alternativa de busca.
3. Etapa 2 usa “Escolha o objetivo e consulte o conteúdo”; ações e modal usam “Alterar o assunto da contribuição”, referência usa “Assunto da contribuição”. Resumo conciso e aviso explícito de possível perda de texto preservados.
4. Estratégia agora usa um único combobox React com busca local por palavra/ID, sem acentos/case. Lista integral com quebras e scroll, contagem viva, vazio orientado e limpeza interna. Apenas confirmação explícita por Enter/clique/toque muda seleção. Escape/Tab/blur/clique fora restauram exibição; texto livre/destaque não mudam leitura/iframe. Seleção fora do filtro permanece só na leitura, sem resultado artificial. Grupo/objetivo limpam estado dependente; selects nativos limitados a esses dois campos. Nenhuma query é persistida ou transmitida.
5. Introdução e aviso fechado encurtados; espaçamento mobile reduzido, logo/paleta preservados e nenhum texto acrescentado ao cabeçalho.

A suíte browser contém asserções destas cinco recomendações, incluindo 320/375px, reset, teclado/foco e fixture preservada ao filtrar/cancelar/Escape. Sua execução anterior ao combobox passou como conta de desenvolvimento após bloqueio inicial de Chromium no sandbox. Capturas e inspeção em 1280/375/320px confirmaram busca, leitura e ausência de overflow; isso não equivale a teste com participantes. Ver docs/validation.md.

## Combobox aprovado — validação desta alteração

Teste SSR novo vermelho antes da implementação e verde depois. Testes Node/build/catálogo/formatação executados. Browser ampliado para teclado, foco, ARIA, consulta não confirmada, zero resultados, acento/ID/case, outside/Tab/Escape, toque 320/375 e estabilidade do iframe/cancelamento. Após bloqueio inicial no sandbox, Hermes executou e aprovou a suíte atual como conta de desenvolvimento. Capturas e inspeção em1280/375/320 confirmaram controle único, texto integral, toque/rolagem, lista visível ao abrir perto do fim da tela e ausência de erros/overflow. A fixture não comprova recebimento real de contribuições; não houve teste com participantes ou leitor de tela real.
