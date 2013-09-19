from __future__ import absolute_import

from cStringIO import StringIO
import os

from leveldbkit import NotFoundError
from werkzeug.datastructures import FileStorage

from projecto.models import File
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
    f3 = new_file(self.user, self.project, path="/directory/d1/file3.txt", save=True)

    d.delete()
    self.assertFalse(os.path.exists(f1.fspath))
    self.assertFalse(os.path.exists(f2.fspath))
    self.assertFalse(os.path.exists(d1.fspath))
    self.assertFalse(os.path.exists(f3.fspath))

    with self.assertRaises(NotFoundError):
      File.get(f1.key)

    with self.assertRaises(NotFoundError):
      File.get(f2.key)

    with self.assertRaises(NotFoundError):
      File.get(d1.key)

    with self.assertRaises(NotFoundError):
      File.get(f3.key)

  def test_move_file(self):
    f = new_file(self.user, self.project, save=True)
    old_fspath = f.fspath
    self.assertTrue(os.path.exists(old_fspath))

    f.move("/moved_file.txt")
    new_fspath = f.fspath
    self.assertNotEquals(old_fspath, new_fspath)
    self.assertEquals(os.path.join(File.FILES_FOLDER, self.project.key, "moved_file.txt"), new_fspath)
    self.assertFalse(os.path.exists(old_fspath))
    self.assertTrue(os.path.exists(new_fspath))

    with open(new_fspath) as f:
      c = f.read().strip()

    self.assertEquals("hello world", c)

  def test_move_directory(self):
    d = new_directory(self.user, self.project, save=True)
    old_fspath = d.fspath
    self.assertTrue(os.path.exists(old_fspath))

    d.move("/moved_directory/")
    new_fspath = d.fspath
    self.assertNotEquals(old_fspath, new_fspath)
    self.assertEquals(os.path.join(File.FILES_FOLDER, self.project.key, "moved_directory/"), new_fspath)
    self.assertFalse(os.path.exists(old_fspath))
    self.assertTrue(os.path.exists(new_fspath))
    self.assertTrue(os.path.isdir(new_fspath))

  def test_move_directory_with_subtree(self):
    d = new_directory(self.user, self.project, path="/directory1/", save=True)
    f1 = new_file(self.user, self.project, path="/directory1/file1.txt", save=True)
    f2 = new_file(self.user, self.project, path="/directory1/file2.txt", save=True)
    d1 = new_directory(self.user, self.project, path="/directory1/d1/", save=True)
    f3 = new_file(self.user, self.project, path="/directory1/d1/file3.txt", save=True)

    old_key = d.key
    old_fspath = d.fspath

    d.move("/moved_directory1/")

    self.assertNotEquals(old_fspath, d.fspath)
    self.assertNotEquals(old_key, d.key)

    self.assertFalse(os.path.exists(old_fspath))
    self.assertFalse(os.path.exists(f1.fspath))
    self.assertFalse(os.path.exists(f2.fspath))
    self.assertFalse(os.path.exists(d1.fspath))
    self.assertFalse(os.path.exists(f3.fspath))

    with self.assertRaises(NotFoundError):
      File.get(old_key)

    with self.assertRaises(NotFoundError):
      File.get(f1.key)

    with self.assertRaises(NotFoundError):
      File.get(f2.key)

    with self.assertRaises(NotFoundError):
      File.get(d1.key)

    with self.assertRaises(NotFoundError):
      File.get(f3.key)

    f1 = File.get_by_project_path(d.project, "/moved_directory1/file1.txt")
    f2 = File.get_by_project_path(d.project, "/moved_directory1/file2.txt")
    d1 = File.get_by_project_path(d.project, "/moved_directory1/d1/")
    f3 = File.get_by_project_path(d.project, "/moved_directory1/d1/file3.txt")

    self.assertTrue(os.path.exists(f1.fspath))
    self.assertTrue(os.path.exists(f2.fspath))
    self.assertTrue(os.path.exists(d1.fspath))
    self.assertTrue(os.path.exists(f3.fspath))

    with open(f1.fspath) as f:
      self.assertEquals("hello world", f.read().strip())

    with open(f2.fspath) as f:
      self.assertEquals("hello world", f.read().strip())

    with open(f3.fspath) as f:
      self.assertEquals("hello world", f.read().strip())

