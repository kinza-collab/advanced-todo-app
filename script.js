// Elements
const form = document.getElementById("task-form");
const taskList = document.getElementById("task-list");
const progressText = document.getElementById("progress-text");
const progressBar = document.getElementById("progress-bar");
const themeToggle = document.getElementById("theme-toggle");
const tabPills = document.querySelectorAll(".pill");
const searchInput = document.getElementById("search");
const fab = document.getElementById("fab");
const clearAllBtn = document.getElementById("clear-all");

// Toast setup (Bootstrap)
const toastEl = document.getElementById("action-toast");
const toastBody = document.getElementById("toast-body");
const toast = new bootstrap.Toast(toastEl, { delay: 2000 });

// load tasks
let tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
let currentCategory = "all";
let currentQuery = "";

// UTIL: save + render
function saveTasks(msg) {
  localStorage.setItem("tasks", JSON.stringify(tasks));
  renderTasks();
  if (msg) showToast(msg);
}

// Toast helper
function showToast(text) {
  toastBody.textContent = text;
  toast.show();
}

// Render tasks with filters/search
function renderTasks() {
  taskList.innerHTML = "";
  const filtered = tasks
    .map((t,i) => ({...t, __idx:i}))
    .filter(t => (currentCategory === "all" || t.tag === currentCategory))
    .filter(t => {
      const q = currentQuery.trim().toLowerCase();
      if (!q) return true;
      return (t.title + " " + (t.desc || "")).toLowerCase().includes(q);
    });

  filtered.forEach(task => {
    const card = document.createElement("div");
    card.className = `task-card ${task.priority === 'low' ? 'prio-low' : task.priority === 'medium' ? 'prio-medium' : 'prio-high' }`;
    if (task.completed) { card.style.opacity = "0.64"; card.style.textDecoration = "line-through"; }

    const dueText = task.date ? `📅 ${task.date}` : `📅 —`;
    card.innerHTML = `
      <div class="row gx-2">
        <div class="col-9">
          <div class="task-title">${escapeHtml(task.title)}</div>
          ${task.desc ? `<div class="task-desc">${escapeHtml(task.desc)}</div>` : ""}
          <div class="task-meta d-flex gap-3 mt-2">
            <div>${dueText}</div>
            <div>⭐ ${task.priority}</div>
            <div>🏷 ${task.tag}</div>
          </div>
        </div>
        <div class="col-3 d-flex justify-content-end align-items-start">
          <div class="task-actions">
            <button class="icon-btn done-btn" title="Toggle complete">${task.completed ? '↺' : '✔'}</button>
            <button class="icon-btn edit-btn" title="Edit">✎</button>
            <button class="icon-btn delete-btn" title="Delete">✖</button>
          </div>
        </div>
      </div>
    `;

    // actions
    card.querySelector(".done-btn").addEventListener("click", () => {
      tasks[task.__idx].completed = !tasks[task.__idx].completed;
      saveTasks("Task updated");
    });

    card.querySelector(".delete-btn").addEventListener("click", () => {
      tasks.splice(task.__idx, 1);
      saveTasks("Task deleted");
    });

    card.querySelector(".edit-btn").addEventListener("click", () => {
      // populate form for quick edit (simple inline edit flow)
      document.getElementById("title").value = task.title;
      document.getElementById("desc").value = task.desc || "";
      document.getElementById("date").value = task.date || "";
      document.getElementById("priority").value = task.priority || "medium";
      document.getElementById("tag").value = task.tag || "personal";

      // remove task (we will re-add on submit) and focus
      tasks.splice(task.__idx, 1);
      saveTasks(); // re-render
      document.getElementById("title").focus();
      showToast("Edit mode — update fields & press Add");
    });

    taskList.appendChild(card);
  });

  updateProgress();
}

// Escape HTML to avoid injection
function escapeHtml(str = "") {
  return str.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}

// Progress
function updateProgress() {
  const total = tasks.length;
  const done = tasks.filter(t => t.completed).length;
  progressText.textContent = `${done} / ${total} done`;
  const pct = total ? Math.round((done / total) * 100) : 0;
  progressBar.style.width = pct + "%";
}

// Form: add task
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const newTask = {
    title: document.getElementById("title").value.trim(),
    desc: document.getElementById("desc").value.trim(),
    date: document.getElementById("date").value,
    priority: document.getElementById("priority").value,
    tag: document.getElementById("tag").value,
    completed: false
  };
  if (!newTask.title) {
    showToast("Please add a title");
    return;
  }
  tasks.push(newTask);
  saveTasks("Task added");
  form.reset();
});

// Clear all
clearAllBtn.addEventListener("click", () => {
  if (!confirm("Clear all tasks? This can't be undone.")) return;
  tasks = [];
  saveTasks("All cleared");
});

// Theme toggle
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// Pills (category)
tabPills.forEach(p => {
  p.addEventListener("click", () => {
    tabPills.forEach(x => x.classList.remove("active"));
    p.classList.add("active");
    currentCategory = p.dataset.category;
    renderTasks();
  });
});

// Search
searchInput.addEventListener("input", (e) => {
  currentQuery = e.target.value;
  renderTasks();
});

// FAB focuses input (mobile-friendly)
fab.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
  document.getElementById("title").focus();
  document.getElementById("title").classList.add("pulse");
  setTimeout(() => document.getElementById("title").classList.remove("pulse"), 900);
});

// small helper: initial render
renderTasks();
