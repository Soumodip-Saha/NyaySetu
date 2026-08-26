"""
NyaySetu (न्यायसेतु / ন্যায়সেতু) - Hackspire 2026
AI-Powered Legal Service Routing & Explainable Professional Matching Platform
"""

import uvicorn
import os
import sys

if __name__ == "__main__":
    print("=" * 70)
    print("  ⚖️  NyaySetu (न्यायसेतु) - Hackspire 2026 Live Platform")
    print("  AI-Powered Legal Service Routing & Explainable Match Engine")
    print("=" * 70)
    print("  Starting server at: http://127.0.0.1:8000")
    print("  API Docs available at: http://127.0.0.1:8000/docs")
    print("=" * 70)

    uvicorn.run(
        "backend.app:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )
