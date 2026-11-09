// Regras de e-mail e senha e o e-mail repassado entre as telas.
import { useLocation } from 'react-router';
import { z } from 'zod';
import { passwordScore } from '@c3theme/ui';

export const email = z.email('Informe um e-mail válido.');
export const strongPassword = z
  .string()
  .min(8, 'Use pelo menos 8 caracteres.')
  .refine((v) => passwordScore(v) >= 2, 'Senha fraca: misture maiúsculas, números e símbolos.');

/** E-mail que veio da tela anterior (esqueci a senha / cadastro). */
export const useEmailFromState = () => {
  const { state } = useLocation();
  return (state as { email?: string } | null)?.email;
};

// ---------------------------------------------------------------- login
