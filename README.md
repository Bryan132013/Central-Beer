# Central Beer — site funcional

Este projeto reproduz o estilo das imagens enviadas e deixa:
- Promoções públicas.
- Eventos públicos.
- Botões para WhatsApp, Instagram e endereço/localização.
- Painel do dono.
- Controle de dívidas privado.
- Várias pessoas podem acessar o site ao mesmo tempo.

## Importante sobre as dívidas

O controle de dívidas NÃO fica em `localStorage`. Ele fica no banco do Supabase e é protegido por RLS. O público consegue ver promoções/eventos, mas não consegue consultar dívidas.

O único e-mail autorizado pelo banco é:
`bryanyttcontato@gmail.com`

## Como colocar no ar

### 1. Criar o banco
Crie uma conta/projeto no Supabase:
https://supabase.com/

Abra o **SQL Editor**, cole o conteúdo de `supabase.sql` e execute.

### 2. Ativar login por e-mail
No Supabase, vá em Authentication > Providers > Email e deixe o login por e-mail habilitado.

Use o e-mail:
`bryanyttcontato@gmail.com`

O painel usa um link mágico enviado para esse e-mail, sem precisar colocar senha no código.

### 3. Pegar as chaves
No Supabase, abra as configurações do projeto e procure a URL do projeto e a chave pública/anon.

Abra `app.js` e substitua:

`COLE_SUA_SUPABASE_URL_AQUI`

e

`COLE_SUA_SUPABASE_ANON_KEY_AQUI`

Não coloque a `service_role key` no site. Ela é secreta e não deve ser publicada.

### 4. Hospedar
Você pode colocar estes arquivos em:
- Netlify
- Vercel
- GitHub Pages

Depois de publicado, qualquer pessoa poderá abrir o endereço do site. O conteúdo público será o mesmo para todos porque está no Supabase.

### 5. Primeiro acesso do dono
Abra o site > **⚙️ Painel do dono** > envie o link de acesso > abra o e-mail `bryanyttcontato@gmail.com`.

Depois você poderá:
- adicionar/excluir promoções;
- adicionar/excluir eventos;
- adicionar dívidas;
- marcar dívida como paga;
- excluir dívidas.

## Links já configurados

WhatsApp:
https://chat.whatsapp.com/DU2RWm69NYEAzP2GH9P83F

Instagram:
https://www.instagram.com/centralbeer.va?igsh=MXBzajlmZzdhdHJ0eA==

Endereço/localização:
https://share.google/CEr6GQJzhNgHxoPt2
