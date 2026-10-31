// src/app/(admin)/admin/configuracoes/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { AdminPageHeader } from "@/app/(admin)/_components/admin-shared";

export default async function ConfiguracoesPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Configurações"
        description="Gerenciar dados institucionais e limites do GuiaBG."
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Configurações gerais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="nome-guia">Nome do GuiaBG</Label>
                <Input
                  id="nome-guia"
                  type="text"
                  defaultValue="GuiaBG"
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email-institucional">
                  E-mail institucional
                </Label>
                <Input
                  id="email-institucional"
                  type="email"
                  defaultValue="contato@guiabg.com.br"
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email-dpo">E-mail DPO (LGPD)</Label>
                <Input
                  id="email-dpo"
                  type="email"
                  defaultValue="dpo@guiabg.com.br"
                  className="h-10"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" className="h-10">
                  Salvar
                </Button>
                <Button variant="outline" size="sm" className="h-10">
                  Cancelar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>Limites e regras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="max-imagens">Máx. imagens por comércio</Label>
                <Input
                  id="max-imagens"
                  type="number"
                  defaultValue="5"
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="max-tamanho-imagem">
                  Máx. tamanho da imagem (MB)
                </Label>
                <Input
                  id="max-tamanho-imagem"
                  type="number"
                  defaultValue="5"
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="max-anexos">Máx. anexos por solicitação</Label>
                <Input
                  id="max-anexos"
                  type="number"
                  defaultValue="3"
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="max-tamanho-anexo">
                  Tamanho máx. do anexo (MB)
                </Label>
                <Input
                  id="max-tamanho-anexo"
                  type="number"
                  defaultValue="10"
                  className="h-10"
                />
              </div>
              <div className="flex flex-wrap gap-2 sm:col-span-2">
                <Button size="sm" className="h-10">
                  Salvar limites
                </Button>
                <Button variant="outline" size="sm" className="h-10">
                  Cancelar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
