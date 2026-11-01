import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/shared/env";

/*
 * Limites por IP.
 *
 * Cada finalidade tem o seu próprio balde: antes o login e a solicitação
 * dividiam o mesmo prefixo do Redis, então quem errasse a senha dez vezes
 * ficava sem conseguir enviar o cadastro. Sem Redis configurado, cai para uma
 * janela em memória (suficiente para uma instância; o ideal em produção é o
 * Upstash).
 */

const redis =
  env.UPSTASH_REDIS_URL && env.UPSTASH_REDIS_TOKEN
    ? new Redis({
        url: env.UPSTASH_REDIS_URL,
        token: env.UPSTASH_REDIS_TOKEN,
      })
    : null;

interface ResultadoLimite {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

class InMemoryRatelimit {
  private store = new Map<string, { count: number; resetAt: number }>();

  constructor(private readonly maximo: number) {}

  async limit(key: string): Promise<ResultadoLimite> {
    const agora = Date.now();
    const janelaMs = 60 * 1000;
    const registro = this.store.get(key);

    if (!registro || agora > registro.resetAt) {
      this.store.set(key, { count: 1, resetAt: agora + janelaMs });
      return {
        success: true,
        limit: this.maximo,
        remaining: this.maximo - 1,
        reset: agora + janelaMs,
      };
    }

    if (registro.count >= this.maximo) {
      return {
        success: false,
        limit: this.maximo,
        remaining: 0,
        reset: registro.resetAt,
      };
    }

    registro.count++;
    return {
      success: true,
      limit: this.maximo,
      remaining: this.maximo - registro.count,
      reset: registro.resetAt,
    };
  }
}

function criarLimiter(prefixo: string, maximo: number) {
  const redisLimiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(maximo, "1 m"),
        analytics: false,
        prefix: prefixo,
      })
    : null;

  const memoria = new InMemoryRatelimit(maximo);

  return {
    async limit(key: string): Promise<ResultadoLimite> {
      if (redisLimiter) {
        return (await redisLimiter.limit(key)) as ResultadoLimite;
      }
      return memoria.limit(`${prefixo}:${key}`);
    },
  };
}

/** Login: 10 tentativas por minuto por IP. */
export const rateLimitLogin = criarLimiter("ratelimit:login", 10);

/** Envio de solicitação: 5 por minuto por IP. */
export const rateLimitSolicitacao = criarLimiter("ratelimit:solicitacao", 5);

/** Upload assinado: 20 por minuto por IP (4 fotos + 3 anexos + retentativas). */
export const rateLimitUpload = criarLimiter("ratelimit:upload", 20);
