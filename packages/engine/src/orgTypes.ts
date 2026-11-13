/** GET /_meta/context: empresas e filiais que o usuário acessa. */
export interface OrgContext {
  organization: { company: string; branch: string } | null;
  companies: { id: string; title: string }[];
  branches: { id: string; title: string; company: string }[];
  activeBranch: string | null;
  defaultBranch: string | null;
}
