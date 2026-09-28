"use client";

import type { ComponentProps } from "react";

// Aplica o filtro assim que a pessoa escolhe; sem JavaScript, o botão "Aplicar" faz o mesmo.
export function AutoSubmitSelect(props: ComponentProps<"select">) {
  return <select {...props} onChange={(event) => event.currentTarget.form?.requestSubmit()} />;
}
