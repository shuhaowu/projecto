import os

DEBUG = bool(int(os.environ.get("DEBUG", 0)))
TESTING = bool(int(os.environ.get("TESTING", 0)))

# could be dev, stage, or prod
SERVER_MODE = os.environ.get("SERVER_MODE", "dev")

HOST = os.environ.get("HOST", "127.0.0.1")
PORT = os.environ.get("PORT", 8800)

APP_FOLDER = os.path.dirname(os.path.abspath(__file__))
STATIC_FOLDER = os.path.join(APP_FOLDER, "static")
TEMPLATES_FOLDER = os.path.join(APP_FOLDER, "templates")
FILES_FOLDER = os.path.join(APP_FOLDER, "userfiles")

RIAK_NODES = [
  {
    "host": "127.0.0.1",
    "pb_port": 8087
  }
]

DATABASE_NAMES = (
    "USERS",
    "PROJECTS",
    "FEED",
    "COMMENTS",
    "TODOS",
    "ARCHIVED_FEED",
    "FILES",
    "SIGNUPS"
)

DATABASE_PREFIX = "test_" if TESTING else ""

MAX_CONTENT_LENGTH = 20 * 1024 * 1024
SECRET_KEY = None
SITE_URL = None

# To be removed when we are ready.
DISABLE_SIGNUP = False

try:
  from settings_local import *
except ImportError:
  pass

DATABASES = {}
for dbname in DATABASE_NAMES:
  dbname = dbname.lower()
  DATABASES[dbname] = DATABASE_PREFIX + dbname

if SECRET_KEY is None or SITE_URL is None:
  raise RuntimeError("SECRET_KEY and SITE_URL are required to run projecto!")
