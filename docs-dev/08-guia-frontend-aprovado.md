# Orientações de implementação para o DeepSeek

**Projeto:** GuiaBG — guia de comércios e serviços de Bento Gonçalves/RS
**Referência visual e de interação:** protótipo aprovado neste projeto Open Design
**Destino:** app Next.js em `classificados_bg/portfolio`
**Idioma da interface:** português do Brasil

Este documento não é uma sugestão de redesign. Ele descreve o que já foi aprovado no protótipo e como levar isso para o app real sem remover funcionalidades, sem quebrar o trabalho em andamento e sem reintroduzir decisões que o usuário já rejeitou.

---

## 0. Leia antes de começar

1. Leia `portfolio/COLABORACAO-AGENTES.md` e `portfolio/AGENTS.md`. Eles definem donos de arquivos, defeitos conhecidos e o protocolo entre agentes.
2. Não edite `src/domain`, `src/application` ou `src/infrastructure` para "resolver" a UI. O frontend consome casos de uso e APIs existentes. Mudanças de schema, migrations ou contratos exigem coordenação explícita.
3. Não use scripts contra produção e não rode comandos com `.env.local` de produção. Prefira o Postgres local descrito no documento de colaboração.
4. Antes de alterar qualquer rota, confirme o estado atual do repositório. O protótipo é hash-based e de demonstração; o app real usa App Router com caminhos próprios.
5. O protótipo contém dados fictícios e `localStorage`. Nada disso vai para produção: use os dados e casos de uso reais.

Hierarquia em conflito:

1. `DOCUMENTACAO/docs` — regras de produto.
2. `docs-identidade-visual` — identidade visual, **atualizada pela revisão aprovada neste protótipo**.
3. Este documento e o protótipo — decisões de UI/UX e comportamento.
4. Preferências genéricas do agente.

O vermelho permanece obrigatório. Onde o protótipo divergir do guia visual antigo (neutros, tipografia, componentes), vale o protótipo aprovado; registre a divergência e atualize o guia depois.

---

## 1. Regras invioláveis

### Marca e visual

- Vermelho da marca: `#C41E3A` no tema claro. Não troque por verde, azul, roxo ou laranja.
- **Sem degradês e sem brilhos radiais** em fundos, heróis, CTAs, cards, login ou admin. A única exceção aprovada é o **pontilhado esmaecido do herói** (pontos vermelhos com máscara de fade lateral). Ele deve ser mantido.
- **Sem tons fracos em estados de seleção.** Dia escolhido, horário escolhido, item ativo e foco usam o vermelho cheio (`--brand`) com texto `--on-brand`. Não use rosa claro para indicar seleção.
- Visual editorial e direto, não corporativo. Menos texto, mais hierarquia, imagens reais e tipografia com personalidade.
- Ícones: uma única família (lucide), traço consistente. Marcas como WhatsApp e Instagram ficam em um arquivo próprio de glifos, não coladas no meio da página.
- Nada de métrica inventada, avaliação fictícia, "mais acessados", "milhares de pessoas" ou selo de "verificado". O projeto não tem projetos verificados.

### Produto e conteúdo

- O guia é um espaço para pessoas divulgarem **comércios e serviços**, não um portfólio de projetos. Na UI pública, use "comércio" e "serviço". Evite "projeto" e "iniciativa".
- O comércio não precisa "melhorar o bairro". Não prometa impacto social, transformação do bairro ou métricas de comunidade.
- A análise leva **até 24 h**.
- **A resposta da análise chega por e-mail, não por WhatsApp.** O e-mail do solicitante é obrigatório e a copy deve dizer isso com clareza.
- O WhatsApp é apenas o contato do comércio. Nunca prometa retorno da equipe por WhatsApp.
- Fórum e votações são **restritos ao admin**. Não exponha links ou telas públicas.
- Demonstração e dados fictícios devem estar rotulados como demonstração quando aparecerem em ambiente de protótipo.

---

## 2. Onde está a referência

No projeto Open Design:

| Arquivo                          | O que contém                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------- |
| `index.html`                     | Shell, sprite de ícones, boot de tema, entrada do protótipo                  |
| `styles.css`                     | Design system completo (tokens, tipografia, componentes, responsivo, temas)  |
| `app.js`                         | Rotas hash, todas as telas, componentes, validações, wizard, admin, diálogos |
| `data.js`                        | Dados fictícios de demonstração (não portar)                                 |
| `assets/fonts/`                  | Fraunces e Source Sans 3                                                     |
| `assets/stock/` + `credits.json` | Fotos de demonstração e créditos                                             |
| `assets/favicon.svg` e PNGs      | Símbolo e favicons                                                           |

Use o protótipo como fonte de verdade visual e comportamental. Não copie o roteador hash, o estado em `localStorage`, os dados fictícios nem os controles de demonstração.

---

## 3. Design system

### 3.1 Tokens

Implemente como variáveis CSS no tema claro e escuro, e exponha no Tailwind 4/`globals.css`. Nenhum hex solto em componente.

| Token             | Claro     | Escuro    | Uso                                         |
| ----------------- | --------- | --------- | ------------------------------------------- |
| `--brand`         | `#C41E3A` | `#FF6B80` | marca, ações primárias, seleção, links      |
| `--brand-strong`  | `#A31630` | `#FF8FA0` | hover/pressed                               |
| `--brand-tint`    | `#FBE6EA` | `#3A121C` | fundos de apoio (nunca para seleção ativa)  |
| `--brand-wash`    | `#FDF1F3` | `#2A0D14` | reserva; não usar como fundo fraco de seção |
| `--on-brand`      | `#FFFFFF` | `#2B0710` | texto/ícone sobre vermelho                  |
| `--canvas`        | `#F7F4F4` | `#120D0E` | fundo geral                                 |
| `--surface`       | `#FFFFFF` | `#1A1416` | cartões, header, diálogos                   |
| `--surface-2`     | `#F1ECEC` | `#241B1D` | superfícies secundárias                     |
| `--ink`           | `#1C1618` | `#F7EFF0` | texto principal                             |
| `--ink-soft`      | `#574E51` | `#C9B8BB` | texto secundário                            |
| `--ink-mute`      | `#83787B` | `#9C878B` | metadados                                   |
| `--line`          | `#E7E0E2` | `#332629` | divisórias                                  |
| `--line-strong`   | `#D4C9CC` | `#4A383C` | bordas de campo e contorno                  |
| `--positive`      | `#17794D` | `#74E0B4` | aberto agora, sucesso funcional             |
| `--positive-tint` | `#E2F4EA` | `#0F3125` | fundo de sucesso                            |
| `--warning`       | `#8A5A00` | `#F2C46E` | prazos e avisos                             |
| `--warning-tint`  | `#FBEFD6` | `#2E2411` | fundo de aviso                              |
| `--critical`      | `#D92D20` | `#FF8A7A` | erro e ação destrutiva                      |
| `--critical-tint` | `#FCE8E4` | `#341716` | fundo de erro                               |
| `--sun`           | `#DE8A33` | `#F5B06B` | detalhe secundário                          |
| `--sun-tint`      | `#FCEDDC` | `#33250F` | fundo do detalhe                            |
| `--sun-ink`       | `#6B3A0B` | `#FFE0B8` | texto sobre o detalhe                       |
| `--focus`         | `#1C1618` | `#F7EFF0` | anel de foco                                |

Regras:

- Contraste de corpo ≥ 4.5:1; texto grande, ícones e gráficos essenciais ≥ 3:1. Audite o tema escuro separadamente.
- Nunca comunique estado só por cor: use texto, ícone ou forma.
- Sucesso do fluxo de envio usa o vermelho da marca (não verde) no selo de confirmação; status operacionais podem usar `--positive`.
- Foco: anel de 2 px com `--focus` e offset de 2–4 px. Visível sobre branco, canvas e vermelho.

### 3.2 Tipografia

- Display/títulos: **Fraunces**, pesos 400–700, itálico para ênfase editorial.
- Texto/UI: **Source Sans 3**, 400–700.
- No Next.js, carregue com `next/font` (subsets `latin` e `latin-ext`, `display: swap`). Não use base64 como no protótipo.
- Escala:
  - display: `clamp(2.6rem, 5.2vw, 4.1rem)`
  - h1: `clamp(2.2rem, 4.4vw, 3.4rem)`
  - h2: `1.5–2rem`
  - corpo: 16 px (mínimo), altura 1.5–1.75
  - metadados: 13–14 px
  - rótulos: 12–13 px, peso 600–650
- Números tabulares em horários, contagens e tabelas.
- Linha de leitura 65–75 caracteres no desktop, 35–60 no mobile.

### 3.3 Espaço, forma e movimento

- Base 4 px: 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Container 1200 px; gutters 24 px (20 px em telas menores); header 72 px (64 px no mobile).
- Raios: 8 px (controles pequenos), 14 px (campos/cartões), 22 px (painéis), 999 px (chips e pílulas).
- Bordas de 1 px; 2 px só em estado ativo/linha de foco.
- Sombras discretas e quentes. Nada de glow colorido.
- Movimento 150–300 ms, `ease-out` na entrada e `ease-in` na saída. Respeite `prefers-reduced-motion`.
- Animações só para mudança de estado, hierarquia ou causalidade.

### 3.4 Imagens e ícones

- Fotos reais e licenciadas; nada de banco aleatório, Wikipedia ou geração de substituto para lugar/comércio real.
- Use `next/image` com proporção intrínseca, `sizes` e placeholder. Não force conteúdo em ratio errado.
- Cards de comércio: imagem 2:1; galeria principal 3:2; miniaturas quadradas.
- Fallback desenhado (monograma + categoria), nunca caixa cinza vazia.
- Ícones lucide em 24 px, traço 1.75. Marcas em glifos próprios.
- Favicon e símbolo: pino com fachada sob toldo, já em `assets/favicon.svg`; use os PNGs 16/32/180/512.

---

## 4. Componentes

Implemente como componentes reutilizáveis no design system do app real, não como CSS solto por página.

- **Botões**: primário (vermelho cheio), secundário (contorno), ghost, perigo (contorno vermelho + rótulo explícito). Altura mínima 44 px; foco visível.
- **Chips**: categoria, filtros ativos e horários. Ativo em vermelho cheio; inativo em superfície com borda.
- **Campos**: label sempre associado; erro com ícone, texto e `aria-live`; dica curta. `select` com seta própria; `textarea` com altura mínima.
- **Checkbox e switch**: alvo de 44 px; rótulo clicável; estado nunca só por cor.
- **Cards de comércio**: imagem 2:1, categoria, nome, bairro, status "aberto/fechado" com ponto + texto. Card inteiro é link semântico; contato é ação separada.
- **Carrossel "Achados"**: scroll horizontal nativo, barra de rolagem oculta, arraste com mouse, snap suave, setas que avançam um card + gap e ficam desabilitadas nas pontas, trilho de progresso. Toque nativo no mobile. Foco visível.
- **Galeria do comércio**: imagem principal + miniaturas; troca por clique/teclado; legenda; fallback.
- **Tabela de horários**: dias, faixas, destaque de "hoje", "Fechado" e "Somente sob agendamento".
- **Diálogo**: `<dialog>` nativo ou equivalente acessível; foco preso, Esc fecha, fundo escurecido sem blur exagerado; retorno de foco ao gatilho.
- **Toast**: confirmação curta no canto, `aria-live`; não substitui o pop-up de envio.
- **Skeleton e vazio**: estrutura preservada no loading; vazio com ação real, não texto morto.

---

## 5. Telas e fluxos

### 5.1 Shell público

- Header sticky com símbolo + "GuiaBG", navegação "Início", "Descobrir", "Categorias", busca, tema, "Entrar" (ou "Painel") e "Participar".
- Menu mobile em drawer acessível; botão com `aria-expanded`; fecha com Esc e ao navegar.
- Rodapé escuro com marca, links do guia, categorias, administração, créditos e restauração de demonstração apenas em protótipo.
- Link "Pular para o conteúdo".
- Um único shell para todas as páginas públicas. Nada de header/footer duplicados por página.

### 5.2 Home

Ordem:

1. Herói editorial com fundo sólido e **pontilhado esmaecido** (única textura aprovada).
   - Título: "Consuma de quem muda a comunidade." com ênfase em "muda a comunidade".
   - Apoio: "E produza para mudar também. Comércios e serviços pertinho de você."
   - Busca como ação principal; atalhos de categoria.
   - Sem imagens no herói: composição tipográfica com busca e atalhos sobre o pontilhado.
2. Categorias: pílulas com ícone, nome curto e contagem (somente se vier do backend). No mobile (≤ 520 px), viram grade de 2 colunas em tiles compactos com ícone, nome e contagem.
3. "Achados": carrossel descrito acima. Título "Do bairro, para o bairro." sem promessa de melhoria do bairro.
4. Destaque "Gente daqui": imagem grande + lista numerada de 3 comércios.
5. Faixa vermelha sólida de participação: "Tem um comércio ou um serviço?" / "Coloque no guia. A gente confere e publica." / "Análise em até 24 h".
6. Mais comércios em lista (não grade infinita).
   Sem métricas inventadas, sem "verificados", sem "projetos".

### 5.3 Catálogo e busca

- Busca por nome/serviço, filtros por categoria, bairro e "aberto agora"; ordenação.
- Chips de filtros ativos removíveis; contagem de resultados; paginação de 9 por página; estado vazio com "Limpar filtros" e "Participar".
- Filtros no desktop em coluna; no mobile em diálogo/painel deslizante.
- `/busca` ou rota equivalente de busca: `noindex`.
- URL reflete busca, filtros e página (compartilhável).

### 5.4 Página do comércio

- Rota dinâmica funcional (`/negocio/[slug]` ou a rota existente corrigida).
- Breadcrumb, categoria, nome, bairro, descrição, tags.
- Galeria com capa + até 4 fotos aprovadas e logo quando houver.
- Contato: WhatsApp (link com mensagem pré-preenchida), telefone, e-mail, Instagram, site. Não exiba campo vazio como dado.
- Horários com "aberto agora" calculado no fuso de São Paulo; "Somente sob agendamento" quando aplicável.
- Compartilhar: Web Share API com fallback "copiar link" e toast.
- "Pedir correção": diálogo com nome, e-mail, tipo, detalhe; e-mail de retorno obrigatório.
- JSON-LD `LocalBusiness` + `BreadcrumbList`.
- Selo: no máximo "Do guia"; nunca "verificado".

### 5.5 Participar — wizard em 4 etapas

Mantenha os campos e regras atuais, com a apresentação do protótipo. Estado preservado ao voltar etapas.

**Etapa 1 — Sobre**

- Nome, categoria, descrição (mín. 40 caracteres).
- Aviso de possível duplicata com link para a ficha existente.

**Etapa 2 — Contato**

- Bairro, WhatsApp (contato do comércio), endereço, e-mail, Instagram.
- **E-mail é obrigatório.** Label "E-mail *", placeholder `voce@exemplo.com`, dica "A resposta da análise chega neste e-mail."
- Validação de e-mail no cliente e no servidor.
- WhatsApp com DDD; não é canal de resposta da equipe.

**Etapa 3 — Fotos e horário**

- Até 4 fotos JPG/PNG, até 5 MB cada; compressão no cliente quando fizer sentido; prévias com remoção.
- Editor de horário:
  - Dias da semana em botões (Seg a Dom), marcáveis; padrão Seg–Sex.
  - Faixas prontas: 08h–12h, 09h–18h, 13h–19h, 18h–22h.
  - Campos de hora editáveis ("Das" / "às") para digitar o horário.
  - **"+ Adicionar intervalo"**: revela "Intervalo" com início/fim e botão de remover; o intervalo precisa ficar dentro do horário e terminar depois de começar.
  - **"Somente sob agendamento"**: desativa os horários e mostra o resumo com essa informação.
  - Resumo ao vivo: `Seg a sex · 08:00–12:00 e 13:00–18:00` ou `Seg a sex · somente sob agendamento`.
  - Nenhum dia marcado + sem agendamento = horário não informado, sem bloquear o envio.

**Etapa 4 — Revisão**

- Resumo de todos os campos, incluindo o horário formatado.
- Termos obrigatórios.
- Botão "Enviar solicitação".

**Envio e confirmação**

- Ao concluir, cria a solicitação e abre um **pop-up de confirmação** (não uma página de sucesso):
  - selo de check em vermelho da marca;
  - sobrancelha "Tudo certo";
  - título "Solicitação enviada";
  - texto "Recebemos {nome}. A resposta chega em {email} em até 24 h.";
  - protocolo em destaque;
  - botão "Ir para o início".
- Fechar por botão, Esc ou clique fora redireciona para a home.
- A rota antiga de sucesso pode continuar existindo como fallback, mas o fluxo principal é pop-up + home.
- Não prometa WhatsApp em nenhum texto.

### 5.6 Login e recuperação

- Login compacto com marca, e-mail e senha, erros sem vazar informação, foco e teclado completos.
- Recuperação com confirmação neutra ("Se o endereço estiver cadastrado...") e sem revelar existência de conta.
- Após login, admin.

### 5.7 Estados transversais

- Loading com skeleton; vazio com ação; erro com recuperação; 404 e 500 na mesma linguagem.
- Nenhum estado pode parecer tela quebrada.

### 5.8 Admin

- Mesmo sistema visual; densidade maior; **sem azul** e sem marca "Diretório".
- Sidebar escura com marca, "Admin", navegação e contadores.
- Itens: Visão geral, Solicitações, Comércios (não "Iniciativas"), Categorias, Imagens, Configurações.
- Fórum e Votações: apenas admin, com etiqueta "restrito"; nunca links públicos.
- Dashboard: números reais ou vazio honesto; prazos de 7 dias; fila de imagens.
- Solicitações: lista com protocolo, comércio, categoria, bairro, data, status e ações; detalhe em duas colunas com publicado × proposto, histórico e decisão.
- Comércios: lista, status de publicação, destaque, imagens, edição publicada.
- Categorias: oficiais + sugestões; bloqueio de desativação quando houver comércios associados.
- Imagens: moderação com aprovar/rejeitar e justificativa; operável por teclado.
- Configurações: somente parâmetros existentes; nada inventado.
- Aprovar/rejeitar/em análise atualiza lista, dashboard e histórico imediatamente.

---

## 6. Textos e voz

Diretrizes:

- Frases curtas, diretas, sem jargão corporativo.
- "Comércio" e "serviço" no público; "ficha" no admin quando precisar.
- Evite "projeto", "iniciativa", "impacto", "transformação do bairro", "verificado".
- Sempre "análise em até 24 h".
- Retorno por e-mail.
- WhatsApp é contato do comércio.

Textos-chave (copiar com atenção):

- Dica do e-mail: `A resposta da análise chega neste e-mail.`
- Pop-up: `Solicitação enviada` / `Recebemos {nome}. A resposta chega em {email} em até 24 h.` / `Ir para o início`
- Resumo de horário: `Seg a sex · 08:00–12:00 e 13:00–18:00`
- Agendamento: `Seg a sex · somente sob agendamento`
- Faixa: `Tem um comércio ou um serviço?`
- Empty state: `Nenhum comércio com esses filtros` (não "iniciativa").

Onde o protótipo ainda tiver resíduos de "projeto/iniciativa", adapte para o vocabulário acima em vez de copiar literalmente.

---

## 7. Implementação no Next.js

### 7.1 O que portar

- Tokens e CSS do design system, reorganizados em `globals.css` + tema Tailwind 4.
- Componentes visuais e estados do protótipo.
- Comportamentos de navegação, filtros, galeria, wizard, horários, diálogos e admin.
- Estrutura de conteúdo e hierarquia das telas.

### 7.2 O que não portar

- Roteador hash.
- `localStorage`, dados fictícios e botões de demonstração.
- Scripts de compressão de imagem do protótipo (use a infraestrutura real de mídia).
- CSS global monolítico; componha com as classes e componentes existentes.
- Textos com "projeto/iniciativa", "verificado" ou retorno por WhatsApp.

### 7.3 Rotas

Mapeie os caminhos lógicos do protótipo para as rotas reais do App Router. Confirme os nomes atuais antes de criar ou renomear:

| Protótipo                        | App real (confirmar)                       |
| -------------------------------- | ------------------------------------------ |
| `#/`                             | `/`                                        |
| `#/negocios`                     | catálogo (ex.: `/catalogo` ou `/negocios`) |
| `#/negocio/[slug]`               | `/negocio/[slug]`                          |
| `#/solicitar`                    | `/solicitar`                               |
| `#/entrar`                       | `/entrar`                                  |
| `#/recuperar-senha`              | `/recuperar-senha`                         |
| `#/admin`                        | `/admin`                                   |
| `#/admin/solicitacoes` e `/[id]` | idem                                       |
| `#/admin/negocios`               | idem                                       |
| `#/admin/categorias`             | idem                                       |
| `#/admin/imagens`                | idem                                       |
| `#/admin/configuracoes`          | idem                                       |
| `#/admin/forum` e `/votacoes`    | admin only                                 |

Corrija rotas dinâmicas quebradas se ainda existirem (pastas `[slug`/`]`). Não crie rotas duplicadas apenas para "ficar igual ao protótipo".

### 7.4 Dados

- Consuma catálogo, comércios, solicitações, categorias e imagens pelos casos de uso/APIs existentes.
- Não invente campos de backend. Se o schema atual não tiver e-mail na solicitação, alinhe com o responsável pelo backend antes; a UI exige o campo.
- Horários: se o domínio já tiver faixas por dia, persista os dias, as faixas e o intervalo de forma estruturada. Se só houver texto, persista o resumo e registre a necessidade de evolução — não descarte o intervalo digitado pelo usuário.
- "Somente sob agendamento" deve sobreviver ao salvar e aparecer na ficha.
- Submissão: só mostre o pop-up após confirmação real do backend (201/200). Em erro, mantenha os dados e mostre mensagem clara; não redirecione.
- Dados de demonstração só em ambiente de demonstração, claramente rotulados.

### 7.5 Tema, fontes e imagens

- Tema por `data-theme` (claro/escuro) com persistência; garanta que o CSS e o provider usem o mesmo seletor.
- Fontes via `next/font`, sem autorreferência em `--font-sans`.
- Imagens via `next/image`, com assets locais/licenciados e créditos em sidecar.
- O pontilhado do herói pode ser CSS `background-image` com máscara; não use outros gradientes/glows.

### 7.6 Fluxo de confirmação (pseudocódigo)

```ts
const result = await createRequest(payload);
if (!result.ok) {
  showFormError(result.message);
  return;
}
openSuccessDialog({
  protocol: result.protocol,
  name: payload.name,
  email: payload.email,
  onClose: () => router.push("/"),
});
```

O diálogo deve:

- receber foco ao abrir;
- ser fechável por Esc, botão e clique fora;
- sempre terminar na home;
- não depender da rota `/solicitar/sucesso`.

### 7.7 Horários (modelo mínimo)

```ts
type HoursDraft = {
  days: number[]; // 0 = domingo ... 6 = sábado
  start: string; // "08:00"
  end: string; // "18:00"
  breakStart?: string; // "12:00"
  breakEnd?: string; // "13:00"
  byAppointment: boolean;
};
```

Regras:

- intervalo válido: `start < breakStart < breakEnd < end`;
- resumo: `dias · início–breakStart e breakEnd–fim`;
- com agendamento: `dias · somente sob agendamento`;
- sem dias e sem agendamento: horário não informado.

---

## 8. Acessibilidade e SEO

- WCAG 2.2 AA nos dois temas.
- Foco visível em todos os controles; ordem de teclado lógica; sem armadilhas.
- Alvos de pelo menos 44 × 44 px.
- Labels associados, erros com `aria-live` e vínculo ao campo.
- Diálogos com nome acessível, foco preso e retorno de foco.
- Nunca só cor para status.
- `prefers-reduced-motion` respeitado.
- Zoom de 200% sem quebra; sem rolagem horizontal em 320, 375, 768, 1024 e 1440.
- Metadados únicos, canônicos, Open Graph, JSON-LD `LocalBusiness` e `BreadcrumbList`; busca com `noindex`; sitemap/robots revisados.

---

## 9. Performance

Orçamentos nas páginas públicas:

- LCP ≤ 2,5 s no mobile;
- INP ≤ 200 ms;
- CLS ≤ 0,1;
- JS inicial ≤ 120 KB gzip;
- imagem ≤ 500 KB;
- fontes ≤ 180 KB no total.

Práticas:

- Server Components por padrão; cliente só em ilhas (filtros mobile, galeria, compartilhar, upload, tema).
- `next/image` com `sizes` e formatos modernos.
- Cache de catálogo de 30–60 s com invalidação ao publicar/atualizar.
- Sem bibliotecas novas para o que o projeto já resolve.

---

## 10. Ordem de execução

1. **Preflight** — ler `COLABORACAO-AGENTES.md`, confirmar rotas, tema e fontes atuais; corrigir bloqueios de rota/tema/fonte sem redesenhar.
2. **Design system** — tokens, tipografia, botões, campos, chips, cards, foco, shell público.
3. **Público** — home, catálogo, comércio, participar, auth, estados.
4. **Wizard e horários** — dias, faixas, digitação, intervalo, agendamento, e-mail obrigatório, pop-up de envio.
5. **Admin** — shell, dashboard, solicitações, comércios, categorias, imagens, configurações; fórum/votações restritos.
6. **Acabamento** — acessibilidade, performance, SEO, testes e revisão anti-remoção.

Cada etapa deve terminar com `pnpm typecheck`, `pnpm lint` e `pnpm test:unit` verdes, sem `--no-verify`, `eslint-disable` ou `ts-ignore`.

---

## 11. Critérios de aceite

- [ ] Vermelho `#C41E3A` como marca; nenhum verde/azul decorativo.
- [ ] Nenhum degradê ou brilho radial, exceto o pontilhado do herói.
- [ ] Seleções e estados ativos em vermelho cheio, não em rosa claro.
- [ ] E-mail obrigatório no formulário; toda copy de retorno fala em e-mail.
- [ ] WhatsApp aparece só como contato do comércio.
- [ ] Horário com dias clicáveis, faixas, digitação, intervalo e "somente sob agendamento".
- [ ] Intervalo validado dentro do horário e preservado ao salvar.
- [ ] Envio abre pop-up com protocolo e e-mail; botão/Esc/clique fora vai para a home.
- [ ] Nenhum texto público fala em "projeto", "iniciativa", "verificado" ou melhora do bairro.
- [ ] Fórum e votações só no admin.
- [ ] Cards com imagem 2:1; galeria 3:2; sem imagem gigante.
- [ ] Carrossel com arraste, setas com estado e trilho de progresso.
- [ ] Shell público único; admin sem azul e sem "Diretório".
- [ ] Rotas do build sem `[`; páginas principais respondem 200.
- [ ] axe sem violações sérias/críticas nas telas-chave; teclado completo.
- [ ] Sem rolagem horizontal em 320, 375, 768, 1024 e 1440.
- [ ] Orçamentos de performance atingidos.
- [ ] Nenhuma funcionalidade, campo, rota, menu ou teste removido.
- [ ] `typecheck`, `lint` e `test:unit` verdes.

---

## 12. Não faça

- Não troque o vermelho por outra cor de marca.
- Não use gradientes, halos ou brilhos radiais.
- Não use rosa claro para estado selecionado.
- Não volte a prometer retorno por WhatsApp.
- Não torne o e-mail opcional.
- Não use a página de sucesso como fluxo principal.
- Não use "projetos/iniciativas" na UI pública.
- Não invente métricas, avaliações, popularidade ou selo de verificação.
- Não exponha fórum/votações ao público.
- Não altere domínio, aplicação, infraestrutura, schema ou APIs sem coordenação.
- Não remova funcionalidades, campos, rotas, menus ou testes para "passar".
- Não use dados fictícios ou `localStorage` em produção.
- Não copie o CSS monolítico nem o roteador hash do protótipo.

---

## 13. Referências

- Protótipo aprovado: `index.html`, `styles.css`, `app.js`, `data.js` neste projeto.
- Fonte de produto: `DOCUMENTACAO/docs/` no repositório.
- Identidade visual: `docs-identidade-visual/GuiaBG_proposta_UI_UX_FINAL.md` (atualizar com os tokens aprovados).
- Colaboração: `portfolio/COLABORACAO-AGENTES.md` e `portfolio/AGENTS.md`.
- Imagens do protótipo: `assets/stock/credits.json`.
- Símbolo e favicons: `assets/favicon.svg` e `assets/favicon-*.png`.

Em caso de dúvida entre este documento e a documentação de produto, a documentação de produto vence. Em caso de dúvida visual entre este documento e o guia antigo, o protótipo aprovado vence e o guia deve ser atualizado.
