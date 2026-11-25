// Приватный массив для хранения всех задач (инкапсуляция состояния)
let tasks = [];

// Инициализирует список задач при запуске, копируя переданный массив через spread-оператор
export const initializeTasks = (initialTasks) => {
    tasks = [...initialTasks];
};

// Возвращает актуальный массив всех задач для отрисовки или сохранения
export const getTasks = () => tasks;

// Создает объект новой задачи с уникальным ID и датой, добавляет в массив и возвращает её
export const addTask = (text, priority = "medium") => {
    const task = {
        id: Date.now().toString(),
        text: text.trim(),
        completed: false,
        priority: priority,
        createdAt: new Date().toISOString(),
    };
    tasks.push(task);
    return task;
};

// Ищет задачу по id и меняет её приоритет на новый
export const updatePriority = (id, newPriority) => {
    const task = tasks.find((t) => t.id === id);
    if (task) task.priority = newPriority;
};

// Ищет задачу по id и переключает статус выполнения (true/false) на противоположный
export const toggleTask = (id) => {
    const task = tasks.find((t) => t.id === id);
    if (task) task.completed = !task.completed;
};

// Перезаписывает массив, удаляя задачу с указанным id
export const deleteTask = (id) => {
    tasks = tasks.filter((t) => t.id !== id);
};

// Удаляет из массива все выполненные задачи, оставляя только активные
export const clearCompleted = () => {
    tasks = tasks.filter((t) => !t.completed);
};

// Возвращает отфильтрованный список задач в зависимости от выбранной вкладки (all/active/completed)
export const getFilteredTasks = (filter) => {
    if (filter === "active") return tasks.filter((t) => !t.completed);
    if (filter === "completed") return tasks.filter((t) => t.completed);
    return tasks;
};
