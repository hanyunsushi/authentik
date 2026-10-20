#!/usr/bin/env python3
"""Rebuild the visual changes on the deployed 2026.8.3 frontend contract."""

import argparse
import hashlib
import io
import json
import shutil
import subprocess
import tarfile
from pathlib import Path


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("destination", type=Path, help="A new isolated source directory")
    args = parser.parse_args()
    here = Path(__file__).resolve().parent
    root = here.parent.parent
    snapshot = json.loads((here / "snapshot.json").read_text())
    assert sha256(here / "frontend.patch") == snapshot["patch_sha256"]
    assert sha256(here / "links.ts") == snapshot["adapter_sha256"]
    for relative, digest in snapshot["shared_files"].items():
        if sha256(root / relative) != digest:
            raise RuntimeError(f"Shared asset changed; refresh the compatibility port: {relative}")
    destination = args.destination.resolve()
    destination.mkdir(parents=True, exist_ok=False)
    archive = subprocess.check_output(
        ["git", "archive", snapshot["base_commit"]], cwd=root
    )
    with tarfile.open(fileobj=io.BytesIO(archive)) as source:
        source.extractall(destination, filter="data")
    subprocess.run(
        ["git", "apply", "--whitespace=nowarn", str(here / "frontend.patch")],
        cwd=destination, check=True,
    )
    for relative in snapshot["shared_files"]:
        target = destination / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(root / relative, target)
    shutil.copy2(here / "links.ts", destination / "web/src/elements/sidebar/links.ts")
    print(json.dumps({"source": str(destination), "build_id": snapshot["build_id"]}))


if __name__ == "__main__":
    main()
