#!/usr/bin/env python3
"""Copy the bundled entry image into the make.fun output directory."""

import os
import shutil
from pathlib import Path

source = Path(__file__).resolve().parent / "entry.png"
destination_dir = Path(os.environ.get("MAKEFUN_OUTPUT_DIR", "/output"))
destination_dir.mkdir(parents=True, exist_ok=True)
shutil.copyfile(source, destination_dir / "entry.png")
