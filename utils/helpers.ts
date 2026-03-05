/**
 * Converte uma string para Title Case, ignorando partículas comuns em português.
 */
export const toTitleCase = (str: string): string => {
  if (!str) return '';
  const particles = ['de', 'do', 'da', 'dos', 'das', 'e'];
  return str.toLowerCase().split(' ').map((word, index) => {
    if (index > 0 && particles.includes(word)) return word;
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
};

/**
 * Obtém o nome formatado a partir de um e-mail (ex: jose.botelho@email.com -> Jose Botelho).
 */
export const getUserNameFromEmail = (email: string): string => {
  if (!email) return '';
  const namePart = email.split('@')[0];
  return namePart
    .split('.')
    .map(name => name.charAt(0).toUpperCase() + name.slice(1))
    .join(' ');
};
