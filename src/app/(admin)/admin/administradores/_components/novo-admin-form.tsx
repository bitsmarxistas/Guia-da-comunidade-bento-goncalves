"use client";

import { useActionState, useEffect, useRef } from "react";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { criarAdminAction } from "@/application/governanca/admin";
import { Alert, AlertDescription, AlertTitle } from "@/ui/components/alert";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";

interface EstadoFormulario {
  success?: boolean;
  error?: string;
}

export function NovoAdminForm() {
  const [estado, formAction, pendente] = useActionState<
    EstadoFormulario,
    FormData
  >(criarAdminAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado.success) {
      formRef.current?.reset();
    }
  }, [estado.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {estado.error ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>Não foi possível criar</AlertTitle>
          <AlertDescription>{estado.error}</AlertDescription>
        </Alert>
      ) : null}

      {estado.success ? (
        <Alert className="border-positive/30 bg-positive-tint">
          <CheckCircle aria-hidden="true" />
          <AlertTitle className="text-positive">
            Administrador criado
          </AlertTitle>
          <AlertDescription>
            A conta já está ativa e pode entrar no painel com a senha
            cadastrada.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="novo-admin-nome">Nome</Label>
        <Input
          id="novo-admin-nome"
          name="nome"
          type="text"
          required
          minLength={3}
          maxLength={120}
          autoComplete="name"
          placeholder="Nome completo"
          disabled={pendente}
          className="h-10"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="novo-admin-email">E-mail</Label>
        <Input
          id="novo-admin-email"
          name="email"
          type="email"
          required
          maxLength={120}
          autoComplete="email"
          placeholder="nome@guiabg.com.br"
          disabled={pendente}
          className="h-10"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="novo-admin-senha">Senha</Label>
        <Input
          id="novo-admin-senha"
          name="senha"
          type="password"
          required
          minLength={12}
          maxLength={200}
          autoComplete="new-password"
          aria-describedby="novo-admin-senha-ajuda"
          disabled={pendente}
          className="h-10"
        />
        <p id="novo-admin-senha-ajuda" className="text-xs text-ink-mute">
          Mínimo de 12 caracteres. A senha é armazenada com hash argon2.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="novo-admin-confirmacao">Confirme a senha</Label>
        <Input
          id="novo-admin-confirmacao"
          name="confirmacaoSenha"
          type="password"
          required
          minLength={12}
          maxLength={200}
          autoComplete="new-password"
          disabled={pendente}
          className="h-10"
        />
      </div>

      <Button type="submit" disabled={pendente} className="h-10">
        {pendente ? (
          <>
            <Loader2 className="animate-spin" aria-hidden="true" />
            Criando...
          </>
        ) : (
          "Criar administrador"
        )}
      </Button>
    </form>
  );
}
