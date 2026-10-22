# REGRA DE ARMAZENAMENTO DE MÚSICAS - WAVE MUSIC

> [!CAUTION]
> **REGRA ABSOLUTA E MANDATÓRIA DE ARQUITETURA:**  
> **NÃO SUBIR ARQUIVOS DE MÚSICA (.mp3, .wav, .flac, etc.) PARA O SERVIDOR DE PRODUÇÃO (VPS)!**  
> O disco da VPS deve permanecer limpo e exclusivo para o código-fonte, banco de dados e logs da aplicação.

---

## 1. Armazenamento Central: Google Drive

Todos os arquivos de áudio pertencentes à biblioteca musical do Wave devem ser armazenados exclusivamente no **Google Drive**.

- **Pasta Raiz na Nuvem:**  
  `https://drive.google.com/drive/folders/1V84DEMLrYdNnQ5fEXkeNbbTgwFsUqQ6U`
- **Pasta Sincronizada Local (Google Drive Desktop):**  
  `D:\Meu Drive\AplicativoGeral\musicas\`

---

## 2. Estrutura do Banco de Dados (`musicas`)

Toda música adicionada ao catálogo deve ser registrada no banco de dados com a origem apontando para o Google Drive:

| Coluna | Valor Esperado | Exemplo |
| :--- | :--- | :--- |
| `origem` | `'google_drive'` | `google_drive` |
| `drive_file_id` | ID do arquivo no Google Drive | `1ctPnlefLtuRkoDowpCqfx6KUGs5GNVVp` |
| `caminho_arquivo` | Prefixo `gdrive:` seguido do ID | `gdrive:1ctPnlefLtuRkoDowpCqfx6KUGs5GNVVp` |
| `drive_url` | URL de visualização do Google Drive | `https://drive.google.com/file/d/1ctPnlef.../view` |

---

## 3. Como Funciona o Streaming

O backend Laravel nunca armazena o arquivo de música em disco. O fluxo de áudio funciona assim:

```
[ App Wave (Web / Mobile) ]
            │
            ▼  (GET /api/musicas/{id}/stream)
[ Backend Laravel na VPS ]
            │
            ▼  (GoogleDriveMusicaService::gerarRespostaStream)
[ Google Drive Cloud (Stream direto por File ID) ]
            │
            ▼  (Retorno com suporte a HTTP 206 Partial Content)
[ Player do Usuário ]
```

1. O app solicita a reprodução da faixa: `/api/musicas/{id}/stream`.
2. O controller detecta `$musica->origem === 'google_drive'`.
3. O `GoogleDriveMusicaService` busca o stream diretamente do Google Drive usando o `drive_file_id`.
4. O áudio é repassado em tempo real com controle de *Range*, avanço rápido e retrocesso.
5. **Consumo de disco na VPS: ZERO bytes.**

---

## 4. Fluxo para Cadastrar Novas Músicas

Quando novas músicas forem adicionadas ao Wave:
1. **Adicionar no Google Drive:** Colocar os arquivos `.mp3` dentro da pasta sincronizada `D:\Meu Drive\AplicativoGeral\musicas\<Gênero>\<Artista>\`.
2. **Sincronização:** O aplicativo do Google Drive sincroniza os arquivos com a nuvem.
3. **Mapeamento de IDs:** Obter o `drive_file_id` gerado pelo Google Drive para cada música.
4. **Cadastro no Banco:** Executar o `INSERT` ou `UPDATE` no MySQL da VPS vinculando o `drive_file_id` e setando `origem = 'google_drive'`.
