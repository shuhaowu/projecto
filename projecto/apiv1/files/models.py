from __future__ import absolute_import

from datetime import datetime
import os

from kvkit import (
  DateTimeProperty,
  Document,
  NotFoundError,
  ReferenceProperty,
)
import werkzeug.utils

from ...models import BaseDocument, Project, User, rc
from ...utils import safe_mkdirs

from settings import DATABASES


class CannotMoveToDestination(IOError):
  pass


class File(BaseDocument):
  _riak_options = {"bucket": rc.bucket(DATABASES["files"])}

  # Only this user and root can read this!
  MODE = 0600

  # This must be set by some initialization!
  FILES_FOLDER = None

  author = ReferenceProperty(User, load_on_demand=True)
  date = DateTimeProperty(default=lambda: None)
  project = ReferenceProperty(Project, load_on_demand=True)

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
    o.date = datetime.now()
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

  def serialize_for_client(self, recursive=True):
    item = self.serialize(restricted=("project", "author"))
    item["author"] = self.author.serialize_for_client()
    item["path"] = self.path

    # recursive is a lie. It only goes down one level! :D
    if recursive and self.is_directory:
      item["children"] = children = []
      fspath = self.fspath
      root = os.path.join(File.FILES_FOLDER, self.project.key)
      l = len(root) + 1
      for fname in os.listdir(fspath):
        path = os.path.join(fspath, fname)
        if os.path.isdir(path):
          path += "/"
        path = path[l:]

        children.append(File.get_by_project_path(self.project, path).serialize_for_client(recursive=False))
    return item

  def _ensure_base_dir_exists(self, fspath):
    if not fspath.startswith("/"):
      raise ValueError("Ensuring base dir only works on absolute path!")
    fspath = fspath.rstrip("/").rsplit("/", 1)
    fspath = fspath[0] + "/"
    return fspath.endswith(self.project.key + "/") or os.path.exists(fspath)

  def save(self, *args, **kwargs):
    self.date = datetime.now()
    fspath = self.fspath

    if not self._ensure_base_dir_exists(fspath):
      raise NotFoundError("Base dir is not found for {}".format(fspath))

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
      try:
        Document.delete(self, *args, **kwargs)
      except:
        pass

      raise NotFoundError("{} not found!".format(fspath))

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

  @staticmethod
  def lsroot(project):
    base_dir = os.path.join(File.FILES_FOLDER, project.key)
    l = len(base_dir)

    if not os.path.exists(base_dir):
      os.mkdir(base_dir)

    for fname in os.listdir(base_dir):
      path = os.path.join(base_dir, fname)
      if os.path.isdir(path):
        path += "/"
      path = path[l:]
      key = File.keygen(project, path)
      yield File.get(key)

  @classmethod
  def get_by_project_path(cls, project, path):
    return cls.get(cls.keygen(project, path))

  def move(self, new_path, new_author=None, db_only=False):
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

    if not self._ensure_base_dir_exists(new_fspath):
      self.key = oldkey
      raise NotFoundError("Base dir is not found for {}".format(new_path))

    if not db_only:
      if os.path.exists(new_fspath):
        raise CannotMoveToDestination("Destination already exists.")

      if new_fspath.startswith(old_fspath):
        raise CannotMoveToDestination("Cannot move directory into itself.")

      os.renames(old_fspath, new_fspath)

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
