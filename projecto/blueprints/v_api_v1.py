from flask import Blueprint, request, abort
from flask.ext.login import login_required, current_user
from flask.ext.classy import FlaskView, route
import settings
import os

from leveldbkit import NotFoundError

from ..models import Project, FeedItem
from ..utils import jsonify, project_access_required

MODULE_NAME = "api_v1"
TEMPLATES_FOLDER = os.path.join(settings.TEMPLATES_FOLDER, MODULE_NAME)

blueprint = Blueprint(MODULE_NAME, __name__,
                      template_folder=TEMPLATES_FOLDER,
                      static_folder=settings.STATIC_FOLDER)

meta = {
  "url_prefix" : "/api/v1",
}

# Project APIs

class ProjectsView(FlaskView):
  decorators = [login_required]

  def post(self):
    if not request.json or len(request.json) != 1 or request.json.get("name") is None:
      return abort(400)

    project = Project(data=request.json)
    project.owners.append(current_user.key)
    project.save()
    return jsonify(key=project.key)

  def mine(self):
    projects_owned = [project.serialize(restricted=("owners", "collaborators", "unregistered"), include_key=True) for project in Project.index("owners", current_user.key)]
    projects_participating = [project.serialize(restricted=("owners", "collaborators", "unregistered"), include_key=True) for project in Project.index("collaborators", current_user.key)]

    return jsonify(owned=projects_owned, participating=projects_participating)

  def get(self, id):
    try:
      project = Project.get(id)
    except NotFoundError:
      return abort(404)
    else:
      if current_user.key in project.owners:
        return jsonify(**project.serialize(include_key=True))
      else:
        return jsonify(**project.serialize(restricted=("owners", "collaborators", "unregistered"), include_key=True))

ProjectsView.register(blueprint)

class FeedView(FlaskView):
  route_base = "/projects/<project_id>/feed/"
  decorators = [project_access_required]

  @route("/", methods=["POST"])
  def post(self, project):
    if not request.json or len(request.json) != 1 or request.json.get("content") is None:
      return abort(400)

    feeditem = FeedItem(data=request.json)
    # This is required as current_user is a werkzeug LocalProxy
    feeditem.author = current_user._get_current_object()
    feeditem.parent = project
    feeditem.save()
    return jsonify(**feeditem.serialize(restricted=("title", "parent", "author"), include_key=True))

  @route("/", methods=["GET"])
  def index(self, project):
    amount = max(request.args.get("amount", 20), 200)
    i = 0
    ttype = request.args.get("type")
    feed = []
    # OPTIMIZATION: this is slow if there are lots. We need compaction and so
    # forth.
    for feeditem in FeedItem.index("parent", project.key):
      if ttype is not None and feeditem.type != ttype:
        continue

      feed.append(feeditem)

    feed.sort(key=lambda item: item.date, reverse=True)
    feed = feed[:amount]

    r = []
    for item in feed:
      r.append(item.serialize(restricted=("title", "parent", "author"), include_key=True))
      r[-1]["author"] = {"key": item.author.key, "name": item.author.name, "avatar": item.author.avatar}

    return jsonify(feed=r)

  @route("/<id>", methods=["GET"])
  def get(self, project, id):
    pass

  @route("/<id>", methods=["DELETE"])
  def delete(self, project, id):
    try:
      feeditem = FeedItem.get(id)
    except NotFoundError:
      return abort(404)
    else:
      if current_user.key == feeditem.author.key or current_user.key in project.owners:
        feeditem.delete()
        return jsonify(status="okay")
      else:
        return abort(403)

FeedView.register(blueprint)

class ProfileView(FlaskView):

  @route("/changename", methods=["POST"])
  def changename(self):
    if not request.json or len(request.json) != 1 or request.json.get("name") is None:
      return abort(400)

    current_user.name = request.json["name"]
    current_user.save()
    return jsonify(status="okay")

ProfileView.register(blueprint)