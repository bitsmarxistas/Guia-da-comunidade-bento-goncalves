import { MapPin, ExternalLink, Navigation } from "lucide-react";
import { comporEndereco } from "@/domain/utils/endereco";

/**
 * Mapa da ficha (§5.4).
 *
 * Com coordenadas gravadas, embute o mapa do OpenStreetMap (sem chave de API e
 * sem cookies de rastreio). Sem coordenadas, mostra o endereço em texto e dois
 * links de navegação — melhor do que um mapa em branco ou um pin no lugar
 * errado.
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
  const consulta = encodeURIComponent(textoCompleto);
  const temCoordenadas =
    typeof latitude === "number" && typeof longitude === "number";

  const delta = 0.004;
  const bbox = temCoordenadas
    ? [
        (longitude as number) - delta,
        (latitude as number) - delta,
        (longitude as number) + delta,
        (latitude as number) + delta,
      ].join("%2C")
    : null;

  return (
    <div className="mt-3 overflow-hidden rounded-[22px] border border-line bg-surface">
      {temCoordenadas && bbox ? (
        <iframe
          title={`Mapa com a localização de ${nome}`}
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude}%2C${longitude}`}
          loading="lazy"
          className="h-[280px] w-full border-0"
        />
      ) : (
        <div className="flex h-[160px] flex-col items-center justify-center gap-2 bg-surface-2 text-center">
          <MapPin className="size-6 text-ink-mute" aria-hidden="true" />
          <p className="max-w-[34ch] px-4 text-sm text-ink-soft">
            {semPontoComercial
              ? "Atende sem ponto comercial fixo."
              : "Ainda não temos as coordenadas desta ficha para desenhar o mapa."}
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
            {textoCompleto}
            {semPontoComercial ? " (sem ponto comercial)" : ""}
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href={`https://www.openstreetmap.org/search?query=${consulta}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-[10px] border border-line-strong bg-surface px-3 text-sm font-semibold text-ink hover:border-brand hover:text-brand"
          >
            <Navigation className="size-4" aria-hidden="true" />
            Abrir no mapa
          </a>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${consulta}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-[10px] border border-line-strong bg-surface px-3 text-sm font-semibold text-ink hover:border-brand hover:text-brand"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            Rota
          </a>
        </div>
      </div>
    </div>
  );
}
