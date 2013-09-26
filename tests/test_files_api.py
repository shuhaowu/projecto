from __future__ import absolute_import

from cStringIO import StringIO
import os

from leveldbkit import NotFoundError
import ujson as json
from werkzeug.datastructures import FileStorage

from projecto.models import File
from .utils import ProjectTestCase, new_file, new_directory

test_file = lambda filename: (StringIO("hello world"), filename)

class FileModelTests(ProjectTestCase):

  def tearDown(self):
    # TODO: I'm slow and I'm bad. Use something different! D:
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

  def test_create_file_missing_intermediate_directories(self):
    with self.assertRaises(NotFoundError):
      new_file(self.user, self.project, path="/does/not/exist.txt", save=True)

    with self.assertRaises(NotFoundError):
      File.get_by_project_path(self.project, "/does/not/exists.txt")

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

  def test_move_within_directory(self):
    new_directory(self.user, self.project, path="/dir/", save=True)
    d1 = new_directory(self.user, self.project, path="/dir/one/", save=True)

    old_fspath = d1.fspath
    d1.move("/dir/two/")

    with self.assertRaises(NotFoundError):
      File.get_by_project_path(self.project, "/dir/one/")

    self.assertFalse(os.path.exists(old_fspath))
    self.assertTrue(os.path.exists(d1.fspath))

    d1_g = File.get_by_project_path(self.project, "/dir/two/")
    self.assertEquals(d1.fspath, d1_g.fspath)

  def test_move_fail_with_non_existing_directories(self):
    new_directory(self.user, self.project, path="/dir/", save=True)
    d1 = new_directory(self.user, self.project, path="/dir/d1/", save=True)
    new_file(self.user, self.project, path="/dir/d1/test.txt", save=True)

    with self.assertRaises(NotFoundError):
      d1.move("/dir/not/d2/")

    self.assertTrue("d2" not in d1.fspath)

    d11 = File.get_by_project_path(self.project, "/dir/d1/")
    self.assertTrue(os.path.exists(d11.fspath))

    with self.assertRaises(NotFoundError):
      File.get_by_project_path(self.project, "/dir1/d2/")

    with self.assertRaises(NotFoundError):
      File.get_by_project_path(self.project, "/dir1/d2/test.txt")

class TestFilesAPI(ProjectTestCase):
  def setUp(self):
    ProjectTestCase.setUp(self)
    self._c = []

  def tearDown(self):
    # TODO: Is this safe?
    for c in self._c:
      c.delete()
    ProjectTestCase.tearDown(self)

  def base_url(self):
    return "/api/v1/projects/{}/files/".format(self.project.key)

  def test_create_file(self):
    self.login()
    response = self.post(self.base_url(), query_string={"path": "/test_file.txt"}, data={"file": test_file("meh")})
    _, data = self._get_json_from_response(response)

    self.assertStatus(200, response)
    self.assertTrue("date" in data)

    fspath = os.path.join(File.FILES_FOLDER, self.project.key, "test_file.txt")
    self.assertTrue(os.path.exists(fspath))
    with open(fspath) as f:
      self.assertEquals("hello world", f.read())

    f = File.get_by_project_path(self.project, "/test_file.txt")
    self._c.append(f)
    self.assertEquals(self.user.key, f.author.key)
    self.assertEquals(self.project.key, f.project.key)

  def test_create_directory(self):
    self.login()
    response = self.post(self.base_url(), query_string={"path": "/test_dir/"})
    _, data = self._get_json_from_response(response)

    self.assertStatus(200, response)

    d = File.get_by_project_path(self.project, "/test_dir/")
    self._c.append(d)
    self.assertTrue(os.path.exists(d.fspath))
    self.assertEquals(self.user.key, d.author.key)
    self.assertEquals(self.project.key, d.project.key)

  def test_create_file_reject_badrequest(self):
    self.login()
    response = self.post(self.base_url(), query_string={})
    self.assertStatus(400, response)

    # no file content!
    response = self.post(self.base_url(), query_string={"path": "/testfile.txt"})
    self.assertStatus(400, response)

  def test_create_file_reject_permission(self):
    response = self.post(self.base_url(), query_string={"path": "testfile.txt"}, data={"file": test_file("mew")})
    self.assertStatus(403, response)

    user2 = self.create_user("mew@mew.com")
    self.login(user2)

    response = self.post(self.base_url(), query_string={"path": "/testfile.txt"}, data={"file": test_file("mew")})
    self.assertStatus(403, response)

  def test_create_file_reject_exists(self):
    new_file(self.user, self.project, path="/testfile.txt", save=True)
    self.login()
    response = self.post(self.base_url(), query_string={"path": "/testfile.txt"}, data={"file": test_file("mew")})
    self.assertStatus(400, response)
    _, data = self._get_json_from_response(response)
    data = json.loads(data)
    self.assertTrue("error" in data)
    self.assertEquals("That path already exists!", data["error"])

    new_directory(self.user, self.project, path="/testdir/", save=True)
    response = self.post(self.base_url(), query_string={"path": "/testdir/"})
    self.assertStatus(400, response)

  def test_get_file(self):
    f = new_file(self.user, self.project, path="/newfile.txt", save=True)
    self._c.append(f)
    self.login()
    response, data = self.getJSON(self.base_url(), query_string={"path": "/newfile.txt"})

    self.assertStatus(200, response)

    self.assertTrue("path" in data)
    self.assertEquals(f.path, data["path"])

    self.assertTrue("author" in data)
    self.assertEquals(self.user.key, data["author"]["key"])

    self.assertTrue("date" in data)

  def test_get_file_content(self):
    f = new_file(self.user, self.project, path="/newfile.txt", save=True)
    self._c.append(f)
    self.login()

    response = self.get(self.base_url(), query_string={"path": "/newfile.txt", "download": "true"})

    self.assertStatus(200, response)
    self.assertTrue("Content-Disposition" in response.headers)
    self.assertTrue("attachment" in response.headers["Content-Disposition"])
    self.assertTrue("newfile.txt" in response.headers["Content-Disposition"])
    self.assertTrue("hello world", response.data)

    self.logout()

    user2 = self.create_user("test2@test.com")
    self.project.collaborators.append(user2.key)
    self.project.save()

    self.login(user2)
    response, data = self.getJSON(self.base_url(), query_string={"path": "/newfile.txt"})
    self.assertStatus(200, response)

  def test_get_directory(self):
    d = new_directory(self.user, self.project, path="/directory/", save=True)
    self._c.append(d)
    self.login()

    # Just one directory
    response, data = self.getJSON(self.base_url(), query_string={"path": "/directory/"})
    self.assertStatus(200, response)

    self.assertTrue("path" in data)
    self.assertEquals(d.path, data["path"])

    self.assertTrue("author" in data)
    self.assertEquals(self.user.key, data["author"]["key"])

    self.assertTrue("date" in data)

    self.assertTrue("children" in data)
    self.assertEquals([], data["children"])

    # Test with a file inside
    f = new_file(self.user, self.project, path="/directory/file1.txt", save=True)
    response, data = self.getJSON(self.base_url(), query_string={"path": "/directory/"})

    self.assertStatus(200, response)

    self.assertEquals(1, len(data["children"]))
    self.assertEquals(f.path, data["children"][0]["path"])

    # Test with a file and a directory with a file inside
    d = new_directory(self.user, self.project, path="/directory/directory/", save=True)
    new_file(self.user, self.project, path="/directory/directory/file1.txt", save=True)

    response, data = self.getJSON(self.base_url(), query_string={"path": "/directory/"})

    self.assertStatus(200, response)
    self.assertEquals(2, len(data["children"]))
    data["children"].sort(key=lambda x: len(x["path"]))
    self.assertEquals(f.path, data["children"][0]["path"])
    self.assertEquals(d.path, data["children"][1]["path"])
    self.assertTrue("children" not in data["children"][1])

    self.logout()

    user2 = self.create_user("test2@test.com")
    self.project.collaborators.append(user2.key)
    self.project.save()

    self.login(user2)
    response, data = self.getJSON(self.base_url(), query_string={"path": "/directory/"})
    self.assertStatus(200, response)

  def test_get_file_reject_notfound(self):
    self.login()
    response, _ = self.getJSON(self.base_url(), query_string={"path": "/dir/"})
    self.assertStatus(404, response)

  def test_get_file_reject_permission(self):
    new_file(self.user, self.project, path="/test.txt", save=True)
    response = self.get(self.base_url(), query_string={"path": "/dir/"})
    self.assertStatus(403, response)

    response = self.get(self.base_url(), query_string={"path": "/dir/", "download": "true"})
    self.assertStatus(403, response)

    user2 = self.create_user("yay@yay.com")
    self.login(user2)

    response = self.get(self.base_url(), query_string={"path": "/dir/"})
    self.assertStatus(403, response)

    response = self.get(self.base_url(), query_string={"path": "/dir/", "download": "true"})
    self.assertStatus(403, response)

  def test_delete_file(self):
    f = new_file(self.user, self.project, path="/test.txt", save=True)
    self.login()
    response = self.delete(self.base_url(), query_string={"path": "/test.txt"})
    self.assertStatus(200, response)

    with self.assertRaises(NotFoundError):
      f.reload()

    self.assertFalse(os.path.exists(f.fspath))

  def test_delete_file_reject_notfound(self):
    self.login()
    response = self.delete(self.base_url(), query_string={"path": "/wut.txt"})
    self.assertStatus(404, response)

  def test_delete_file_reject_permission(self):
    f = new_file(self.user, self.project, path="/test.txt", save=True)
    self._c.append(f)

    response = self.delete(self.base_url(), query_string={"path": "/test.txt"})
    self.assertStatus(403, response)

    user2 = self.create_user("user1@user1.com")
    self.login(user2)
    response = self.delete(self.base_url(), query_string={"path": "/test.txt"})
    self.assertStatus(403, response)

  def test_update_file(self):
    f = new_file(self.user, self.project, path="/test.txt", save=True)
    self._c.append(f)

    self.login()
    response = self.put(self.base_url(), query_string={"path": "/test.txt"}, data={"file": (StringIO("abc"), "meh")})
    self.assertStatus(200, response)
    self.assertEquals("abc", f.content)

  def test_update_file_reject_notfound(self):
    self.login()
    response = self.put(self.base_url(), query_string={"path": "/test.txt"}, data={"file": (StringIO("abc"), "meh")})
    self.assertStatus(404, response)

  def test_update_file_reject_permission(self):
    f = new_file(self.user, self.project, path="/test.txt", save=True)
    self._c.append(f)

    response = self.put(self.base_url(), query_string={"path": "/test.txt"}, data={"file": (StringIO("abc"), "meh")})
    self.assertStatus(403, response)

    user2 = self.create_user("meh@meh.com")
    self.login(user2)

    response = self.put(self.base_url(), query_string={"path": "/test.txt"}, data={"file": (StringIO("abc"), "meh")})
    self.assertStatus(403, response)
