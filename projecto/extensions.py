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
# The code here is mainly to automatically discover files.
# Actual production file building is done via Grunt.
# Partials, however, is built here.


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
        yield fname if fname_only else "/static/" + root[prefix_length:] + "/" + fname


def build_css_files(app):
  css_files = ["/static/css/base.css", "/static/css/app.css"]
  for module in LOADED_MODULES:
    for fname in get_files_from_module(module, "css", "css"):
      with app.test_request_context():
        css_files.append(url_for("api_v1_" + module + ".static", filename="css/" + fname))

  return css_files


def build_js_files(app):
  js_files = list(get_files_in_directory("js/develop", ".js", excludes=["app.min.js", "app.js"]))
  js_files.insert(0, "/static/js/develop/app.js")
  for module in LOADED_MODULES:
    for fname in get_files_from_module(module, "js", "js"):
      with app.test_request_context():
        js_files.append(url_for("api_v1_" + module + ".static", filename="js/" + fname))

  return js_files


def build_partials(app):
  partials_template = '<script id="{path}" type="text/ng-template">{content}</script>'
  partials = ""
  for module in LOADED_MODULES:
    for fname in get_files_from_module(module, "partials", "html"):
      # TODO: look at this hack.
      with app.test_request_context():
        path = url_for("api_v1_" + module + ".static", filename="partials/" + fname)

      with open(os.path.join(APP_FOLDER, "projecto", "apiv1", module, "static", "partials", fname)) as g:
        content = g.read()
      partials += partials_template.format(path=path, content=content)

  return partials
