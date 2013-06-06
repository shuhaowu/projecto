from flask import Blueprint, request, abort
from flask.ext.login import login_required, current_user
from flask.ext.classy import FlaskView, route
import settings
import os

from leveldbkit import NotFoundError

from ..models import Project, FeedItem, Todo
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
  @ensure_good_request({"name"}, {"name"})
  @login_required
  def post(self):
    project = Project(data=request.json)
    project.owners.append(current_user.key)
    project.save()
    return jsonify(key=project.key)

  @route("/", methods=["GET"])
  @login_required
  def index(self):
    projects_owned = [project.serialize(restricted=("owners", "collaborators", "unregistered_collaborators", "unregistered_owners"), include_key=True) for project in Project.index("owners", current_user.key)]
    projects_participating = [project.serialize(restricted=("owners", "collaborators", "unregistered_collaborators", "unregistered_owners"), include_key=True) for project in Project.index("collaborators", current_user.key)]

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
        return jsonify(**project.serialize(restricted=("owners", "collaborators", "unregistered_collaborators", "unregistered_owners"), include_key=True))

ProjectsView.register(blueprint)

class FeedView(FlaskView):
  route_base = "/projects/<project_id>/feed/"
  decorators = [project_access_required]

  @route("/", methods=["POST"])
  @ensure_good_request({"content"}, {"content"})
  def post(self, project):
    feeditem = FeedItem(data=request.json)
    # This is required as current_user is a werkzeug LocalProxy
    feeditem.author = current_user._get_current_object()
    feeditem.parent = project
    feeditem.save()
    return jsonify(**feeditem.serialize(restricted=("title", "parent", "author"), include_key=True))

  @route("/", methods=["GET"])
  def index(self, project):
    try:
      amount = min(int(request.args.get("amount", 20)), 200)
    except (TypeError, ValueError):
      return abort(400)
    ttype = request.args.get("type")
    feed = []

    i = 0
    for feeditem in FeedItem.index("parent", project.key):
      if ttype is not None and feeditem.type != ttype:
        continue

      if i > 200:
        feeditem.archive()
        continue

      feed.append(feeditem.serialize_for_client("keys"))
      i += 1

    feed.sort(key=lambda item: item["date"], reverse=True)
    feed = feed[:amount]

    return jsonify(feed=feed)

  @route("/<id>", methods=["GET"])
  def get(self, project, id):
    try:
      feeditem = FeedItem.get(id)
      if feeditem.parent.key != project.key:
        raise NotFoundError
    except NotFoundError:
      return abort(404)
    else:
      return jsonify(**feeditem.serialize_for_client())

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
    try:
      amount = min(int(request.args.get("amount", 20)), 100)
      page = int(request.args.get("page", 1)) - 1
    except (TypeError, ValueError):
      return abort(400)

    todos = []
    showdone = request.args.get("showdown", "0")
    for todo in Todo.index("parent", project.key):
      if showdone == "0" and todo.done:
        continue

      todos.append(todo.serialize_for_client(include_comments="keys"))

    todos.sort(key=lambda x: x["date"], reverse=True)
    totalTodos = len(todos)

    return jsonify(todos=todos[page*amount:page*amount+amount], currentPage=page+1, totalTodos=totalTodos, todosPerPage=amount) # 10 todos perpage?

  # also needs caching
  @route("/filter", methods=["GET"])
  def filter(self, project):
    tags = set(request.args.getlist("tags"))
    showdone = request.args.get("showdone", "0") == "1"
    shownotdone = request.args.get("shownotdone", "1") == "1"

    # TODO: milestone based filters
    # TODO: time based filters

    todos = Todo.index("parent", project.key)
    filtered = []
    for todo in todos:
      if (not todo.done and shownotdone) or (showdone and todo.done):
        if len(todo.tags) == 0 and " " in tags:
          filtered.append(todo.serialize_for_client(include_comments="keys"))
          continue
        else:
          for tag in todo.tags:
            if tag in tags:
              filtered.append(todo.serialize_for_client(include_comments="keys"))
              break

    filtered.sort(key=lambda x: x["date"], reverse=True)

    return jsonify(todos=filtered)

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

  @route("/done", methods=["DELETE"])
  def clear_done(self, project):
    for todo in Todo.index("parent", project.key):
      if todo.done:
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

  # TODO: needs caching
  @route("/tags/", methods=["GET"])
  def list_tags(self, project):
    todos = Todo.index("parent", project.key)
    tags = set()
    for todo in todos:
      if todo.tags:
        for tag in todo.tags:
          tags.add(tag)

    return jsonify(tags=list(tags))

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

