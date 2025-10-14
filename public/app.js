// pagination state variables
let currentPage = 1;
const limit = 5; // how many tasks per page

// filter & sort state variables
let currentFilter = "all";
let currentSort = "none";

/**************************************************************************
 * Fetch API calls
 ************************************************************************
 */
const request = async (url, options = {}) => {
  try {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error((await res.text()) || "Request failed");
    return res.status !== 204 ? res.json() : true;
  } catch (err) {
    console.error("Fetch error occurred", err);
    return null;
  }
};

// fetch tasks: GET
// This function asks the backend for all tasks in the database
// It waits for the response, converts it from JSON into a JavaScript array/object, and returns it
const getTasks = async (page = 1, limit = 5) =>  {
  const offset = (page - 1) * limit;
  return await request(`/tasks?limit=${limit}&offset=${offset}`);
};

// add tasks: POST
// This function sends a new task to the backend to be saved in the database
// The task only has a title here, which is converted to JSON and sent in the request body
const addTask = (newTask) => {
  request("/tasks", {
    method: "POST", // what kind of request
    headers: { "Content-Type": "application/json" }, // what kind of data
    body: JSON.stringify(newTask), // what data exactly
  });
};

// update tasks (title, completed): PATCH
// This function updates a specific task in the database
// You can change the title, mark it completed/uncompleted, or both
// It sends only the fields you want to change in the `updates` object
const updateTask = (id, updates) => {
  request(`/tasks/${id}`, {
    method: "PATCH", // type of request: partial update
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates), // fields to update, e.g., { title: "New", completed: true }
  });
};

// delete tasks: DELETE
// This function deletes a task from the backend by its id
// It tells the backend which task to remove, waits for confirmation, and returns true if successful
const deleteTask = (id) => request(`/tasks/${id}`, { method: "DELETE" });

/*************************************************************************
 * Loading, rendering pages
 ************************************************************************
 */

/**
 * Helper: create a div containing all task info
 */
function createTaskInfo(task) {
  // create a container for task info
  const info = document.createElement("div");
  info.classList.add("task-info");

  // display title
  const title = document.createElement("span");
  title.classList.add("task-title");
  title.textContent = task.title;

  // display due date
  const dueDate = document.createElement("span");
  dueDate.classList.add("task-due");
  if (task.due_date) {
    const date = new Date(task.due_date);
    dueDate.textContent = `Due: ${date.toLocaleDateString()}`;
  } else {
    dueDate.textContent = `Due: N/A`;
  }

  // display priority
  const priority = document.createElement("span");
  priority.classList.add("task-priority");
  priority.textContent = `Priority: ${task.priority || "medium"}`;

  // estimated time in hours and minutes
  const estHours = Math.floor(task.estimated_time / 60);
  const estMins = task.estimated_time % 60;
  const estimated = document.createElement("span");
  estimated.classList.add("task-estimated");
  estimated.textContent = `Est: ${estHours}Hrs ${estMins}min.`;

  // append all task info to info container
  info.append(title, dueDate, priority, estimated);
  return info;
}

/**
 * render tasks
    This function takes an array of tasks and displays them in the browser
    It creates an <li> for each task, adds a checkbox, title, and delete button
    It also visually marks tasks as completed if needed
 */

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

    const info = createTaskInfo(task);

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
    li.append(checkbox, info, btnContainer);

    // append the li to the tasklist in the DOM
    list.appendChild(li);
  });
}

async function refreshTasks(filter = "all", sort = "none") {
  const data = await getTasks(currentPage, limit); // fetch tasks from backend
  if(!data) return;

  let {tasks, total} = data;

  // Filtering
  if (filter === "completed") {
    tasks = tasks.filter((task) => task.completed === 1);
  } else if (filter === "not-completed") {
    tasks = tasks.filter((task) => task.completed === 0);
  }

  // Sorting
  if (sort === "date-asc") {
    tasks.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  } else if (sort === "date-desc") {
    tasks.sort((a, b) => new Date(b.due_date) - new Date(a.due_date));
  }

  renderTasks(tasks);
  updatePaginationButtons(total);
}

function updatePaginationButtons(totalTasks) {
  const totalPages = Math.ceil(totalTasks / limit);

  // disable/enable buttons
  document.getElementById("prevPage").disabled = currentPage === 1;
  document.getElementById("nextPage").disabled = currentPage === totalPages;

  // update page info
  document.getElementById("page-info").textContent = `Page ${currentPage} of ${totalPages}`;
}

/**************************************************************************
 * Event listeners
 ************************************************************************
 */
// show all tasks when page first loads
document.addEventListener("DOMContentLoaded", () => {
  refreshTasks();
});

// Event listeners for filtering and sorting
const filterSelect = document.getElementById("filter");
const sortSelect = document.getElementById("sort");

filterSelect.addEventListener("change", (e) => {
  currentFilter = e.target.value;
  refreshTasks(currentFilter, currentSort);
});

document.getElementById("sort").addEventListener("change", (e) => {
  currentSort = e.target.value;
  refreshTasks(currentFilter, currentSort);
});

// Adding a task: listen for form submission
// When the user types a task and submits the form, this runs
document.getElementById("task-form").addEventListener("submit", async (e) => {
  e.preventDefault(); // stop page reload on form submit

  const title = document.getElementById("task-input").value.trim();
  // const title = input.value.trim();
  const due_date = document.getElementById("due-date").value;
  const priority = document.getElementById("priority").value;

  // convert hours + minutes => total minutes
  const minutes = parseInt(document.getElementById("minutes").value) || 0;
  const hours = parseInt(document.getElementById("hours").value) || 0;
  const estimated_time = minutes + hours * 60;

  if (!title) return; // don't allow empty tasks

  const newTask = {
    title,
    completed: false,
    due_date,
    priority,
    estimated_time,
  };

  await addTask(newTask); // call the function to add task to backend
  await refreshTasks();

  e.target.reset(); //  clear form after submit
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
      await refreshTasks();
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

        await refreshTasks();
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

    await refreshTasks();
  }
});


// pagination event listeners
document.getElementById("nextPage").addEventListener("click", async () => {
  currentPage++;
  await refreshTasks(currentFilter, currentSort);
  updatePageInfo();
});

document.getElementById("prevPage").addEventListener("click", async () => {
  if (currentPage > 1) {
    currentPage--;
    await refreshTasks(currentFilter, currentSort);
    updatePageInfo();
  }  
});

// helper function to update "Page X" text
function updatePageInfo() {
  document.getElementById("page-info").textContent = `Page ${currentPage}`;
}

// load tasks when the page loads
document.addEventListener("DOMContentLoaded", async () => {
  await refreshTasks(currentFilter, currentSort);
  updatePageInfo();
});
