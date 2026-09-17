/**
 * Acesso centralizado a variáveis de ambiente do servidor.
 * Não valida na importação (para não quebrar o build sem .env); em vez
 * disso, `requireEnv` lança apenas quando a variável é realmente usada.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Variável de ambiente ausente: ${name}. Confira o seu .env (veja .env.example).`,
    );
  }
  return value;
}

export const r2Env = () => {
  const accountId = requireEnv("R2_ACCOUNT_ID");
  return {
    accountId,
    accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
    secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    bucket: requireEnv("R2_BUCKET"),
    // Base pública para servir os objetos (r2.dev ou domínio próprio),
    // sem barra no final. Ex.: https://pub-xxxx.r2.dev
    publicBaseUrl: requireEnv("R2_PUBLIC_BASE_URL").replace(/\/+$/, ""),
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    folder: process.env.R2_UPLOAD_FOLDER || "inphantil",
  };
};
