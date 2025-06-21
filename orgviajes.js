let trips = [];
let todos = [];
let expenses = [];
let isDark = false;

// VIAJES
const tripForm = document.getElementById("tripForm");
const tripCards = document.getElementById("tripCards");

tripForm.addEventListener("submit", e => {
  e.preventDefault();
  const trip = {
    destination: document.getElementById("destination").value,
    startDate: document.getElementById("startDate").value,
    endDate: document.getElementById("endDate").value,
    budget: parseFloat(document.getElementById("budget").value)
  };
  trips.push(trip);
  renderTrips();
  tripForm.reset();
});

function renderTrips() {
  tripCards.innerHTML = "";
  trips.forEach((t, i) => {
    const div = document.createElement("div");
    div.innerHTML = `
      <h3>${t.destination}</h3>
      <p>🗓️ ${t.startDate} a ${t.endDate}</p>
      <p>💰 Presupuesto: $${t.budget}</p>
      <button onclick="deleteTrip(${i})">Eliminar</button>
    `;
    tripCards.appendChild(div);
  });
}

function deleteTrip(index) {
  trips.splice(index, 1);
  renderTrips();
}

// TODO LIST
function addTodo() {
  const val = document.getElementById("todoInput").value.trim();
  if (val === "") return;
  todos.push(val);
  renderTodos();
  document.getElementById("todoInput").value = "";
}

function renderTodos() {
  const list = document.getElementById("todoList");
  list.innerHTML = "";
  todos.forEach((t, i) => {
    const li = document.createElement("li");
    li.innerHTML = `${t} <button onclick="deleteTodo(${i})">❌</button>`;
    list.appendChild(li);
  });
}

function deleteTodo(i) {
  todos.splice(i, 1);
  renderTodos();
}

// GASTOS
function addExpense() {
  const name = document.getElementById("expenseName").value.trim();
  const amount = parseFloat(document.getElementById("expenseAmount").value);
  if (!name || isNaN(amount)) return;
  expenses.push({ name, amount });
  renderExpenses();
  document.getElementById("expenseName").value = "";
  document.getElementById("expenseAmount").value = "";
}

function renderExpenses() {
  const list = document.getElementById("expenseList");
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  list.innerHTML = "";
  expenses.forEach((e, i) => {
    const li = document.createElement("li");
    li.innerHTML = `${e.name}: $${e.amount} <button onclick="deleteExpense(${i})">❌</button>`;
    list.appendChild(li);
  });
  document.getElementById("totalExpenses").innerText = `Total estimado: $${total}`;
}

function deleteExpense(i) {
  expenses.splice(i, 1);
  renderExpenses();
}

// MODO OSCURO
function toggleDarkMode() {
  isDark = !isDark;
  document.body.classList.toggle("dark-mode", isDark);
}
