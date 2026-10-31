# 07 — Interface (design system e telas)

Documento de implementação da UI aprovada (guia do frontend). Explica **onde**
cada decisão vive no código, para quem for replicar em outra cidade ou mexer
depois sem quebrar as regras.

## Tokens

Fonte única: `src/app/globals.css`. Nenhum hex solto em componente.

| Grupo       | Tokens                                                              |
| ----------- | ------------------------------------------------------------------- |
| Marca       | `--brand` (#C41E3A), `--brand-strong`, `--brand-tint`, `--on-brand` |
| Superfícies | `--canvas`, `--surface`, `--surface-2`                              |
| Texto       | `--ink`, `--ink-soft`, `--ink-mute`                                 |
| Linhas      | `--line`, `--line-strong`                                           |
| Funcionais  | `--positive`, `--warning`, `--critical`, `--sun` (+ tints)          |
| Foco        | `--focus`                                                           |

Dois detalhes que já quebraram antes e não podem regredir:

1. **Tema por `data-theme`.** O `ThemeProvider` usa `attribute="data-theme"`, então
   o CSS precisa ter `[data-theme="dark"]` (e o `@custom-variant dark` aponta para
   o mesmo seletor). Com `.dark` no CSS e `data-theme` no provider, o modo escuro
   simplesmente não existe.
2. **Fonte.** `Fraunces` (display) e `Source Sans 3` (texto) via `next/font`,
   expostas como `--font-fraunces` e `--font-source-sans`. `--font-sans` aponta
   para a Source Sans — nunca para a própria variável (autorreferência quebra).

Classes utilitárias do sistema: `.container-page` (1200px, gutter 24/20px),
`.display`, `.h1-editorial`, `.eyebrow`, `.leitura` (68ch), `.carrossel-trilho`
e `.hero-dots` (a **única** textura aprovada: pontilhado esmaecido do herói).

## Shell público

`src/app/(public)/layout.tsx` é o único lugar com header e rodapé:

- `header-nav.tsx` (client): sticky 72px/64px, navegação, busca, tema, Entrar/Painel
  e Participar; menu mobile com `aria-expanded`, fecha com Esc (devolvendo foco ao
  gatilho) e ao clicar em qualquer link.
- `site-footer.tsx`: rodapé escuro com marca, guia, administração e legal.
- Link "Pular para o conteúdo" no topo.

Nenhuma página pública monta header/footer por conta própria (a página do comércio
tinha um header duplicado; foi removido).

## Componentes

| Arquivo                                    | Papel                                                                            |
| ------------------------------------------ | -------------------------------------------------------------------------------- |
| `ui/components/button.tsx`                 | variantes do guia; alvo mínimo 44px nos tamanhos públicos                        |
| `ui/components/brand/simbolo.tsx`          | pino com fachada sob toldo (vetor) + wordmark                                    |
| `ui/components/brand/glifos.tsx`           | WhatsApp e Instagram fora do lucide (marcas de terceiros)                        |
| `ui/components/theme-toggle.tsx`           | alterna tema por `data-theme`, sem `setState` em efeito                          |
| `(public)/_components/negocio-card.tsx`    | card 2:1 com fallback desenhado, status texto+ponto, WhatsApp como ação separada |
| `(public)/_components/carrossel.tsx`       | scroll nativo, arraste, setas com estado e trilho de progresso                   |
| `(public)/_components/filtros-painel.tsx`  | filtros em coluna no desktop e painel no mobile, uma única árvore de DOM         |
| `(public)/_components/documento-legal.tsx` | termos/privacidade lidos de `documento_termo` (vigente)                          |

## Telas

- **Home**: herói com pontilhado e busca, categorias, "Achados" (carrossel),
  "Gente daqui", faixa vermelha de participação e lista de mais comércios.
- **Catálogo/busca**: 9 por página, filtros por categoria/bairro/ordem, chips
  removíveis, contagem, paginação e estado vazio com ação. `/busca` é `noindex`.
- **Comércio**: galeria 3:2 (fallback desenhado), chips de categoria, selo "Do
  guia", contatos sem campo vazio, horários por dia com "hoje" destacado e
  "Fechado", JSON-LD `LocalBusiness` + `BreadcrumbList`.
- **Participar**: wizard de 4 etapas (Sobre, Contato, Fotos e horário, Revisão),
  e-mail obrigatório com a dica de retorno e pop-up de confirmação com protocolo.
- **Termos/privacidade**: conteúdo real de `documento_termo`, sem texto inventado.

## Horário: como é persistido

O formulário trabalha com `{ dias, inicio, fim, intervalo, sobAgendamento }` e
grava em `horario_funcionamento` **sem mudar o schema**:

- um registro por faixa e por dia — o intervalo vira dois registros
  (`08:00–12:00` e `13:00–18:00`);
- "somente sob agendamento" fica em `observacao`, com `00:00`/ `00:00` nas horas;
- nenhum dia marcado = horário não informado (não bloqueia o envio).

Regras validadas no cliente: `inicio < intervaloInicio < intervaloFim < fim`.

## Pendências conscientes

- **"Aberto agora" como filtro do catálogo** não existe no backend; hoje só é
  calculado na ficha do comércio e no card. Implementar exige filtro por dia/hora
  em `buscarNegocios`.
- **Galeria com fotos reais**: o catálogo não devolve imagens aprovadas; o bloco
  2:1/3:2 usa o fallback desenhado (monograma + categoria) — nunca caixa vazia.
- **Diálogo de correção** da ficha ainda leva para `/solicitar?negocio=<id>`
  (fluxo existente) em vez de um formulário próprio.
