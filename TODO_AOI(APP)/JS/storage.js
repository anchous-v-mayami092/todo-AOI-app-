// Константы с ключами для хранилищ браузера (защита от опечаток в коде)
export const STORAGE_KEY = "todo_tasks";
export const FILTER_KEY = "todo_filter";

// Загружает задачи из постоянного хранилища LocalStorage и превращает JSON-строку обратно в массив
export const loadTasks = () => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
};

// Превращает массив задач в JSON-строку и сохраняет в LocalStorage
export const saveTasks = (tasks) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
};

// Загружает активный фильтр из временного хранилища вкладки SessionStorage (по умолчанию "all")
export const loadFilter = () => sessionStorage.getItem(FILTER_KEY) || "all";

// Сохраняет выбранный пользователем фильтр в SessionStorage
export const saveFilter = (filter) => {
    sessionStorage.setItem(FILTER_KEY, filter);
};
