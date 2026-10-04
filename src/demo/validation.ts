export type DemoInput = { name: string; description: string };
export type ValidationResult =
  | { ok: true; data: DemoInput }
  | { ok: false; fields: Record<string, string> };

export function validateDemoInput(value: unknown): ValidationResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, fields: { name: "オブジェクト形式で入力してください。" } };
  }
  const input = value as Record<string, unknown>;
  const fields: Record<string, string> = {};
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const description = typeof input.description === "string" ? input.description.trim() : "";

  if (typeof input.name !== "string" || !name) {
    fields.name = "名前は1〜80文字で入力してください。";
  } else if (name.length > 80) {
    fields.name = `名前は80文字以内で入力してください。${name.length - 80}文字超過しています。`;
  }
  if (input.description !== undefined && typeof input.description !== "string") {
    fields.description = "説明は500文字以内の文字列で入力してください。";
  } else if (description.length > 500) {
    fields.description = `説明は500文字以内で入力してください。${description.length - 500}文字超過しています。`;
  }
  return Object.keys(fields).length ? { ok: false, fields } : { ok: true, data: { name, description } };
}
