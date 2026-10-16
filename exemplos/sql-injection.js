// Exemplo corrigido — consulta SQL parametrizada.

export async function buscarAluno(env, nome) {
  const sql = "SELECT * FROM alunos WHERE nome = ?";

  return await env.DB.prepare(sql).bind(nome).all();
}