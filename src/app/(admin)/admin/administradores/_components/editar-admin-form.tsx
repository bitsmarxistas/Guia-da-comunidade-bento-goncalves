"use client";

import { useActionState, useEffect, useRef } from "react";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { atualizarAdminAction } from "@/application/governanca/admin";
import { Alert, AlertDescription, AlertTitle } from "@/ui/components/alert";
import { Button } from "@/ui/components/button";
import { Checkbox } from "@/ui/components/checkbox";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";

interface AdminEditavel {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
}

interface EstadoFormulario {
  success?: boolean;
  error?: string;
}

export function EditarAdminForm({
  admin,
  ehAdminRaiz,
}: {
  admin: AdminEditavel;
  ehAdminRaiz: boolean;
}) {
  const [estado, formAction, pendente] = useActionState<
    EstadoFormulario,
    FormData
  >(atualizarAdminAction, {});
  const senhaRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (estado.success && senhaRef.current) {
      senhaRef.current.value = "";
    }
  }, [estado.success]);

  return (
    <form
      action={formAction}
      className="mt-3 space-y-4 rounded-lg border border-line bg-surface p-4"
    >
      <input type="hidden" name="adminId" value={admin.id} />

      {estado.error ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>Não foi possível atualizar</AlertTitle>
          <AlertDescription>{estado.error}</AlertDescription>
        </Alert>
      ) : null}

      {estado.success ? (
        <Alert className="border-positive/30 bg-positive-tint">
          <CheckCircle aria-hidden="true" />
          <AlertTitle className="text-positive">
            Administrador atualizado
          </AlertTitle>
          <AlertDescription>
            As alterações já valem para o próximo acesso.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`admin-nome-${admin.id}`}>Nome</Label>
          <Input
            id={`admin-nome-${admin.id}`}
            name="nome"
            type="text"
            required
            minLength={3}
            maxLength={120}
            defaultValue={admin.nome}
            autoComplete="name"
            disabled={pendente}
            className="h-10"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`admin-email-${admin.id}`}>E-mail</Label>
          <Input
            id={`admin-email-${admin.id}`}
            name="email"
            type="email"
            required
            maxLength={120}
            defaultValue={admin.email}
            autoComplete="email"
            readOnly={ehAdminRaiz}
            aria-describedby={
              ehAdminRaiz ? `admin-email-ajuda-${admin.id}` : undefined
            }
            disabled={pendente}
            className="h-10"
          />
          {ehAdminRaiz ? (
            <p
              id={`admin-email-ajuda-${admin.id}`}
              className="text-xs text-ink-mute"
            >
              O e-mail do administrador principal é a própria chave de acesso e
              não pode ser alterado.
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {ehAdminRaiz ? (
          <>
            <input type="hidden" name="ativo" value="on" />
            <Checkbox id={`admin-ativo-${admin.id}`} defaultChecked disabled />
            <Label
              htmlFor={`admin-ativo-${admin.id}`}
              className="text-ink-soft"
            >
              Ativo
            </Label>
            <span className="text-xs text-ink-mute">
              O administrador principal não pode ser desativado.
            </span>
          </>
        ) : (
          <>
            <Checkbox
              id={`admin-ativo-${admin.id}`}
              name="ativo"
              defaultChecked={admin.ativo}
              disabled={pendente}
            />
            <Label htmlFor={`admin-ativo-${admin.id}`}>Ativo</Label>
            <span className="text-xs text-ink-mute">
              Desmarcar suspende o acesso desta conta imediatamente.
            </span>
          </>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`admin-senha-${admin.id}`}>Nova senha (opcional)</Label>
        <Input
          ref={senhaRef}
          id={`admin-senha-${admin.id}`}
          name="novaSenha"
          type="password"
          minLength={12}
          maxLength={200}
          autoComplete="new-password"
          placeholder="Deixe em branco para manter a senha atual"
          disabled={pendente}
          className="h-10"
        />
        <p className="text-xs text-ink-mute">
          Mínimo de 12 caracteres. Trocar a senha incrementa a versão do token e
          encerra as sessões antigas deste administrador.
        </p>
      </div>

      <Button type="submit" disabled={pendente} className="h-10">
        {pendente ? (
          <>
            <Loader2 className="animate-spin" aria-hidden="true" />
            Salvando...
          </>
        ) : (
          "Salvar alterações"
        )}
      </Button>
    </form>
  );
}
