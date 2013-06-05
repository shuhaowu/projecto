from __future__ import absolute_import
from settings import DATABASES
from flask.ext.login import UserMixin
import os.path
from hashlib import md5

from leveldbkit import (
  Document, EmDocument,
  StringProperty,
  DictProperty,
  DateTimeProperty,
  BooleanProperty,
  ReferenceProperty,
  ListProperty,
)

class User(Document, UserMixin):
  db = DATABASES["USERS"][0]
  indexdb = DATABASES["USERS"][1]

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
  db = DATABASES["PROJECTS"][0]
  indexdb = DATABASES["PROJECTS"][1]

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

  def serialize_for_client(self, include_comments="expand"):
    item = self.serialize(restricted=("parent"), include_key=True, expand=[{"restricted": ("emails", ), "include_key": True}])
    if include_comments == "expand":
      item["children"] = children = []
      for comment in Comment.index("parent", self.key):
        children.append(comment.serialize(restricted=("parent", ), include_key=True, expand=[{"restricted": ("emails", ), "include_key": True}]))
    elif include_comments == "keys":
      item["children"] = Comment.index_keys_only("parent", self.key)
    return item

class ArchivedFeedItem(Document, Content):
  db = DATABASES["ARCHIVED_FEED"][0]
  indexdb = DATABASES["ARCHIVED_FEED"][1]

  parent = ReferenceProperty(Project, index=True)
  type = StringProperty()

class FeedItem(Document, Content):
  db = DATABASES["FEED"][0]
  indexdb = DATABASES["FEED"][1]

  parent = ReferenceProperty(Project, index=True)
  type = StringProperty()

  def archive(self):
    archived_item = ArchivedFeedItem(key=self.key, data=self)
    archived_item.save()
    self.delete()
    return archived_item

class Comment(Document, Content):
  db = DATABASES["COMMENTS"][0]
  indexdb = DATABASES["COMMENTS"][1]

class Todo(Document, Content):
  db = DATABASES["TODOS"][0]
  indexdb = DATABASES["TODOS"][1]

  parent = ReferenceProperty(Project, index=True)
  assigned = ReferenceProperty(User, index=True)
  due = DateTimeProperty(default=lambda: None)
  tags = ListProperty(index=True)
  done = BooleanProperty(default=False)
  content = DictProperty() # markdown -> markdown, html -> html

  # For this, to avoid things like spaces in the name, we use the md5 of the name.
  milestone = StringProperty(index=True)

def establish_connections():
  User.establish_connection()
  Project.establish_connection()
  FeedItem.establish_connection()
  Comment.establish_connection()
  Todo.establish_connection()
  ArchivedFeedItem.establish_connection()

def close_connections():
  User.db, User.indexdb = DATABASES["USERS"]
  Project.db, Project.indexdb = DATABASES["PROJECTS"]
  FeedItem.db, FeedItem.indexdb = DATABASES["FEED"]
  Comment.db, Comment.indexdb = DATABASES["COMMENTS"]
  Todo.db, Todo.indexdb = DATABASES["TODOS"]
  ArchivedFeedItem.db, ArchivedFeedItem.indexdb = DATABASES["ARCHIVED_FEED"]

