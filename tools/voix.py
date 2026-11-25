#!/usr/bin/env python3
"""Génère la voix off d'un montage (synthèse vocale Piper) et cale les scènes dessus.

Dans le JSON, chaque scène peut avoir :
    "voix": [
        {"texte": "Tu connais le secret d'une peau toute douce ?", "sous_titres": ["le **secret**", "d'une peau **douce**"]},
        "Une phrase sans sous-titres."
    ]

Le script produit :
    scripts/build/<nom>.json      montage avec durées + sous-titres calés sur la voix
    scripts/build/<nom>-voix.wav  piste voix complète

Usage :
    python3 tools/voix.py scripts/pub-gommage-cafe.json [--modele voices/fr-siwis-medium.onnx] [--vitesse 1.0]
Puis :
    node tools/render.mjs scripts/build/pub-gommage-cafe.json
"""
import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
import wave
from array import array

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

ap = argparse.ArgumentParser()
ap.add_argument("script")
ap.add_argument("--modele", default=os.path.join(ROOT, "voices", "fr-siwis-medium.onnx"))
ap.add_argument("--piper", default=os.environ.get("PIPER", shutil.which("piper") or "piper"))
ap.add_argument("--vitesse", type=float, default=1.0, help=">1 = plus rapide")
ap.add_argument("--pause", type=float, default=0.22, help="silence entre deux phrases (s)")
args = ap.parse_args()

if not os.path.exists(args.modele):
    sys.exit(f"Modèle de voix introuvable : {args.modele}\n"
             "Télécharge-le : voir README (section Voix off).")

src = os.path.abspath(args.script)
cfg = json.load(open(src, encoding="utf-8"))
name = os.path.splitext(os.path.basename(src))[0]
out_dir = os.path.join(os.path.dirname(src), "build")
os.makedirs(out_dir, exist_ok=True)
tmp = tempfile.mkdtemp(prefix="voix-")


def synth(text, path):
    subprocess.run([args.piper, "-m", args.modele, "-f", path, "--length-scale", str(1 / args.vitesse)],
                   input=text.encode("utf-8"), check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    with wave.open(path) as w:
        sr = w.getframerate()
        pcm = array("h", w.readframes(w.getnframes()))
    # retire les silences de début / fin
    thr = 300
    a = next((i for i, v in enumerate(pcm) if abs(v) > thr), 0)
    b = len(pcm) - next((i for i, v in enumerate(reversed(pcm)) if abs(v) > thr), 0)
    a = max(0, a - int(sr * .03))
    b = min(len(pcm), b + int(sr * .08))
    return sr, pcm[a:b]


words = lambda s: max(1, len(s.replace("*", "").split()))

track, sr = [], 22050
t_global = 0.0
n = 0
for sc in cfg["scenes"]:
    lines = sc.get("voix") or []
    if not lines:
        t_global += sc.get("duration", 4)
        continue
    lead = sc.get("voixDebut", 0.35)
    t = lead
    caps = []
    for ln in lines:
        if isinstance(ln, str):
            ln = {"texte": ln}
        n += 1
        sr, pcm = synth(ln["texte"], os.path.join(tmp, f"{n}.wav"))
        d = len(pcm) / sr
        track.append((t_global + t, pcm))
        subs = ln.get("sous_titres") or []
        if subs:
            weights = [words(s) for s in subs]
            acc = 0
            for s, wgt in zip(subs, weights):
                caps.append({"text": s, "at": round(t + d * acc / sum(weights), 3)})
                acc += wgt
        print(f"  {d:4.1f} s  {ln['texte']}")
        t += d + args.pause
    dur = max(sc.get("duration", 0), t - args.pause + sc.get("voixFin", 0.45))
    if caps:
        sc["captions"] = caps  # les sous-titres calés sur la voix remplacent ceux écrits à la main
    sc["duration"] = round(dur, 3)
    t_global += dur

total = t_global
buf = array("h", bytes(2 * int(total * sr + sr)))
for start, pcm in track:
    o = int(start * sr)
    buf[o:o + len(pcm)] = pcm
voice_path = os.path.join(out_dir, f"{name}-voix.wav")
with wave.open(voice_path, "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(sr)
    w.writeframes(buf.tobytes())

# chemins relatifs : le JSON généré est dans build/, on remonte d'un dossier
fix = lambda p: (p if not p or p.startswith(("http", "data:", "/")) else os.path.relpath(os.path.join(os.path.dirname(src), p), out_dir))
cfg["avatar"] = fix(cfg.get("avatar"))
cfg.setdefault("audio", {})
cfg["audio"]["musique"] = fix(cfg["audio"].get("musique"))
cfg["audio"]["voix"] = os.path.basename(voice_path)
for sc in cfg["scenes"]:
    if sc.get("image"):
        sc["image"] = fix(sc["image"])
out_json = os.path.join(out_dir, f"{name}.json")
json.dump(cfg, open(out_json, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
shutil.rmtree(tmp, ignore_errors=True)
print(f"✔ {total:.1f} s de montage\n  {os.path.relpath(out_json, ROOT)}\n  {os.path.relpath(voice_path, ROOT)}")
