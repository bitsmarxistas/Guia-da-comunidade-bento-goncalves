"use client";

// src/app/login/LoginClient.tsx
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Simbolo } from "@/ui/components/brand/simbolo";

/**
 * Login (§5.6): compacto, mesma linguagem visual do público.
 * Erro não revela se o e-mail existe — a mensagem é sempre a mesma.
 */
export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/admin";
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("senha", senha);

      const resposta = await fetch("/api/auth/login", {
        method: "POST",
        body: formData,
      });
      const dados = await resposta.json();

      if (dados.error) {
        setErro(dados.error);
        setCarregando(false);
        return;
      }

      router.push(dados.redirect ?? redirect);
    } catch {
      setErro("Não foi possível entrar agora. Tente novamente.");
      setCarregando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mx-auto flex w-fit items-center gap-2.5 rounded-lg"
          aria-label="GuiaBG — página inicial"
        >
          <Simbolo className="h-9 w-auto text-brand" />
          <span className="font-[family-name:var(--font-fraunces)] text-[1.3rem] font-semibold tracking-tight text-ink">
            Guia<span className="text-brand">BG</span>
          </span>
        </Link>

        <div className="mt-6 rounded-[22px] border border-line bg-surface p-6">
          <p className="eyebrow">Painel</p>
          <h1 className="mt-2 font-[family-name:var(--font-fraunces)] text-2xl font-semibold">
            Entrar no guia
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Acesso restrito à administração.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {erro ? (
              <div
                role="alert"
                aria-live="assertive"
                className="flex items-start gap-2 rounded-[12px] border border-critical/40 bg-critical-tint p-3 text-sm text-ink"
              >
                <AlertCircle
                  className="mt-0.5 size-4 shrink-0 text-critical"
                  aria-hidden="true"
                />
                <span>{erro}</span>
              </div>
            ) : null}

            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="voce@exemplo.com"
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
                className="mt-2 h-11"
                required
                disabled={carregando}
                autoComplete="username"
              />
            </div>

            <div>
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                value={senha}
                onChange={(evento) => setSenha(evento.target.value)}
                className="mt-2 h-11"
                required
                disabled={carregando}
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={carregando}
            >
              {carregando ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Entrando…
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <div className="mt-4 flex items-center justify-between text-sm">
            <Link
              href="/recuperar-senha"
              className="font-semibold text-brand underline-offset-4 hover:underline"
            >
              Esqueceu a senha?
            </Link>
            <Link
              href="/"
              className="text-ink-soft underline-offset-4 hover:underline"
            >
              Voltar ao guia
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
