from pathlib import Path
import os
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")

HA_URL = os.environ["HA_URL"]
HA_TOKEN = os.environ["HA_TOKEN"]
