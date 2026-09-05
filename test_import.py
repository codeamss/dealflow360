#!/usr/bin/env python3
import sys
import os

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from main import app
    print("[SUCCESS] FastAPI app imported successfully!")
    print(f"[INFO] App title: {app.title}")
    print(f"[INFO] App version: {app.version}")
    print(f"[INFO] Docs available at: {app.docs_url}")
    print(f"[INFO] Number of routes: {len(app.routes)}")
except ImportError as e:
    print(f"[IMPORT ERROR] {e}")
except Exception as e:
    print(f"[ERROR] {e}")