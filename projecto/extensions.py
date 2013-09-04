import os

from flask.ext.login import LoginManager
from leveldbkit import NotFoundError

from .models import User
from .utils import jsonify
from settings import STATIC_FOLDER, DEBUG, APP_FOLDER

login_manager = LoginManager()


@login_manager.user_loader
def load_user(user_key):
  try:
    return User.get(user_key)
  except NotFoundError:
    return None


@login_manager.unauthorized_handler
def unauthorized():
  return jsonify(status="forbidden"), 403

# CSRF reference
from flask.ext.seasurf import SeaSurf
csrf = SeaSurf()

# Assets
from flask.ext.assets import Environment, Bundle
assets = Environment()


def get_files_in_directory(path, ext=None, excludes=[]):
  prefix_length = len(STATIC_FOLDER) + 1
  for root, subdir, filenames in os.walk(os.path.join(STATIC_FOLDER, path)):
    for fname in filenames:
      if (ext is None or fname.endswith(ext)) and fname not in excludes:
        yield root[prefix_length:] + "/" + fname

_js_files = list(get_files_in_directory("js/develop", ".js", excludes=["app.min.js", "app.js"]))
js_all = Bundle("js/develop/app.js", *_js_files, filters="uglifyjs", output="js/app.min.js")

css_all = Bundle(
    "css/base.css",
    "css/app.css",
    filters="cssmin",
    output="css/app.min.css"
)


def register_assets(app):
  assets.init_app(app)
  # work around bug https://github.com/miracle2k/flask-assets/issues/54
  assets.app = app
  assets.auto_build = app.debug
  assets.debug = app.debug
  assets.register("js_all", js_all)
  assets.register("css_all", css_all)
  if not app.debug:
    partials_template = """
<script id="{path}" type="text/ng-template">
{content}
</script>
"""
    with open(os.path.join(APP_FOLDER, "all_partials.html"), "w") as f:
      for fname in get_files_in_directory("partials", ".html"):
        path = os.path.join(STATIC_FOLDER, fname)
        with open(path) as g:
          content = g.read()
        f.write(partials_template.format(path=path, content=content))

    css_all.build()
    js_all.build()

# Partials
if DEBUG:
  partials = None
else:
    with open(os.path.join(APP_FOLDER, "all_partials.html")) as f:
      partials = f.read()
