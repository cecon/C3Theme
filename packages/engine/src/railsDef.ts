/** Zonas das bordas da casca (cecon/C3Theme#116 e #117), declaradas em `layout.rails`. */
export interface RailsDef {
  readonly servers?: { readonly shortcuts?: boolean; readonly localServerId?: string };
  readonly pages?: { readonly defaultPinned?: readonly string[]; readonly brandHref?: string };
}
