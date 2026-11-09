// Adaptador do git para a régua do diff: o texto do `git diff -U0` do PR contra a base (merge-base).
import { execFileSync } from 'node:child_process';

/** Base do PR: no CI vem de C3_BASE (origin/<branch base>); local, origin/main. */
export const prBase = () => process.env.C3_BASE || 'origin/main';

/** @returns {string} diff unificado sem contexto, do merge-base com a base até o HEAD */
export function prDiff(base = prBase()) {
  return execFileSync('git', ['diff', '-U0', '--no-color', `${base}...HEAD`], { encoding: 'utf8', maxBuffer: 64 << 20 });
}
