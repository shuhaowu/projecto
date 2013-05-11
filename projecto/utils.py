from flask import current_app, abort
import ujson

# ujson for both speed and compactness
def jsonify(**params):
  response = current_app.make_response(ujson.dumps(params))
  response.mimetype = "application/json"
  return response

# Getting script to inject
import os
from settings import DEBUG, APP_FOLDER

if DEBUG:
  def get_all_script_paths():
    scripts = []
    prefix_length = len(APP_FOLDER)
    for root, subdirs, files in os.walk(os.path.join(APP_FOLDER, "static/js/develop")):
      for fname in files:
        if fname.endswith(".js"):
          scripts.append(root[prefix_length:] + "/" + fname)

    return scripts
else:
  def get_all_script_paths():
    return ["/static/js/app.js"]

# CSRF reference
from flask.ext.seasurf import SeaSurf
csrf = SeaSurf()

# Project access control helpers

from functools import wraps
from leveldbkit import NotFoundError
from flask.ext.login import current_user
from .models import Project, User

def project_access_required(fn):
  """This will allow anyone who is currently registered in that project to
  access the project. Denying the rest. It requires a project_id. It will also
  resolve a project and pass that instance into the function as oppose to just
  passing project_id. Furthermore, if an user is found to be in unregistered,
  he will be moved into owner or participant list.

  This is a fairly heavy operation for now. We will probably need to speed it
  up in the future.
  """
  @wraps(fn)
  def wrapped(project_id, *args, **kwargs):
    if not current_user.is_authenticated():
      return abort(403)

    try:
      project = Project.get(project_id)
    except NotFoundError:
      return abort(404)

    for email in current_user.emails:
      if email in project.unregistered_owners:
        project.unregistered_owners.remove(email)
        project.owners.append(current_user.key)
        project.save()
        return fn(project, *args, **kwargs)
      elif email in project.unregistered_collaborators:
        project.unregistered_collaborators.remove(email)
        project.collaborators.append(current_user.key)
        project.save()
        return fn(project, *args, **kwargs)
      else:
        for userkey in project.owners:
          if email in User.get(userkey).emails:
            return fn(project, *args, **kwargs)

        for userkey in project.collaborators:
          if email in User.get(userkey).emails:
            return fn(project, *args, **kwargs)

    return abort(403)
  return wrapped