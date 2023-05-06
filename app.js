const path = require("path");
const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
var format = require("date-fns/format");
var isValid = require("date-fns/isValid");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db;

const initializationAndDB = async () => {
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });
  app.listen(4000);
  console.log("server connected...");
};

initializationAndDB();

//get todos API 1:

const hasPriorityAndStatusAndCategory = (requestQuery) => {
  return (
    requestQuery.priority !== undefined &&
    requestQuery.status !== undefined &&
    requestQuery.category !== undefined
  );
};

const hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityAndCategory = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.category !== undefined
  );
};

const hasStatusAndCategory = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.category !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

app.get("/todos/", async (request, response) => {
  let getTodosQuery = "";
  const { search_q = "", priority, status, category } = request.query;

  console.log(request.query);
  switch (true) {
    case hasPriorityAndStatusAndCategory(request.query):
      getTodosQuery = `
      SELECT id, todo, priority, status, category, due_date AS dueDate
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}'
        AND category = '${category}';`;
      break;

    case hasPriorityAndStatus(request.query):
      getTodosQuery = `
        SELECT id, todo, priority, status, category, due_date AS dueDate
        FROM
            todo 
        WHERE
            todo LIKE '%${search_q}%'
            AND status = '${status}'
            AND priority = '${priority}';`;
      break;

    case hasPriorityAndCategory(request.query):
      getTodosQuery = `
        SELECT id, todo, priority, status, category, due_date AS dueDate
        FROM
            todo 
        WHERE
            todo LIKE '%${search_q}%'
            AND category = '${category}'
            AND priority = '${priority}';`;
      break;

    case hasStatusAndCategory(request.query):
      getTodosQuery = `
        SELECT id, todo, priority, status, category, due_date AS dueDate
        FROM
            todo 
        WHERE
            todo LIKE '%${search_q}%'
            AND status = '${status}'
            AND category = '${category}';`;
      break;

    case hasPriorityProperty(request.query):
      getTodosQuery = `
      SELECT id, todo, priority, status, category, due_date AS dueDate
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}';`;
      break;

    case hasStatusProperty(request.query):
      getTodosQuery = `
      SELECT id, todo, priority, status, category, due_date AS dueDate
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}';`;
      break;

    case hasCategoryProperty(request.query):
      getTodosQuery = `
      SELECT id, todo, priority, status, category, due_date AS dueDate
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND category = '${category}';`;
      break;

    default:
      getTodosQuery = `
      SELECT id, todo, priority, status, category, due_date AS dueDate
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%';`;
  }
  console.log(getTodosQuery);
  const data = await db.all(getTodosQuery);
  console.log(data);
  response.send(data);
});

//get a specific todo based on todo ID API 2:

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `
    SELECT id, todo, priority, status, category, due_date AS dueDate
    FROM
      todo
    WHERE
      id = ${todoId};`;
  const todo = await db.get(getTodoQuery);
  response.send(todo);
});

//get a list of due date based on query parameter API 3:

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (date === undefined) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    console.log(date);
    const isDateValid = isValid(new Date(date));
    console.log(isDateValid);
    if (isDateValid) {
      const formattedDate = format(new Date(date), "yyyy-MM-dd");
      console.log(formattedDate);
      const getDateQuery = `
                SELECT id, todo, priority, status, category, due_date AS dueDate
                FROM  todo
                WHERE dueDate = '${formattedDate}'
                ;`;
      console.log(getDateQuery);
      const dueDateResponse = await db.all(getDateQuery);
      console.log(dueDateResponse);
      response.send(dueDateResponse);
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
});

//post new todo in table API 4:

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;

  const createTodoQuery = `INSERT INTO todo 
                              VALUES  (${id},'${todo}','${priority}','${status}','${category}','${dueDate}');`;
  console.log(createTodoQuery);
  const updateResponse = await db.run(createTodoQuery);
  console.log(updateResponse);
  response.send("Todo Successfully Added");
});

//update todo in table with specific todo ID API 5:

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";

  const requestBody = request.body;
  console.log(requestBody);
  switch (true) {
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";
      break;
  }

  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  console.log(previousTodoQuery);
  const previousTodo = await db.get(previousTodoQuery);
  console.log(previousTodo);

  const {
    todo = previousTodo.todo,
    category = previousTodo.category,
    priority = previousTodo.priority,
    status = previousTodo.status,
    dueDate = previousTodo.due_date,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
      todo 
    SET
      todo='${todo}',
      category ='${category}',
      priority='${priority}',
      status='${status}',
      due_date='${dueDate}'
    WHERE
      id = ${todoId};`;

  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

//delete todo based on todo ID API 6:

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  console.log(todoId);
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;
  console.log(deleteTodoQuery);
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
