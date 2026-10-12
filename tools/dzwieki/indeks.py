# Indeks próbek Freesound (CC0 i inne) z zbioru benjamin-paine/freesound-laion-640k bez pobierania audio: z plików parquet
# czytamy przez HTTP tylko kolumny z opisem (tytuł, tagi, licencja, id). 'row' = numer wiersza w podziale train (do pobrania
# pojedynczej próbki przez datasets-server, wybierz.py fetch).   python3 tools/dzwieki/indeks.py  ->  tools/dzwieki/.cache/indeks.jsonl
import os, json, fsspec, pyarrow.parquet as pq
from concurrent.futures import ThreadPoolExecutor
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, '.cache', 'indeks.jsonl')
URL = 'https://huggingface.co/datasets/benjamin-paine/freesound-laion-640k/resolve/main/data/train-{:05d}-of-01352.parquet'
fs = fsspec.filesystem('https')
def meta(k):
    for _ in range(3):
        try:
            f = pq.ParquetFile(fs.open(URL.format(k), block_size=1 << 18)); t = f.read(columns=['title', 'tags', 'username', 'freesound_id', 'license'])
            return k, f.metadata.num_rows, t.to_pylist()
        except Exception as e: err = e
    print('błąd', k, err); return k, 0, []
with ThreadPoolExecutor(24) as ex: res = sorted(ex.map(meta, range(1352)))
off, n = 0, 0
with open(OUT, 'w') as o:
    for k, rows, lst in res:
        for i, r in enumerate(lst): r['row'] = off + i; r['description'] = ''; o.write(json.dumps(r, ensure_ascii=False) + '\n'); n += 1
        off += rows
print('próbek:', n, '->', OUT)
