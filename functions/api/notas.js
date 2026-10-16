
export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB
      .prepare("SELECT * FROM notas ORDER BY id DESC")
      .all();

    return Response.json({
      sucesso: true,
      notas: results
    });
  } catch (erro) {
    console.error("Erro ao consultar notas");

    return Response.json(
      { sucesso: false, erro: "Erro interno" },
      { status: 500 }
    );
  }
}
