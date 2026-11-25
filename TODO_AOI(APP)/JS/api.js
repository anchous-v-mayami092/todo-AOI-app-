// Адрес тестового сервера (API), откуда будем брать и куда отправлять задачи
const API_URL = "https://jsonplaceholder.typicode.com/todos";

// Асинхронно запрашивает 10 примеров задач с сервера (GET-запрос) и возвращает массив.
// Если сервер вернул код ошибки (например, 404 или 500), выбрасывает исключение.
export async function fetchSampleTasks() {
    const res = await fetch(`${API_URL}?_limit=10`);
    // fetch не считает коды 404/500 ошибкой сети, поэтому проверяем свойство ok вручную
    if (!res.ok) throw new Error("Ошибка сервера");
    return await res.json();
}

// Отправляет текст новой задачи на сервер (POST-запрос) для имитации сохранения.
// Принимает строку text, возвращает объект созданной задачи от сервера.
export async function createTaskOnServer(text) {
    const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Превращаем JS-объект в JSON-строку для передачи по сети
        body: JSON.stringify({ title: text, completed: false, userId: 1 }),
    });
    return await res.json();
}

// Частично обновляет задачу на сервере по её id (PATCH-запрос), меняя только статус выполнения.
// Принимает id задачи и логическое значение completed (true/false).
export async function updateTaskOnServer(id, completed) {
    await fetch(`${API_URL}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
    });
}

// Отправляет запрос на удаление задачи с сервера по её уникальному id (DELETE-запрос).
export async function deleteTaskOnServer(id) {
    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
}