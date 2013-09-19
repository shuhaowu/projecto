from __future__ import absolute_import

from datetime import datetime
from hashlib import md5
import os

from flask.ext.login import UserMixin
from leveldbkit import (
  Document, EmDocument,
  StringProperty,
  DictProperty,
  DateTimeProperty,
  BooleanProperty,
  ReferenceProperty,
  ListProperty,
)
import werkzeug.utils

from settings import DATABASES


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

class File(Document):
  # Only this user and root can read this!
  MODE = 0600

  # This must be set by some initialization!
  FILES_FOLDER = None

  author = ReferenceProperty(User)
  date = DateTimeProperty(default=lambda: None)
  project = ReferenceProperty(Project)

  def __init__(self, key=None, *args, **kwargs):
    if not key:
      raise KeyError("You need to supply a key to the File model!")

    self._content = None
    self._is_directory = key.endswith("/")
    Document.__init__(self, key=key, *args, **kwargs)

  @classmethod
  def create(cls, data):
    path = data["path"]
    f = data.pop("file", None)

    key = cls.keygen(data["project"], path)
    o = cls(key=key, data=data)
    o._content = f
    return o

  @classmethod
  def keygen(cls, project, path):
    """Parses a path that is passed from the client securely.

    Returns a filesystem path as well as a key for db and if it is a directory.
    """
    path = path.lstrip("/")
    path = [werkzeug.utils.secure_filename(p.strip()) for p in path.split("/") if p.strip() not in ("..", ".")]
    path = "/".join(path)

    key = project.key + "`/" + path
    return key

  @property
  def path(self):
    return self.key.rsplit("`", 1)[1]

  @property
  def fspath(self):
    # recall that self.path is the path displayed to the user, which starts with /
    # if we use that, path.join will think it is an absolute path and fail
    return os.path.join(self.base_dir, self.path[1:])

  @property
  def base_dir(self):
    return os.path.join(File.FILES_FOLDER, self.project.key)

  @property
  def is_directory(self):
    return self.path[-1] == "/"

  def save(self, *args, **kwargs):
    # To prevent circular import.
    from .utils import safe_mkdirs
    fspath = self.fspath
    if not os.path.exists(fspath):
      # We have to do this.. Should PROBABLY move this to new_project
      # TODO: move this to new project
      safe_mkdirs(self.base_dir)

      if self.is_directory:
        safe_mkdirs(fspath)
      else:
        # TODO: we need to worry about race conditions here as well.
        if self._content:
          self._content.save(fspath)

    return Document.save(self, *args, **kwargs)

  @property
  def content(self):
    if self.is_directory:
      raise AttributeError("Directories do not have 'content'!")

    with open(self.fspath) as f:
      c = f.read()
    return c

  def update_content(self, content):
    """Updates the actual file.

    This method will call save and will immediately save the file"""
    if self.is_directory:
      raise AttributeError("Directories do not have 'content'!")

    with open(self.fspath, "w") as f:
      f.write(content)

    self.date = datetime.now()
    self.save()

  def delete(self, *args, **kwargs):
    """ Deletes from the file system too.

    If you delete a directory, be careful that you don't use any file object
    that's under that directory. That would cause a lot of errors.
    """
    # This is for moving only. In that we already removed that path.
    db_only = kwargs.pop("db_only", False)
    fspath = self.fspath
    if not db_only and not os.path.exists(fspath):
      raise ValueError("{} not found!".format(fspath))

    if self.is_directory:
      base_dir = os.path.join(File.FILES_FOLDER, self.project.key)
      l = len(base_dir)
      for root, subdirs, filenames in os.walk(fspath, topdown=False):
        for fname in filenames:
          p = os.path.join(root, fname)
          p = p[l:]
          key = File.keygen(self.project, p)
          File.get(key).delete(db_only=db_only)

        if root != fspath:
          p = root[l:] + "/" # os walk does not have the trailing slash
          key = File.keygen(self.project, p)
          File.get(key).delete(db_only=db_only)

      if not db_only:
        os.rmdir(fspath) # suppose to fail if it is not empty.
    else:
      if not db_only:
        os.unlink(fspath)

    return Document.delete(self, *args, **kwargs)

  @property
  def children(self):
    fspath = self.fspath

    if self.is_directory:
      base_dir = os.path.join(File.FILES_FOLDER, self.project.key)
      l = len(base_dir)
      for fname in os.listdir(fspath):
        path = os.path.join(fspath, fname)
        if os.path.isdir(path):
          path += "/"
        path = path[l:]
        key = File.keygen(self.project, path)
        yield File.get(key)
    else:
      raise AttributeError("Files do not have 'children'!")

  @classmethod
  def get_by_project_path(cls, project, path):
    return cls.get(cls.keygen(project, path))

  def move(self, new_path, db_only=False):
    """Remember.. when moving a directory it moves everything in the subdir.

    Any existing file references to anything in the moved directory will stop
    working.
    """
    if self.is_directory:
      if not new_path.endswith("/"):
        raise ValueError("Directory moving must be moved to another path with / at the end.")
    else:
      if new_path.endswith("/"):
        raise ValueError("File moving must not end with a /.")

    key = File.keygen(self.project, new_path)
    oldkey = self.key
    old_fspath = self.fspath
    old_path = self.path

    self.key = key
    new_fspath = self.fspath
    new_path = self.path

    if not db_only:
      if os.path.exists(new_fspath):
        raise IOError("Destination already exists.")
      os.rename(old_fspath, new_fspath)

    self.save()
    File.get(oldkey).delete(db_only=True)

    if self.is_directory:
      base_dir = os.path.join(File.FILES_FOLDER, self.project.key)
      l = len(base_dir)

      for fname in os.listdir(new_fspath):
        p = os.path.join(new_fspath, fname)

        if os.path.isdir(p):
          p += "/"

        p = p[l:]

        key = File.keygen(self.project, p.replace(new_path, old_path, 1))
        File.get(key).move(p, db_only=True)

ALL_MODELS = {
  User: "USERS",
  Project: "PROJECTS",
  FeedItem: "FEED",
  Comment: "COMMENTS",
  Todo: "TODOS",
  ArchivedFeedItem: "ARCHIVED_FEED",
  File: "FILES"
}

def establish_connections(files_folder):
  for model in ALL_MODELS:
    model.establish_connection()

  File.FILES_FOLDER = files_folder

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
