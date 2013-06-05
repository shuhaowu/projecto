import os.path

APP_FOLDER = os.path.dirname(os.path.abspath(__file__))
STATIC_FOLDER = os.path.join(APP_FOLDER, "static")
TEMPLATES_FOLDER = os.path.join(APP_FOLDER, "templates")
DATABASES_FOLDER = os.path.join(APP_FOLDER, "databases")

_dbs_to_add = ('USERS', 'PROJECTS', 'FEED', 'COMMENTS', 'TODOS', 'ARCHIVED_FEED')
DATABASES = {dbname: (os.path.join(DATABASES_FOLDER, dbname.lower()), os.path.join(DATABASES_FOLDER, dbname.lower() + ".indexes")) for dbname in _dbs_to_add}

try:
  from serversettings import *
except ImportError:
  pass

try:
  from devsettings import *
except ImportError:
  pass