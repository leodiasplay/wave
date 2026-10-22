# Diretriz de Build do Expo / EAS

Sempre que concluir alterações no aplicativo Wave e enviar para o repositório Git, execute também a inicialização da compilação da nova build do APK no EAS / expo.dev:

```bash
npx eas build -p android --profile preview --no-wait --non-interactive
```

Isso garante que o painel do `expo.dev` e o link do novo APK estejam sempre sincronizados com a versão mais recente do código.
