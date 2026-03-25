export interface AuthenticatedUser {
  username: string;
  email?: string;
  groups?: string[];
  authMethod: "oidc" | "basic";
}
