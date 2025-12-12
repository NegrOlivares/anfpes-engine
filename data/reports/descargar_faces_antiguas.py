import requests
from pathlib import Path
import csv

# Lista de versiones (ordenadas de menor a mayor)
VERSIONS = [
    "3.00", "3.01", "3.02", "3.03", "3.04", "3.05", "3.06", "3.07", "3.08", "3.09", "3.10", "3.11", "3.12",
    "4.00", "4.01", "4.02", "4.03", "4.04", "4.05", "4.06", "4.07", "4.08", "4.09", "4.10", "4.11", "4.12"
]

# Todas las IDs que compartiste
FMIDS = [
    "7601284",
    "153994",
    "95079966",
    "902215",
    "2000167699",
    "5370511",
    "5680952",
    "5360698",
    "5385013",
    "5660389",
    "153977",
    "1200824",
    "5250111",
    "309270",
    "120976",
    "5280398",
    "8835877",
    "5290240",
    "5512565",
    "150127",
    "1009292",
    "457296",
    "145622",
    "2010119",
    "778081",
    "7100040",
    "7100073",
    "3900678",
    "2010131",
    "3900623",
    "2010145",
    "3900637",
    "106020",
    "775124",
    "3900425",
    "3900305",
    "3901016",
    "7100027",
    "783142",
    "144970",
    "23006948",
    "144973",
    "7920103",
    "7920418",
    "1021867",
    "5704751",
    "5131130",
    "6701339",
    "2005705",
    "2005492",
    "2005497",
    "128073",
    "7501700",
    "2015760",
    "8428755",
    "5370573",
    "915739",
    "10234",
    "7601408",
    "8444529",
    "919982",
    "3300663",
    "55002409",
    "116350",
    "34000617",
    "3503289",
    "8652",
    "910800",
    "3502929",
    "837151",
    "7988370",
    "705884",
    "2108801",
    "3994",
    "65",
    "837677",
    "115839",
    "6700672",
    "601086",
    "861862",
    "784424",
    "133263",
    "860867",
    "850256",
    "860961",
    "861366",
    "59145996",
    "15179",
    "850200",
    "7459580",
    "14655",
    "4210850",
    "318606",
    "1512097",
    "1503798",
    "413",
    "6701711",
    "4203261",
    "4209725",
    "67009094",
    "6701739",
    "4210245",
    "4210555",
    "14030",
    "1510161",
    "1508844",
    "8643",
    "2000211",
    "67020847",
    "67010817",
    "67018692",
    "812813",
    "1510984",
    "7448310",
    "4200948",
    "7453007",
    "4211119",
    "2004183",
    "114659",
    "15742",
    "675017",
    "1804927",
    "3877",
    "2105550",
    "8428682",
    "8428686",
    "15942",
    "19022095",
    "465076",
    "8476204",
    "2268",
    "8078",
    "106090",
    "1360",
    "2014470",
]

# Patrón de la URL siguiendo el mismo esquema que mostraste
# Si quieres tamaño completo, puedes quitar el ?width=100&height=100
BASE_URL = (
    "https://sortitoutsidospaces.b-cdn.net/megapacks/cutoutfaces/"
    "originals/{ver}/{fmid}.png?width=100&height=100"
)

# Carpeta donde se guardarán las imágenes
OUTPUT_DIR = Path("faces_antiguas")
OUTPUT_DIR.mkdir(exist_ok=True)

results = []

for fmid in FMIDS:
    print(f"\n== FMID {fmid} ==")
    found = False
    found_version = "N/A"

    for ver in VERSIONS:
        url = BASE_URL.format(ver=ver, fmid=fmid)
        print(f"  Probando versión {ver} -> {url}")

        try:
            resp = requests.get(url, stream=True, timeout=10)
        except requests.RequestException as e:
            print(f"    Error de red: {e} (se intenta siguiente versión)")
            continue

        if resp.status_code == 200:
            found = True
            found_version = ver
            filename = OUTPUT_DIR / f"A-{fmid}.png"
            with open(filename, "wb") as f:
                for chunk in resp.iter_content(8192):
                    if chunk:
                        f.write(chunk)
            print(f"    ENCONTRADO. Guardado como {filename}")
            break
        else:
            print(f"    {fmid} v{ver}: HTTP {resp.status_code}")

    results.append({
        "id": fmid,
        "descargado": 1 if found else 0,
        "version": found_version,
    })

# Generar informe TSV (tabulado) para abrir en Excel
tsv_path = Path("informe_faces.tsv")

with tsv_path.open("w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f, delimiter="\t")
    writer.writerow(["id", "descargado", "version"])
    for row in results:
        writer.writerow([row["id"], row["descargado"], row["version"]])

print(f"\nInforme generado en: {tsv_path.resolve()}")
print("Ábrelo en Excel seleccionando delimitador de tabulación.")

