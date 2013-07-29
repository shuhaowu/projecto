import os

APP_FOLDER = os.path.dirname(os.path.abspath(__file__))
STATIC_FOLDER = os.path.join(APP_FOLDER, "static")
TEMPLATES_FOLDER = os.path.join(APP_FOLDER, "templates")
DATABASES_FOLDER = os.path.join(APP_FOLDER, "databases")

_dbs_to_add = ('USERS', 'PROJECTS', 'FEED', 'COMMENTS', 'TODOS', 'ARCHIVED_FEED')
DATABASES = {dbname: (os.path.join(DATABASES_FOLDER, dbname.lower()), os.path.join(DATABASES_FOLDER, dbname.lower() + ".indexes")) for dbname in _dbs_to_add}
TESTING = False

def get_all_js_uncompiled():
  scripts = []
  scripts.append("/static/js/develop/app.js")   # must be the 1st script
  prefix_length = len(APP_FOLDER)
  for root, subdirs, files in os.walk(os.path.join(APP_FOLDER, "static/js/develop")):
    for fname in files:
      if fname.endswith(".js") and fname != "app.js":
        scripts.append(root[prefix_length:] + "/" + fname)

  return scripts

def get_all_partials():
  partials = []
  prefix_length = len(APP_FOLDER)
  for root, subdirs, files in os.walk(os.path.join(APP_FOLDER, "static/partials")):
    for fname in files:
      if fname.endswith(".html"):
        partials.append(root[prefix_length:] + "/" + fname)

  return partials

MINIFIED_JS_PATH = "/static/js/app.js"
MINIFIED_PARTIALS_PATH = "all_partials.html"

try:
  from serversettings import *
except ImportError:
  pass

try:
  from devsettings import *
except ImportError:
  pass