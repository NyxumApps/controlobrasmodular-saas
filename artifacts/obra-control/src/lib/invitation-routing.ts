export const invitationSuccessPath = '/dashboard';

export function invitationPath(basePath: string, token: string, search = ''): string {
  return `${basePath}/invite/${encodeURIComponent(token)}${search}`;
}

export function invitationSignInPath(basePath: string, token: string, search = ''): string {
  return `${basePath}/invite/${encodeURIComponent(token)}/sign-in${search}`;
}

export function invitationReturnUrl(origin: string, basePath: string, token: string, search = ''): string {
  return `${origin}${invitationPath(basePath, token, search)}`;
}