import os
from pathlib import Path
from dotenv import load_dotenv

# Search for .env in current dir, parent dir, or root of project
root_dir = Path(__file__).resolve().parent.parent.parent
env_paths = [
    Path.cwd() / ".env",
    Path(__file__).resolve().parent.parent / ".env",
    root_dir / ".env",
]

for p in env_paths:
    if p.exists():
        load_dotenv(dotenv_path=p, override=True)
        break

class Settings:
    PROJECT_NAME: str = "JobScout AI"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "AI-Powered Job and Internship Finder Using TinyFish"
    
    # TinyFish API settings
    TINYFISH_API_KEY: str = os.getenv("TINYFISH_API_KEY", "").strip()
    TINYFISH_SEARCH_ENDPOINT: str = "https://api.search.tinyfish.ai"
    TINYFISH_FETCH_ENDPOINT: str = "https://api.fetch.tinyfish.ai"
    
    # SQLite Database
    DB_PATH: Path = Path(__file__).resolve().parent.parent / "jobscout.db"
    
    # Live Search Constraints
    MAX_SEARCH_RESULTS: int = 15
    MAX_URLS_TO_FETCH: int = 6
    FETCH_TIMEOUT_MS: int = 15000
    REQUEST_TIMEOUT_SECONDS: float = 25.0
    
    # Rate Limiting & Safety
    MAX_QUERIES_PER_MINUTE: int = 20

settings = Settings()

def reload_settings_key(new_key: str):
    """Updates key in memory and .env file."""
    settings.TINYFISH_API_KEY = new_key.strip()
    os.environ["TINYFISH_API_KEY"] = new_key.strip()
    
    # Also write to local .env file for persistence
    env_file = Path(__file__).resolve().parent.parent / ".env"
    try:
        lines = []
        if env_file.exists():
            for line in env_file.read_text(encoding="utf-8").splitlines():
                if not line.startswith("TINYFISH_API_KEY="):
                    lines.append(line)
        lines.append(f"TINYFISH_API_KEY={new_key.strip()}")
        env_file.write_text("\n".join(lines) + "\n", encoding="utf-8")
    except Exception as e:
        print(f"Warning: Could not save .env: {e}")
