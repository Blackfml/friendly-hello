# Friendly Hello — Spotify Companion

Cliente web independente para explorar o catálogo oficial do Spotify com uma interface responsiva.

## Estado atual

- Busca faixas reais pela Spotify Web API.
- Mostra título, artista, álbum, duração e capa retornados pelo Spotify, sem catálogo de demonstração ou banners inventados.
- Abre a faixa no Spotify usando o link oficial retornado pela API.
- Login via OAuth Authorization Code com PKCE (sem client secret no navegador).
- Perfil básico da conta e lista de músicas salvas, quando autorizados.
- Interface adaptada para celular e desktop; se não houver configuração ou resultados, o app explica o estado em vez de fabricar conteúdo.

## Configurar a API do Spotify

1. Crie/abra um app em [Spotify for Developers](https://developer.spotify.com/dashboard).
2. Copie o **Client ID** (não coloque Client Secret no frontend).
3. Crie as variáveis de ambiente a partir de `.env.example`:
   - `VITE_SPOTIFY_CLIENT_ID`
   - `VITE_SPOTIFY_REDIRECT_URI`
4. Cadastre exatamente o mesmo valor de `VITE_SPOTIFY_REDIRECT_URI` na lista **Redirect URIs** do app Spotify. Esquema, domínio, porta e barra final precisam coincidir.
5. Reinicie a prévia/dev server depois de configurar as variáveis.

No Lovable, configure essas variáveis em **Project settings / Environment variables** (o nome do menu pode variar), e registre a URL pública da prévia como Redirect URI no painel Spotify.

## Limites importantes do Spotify

- Apps em Development Mode exigem que a conta proprietária tenha Spotify Premium e, para apps novos, limitam a lista a até cinco usuários autorizados. Consulte as regras atuais no painel oficial.
- A reprodução dentro do Friendly Hello ainda não está implementada. Por enquanto, a faixa abre no Spotify; o app não simula que está tocando.
- A API pode negar recursos dependendo do modo de acesso, permissões e limites vigentes do Spotify.
- O token de acesso é mantido em `sessionStorage` nesta sessão do navegador. Não há Client Secret no frontend.

## Desenvolvimento

```sh
npm install
npm run dev
npm run lint
npm run test
npm run build
```

Projeto criado inicialmente com Lovable; o código-fonte é mantido neste repositório.
