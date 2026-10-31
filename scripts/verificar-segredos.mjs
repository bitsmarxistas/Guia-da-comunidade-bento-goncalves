// scripts/verificar-segredos.mjs
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

/**
 * Falha o build/CI se um segredo real aparecer em arquivo RASTREADO pelo git.
 *
 * Existe porque a senha do Neon vazou para o historico: o `.env.local` estava
 * ignorado, mas um relatorio antigo copiou a connection string para dentro do
 * repositorio. Prevencao barata > rotacao de credencial.
 *
 * Placeholders de documentacao (localhost, "senha", "dev") sao permitidos:
 * o alvo e credencial de verdade.
 */
const PLACEHOLDERS = new Set([
  "dev",
  "build",
  "senha",
  "password",
  "user",
  "usuario",
  "exemplo",
  "example",
  "changeme",
  "postgres",
]);

function urlDeBancoSuspeita(conteudo) {
  const regex =
    /postgres(?:ql)?:\/\/([^\s:@/"\']+):([^\s@/"\']+)@([^\s/"\']+)/g;
  for (const achado of conteudo.matchAll(regex)) {
    const [, usuario, senha, host] = achado;
    if (/localhost|127\.0\.0\.1|::1/.test(host)) continue;
    if (PLACEHOLDERS.has(senha.toLowerCase())) continue;
    if (PLACEHOLDERS.has(usuario.toLowerCase())) continue;
    if (senha.length < 6) continue;
    return true;
  }
  return false;
}

const PADROES = [
  { nome: "senha do Neon", testar: (c) => /npg_[A-Za-z0-9]{8,}/.test(c) },
  { nome: "URL de banco com senha", testar: urlDeBancoSuspeita },
  { nome: "chave do Resend", testar: (c) => /\bre_[A-Za-z0-9]{20,}\b/.test(c) },
  {
    nome: "segredo de webhook do Resend",
    testar: (c) => /\bwhsec_[A-Za-z0-9+/=]{16,}/.test(c),
  },
];

const arquivos = execSync("git ls-files", { encoding: "utf8" })
  .split("\n")
  .filter(Boolean)
  .filter((arquivo) => !arquivo.startsWith("pnpm-lock"));

const achados = [];

for (const arquivo of arquivos) {
  let conteudo;
  try {
    conteudo = readFileSync(arquivo, "utf8");
  } catch {
    continue;
  }
  for (const padrao of PADROES) {
    if (padrao.testar(conteudo)) {
      achados.push(arquivo + " -> possivel " + padrao.nome);
    }
  }
}

if (achados.length > 0) {
  console.error("Segredos encontrados em arquivos rastreados:");
  for (const achado of achados) console.error("  - " + achado);
  console.error(
    "Remova o valor, rotacione a credencial se ela ja foi publicada e leia .env.example.",
  );
  process.exit(1);
}

console.log(
  "Nenhum segredo em arquivos rastreados (" +
    arquivos.length +
    " verificados).",
);
