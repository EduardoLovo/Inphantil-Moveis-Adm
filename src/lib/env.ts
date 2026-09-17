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

export const cloudinaryEnv = () => ({
  cloudName: requireEnv("CLOUDINARY_CLOUD_NAME"),
  apiKey: requireEnv("CLOUDINARY_API_KEY"),
  apiSecret: requireEnv("CLOUDINARY_API_SECRET"),
  folder: process.env.CLOUDINARY_UPLOAD_FOLDER || "inphantil",
});
