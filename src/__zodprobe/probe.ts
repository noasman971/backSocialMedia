import { z } from "zod";
import * as zStar from "zod";

// (1) both import forms
const s1 = z.string();
const s2 = zStar.string();

// (2) string min/max/email, both spellings
const modern = z.object({
  email: z.email({ message: "Invalid email" }).max(255),
  username: z.string().min(3, "Too short").max(30, "Too long"),
});
const legacy = z.string().email(); // deprecated but present?

// (4) infer
type Modern = z.infer<typeof modern>;
const m: Modern = { email: "a@b.com", username: "abc" };

// (3) safeParse narrowing
const r = modern.safeParse({ email: "x", username: "y" });
if (r.success) {
  const d: Modern = r.data;
  void d;
} else {
  const issues = r.error.issues;
  const details = issues.map((i) => ({ field: i.path.join("."), message: i.message }));
  void details;
  // is .errors present?
  // @ts-expect-error -- zod 4 ZodError has no `.errors`
  void r.error.errors;
  void z.treeifyError(r.error);
  void z.flattenError(r.error);
  void z.prettifyError(r.error);
}

// (5) strip default
const strict = z.strictObject({ a: z.string() });
const loose = z.looseObject({ a: z.string() });
const stripped = modern.strip();
void [s1, s2, legacy, m, strict, loose, stripped];
