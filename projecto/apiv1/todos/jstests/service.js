"use strict";

(function() {
  var projectKey = "projectkey";
  var todoKey = "todokey";
  var project = {key: projectKey};
  var newtododata = {title: "A todo", content: "yay todos!"};
  var author = angular.copy(window.currentUser);
  delete author.emails;
  var returnedtodo = {
    key: todoKey,
    author: author,
    title: newtododata.title,
    content: {
      markdown: newtododata.content,
      html: "<p>yay todos!</p>\\n"
    },
    tags: [],
    due: null,
    done: false,
    assigned: null,
    milestone: null,
    date: 1388790824.0,
    children: []
  };
  var baseUrl = window.API_PREFIX + "/projects/" + projectKey + "/todos/";

  var tmptodo = angular.copy(returnedtodo);
  var todolist = [];
  for (var i=0; i<20; i++) {
    tmptodo = angular.copy(tmptodo);
    tmptodo.date -= 1;
    tmptodo.key = todoKey + i;
    todolist.push(tmptodo);
  }

  describe("Todos", function() {
    var TodoItem, TodoList, $httpBackend, service;

    beforeEach(angular.mock.module("projecto"));
    beforeEach(angular.mock.inject(function(Todos, TodosService, _$httpBackend_) {
      TodoItem = Todos.TodoItem;
      TodoList = Todos.TodoList;
      service = TodosService;
      $httpBackend = _$httpBackend_;

      this.addMatchers({
        toBeTheSameTodoListAs: function(raw_list) {
          var todolist = this.actual.listify();
          if (todolist.length !== raw_list.length)
            return false;

          var raw_todo;
          for (var i=0, l=todolist.length; i<l; i++) {
            raw_todo = angular.copy(raw_list[i]);
            delete raw_todo.key;
            // I hate JavaScript.
            if (JSON.stringify(raw_todo) !== JSON.stringify(todolist[i].value.data)) {
              return false;
            }
          }
          return true;
        }
      });
    }));

    it("should initialize TodoItem", function() {
      var data = angular.copy(newtododata);
      var item = new TodoItem(todoKey, project, data);

      // TodoItem should not make a copy of data. For easy setting.
      expect(data.title).not.toBe("title");
      item.data.title = "title";
      expect(data.title).toBe("title");

      expect(item.data).toBe(data);
      expect(item.key).toBe(todoKey);
      expect(item.project).toBe(project);
      expect(item.archived).toBe(false);
    });

    it("should serialize TodoItem", function() {
      var data = angular.copy(newtododata);
      var item = new TodoItem(todoKey, project, data);

      var tododata = item.serialize();
      expect(data.key).not.toBe(todoKey);
      expect(tododata.key).toBe(todoKey);

      expect(tododata.title).toBe(data.title);
      expect(tododata.content).toBe(data.content);
    });

    it("should refresh TodoItem", function() {
      spyOn(service, "get").andCallThrough();

      var item = new TodoItem(todoKey, project);
      item.refresh();

      expect(service.get).toHaveBeenCalledWith(project, todoKey, false);
      $httpBackend.expectGET(baseUrl + todoKey + "?archived=0").respond(returnedtodo);
      $httpBackend.flush();

      expect(item.data).toEqual(returnedtodo);
    });

    it("should create new todos", function() {
      $httpBackend.when("POST", baseUrl).respond(returnedtodo);

      var data = angular.copy(newtododata);
      spyOn(service, "new").andCallThrough();

      // New item doesn't have a key.
      var item = new TodoItem(undefined, project, data);
      item.save();
      expect(service.new).toHaveBeenCalledWith(project, item.serialize());

      $httpBackend.expectPOST(baseUrl, item.serialize());
      $httpBackend.flush();

      expect(item.key).toBe(returnedtodo.key);
      expect(item.data).toEqual(returnedtodo);
    });

    it("should update existing todos", function() {
      $httpBackend.when("PUT", baseUrl + todoKey).respond(returnedtodo);
      spyOn(service, "put").andCallThrough();

      var data = angular.copy(newtododata);
      data.content = angular.copy(returnedtodo.content);

      var item = new TodoItem(todoKey, project, data);
      item.save();

      expect(service.put).toHaveBeenCalledWith(project, item.serialize());

      var putitem = item.serialize();
      delete putitem.content.html;
      delete putitem.key;
      $httpBackend.expectPUT(baseUrl + todoKey, putitem);
      $httpBackend.flush();

      expect(item.data).toEqual(returnedtodo);
    });

    it("should mark todos as done", function() {
      var donetodo = angular.copy(returnedtodo);
      donetodo.done = true;
      spyOn(service, "markDone").andCallThrough();

      var item = new TodoItem(todoKey, project, angular.copy(newtododata));
      item.done();

      expect(service.markDone).toHaveBeenCalledWith(project, item.serialize(), false);
      $httpBackend.expectPOST(baseUrl + todoKey + "/markdone?archived=0", {done: true}).respond(donetodo);
      $httpBackend.flush();
      expect(item.data.done).toBe(true);

      item.done();
      expect(service.markDone).toHaveBeenCalledWith(project, item.serialize(), false);
      donetodo.done = false;
      $httpBackend.expectPOST(baseUrl + todoKey + "/markdone?archived=0", {done: false}).respond(donetodo);
      $httpBackend.flush();
      expect(item.data.done).toBe(false);
    });

    it("should archived todos", function() {
      spyOn(service, "delete").andCallThrough();

      var item = new TodoItem(todoKey, project, angular.copy(newtododata));
      item.archive();

      expect(service.delete).toHaveBeenCalledWith(project, item.serialize(), undefined, false);
      $httpBackend.expectDELETE(baseUrl + todoKey + "?archived=0&really=0").respond({status: "okay"});
      $httpBackend.flush();

      expect(item.archived).toBe(true);
    });

    it("should delete todos", function() {
      spyOn(service, "delete").andCallThrough();

      var item = new TodoItem(todoKey, project, angular.copy(newtododata));
      item.delete();
      expect(service.delete).toHaveBeenCalledWith(project, item.serialize(), true, false);
      $httpBackend.expectDELETE(baseUrl + todoKey + "?archived=0&really=1").respond({status: "okay"});
      $httpBackend.flush();
    });

    it("should fetch todo lists", function() {
      spyOn(service, "filter").andCallThrough();

      var list = new TodoList(project);
      list.fetch();

      var params = {
        tags: [" "],
        showdone: "0",
        shownotdone: "1",
        page: 1
      };

      expect(service.filter).toHaveBeenCalledWith(project, params);

      $httpBackend.expectGET(baseUrl + "filter?page=1&showdone=0&shownotdone=1&tags=+").respond({
        todos: angular.copy(todolist),
        currentPage: 1,
        totalTodos: 20,
        todosPerPage: 20
      });

      $httpBackend.flush();

      expect(list.todos.get(todoKey + 0).key).toBe(todolist[0].key);
      expect(list.todos.get(todoKey + 0).data.date).toBe(todolist[0].date);
      expect(list.todos).toBeTheSameTodoListAs(todolist);
      expect(list.currentPage).toBe(1);
      expect(list.totalPages).toBe(1);
      expect(list.todosPerPage).toBe(20);

      list = new TodoList(project);
      list.fetch();

      params = {
        tags: [" "],
        showdone: "0",
        shownotdone: "1",
        page: 1
      };

      expect(service.filter).toHaveBeenCalledWith(project, params);

      var firstpage = todolist.slice(0, 10);
      var secondpage = todolist.slice(10, 20);

      $httpBackend.expectGET(baseUrl + "filter?page=1&showdone=0&shownotdone=1&tags=+").respond({
        todos: angular.copy(firstpage),
        currentPage: 1,
        totalTodos: 20,
        todosPerPage: 10
      });
      $httpBackend.flush();

      expect(list.todos.length()).toBe(10);
      expect(list.todos).toBeTheSameTodoListAs(firstpage);
      expect(list.currentPage).toBe(1);
      expect(list.totalPages).toBe(2);
      expect(list.todosPerPage).toBe(10);

      list.gotopage(2);
      params.page = 2;
      expect(service.filter).toHaveBeenCalledWith(project, params);

      $httpBackend.expectGET(baseUrl + "filter?page=2&showdone=0&shownotdone=1&tags=+").respond({
        todos: angular.copy(secondpage),
        currentPage: 2,
        totalTodos: 20,
        todosPerPage: 10
      });
      $httpBackend.flush();

      expect(list.todos.length()).toBe(10);
      expect(list.todos).toBeTheSameTodoListAs(secondpage);
      expect(list.currentPage).toBe(2);
      expect(list.totalPages).toBe(2);
      expect(list.todosPerPage).toBe(10);

      list.gotopage(1);
      params.page = 1;
      expect(service.filter).toHaveBeenCalledWith(project, params);

      $httpBackend.expectGET(baseUrl + "filter?page=1&showdone=0&shownotdone=1&tags=+").respond({
        todos: angular.copy(firstpage),
        currentPage: 1,
        totalTodos: 20,
        todosPerPage: 10
      });
      $httpBackend.flush();

      expect(list.todos.length()).toBe(10);
      expect(list.todos).toBeTheSameTodoListAs(firstpage);
      expect(list.currentPage).toBe(1);
      expect(list.totalPages).toBe(2);
      expect(list.todosPerPage).toBe(10);
    });

    it("should initialize tags and fetch todolist", function() {
      spyOn(service, "listTags").andCallThrough();

      var list = new TodoList(project);
      list.fetch(true);

      expect(service.listTags).toHaveBeenCalledWith(project);
      $httpBackend.expectGET(baseUrl + "tags/?archived=0").respond({
        tags: ["tag1", "tag2"]
      });
      $httpBackend.expectGET(baseUrl + "filter?page=1&showdone=0&shownotdone=1&tags=tag1&tags=tag2&tags=+").respond({
        todos: angular.copy(todolist),
        currentPage: 1,
        totalTodos: 20,
        todosPerPage: 20
      });
      $httpBackend.flush();

      expect(list.tags).toEqual(["tag1", "tag2", " "]);
      expect(list.tagsFiltered).toEqual(["tag1", "tag2", " "]);
      expect(list.todos).toBeTheSameTodoListAs(todolist);
      expect(list.currentPage).toBe(1);
      expect(list.totalPages).toBe(1);
      expect(list.todosPerPage).toBe(20);
    });

    it("should toggle tags filtered", function() {
      var list = new TodoList(project);

      list.toggleFilterTag("tag1");
      expect(list.tagsFiltered).toEqual([" ", "tag1"]);

      list.toggleFilterTag("tag1");
      list.toggleFilterTag(" ");
      expect(list.tagsFiltered.length).toBe(0);

      list.toggleFilterTag("tag1");
      list.toggleFilterTag("tag2");
      expect(list.tagsFiltered).toEqual(["tag1", "tag2"]);
    });

    it("should check if tag is filtered", function() {
      var list = new TodoList(project);

      list.toggleFilterTag("tag1");
      list.toggleFilterTag("tag2");

      expect(list.isTagFiltered("tag1")).toBe(true);
      expect(list.isTagFiltered("tag2")).toBe(true);
      expect(list.isTagFiltered("tag3")).toBe(false);
    });

    it("should fetch archived todolists", function() {
      spyOn(service, "index").andCallThrough();

      var list = new TodoList(project, {archived: true});
      list.fetch();

      expect(service.index).toHaveBeenCalledWith(project, 1, true);
      $httpBackend.expectGET(baseUrl + "?archived=1").respond({
        todos: angular.copy(todolist),
        currentPage: 1,
        totalTodos: 20,
        todosPerPage: 20
      });
      $httpBackend.flush();

      expect(list.todos).toBeTheSameTodoListAs(todolist);
      expect(list.currentPage).toBe(1);
      expect(list.totalPages).toBe(1);
      expect(list.todosPerPage).toBe(20);
    });

    it("should clear todos that are done", function() {
      spyOn(service, "clearDone").andCallThrough();
      $httpBackend.expectGET(baseUrl + "filter?page=1&showdone=0&shownotdone=1&tags=+").respond({
        todos: angular.copy(todolist),
        currentPage: 1,
        totalTodos: 20,
        todosPerPage: 20
      });

      var list = new TodoList(project);
      list.fetch();
      $httpBackend.flush();

      list.todos.get(todoKey + "0").data.done = true;
      list.todos.get(todoKey + "5").data.done = true;
      list.todos.get(todoKey + "6").data.title = "YAY!";

      list.clearDone();
      expect(service.clearDone).toHaveBeenCalledWith(project);
      $httpBackend.expectDELETE(baseUrl + "done").respond({status: "okay"});
      $httpBackend.flush();

      expect(list.todos.length()).toBe(18);
      expect(list.todos.get(todoKey + 6).data.title).toBe("YAY!");
    });


  });
})();
