# Padrão de Deploy e Atualização do Wave (Servidor Hostinger & Mobile)

Este documento estabelece o **fluxo padronizado e obrigatório** de deploy e atualização do projeto **Wave** tanto para a versão Web na VPS da Hostinger quanto para o aplicativo mobile no EAS / Expo.

---

## 1. Fluxo Resumido de 4 Etapas

```
1. Verificação de Código & TypeScript
      │
2. Export Web & Empacotamento do ZIP (com tema Dark)
      │
3. Git Commit & Push (main e ajustes)
      │
4. Disparo do EAS Build (expo.dev) + Comando de 1 linha na Hostinger
```

---

## 2. Passo a Passo Detalhado

### Passo 1: Verificação de Tipos e Integridade
Antes de gerar qualquer artefato, verifique se não há erros no TypeScript:
```bash
npx tsc --noEmit
```

---

### Passo 2: Export Web & Empacotamento do Pacote de Deploy
1. **Compilar a versão web:**
   ```bash
   npx expo export --platform web --clear
   ```
2. **Endurecer o `dist/index.html` (Proteção contra Flash Branco):**
   Garantir que a tag `<style>` do `index.html` contenha fundo escuro nativo do Spotify antes de qualquer carregamento de scripts:
   ```css
   html, body, #root { background-color: #121212 !important; }
   ```
3. **Empacotar em `.zip` e `.tar.gz`:**
   Compactar todo o conteúdo da pasta `dist/` (com os arquivos na raiz do arquivo compactado) gerando:
   * `wave_web_update.zip`
   * `wave_web_update.tar.gz`
4. **Remover a pasta `dist/` temporária:**
   ```bash
   rm -rf dist
   ```

---

### Passo 3: Commit e Sincronização no Git
Adicionar as alterações de código e os pacotes `.zip`/`.tar.gz` e subir para o GitHub:
```bash
git add .
git commit -m "feat/fix: descricao clara das alteracoes"
git push origin main ajustes
```
*(Manter as branches `main` e `ajustes` sempre sincronizadas).*

---

### Passo 4: Disparo Automático no Expo EAS (`expo.dev`)
Sempre que alterações visuais ou funcionais forem subidas, disparar a compilação do APK no EAS:
```bash
npx eas build -p android --profile preview --no-wait --non-interactive
```
* Informar ao usuário o link direto gerado para acompanhar o build e baixar o `.apk`.

---

### Passo 5: Atualização na Hostinger (Comando de 1 Linha)
No terminal da VPS da Hostinger (via SSH), o comando a ser executado é:

```bash
cd /home/waveapp/htdocs/wave.insonia.online && curl -sL "https://raw.githubusercontent.com/leodiasplay/wave/main/wave_web_update.zip?v=$(date +%s)" -o wave_web_update.zip && unzip -o wave_web_update.zip && rm wave_web_update.zip && chown -R waveapp:waveapp /home/waveapp/htdocs/wave.insonia.online && echo ">>> WAVE WEB ATUALIZADO COM SUCESSO! <<<"
```

#### ⚠️ Detalhes Cruciais do Comando da Hostinger:
* **Parâmetro Anti-Cache obrigatório (`?v=$(date +%s)`):** A URL raw do GitHub possui cache CDN de até 5 minutos. Adicionar o timestamp Unix na query string força o download imediato da versão recém-commitada.
* **Descompactação com sobreescrita (`unzip -o`):** Garante a atualização dos arquivos sem pedir confirmação interativa.
* **Permissão de arquivos (`chown -R waveapp:waveapp`):** Mantém o usuário de execução correto para que o servidor web (Nginx/LiteSpeed) sirva os arquivos sem erro 403 Forbidden.

---

## 3. Alterações de Banco de Dados / Metadados

Caso uma alteração envolva atualização em massa no banco de dados (ex: renomeação de gêneros ou artistas):
1. **Via API autenticada:** Utilizar scripts com o token de produção (`POST /api/login`) para chamar os endpoints REST apropriados (`PUT /api/musicas/{id}` ou `/api/musicas/google-drive/sincronizar`).
2. **Via MySQL no servidor:**
   ```sql
   UPDATE musicas SET genero = 'Novo Genero' WHERE genero = 'Genero Antigo';
   ```
3. **Limpeza de cache no Laravel (se necessário):**
   ```bash
   php artisan optimize:clear
   ```
