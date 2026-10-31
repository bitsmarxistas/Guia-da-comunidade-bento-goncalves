import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Building2,
  CalendarClock,
  Clock,
  ExternalLink,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { buscarNegocioPorSlug } from "@/application/negocios/listar";
import { Button } from "@/ui/components/button";
import { ShareButton } from "@/ui/components/share-button";
import { GlifoInstagram, GlifoWhatsApp } from "@/ui/components/brand/glifos";

export const revalidate = 60;

const DIAS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

const DIAS_CURTOS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

const SOB_AGENDAMENTO = "somente sob agendamento";

const urlSite = process.env.NEXT_PUBLIC_SITE_URL ?? "https://guiabg.com.br";

function horaCurta(valor: string): string {
  return valor.slice(0, 5);
}

/** "Agora" no fuso de São Paulo, independente do fuso do servidor. */
function agoraEmSaoPaulo() {
  const formato = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const partes = formato.formatToParts(new Date());
  const mapa: Record<string, string> = {};
  for (const parte of partes) mapa[parte.type] = parte.value;
  const mapaDia: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return {
    dia: mapaDia[mapa.weekday ?? "Sun"] ?? 0,
    minutos: Number(mapa.hour ?? "0") * 60 + Number(mapa.minute ?? "0"),
  };
}

function emMinutos(hora: string): number {
  const [h, m] = hora.split(":");
  return Number(h) * 60 + Number(m ?? 0);
}

function iniciais(nome: string): string {
  return nome
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
}

type NegocioComRelacoes = NonNullable<
  Awaited<ReturnType<typeof buscarNegocioPorSlug>>
>;

function contatosPorTipo(negocio: NegocioComRelacoes, tipo: string) {
  return negocio.contatos
    .filter((contato) => contato.tipo === tipo)
    .sort((a, b) => a.ordem - b.ordem);
}

function linkWhatsApp(valor: string, nome: string): string {
  const digitos = valor.replace(/\D/g, "");
  const mensagem = encodeURIComponent(
    `Olá! Encontrei ${nome} no GuiaBG e quero saber mais.`,
  );
  return `https://wa.me/55${digitos}?text=${mensagem}`;
}

function formatarTelefone(valor: string): string {
  const digitos = valor.replace(/\D/g, "");
  if (digitos.length === 11)
    return digitos.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (digitos.length === 10)
    return digitos.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return valor;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const negocio = await buscarNegocioPorSlug(slug);

  if (!negocio) {
    return { title: "Comércio não encontrado" };
  }

  const url = `${urlSite}/negocio/${slug}`;
  const descricao = negocio.descricao.slice(0, 160);

  return {
    title: negocio.nome,
    description: descricao,
    alternates: { canonical: `/negocio/${slug}` },
    openGraph: {
      title: negocio.nome,
      description: descricao,
      type: "website",
      url,
      siteName: "GuiaBG",
      locale: "pt_BR",
    },
    twitter: {
      card: "summary_large_image",
      title: negocio.nome,
      description: descricao,
    },
  };
}

export default async function NegocioPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const negocio = await buscarNegocioPorSlug(slug);

  if (!negocio) notFound();

  const url = `${urlSite}/negocio/${slug}`;
  const whatsapps = contatosPorTipo(negocio, "whatsapp");
  const telefones = contatosPorTipo(negocio, "telefone");
  const emails = contatosPorTipo(negocio, "email");
  const instagrams = contatosPorTipo(negocio, "instagram");
  const sites = contatosPorTipo(negocio, "site");

  const porDia = new Map<number, typeof negocio.horarios>();
  for (const horario of negocio.horarios) {
    const lista = porDia.get(horario.diaSemana) ?? [];
    lista.push(horario);
    porDia.set(horario.diaSemana, lista);
  }
  for (const lista of porDia.values()) {
    lista.sort((a, b) => a.horaAbertura.localeCompare(b.horaAbertura));
  }

  const sobAgendamento =
    negocio.horarios.length > 0 &&
    negocio.horarios.every((horario) =>
      (horario.observacao ?? "").toLowerCase().includes(SOB_AGENDAMENTO),
    );

  const { dia: diaAtual, minutos: minutosAgora } = agoraEmSaoPaulo();
  const faixasHoje = porDia.get(diaAtual) ?? [];
  const abertoAgora = sobAgendamento
    ? null
    : faixasHoje.some(
        (faixa) =>
          minutosAgora >= emMinutos(faixa.horaAbertura) &&
          minutosAgora < emMinutos(faixa.horaFechamento),
      );

  const categorias = negocio.categorias
    .map((vinculo) => vinculo.categoria)
    .filter(Boolean);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: negocio.nome,
    description: negocio.descricao,
    url,
    ...(telefones[0]
      ? { telephone: formatarTelefone(telefones[0].valor) }
      : {}),
    ...(emails[0] ? { email: emails[0].valor } : {}),
    ...(negocio.localizacao
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: negocio.localizacao.endereco ?? undefined,
            addressLocality: "Bento Gonçalves",
            addressRegion: "RS",
            addressCountry: "BR",
            ...(negocio.localizacao.bairro
              ? { addressNeighborhood: negocio.localizacao.bairro }
              : {}),
          },
        }
      : {}),
    ...(negocio.horarios.length > 0 && !sobAgendamento
      ? {
          openingHoursSpecification: negocio.horarios.map((horario) => ({
            "@type": "OpeningHoursSpecification",
            dayOfWeek: `https://schema.org/${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][horario.diaSemana]}`,
            opens: horaCurta(horario.horaAbertura),
            closes: horaCurta(horario.horaFechamento),
          })),
        }
      : {}),
    ...(instagrams[0]
      ? {
          sameAs: [
            `https://instagram.com/${instagrams[0].valor.replace(/^@/, "")}`,
          ],
        }
      : {}),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: urlSite },
      {
        "@type": "ListItem",
        position: 2,
        name: "Catálogo",
        item: `${urlSite}/catalogo`,
      },
      { "@type": "ListItem", position: 3, name: negocio.nome, item: url },
    ],
  };

  return (
    <div className="bg-canvas">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <div className="container-page py-8 md:py-10">
        {/* Breadcrumb */}
        <nav aria-label="Você está aqui" className="text-sm text-ink-mute">
          <Link href="/" className="hover:text-brand">
            Início
          </Link>
          <span aria-hidden="true" className="mx-2">
            /
          </span>
          <Link href="/catalogo" className="hover:text-brand">
            Catálogo
          </Link>
          <span aria-hidden="true" className="mx-2">
            /
          </span>
          <span className="text-ink">{negocio.nome}</span>
        </nav>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-start">
          <div>
            {/* Galeria: capa 3:2 + fallback desenhado */}
            <div className="relative aspect-[3/2] overflow-hidden rounded-[22px] border border-line bg-brand-tint">
              <div
                aria-hidden="true"
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-brand"
              >
                <Building2 className="size-12" />
                <span className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold">
                  {iniciais(negocio.nome)}
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-strong">
                  {categorias[0]?.nome ?? "Comércio local"}
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              {categorias.map((categoria) => (
                <Link
                  key={categoria.id}
                  href={`/catalogo?categoria=${categoria.slug}`}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-[13px] font-semibold text-ink-soft hover:border-brand hover:text-brand"
                >
                  <Tag className="size-3.5" aria-hidden="true" />
                  {categoria.nome}
                </Link>
              ))}
              <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-brand-tint px-3 text-[13px] font-semibold text-brand-strong">
                <ShieldCheck className="size-3.5" aria-hidden="true" />
                Do guia
              </span>
            </div>

            <h1 className="h1-editorial mt-4">{negocio.nome}</h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-soft">
              {negocio.localizacao?.bairro ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4" aria-hidden="true" />
                  {negocio.localizacao.bairro}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className={
                    abertoAgora === null
                      ? "size-2 rounded-full border border-ink-mute"
                      : abertoAgora
                        ? "size-2 rounded-full bg-positive"
                        : "size-2 rounded-full bg-ink-mute"
                  }
                />
                {sobAgendamento
                  ? "Somente sob agendamento"
                  : abertoAgora === null
                    ? "Horário não informado"
                    : abertoAgora
                      ? "Aberto agora"
                      : "Fechado agora"}
              </span>
            </div>

            <p className="leitura mt-6 text-lg leading-relaxed text-ink-soft">
              {negocio.descricao}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {whatsapps[0] ? (
                <Button asChild size="lg">
                  <a
                    href={linkWhatsApp(whatsapps[0].valor, negocio.nome)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <GlifoWhatsApp className="size-5" />
                    Falar no WhatsApp
                  </a>
                </Button>
              ) : null}
              <ShareButton
                url={url}
                title={negocio.nome}
                text={negocio.descricao}
              />
            </div>

            {/* Contatos — nada de campo vazio */}
            {telefones.length +
              emails.length +
              instagrams.length +
              sites.length >
            0 ? (
              <section className="mt-10" aria-labelledby="contatos">
                <h2
                  id="contatos"
                  className="font-[family-name:var(--font-fraunces)] text-xl font-semibold"
                >
                  Contatos
                </h2>
                <ul className="mt-3 divide-y divide-line border-y border-line">
                  {telefones.map((contato) => (
                    <li
                      key={contato.id}
                      className="flex items-center gap-3 py-3"
                    >
                      <Phone
                        className="size-4 text-ink-mute"
                        aria-hidden="true"
                      />
                      <a
                        href={`tel:${contato.valor.replace(/\D/g, "")}`}
                        className="text-sm font-medium text-ink hover:text-brand"
                      >
                        {formatarTelefone(contato.valor)}
                      </a>
                    </li>
                  ))}
                  {emails.map((contato) => (
                    <li
                      key={contato.id}
                      className="flex items-center gap-3 py-3"
                    >
                      <Mail
                        className="size-4 text-ink-mute"
                        aria-hidden="true"
                      />
                      <a
                        href={`mailto:${contato.valor}`}
                        className="text-sm font-medium text-ink hover:text-brand"
                      >
                        {contato.valor}
                      </a>
                    </li>
                  ))}
                  {instagrams.map((contato) => (
                    <li
                      key={contato.id}
                      className="flex items-center gap-3 py-3"
                    >
                      <GlifoInstagram className="size-4 text-ink-mute" />
                      <a
                        href={`https://instagram.com/${contato.valor.replace(/^@/, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-ink hover:text-brand"
                      >
                        @{contato.valor.replace(/^@/, "")}
                      </a>
                    </li>
                  ))}
                  {sites.map((contato) => (
                    <li
                      key={contato.id}
                      className="flex items-center gap-3 py-3"
                    >
                      <ExternalLink
                        className="size-4 text-ink-mute"
                        aria-hidden="true"
                      />
                      <a
                        href={
                          contato.valor.startsWith("http")
                            ? contato.valor
                            : `https://${contato.valor}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-ink hover:text-brand"
                      >
                        {contato.valor.replace(/^https?:\/\//, "")}
                      </a>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-ink-mute">
                  O WhatsApp é o contato do comércio. A equipe do guia não
                  responde por lá.
                </p>
              </section>
            ) : null}

            {/* Horários */}
            <section className="mt-10" aria-labelledby="horarios">
              <h2
                id="horarios"
                className="font-[family-name:var(--font-fraunces)] text-xl font-semibold"
              >
                Horários
              </h2>

              {negocio.horarios.length === 0 ? (
                <p className="mt-3 flex items-center gap-2 text-sm text-ink-soft">
                  <Clock className="size-4 text-ink-mute" aria-hidden="true" />
                  Horário não informado.
                </p>
              ) : sobAgendamento ? (
                <p className="mt-3 flex items-center gap-2 text-sm text-ink-soft">
                  <CalendarClock
                    className="size-4 text-ink-mute"
                    aria-hidden="true"
                  />
                  Atendimento somente sob agendamento.
                </p>
              ) : (
                <table className="mt-3 w-full border-collapse text-sm">
                  <caption className="sr-only">
                    Horário de funcionamento de {negocio.nome}
                  </caption>
                  <tbody>
                    {DIAS.map((dia, indice) => {
                      const faixas = porDia.get(indice) ?? [];
                      const ehHoje = indice === diaAtual;
                      return (
                        <tr
                          key={dia}
                          className={
                            ehHoje
                              ? "border-b border-line bg-brand-tint/60"
                              : "border-b border-line"
                          }
                        >
                          <th
                            scope="row"
                            className="py-2.5 pr-4 text-left font-medium text-ink"
                          >
                            <span className="sm:hidden">
                              {DIAS_CURTOS[indice]}
                            </span>
                            <span className="hidden sm:inline">{dia}</span>
                            {ehHoje ? (
                              <span className="ml-2 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-on-brand">
                                hoje
                              </span>
                            ) : null}
                          </th>
                          <td className="py-2.5 text-right text-ink-soft tabular">
                            {faixas.length === 0 ? (
                              <span className="text-ink-mute">Fechado</span>
                            ) : (
                              faixas
                                .map(
                                  (faixa) =>
                                    `${horaCurta(faixa.horaAbertura)}–${horaCurta(faixa.horaFechamento)}`,
                                )
                                .join(" e ")
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </section>

            {/* Localização */}
            {negocio.localizacao?.endereco ? (
              <section className="mt-10" aria-labelledby="localizacao">
                <h2
                  id="localizacao"
                  className="font-[family-name:var(--font-fraunces)] text-xl font-semibold"
                >
                  Onde fica
                </h2>
                <p className="mt-3 flex items-start gap-2 text-sm text-ink-soft">
                  <MapPin
                    className="mt-0.5 size-4 shrink-0 text-ink-mute"
                    aria-hidden="true"
                  />
                  <span>
                    {negocio.localizacao.endereco}
                    {negocio.localizacao.bairro
                      ? `, ${negocio.localizacao.bairro}`
                      : ""}
                  </span>
                </p>
              </section>
            ) : null}
          </div>

          {/* Coluna lateral */}
          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="rounded-[22px] border border-line bg-surface p-5">
              <h2 className="font-[family-name:var(--font-fraunces)] text-lg font-semibold">
                Informações
              </h2>
              <dl className="mt-3 space-y-3 text-sm">
                {categorias.length > 0 ? (
                  <div>
                    <dt className="text-ink-mute">Categoria</dt>
                    <dd className="text-ink">
                      {categorias.map((categoria) => categoria.nome).join(", ")}
                    </dd>
                  </div>
                ) : null}
                {negocio.localizacao?.bairro ? (
                  <div>
                    <dt className="text-ink-mute">Bairro</dt>
                    <dd className="text-ink">{negocio.localizacao.bairro}</dd>
                  </div>
                ) : null}
                {negocio.localizacao?.areaAtendimento ? (
                  <div>
                    <dt className="text-ink-mute">Área de atendimento</dt>
                    <dd className="text-ink">
                      {negocio.localizacao.areaAtendimento}
                    </dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-ink-mute">Situação</dt>
                  <dd className="text-ink">
                    {sobAgendamento
                      ? "Somente sob agendamento"
                      : abertoAgora === null
                        ? "Horário não informado"
                        : abertoAgora
                          ? "Aberto agora"
                          : "Fechado agora"}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 border-t border-line pt-4">
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/solicitar?negocio=${negocio.id}`}>
                    <Pencil className="size-4" aria-hidden="true" />
                    Pedir correção
                  </Link>
                </Button>
                <p className="mt-2 text-xs text-ink-mute">
                  A resposta da análise chega por e-mail, em até 24 h.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
