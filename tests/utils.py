from cStringIO import StringIO
import json
import shutil
from unittest import TestCase
import os

from flask import request
from flask.ext.login import login_user, logout_user
from werkzeug.datastructures import FileStorage
import riak

from projecto import app
from projecto.extensions import csrf
from projecto.models import (
    User,
    Project,
    FeedItem,
    Todo,
    Comment,
    File
)
import settings

CSRF_SET = False

# For login during testing
@app.route("/test-login", methods=["POST"])
def test_login():
  email = request.form.get("email")
  user = User.register_or_login(email)
  login_user(user)
  return "ok"

@app.route("/test-logout", methods=["POST"])
def test_logout():
  logout_user()
  return "ok"

class FlaskTestCase(TestCase):
  def setUp(self):
    global CSRF_SET
    self.loggedin = False
    self.app = app
    # Setting this will allow us to stop validating CSRF.
    self.app.config["CSRF_DISABLE"] = True
    self.app.config["LOGIN_DISABLED"] = False

    # See https://github.com/maxcountryman/flask-login/issues/157
    # Remove when ready.
    self.app.login_manager._login_disabled = False
    if not CSRF_SET:
      csrf.init_app(self.app)
      CSRF_SET = True
    self.client = app.test_client()
    # Sets up a context so the request don't get destroyed during the request
    # for things such as login.
    self.user = self.create_user("test@test.com")

  def tearDown(self):
    # We try to logout the user and then end the request context.
    self.logout()

  def assertStatus(self, status_code, response):
    self.assertEquals(status_code, response.status_code)

  def assertRedirect(self, redirect, response):
    self.assertTrue(response.status_code in (301, 302))
    # TODO: this might be.. troublesome
    self.assertTrue(response.location.endswith(redirect))

  def create_user(self, email):
    return User.register_or_login(email)

  def login(self, user=None):
    """Logs in user. If user is none it uses self.user"""
    # Only includes the first email for now
    user = user if user else self.user
    self.client.post("/test-login", data={"email": user.emails[0]}, follow_redirects=True)

  def logout(self):
    """Logs out currently logged in user"""
    self.client.post("/test-logout", follow_redirects=True)

  def _setup_request(self, kwargs):
    if "content_type" not in kwargs:
      kwargs["content_type"] = "application/json"
      if "data" in kwargs and kwargs["data"]:
        kwargs["data"] = json.dumps(kwargs["data"])

  def _get_json_from_response(self, response, valid_response=(200, )):
    if response.data and response.status_code in valid_response:
      return response, json.loads(response.data)
    return response, response.data

  def postJSON(self, *args, **kwargs):
    """Convinient method that returns the response and a dictionary from a json
    response"""
    self._setup_request(kwargs)
    return self._get_json_from_response(self.client.post(*args, **kwargs))

  def putJSON(self, *args, **kwargs):
    """Convinient method that returns the response and a dictionary from a json
    response"""
    self._setup_request(kwargs)
    return self._get_json_from_response(self.client.put(*args, **kwargs))

  def deleteJSON(self, *args, **kwargs):
    """Convinient method that returns the response and a dictionary from a json
    response"""
    self._setup_request(kwargs)
    return self._get_json_from_response(self.client.delete(*args, **kwargs))

  def getJSON(self, *args, **kwargs):
    """Convinient method that returns the response and a dictionary from a json
    response"""
    return self._get_json_from_response(self.client.get(*args, **kwargs))

  def post(self, *args, **kwargs):
    """Convinient method for calling self.client.<method>."""
    return self.client.post(*args, **kwargs)

  def get(self, *args, **kwargs):
    """Convinient method for calling self.client.<method>."""
    return self.client.get(*args, **kwargs)

  def put(self, *args, **kwargs):
    """Convinient method for calling self.client.<method>."""
    return self.client.put(*args, **kwargs)

  def delete(self, *args, **kwargs):
    """Convinient method for calling self.client.<method>."""
    return self.client.delete(*args, **kwargs)

  def reset_database(self):
    """Resets the database. This will DELETE files on disk!

    Must be called before ANY actions are taken in a test case."""

    c = riak.RiakClient(protocol="pbc")
    for bucket in settings.DATABASES.itervalues():
      b = c.bucket(bucket)
      for key in b.get_keys():
        b.delete(key)

    files_folder = os.path.join(settings.APP_FOLDER, "test_userfiles")
    if os.path.exists(files_folder):
      shutil.rmtree(files_folder)

    os.mkdir(files_folder)

    File.FILES_FOLDER = files_folder
    self.user = self.create_user("test@test.com")


class ProjectTestCase(FlaskTestCase):
  def reset_database(self):
    FlaskTestCase.reset_database(self)
    self.project = None
    self.setup_project()

  def setup_project(self):
    if (not hasattr(self, "project")) or (not self.project):
      self.project = new_project(self.user, save=True)

  def setUp(self):
    FlaskTestCase.setUp(self)
    self.setup_project()

def new_project(user, **kwargs):
  save = kwargs.pop("save", False)
  key = kwargs.pop("key", None)
  if key:
    proj = Project(key=key, data=kwargs)
  else:
    proj = Project(data=kwargs)

  proj.owners.append(user.key)
  if save:
    proj.save()
  return proj

def new_feeditem(user, project, **kwargs):
  save = kwargs.pop("save", False)
  key = kwargs.pop("key", None)
  kwargs["parent"] = project

  if key:
    feeditem = FeedItem(key=key, data=kwargs)
  else:
    feeditem = FeedItem(data=kwargs)

  feeditem.author = user
  if save:
    feeditem.save()
  return feeditem

def new_comment(user, parent, **kwargs):
  save = kwargs.pop("save", False)
  key = kwargs.pop("key", None)
  kwargs["parent"] = parent
  if key:
    comment = Comment(key=key, data=kwargs)
  else:
    comment = Comment(data=kwargs)

  comment.author = user
  if save:
    comment.save()
  return comment

def new_todo(user, project, **kwargs):
  save = kwargs.pop("save", False)
  key = kwargs.pop("key", None)
  kwargs["parent"] = project

  if key:
    t = Todo(key=key, data=kwargs)
  else:
    t = Todo(data=kwargs)

  t.author = user
  if save:
    t.save()
  return t

def new_file(user, project, **kwargs):
  save = kwargs.pop("save", False)
  kwargs["author"] = user
  kwargs["project"] = project
  kwargs["path"] = kwargs.get("path", "/testfile.txt")
  kwargs["file"] = kwargs.get("file", FileStorage(StringIO("hello world"), "testfile.txt"))
  f = File.create(data=kwargs)

  if save:
    f.save()
  return f

def new_directory(user, project, **kwargs):
  save = kwargs.pop("save", False)
  kwargs["author"] = user
  kwargs["project"] = project
  kwargs["path"] = kwargs.get("path", "/testdir/")
  f = File.create(data=kwargs)

  if save:
    f.save()
  return f
