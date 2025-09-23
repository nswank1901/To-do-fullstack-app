/**************************************************************************
 * Fetch API calls
 ************************************************************************
 */
// fetch tasks: GET
// This function asks the backend for all tasks in the database
// It waits for the response, converts it from JSON into a JavaScript array/object, and returns it
async function getTasks() {
  try {
    const res = await fetch("/tasks"); // call backend endpoint
    const tasks = await res.json(); // parse JSON
    return tasks;
  } catch (err) {
    console.error("Error fetching tasks: ", err);
  }
}

// add tasks: POST
// This function sends a new task to the backend to be saved in the database
// The task only has a title here, which is converted to JSON and sent in the request body
async function addTask(title) {
  try {
    await fetch("/tasks", {
      method: "POST", // what kind of request
      headers: { "Content-Type": "application/json" }, // what kind of data
      body: JSON.stringify({ title }), // what data exactly
    });
  } catch (err) {
    console.error("Error adding task:", err);
  }
}

// update tasks (title, completed): PATCH
// This function updates a specific task in the database
// You can change the title, mark it completed/uncompleted, or both
// It sends only the fields you want to change in the `updates` object
async function updateTask(id, updates) {
  try {
    const res = await fetch(`/tasks/${id}`, {
      method: "PATCH", // type of request: partial update
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates), // fields to update, e.g., { title: "New", completed: true }
    });
    if (!res.ok) {
      // check if backend returned an error
      const text = await res.text();
      throw new Error(text || "Update failed");
    }
    return await res.json(); // return the updated task from backend
  } catch (err) {
    console.error("Error updating task:", err);
    return null;
  }
}

// delete tasks: DELETE
// This function deletes a task from the backend by its id
// It tells the backend which task to remove, waits for confirmation, and returns true if successful
async function deleteTask(id) {
  try {
    const res = await fetch(`/tasks/${id}`, { method: "DELETE" });
    if (!res.ok) {
      // check if backend returned an error
      const text = await res.text();
      throw new Error(text || "Delete failed");
    }
    return true; // return true if delete succeeded
  } catch (err) {
    console.error("Error deleting task:", err);
    return false;
  }
}

/*************************************************************************
 * Loading, rendering pages
 ************************************************************************
 */

// render tasks
// This function takes an array of tasks and displays them in the browser
// It creates an <li> for each task, adds a checkbox, title, and delete button
// It also visually marks tasks as completed if needed
function renderTasks(tasks) {
  const list = document.getElementById("task-list");
  list.innerHTML = ""; // clear existing tasks

  tasks.forEach((task) => {
    const li = document.createElement("li");
    li.dataset.id = task.id; // store the task id in the li for later use (needed for delete/update)

    // checkbox to mark task as completed
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = !!task.completed; // double-bang ensures it's a true boolean

    // span element to display task title
    const span = document.createElement("span");
    span.textContent = task.title;

    // delete button for each task
    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.classList.add("delete");

    // edit button for each task
    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.classList.add("edit");

    // button container
    const btnContainer = document.createElement("div");
    btnContainer.classList.add("btn-container");
    btnContainer.appendChild(delBtn);
    btnContainer.appendChild(editBtn);

    // Add a class for completed tasks to style them differently (e.g., strike-through)
    if (task.completed) {
      li.classList.add("completed");
    }

    // append elements to the li
    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(btnContainer);

    // append the li to the tasklist in the DOM
    list.appendChild(li);
  });
}

// load tasks when the page loads
document.addEventListener("DOMContentLoaded", async () => {
  const tasks = await getTasks();
  renderTasks(tasks);
});

/**************************************************************************
 * Event listeners
 ************************************************************************
 */

// Adding a task: listen for form submission
// When the user types a task and submits the form, this runs
document.getElementById("task-form").addEventListener("submit", async (e) => {
  e.preventDefault(); // stop page reload on form submit

  const input = document.getElementById("task-input");
  const title = input.value.trim();

  if (!title) return; // don't allow empty tasks

  await addTask(title); // call the function to add task to backend
  input.value = ""; // clear the input field

  const tasks = await getTasks(); // fetch updated tasks from backend, re-render
  renderTasks(tasks);
});

// Single event listener for all interactions in the task list
// This uses event delegation so we don't need a separate listener for every button or checkbox
document.getElementById("task-list").addEventListener("click", async (e) => {
  const li = e.target.closest("li"); // get the parent <li> of whatever was clicked
  if (!li) return; // exit if clicked outside of task
  const id = li.dataset.id; // get the task id from li

  // Delete button clicked
  if (e.target.tagName === "BUTTON" && e.target.textContent === "Delete") {
    if (!confirm("Delete this task?")) return; // ask for confirmation
    const ok = await deleteTask(id); // call backend to delete task
    if (ok) {
      const tasks = await getTasks(); // fetch updated tasks, re-render
      renderTasks(tasks);
    }
  }

  // Edit button clicked
  if (e.target.tagName === "BUTTON" && e.target.textContent === "Edit") {
    const li = e.target.closest("li");
    if (!li) return;
    const id = li.dataset.id;
    const span = li.querySelector("span");

    // create a new input element
    const input = document.createElement("input");
    input.type = "text";
    input.value = span.textContent; // pre-fill with existing task title

    span.replaceWith(input);
    input.focus();
    // cancel editing if input loses focus (user clicks outside)
    input.addEventListener("blur", () => {
      input.replaceWith(span);
    });

    // listen for save/cancel
    input.addEventListener("keydown", async (e) => {
      if (e.key === "Enter") {
        // Save changes (use upateTask)
        if (input.value === "") {
          input.replaceWith(span);
          return;
        }
        const newTitle = input.value.trim();
        await updateTask(id, { title: newTitle });
        const tasks = await getTasks();
        renderTasks(tasks);
      } else if (e.key === "Escape") {
        // Cancel editing: put the original span back
        input.replaceWith(span);
      }
    });
  }

  // Checkbox clicked
  if (e.target.type === "checkbox") {
    const completed = e.target.checked; // get the checkbox state
    await updateTask(id, { completed }); // update task in backend
    const tasks = await getTasks(); // fetch backend tasks, re-render
    renderTasks(tasks);
  }
});
