import { createElement } from "../function/dom.js";
import { fetchJSON } from "../function/api.js";
import { TodoList } from "./components/Todolist.js";

try {
    const todos = await fetchJSON('https://jsonplaceholder.typicode.com/todos?_limit=10')
    const list = new TodoList(todos)
    list.appendTo(document.querySelector('#todolist'))
} catch (e) {
    const div = createElement('div', {
        class: 'alert alert-danger m-2',
        role: 'alert'
    })
    div.innerText = 'Impossible de charger les elements'
    document.body.prepend(div)
}