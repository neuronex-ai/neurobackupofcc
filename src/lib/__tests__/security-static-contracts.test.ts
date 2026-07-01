import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const TEXT_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".md", ".json", ".yml", ".yaml"]);
const FRONTEND_ROOTS = ["src"];
const ACTIVE_PUBLIC_ROOTS = ["src", ".github", "docs", "supabase/functions"];
const EMAIL_AND_INVITE_FILES = [
  "supabase/functions/create-patient-portal-invite/index.ts",
  "supabase/functions/patient-portal-auth/index.ts",
  "supabase/functions/send-appointment-reminder/index.ts",
  "supabase/functions/send-reminder/index.ts",
  "supabase/functions/send-session-invite/index.ts",
  "supabase/functions/send-patient-invite/index.ts",
  "supabase/functions/send-patient-invite-safe/index.ts",
  "supabase/functions/send-document-email/index.ts",
  "supabase/functions/send-document-email-safe/index.ts",
];

function listFiles(root: string) {
  const absoluteRoot = resolve(repoRoot, root);
  if (!existsSync(absoluteRoot)) return [];

  const files: string[] = [];
  const visit = (current: string) => {
    for (const entry of readdirSync(current)) {
      const absolute = join(current, entry);
      const rel = relative(repoRoot, absolute).replace(/\\/g, "/");
      if (
        rel.includes("/node_modules/") ||
        rel.includes("/dist/") ||
        rel.includes("/coverage/") ||
        rel.includes("/__tests__/")
      ) {
        continue;
      }

      const stats = statSync(absolute);
      if (stats.isDirectory()) visit(absolute);
      else files.push(rel);
    }
  };

  visit(absoluteRoot);
  return files;
}

function read(relPath: string) {
  return readFileSync(resolve(repoRoot, relPath), "utf8");
}

function sourceFiles(roots: string[]) {
  return roots
    .flatMap(listFiles)
    .filter((file) => SOURCE_EXTENSIONS.has(file.slice(file.lastIndexOf("."))));
}

function textFiles(roots: string[]) {
  return roots
    .flatMap(listFiles)
    .filter((file) => TEXT_EXTENSIONS.has(file.slice(file.lastIndexOf("."))));
}

function findings(files: string[], pattern: RegExp) {
  return files.filter((file) => pattern.test(read(file)));
}

describe("sanitized security static contracts", () => {
  it("does not expose service_role usage in frontend source", () => {
    const offenders = findings(
      sourceFiles(FRONTEND_ROOTS),
      /\b(SUPABASE_SERVICE_ROLE|SERVICE_ROLE|service_role)\b/,
    );

    expect(offenders).toEqual([]);
  });

  it("does not expose Asaas API key names in frontend except explicit deny lists", () => {
    const offenders = findings(
      sourceFiles(FRONTEND_ROOTS),
      /\b(ASAAS_API_KEY|asaasApiKey|asaas_api_key)\b/,
    ).filter((file) => file !== "src/lib/neurofinance-safe-selects.ts");

    expect(offenders).toEqual([]);
  });

  it("does not import server-side secret variables into src", () => {
    const offenders = findings(
      sourceFiles(FRONTEND_ROOTS),
      /\b(Deno\.env|SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE|ASAAS_API_KEY|R2_SECRET_ACCESS_KEY|WEBHOOK_SECRET|PRIVATE_KEY)\b/,
    );

    expect(offenders).toEqual([]);
  });

  it("does not select asaas_api_key from frontend Supabase calls", () => {
    const offenders = sourceFiles(FRONTEND_ROOTS).filter((file) => {
      const source = read(file);
      const selects = source.match(/\.select\s*\(([\s\S]{0,800}?)\)/g) || [];
      return selects.some((select) => select.includes("asaas_api_key"));
    });

    expect(offenders).toEqual([]);
  });

  it("does not place localhost URLs in email or invite templates", () => {
    const offenders = EMAIL_AND_INVITE_FILES.filter((file) => /localhost|127\.0\.0\.1/.test(read(file)));

    expect(offenders).toEqual([]);
  });

  it("does not mix Supabase production and homologation project refs in active files", () => {
    const refs = ["krewdaklcyzqfxkkgvqr", "yzlgadozijqvmuyfudpa"];
    const offenders = textFiles(ACTIVE_PUBLIC_ROOTS).filter((file) => {
      const source = read(file);
      return refs.every((ref) => source.includes(ref));
    });

    expect(offenders).toEqual([]);
  });
});
