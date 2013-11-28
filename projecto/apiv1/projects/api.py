from __future__ import absolute_import

from flask import request, abort
from flask.ext.login import current_user, login_required

from ..hacks import Blueprint
from ...models import Project, User
from ...utils import (
    ensure_good_request,
    project_access_required,
    project_managers_required,
    jsonify
)


blueprint = Blueprint("api_v1_projects", __name__,
                      static_folder="static",
                      static_url_path="/static/projects")

meta = {
  "url_prefix": "/projects"
}


@blueprint.route("/", methods=["POST"])
@ensure_good_request({"name"}, {"name"})
@login_required
def post():
  project = Project(data=request.json)
  project.owners.append(current_user.key)
  project.save()
  return jsonify(key=project.key)


@blueprint.route("/", methods=["GET"])
@login_required
def index():
  projects_owned = [project.serialize(restricted=("owners", "collaborators", "unregistered_collaborators", "unregistered_owners"), include_key=True) for project in Project.index("owners", current_user.key)]
  projects_participating = [project.serialize(restricted=("owners", "collaborators", "unregistered_collaborators", "unregistered_owners"), include_key=True) for project in Project.index("collaborators", current_user.key)]

  return jsonify(owned=projects_owned, participating=projects_participating)


@blueprint.route("/<project_id>", methods=["GET"])
@project_access_required
def get(project):
  if current_user.key in project.owners:
    return jsonify(**project.serialize(include_key=True))
  else:
    return jsonify(**project.serialize(restricted=("owners", "collaborators", "unregistered_collaborators", "unregistered_owners"), include_key=True))


@blueprint.route("/<project_id>/members", methods=["GET"])
@project_managers_required
def members(project):
  owners = []
  for key in project.owners:
    u = User.get(key)
    owners.append({"name": u.name, "email": u.emails[0]})

  collaborators = []
  for key in project.collaborators:
    u = User.get(key)
    collaborators.append({"name": u.name, "email": u.emails[0]})

  return jsonify(owners=owners, collaborators=collaborators, unregistered_owners=project.unregistered_owners, unregistered_collaborators=project.unregistered_collaborators)


@blueprint.route("/<project_id>/addowners", methods=["POST"])
@ensure_good_request({"emails"}, {"emails"})
@project_managers_required
def addowner(project):
  for email in request.json["emails"]:
    userkeys = list(User.index_keys_only("emails", email))
    if userkeys:
      project.owners.append(userkeys[0])
    else:
      project.unregistered_owners.append(email)

  project.save()
  return jsonify(status="okay")


@blueprint.route("/<project_id>/addcollaborators", methods=["POST"])
@ensure_good_request({"emails"}, {"emails"})
@project_managers_required
def addcollaborator(project):
  for email in request.json["emails"]:
    userkeys = list(User.index_keys_only("emails", email))
    if userkeys:
      project.collaborators.append(userkeys[0])
    else:
      project.unregistered_collaborators.append(email)

  project.save()
  return jsonify(status="okay")


@blueprint.route("/<project_id>/removeowners", methods=["POST"])
@ensure_good_request({"emails"}, {"emails"})
@project_managers_required
def removeowners(project):
  # this request should fail and not modify if there is an invalid email.
  # i.e. this request should be atomic.
  for email in request.json["emails"]:
    userkeys = list(User.index_keys_only("emails", email))
    if userkeys:
      if len(project.owners) == 1 and userkeys[0] == project.owners[0]:
        return abort(403)

      try:
        project.owners.remove(userkeys[0])
      except ValueError:
        return abort(404)
    else:
      try:
        project.unregistered_owners.remove(email)
      except ValueError:
        return abort(404)

  project.save()
  return jsonify(status="okay")


@blueprint.route("/<project_id>/removecollaborators", methods=["POST"])
@ensure_good_request({"emails"}, {"emails"})
@project_managers_required
def removecollaborators(project):
  for email in request.json["emails"]:
    userkeys = list(User.index_keys_only("emails", email))
    if userkeys:
      try:
        project.collaborators.remove(userkeys[0])
      except ValueError:
        return abort(404)
    else:
      try:
        project.unregistered_collaborators.remove(email)
      except ValueError:
        return abort(404)

  project.save()
  return jsonify(status="okay")
