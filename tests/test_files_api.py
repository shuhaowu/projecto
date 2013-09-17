from __future__ import absolute_import

from cStringIO import StringIO
import os

from werkzeug.datastructures import FileStorage

from settings import APP_FOLDER
from projecto.models import File, Project, User
from .utils import ProjectTestCase

test_file = lambda filename: (StringIO("hello world"), filename)

class FileModelTests(ProjectTestCase):

  def tearDown(self):
    self.reset_database()
    ProjectTestCase.tearDown(self)

  def test_create_file(self):
    f = File.create(data={
      "project": self.project,
      "path": "/newfile.txt",
      "file": FileStorage(*test_file("newfile.txt"))
    })
    self.assertEquals("{}`{}".format(self.project.key, "/newfile.txt"), f.key)
    fspath = os.path.join(File.FILES_FOLDER, self.project.key, "newfile.txt")
    self.assertEquals(fspath, f.fspath)
    self.assertFalse(os.path.exists(fspath))

    f.save()

    self.assertEquals("/newfile.txt", f.path)
    self.assertTrue(os.path.exists(fspath))

    with open(fspath) as fi:
      c = fi.read().strip()

    self.assertEquals("hello world", c)

  def test_create_directory(self):
    f = File.create(data={
      "project": self.project,
      "path": "/directory/"
    })

    fspath = os.path.join(File.FILES_FOLDER, self.project.key, "directory") + "/"
    self.assertEquals(fspath, f.fspath)
    self.assertFalse(os.path.exists(fspath))

    f.save()

    self.assertTrue(os.path.exists(fspath))
    self.assertTrue(os.path.isdir(fspath))

  def test_create_file_security(self):
    f = File.create(data={
      "project": self.project,
      "path": "/../../../../evil/path"
    })

    self.assertTrue(".." not in f.fspath)
    self.assertEquals("/evil/path", f.path)

    self.assertEquals(os.path.join(File.FILES_FOLDER, self.project.key, "evil/path"), f.fspath)

  def test_get_file(self):
    pass

  def test_get_directory(self):
    pass

  def test_update_file(self):
    pass

  def test_update_directory(self):
    pass

  def test_delete_file(self):
    pass

  def test_delete_directory(self):
    pass
