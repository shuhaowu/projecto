from flask import current_app, abort
import ujson


# ujson for both speed and compactness
def jsonify(**params):
  response = current_app.make_response(ujson.dumps(params))
  response.mimetype = "application/json"
  return response


# Project access control helpers

from functools import wraps
from leveldbkit import NotFoundError
from flask.ext.login import current_user
from .models import Project, User


def hook_user_to_projects(user):
  for email in user.emails:
    for project in Project.index("unregistered_owners", email):
      project.unregistered_owners.remove(email)
      project.owners.append(user.key)
      project.save()

    for project in Project.index("unregistered_collaborators", email):
      project.unregistered_collaborators.remove(email)
      project.collaborators.append(user.key)
      project.save()


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
  def wrapped(*args, **kwargs):
    project_id = kwargs.pop("project_id")
    if project_id is None:
      raise ValueError("Project_id is required! This is probably a programming error.")

    if not current_user.is_authenticated():
      return abort(403)

    try:
      project = Project.get(project_id)
    except NotFoundError:
      return abort(404)

    # Move users from unregistered to registered if found.
    for email in current_user.emails:
      for userkey in project.owners:
        if email in User.get(userkey).emails:
          return fn(project=project, *args, **kwargs)

      for userkey in project.collaborators:
        if email in User.get(userkey).emails:
          return fn(project=project, *args, **kwargs)

    return abort(403)
  return wrapped

def project_managers_required(fn):
  @wraps(fn)
  def wrapped(*args, **kwargs):
    project_id = kwargs.pop("project_id")
    if project_id is None:
      raise ValueError("Project_id is required! This is probably a programming error.")
    if not current_user.is_authenticated():
      return abort(403)

    try:
      project = Project.get(project_id)
    except NotFoundError:
      return abort(404)

    for email in current_user.emails:
      for userkey in project.owners:
        if email in User.get(userkey).emails:
          return fn(project=project, *args, **kwargs)

    return abort(403)
  return wrapped

from flask import request
from leveldbkit import ValidationError

def ensure_good_request(required_parameters, accepted_parameters=None):
  """Ensure that the request is good. aborts with 400 otherwise.

  accepted_parameters and required_parameters are both sets. If accepted_parameters is None,
  it is then the same as required_parameters. len(required_parameters) <= len(accepted_parameters)
  """

  if accepted_parameters is None:
    accepted_parameters = required_parameters

  def decorator(f):
    @wraps(f)
    def fn(*args, **kwargs):
      if not request.json or len(request.json) > len(accepted_parameters) or len(request.json) < len(required_parameters):
        return abort(400)

      parameters_provided = set(request.json.keys())
      if not (parameters_provided >= required_parameters) or not (parameters_provided <= accepted_parameters):
        return abort(400)

      try:
        return f(*args, **kwargs)
      except ValidationError:
        return abort(400)
    return fn

  return decorator

# Helper for markdown

import misaka
MARKDOWN_EXTENSIONS = misaka.EXT_FENCED_CODE | misaka.EXT_STRIKETHROUGH
HTML_FLAGS = misaka.HTML_ESCAPE | misaka.HTML_SMARTYPANTS | misaka.HTML_SAFELINK
def markdown_to_html(s):
  return misaka.html(s, MARKDOWN_EXTENSIONS, HTML_FLAGS)

def markdown_to_db(s):
  return {"markdown": s, "html": markdown_to_html(s)}