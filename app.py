"""
Entrypoint alias for Streamlit Community Cloud.
Executes streamlit_app.py.
"""
import runpy
import sys
from pathlib import Path

streamlit_path = Path(__file__).parent / "streamlit_app.py"
runpy.run_path(str(streamlit_path), run_name="__main__")
