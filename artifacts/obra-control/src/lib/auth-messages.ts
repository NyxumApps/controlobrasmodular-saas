import type { AuthError } from '@supabase/supabase-js';

const byCode: Record<string, string> = {
  invalid_credentials: 'El correo o la contraseña no coinciden. Revísalos e intenta de nuevo.',
  email_not_confirmed: 'Aún no confirmas tu correo. Busca el mensaje que te enviamos y abre el enlace.',
  user_already_exists: 'Ya existe una cuenta con este correo. Inicia sesión o recupera tu contraseña.',
  email_exists: 'Ya existe una cuenta con este correo. Inicia sesión o recupera tu contraseña.',
  weak_password: 'Elige una contraseña más segura: al menos 8 caracteres, con letras y números.',
  same_password: 'La nueva contraseña debe ser distinta a la anterior.',
  over_email_send_rate_limit: 'Ya enviamos un correo hace poco. Espera un minuto antes de pedir otro.',
  over_request_rate_limit: 'Demasiados intentos seguidos. Espera unos minutos e intenta de nuevo.',
  signup_disabled: 'El registro está cerrado por ahora. Pide una invitación al dueño de tu empresa.',
  email_address_invalid: 'Ese correo no parece válido. Revisa que esté bien escrito.',
  validation_failed: 'Revisa el correo y la contraseña; alguno tiene un formato que no reconocemos.',
  otp_expired: 'El enlace venció o ya fue utilizado. Solicita uno nuevo.',
  session_expired: 'Tu sesión terminó. Vuelve a iniciar sesión.',
};

/** Spanish, blame-free wording for authentication failures. */
export function authErrorMessage(error: unknown): string {
  const candidate = error as Partial<AuthError> | null;
  if (candidate?.code && byCode[candidate.code]) return byCode[candidate.code];
  if (candidate?.status === 429) return byCode.over_request_rate_limit;
  if (candidate?.name === 'AuthRetryableFetchError' || error instanceof TypeError) {
    return 'No pudimos conectarnos. Revisa tu conexión a internet e intenta de nuevo.';
  }
  return 'No pudimos completar la operación. Intenta de nuevo en un momento.';
}
