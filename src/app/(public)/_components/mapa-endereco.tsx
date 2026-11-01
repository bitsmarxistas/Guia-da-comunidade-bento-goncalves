import { MapPin, ExternalLink, Navigation } from "lucide-react";
import { comporEndereco } from "@/domain/utils/endereco";

/**
 * Mapa da ficha (§5.4) — Google Maps.
 *
 * Com coordenadas, o pino cai no ponto exato. Sem coordenadas mas com endereço,
 * a busca do Google resolve pelo texto (é o caso das fichas importadas, que
 * ainda não foram geocodificadas). Sem nenhum dos dois, entra o aviso — melhor
 * que um mapa em branco ou um pino no lugar errado.
 *
 * O embed `output=embed` do Google Maps funciona sem chave de API; a CSP em
 * next.config.ts libera `www.google.com` e `maps.google.com` em frame-src.
 */
export function MapaEndereco({
  nome,
  endereco,
  bairro,
  latitude,
  longitude,
  semPontoComercial,
}: {
  nome: string;
  endereco: string;
  bairro: string | null;
  latitude: number | null;
  longitude: number | null;
  semPontoComercial: boolean;
}) {
  const textoCompleto = comporEndereco({ endereco, bairro });
  const temCoordenadas =
    typeof latitude === "number" && typeof longitude === "number";

  // Pino exato quando há coordenadas; senão o Google procura pelo endereço.
  const alvo = temCoordenadas
    ? `${latitude},${longitude}`
    : textoCompleto.trim();

  const consulta = encodeURIComponent(alvo);
  const temMapa = alvo.length > 0;

  return (
    <div className="mt-3 overflow-hidden rounded-[22px] border border-line bg-surface">
      {temMapa ? (
        <iframe
          title={`Mapa do Google com a localização de ${nome}`}
          src={`https://www.google.com/maps?q=${consulta}&hl=pt-BR&z=16&output=embed`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          className="h-[280px] w-full border-0"
        />
      ) : (
        <div className="flex h-[160px] flex-col items-center justify-center gap-2 bg-surface-2 text-center">
          <MapPin className="size-6 text-ink-mute" aria-hidden="true" />
          <p className="max-w-[34ch] px-4 text-sm text-ink-soft">
            {semPontoComercial
              ? "Atende sem ponto comercial fixo."
              : "Esta ficha ainda não tem endereço para desenhar o mapa."}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line p-4">
        <p className="flex items-start gap-2 text-sm text-ink-soft">
          <MapPin
            className="mt-0.5 size-4 shrink-0 text-ink-mute"
            aria-hidden="true"
          />
          <span>
            {textoCompleto || "Endereço não informado"}
            {semPontoComercial ? " (sem ponto comercial)" : ""}
          </span>
        </p>
        {temMapa ? (
          <div className="flex flex-wrap gap-2">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${consulta}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-[10px] border border-line-strong bg-surface px-3 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
            >
              <Navigation className="size-4" aria-hidden="true" />
              Abrir no mapa
            </a>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${consulta}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-[10px] border border-line-strong bg-surface px-3 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
            >
              <ExternalLink className="size-4" aria-hidden="true" />
              Rota
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
}
