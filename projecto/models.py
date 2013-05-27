from __future__ import absolute_import
from settings import APP_FOLDER
from flask.ext.login import UserMixin
import os.path
from hashlib import md5

from leveldbkit import (
  Document, EmDocument,
  StringProperty,
  DictProperty,
  DateTimeProperty,
  NumberProperty,
  EmDocumentsListProperty,
  EmDocumentProperty,
  BooleanProperty,
  ReferenceProperty,
  ListProperty,
  Property
)

DATABASES_FOLDER = os.path.join(APP_FOLDER, "databases")
USERS = os.path.join(DATABASES_FOLDER, "users")
USERS_INDEXES = os.path.join(DATABASES_FOLDER, "users.indexes")

PROJECTS = os.path.join(DATABASES_FOLDER, "projects")
PROJECTS_INDEXES = os.path.join(DATABASES_FOLDER, "projects.indexes")

FEED = os.path.join(DATABASES_FOLDER, "feed")
FEED_INDEXES = os.path.join(DATABASES_FOLDER, "feed.indexes")

COMMENTS = os.path.join(DATABASES_FOLDER, "comments")
COMMENTS_INDEXES = os.path.join(DATABASES_FOLDER, "comments.indexes")

TODOS = os.path.join(DATABASES_FOLDER, "todos")
TODOS_INDEXES = os.path.join(DATABASES_FOLDER, "todos.indexes")

class User(Document, UserMixin):
  db = USERS
  indexdb = USERS_INDEXES

  name = StringProperty(default="Paranoid User")
  emails = ListProperty(index=True)
  avatar = StringProperty()

  @classmethod
  def register_or_login(cls, email):
    user = cls.index_keys_only("emails", email)
    if len(user) == 0:
      user = cls(data={"emails": [email]})
      user.avatar = md5(email).hexdigest()
      user.save()
    else:
      user = cls.get(user[0])
    return user

  def get_id(self):
    return self.key

class Project(Document):
  db = PROJECTS
  indexdb = PROJECTS_INDEXES

  name = StringProperty()
  desc = StringProperty()

  owners = ListProperty(index=True)
  collaborators = ListProperty(index=True)
  unregistered_owners = ListProperty()
  unregistered_collaborators = ListProperty() # These are users that have not registered onto projecto

class Content(EmDocument):
  title = StringProperty()
  content = StringProperty()
  author = ReferenceProperty(User, index=True)
  date = DateTimeProperty()
  parent = StringProperty(index=True)

class FeedItem(Document, Content):
  db = FEED
  indexdb = FEED_INDEXES

  parent = ReferenceProperty(Project, index=True)
  type = StringProperty()

class Comment(Document, Content):
  db = COMMENTS
  indexdb = COMMENTS_INDEXES

class Todo(Document, Content):
  db = TODOS
  indexdb = TODOS_INDEXES

  parent = ReferenceProperty(Project, index=True)
  assigned = ReferenceProperty(User, index=True)
  due = DateTimeProperty(default=lambda: None)
  tags = ListProperty(index=True)
  done = BooleanProperty(default=False)
  content = DictProperty() # markdown -> markdown, html -> html

  # For this, to avoid things like spaces in the name, we use the md5 of the name.
  milestone = StringProperty(index=True)

  def serialize_for_client(self, include_comments="expand"):
    t = self.serialize(restricted=("parent", ), include_key=True, expand=[{"restricted": ("emails", ), "include_key": True}])
    if include_comments == "expand":
      t["children"] = children = []
      for comment in Comment.index("parent", self.key):
        children.append(comment.serialize(comment.serialize(restricted=("parent", ), include_key=True, expand=[{"restricted": ("emails", ), "include_key": True}])))
    elif include_comments == "keys":
      t["children"] = Comment.index_keys_only("parent", self.key)
    return t


def establish_connections():
  User.establish_connection()
  Project.establish_connection()
  FeedItem.establish_connection()
  Comment.establish_connection()
  Todo.establish_connection()

def close_connections():
  User.db = USERS
  User.indexdb = USERS_INDEXES
  Project.db = PROJECTS
  Project.indexdb = PROJECTS_INDEXES
  FeedItem.db = FEED
  FeedItem.indexdb = FEED_INDEXES
  Comment.db = COMMENTS
  Comment.indexdb = COMMENTS_INDEXES
  Todo.db = TODOS
  Todo.indexdb = TODOS_INDEXES