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

    addTodo(task, dueDate) {
        const newTodo = {
            id: this.getRandomId(),
            task: task,
            dueDate: this.todoItemFormatter.formatDate(dueDate),
            completed: false,
            status: "pending",
        };
        this.todos.push(newTodo);
        this.saveToLocalStorage();
        return newTodo;
    }

    editTodo(id, updatedTask, updatedDueDate) {
        const todo = this.todos.find((t) => t.id === id);
        if (todo) {
            todo.task = updatedTask;
            todo.dueDate = this.todoItemFormatter.formatDate(updatedDueDate);
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
        
        if (dueDate) {
            const year = parseInt(dueDate.split("-")[0], 10);
            if (year >9999) {
                this.showAlertMessage("Year must be 4 digits or less.", "error");
                return;
            }
        }
        
        if (task === "") {
            this.showAlertMessage("Please enter a task.", "error");
        } else {
            this.todoManager.addTodo(task, dueDate);
            this.showAllTodos();
            this.taskInput.value = "";
            this.dateInput.value = "";
            this.showAlertMessage("Task added successfully!", "success");
        }
    }

    handleSaveEdit() {
        const updatedTask = this.taskInput.value;
        const updatedDate = this.dateInput.value;

        if (updatedDate) {
            const year = parseInt(updatedDate.split("-")[0], 10);
            if (year > 9999) {
                this.showAlertMessage("Year must be 4 digits or less.", "error");
                return;
            }
        }

        this.todoManager.editTodo(this.currentEditingId, updatedTask, updatedDate);
        this.taskInput.value = "";
        this.dateInput.value = "";
        this.currentEditingId = null;
        this.addBtn.innerHTML = "<i class='bx bx-plus bx-sm'></i>";
        this.showAlertMessage("Task updated successfully!", "success");
        this.showAllTodos();
    }

    handleCancelEdit() {
        this.taskInput.value = "";
        this.dateInput.value = "";
        this.currentEditingId = null;
        this.addBtn.innerHTML = "<i class='bx bx-plus bx-sm'></i>";
        this.showAllTodos();
    }

    handleClearAllTodos() {
        this.taskInput.value = "";
        this.dateInput.value = "";
        this.currentEditingId = null;
        this.addBtn.innerHTML = "<i class='bx bx-plus bx-sm'></i>";
        
        this.todoManager.clearAllTodos();
        this.showAllTodos();
        this.showAlertMessage("All tasks cleared successfully!", "error");
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
                    </td>
                    <td>
                        <span class="task-text" data-full-text="${todo.task}">
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

                this.updateBulkDeleteButton();
            });
        });
    }

    handleEditTodo(id) {
        const todo = this.todoManager.todos.find((t) => t.id === id);
        if (todo) {
            this.taskInput.value = todo.task;
            this.dateInput.value = todo.dueDate === "No due date" ? "" : todo.dueDate;
            this.currentEditingId = id;
            this.addBtn.innerHTML = "<i class='bx bx-check bx-sm'></i>";
            this.showAllTodos();

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

// Instantiating the classes
const todoItemFormatter = new TodoItemFormatter();
const todoManager = new TodoManager(todoItemFormatter);
const uiManager = new UIManager(todoManager, todoItemFormatter);
const themes = document.querySelectorAll(".theme-item");
const html = document.querySelector("html");
const themeSwitcher = new ThemeSwitcher(themes, html);

//expand or collapse the task text on click
document.addEventListener("click", function (e) {
    if (e.target.classList.contains("task-text")) {
        e.target.classList.toggle("expanded");
    }
});