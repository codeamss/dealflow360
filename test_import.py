#!/usr/bin/env python3
import sys
import os

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from main import app
    print("✅ FastAPI app imported successfully!")
    print(f"✅ App title: {app.title}")
    print(f"✅ App version: {app.version}")
    print(f"✅ Docs available at: {app.docs_url}")
    print(f"✅ Number of routes: {len(app.routes)}")
except ImportError as e:
    print(f"❌ Import error: {e}")
except Exception as e:
    print(f"❌ Error: {e}")