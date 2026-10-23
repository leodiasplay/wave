import os
import sqlite3
import json
import urllib.request
import time
import sys

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

print("====================================================================")
print("  SINCRONIZADOR DE FOTOS DE PERFIL DOS ARTISTAS VIA GOOGLE DRIVE")
print("====================================================================\n")

# 1. Autenticação na API de Produção
login_url = 'https://api.wave.insonia.online/api/login'
login_data = json.dumps({'login': 'leo@fimnance.com', 'password': '123'}).encode('utf-8')
login_req = urllib.request.Request(
    login_url,
    data=login_data,
    headers={'Content-Type': 'application/json', 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0'}
)

try:
    with urllib.request.urlopen(login_req) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        token = res['token']
    print("✓ Autenticado com sucesso na API de produção!")
except Exception as e:
    print(f"❌ Erro ao autenticar na API: {e}")
    sys.exit(1)

# 2. Localizar metadados do Google Drive local
local_appdata = os.environ.get('LOCALAPPDATA', '')
db_path = os.path.join(local_appdata, 'Google', 'DriveFS', '104036337294124951175', 'mirror_metadata_sqlite.db')

if not os.path.exists(db_path):
    # Procura banco do Drive em outros perfis se necessário
    drive_base = os.path.join(local_appdata, 'Google', 'DriveFS')
    if os.path.exists(drive_base):
        for sub in os.listdir(drive_base):
            candidate = os.path.join(drive_base, sub, 'mirror_metadata_sqlite.db')
            if os.path.exists(candidate):
                db_path = candidate
                break

cloud_by_filename = {}
if os.path.exists(db_path):
    try:
        con = sqlite3.connect(f'file:{db_path}?mode=ro', uri=True)
        cur = con.cursor()
        query = """
        SELECT p.value, s.cloud_id 
        FROM item_properties p 
        JOIN stable_ids s ON p.item_stable_id = s.stable_id 
        WHERE p.key = 'local-title'
        """
        cur.execute(query)
        rows = cur.fetchall()
        con.close()
        cloud_by_filename = {r[0]: r[1] for r in rows}
        print(f"✓ Metadados do Google Drive lidos com sucesso ({len(cloud_by_filename)} arquivos indexados no Drive)")
    except Exception as e:
        print(f"⚠️ Aviso ao ler banco local do Drive: {e}")

# 3. Ler fotos na pasta local de artistas
artistas_dir = r"D:\Meu Drive\AplicativoGeral\artistas"
if not os.path.exists(artistas_dir):
    os.makedirs(artistas_dir, exist_ok=True)
    print(f"✓ Pasta criada: {artistas_dir}")

arquivos_fotos = [
    f for f in os.listdir(artistas_dir) 
    if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))
]

print(f"\nFotos encontradas na pasta '{artistas_dir}': {len(arquivos_fotos)}")

if not arquivos_fotos:
    print("\n👉 Nenhuma foto encontrada na pasta ainda.")
    print("Para atualizar a foto de um artista:")
    print("  1. Coloque a foto dele em: D:\\Meu Drive\\AplicativoGeral\\artistas\\")
    print("  2. Salve com o nome exato do artista (ex: 'Vegas.jpg', 'Astrix.jpg', 'Samuel Moriero.jpg')")
    print("  3. Execute este script novamente: python sincronizar_fotos_artistas.py\n")

# 4. Preparar payload de atualização
itens_para_atualizar = []
for fname in arquivos_fotos:
    nome_artista = os.path.splitext(fname)[0].strip()
    cloud_id = cloud_by_filename.get(fname)
    
    if not cloud_id:
        print(f"⚠️ {fname}: Arquivo ainda sincronizando com o Google Drive (sem Cloud ID ainda)...")
        continue

    item = {
        'artista': nome_artista,
        'drive_file_id': cloud_id,
        'drive_url': f"https://drive.google.com/file/d/{cloud_id}/view",
        'foto_perfil_url': f"https://lh3.googleusercontent.com/d/{cloud_id}=s400",
    }
    itens_para_atualizar.append(item)

print(f"Total de fotos prontas para sincronizar com o banco: {len(itens_para_atualizar)}")

if itens_para_atualizar:
    sync_url = 'https://api.wave.insonia.online/api/musicas/artistas/sincronizar-fotos'
    payload = json.dumps({'artistas': itens_para_atualizar}).encode('utf-8')
    req = urllib.request.Request(
        sync_url,
        data=payload,
        headers={
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': f'Bearer {token}',
            'User-Agent': 'Mozilla/5.0'
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            resultado = json.loads(resp.read().decode('utf-8'))
            print("\n✓ SINCRONIZAÇÃO CONCLUÍDA COM SUCESSO!")
            print(f"  • Fotos atualizadas neste lote: {resultado.get('atualizados_neste_lote')}")
            print(f"  • Total de artistas cadastrados: {resultado.get('total_artistas')}")
            print(f"  • Artistas com foto oficial: {resultado.get('fotos_concluidas')} ({resultado.get('percentual_concluido')})")
            print(f"  • Artistas ainda pendentes: {resultado.get('fotos_pendentes')}")
    except Exception as e:
        print(f"❌ Erro ao enviar para a API: {e}")

print("\nConcluído!")
