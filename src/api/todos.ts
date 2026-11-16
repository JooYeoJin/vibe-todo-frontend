import type { Todo } from '../types/todo'

const API_BASE =
  import.meta.env.VITE_API_URL ??
  'https://vibe-todo-backendd-8b57cf49c71f.herokuapp.com'
const TODOS_URL = `${API_BASE}/todos`

type ApiError = { message?: string }

async function parseJson<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & ApiError
  if (!res.ok) {
    throw new Error(data.message ?? '요청에 실패했습니다.')
  }
  return data
}

export async function fetchTodos(): Promise<Todo[]> {
  const res = await fetch(TODOS_URL)
  return parseJson<Todo[]>(res)
}

export async function createTodo(title: string): Promise<Todo> {
  const res = await fetch(TODOS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  })
  return parseJson<Todo>(res)
}

export async function updateTodo(
  id: string,
  updates: { title?: string; completed?: boolean },
): Promise<Todo> {
  const res = await fetch(`${TODOS_URL}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  return parseJson<Todo>(res)
}

export async function deleteTodo(id: string): Promise<void> {
  const res = await fetch(`${TODOS_URL}/${id}`, { method: 'DELETE' })
  await parseJson(res)
}