from __future__ import absolute_import

from hashlib import md5

from flask.ext.login import UserMixin
from kvkit import (
  Document, EmDocument,
  StringProperty,
  DictProperty,
  DateTimeProperty,
  BooleanProperty,
  ReferenceProperty,
  ListProperty,
)
from kvkit.backends import riak as riak_backend
import riak

from settings import DATABASES, RIAK_NODES


# Global models.py file.
#
# Q: What should go in here?
# A: Any model that needs to be refered by multiple modules. Or any models that
#    doesn't have a module associated with.


class BaseDocument(Document):
  _backend = riak_backend

rc = riak.RiakClient(protocol="pbc", nodes=RIAK_NODES)


class Signup(BaseDocument):
  _riak_options = {"bucket": rc.bucket(DATABASES["signups"])}

  date = DateTimeProperty()


class User(BaseDocument, UserMixin):
  _riak_options = {"bucket": rc.bucket(DATABASES["users"])}

  name = StringProperty(default="A New User :)")
  emails = ListProperty(index=True)
  avatar = StringProperty()

  def serialize_for_client(self):
    return self.serialize(restricted=("emails", ), include_key=True)

  @classmethod
  def register_or_login(cls, email):
    user = list(cls.index_keys_only("emails", email))
    if len(user) == 0:
      user = cls(data={"emails": [email]})
      user.avatar = md5(email).hexdigest()
      user.save()
    else:
      user = cls.get(user[0])
    return user

  def get_id(self):
    return self.key


class Project(BaseDocument):
  _riak_options = {"bucket": rc.bucket(DATABASES["projects"])}

  name = StringProperty()
  desc = StringProperty()

  owners = ListProperty(index=True)
  collaborators = ListProperty(index=True)
  unregistered_owners = ListProperty(index=True)
  unregistered_collaborators = ListProperty(index=True) # These are users that have not registered onto projecto


class Content(EmDocument):
  title = StringProperty()
  content = StringProperty()
  author = ReferenceProperty(User, index=True, load_on_demand=True)
  date = DateTimeProperty()
  parent = StringProperty(index=True)

  def serialize_for_client(self, include_comments="expand"):
    item = self.serialize(restricted=("parent", "author"), include_key=True)
    item["author"] = self.author.serialize_for_client()

    if include_comments == "expand":
      item["children"] = children = []
      for comment in Comment.index("parent", self.key):
        serialized_comment = comment.serialize(restricted=("parent", "author"), include_key=True)
        serialized_comment["author"] = comment.author.serialize_for_client()
        children.append(serialized_comment)
        children.sort(key=lambda x: x["date"])
    elif include_comments == "keys":
      item["children"] = list(Comment.index_keys_only("parent", self.key))
    return item


class Comment(BaseDocument, Content):
  _riak_options = {"bucket": rc.bucket(DATABASES["comments"])}


class Todo(BaseDocument, Content):
  _riak_options = {"bucket": rc.bucket(DATABASES["todos"])}

  parent = ReferenceProperty(Project, index=True, load_on_demand=True)
  assigned = ReferenceProperty(User, index=True, load_on_demand=True)
  due = DateTimeProperty(default=lambda: None)
  tags = ListProperty(index=True)
  done = BooleanProperty(default=False)
  content = DictProperty() # markdown -> markdown, html -> html

  # For this, to avoid things like spaces in the name, we use the md5 of the name.
  milestone = StringProperty(index=True)

  def archive(self):
    archived_item = ArchivedTodo(key=self.key, data=self)
    archived_item.save()
    self.delete()
    return archived_item


class ArchivedTodo(Todo):
  _riak_options = {"bucket": rc.bucket(DATABASES["archived_todos"])}
