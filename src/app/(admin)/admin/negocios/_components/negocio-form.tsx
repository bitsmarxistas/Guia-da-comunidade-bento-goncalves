"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Plus, Search } from "lucide-react";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Textarea } from "@/ui/components/textarea";
import { consultarCepAction } from "@/application/cep/consultar-cep";
import { formatarCep, normalizarCep } from "@/domain/utils/cep";
import { salvarNegocio } from "./acoes";

type Estado = { success?: boolean; error?: string | null };

const DIAS = [
  { valor: 1, rotulo: "Seg" },
  { valor: 2, rotulo: "Ter" },
  { valor: 3, rotulo: "Qua" },
  { valor: 4, rotulo: "Qui" },
  { valor: 5, rotulo: "Sex" },
  { valor: 6, rotulo: "Sáb" },
  { valor: 0, rotulo: "Dom" },
];

const FAIXAS_PADRAO = [
  { rotulo: "08h–12h", inicio: "08:00", fim: "12:00" },
  { rotulo: "09h–18h", inicio: "09:00", fim: "18:00" },
  { rotulo: "13h–19h", inicio: "13:00", fim: "19:00" },
  { rotulo: "18h–22h", inicio: "18:00", fim: "22:00" },
];

export interface NegocioFormDados {
  id?: string;
  nome?: string;
  descricao?: string;
  contatos?: Array<{ tipo: string; valor: string; ordem: number }>;
  localizacao?: {
    endereco?: string | null;
    bairro?: string | null;
    areaAtendimento?: string | null;
    cep?: string | null;
    numero?: string | null;
    semPontoComercial?: boolean | null;
    latitude?: number | null;
    longitude?: number | null;
  } | null;
  horarios?: Array<{
    diaSemana: number;
    horaAbertura: string;
    horaFechamento: string;
    observacao?: string | null;
  }>;
  categoriasIds?: string[];
}

function paraMinutos(hora: string): number {
  const [h, m] = hora.split(":");
  return Number(h) * 60 + Number(m ?? 0);
}

/**
 * Editor da ficha no painel.
 *
 * Tem os MESMOS campos do wizard público (endereço com CEP e número, área de
 * atendimento, e-mail/site, intervalo de almoço, sob agendamento). A versão
 * anterior só tinha rua e bairro soltos: a equipe não conseguia completar o
 * que o solicitante informa — e a ficha publicada ficava incompleta.
 */
export function NegocioForm({
  negocio,
  categorias,
}: {
  negocio?: NegocioFormDados;
  categorias: Array<{ id: string; nome: string }>;
}) {
  const router = useRouter();
  const [estado, acao, pendente] = useActionState<Estado, FormData>(
    async (_prev, formData) => salvarNegocio(formData),
    { success: false, error: null },
  );

  const contatoDo = (tipo: string) =>
    negocio?.contatos?.find((c) => c.tipo === tipo)?.valor ?? "";

  // Contatos
  const [whatsapp, setWhatsapp] = useState(contatoDo("whatsapp"));
  const [telefone, setTelefone] = useState(contatoDo("telefone"));
  const [instagram, setInstagram] = useState(contatoDo("instagram"));
  const [email, setEmail] = useState(contatoDo("email"));
  const [site, setSite] = useState(contatoDo("site"));

  // Endereço
  const [cep, setCep] = useState(
    negocio?.localizacao?.cep ? formatarCep(negocio.localizacao.cep) : "",
  );
  const [numero, setNumero] = useState(negocio?.localizacao?.numero ?? "");
  const [semPontoComercial, setSemPontoComercial] = useState(
    Boolean(negocio?.localizacao?.semPontoComercial),
  );
  const [endereco, setEndereco] = useState(
    negocio?.localizacao?.endereco ?? "",
  );
  const [bairro, setBairro] = useState(negocio?.localizacao?.bairro ?? "");
  const [areaAtendimento, setAreaAtendimento] = useState(
    negocio?.localizacao?.areaAtendimento ?? "",
  );
  const [coordenadas, setCoordenadas] = useState<{
    latitude: number;
    longitude: number;
  } | null>(
    typeof negocio?.localizacao?.latitude === "number" &&
      typeof negocio?.localizacao?.longitude === "number"
      ? {
          latitude: negocio.localizacao.latitude,
          longitude: negocio.localizacao.longitude,
        }
      : null,
  );
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [avisoCep, setAvisoCep] = useState("");

  // Horário
  const horariosOrdenados = [...(negocio?.horarios ?? [])].sort(
    (a, b) =>
      a.diaSemana - b.diaSemana || a.horaAbertura.localeCompare(b.horaAbertura),
  );
  const diasDoNegocio = [...new Set(horariosOrdenados.map((h) => h.diaSemana))];
  const primeiroDia = horariosOrdenados.filter(
    (h) => h.diaSemana === diasDoNegocio[0],
  );

  const [dias, setDias] = useState<number[]>(diasDoNegocio);
  const [abre, setAbre] = useState(
    primeiroDia[0]?.horaAbertura?.slice(0, 5) ?? "08:00",
  );
  const [fecha, setFecha] = useState(
    primeiroDia[primeiroDia.length - 1]?.horaFechamento?.slice(0, 5) ?? "18:00",
  );
  const [intervaloAtivo, setIntervaloAtivo] = useState(primeiroDia.length > 1);
  const [intervaloInicio, setIntervaloInicio] = useState(
    primeiroDia[0]?.horaFechamento?.slice(0, 5) ?? "12:00",
  );
  const [intervaloFim, setIntervaloFim] = useState(
    primeiroDia[1]?.horaAbertura?.slice(0, 5) ?? "13:00",
  );
  const [sobAgendamento, setSobAgendamento] = useState(
    (negocio?.horarios ?? []).some((h) =>
      (h.observacao ?? "").toLowerCase().includes("agendamento"),
    ),
  );

  const [selecionadas, setSelecionadas] = useState<string[]>(
    negocio?.categoriasIds ?? [],
  );

  useEffect(() => {
    if (estado.success) {
      router.push("/admin/negocios");
      router.refresh();
    }
  }, [estado.success, router]);

  const erroHorario = (() => {
    if (sobAgendamento || dias.length === 0) return null;
    if (paraMinutos(abre) >= paraMinutos(fecha)) {
      return "O horário de abertura precisa ser antes do fechamento.";
    }
    if (!intervaloAtivo) return null;
    if (paraMinutos(intervaloInicio) >= paraMinutos(intervaloFim)) {
      return "O intervalo precisa terminar depois de começar.";
    }
    if (!(
      paraMinutos(abre) < paraMinutos(intervaloInicio) &&
      paraMinutos(intervaloFim) < paraMinutos(fecha)
    )) {
      return "O intervalo precisa ficar dentro do horário de funcionamento.";
    }
    return null;
  })();

  const contatos = [
    whatsapp.trim()
      ? { tipo: "whatsapp", valor: whatsapp.trim(), ordem: 0 }
      : null,
    telefone.trim()
      ? { tipo: "telefone", valor: telefone.trim(), ordem: 1 }
      : null,
    instagram.trim()
      ? {
          tipo: "instagram",
          valor: instagram.trim().replace(/^@/, ""),
          ordem: 2,
        }
      : null,
    email.trim() ? { tipo: "email", valor: email.trim(), ordem: 3 } : null,
    site.trim() ? { tipo: "site", valor: site.trim(), ordem: 4 } : null,
  ].filter(Boolean);

  const horarios = dias.flatMap((dia) => {
    if (sobAgendamento) {
      return [
        {
          diaSemana: dia,
          horaAbertura: "00:00",
          horaFechamento: "00:00",
          observacao: "somente sob agendamento",
        },
      ];
    }
    if (intervaloAtivo) {
      return [
        {
          diaSemana: dia,
          horaAbertura: abre,
          horaFechamento: intervaloInicio,
          observacao: "",
        },
        {
          diaSemana: dia,
          horaAbertura: intervaloFim,
          horaFechamento: fecha,
          observacao: "",
        },
      ];
    }
    return [
      {
        diaSemana: dia,
        horaAbertura: abre,
        horaFechamento: fecha,
      },
    ];
  });

  async function buscarCep() {
    const digitos = normalizarCep(cep);
    if (digitos.length !== 8) {
      setAvisoCep("O CEP precisa ter 8 dígitos.");
      return;
    }

    setBuscandoCep(true);
    setAvisoCep("");

    try {
      const { endereco: achado, error } = await consultarCepAction(digitos);

      if (error || !achado) {
        setAvisoCep(error ?? "Não encontramos esse CEP. Preencha à mão.");
        return;
      }

      // Só preenche o que está vazio: o admin está corrigindo, não digitando.
      if (achado.logradouro) {
        setEndereco((atual) => (atual.trim() ? atual : achado.logradouro));
      }
      if (achado.bairro) {
        setBairro((atual) => (atual.trim() ? atual : achado.bairro));
      }
      if (
        typeof achado.latitude === "number" &&
        typeof achado.longitude === "number"
      ) {
        setCoordenadas({
          latitude: achado.latitude,
          longitude: achado.longitude,
        });
      }
      setAvisoCep(
        achado.cidade && achado.uf
          ? `${achado.cidade}/${achado.uf} — endereço preenchido.`
          : "Endereço preenchido pelo CEP.",
      );
    } catch {
      setAvisoCep("Não foi possível consultar o CEP agora. Preencha à mão.");
    } finally {
      setBuscandoCep(false);
    }
  }

  return (
    <form action={acao} className="space-y-6">
      {negocio?.id ? (
        <input type="hidden" name="id" value={negocio.id} />
      ) : null}
      <input type="hidden" name="contatos" value={JSON.stringify(contatos)} />
      <input type="hidden" name="horarios" value={JSON.stringify(horarios)} />
      <input
        type="hidden"
        name="semPontoComercial"
        value={semPontoComercial ? "true" : "false"}
      />
      {coordenadas ? (
        <>
          <input type="hidden" name="latitude" value={coordenadas.latitude} />
          <input type="hidden" name="longitude" value={coordenadas.longitude} />
        </>
      ) : null}
      {selecionadas.map((id) => (
        <input key={id} type="hidden" name="categoriasIds" value={id} />
      ))}

      {estado.error ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-[12px] border border-critical/40 bg-critical-tint p-3 text-sm"
        >
          <AlertCircle
            className="mt-0.5 size-4 shrink-0 text-critical"
            aria-hidden="true"
          />
          <span>{estado.error}</span>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="nome">Nome *</Label>
          <Input
            id="nome"
            name="nome"
            defaultValue={negocio?.nome ?? ""}
            required
            className="mt-2 h-11"
            placeholder="Ex.: Padaria do Zé"
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="descricao">Descrição *</Label>
          <Textarea
            id="descricao"
            name="descricao"
            defaultValue={negocio?.descricao ?? ""}
            required
            rows={4}
            className="mt-2"
            placeholder="O que o comércio vende, faz ou atende."
          />
        </div>
      </div>

      <fieldset className="space-y-4 rounded-[14px] border border-line p-4">
        <legend className="px-1 text-[13px] font-semibold text-ink">
          Contato
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="whatsapp">WhatsApp *</Label>
            <Input
              id="whatsapp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="mt-2 h-11"
              placeholder="(54) 99999-0000"
              inputMode="tel"
            />
          </div>
          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="mt-2 h-11"
              placeholder="(54) 3456-7890"
              inputMode="tel"
            />
          </div>
          <div>
            <Label htmlFor="instagram">Instagram</Label>
            <Input
              id="instagram"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              className="mt-2 h-11"
              placeholder="@seucomercio"
            />
          </div>
          <div>
            <Label htmlFor="emailContato">E-mail</Label>
            <Input
              id="emailContato"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 h-11"
              placeholder="contato@comercio.com.br"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="site">Site</Label>
            <Input
              id="site"
              value={site}
              onChange={(e) => setSite(e.target.value)}
              className="mt-2 h-11"
              placeholder="www.comercio.com.br"
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4 rounded-[14px] border border-line p-4">
        <legend className="px-1 text-[13px] font-semibold text-ink">
          Endereço e atendimento
        </legend>

        <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
          <div>
            <Label htmlFor="cep">CEP</Label>
            <div className="mt-2 flex gap-2">
              <Input
                id="cep"
                value={cep}
                onChange={(e) => setCep(formatarCep(e.target.value))}
                onBlur={() => {
                  if (normalizarCep(cep).length === 8) void buscarCep();
                }}
                placeholder="95700-000"
                className="h-11"
                inputMode="numeric"
                autoComplete="postal-code"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => void buscarCep()}
                disabled={buscandoCep || normalizarCep(cep).length !== 8}
                className="shrink-0"
              >
                <Search className="size-4" aria-hidden="true" />
                {buscandoCep ? "Buscando…" : "Buscar"}
              </Button>
            </div>
            <p className="mt-1 text-xs text-ink-mute">
              {avisoCep || "Preenche rua e bairro automaticamente."}
            </p>
          </div>

          <div>
            <Label htmlFor="endereco">Endereço (rua)</Label>
            <Input
              id="endereco"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              className="mt-2 h-11"
              placeholder="Rua Marechal Deodoro"
              autoComplete="address-line1"
              disabled={semPontoComercial}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="numero">Número</Label>
            <Input
              id="numero"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              className="mt-2 h-11"
              placeholder="123"
              inputMode="numeric"
              disabled={semPontoComercial}
            />
          </div>
          <label className="flex items-start gap-2 self-end pb-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={semPontoComercial}
              onChange={(e) => setSemPontoComercial(e.target.checked)}
              className="mt-0.5 size-4 accent-[var(--brand)]"
            />
            <span>
              Sem ponto comercial (atende em casa, na rua ou só por delivery)
            </span>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="bairro">Bairro</Label>
            <Input
              id="bairro"
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              className="mt-2 h-11"
              placeholder="Centro"
            />
          </div>
          <div>
            <Label htmlFor="areaAtendimento">Área de atendimento</Label>
            <Input
              id="areaAtendimento"
              value={areaAtendimento}
              onChange={(e) => setAreaAtendimento(e.target.value)}
              className="mt-2 h-11"
              placeholder="Ex.: Bento Gonçalves e região"
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-[14px] border border-line p-4">
        <legend className="px-1 text-[13px] font-semibold text-ink">
          Categorias *
        </legend>
        <div className="mt-2 flex max-h-48 flex-wrap gap-2 overflow-y-auto rounded-[12px] border border-line bg-surface-2 p-3">
          {categorias.map((categoria) => {
            const marcada = selecionadas.includes(categoria.id);
            return (
              <label key={categoria.id} className="cursor-pointer">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={marcada}
                  onChange={(e) =>
                    setSelecionadas((atual) =>
                      e.target.checked
                        ? [...atual, categoria.id]
                        : atual.filter((id) => id !== categoria.id),
                    )
                  }
                />
                <span className="inline-flex h-8 items-center rounded-full border border-line bg-surface px-3 text-[13px] font-semibold text-ink-soft peer-checked:border-brand peer-checked:bg-brand peer-checked:text-on-brand">
                  {categoria.nome}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="space-y-4 rounded-[14px] border border-line p-4">
        <legend className="px-1 text-[13px] font-semibold text-ink">
          Horário
        </legend>

        <div>
          <p className="mb-2 text-[13px] font-semibold text-ink">Dias</p>
          <div className="flex flex-wrap gap-2">
            {DIAS.map((dia) => {
              const marcado = dias.includes(dia.valor);
              return (
                <label key={dia.valor} className="cursor-pointer">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={marcado}
                    onChange={(e) =>
                      setDias((atual) =>
                        e.target.checked
                          ? [...atual, dia.valor]
                          : atual.filter((d) => d !== dia.valor),
                      )
                    }
                  />
                  <span className="inline-flex h-9 min-w-11 items-center justify-center rounded-[8px] border border-line bg-surface px-2 text-sm font-semibold peer-checked:border-brand peer-checked:bg-brand peer-checked:text-on-brand">
                    {dia.rotulo}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-2" aria-label="Faixas prontas">
          {FAIXAS_PADRAO.map((faixa) => (
            <button
              key={faixa.rotulo}
              type="button"
              className="inline-flex h-9 items-center rounded-full border border-line bg-surface px-3 text-[13px] font-semibold text-ink-soft hover:border-brand hover:text-brand"
              onClick={() => {
                setAbre(faixa.inicio);
                setFecha(faixa.fim);
              }}
            >
              {faixa.rotulo}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Label htmlFor="abre">Abre</Label>
            <Input
              id="abre"
              type="time"
              value={abre}
              onChange={(e) => setAbre(e.target.value)}
              disabled={sobAgendamento}
              className="mt-1 h-10 tabular"
            />
          </div>
          <div>
            <Label htmlFor="fecha">Fecha</Label>
            <Input
              id="fecha"
              type="time"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              disabled={sobAgendamento}
              className="mt-1 h-10 tabular"
            />
          </div>
          <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={sobAgendamento}
              onChange={(e) => setSobAgendamento(e.target.checked)}
              className="size-4 accent-[var(--brand)]"
            />
            Somente sob agendamento
          </label>
        </div>

        {semPontoComercial ? null : (
          <div className="space-y-3 rounded-[12px] border border-line bg-surface-2 p-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-ink">
              <input
                type="checkbox"
                checked={intervaloAtivo}
                onChange={(e) => setIntervaloAtivo(e.target.checked)}
                className="size-4 accent-[var(--brand)]"
                disabled={sobAgendamento}
              />
              Tem intervalo (fecha para o almoço)
            </label>

            {intervaloAtivo ? (
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <Label htmlFor="intervaloInicio">
                    Fecha para o intervalo
                  </Label>
                  <Input
                    id="intervaloInicio"
                    type="time"
                    value={intervaloInicio}
                    onChange={(e) => setIntervaloInicio(e.target.value)}
                    disabled={sobAgendamento}
                    className="mt-1 h-10 tabular"
                  />
                </div>
                <div>
                  <Label htmlFor="intervaloFim">Volta do intervalo</Label>
                  <Input
                    id="intervaloFim"
                    type="time"
                    value={intervaloFim}
                    onChange={(e) => setIntervaloFim(e.target.value)}
                    disabled={sobAgendamento}
                    className="mt-1 h-10 tabular"
                  />
                </div>
              </div>
            ) : null}
          </div>
        )}

        {erroHorario ? (
          <p role="alert" className="text-sm text-critical">
            {erroHorario}
          </p>
        ) : null}
      </fieldset>

      <p className="text-xs text-ink-mute">
        As fotos da ficha ficam no bloco <strong>Fotos da ficha</strong>, no
        topo desta página.
      </p>

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={pendente || contatos.length === 0 || Boolean(erroHorario)}
        >
          {pendente ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Salvando…
            </>
          ) : negocio?.id ? (
            "Salvar alterações"
          ) : (
            <>
              <Plus className="size-4" aria-hidden="true" />
              Criar comércio
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/negocios")}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
