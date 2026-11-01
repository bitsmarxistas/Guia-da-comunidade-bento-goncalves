"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CalendarClock,
  Check,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Textarea } from "@/ui/components/textarea";
import { Checkbox } from "@/ui/components/checkbox";
import {
  ImageUpload,
  FileUpload,
  type MidiaEnviadaArquivo,
} from "@/ui/components/image-upload";
import { consultarCepAction } from "@/application/cep/consultar-cep";
import { formatarCep, normalizarCep } from "@/domain/utils/cep";

/**
 * Wizard de participação (§5.5) em 4 etapas.
 *
 * Regras que vieram do guia e valem como teste mental antes de mexer:
 *  - e-mail é OBRIGATÓRIO e a copy diz que a resposta chega nele;
 *  - horário tem dias clicáveis, faixas prontas, digitação, intervalo validado
 *    e "somente sob agendamento";
 *  - o envio abre pop-up com protocolo (nunca redireciona para tela de sucesso);
 *  - nada promete retorno por WhatsApp.
 */

const ETAPAS = [
  { numero: 1, titulo: "Sobre" },
  { numero: 2, titulo: "Contato" },
  { numero: 3, titulo: "Fotos e horário" },
  { numero: 4, titulo: "Revisão" },
];

const DIAS = [
  { valor: 0, curto: "Dom", nome: "Domingo" },
  { valor: 1, curto: "Seg", nome: "Segunda" },
  { valor: 2, curto: "Ter", nome: "Terça" },
  { valor: 3, curto: "Qua", nome: "Quarta" },
  { valor: 4, curto: "Qui", nome: "Quinta" },
  { valor: 5, curto: "Sex", nome: "Sexta" },
  { valor: 6, curto: "Sáb", nome: "Sábado" },
];

const FAIXAS_PADRAO = [
  { rotulo: "08h–12h", inicio: "08:00", fim: "12:00" },
  { rotulo: "09h–18h", inicio: "09:00", fim: "18:00" },
  { rotulo: "13h–19h", inicio: "13:00", fim: "19:00" },
  { rotulo: "18h–22h", inicio: "18:00", fim: "22:00" },
];

type HorarioDraft = {
  dias: number[];
  inicio: string;
  fim: string;
  intervaloAtivo: boolean;
  intervaloInicio: string;
  intervaloFim: string;
  sobAgendamento: boolean;
};

function paraMinutos(hora: string): number {
  const [h, m] = hora.split(":");
  return Number(h) * 60 + Number(m ?? 0);
}

function resumoDias(dias: number[]): string {
  if (dias.length === 0) return "";
  const ordenados = [...dias].sort((a, b) => a - b);
  if (ordenados.length === 7) return "Todos os dias";
  const segASex = [1, 2, 3, 4, 5];
  if (segASex.every((d) => ordenados.includes(d)) && ordenados.length === 5) {
    return "Seg a sex";
  }
  return ordenados.map((d) => DIAS[d]?.curto ?? "").join(", ");
}

function resumoHorario(horario: HorarioDraft): string {
  const dias = resumoDias(horario.dias);
  if (!dias) return "Horário não informado";
  if (horario.sobAgendamento) return `${dias} · somente sob agendamento`;
  const faixa1 = `${horario.inicio}–${horario.intervaloAtivo ? horario.intervaloInicio : horario.fim}`;
  if (!horario.intervaloAtivo) return `${dias} · ${faixa1}`;
  return `${dias} · ${faixa1} e ${horario.intervaloFim}–${horario.fim}`;
}

function validarHorario(horario: HorarioDraft): string | null {
  if (horario.sobAgendamento || horario.dias.length === 0) return null;
  const inicio = paraMinutos(horario.inicio);
  const fim = paraMinutos(horario.fim);
  if (inicio >= fim) {
    return "O horário de abertura precisa ser antes do fechamento.";
  }
  if (!horario.intervaloAtivo) return null;

  const ii = paraMinutos(horario.intervaloInicio);
  const fi = paraMinutos(horario.intervaloFim);
  if (!horario.intervaloInicio || !horario.intervaloFim) {
    return "Preencha o início e o fim do intervalo.";
  }
  if (ii >= fi) return "O intervalo precisa terminar depois de começar.";
  if (!(inicio < ii && fi < fim)) {
    return "O intervalo precisa ficar dentro do horário de funcionamento.";
  }
  return null;
}

export function SolicitarWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const negocioOrigem = searchParams.get("negocio");

  const [etapa, setEtapa] = useState(1);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState<{
    protocolo: string;
    nome: string;
    email: string;
  } | null>(null);

  const [nomeNegocio, setNomeNegocio] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoriasIds, setCategoriasIds] = useState<string[]>([]);
  const [sugestaoCategoria, setSugestaoCategoria] = useState("");
  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState<
    Array<{ id: string; nome: string; slug: string }>
  >([]);

  const [nomeSolicitante, setNomeSolicitante] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [bairro, setBairro] = useState("");
  const [cep, setCep] = useState("");
  const [numero, setNumero] = useState("");
  const [semPontoComercial, setSemPontoComercial] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [avisoCep, setAvisoCep] = useState("");
  const [coordenadas, setCoordenadas] = useState<{
    latitude: number | null;
    longitude: number | null;
  }>({ latitude: null, longitude: null });
  const [endereco, setEndereco] = useState("");
  const [areaAtendimento, setAreaAtendimento] = useState("");
  const [instagram, setInstagram] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const [horario, setHorario] = useState<HorarioDraft>({
    dias: [1, 2, 3, 4, 5],
    inicio: "08:00",
    fim: "18:00",
    intervaloAtivo: false,
    intervaloInicio: "12:00",
    intervaloFim: "13:00",
    sobAgendamento: false,
  });

  const [imagens, setImagens] = useState<MidiaEnviadaArquivo[]>([]);
  const [anexos, setAnexos] = useState<MidiaEnviadaArquivo[]>([]);
  // Enquanto o PUT no bucket não termina, a foto ainda não tem URL: avançar
  // ou enviar agora gravaria a solicitação sem ela.
  const [enviandoFotos, setEnviandoFotos] = useState(false);
  const [enviandoAnexos, setEnviandoAnexos] = useState(false);
  const midiaEmEnvio = enviandoFotos || enviandoAnexos;

  const [termos, setTermos] = useState<
    Array<{ tipo: string; versao: string; conteudo: string }>
  >([]);
  const [aceiteTermos, setAceiteTermos] = useState(false);
  const [duplicata, setDuplicata] = useState<
    Array<{ nome?: string; slug?: string }>
  >([]);
  const [verificandoDuplicata, setVerificandoDuplicata] = useState(false);

  const focoSucesso = useRef<HTMLButtonElement>(null);
  // Caixa do diálogo de sucesso: usada para prender o Tab dentro dele.
  const caixaSucesso = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/categorias")
      .then((res) => (res.ok ? res.json() : { categorias: [] }))
      .then((data) => setCategoriasDisponiveis(data.categorias ?? []))
      .catch(() => setCategoriasDisponiveis([]));

    fetch("/api/termos")
      .then((res) => (res.ok ? res.json() : { termos: [] }))
      .then((data) => setTermos(data.termos ?? []))
      .catch(() => setTermos([]));
  }, []);

  useEffect(() => {
    if (sucesso) focoSucesso.current?.focus();
  }, [sucesso]);

  const erroHorario = validarHorario(horario);

  const irPara = (destino: number) => {
    setErro("");
    setEtapa(destino);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const avancar = async () => {
    setErro("");

    if (etapa === 1) {
      if (!nomeNegocio.trim()) return setErro("Informe o nome do comércio.");
      if (descricao.trim().length < 40) {
        return setErro("A descrição precisa ter pelo menos 40 caracteres.");
      }
      if (categoriasIds.length === 0 && !sugestaoCategoria.trim()) {
        return setErro("Selecione uma categoria ou sugira uma nova.");
      }
      if (!duplicata.length && !verificandoDuplicata) {
        setVerificandoDuplicata(true);
        try {
          const res = await fetch("/api/duplicata", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome: nomeNegocio, contatos: [] }),
          });
          if (res.ok) {
            const data = await res.json();
            setDuplicata(data.duplicatas ?? []);
          }
        } catch {
          // verificação de duplicata é aviso, não bloqueio
        } finally {
          setVerificandoDuplicata(false);
        }
      }
    }

    if (etapa === 2) {
      if (!nomeSolicitante.trim()) return setErro("Informe seu nome.");
      if (!email.trim()) {
        return setErro(
          "O e-mail é obrigatório: é por ele que a análise chega.",
        );
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
        return setErro("Informe um e-mail válido.");
      }
      if (!bairro.trim()) return setErro("Informe o bairro.");
      if (!whatsapp.trim()) return setErro("Informe o WhatsApp do comércio.");
      if (whatsapp.replace(/\D/g, "").length < 10) {
        return setErro(
          "O WhatsApp precisa ter DDD + número (10 ou 11 dígitos). Ex.: (54) 99999-0000.",
        );
      }
      if (telefone.trim() && telefone.replace(/\D/g, "").length < 10) {
        return setErro(
          "O telefone precisa ter DDD + número. Deixe em branco se não quiser informar.",
        );
      }
      // Endereço: número é obrigatório, a menos que o comércio não tenha ponto fixo.
      if (!semPontoComercial) {
        if (!endereco.trim()) {
          return setErro(
            'Informe o endereço (rua) ou marque "sem ponto comercial".',
          );
        }
        if (!numero.trim()) {
          return setErro(
            'Informe o número do endereço ou marque "sem ponto comercial".',
          );
        }
      }
    }

    if (etapa === 3 && erroHorario) return setErro(erroHorario);
    if (etapa === 3 && midiaEmEnvio) {
      return setErro("Aguarde o envio das fotos terminar para continuar.");
    }

    irPara(Math.min(4, etapa + 1));
  };

  /**
   * Preenche rua/bairro pelo CEP. Nunca sobrescreve o que a pessoa já digitou
   * sem avisar: se o campo estiver vazio preenche; se estiver diferente, avisa.
   */
  const buscarCep = useCallback(async () => {
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

      if (achado.logradouro) {
        setEndereco((atual) => (atual.trim() ? atual : achado.logradouro));
      }
      if (achado.bairro) {
        setBairro((atual) => (atual.trim() ? atual : achado.bairro));
      }
      setCoordenadas({
        latitude: achado.latitude,
        longitude: achado.longitude,
      });
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
  }, [cep]);

  const montarHorarios = useCallback(() => {
    if (horario.dias.length === 0) return [];
    if (horario.sobAgendamento) {
      return horario.dias.map((dia) => ({
        diaSemana: dia,
        horaAbertura: "00:00",
        horaFechamento: "00:00",
        observacao: "somente sob agendamento",
      }));
    }
    return horario.dias.flatMap((dia) => {
      const faixas = horario.intervaloAtivo
        ? [
            {
              diaSemana: dia,
              horaAbertura: horario.inicio,
              horaFechamento: horario.intervaloInicio,
              observacao: "",
            },
            {
              diaSemana: dia,
              horaAbertura: horario.intervaloFim,
              horaFechamento: horario.fim,
              observacao: "",
            },
          ]
        : [
            {
              diaSemana: dia,
              horaAbertura: horario.inicio,
              horaFechamento: horario.fim,
              observacao: "",
            },
          ];
      return faixas;
    });
  }, [horario]);

  const enviar = async () => {
    setErro("");

    if (!aceiteTermos) {
      return setErro("É preciso aceitar os termos para enviar.");
    }

    if (midiaEmEnvio) {
      return setErro(
        "Ainda estamos enviando suas fotos. Espere o envio terminar para enviar o cadastro.",
      );
    }

    setEnviando(true);

    const contatos = [
      { tipo: "whatsapp", valor: whatsapp.trim(), ordem: 0 },
      ...(telefone.trim()
        ? [{ tipo: "telefone", valor: telefone.trim(), ordem: 1 }]
        : []),
      ...(instagram.trim()
        ? [
            {
              tipo: "instagram",
              valor: instagram.trim().replace(/^@/, ""),
              ordem: 2,
            },
          ]
        : []),
    ].filter((contato) => contato.valor);

    const formData = new FormData();
    formData.append("nomeSolicitante", nomeSolicitante.trim());
    formData.append("email", email.trim());
    formData.append("telefone", telefone.trim());
    formData.append("nomeNegocio", nomeNegocio.trim());
    formData.append("descricao", descricao.trim());
    formData.append("contatos", JSON.stringify(contatos));
    categoriasIds.forEach((id) => formData.append("categoriasIds", id));
    if (sugestaoCategoria.trim()) {
      formData.append("sugestaoCategoria", sugestaoCategoria.trim());
    }
    formData.append(
      "localizacao",
      JSON.stringify({
        endereco,
        bairro,
        areaAtendimento,
        cep,
        numero: semPontoComercial ? "" : numero,
        semPontoComercial,
        latitude: coordenadas.latitude,
        longitude: coordenadas.longitude,
      }),
    );
    const horarios = montarHorarios();
    if (horarios.length > 0) {
      formData.append("horarios", JSON.stringify(horarios));
    }
    formData.append("declaracaoVinculo", "Declaro ter vínculo com o negócio");
    formData.append("aceiteTermos", "true");
    if (imagens.length > 0) formData.append("imagens", JSON.stringify(imagens));
    if (anexos.length > 0) formData.append("anexos", JSON.stringify(anexos));

    try {
      const resposta = await fetch("/api/solicitacoes", {
        method: "POST",
        body: formData,
      });
      const dados = await resposta.json();

      if (!resposta.ok || dados.error) {
        setErro(dados.error ?? "Não foi possível enviar. Tente novamente.");
        return;
      }

      if (dados.duplicataDetectada) {
        setDuplicata(dados.duplicataDetectada);
        setErro(
          "Encontramos um cadastro parecido. Revise o nome e o WhatsApp antes de enviar de novo.",
        );
        irPara(1);
        return;
      }

      setSucesso({
        protocolo: dados.solicitacao?.protocolo ?? "",
        nome: nomeSolicitante.trim(),
        email: email.trim(),
      });
    } catch {
      setErro("Falha de conexão. Seus dados continuam aqui; tente novamente.");
    } finally {
      setEnviando(false);
    }
  };

  const fecharSucesso = () => {
    setSucesso(null);
    router.push("/");
  };

  const resumo = useMemo(
    () => ({
      horario: resumoHorario(horario),
      categorias: categoriasDisponiveis
        .filter((categoria) => categoriasIds.includes(categoria.id))
        .map((categoria) => categoria.nome)
        .concat(
          sugestaoCategoria.trim()
            ? [`${sugestaoCategoria.trim()} (sugerida)`]
            : [],
        ),
    }),
    [horario, categoriasDisponiveis, categoriasIds, sugestaoCategoria],
  );

  return (
    <div className="bg-canvas">
      <div className="container-page max-w-3xl py-10 md:py-14">
        <header>
          <p className="eyebrow">Participar do guia</p>
          <h1 className="h1-editorial mt-3">Coloque seu comércio no guia</h1>
          <p className="mt-3 text-ink-soft">
            A gente confere e publica. Análise em até 24 h, com resposta por
            e-mail.
          </p>
          {negocioOrigem ? (
            <p className="mt-2 text-sm text-ink-mute">
              Você está pedindo correção de um cadastro existente.
            </p>
          ) : null}
        </header>

        {/* Stepper */}
        <ol className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2">
          {ETAPAS.map((item, indice) => {
            const ativo = etapa === item.numero;
            const concluido = etapa > item.numero;
            return (
              <li key={item.numero} className="flex items-center gap-2">
                <span
                  aria-current={ativo ? "step" : undefined}
                  className={[
                    "inline-flex size-8 items-center justify-center rounded-full text-sm font-semibold",
                    ativo || concluido
                      ? "bg-brand text-on-brand"
                      : "border border-line-strong bg-surface text-ink-mute",
                  ].join(" ")}
                >
                  {concluido ? (
                    <Check className="size-4" aria-hidden="true" />
                  ) : (
                    item.numero
                  )}
                </span>
                <span
                  className={[
                    "text-sm font-semibold",
                    ativo ? "text-ink" : "text-ink-mute",
                  ].join(" ")}
                >
                  {item.titulo}
                </span>
                {indice < ETAPAS.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="mx-1 h-px w-6 bg-line-strong"
                  />
                ) : null}
              </li>
            );
          })}
        </ol>

        {erro ? (
          <div
            role="alert"
            aria-live="assertive"
            className="mt-6 flex items-start gap-2 rounded-[14px] border border-critical/40 bg-critical-tint p-4 text-sm text-ink"
          >
            <AlertCircle
              className="mt-0.5 size-4 shrink-0 text-critical"
              aria-hidden="true"
            />
            <span>{erro}</span>
          </div>
        ) : null}

        <form
          className="mt-8 space-y-6"
          onSubmit={(evento) => {
            evento.preventDefault();
            if (etapa < 4) void avancar();
            else void enviar();
          }}
        >
          {/* Etapa 1 */}
          {etapa === 1 ? (
            <section className="space-y-5 rounded-[22px] border border-line bg-surface p-5 md:p-6">
              <div>
                <Label htmlFor="nomeNegocio">Nome do comércio *</Label>
                <Input
                  id="nomeNegocio"
                  value={nomeNegocio}
                  onChange={(e) => setNomeNegocio(e.target.value)}
                  placeholder="Ex.: Padaria do Zé"
                  className="mt-2 h-11"
                  required
                />
              </div>

              {duplicata.length > 0 ? (
                <div className="rounded-[14px] border border-warning/40 bg-warning-tint p-4 text-sm">
                  <p className="font-semibold text-ink">
                    Já existe algo parecido no guia
                  </p>
                  <ul className="mt-2 list-inside list-disc text-ink-soft">
                    {duplicata.slice(0, 3).map((item, indice) => (
                      <li key={indice}>
                        {item.slug ? (
                          <Link
                            href={`/negocio/${item.slug}`}
                            className="underline underline-offset-2"
                          >
                            {item.nome ?? item.slug}
                          </Link>
                        ) : (
                          (item.nome ?? "Cadastro semelhante")
                        )}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-ink-soft">
                    Se for o mesmo comércio, use{" "}
                    <Link
                      href="/catalogo"
                      className="underline underline-offset-2"
                    >
                      a ficha existente
                    </Link>{" "}
                    para pedir correção.
                  </p>
                </div>
              ) : null}

              <div>
                <Label htmlFor="descricao">Descrição *</Label>
                <Textarea
                  id="descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="O que você vende, faz ou atende. Conte em poucas linhas."
                  className="mt-2 min-h-28"
                  aria-describedby="descricao-dica"
                  required
                />
                <p id="descricao-dica" className="mt-1 text-xs text-ink-mute">
                  Mínimo de 40 caracteres ({descricao.trim().length} agora).
                </p>
              </div>

              <fieldset>
                <legend className="mb-2 text-[13px] font-semibold text-ink">
                  Categoria *
                </legend>
                <div className="flex flex-wrap gap-2">
                  {categoriasDisponiveis.map((categoria) => (
                    <label key={categoria.id} className="cursor-pointer">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={categoriasIds.includes(categoria.id)}
                        onChange={(e) =>
                          setCategoriasIds((atual) =>
                            e.target.checked
                              ? [...atual, categoria.id]
                              : atual.filter((id) => id !== categoria.id),
                          )
                        }
                      />
                      <span className="inline-flex h-11 items-center rounded-full border border-line bg-surface px-3 text-[13px] font-semibold text-ink-soft transition-colors peer-checked:border-brand peer-checked:bg-brand peer-checked:text-on-brand peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus)]">
                        {categoria.nome}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="mt-3">
                  <Label htmlFor="sugestaoCategoria">
                    Não achou? Sugira uma categoria
                  </Label>
                  <Input
                    id="sugestaoCategoria"
                    value={sugestaoCategoria}
                    onChange={(e) => setSugestaoCategoria(e.target.value)}
                    placeholder="Ex.: Cafeteria artesanal"
                    className="mt-2 h-11"
                  />
                </div>
              </fieldset>
            </section>
          ) : null}

          {/* Etapa 2 */}
          {etapa === 2 ? (
            <section className="space-y-5 rounded-[22px] border border-line bg-surface p-5 md:p-6">
              <div>
                <Label htmlFor="nomeSolicitante">Seu nome *</Label>
                <Input
                  id="nomeSolicitante"
                  value={nomeSolicitante}
                  onChange={(e) => setNomeSolicitante(e.target.value)}
                  className="mt-2 h-11"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@exemplo.com"
                  className="mt-2 h-11"
                  aria-describedby="email-dica"
                  required
                />
                <p id="email-dica" className="mt-1 text-xs text-ink-mute">
                  A resposta da análise chega neste e-mail.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="whatsapp">WhatsApp do comércio *</Label>
                  <Input
                    id="whatsapp"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="(54) 99999-0000"
                    className="mt-2 h-11"
                    inputMode="tel"
                    aria-describedby="whatsapp-dica"
                    required
                  />
                  <p id="whatsapp-dica" className="mt-1 text-xs text-ink-mute">
                    É o contato do comércio, com DDD. A equipe não responde por
                    aqui.
                  </p>
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(54) 3456-7890"
                    className="mt-2 h-11"
                    inputMode="tel"
                  />
                </div>
              </div>

              {/* CEP primeiro: preenche rua e bairro e evita endereço torto */}
              <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
                <div>
                  <Label htmlFor="cep">CEP</Label>
                  <div className="mt-2 flex gap-2">
                    <Input
                      id="cep"
                      value={cep}
                      onChange={(e) => setCep(formatarCep(e.target.value))}
                      onBlur={() => {
                        if (normalizarCep(cep).length === 8) buscarCep();
                      }}
                      placeholder="95700-000"
                      className="h-11"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      aria-describedby="cep-dica"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={buscarCep}
                      disabled={buscandoCep || normalizarCep(cep).length !== 8}
                      className="shrink-0"
                    >
                      {buscandoCep ? "Buscando…" : "Buscar"}
                    </Button>
                  </div>
                  <p id="cep-dica" className="mt-1 text-xs text-ink-mute">
                    {avisoCep ||
                      "Preenchemos rua e bairro automaticamente pelo CEP."}
                  </p>
                </div>
                <div>
                  <Label htmlFor="endereco">Endereço (rua)</Label>
                  <Input
                    id="endereco"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    placeholder="Rua Marechal Deodoro"
                    className="mt-2 h-11"
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
                    placeholder="123"
                    className="mt-2 h-11"
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
                    Sem ponto comercial (atende em casa, na rua ou só por
                    delivery)
                  </span>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="bairro">Bairro *</Label>
                  <Input
                    id="bairro"
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    placeholder="Centro"
                    className="mt-2 h-11"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@seucomercio"
                    className="mt-2 h-11"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="areaAtendimento">Área de atendimento</Label>
                <Input
                  id="areaAtendimento"
                  value={areaAtendimento}
                  onChange={(e) => setAreaAtendimento(e.target.value)}
                  placeholder="Ex.: Bento Gonçalves e região"
                  className="mt-2 h-11"
                />
              </div>
            </section>
          ) : null}

          {/* Etapa 3 */}
          {etapa === 3 ? (
            <section className="space-y-6">
              <div className="space-y-4 rounded-[22px] border border-line bg-surface p-5 md:p-6">
                <div>
                  <h2 className="font-[family-name:var(--font-fraunces)] text-lg font-semibold">
                    Fotos
                  </h2>
                  <p className="mt-1 text-sm text-ink-soft">
                    Até 4 fotos em JPG ou PNG, com no máximo 5 MB cada. As
                    imagens passam por moderação antes de aparecer.
                  </p>
                </div>
                <ImageUpload
                  tipo="foto"
                  maxFiles={4}
                  onUploadComplete={setImagens}
                  onStatusChange={setEnviandoFotos}
                />
              </div>

              <div className="space-y-4 rounded-[22px] border border-line bg-surface p-5 md:p-6">
                <div>
                  <h2 className="font-[family-name:var(--font-fraunces)] text-lg font-semibold">
                    Horário de funcionamento
                  </h2>
                  <p className="mt-1 text-sm text-ink-soft">
                    Marque os dias e ajuste as horas. Pode deixar em branco se
                    preferir não informar.
                  </p>
                </div>

                <fieldset>
                  <legend className="mb-2 text-[13px] font-semibold text-ink">
                    Dias
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {DIAS.map((dia) => {
                      const marcado = horario.dias.includes(dia.valor);
                      return (
                        <label key={dia.valor} className="cursor-pointer">
                          <input
                            type="checkbox"
                            className="peer sr-only"
                            checked={marcado}
                            aria-label={dia.nome}
                            onChange={(e) =>
                              setHorario((atual) => ({
                                ...atual,
                                dias: e.target.checked
                                  ? [...atual.dias, dia.valor]
                                  : atual.dias.filter((d) => d !== dia.valor),
                              }))
                            }
                          />
                          <span className="inline-flex h-10 min-w-11 items-center justify-center rounded-[10px] border border-line bg-surface px-2 text-sm font-semibold text-ink-soft transition-colors peer-checked:border-brand peer-checked:bg-brand peer-checked:text-on-brand peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus)]">
                            {dia.curto}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                {horario.sobAgendamento ? null : (
                  <>
                    <div
                      className="flex flex-wrap gap-2"
                      aria-label="Faixas prontas"
                    >
                      {FAIXAS_PADRAO.map((faixa) => (
                        <button
                          key={faixa.rotulo}
                          type="button"
                          onClick={() =>
                            setHorario((atual) => ({
                              ...atual,
                              inicio: faixa.inicio,
                              fim: faixa.fim,
                              intervaloAtivo: false,
                            }))
                          }
                          className="inline-flex h-11 items-center rounded-full border border-line bg-surface px-3 text-[13px] font-semibold text-ink-soft hover:border-brand hover:text-brand"
                        >
                          {faixa.rotulo}
                        </button>
                      ))}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="horaInicio">Das</Label>
                        <Input
                          id="horaInicio"
                          type="time"
                          value={horario.inicio}
                          onChange={(e) =>
                            setHorario((atual) => ({
                              ...atual,
                              inicio: e.target.value,
                            }))
                          }
                          className="mt-2 h-11 tabular"
                        />
                      </div>
                      <div>
                        <Label htmlFor="horaFim">Às</Label>
                        <Input
                          id="horaFim"
                          type="time"
                          value={horario.fim}
                          onChange={(e) =>
                            setHorario((atual) => ({
                              ...atual,
                              fim: e.target.value,
                            }))
                          }
                          className="mt-2 h-11 tabular"
                        />
                      </div>
                    </div>

                    {horario.intervaloAtivo ? (
                      <div className="rounded-[14px] border border-line bg-canvas p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-[13px] font-semibold text-ink">
                            Intervalo
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            onClick={() =>
                              setHorario((atual) => ({
                                ...atual,
                                intervaloAtivo: false,
                              }))
                            }
                          >
                            <Trash2 className="size-3.5" aria-hidden="true" />
                            Remover
                          </Button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <Label htmlFor="intervaloInicio">Início</Label>
                            <Input
                              id="intervaloInicio"
                              type="time"
                              value={horario.intervaloInicio}
                              onChange={(e) =>
                                setHorario((atual) => ({
                                  ...atual,
                                  intervaloInicio: e.target.value,
                                }))
                              }
                              className="mt-2 h-11 tabular"
                            />
                          </div>
                          <div>
                            <Label htmlFor="intervaloFim">Fim</Label>
                            <Input
                              id="intervaloFim"
                              type="time"
                              value={horario.intervaloFim}
                              onChange={(e) =>
                                setHorario((atual) => ({
                                  ...atual,
                                  intervaloFim: e.target.value,
                                }))
                              }
                              className="mt-2 h-11 tabular"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setHorario((atual) => ({
                            ...atual,
                            intervaloAtivo: true,
                          }))
                        }
                      >
                        <Plus className="size-4" aria-hidden="true" />
                        Adicionar intervalo
                      </Button>
                    )}
                  </>
                )}

                <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-ink">
                  <Checkbox
                    checked={horario.sobAgendamento}
                    onCheckedChange={(valor) =>
                      setHorario((atual) => ({
                        ...atual,
                        sobAgendamento: valor === true,
                      }))
                    }
                  />
                  Somente sob agendamento
                </label>

                {erroHorario ? (
                  <p role="alert" className="text-sm text-critical">
                    {erroHorario}
                  </p>
                ) : (
                  <p className="flex items-center gap-2 text-sm text-ink-soft">
                    <CalendarClock
                      className="size-4 text-ink-mute"
                      aria-hidden="true"
                    />
                    {resumoHorario(horario)}
                  </p>
                )}
              </div>

              <div className="space-y-4 rounded-[22px] border border-line bg-surface p-5 md:p-6">
                <div>
                  <h2 className="font-[family-name:var(--font-fraunces)] text-lg font-semibold">
                    Anexos
                  </h2>
                  <p className="mt-1 text-sm text-ink-soft">
                    Opcional. PDF, DOC ou DOCX até 10 MB.
                  </p>
                </div>
                <FileUpload
                  onUploadComplete={setAnexos}
                  onStatusChange={setEnviandoAnexos}
                />
              </div>
            </section>
          ) : null}

          {/* Etapa 4 */}
          {etapa === 4 ? (
            <section className="space-y-6">
              <div className="rounded-[22px] border border-line bg-surface p-5 md:p-6">
                <h2 className="font-[family-name:var(--font-fraunces)] text-lg font-semibold">
                  Revise antes de enviar
                </h2>
                <dl className="mt-4 divide-y divide-line">
                  <Linha rotulo="Comércio" valor={nomeNegocio} />
                  <Linha
                    rotulo="Categoria"
                    valor={resumo.categorias.join(", ")}
                  />
                  <Linha rotulo="Descrição" valor={descricao} />
                  <Linha rotulo="Seu nome" valor={nomeSolicitante} />
                  <Linha rotulo="E-mail" valor={email} />
                  <Linha rotulo="WhatsApp" valor={whatsapp} />
                  <Linha rotulo="Telefone" valor={telefone} />
                  <Linha rotulo="Bairro" valor={bairro} />
                  <Linha rotulo="Endereço" valor={endereco} />
                  <Linha rotulo="Instagram" valor={instagram} />
                  <Linha rotulo="Horário" valor={resumo.horario} />
                  <Linha
                    rotulo="Fotos"
                    valor={
                      imagens.length > 0 ? `${imagens.length} foto(s)` : ""
                    }
                  />
                </dl>
              </div>

              <div className="rounded-[22px] border border-line bg-surface p-5 md:p-6">
                <h2 className="font-[family-name:var(--font-fraunces)] text-lg font-semibold">
                  Termos
                </h2>
                <div className="mt-3 space-y-3">
                  {termos.map((termo, indice) => (
                    <details
                      key={indice}
                      className="rounded-[14px] border border-line bg-canvas p-3"
                    >
                      <summary className="cursor-pointer text-sm font-semibold text-ink">
                        {termo.tipo.replace(/_/g, " ")} v{termo.versao}
                      </summary>
                      <div className="mt-2 max-h-56 overflow-y-auto whitespace-pre-wrap text-sm text-ink-soft">
                        {termo.conteudo}
                      </div>
                    </details>
                  ))}
                </div>

                <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-ink">
                  <Checkbox
                    checked={aceiteTermos}
                    onCheckedChange={(valor) => setAceiteTermos(valor === true)}
                  />
                  <span>
                    Li e aceito os <strong>Termos de Uso</strong>, a{" "}
                    <strong>Política de Privacidade</strong> e o{" "}
                    <strong>Tratamento de Dados</strong>. Declaro que as
                    informações são verdadeiras.
                  </span>
                </label>
              </div>
            </section>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            {etapa > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => irPara(etapa - 1)}
                disabled={enviando}
              >
                Voltar
              </Button>
            ) : (
              <Link
                href="/catalogo"
                className="text-sm font-semibold text-ink-soft underline-offset-4 hover:underline"
              >
                Ver o catálogo
              </Link>
            )}

            {etapa < 4 ? (
              <Button type="submit" size="lg" disabled={verificandoDuplicata}>
                {verificandoDuplicata ? (
                  <>
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                    Verificando…
                  </>
                ) : (
                  "Continuar"
                )}
              </Button>
            ) : (
              <Button
                type="submit"
                size="lg"
                disabled={enviando || !aceiteTermos}
              >
                {enviando ? (
                  <>
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                    Enviando…
                  </>
                ) : (
                  "Enviar solicitação"
                )}
              </Button>
            )}
          </div>
        </form>
      </div>

      {sucesso ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4"
          role="presentation"
          onClick={(evento) => {
            if (evento.target === evento.currentTarget) fecharSucesso();
          }}
          onKeyDown={(evento) => {
            if (evento.key === "Escape") fecharSucesso();
            if (evento.key !== "Tab") return;

            /*
             * Prende o foco no diálogo (§4): sem isto o Tab saía do pop-up e
             * ia para os campos do formulário atrás do overlay, onde o
             * teclado navegava sem enxergar.
             */
            const caixa = caixaSucesso.current;
            if (!caixa) return;
            const focaveis = caixa.querySelectorAll<HTMLElement>(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
            );
            if (focaveis.length === 0) return;
            const primeiro = focaveis[0];
            const ultimo = focaveis[focaveis.length - 1];
            if (!primeiro || !ultimo) return;
            if (evento.shiftKey && document.activeElement === primeiro) {
              evento.preventDefault();
              ultimo.focus();
            } else if (!evento.shiftKey && document.activeElement === ultimo) {
              evento.preventDefault();
              primeiro.focus();
            }
          }}
        >
          <div
            ref={caixaSucesso}
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-sucesso"
            aria-describedby="texto-sucesso"
            className="w-full max-w-md rounded-[22px] border border-line bg-surface p-6 text-center"
          >
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand text-on-brand">
              <Check className="size-7" aria-hidden="true" />
            </span>
            <p className="eyebrow mt-4">Tudo certo</p>
            <h2
              id="titulo-sucesso"
              className="mt-1 font-[family-name:var(--font-fraunces)] text-2xl font-semibold"
            >
              Solicitação enviada
            </h2>
            <p id="texto-sucesso" className="mt-2 text-ink-soft">
              Recebemos {sucesso.nome}. A resposta chega em {sucesso.email} em
              até 24 h.
            </p>
            {sucesso.protocolo ? (
              <p className="mt-4 rounded-[14px] border border-line bg-canvas px-4 py-3 text-sm">
                <span className="block text-xs uppercase tracking-[0.1em] text-ink-mute">
                  Protocolo
                </span>
                <strong className="tabular text-base text-ink">
                  {sucesso.protocolo}
                </strong>
              </p>
            ) : null}
            <Button
              ref={focoSucesso}
              className="mt-6 w-full"
              onClick={fecharSucesso}
            >
              Ir para o início
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  if (!valor) return null;
  return (
    <div className="grid gap-1 py-2.5 sm:grid-cols-[160px_1fr] sm:gap-4">
      <dt className="text-[13px] font-semibold text-ink-mute">{rotulo}</dt>
      <dd className="text-sm text-ink">{valor}</dd>
    </div>
  );
}
