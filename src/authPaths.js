// Mantém o usuário dentro do subdiretório do app hospedado no GitHub Pages.
export function getAuthRedirectUrl(base,origin){
  return new URL(base||'/',origin).toString()
}
