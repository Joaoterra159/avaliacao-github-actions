# Avaliação — GitHub Actions com IA

## Tarefa 1 — CI a cada commit

O workflow `ci.yml` executa verificações de segredos versionados, validade das migrações SQL em SQLite local e validação dos arquivos HTML.

- [Execução verde](https://github.com/Joaoterra159/avaliacao-github-actions/actions/runs/38848389857/job/116803954060)
- [Execução vermelha](https://github.com/Joaoterra159/avaliacao-github-actions/actions/runs/38848892295/job/116805490981)

**Erro identificado:** `Parse error near line 2: near ')': syntax error`. A migração SQL apresentava um erro de sintaxe, corrigido posteriormente.

**Por que testar em SQLite antes do D1?** Para identificar erros de sintaxe e problemas nas migrações antes de aplicá-las ao banco remoto.

## Tarefa 3 — Revisão de Pull Request por IA

- [Pull Request #2 — revisão automática com IA](https://github.com/Joaoterra159/avaliacao-github-actions/pull/2)

**Implementação:** foi criado o workflow `.github/workflows/revisao-ia.yml`, que é acionado por eventos de Pull Request, obtém o diff das alterações, envia o conteúdo para uma IA e publica automaticamente o resultado como comentário no PR.

Inicialmente, a integração com `actions/ai-inference@v1` apresentou um erro de inferência. Para resolver o problema, foi utilizada a versão `actions/ai-inference@v3`, com o GitHub Copilot CLI e a configuração `model: ''`, permitindo a seleção automática de modelo disponível no plano Copilot Free.

**Teste 1 — Identificação de SQL Injection**

Foi adicionado ao PR o arquivo `exemplos/sql-injection.js`, inicialmente contendo uma consulta SQL vulnerável por interpolar diretamente a variável `nome`:

`const sql = \`SELECT * FROM alunos WHERE nome = '${nome}'\`;`

A IA identificou corretamente a possibilidade de SQL Injection, explicou o risco de manipulação da consulta e recomendou o uso de parâmetros vinculados com `.prepare(...).bind(nome)`.

**Teste 2 — Correção da vulnerabilidade**

O código foi corrigido para utilizar uma consulta parametrizada:

```javascript
const sql = "SELECT * FROM alunos WHERE nome = ?";
return await env.DB.prepare(sql).bind(nome).all();
```

Após o envio da correção, a IA executou uma nova revisão e confirmou que o exemplo passou a utilizar placeholder e `.bind(nome)`, sem identificar SQL Injection nesse trecho.

**Teste 3 — Falha por falta de permissão**

A permissão do workflow foi alterada temporariamente de `pull-requests: write` para `pull-requests: read`.

A IA conseguiu realizar a análise, mas a etapa de publicação do comentário falhou com a mensagem:

`GraphQL: Resource not accessible by integration (addComment)`

`Error: Process completed with exit code 1.`

Isso demonstrou que a permissão `pull-requests: write` é necessária para que o `GITHUB_TOKEN` publique comentários no Pull Request.

Após o teste, a permissão `pull-requests: write` foi restaurada e o workflow voltou a executar com sucesso.

**Avaliação crítica da IA**

A revisão automática identificou corretamente a SQL Injection e reconheceu sua correção. Também apontou um possível risco de exposição do segredo `COPILOT_PAT`, pois o workflow de Pull Request utiliza uma credencial em uma execução cuja definição pode ser alterada por contribuidores com acesso à branch.

Esse alerta é relevante e deve ser considerado antes de utilizar o workflow em produção. Uma abordagem mais segura é executar etapas privilegiadas apenas a partir de workflows confiáveis, com permissões e credenciais restritas.

Entretanto, a IA não substitui verificações automáticas de CI nem revisão humana. Suas respostas podem conter inconsistências, classificações de gravidade discutíveis e resultados diferentes entre execuções. Por isso, os achados precisam ser validados antes de aplicar correções.

**Resultado:** a revisão automática funcionou, publicou comentários no PR, identificou a vulnerabilidade proposital, reconheceu a correção e demonstrou a falha de permissão exigida na avaliação.

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
