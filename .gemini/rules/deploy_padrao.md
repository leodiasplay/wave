# Regra de Deploy: Servidor Hostinger e EAS Expo

Sempre que concluir alterações no projeto Wave:

1. Execute a validação de tipos: `npx tsc --noEmit`.
2. Compile a versão web: `npx expo export --platform web --clear`.
3. Garanta que `dist/index.html` possua o fundo escuro `#121212` injetado na tag `<style>`.
4. Compacte a pasta `dist` gerando `wave_web_update.zip` e `wave_web_update.tar.gz`, e apague a pasta `dist`.
5. Faça o commit e push nas branches `main` e `ajustes`.
6. Dispare imediatamente a nova build no EAS:
   ```bash
   npx eas build -p android --profile preview --no-wait --non-interactive
   ```
7. Forneça ao usuário o link de acompanhamento no `expo.dev` e o comando de atualização de 1 linha da Hostinger com o anti-cache:
   ```bash
   cd /home/waveapp/htdocs/wave.insonia.online && curl -sL "https://raw.githubusercontent.com/leodiasplay/wave/main/wave_web_update.zip?v=$(date +%s)" -o wave_web_update.zip && unzip -o wave_web_update.zip && rm wave_web_update.zip && chown -R waveapp:waveapp /home/waveapp/htdocs/wave.insonia.online && echo ">>> WAVE WEB ATUALIZADO COM SUCESSO! <<<"
   ```
