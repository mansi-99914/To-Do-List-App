/**
 * Advanced To-Do List Application - script.js
 * Frontend-only application using LocalStorage for persistence.
 * Clean, modular, and production-ready JavaScript.
 *
 * ENHANCEMENT: Added success sound notification (requires 'success.mp3' file).
 */

// --- Global DOM Elements ---
const taskForm = document.getElementById("task-form");
const taskList = document.getElementById("task-list");
const emptyState = document.getElementById("empty-state");

// Inputs for Task Creation
const taskTitleInput = document.getElementById("task-title");
const taskDescriptionInput = document.getElementById("task-description");
const taskDueDateInput = document.getElementById("task-due-date");
const taskPriorityInput = document.getElementById("task-priority");

// Controls
const taskSearchInput = document.getElementById("task-search");
const taskFilterSelect = document.getElementById("task-filter");
const taskSortSelect = document.getElementById("task-sort");
const themeToggleBtn = document.getElementById("theme-toggle");

// Modals
const confirmModal = document.getElementById("confirm-modal");
const modalConfirmBtn = document.getElementById("modal-confirm-btn");
const modalCancelBtn = document.getElementById("modal-cancel-btn");
const editModal = document.getElementById("edit-modal");
const editModalCancelBtn = document.getElementById("edit-modal-cancel-btn");
const editForm = document.getElementById("edit-form");

// ⭐ NEW: Audio Element
const successSound = document.getElementById("success-sound");

// --- State Management ---
// Array to hold all task objects. Initialized from LocalStorage.
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let taskToDeleteId = null; // Used by the confirmation modal
let isEditing = false;

// --- Utility Functions ---

/**
 * Generates a unique ID for a new task.
 * @returns {string} A unique ID string.
 */
const generateUniqueId = () => Date.now().toString();

/**
 * Saves the current tasks array to LocalStorage.
 */
const saveTasks = () => {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

/**
 * Shows a toast notification.
 * @param {string} message - The message to display.
 * @param {string} type - 'success', 'danger', or 'info'.
 */
const showToast = (message, type = "info") => {
  const toastContainer = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.classList.add("toast", type);
  toast.innerHTML = `<i class="fas fa-bell"></i> <span>${message}</span>`;

  toastContainer.appendChild(toast);

  // Show animation
  setTimeout(() => {
    toast.classList.add("show");
  }, 10);

  // Hide animation and remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove("show");
    toast.classList.add("hide");
    toast.addEventListener("transitionend", () => toast.remove());
  }, 3000);
};

/**
 * ⭐ NEW: Plays the success sound notification.
 */
const playSuccessSound = () => {
  if (successSound) {
    // Reset and play the sound
    successSound.currentTime = 0;
    // Use catch to handle browser auto-play restrictions/errors
    successSound
      .play()
      .catch((e) => console.error("Audio playback failed:", e));
  }
};

// --- CRUD Operations ---

/**
 * Adds a new task object to the array.
 * @param {object} taskData - The task data from the form.
 */
const addTask = (taskData) => {
  const newTask = {
    id: generateUniqueId(),
    title: taskData.title,
    description: taskData.description,
    priority: taskData.priority,
    dueDate: taskData.dueDate || null,
    status: "Pending",
    createdAt: new Date().toISOString(),
  };
  tasks.unshift(newTask); // Add to the start
  saveTasks();
  showToast("Task added successfully!", "success");

  // ⭐ Call the new sound function
  playSuccessSound();

  renderTasks();
};

/**
 * Deletes a task by ID.
 * @param {string} id - The ID of the task to delete.
 */
const deleteTask = (id) => {
  const taskElement = document.getElementById(`task-${id}`);
  if (taskElement) {
    // Subtle animation on removal
    taskElement.style.opacity = "0";
    taskElement.style.transform = "scale(0.9)";
    taskElement.addEventListener(
      "transitionend",
      () => {
        tasks = tasks.filter((task) => task.id !== id);
        saveTasks();
        showToast("Task deleted.", "danger");
        renderTasks();
      },
      { once: true }
    );
  } else {
    // Fallback if animation fails
    tasks = tasks.filter((task) => task.id !== id);
    saveTasks();
    showToast("Task deleted.", "danger");
    renderTasks();
  }
};

/**
 * Toggles the 'Completed' status of a task.
 * @param {string} id - The ID of the task to toggle.
 */
const toggleTaskStatus = (id) => {
  const taskIndex = tasks.findIndex((task) => task.id === id);
  if (taskIndex !== -1) {
    const task = tasks[taskIndex];
    const isCompleted = task.status === "Completed";
    task.status = isCompleted ? "Pending" : "Completed";
    saveTasks();
    showToast(`Task marked as ${task.status}.`, "info");

    const card = document.getElementById(`task-${id}`);
    if (card) {
      // Add animation class for visual feedback
      card.classList.add("task-complete-animation");
      card.addEventListener(
        "animationend",
        () => {
          card.classList.remove("task-complete-animation");
          renderTasks(); // Re-render to apply new status styles/filters
        },
        { once: true }
      );
    } else {
      renderTasks();
    }
  }
};

/**
 * Updates an existing task with new data.
 * @param {string} id - The ID of the task to update.
 * @param {object} updatedData - The new data fields.
 */
const updateTask = (id, updatedData) => {
  const taskIndex = tasks.findIndex((task) => task.id === id);
  if (taskIndex !== -1) {
    tasks[taskIndex] = { ...tasks[taskIndex], ...updatedData };
    saveTasks();
    showToast("Task updated successfully.", "info");
    renderTasks();
  }
};

// --- Filtering and Sorting Logic ---

/**
 * Applies current search, filter, and sort settings to the tasks array.
 * @returns {array} The filtered and sorted array of tasks.
 */
const getFilteredAndSortedTasks = () => {
  let currentTasks = [...tasks];
  const searchTerm = taskSearchInput.value.toLowerCase().trim();
  const filterValue = taskFilterSelect.value;
  const sortValue = taskSortSelect.value;

  // 1. Search
  if (searchTerm) {
    currentTasks = currentTasks.filter(
      (task) =>
        task.title.toLowerCase().includes(searchTerm) ||
        task.description.toLowerCase().includes(searchTerm)
    );
  }

  // 2. Filter
  if (filterValue !== "All") {
    if (filterValue === "Completed" || filterValue === "Pending") {
      currentTasks = currentTasks.filter((task) => task.status === filterValue);
    } else if (filterValue.startsWith("Priority-")) {
      const priority = filterValue.split("-")[1];
      currentTasks = currentTasks.filter((task) => task.priority === priority);
    }
  }

  // 3. Sort
  currentTasks.sort((a, b) => {
    switch (sortValue) {
      case "date-desc":
        return new Date(b.createdAt) - new Date(a.createdAt);
      case "date-asc":
        return new Date(a.createdAt) - new Date(b.createdAt);
      case "priority-desc":
        const prioMapDesc = { High: 3, Medium: 2, Low: 1 };
        return prioMapDesc[b.priority] - prioMapDesc[a.priority];
      case "priority-asc":
        const prioMapAsc = { High: 1, Medium: 2, Low: 3 };
        return prioMapAsc[b.priority] - prioMapAsc[a.priority];
      case "status-desc": // Pending first
        const statusMap = { Pending: 1, Completed: 2 };
        return statusMap[a.status] - statusMap[b.status];
      default:
        return 0;
    }
  });

  return currentTasks;
};

// --- Rendering and UI Updates ---

/**
 * Formats a date string into a readable format.
 * @param {string|null} isoString - ISO date string or null.
 * @returns {string} Formatted date string or 'No Due Date'.
 */
const formatDueDate = (isoString) => {
  if (!isoString) return "No Due Date";
  try {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Invalid Date";
  }
};

/**
 * Creates the HTML markup for a single task card.
 * @param {object} task - The task object.
 * @returns {string} The HTML string for the task card.
 */
const createTaskCardHTML = (task) => {
  const isCompleted = task.status === "Completed";
  const statusClass = isCompleted ? "completed" : "pending";
  const completeIcon = isCompleted ? "fa-check-circle" : "fa-circle";

  return `
        <div id="task-${task.id}" class="task-card ${statusClass} priority-${
    task.priority
  }">
            <div class="task-content">
                <div class="task-header">
                    <h4 class="task-title">${task.title}</h4>
                    <div class="task-actions">
                        <button class="action-btn complete-btn ${statusClass}" data-action="toggle" data-id="${
    task.id
  }" title="Mark as ${isCompleted ? "Pending" : "Completed"}">
                            <i class="far ${completeIcon}"></i>
                        </button>
                        <button class="action-btn edit-btn" data-action="edit" data-id="${
                          task.id
                        }" title="Edit Task">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" data-action="delete" data-id="${
                          task.id
                        }" title="Delete Task">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
                ${
                  task.description
                    ? `<p class="task-description">${task.description}</p>`
                    : ""
                }
            </div>
            <div class="task-meta">
                <span class="due-date-display"><i class="far fa-clock"></i> ${formatDueDate(
                  task.dueDate
                )}</span>
                <span class="priority-tag-container">Priority: <span class="priority-tag">${
                  task.priority
                }</span></span>
            </div>
        </div>
    `;
};

/**
 * Updates the task counter and progress bar UI.
 */
const updateTaskStats = () => {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.status === "Completed").length;
  const pending = total - completed;
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  document.getElementById("total-tasks").textContent = `Total: ${total}`;
  document.getElementById(
    "completed-tasks"
  ).textContent = `Completed: ${completed}`;
  document.getElementById("pending-tasks").textContent = `Pending: ${pending}`;
  document.getElementById(
    "completion-progress"
  ).style.width = `${percentage.toFixed(0)}%`;
};

/**
 * Renders the filtered and sorted tasks to the DOM.
 */
const renderTasks = () => {
  const filteredTasks = getFilteredAndSortedTasks();

  // Render Task Cards
  taskList.innerHTML = filteredTasks.map(createTaskCardHTML).join("");

  // Toggle Empty State UI
  if (tasks.length === 0) {
    emptyState.style.display = "block";
    taskList.style.display = "none";
  } else {
    emptyState.style.display = "none";
    taskList.style.display = "grid";
  }

  // Update Stats
  updateTaskStats();
};

// --- Event Handlers ---

/**
 * Handles the submission of the new task form.
 * @param {Event} e - The form submit event.
 */
const handleTaskFormSubmit = (e) => {
  e.preventDefault();

  const title = taskTitleInput.value.trim();
  if (!title) return; // Should be handled by 'required' attribute, but good practice

  const taskData = {
    title: title,
    description: taskDescriptionInput.value.trim(),
    dueDate: taskDueDateInput.value,
    priority: taskPriorityInput.value,
  };

  addTask(taskData);

  // Reset form fields
  taskForm.reset();
  taskPriorityInput.value = "Medium";
};

/**
 * Uses event delegation to handle actions (toggle, edit, delete) on task cards.
 * @param {Event} e - The click event.
 */
const handleTaskActions = (e) => {
  const actionBtn = e.target.closest(".action-btn");
  if (!actionBtn) return;

  const action = actionBtn.dataset.action;
  const id = actionBtn.dataset.id;

  if (action === "delete") {
    taskToDeleteId = id;
    confirmModal.classList.add("active");
  } else if (action === "toggle") {
    toggleTaskStatus(id);
  } else if (action === "edit") {
    showEditModal(id);
  }
};

/**
 * Handles the confirmation of task deletion.
 */
const handleConfirmDeletion = () => {
  if (taskToDeleteId) {
    deleteTask(taskToDeleteId);
    taskToDeleteId = null;
  }
  confirmModal.classList.remove("active");
};

/**
 * Displays and populates the edit modal for a task.
 * @param {string} id - The ID of the task to edit.
 */
const showEditModal = (id) => {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  isEditing = true;

  // Populate form fields
  document.getElementById("edit-task-id").value = task.id;
  document.getElementById("edit-title").value = task.title;
  document.getElementById("edit-description").value = task.description;
  document.getElementById("edit-priority").value = task.priority;

  // Handle due date formatting for the datetime-local input
  if (task.dueDate) {
    // datetime-local input needs a specific format (YYYY-MM-DDTHH:mm)
    const date = new Date(task.dueDate);
    const formattedDate = date.toISOString().substring(0, 16);
    document.getElementById("edit-due-date").value = formattedDate;
  } else {
    document.getElementById("edit-due-date").value = "";
  }

  editModal.classList.add("active");
};

/**
 * Handles the submission of the edit form.
 * @param {Event} e - The form submit event.
 */
const handleEditFormSubmit = (e) => {
  e.preventDefault();

  const id = document.getElementById("edit-task-id").value;
  const updatedData = {
    title: document.getElementById("edit-title").value.trim(),
    description: document.getElementById("edit-description").value.trim(),
    dueDate: document.getElementById("edit-due-date").value,
    priority: document.getElementById("edit-priority").value,
  };

  updateTask(id, updatedData);
  editModal.classList.remove("active");
  isEditing = false;
};

/**
 * Toggles between Dark and Light mode.
 */
const toggleTheme = () => {
  const body = document.body;
  const currentTheme = body.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  body.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);

  // Update button icon
  const icon = themeToggleBtn.querySelector("i");
  icon.classList.toggle("fa-moon", newTheme === "light");
  icon.classList.toggle("fa-sun", newTheme === "dark");
};

/**
 * Handles global keyboard shortcuts.
 * @param {Event} e - The keydown event.
 */
const handleGlobalShortcuts = (e) => {
  // 1. Enter key to submit new task (only when the new task title input is focused and we are not editing)
  if (
    e.key === "Enter" &&
    document.activeElement === taskTitleInput &&
    !isEditing
  ) {
    // Prevent default form submission if we handle it
    e.preventDefault();
    if (taskTitleInput.value.trim() !== "") {
      taskForm.dispatchEvent(new Event("submit", { cancelable: true }));
    }
  }

  // 2. Escape key to close modals
  if (e.key === "Escape") {
    if (confirmModal.classList.contains("active")) {
      confirmModal.classList.remove("active");
      taskToDeleteId = null;
    }
    if (editModal.classList.contains("active")) {
      editModal.classList.remove("active");
      isEditing = false;
    }
  }
};

// --- Initialization ---

/**
 * Sets up all event listeners for the application.
 */
const setupEventListeners = () => {
  // Task Creation and Modals
  taskForm.addEventListener("submit", handleTaskFormSubmit);
  taskList.addEventListener("click", handleTaskActions); // Event Delegation
  modalConfirmBtn.addEventListener("click", handleConfirmDeletion);
  modalCancelBtn.addEventListener("click", () =>
    confirmModal.classList.remove("active")
  );
  editModalCancelBtn.addEventListener("click", () =>
    editModal.classList.remove("active")
  );
  editForm.addEventListener("submit", handleEditFormSubmit);

  // Controls
  taskSearchInput.addEventListener("input", renderTasks);
  taskFilterSelect.addEventListener("change", renderTasks);
  taskSortSelect.addEventListener("change", renderTasks);

  // Theme Toggle
  themeToggleBtn.addEventListener("click", toggleTheme);

  // Global Shortcuts
  document.addEventListener("keydown", handleGlobalShortcuts);
};

/**
 * Loads the user's preferred theme from LocalStorage.
 */
const loadTheme = () => {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.body.setAttribute("data-theme", savedTheme);

  // Initial icon setup
  const icon = themeToggleBtn.querySelector("i");
  icon.classList.remove("fa-moon", "fa-sun");
  icon.classList.add(savedTheme === "light" ? "fa-moon" : "fa-sun");
};

/**
 * Initializes the application.
 */
const init = () => {
  loadTheme();
  setupEventListeners();
  renderTasks(); // Initial render of tasks from LocalStorage
};

// Start the application
init();
