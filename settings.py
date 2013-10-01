import os

DEBUG = False
HOST = os.environ.get("HOST", "127.0.0.1")
PORT = os.environ.get("PORT", 8800)

APP_FOLDER = os.path.dirname(os.path.abspath(__file__))
STATIC_FOLDER = os.path.join(APP_FOLDER, "static")
TEMPLATES_FOLDER = os.path.join(APP_FOLDER, "templates")
DATABASES_FOLDER = os.path.join(APP_FOLDER, "databases")

DATABASE_NAMES = (
    'USERS',
    'PROJECTS',
    'FEED',
    'COMMENTS',
    'TODOS',
    'ARCHIVED_FEED'
)


MAX_CONTENT_LENGTH = 20 * 1024 * 1024
SECRET_KEY = None

try:
  from settings_local import *
except ImportError:
  pass

DATABASES = {
  dbname: (os.path.join(DATABASES_FOLDER, dbname.lower()), os.path.join(DATABASES_FOLDER, dbname.lower() + ".indexes")) for dbname in DATABASE_NAMES
}

