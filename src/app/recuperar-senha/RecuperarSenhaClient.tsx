// src/app/recuperar-senha/RecuperarSenhaClient.tsx
"use client";

import { useState } from "react";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";
import { Mail, AlertCircle, CheckCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export default function RecuperarSenhaClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stage = searchParams.get("stage") || "solicitar";
  const token = searchParams.get("token");

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSolicitar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    const formData = new FormData();
    formData.append("email", email);

    const response = await fetch("/api/auth/recuperar-senha/solicitar", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.error) {
      setErro(data.error);
    } else {
      setSucesso(data.message);
    }
    setCarregando(false);
  }

  async function handleRedefinir(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (senha !== confirmarSenha) {
      setErro("As senhas não conferem");
      return;
    }

    if (senha.length < 8) {
      setErro("A senha deve ter pelo menos 8 caracteres");
      return;
    }

    setCarregando(true);

    const formData = new FormData();
    formData.append("token", token || "");
    formData.append("senha", senha);
    formData.append("confirmarSenha", confirmarSenha);

    const response = await fetch("/api/auth/recuperar-senha/redefinir", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.error) {
      setErro(data.error);
    } else {
      setSucesso(data.message);
      setTimeout(() => router.push("/login"), 2000);
    }
    setCarregando(false);
  }

  if (stage === "redefinir" && !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
        <div className="w-full max-w-md text-center">
          <p className="text-critical">Token inválido ou expirado</p>
          <a
            href="/recuperar-senha"
            className="mt-4 inline-block font-semibold text-brand underline-offset-4 hover:underline"
          >
            Solicitar novo e-mail
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="font-[family-name:var(--font-fraunces)] text-2xl">
              {stage === "solicitar" ? "Recuperar senha" : "Definir nova senha"}
            </CardTitle>
            <CardDescription>
              {stage === "solicitar"
                ? "Informe seu e-mail. Se o endereço estiver cadastrado, enviamos as instruções."
                : "Digite sua nova senha"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {erro && (
              <div
                role="alert"
                aria-live="assertive"
                className="mb-4 flex items-center gap-2 rounded-[12px] border border-critical/40 bg-critical-tint p-3 text-sm text-ink"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{erro}</span>
              </div>
            )}
            {sucesso && (
              <div
                role="status"
                aria-live="polite"
                className="mb-4 flex items-center gap-2 rounded-[12px] border border-positive/40 bg-positive-tint p-3 text-sm text-ink"
              >
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <span>{sucesso}</span>
              </div>
            )}

            {stage === "solicitar" ? (
              <form onSubmit={handleSolicitar} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-ink-mute" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="voce@exemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                      disabled={carregando}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={carregando}>
                  {carregando ? "Enviando..." : "Enviar Instruções"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRedefinir} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="senha">Nova Senha</Label>
                  <Input
                    id="senha"
                    type="password"
                    placeholder="••••••••"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                    disabled={carregando}
                    minLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmarSenha">Confirmar Senha</Label>
                  <Input
                    id="confirmarSenha"
                    type="password"
                    placeholder="••••••••"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    required
                    disabled={carregando}
                    minLength={8}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={carregando}>
                  {carregando ? "Redefinindo..." : "Redefinir Senha"}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <a
              href="/login"
              className="text-sm font-semibold text-brand underline-offset-4 hover:underline"
            >
              Voltar para o login
            </a>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
