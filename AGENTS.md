# Regras para agentes

- Projeto de Ezequiel; execute como usuário fraiburgo. Não altere configurações de Hermes nem credenciais.
- Leia docs/spec.md e README.md antes de trabalhar. 
- Arquitetura aprovada: formulário React com backend Node em Vercel Functions e armazenamento pela API oficial do Google Sheets. Credenciais exclusivamente no servidor. Não usar endpoints não documentados.
- Catálogo legal data/pne-catalog.json imutável na implementação. Compare todos os 464 rótulos/textos com sources/numbered-rows.json. Estratégias pertencem a objetivo, não inferir relação com meta.
- Configuração real institucional fica em institutional/ ignorado pelo Git e fora de dist no build demonstrativo.
- Preview somente dist, loopback; não servir raiz do repositório. .git/config, institutional/, sources/ e credenciais precisam retornar 404.
- Use dependências compatíveis com Node 22.23.1; mantenha lockfile. Execute testes, build e verificação de catálogo. Registre limites reais, não simule resultado de integração fechada.
