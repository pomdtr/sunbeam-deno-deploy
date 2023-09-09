#!/usr/bin/env -S deno run -A
import extension from "./extension.ts";

try {
  extension.execute(Deno.args);
} catch (e) {
  console.error(e);
  Deno.exit(1);
}
