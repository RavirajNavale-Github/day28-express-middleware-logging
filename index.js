const express = require("express");
const morgan = require('morgan')
const fs = require("fs");
const { requestLogger, responseLogger } = require('./loggingMiddleware');
const port = 3000;

const app = express();

//Middleware 
app.use(express.json());
app.use(requestLogger);

//morger middleware
app.use(morgan('tiny')) //'combined', 'common', 'dev', 'short', 'tiny'
// app.use(morgan(':method :status :url "HTTP/:http-version"'))
// app.use(morgan(function (tokens, req, res) {
//   return [
//     tokens.method(req, res),
//     tokens.url(req, res),
//     tokens.status(req, res),
//     tokens.res(req, res, 'content-length'), '-',
//     tokens['response-time'](req, res), 'ms'
//   ].join(' ')
// }))

// Function to fetch todos from the JSON file
function readTodos(callback) {
  fs.readFile("todos.json", "utf8", (err, data) => {
    if (err) {
      callback(err, null);
      return;
    }
    try {
      const todos = JSON.parse(data);
      callback(null, todos);
    } catch (error) {
      callback(error, null);
    }
  });
}

// Function to add todos in the JSON file
function addTodos(todos, callback) {
  fs.writeFile("todos.json", JSON.stringify(todos), (err) => {
    if (err) {
      callback(err);
      return;
    }
    callback(null);
  });
}

// Function to update a todo by ID
function updateTodo(id, updatedTodo, callback) {
  readTodos((err, todos) => {
    if (err) {
      callback(err);
      return;
    }

    const index = todos.findIndex((todo) => todo.id === id);
    if (index === -1) {
      callback(new Error("Todo not found"));
      return;
    }

    todos[index] = { ...todos[index], ...updatedTodo };
    addTodos(todos, callback);
  });
}

//Function to Delete the todo
function deleteTodo(todoId, callback) {
  readTodos((err, todos) => {
    if (err) {
      callback(err);
      return;
    }

    const index = todos.findIndex((todo) => todo.id === todoId);
    if (index === -1) {
      callback(null, false);
      return;
    }

    const deletedTodo = todos.splice(index, 1);
    // console.log(deletedTodo)
    if(!deletedTodo){
      callback(err, false);
    } else{
      callback(null, true);
    }

    addTodos(todos, (err) => {
      if (err) {
        callback(err, false); // Indicate failure in writing todos
        return;
      }
    });
  });
}

//fetch todos from JSON file and show all todos
app.get("/todos", (req, res) => {
  readTodos((err, todos) => {
    if (err) {
      console.log(err);
      res.status(500).send("Error reading todos");
      return;
    }
    res.json(todos);
  });
});

//Middleware
app.use(responseLogger);

//fetch todos from JSON file and show only selected todo
app.get("/todos/:id", (req, res) => {
  const id = parseInt(req.params.id);
  //   console.log(req.params.id)
  readTodos((err, todos) => {
    if (err) {
      console.log(err);
      res.status(500).send("Error in reading todos");
      return;
    }
    const todo = todos.find((todo) => {
      return id === todo.id;
    });
    if (!todo) {
      res.status(404).json({ error: "Todo not Found" });
    } else {
      res.json(todo);
    }
  });
});

// POST route to add a new todo
app.post("/todos", (req, res) => {
  readTodos((err, todos) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error reading todos");
      return;
    }

    const newTodo = req.body;
    // New ID
    newTodo.id = todos.length + 1;
    // console.log(newTodo.id);

    todos.push(newTodo);

    addTodos(todos, (err) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error writing todo");
        return;
      }
      res.status(201).send("Todo added Successfully :)");
    });
  });
});

//PUT route to update a todo
app.put("/todos/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const updatedTodo = req.body;

  updateTodo(id, updatedTodo, (err) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error updating todo");
      return;
    }
    res.send("Todo updated successfully");
  });
});

// DELETE route to delete todo
app.delete("/todos/:id", (req, res) => {
  const todoId = parseInt(req.params.id);

  // console.log(todoId);

  deleteTodo(todoId, (err, deletedTodo) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error deleting todo");
      return;
    }
    if (deletedTodo) {
      res.json({ success: true, message: "Todo deleted successfully" });
    } else {
      res.status(404).json({ success: false, error: "Todo not found" });
    }
  });
});

app.listen(port, () => {
  console.log(`Server is listening to port: ${port}`);
});
