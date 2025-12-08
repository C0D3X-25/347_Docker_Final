import os

# Read from environment variable, fallback to localhost for local development
API_BASE_URL = os.environ.get("BACKEND_URL", "http://localhost:8081")
