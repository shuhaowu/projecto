from __future__ import absolute_import
from settings import DATABASES
from flask.ext.login import UserMixin
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
  name = StringProperty()
  desc = StringProperty()

  owners = ListProperty(index=True)
  collaborators = ListProperty(index=True)
  unregistered_owners = ListProperty(index=True)
  unregistered_collaborators = ListProperty(index=True) # These are users that have not registered onto projecto

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
  parent = ReferenceProperty(Project, index=True)
  type = StringProperty()

class FeedItem(Document, Content):
  parent = ReferenceProperty(Project, index=True)
  type = StringProperty()

  def archive(self):
    archived_item = ArchivedFeedItem(key=self.key, data=self)
    archived_item.save()
    self.delete()
    return archived_item

  def delete(self, *args, **kwargs):
    """Overriden as we need to delete the children"""
    for comment in Comment.index("parent", self.key):
      comment.delete()

    return Document.delete(self, *args, **kwargs)

class Comment(Document, Content):
  pass

class Todo(Document, Content):
  parent = ReferenceProperty(Project, index=True)
  assigned = ReferenceProperty(User, index=True)
  due = DateTimeProperty(default=lambda: None)
  tags = ListProperty(index=True)
  done = BooleanProperty(default=False)
  content = DictProperty() # markdown -> markdown, html -> html

  # For this, to avoid things like spaces in the name, we use the md5 of the name.
  milestone = StringProperty(index=True)

ALL_MODELS = {
  User: "USERS",
  Project: "PROJECTS",
  FeedItem: "FEED",
  Comment: "COMMENTS",
  Todo: "TODOS",
  ArchivedFeedItem: "ARCHIVED_FEED"
}

def establish_connections():
  for model in ALL_MODELS:
    model.establish_connection()

def close_connections():
  """This method is named close_connections because if there is a LevelDB
  instance, resetting it will cause GC to destroy the instance, which will
  cause the underlying leveldb library to unlock the database.

  We need to use a modified version of werkzeug or else this won't be called
  and we will get a lock error everytime the development server reloads.

  Incidentally, we also can use this to easily populate all the dbs for each
  model as evident by the immediate calling after this method.
  """
  for model, name in ALL_MODELS.iteritems():
    model.db, model.indexdb = DATABASES[name]

# This actually sets up the models
close_connections()
