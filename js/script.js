class TodoItemFormatter {
    formatTask(task) {
        return task.length > 14 ? task.slice(0, 14) + '...' : task;
    }

    formatDate(dueDate) {
        return dueDate || "No due date";
    }

    formatStatus(status) {
        return status ? "Completed" : "Pending";
    }
}

class TodoManager {
    constructor(todoItemFormatter) {
        this.todos = JSON.parse(localStorage.getItem("todos")) || [];
        this.todoItemFormatter = todoItemFormatter;
    }

    addTodo(task, dueDate, description = "") {
        const newTodo = {
            id: this.getRandomId(),
            task: task,
            dueDate: this.todoItemFormatter.formatDate(dueDate),
            completed: false,
            status: "pending",
            description
        };
        this.todos.push(newTodo);
        this.saveToLocalStorage();
        return newTodo;
    }

    editTodo(id, updatedTask, updatedDueDate, updatedDescription = "") {
        const todo = this.todos.find((t) => t.id === id);
        if (todo) {
            todo.task = updatedTask;
            todo.dueDate = this.todoItemFormatter.formatDate(updatedDueDate);
            todo.description = updatedDescription;
            this.saveToLocalStorage();
        }
        return todo;
    }

    deleteTodo(id) {
        this.todos = this.todos.filter((todo) => todo.id !== id);
        this.saveToLocalStorage();
    }

    toggleTodoStatus(id) {
        const todo = this.todos.find((t) => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveToLocalStorage();
        }
    }

    clearAllTodos() {
        if (this.todos.length > 0) {
            this.todos = [];
            this.saveToLocalStorage();
        }
    }

    filterTodos(status) {
        switch (status) {
            case "all":
                return this.todos;
            case "pending":
                return this.todos.filter((todo) => !todo.completed);
            case "completed":
                return this.todos.filter((todo) => todo.completed);
            default:
                return [];
        }
    }

    getRandomId() {
        return (
            Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15)
        );
    }

    saveToLocalStorage() {
        localStorage.setItem("todos", JSON.stringify(this.todos));
    }
}

class UIManager {
    constructor(todoManager, todoItemFormatter) {
        this.todoManager = todoManager;
        this.todoItemFormatter = todoItemFormatter;
        this.taskInput = document.querySelector("input");
        this.descriptionInput = document.getElementById("description-input");
        this.descriptionToggle = document.getElementById("toggle-description");
        this.dateInput = document.querySelector(".date-input");
        this.addBtn = document.querySelector(".add-task-button");
        this.todosListBody = document.querySelector(".todos-list-body");
        this.alertMessage = document.querySelector(".alert-message");
        this.deleteAllBtn = document.querySelector(".delete-all-button");
        this.currentEditingId = null;
        this.selectedTodosIds = [];
        this.selectedIds = new Set();

        this.addEventListeners();
        this.setupKeyboardNavigation();
        this.showAllTodos();
    }

    addEventListeners() {
        this.addBtn.addEventListener("click", () => {
            if (this.currentEditingId) {
                this.handleSaveEdit();
            } else {
                this.handleAddTodo();
            }
        });

        this.taskInput.addEventListener("keyup", (e) => {
            if (e.key === "Enter" && this.taskInput.value.length > 0) {
                if (this.currentEditingId) {
                    this.handleSaveEdit();
                } else {
                    this.handleAddTodo();
                }
            }
        });

        this.deleteAllBtn.addEventListener("click", () => {
            if (this.selectedTodosIds.length > 0) {
                this.handleBulkDelete();
            } else {
                this.handleClearAllTodos();
            }
        });

        const filterButtons = document.querySelectorAll(".todos-filter li");
        filterButtons.forEach((button) => {
            button.addEventListener("click", () => {
                const status = button.textContent.toLowerCase();
                this.handleFilterTodos(status);
            });
        });

        // Move selectAllCheckbox logic inside the method
        const selectAllCheckbox = document.getElementById("select-all-checkbox");
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener("change", (e) => {
                const isChecked = e.target.checked;
                const checkboxes = document.querySelectorAll(".select-todo-checkbox");

                this.selectedTodosIds = [];

                checkboxes.forEach((cb) => {
                    cb.checked = isChecked;
                    const id = cb.getAttribute("data-id");

                    if (isChecked) {
                        this.selectedTodosIds.push(id);
                    }
                });

                this.updateBulkDeleteButton();
            });
        }

        this.descriptionToggle.addEventListener("change", () => {
            this.descriptionInput.style.display = this.descriptionToggle.checked ? "block" : "none";
        });
    }

    setupKeyboardNavigation() {
        this.taskInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && this.taskInput.value.trim() !== "") {
                e.preventDefault();
                this.dateInput.focus();
            }
        });

        this.dateInput.addEventListener("input", () => {
            const val = this.dateInput.value;
            const parts = val.split("-");
            if (parts.length >= 1 && parts[0].length > 4) {
                parts[0] = parts[0].slice(0, 4);
                this.dateInput.value = parts.join("-");
            }
        });

        this.dateInput.addEventListener("keydown", (e) => {
            const val = this.dateInput.value;

            if (e.key === "Enter") {
                e.preventDefault();
                this.addBtn.focus();
            }

            if (e.key === "Backspace") {
                e.preventDefault();

                if (val.length > 10) {
                    this.dateInput.value = val.slice(0, 7);
                    e.preventDefault();
                } else if (val.length > 7) {
                    this.dateInput.value = val.slice(0, 4);
                    e.preventDefault();
                } else if (val.length >= 4) {
                    this.dateInput.value = "";
                    e.preventDefault();
                } else {
                    this.taskInput.focus();
                }
            }
        });

        this.addBtn.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                if (this.currentEditingId) {
                    this.handleSaveEdit();
                } else {
                    this.handleAddTodo();
                }
            }
        });
    }

    handleAddTodo() {
        const task = this.taskInput.value;
        const dueDate = this.dateInput.value;
        const description = this.descriptionToggle.checked ? this.descriptionInput.value : "";

        if (dueDate) {
            const year = parseInt(dueDate.split("-")[0], 10);
            if (year > 9999) {
                this.showAlertMessage("Year must be 4 digits or less.", "error");
                return;
            }
        }

        if (task === "") {
            this.showAlertMessage("Please enter a task.", "error");

            this.descriptionInput.value = "";
            this.descriptionInput.style.display = "none";
            this.descriptionToggle.checked = false;

            return;
        }
            this.todoManager.addTodo(task, dueDate, description);
            this.showAllTodos();
            this.taskInput.value = "";
            this.dateInput.value = "";
            this.descriptionInput.value = "";
            this.descriptionToggle.checked = false;
            this.descriptionInput.style.display = "none";

        this.showAlertMessage("Task added successfully!", "success");
    }

    handleSaveEdit() {
        const updatedTask = this.taskInput.value.trim();
        const updatedDate = this.dateInput.value;
        const updatedDescription = this.descriptionToggle.checked ? this.descriptionInput.value : "";

        if (updatedTask === "") {
            this.showAlertMessage("Please enter a task.", "error");
            return;
        }

        if (updatedDate) {
            const year = parseInt(updatedDate.split("-")[0], 10);
            if (year > 9999) {
                this.showAlertMessage("Year must be 4 digits or less.", "error");
                return;
            }
        }

        this.todoManager.editTodo(this.currentEditingId, updatedTask, updatedDate, updatedDescription);
        this.taskInput.value = "";
        this.dateInput.value = "";
        this.descriptionInput.value = "";
        this.descriptionToggle.checked = false;
        this.descriptionInput.style.display = "none";

        this.currentEditingId = null;
        this.addBtn.innerHTML = "<i class='bx bx-plus bx-sm'></i>";
        this.showAlertMessage("Task updated successfully!", "success");
        this.showAllTodos();
    }

    handleCancelEdit() {
        this.taskInput.value = "";
        this.dateInput.value = "";

        this.descriptionInput.value = "";
        this.descriptionInput.style.display = "none";
        this.descriptionToggle.checked = false;

        this.currentEditingId = null;
        this.addBtn.innerHTML = "<i class='bx bx-plus bx-sm'></i>";
        this.showAllTodos();
    }

    handleClearAllTodos() {
        const totalTodos = this.todoManager.todos.length;

        this.taskInput.value = "";
        this.dateInput.value = "";

        this.descriptionInput.value = "";
        this.descriptionInput.style.display = "none";
        this.descriptionToggle.checked = false;
        
        this.currentEditingId = null;
        this.addBtn.innerHTML = "<i class='bx bx-plus bx-sm'></i>";

        if (totalTodos === 0) {
            this.showAlertMessage("No tasks to clear!", "warning");
        } else {
            this.todoManager.clearAllTodos();
            this.showAlertMessage("All tasks cleared successfully!", "error");
        }

        document.getElementById("select-all-checkbox").checked = false;

        this.showAllTodos();

    }

    handleBulkDelete() {
        if (this.selectedTodosIds.length === 0) return;

        this.selectedTodosIds.forEach((id) => {
            this.todoManager.deleteTodo(id);
        });

        this.selectedTodosIds = [];

        this.taskInput.value = "";
        this.dateInput.value = "";
        this.currentEditingId = null;
        this.addBtn.innerHTML = "<i class='bx bx-plus bx-sm'></i>";

        this.showAlertMessage("Selected tasks deleted successfully!", "success");
        this.showAllTodos();

        document.getElementById("select-all-checkbox").checked = false;

        this.updateBulkDeleteButton();
    }

    showAllTodos() {
        const todos = this.todoManager.filterTodos("all");
        this.displayTodos(todos);
    }

    displayTodos(todos) {
        this.todosListBody.innerHTML = "";

        if (todos.length === 0) {
            this.todosListBody.innerHTML = `<tr><td colspan="5" class="text-center">No task found</td></tr>`;
            return;
        }

        todos.forEach((todo) => {
            const statusIcon = todo.completed ? 'bx-x' : 'bx-check';
            const statusBtnColor = todo.completed ? 'btn-error' : 'btn-success';
            const statusBtnTitle = todo.completed ? 'Mark as Pending' : 'Mark as Completed';
            const isEditing = this.currentEditingId === todo.id;

            this.todosListBody.innerHTML += `
                <tr class="todo-item" data-id="${todo.id}">
                    <td>
                        <input type="checkbox" class="select-todo-checkbox mr-2" data-id="${todo.id}" ${this.currentEditingId ? 'disabled' : ''} ${this.selectedTodosIds.includes(todo.id) ? 'checked' : ''}>

                        ${
                            todo.description?.trim()
                                ? `<button class="toggle-desc-btn" data-id="${todo.id}" title="Show/Hide Description">
                                    <i class="bx bx-show toggle-icon" id="icon-${todo.id}"></i>
                                </button>`
                                : ''
                        }
                    </td>
                    <td>
                        <span class="task-text relative inline-block cursor-pointer hover:underline max-w-[150px] truncate" data-fulltext="${todo.task}">
                            ${this.todoItemFormatter.formatTask(todo.task)}
                        </span>
                    </td>
                    <td>${this.todoItemFormatter.formatDate(todo.dueDate)}</td>
                    <td>${this.todoItemFormatter.formatStatus(todo.completed)}</td>
                    <td>
                        <div class="flex gap-2 justify-center">
                            ${!todo.completed && !isEditing ? `<button class="btn btn-warning btn-sm" onclick="uiManager.handleEditTodo('${todo.id}')">
                                <i class="bx bx-edit-alt bx-bx-xs"></i>
                            </button>` : ''}

                            ${!isEditing ? `<button class="btn ${statusBtnColor} btn-sm" title="${statusBtnTitle}" onclick="uiManager.handleToggleStatus('${todo.id}')">
                                <i class="bx ${statusIcon} bx-xs"></i>
                            </button>` : ''}

                            ${isEditing ? `<button class="btn btn-outline btn-sm" title="Cancel edit" onclick="uiManager.handleCancelEdit()">
                                <i class="bx bx-x bx-xs"></i>
                            </button>` : ''}

                            <button class="btn btn-error btn-sm" onclick="uiManager.handleDeleteTodo('${todo.id}')">
                                <i class="bx bx-trash bx-xs"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;

            if (todo.description && todo.description.trim() !== "") {
                this.todosListBody.innerHTML += `
                    <tr class="description-row hidden" id="desc-${todo.id}">
                        <td colspan="5">
                            <p class="text-sm italic text-gray-400 pl-12 whitespace-pre-wrap break-words">"${todo.description}"</p>
                        </td>
                    </tr>
                `;
            }
        });

        const checkboxes = document.querySelectorAll(".select-todo-checkbox");
        checkboxes.forEach((checkbox) => {
            checkbox.addEventListener("change", (e) => {
                const id = e.target.getAttribute("data-id");

                if (e.target.checked) {
                    if (!this.selectedTodosIds.includes(id)) {
                        this.selectedTodosIds.push(id);
                    }
                } else {
                    this.selectedTodosIds = this.selectedTodosIds.filter((todoId) => todoId !== id);
                }

                //uncheck "select all" if any checkbox is unchecked
                const selectAllCheckbox = document.getElementById("select-all-checkbox");
                if (selectAllCheckbox) {
                    const allChecked = [...checkboxes].every((cb) => cb.checked);
                    selectAllCheckbox.checked = allChecked;
                }

                this.updateBulkDeleteButton();
            });
        });

        const toggleDescBtns = document.querySelectorAll(".toggle-desc-btn");
        toggleDescBtns.forEach((btn) => {
            btn.addEventListener("click", () => {
                const id = btn.getAttribute("data-id");
                const descRow = document.getElementById(`desc-${id}`);
                const icon = document.getElementById(`icon-${id}`);
                if (descRow.classList.contains("hidden")) {
                    descRow.classList.remove("hidden");
                    icon.classList.remove("bx-show");
                    icon.classList.add("bx-hide");
                } else {
                    descRow.classList.add("hidden");
                    icon.classList.remove("bx-hide");
                    icon.classList.add("bx-show");
                }
            });
        });
    }

    handleEditTodo(id) {
        const todo = this.todoManager.todos.find((t) => t.id === id);
        if (todo) {
            this.taskInput.value = todo.task;
            this.dateInput.value = todo.dueDate === "No due date" ? "" : todo.dueDate;

            this.descriptionInput.value = todo.description || "";
            this.descriptionToggle.checked = !!todo.description;
            this.descriptionInput.style.display = todo.description ? "block" : "none";

            this.currentEditingId = id;
            this.addBtn.innerHTML = "<i class='bx bx-check bx-sm'></i>";
            // this.showAllTodos();

            this.taskInput.focus();
            this.taskInput.setSelectionRange(this.taskInput.value.length, this.taskInput.value.length);
        }
    }

    handleToggleStatus(id) {
        this.todoManager.toggleTodoStatus(id);
        this.showAllTodos();

        const todo = this.todoManager.todos.find((t) => t.id === id);
        if (todo.completed) {
            this.showAlertMessage("Awesome, You’ve successfully completed this task!", "success");
        } else {
            this.showAlertMessage("Oopsie! Task status undone", "warning");
        }
    }

    handleDeleteTodo(id) {
        if (this.currentEditingId === id) {
            this.taskInput.value = "";
            this.dateInput.value = "";
            this.currentEditingId = null;
            this.addBtn.innerHTML = "<i class='bx bx-plus bx-sm'></i>";
        }

        this.todoManager.deleteTodo(id);
        this.showAlertMessage("Task deleted successfully!", "error");
        this.showAllTodos();
    }

    handleFilterTodos(status) {
        this.descriptionToggle.checked = false;
        this.descriptionInput.style.display = "none";
        this.descriptionInput.value = "";

        this.currentEditingId = null;
        this.addBtn.innerHTML = "<i class='bx bx-plus bx-sm'></i>";

        const filteredTodos = this.todoManager.filterTodos(status);
        this.displayTodos(filteredTodos);
    }

    showAlertMessage(message, type) {
        const alertBox = `<div class="alert alert-${type} shadow-lg mb-5 w-full">
            <div>
                <span>${message}</span>
            </div>
        `;
        this.alertMessage.innerHTML = alertBox;
        this.alertMessage.classList.remove("hide");
        this.alertMessage.classList.add("show");
        setTimeout(() => {
            this.alertMessage.classList.remove("show");
            this.alertMessage.classList.add("hide");
        }, 3000);
    }

    updateBulkDeleteButton() {
        const btn = this.deleteAllBtn;
        if (this.selectedTodosIds.length > 0) {
            btn.textContent = "Delete";
        } else {
            btn.textContent = "Delete all";
        }
    }
}

class ThemeSwitcher {
    constructor(themes, html) {
        this.theme = themes;
        this.html = html;
        this.init();
    }

    init() {
        const theme = this.getThemeFromLocalStorage();
        if (theme) {
            this.setTheme(theme);
        }

        this.addThemeEventListener();
    }

    addThemeEventListener() {
        this.theme.forEach((theme) => {
            theme.addEventListener("click", () => {
                const themeName = theme.getAttribute("theme");
                this.setTheme(themeName);
                this.saveThemeToLocalStorage(themeName);
            });
        });
    }

    setTheme(themeName) {
        this.html.setAttribute("data-theme", themeName);
    }

    getThemeFromLocalStorage() {
        return localStorage.getItem("theme");
    }

    saveThemeToLocalStorage(themeName) {
        localStorage.setItem("theme", themeName);
    }
}

document.addEventListener("DOMContentLoaded", () => {
  const todoItemFormatter = new TodoItemFormatter();
  const todoManager = new TodoManager(todoItemFormatter);
  const ui = new UIManager(todoManager, todoItemFormatter);

  window.uiManager = ui;

  const themes = document.querySelectorAll(".theme-item");
  const html = document.querySelector("html");
  const themeSwitcher = new ThemeSwitcher(themes, html);

  // expand or collapse task text
  document.addEventListener("click", function (e) {
      const allTasks = document.querySelectorAll(".task-text.expanded");
      allTasks.forEach((el) => {
          if (!el.contains(e.target)) {
              el.classList.remove("expanded");
          }
      });

      if (e.target.classList.contains("task-text")) {
          e.target.classList.toggle("expanded");
      }
  });
});