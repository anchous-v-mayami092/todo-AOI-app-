// Импортируем функции для работы с хранилищами браузера
import { loadTasks, saveTasks, loadFilter, saveFilter } from "./storage.js";
// Импортируем функции управления массивом задач
import {
    initializeTasks,
    getTasks,
    addTask,
    toggleTask,
    deleteTask,
    clearCompleted,
    getFilteredTasks,
} from "./tasks.js";
// Импортируем функции для отправки и получения данных с сервера
import {
    fetchSampleTasks,
    createTaskOnServer,
    updateTaskOnServer,
    deleteTaskOnServer,
} from "./api.js";

// Загружаем сохранённый фильтр из SessionStorage
let currentFilter = loadFilter();

// Находим нужные HTML-элементы на странице по их ID
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const filtersContainer = document.getElementById("filters");
const stats = document.getElementById("stats");
const loadSamplesBtn = document.getElementById("loadSamples");
const clearCompletedBtn = document.getElementById("clearCompleted");

// Загружаем задачи из памяти браузера и сразу отрисовываем их на экране
initializeTasks(loadTasks());
renderTasks();

// Делегирование событий: ловим переключение чекбокса (событие change) на всём списке задач
taskList.addEventListener("change", (e) => {
    // Проверяем, что кликнули именно по чекбоксу
    if (e.target.type !== "checkbox") return;
    // Находим ближайший родительский тег <li>, в котором лежит задача
    const li = e.target.closest("li");
    if (!li) return;
    // Получаем ID задачи из data-атрибута
    const id = li.dataset.id;

    // Меняем статус выполнения задачи и отправляем обновление на сервер
    toggleTask(id);
    const task = getTasks().find((t) => t.id === id);
    if (task) {
        updateTaskOnServer(id.replace("server-", ""), task.completed).catch(() => {});
    }
    saveAndRender();
});

// Делегирование событий: ловим клик по кнопке удаления на всём списке задач
taskList.addEventListener("click", (e) => {
    // Проверяем, был ли клик внутри кнопки удаления (.delete-btn)
    if (!e.target.closest(".delete-btn")) return;
    const li = e.target.closest("li");
    if (!li) return;
    const id = li.dataset.id;

    // Удаляем задачу локально и отправляем запрос на удаление на сервер
    deleteTask(id);
    deleteTaskOnServer(id.replace("server-", "")).catch(() => {});
    saveAndRender();
});

// Обработчик отправки формы добавления новой задачи
taskForm.addEventListener("submit", async (e) => {
    // Отменяем стандартную перезагрузку страницы при отправке формы
    e.preventDefault();
    const text = taskInput.value.trim();
    if (!text) return;

    // Получаем выбранный приоритет и добавляем задачу в список
    const priority = document.getElementById("prioritySelect").value;
    addTask(text, priority);

    // Пытаемся сохранить новую задачу на сервере
    try {
        await createTaskOnServer(text);
    } catch (err) {
        console.warn("Не удалось сохранить на сервере", err);
    }

    // Очищаем поле ввода и возвращаем приоритет по умолчанию
    taskInput.value = "";
    document.getElementById("prioritySelect").value = "medium";
    saveAndRender();
});

// Обработчик переключения кнопок фильтрации (Все / Активные / Выполненные)
filtersContainer.addEventListener("click", (e) => {
    if (!e.target.dataset.filter) return;
    currentFilter = e.target.dataset.filter;
    saveFilter(currentFilter);

    // Переключаем визуальную подсветку (класс active) на выбранной кнопке
    document.querySelectorAll(".filter-btn").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.filter === currentFilter);
    });
    renderTasks();
});
// Асинхронный обработчик клика по кнопке "Загрузить с сервера"
loadSamplesBtn.addEventListener("click", async () => {
    // Блокируем кнопку и включаем анимацию спиннера на время загрузки
    loadSamplesBtn.disabled = true;
    loadSamplesBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Загрузка...`;

    try {
        const data = await fetchSampleTasks();

        // Создаём Set из текстов существующих задач в нижнем регистре для защиты от дубликатов
        const currentTasks = getTasks();
        const existingTexts = new Set(
            currentTasks.map((t) => t.text.toLowerCase().trim())
        );

        let addedCount = 0;

        // Перебираем задачи с сервера и добавляем только уникальные
        data.forEach((item) => {
            const norm = item.title.toLowerCase().trim();
            if (!existingTexts.has(norm)) {
                const task = addTask(item.title, "medium");
                task.completed = item.completed;
                // Добавляем префикс server-, чтобы отличать задачи с сервера от локальных
                task.id = `server-${item.id}`;
                existingTexts.add(norm);
                addedCount++;
            }
        });

        if (addedCount === 0) {
            alert("Все задачи уже загружены — дубликаты пропущены");
        } else {
            alert(`Добавлено ${addedCount} новых задач`);
        }

        saveAndRender();
    } catch (err) {
        alert("Ошибка загрузки: " + err.message);
    } finally {
        // Возвращаем кнопку в исходное рабочее состояние независимо от результата
        loadSamplesBtn.disabled = false;
        loadSamplesBtn.innerHTML = `<i class="fas fa-cloud-download-alt"></i> Загрузить с сервера`;
    }
});

// Обработчик удаления всех выполненных задач с подтверждением пользователя
clearCompletedBtn.addEventListener("click", () => {
    if (confirm("Очистить выполненные?")) {
        clearCompleted();
        saveAndRender();
    }
});

// Вспомогательная функция: сохраняет актуальный список в LocalStorage и обновляет интерфейс
function saveAndRender() {
    saveTasks(getTasks());
    renderTasks();
}

// Главная функция отрисовки списка задач и статистики на странице
function renderTasks() {
    const filteredTasks = getFilteredTasks(currentFilter);
    // Очищаем текущий список в HTML перед новой отрисовкой
    taskList.innerHTML = "";

    // Сопоставляем уровень приоритета с цветом полоски в Tailwind
    const priorityColors = {
        high: "bg-red-600",
        medium: "bg-amber-500",
        low: "bg-emerald-600",
    };

    // Создаём HTML-элемент <li> для каждой задачи
    filteredTasks.forEach((task) => {
        const li = document.createElement("li");
        li.dataset.id = task.id;
        li.className =
            "group flex rounded-2xl overflow-hidden bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 transition-all cursor-pointer";

        const priorityClass = priorityColors[task.priority] || "bg-zinc-600";

        // Заполняем внутреннюю разметку задачи: цветную полоску, чекбокс, текст и кнопку удаления
        li.innerHTML = `
            <div class="w-2 flex-shrink-0 ${priorityClass}"></div>
            <div class="flex-1 flex items-center gap-4 px-5 py-5">
                <input type="checkbox"
                       class="w-6 h-6 accent-emerald-500 cursor-pointer"
                       ${task.completed ? "checked" : ""}>
                <div class="flex-1">
                    <span class="task-text text-lg ${task.completed ? "task-completed" : ""}">
                        ${task.text}
                    </span>
                </div>
                <button class="delete-btn text-red-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition pointer-events-auto">
                    <i class="fas fa-trash text-xl"></i>
                </button>
            </div>
        `;

        // Вешаем обработчик двойного клика для редактирования приоритета задачи
        li.addEventListener("dblclick", (e) => {
            // Игнорируем двойной клик по чекбоксу или кнопке корзины
            if (e.target.type === "checkbox" || e.target.closest(".delete-btn")) {
                return;
            }
            startPriorityEdit(task, li, li.querySelector(".task-text"));
        });

        taskList.appendChild(li);
    });

    // Обновляем статистику внизу карточки
    const all = getTasks();
    const done = all.filter((t) => t.completed).length;
    stats.textContent = `${all.length} задач • ${done} выполнено`;
}

// Заменяет текст приоритета на выпадающий список (select) для редактирования по двойному клику
function startPriorityEdit(task, li, taskTextElement) {
    const select = document.createElement("select");
    select.className =
        "ml-3 bg-zinc-800 border border-zinc-600 rounded px-3 py-1.5 text-base text-zinc-100 " +
        "focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 " +
        "min-w-[110px] shadow-sm";

    // Заполняем выпадающий список вариантами приоритета
    ["low", "medium", "high"].forEach((p) => {
        const opt = document.createElement("option");
        opt.value = p;
        opt.textContent = p.charAt(0).toUpperCase() + p.slice(1);
        if (p === task.priority) opt.selected = true;
        select.appendChild(opt);
    });

    // Вставляем список сразу после текста задачи и переводим на него фокус
    taskTextElement.insertAdjacentElement("afterend", select);
    select.focus();

    // Сохраняет новый приоритет и убирает выпадающий список
    const savePriority = () => {
        const newPriority = select.value;
        if (newPriority !== task.priority) {
            task.priority = newPriority;
            saveAndRender();
        }
        select.remove();
    };

    // Сохраняем при выборе мышкой или потере фокуса
    select.addEventListener("change", savePriority);
    select.addEventListener("blur", savePriority);

    // Управление с клавиатуры: Enter сохраняет, Escape отменяет
    select.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            savePriority();
        }
        if (e.key === "Escape") {
            select.remove();
        }
    });
}
