// Exemplo vulnerável para teste da revisão com IA.
// NÃO utilizar em produção.

export async function buscarAluno(env, nome) {
  const sql = `SELECT * FROM alunos WHERE nome = '${nome}'`;

  return await env.DB.prepare(sql).all();
}