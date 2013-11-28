import os

from flask import url_for
from flask.ext.login import LoginManager
from kvkit import NotFoundError

from .models import User
from .utils import jsonify
from settings import STATIC_FOLDER, APP_FOLDER, LOADED_MODULES

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


def get_files_from_module(module, type, ext=None, excludes=tuple()):
  if ext is None:
    ext = type
  path = os.path.join(APP_FOLDER, "projecto", "apiv1", module, "static", type)
  for root, subdir, filenames in os.walk(path):
    for fname in filenames:
      if fname.endswith(ext) and fname not in excludes:
        yield fname


def get_files_in_directory(path, ext=None, excludes=[], fname_only=False):
  prefix_length = len(STATIC_FOLDER) + 1
  for root, subdir, filenames in os.walk(os.path.join(STATIC_FOLDER, path)):
    for fname in filenames:
      if (ext is None or fname.endswith(ext)) and fname not in excludes:
        yield fname if fname_only else root[prefix_length:] + "/" + fname


_partials = None
partials = lambda: _partials


def register_assets(app):
  _css_files = ["css/base.css", "css/app.css"]
  for module in LOADED_MODULES:
    for fname in get_files_from_module(module, "css", "css"):
      _css_files.append("api_v1_" + module + "/css/" + fname)

  css_all = Bundle(
      *_css_files,
      filters="cssmin",
      output="css/app.min.css"
  )

  _js_files = list(get_files_in_directory("js/develop", ".js", excludes=["app.min.js", "app.js"]))
  for module in LOADED_MODULES:
    for fname in get_files_from_module(module, "js", "js"):
      _js_files.append("api_v1_" + module + "/js/" + fname)

  js_all = Bundle("js/develop/app.js", *_js_files, filters="uglifyjs", output="js/app.min.js")

  assets.init_app(app)
  # work around bug https://github.com/miracle2k/flask-assets/issues/54
  assets.app = app
  assets.auto_build = app.debug
  assets.debug = app.debug
  assets.register("js_all", js_all)
  assets.register("css_all", css_all)
  if not app.debug:
    partials_template = '<script id="{path}" type="text/ng-template">{content}</script>'
    global _partials
    _partials = ""
    for module in LOADED_MODULES:
      for fname in get_files_from_module(module, "partials", "html"):
        # TODO: look at this hack.
        with app.test_request_context():
          path = url_for("api_v1_" + module + ".static", filename="partials/" + fname)

        with open(os.path.join(APP_FOLDER, "projecto", "apiv1", module, "static", "partials", fname)) as g:
          content = g.read()
        _partials += partials_template.format(path=path, content=content)

    css_all.build()
    js_all.build()
