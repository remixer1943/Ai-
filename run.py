#!/usr/bin/env python3
"""Convenience launcher for the Ai助教 dev server."""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
NODE_MODULES = ROOT / "node_modules"


def run_cmd(cmd: list[str], *, check: bool = True) -> int:
    """Run a shell command in the project root."""
    print(f"\n$ {' '.join(cmd)}")
    return subprocess.run(cmd, cwd=ROOT, check=check).returncode


def ensure_dependencies() -> None:
    if NODE_MODULES.exists():
        return
    print("node_modules not found. Installing dependencies with npm install ...")
    run_cmd(["npm", "install"])


def start_dev_server(extra_args: list[str] | None = None) -> None:
    cmd = ["npm", "run", "dev"]
    if extra_args:
        cmd.extend(["--", *extra_args])
    print("\nStarting Vite dev server (Ctrl+C to stop)...")
    subprocess.run(cmd, cwd=ROOT, check=False)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Launch the Ai助教 dev server with a single command.")
    parser.add_argument("--host", default=None, help="Optional host value to forward to Vite (e.g. 0.0.0.0)")
    args = parser.parse_args(argv)

    if shutil.which("npm") is None:
        print("Error: npm is not available in PATH. Please install Node.js first.", file=sys.stderr)
        return 1

    try:
        ensure_dependencies()
        
        # Start the RAG backend service in the background
        print("Starting RAG Retrieval Service...")
        rag_process = subprocess.Popen([sys.executable, "rag_service.py"], cwd=ROOT)
        
        try:
            # Start the frontend dev server (blocking)
            extra = [args.host] if args.host else None
            start_dev_server(extra)
        finally:
            # Cleanup: stop the backend service when frontend stops or error occurs
            print("\nStopping RAG Retrieval Service...")
            rag_process.terminate()
            rag_process.wait()
            
    except subprocess.CalledProcessError as exc:
        return exc.returncode
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
