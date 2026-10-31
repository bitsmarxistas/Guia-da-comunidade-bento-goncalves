# Documentação de engenharia — GuiaBG

Esta pasta é para **quem mexe no código**. A documentação de **produto**
(requisitos, regras de negócio, máquinas de estado, backlog) vive em outro
repositório (`docs-projeto`) e não deve ser alterada para "casar" com o código:
ela é a fonte da verdade.

> Projeto open source: o objetivo é que qualquer cidade consiga rodar o seu
> próprio diretório comunitário. Se você está fazendo isso, comece por
> [05 — Replicar em outra cidade](./05-replicar-em-outra-cidade.md).

## Índice

| Documento                                                         | Para que serve                                         |
| ----------------------------------------------------------------- | ------------------------------------------------------ |
| [01 — Arquitetura](./01-arquitetura.md)                           | camadas, fluxo de dados, decisões e porquês            |
| [02 — Ambiente e setup](./02-ambiente-e-setup.md)                 | instalar, variáveis, rodar, comandos do dia a dia      |
| [03 — Módulos do backend](./03-modulos-backend.md)                | mapa dos módulos, responsabilidades e convenções       |
| [04 — Testes](./04-testes.md)                                     | unitários, integração com banco real, como escrever    |
| [05 — Replicar em outra cidade](./05-replicar-em-outra-cidade.md) | checklist de fork e o que é local a cada cidade        |
| [06 — Banco e migrations](./06-banco-e-migrations.md)             | schema, regras de migration, drift e como diagnosticar |
| [07 — Interface](./07-interface.md)                               | design system, shell, telas e como o horário é salvo   |
| [08 — Guia de frontend aprovado](./08-guia-frontend-aprovado.md)  | spec visual e de comportamento aprovada (referência)   |
| [Arquivo](./_arquivo/README.md)                                   | relatórios históricos (não são estado atual)           |

## Tour de 30 segundos

```
src/
  domain/          # TypeScript puro: entidades, enums, regras (RN01–RN38), ME-01..ME-08
  application/     # casos de uso (server actions e serviços): catálogo, solicitações,
                   # negócios, categorias, governança, mídia, LGPD, configuração
  infrastructure/  # Drizzle + Neon, JWT, R2/S3, e-mail (Resend), fila (Postgres), auditoria
  app/             # rotas Next (App Router): (public), (admin), api
  ui/components/   # componentes de interface (shadcn-like)
  shared/          # env validado, logger
tests/unit         # domínio puro, sem banco
tests/integration  # sobe um Postgres local e aplica as migrations de verdade
tests/e2e          # Playwright contra build de produção
```

Regra de dependência: **domain não importa nada de fora**. `application` pode
usar `domain` e `infrastructure`. `app` só fala com `application`.

## Comandos

| Comando                                                      | O que faz                                |
| ------------------------------------------------------------ | ---------------------------------------- |
| `pnpm dev`                                                   | sobe o Next em `http://localhost:3000`   |
| `pnpm typecheck`                                             | gera tipos de rota e roda `tsc --noEmit` |
| `pnpm lint`                                                  | ESLint                                   |
| `pnpm test:unit`                                             | domínio puro (rápido, sem banco)         |
| `pnpm test:integration`                                      | integração com Postgres real (Docker)    |
| `pnpm test:e2e`                                              | E2E Playwright contra build de produção  |
| `pnpm build`                                                 | build de produção                        |
| `pnpm db:generate` / `db:migrate`                            | cria / aplica migrations                 |
| `pnpm db:seed:admin`, `db:seed:categorias`, `db:seed:config` | seeds                                    |

## Convenções de idioma

- Código, tabelas e colunas em **português** (`solicitacao`, `situacao_publicacao`).
  É intencional: os nomes vêm do modelo de domínio aprovado.
- Comentários e documentação explicam **por quê**, não o quê.
- Mensagens de erro voltadas ao usuário em português; `ErroDominio` carrega um
  `codigo` estável (ex.: `TRANSICAO_INVALIDA`) para testes e tradução.
