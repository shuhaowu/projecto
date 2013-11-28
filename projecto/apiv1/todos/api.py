from __future__ import absolute_import

import math

from flask import Blueprint, request, abort
from flask.ext.login import current_user
from kvkit import NotFoundError

from ...models import Todo
from ...utils import ensure_good_request, project_access_required, jsonify, markdown_to_db

blueprint = Blueprint("api_v1_todos", __name__,
                      static_folder="static",
                      static_url_path="/static/todos")

meta = {
  "url_prefix": "/projects/<project_id>/todos"
}


@blueprint.route("/", methods=["POST"])
@project_access_required
@ensure_good_request({"title"}, {"title", "content", "assigned", "due", "tags"})
def post(project):
  todo = Todo(data=request.json)

  if todo.content:
    try:
      todo.content = markdown_to_db(todo.content)
    except TypeError:  # markdown conversion failed due to incorrect types
      return abort(400)

  todo.author = current_user._get_current_object()
  todo.parent = project
  todo.save()
  return jsonify(**todo.serialize_for_client("keys"))


@blueprint.route("/<id>", methods=["PUT"])
@project_access_required
@ensure_good_request(set(), {"title", "content", "assigned", "due", "tags"})
def put(project, id):
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
    todo.content = markdown_to_db(todo.content.get("markdown", ""))
  except TypeError:
    return abort(400)

  todo.save()
  return jsonify(**todo.serialize_for_client())

@blueprint.route("/", methods=["GET"])
@project_access_required
def index(project):
  try:
    amount = min(int(request.args.get("amount", 20)), 100)
    page = int(request.args.get("page", 1)) - 1
  except (TypeError, ValueError):
    return abort(400)

  todos = []
  showdone = request.args.get("showdone", "0")
  for todo in Todo.index("parent", project.key):
    if showdone == "0" and todo.done:
      continue

    todos.append(todo.serialize_for_client(include_comments="keys"))

  todos.sort(key=lambda x: x["date"], reverse=True)
  totalTodos = len(todos)

  return jsonify(todos=todos[page*amount:page*amount+amount],
                 currentPage=page+1,
                 totalTodos=totalTodos,
                 todosPerPage=amount)  # 10 todos perpage?


# also needs caching
@blueprint.route("/filter", methods=["GET"])
@project_access_required
def filter(project):
  tags = set(request.args.getlist("tags"))
  showdone = request.args.get("showdone", "0") == "1"
  shownotdone = request.args.get("shownotdone", "1") == "1"

  try:
    amount = min(int(request.args.get("amount", 20)), 100)
    page = int(request.args.get("page", 1)) - 1
  except (TypeError, ValueError):
    return abort(400)

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
  totalTodos = len(filtered)
  if (totalTodos < (page * amount + 1)):
    page = int(math.ceil(totalTodos / amount)) - 1
    if (page < 0):
      page = 0

  return jsonify(todos=filtered[page*amount:page*amount+amount],
                 currentPage=page+1,
                 totalTodos=totalTodos, todosPerPage=amount)


@blueprint.route("/<id>", methods=["DELETE"])
@project_access_required
def delete(project, id):
  try:
    todo = Todo.get(id)
    if todo.parent.key != project.key:
      raise NotFoundError
  except NotFoundError:
    return abort(404)

  todo.delete()
  return jsonify(status="okay")


@blueprint.route("/done", methods=["DELETE"])
@project_access_required
def clear_done(project):
  for todo in Todo.index("parent", project.key):
    if todo.done:
      todo.delete()

  return jsonify(status="okay")


@blueprint.route("/<id>", methods=["GET"])
@project_access_required
def get(project, id):
  try:
    todo = Todo.get(id)
    if todo.parent.key != project.key:
      raise NotFoundError
  except NotFoundError:
    return abort(404)

  return jsonify(**todo.serialize_for_client())


@blueprint.route("/<id>/markdone", methods=["POST"])
@project_access_required
@ensure_good_request({"done"}, {"done"})
def markdone(project, id):
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
@blueprint.route("/tags/", methods=["GET"])
@project_access_required
def list_tags(project):
  todos = Todo.index("parent", project.key)
  tags = set()
  for todo in todos:
    if todo.tags:
      for tag in todo.tags:
        tags.add(tag)

    return jsonify(tags=list(tags))