# Avaliação — GitHub Actions com IA

## Tarefa 1 — CI a cada commit

O workflow `ci.yml` executa verificações de segredos versionados, validade das migrações SQL em SQLite local e validação dos arquivos HTML.

- [Execução verde](https://github.com/Joaoterra159/avaliacao-github-actions/actions/runs/38848389857/job/116803954060)
- [Execução vermelha](https://github.com/Joaoterra159/avaliacao-github-actions/actions/runs/38848892295/job/116805490981)

**Erro identificado:** `Parse error near line 2: near ')': syntax error`. A migração SQL apresentava um erro de sintaxe, corrigido posteriormente.

**Por que testar em SQLite antes do D1?** Para identificar erros de sintaxe e problemas nas migrações antes de aplicá-las ao banco remoto.

## Tarefa 2 — Proteção da main

A branch `main` foi protegida por uma regra que exige Pull Request e aprovação do status check `verificar`.

- [Pull Request #1 — bloqueado com CI vermelho e liberado após correção](https://github.com/Joaoterra159/avaliacao-github-actions/pull/1)

**Teste de push direto:** o GitHub recusou o envio para a `main`, apresentando o erro `GH013` e informando que as alterações precisam passar por um Pull Request e pelo status check obrigatório.

## Tarefa 3 — Revisão de Pull Request por IA

- [Pull Request #2 — revisão com IA](https://github.com/Joaoterra159/avaliacao-github-actions/pull/2)

**Situação:** o workflow foi criado com `actions/ai-inference@v1`, leitura do diff e tentativa de publicação da resposta no Pull Request. Entretanto, a etapa de inferência apresentou o erro:

`API error: TypeError: Cannot use 'in' operator to search for 'choices' in OK`

Foram testados diferentes formatos de prompt e configurações de autenticação, sem sucesso. A publicação dos comentários da IA e o teste de falha por remoção da permissão `pull-requests: write` ainda estão pendentes.

**Avaliação crítica:** não foi possível avaliar uma resposta da IA, pois a inferência falhou antes de produzir um comentário.

## Tarefa 4 — Migrações D1 após o merge

O workflow `migrar.yml` executa as migrações no Cloudflare D1 remoto somente após um push na `main` que altere a pasta `migrations/`.

- [Pull Request #3 — migração](https://github.com/Joaoterra159/avaliacao-github-actions/pull/3)
- [Execução verde da migração](https://github.com/Joaoterra159/avaliacao-github-actions/actions/runs/38859758388)
- [Pull Request #4 — alteração sem migração](https://github.com/Joaoterra159/avaliacao-github-actions/pull/4)
- [Execução do CI após o PR #4](https://github.com/Joaoterra159/avaliacao-github-actions/actions/runs/38860165445)

**Verificação no D1:** o comando `PRAGMA table_info(notas);` confirmou as colunas `id`, `aluno`, `nota`, `criado_em` e `observacao`.

**Teste do filtro:** após o merge do PR #4, que modificou apenas `README.md`, o workflow `Migrar banco D1` continuou com apenas uma execução, demonstrando que não foi disparado novamente.

## Perguntas teóricas

### 1. Por que o CI roda duas vezes quando há um push em uma branch com PR aberto?

Porque o workflow está configurado para os eventos `push` e `pull_request`. O GitHub pode iniciar uma execução para cada evento; a proteção da `main` considera o status check exigido no contexto do Pull Request antes de permitir o merge.

### 2. Por que um PR vindo de um fork não recebe `secrets.COPILOT_PAT`?

Por segurança, o GitHub não disponibiliza normalmente os segredos do repositório de destino para workflows disparados por Pull Requests de forks. Isso impede que alguém envie código malicioso em um fork para tentar capturar tokens e outras credenciais.

### 3. Por que declarar `permissions` no workflow da revisão com IA?

Para aplicar o princípio do menor privilégio, concedendo ao `GITHUB_TOKEN` apenas os acessos necessários. O workflow precisa ler o conteúdo e publicar comentários no Pull Request, sem receber permissões desnecessárias.

### 4. A revisão da IA pode substituir o status check da Tarefa 2?

Não. A revisão da IA pode auxiliar na identificação de vulnerabilidades e erros, mas suas respostas podem ser incompletas ou incorretas, e a própria integração pode falhar. O CI executa verificações objetivas e automatizadas que continuam necessárias para proteger a `main`.
