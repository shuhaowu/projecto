from __future__ import absolute_import

from cStringIO import StringIO
import os

from leveldbkit import NotFoundError
from werkzeug.datastructures import FileStorage

from settings import APP_FOLDER
from projecto.models import File, Project, User
from .utils import ProjectTestCase, new_file, new_directory

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
    f = new_file(self.user, self.project, save=True)

    g = File.get_by_project_path(self.project, f.path)
    self.assertEquals(f.key, g.key)
    self.assertEquals(f.author.key, g.author.key)
    self.assertEquals(f.project.key, g.project.key)
    self.assertEquals(f.fspath, g.fspath)
    self.assertEquals(f.path, g.path)
    self.assertFalse(g.is_directory)

    self.assertEquals("hello world", g.content)

  def test_get_directory(self):
    d = new_directory(self.user, self.project, save=True)
    g = File.get_by_project_path(self.project, d.path)

    self.assertEquals(d.key, g.key)
    self.assertEquals(d.author.key, g.author.key)
    self.assertEquals(d.project.key, g.project.key)
    self.assertEquals(d.fspath, g.fspath)
    self.assertEquals(d.path, g.path)
    self.assertTrue(g.is_directory)

    with self.assertRaises(AttributeError):
      g.content

  def test_update_file_content(self):
    f = new_file(self.user, self.project, save=True)
    f.update_content("yay!")
    now = f.date
    g = File.get_by_project_path(self.project, f.path)

    self.assertEquals("yay!", g.content)
    self.assertNotEquals(now, g.date)

  def test_list_directory(self):
    d = new_directory(self.user, self.project, path="/directory/", save=True)
    new_file(self.user, self.project, path="/directory/file1.txt", save=True)
    new_file(self.user, self.project, path="/directory/file2.txt", save=True)
    new_directory(self.user, self.project, path="/directory/d1/", save=True)

    children = list(d.children)
    self.assertEquals(3, len(children))

    paths = [c.path for c in children]
    self.assertTrue("/directory/d1/" in paths)
    self.assertTrue("/directory/file1.txt" in paths)
    self.assertTrue("/directory/file2.txt" in paths)

  def test_delete_file(self):
    f = new_file(self.user, self.project, save=True)
    fspath = f.fspath
    self.assertTrue(os.path.exists(fspath))

    f.delete()
    self.assertFalse(os.path.exists(fspath))

    with self.assertRaises(NotFoundError):
      File.get(f.key)

  def test_delete_directory(self):
    d = new_directory(self.user, self.project, save=True)
    fspath = d.fspath
    self.assertTrue(os.path.exists(fspath))

    d.delete()
    self.assertFalse(os.path.exists(fspath))

    with self.assertRaises(NotFoundError):
      File.get(d.key)

  def test_delete_directory_with_subtree(self):
    d = new_directory(self.user, self.project, path="/directory/", save=True)
    fspath = d.fspath
    self.assertTrue(os.path.exists(fspath))

    f1 = new_file(self.user, self.project, path="/directory/file1.txt", save=True)
    f2 = new_file(self.user, self.project, path="/directory/file2.txt", save=True)
    d1 = new_directory(self.user, self.project, path="/directory/d1/", save=True)

    d.delete()
    self.assertFalse(os.path.exists(f1.fspath))
    self.assertFalse(os.path.exists(f2.fspath))
    self.assertFalse(os.path.exists(d1.fspath))

    with self.assertRaises(NotFoundError):
      File.get(f1.key)

    with self.assertRaises(NotFoundError):
      File.get(f2.key)

    with self.assertRaises(NotFoundError):
      File.get(d1.key)

  def test_rename_file(self):
    pass

  def test_rename_directory(self):
    pass

  def test_mv_file(self):
    pass

  def test_mv_directory(self):
    pass
