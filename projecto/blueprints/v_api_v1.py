from flask import Blueprint, request, abort
from flask.ext.login import login_required, current_user
from flask.ext.classy import FlaskView, route
import settings
import os

from leveldbkit import NotFoundError

from ..models import Project, FeedItem, Todo, Comment
from ..utils import jsonify, project_access_required, ensure_good_request, markdown_to_db

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

  @route("/", methods=["POST"])

  @ensure_good_request({"name"})
  @login_required
  def post(self):
    project = Project(data=request.json)
    project.owners.append(current_user.key)
    project.save()
    return jsonify(key=project.key)

  @route("/", methods=["GET"])
  @login_required
  def index(self):
    projects_owned = [project.serialize(restricted=("owners", "collaborators", "unregistered"), include_key=True) for project in Project.index("owners", current_user.key)]
    projects_participating = [project.serialize(restricted=("owners", "collaborators", "unregistered"), include_key=True) for project in Project.index("collaborators", current_user.key)]

    return jsonify(owned=projects_owned, participating=projects_participating)

  @route("/<id>", methods=["GET"])
  @login_required
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
  @ensure_good_request({"content"})
  def post(self, project):
    feeditem = FeedItem(data=request.json)
    # This is required as current_user is a werkzeug LocalProxy
    feeditem.author = current_user._get_current_object()
    feeditem.parent = project
    feeditem.save()
    return jsonify(**feeditem.serialize(restricted=("title", "parent", "author"), include_key=True))

  @route("/", methods=["GET"])
  def index(self, project):
    amount = max(request.args.get("amount", 20), 200)
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
      r.append(item.serialize(restricted=("title", "parent"), include_key=True, expand=[{"restricted": ("emails", ), "include_key": True}]))

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

class TodosView(FlaskView):
  route_base = "/projects/<project_id>/todos/"
  decorators = [project_access_required]

  @route("/", methods=["POST"])
  @ensure_good_request({"title"}, {"title", "content", "assigned", "due", "tags"})
  def post(self, project):
    todo = Todo(data=request.json)

    if todo.content:
      try:
        todo.content = markdown_to_db(todo.content)
      except TypeError: # markdown conversion failed due to incorrect types
        return abort(400)

    todo.author = current_user._get_current_object()
    todo.parent = project
    todo.save()
    return jsonify(**todo.serialize_for_client("keys"))

  @route("/<id>", methods=["PUT"])
  @ensure_good_request({"title"}, {"title", "content", "assigned", "due", "tags"})
  def put(self, project, id):
    try:
      todo = Todo.get(id)
      if todo.parent.key != project.key:
        raise NotFoundError
    except NotFoundError:
      return abort(404)

    # Right now, while being in pretty bad turbulence on an airplane to San Jose,
    # I would like to take a moment to appreciate how shitty my English is:
    #
    # > This method will treat all values with `None` as that it doesn't have
    # > values unless `merge_none` is True. That is, if a value is None and the key
    # > that it is associated to is defined as a property, the default value of that
    # > property will be used unless `merge_none == True`
    #
    # Wat.

    todo.merge(request.json)

    # TODO: We probably want to make this consistent with `post`
    try:
      todo.content = markdown_to_db(todo.content["markdown"])
    except TypeError:
      return abort(400)

    todo.save()
    return jsonify(**todo.serialize_for_client())

  @route("/", methods=["GET"])
  def index(self, project):
    todos = []
    showdone = request.args.get("showdown", "0")
    for todo in Todo.index("parent", project.key):
      if showdone == "0" and todo.done:
        continue

      todos.append(todo.serialize_for_client(include_comments="keys"))

    todos.sort(key=lambda x: x["date"], reverse=True)

    amount = max(request.args.get("amount", 20), 100)
    page = request.args.get("page", 1) - 1
    return jsonify(todos=todos[page*amount:page*amount+amount]) # 10 todos perpage?

  @route("/<id>", methods=["DELETE"])
  def delete(self, project, id):
    try:
      todo = Todo.get(id)
      if todo.parent.key != project.key:
        raise NotFoundError
    except NotFoundError:
      return abort(404)

    todo.delete()
    return jsonify(status="okay")

  @route("/<id>", methods=["GET"])
  def get(self, project, id):
    try:
      todo = Todo.get(id)
      if todo.parent.key != project.key:
        raise NotFoundError
    except NotFoundError:
      return abort(404)

    return jsonify(**todo.serialize_for_client())

  @route("/<id>/markdone", methods=["POST"])
  @ensure_good_request({"done"}, {"done"})
  def markdone(self, project, id):
    try:
      todo = Todo.get(id)
      if todo.parent.key != project.key:
        raise NotFoundError
    except NotFoundError:
      return abort(404)

    todo.done = request.json["done"]
    todo.save()
    return jsonify(status="okay")

TodosView.register(blueprint)

class ProfileView(FlaskView):

  @route("/changename", methods=["POST"])
  @ensure_good_request({"content"})
  @login_required
  def changename(self):
    current_user.name = request.json["name"]
    current_user.save()
    return jsonify(status="okay")

ProfileView.register(blueprint)

