// src/app/api/auth/login/route.ts
import { loginAction } from "@/application/auth/login";
import { NextRequest, NextResponse } from "next/server";

/**
 * Login por formulário/JSON.
 *
 * A resposta devolve apenas o resultado e o destino. Antes vinha também o JWT
 * cru, o hash dele e um payload de "auto-teste": qualquer pessoa (ou log,
 * proxy ou ferramenta de monitoramento) que visse o corpo da resposta teria um
 * token válido, e isso anula a proteção do cookie httpOnly.
 */
export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  let email: string;
  let senha: string;

  if (contentType.includes("application/json")) {
    const body = await request.json();
    email = body.email;
    senha = body.senha;
  } else {
    const formData = await request.formData();
    email = formData.get("email") as string;
    senha = formData.get("senha") as string;
  }

  const formData = new FormData();
  formData.append("email", email || "");
  formData.append("senha", senha || "");

  const result = await loginAction(null, formData);

  if ("error" in result && result.error) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const response = NextResponse.json({
    success: true,
    redirect: "redirect" in result ? result.redirect : "/admin",
  });

  const token = "token" in result ? result.token : undefined;
  if (token) {
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 dias
      path: "/",
    });
  }

  return response;
}
