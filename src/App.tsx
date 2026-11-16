import { FormEvent, useCallback, useEffect, useState } from 'react'
import {
  createTodo,
  deleteTodo,
  fetchTodos,
  updateTodo,
} from './api/todos'
import type { Todo } from './types/todo'
import './App.css'

function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  const loadTodos = useCallback(async () => {
    setError(null)
    try {
      setLoading(true)
      const list = await fetchTodos()
      setTodos(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : '목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTodos()
  }, [loadTodos])

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    const title = newTitle.trim()
    if (!title) return

    setSubmitting(true)
    setError(null)
    try {
      const todo = await createTodo(title)
      setTodos((prev) => [todo, ...prev])
      setNewTitle('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '추가에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleCompleted = async (todo: Todo) => {
    setError(null)
    const completed = !todo.completed
    setTodos((prev) =>
      prev.map((t) => (t._id === todo._id ? { ...t, completed } : t)),
    )
    try {
      const updated = await updateTodo(todo._id, { completed })
      setTodos((prev) => prev.map((t) => (t._id === updated._id ? updated : t)))
    } catch (e) {
      setTodos((prev) =>
        prev.map((t) => (t._id === todo._id ? { ...t, completed: todo.completed } : t)),
      )
      setError(e instanceof Error ? e.message : '상태 변경에 실패했습니다.')
    }
  }

  const startEdit = (todo: Todo) => {
    setEditingId(todo._id)
    setEditTitle(todo.title)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
  }

  const saveEdit = async (id: string) => {
    const title = editTitle.trim()
    if (!title) {
      setError('할 일 내용을 입력해 주세요.')
      return
    }

    const previous = todos.find((t) => t._id === id)
    if (!previous || previous.title === title) {
      cancelEdit()
      return
    }

    setError(null)
    setTodos((prev) =>
      prev.map((t) => (t._id === id ? { ...t, title } : t)),
    )
    try {
      const updated = await updateTodo(id, { title })
      setTodos((prev) => prev.map((t) => (t._id === id ? updated : t)))
      cancelEdit()
    } catch (e) {
      setTodos((prev) =>
        prev.map((t) => (t._id === id ? previous : t)),
      )
      setError(e instanceof Error ? e.message : '수정에 실패했습니다.')
    }
  }

  const handleDelete = async (id: string) => {
    setError(null)
    const snapshot = todos
    setTodos((prev) => prev.filter((t) => t._id !== id))
    if (editingId === id) cancelEdit()

    try {
      await deleteTodo(id)
    } catch (e) {
      setTodos(snapshot)
      setError(e instanceof Error ? e.message : '삭제에 실패했습니다.')
    }
  }

  const remaining = todos.filter((t) => !t.completed).length

  return (
    <div className="app">
      <header className="header">
        <h1>할 일</h1>
        <p className="subtitle">
          {todos.length === 0
            ? '오늘 할 일을 적어 보세요.'
            : `남은 일 ${remaining}개`}
        </p>
      </header>

      <form className="add-form" onSubmit={handleAdd}>
        <input
          type="text"
          className="add-input"
          placeholder="새 할 일 입력..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          maxLength={500}
          disabled={submitting}
        />
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          추가
        </button>
      </form>

      {error && (
        <div className="banner banner-error" role="alert">
          {error}
          <button
            type="button"
            className="banner-dismiss"
            onClick={() => setError(null)}
            aria-label="오류 닫기"
          >
            ×
          </button>
        </div>
      )}

      <section className="list-section" aria-live="polite">
        {loading ? (
          <p className="status">불러오는 중...</p>
        ) : todos.length === 0 ? (
          <p className="status empty">등록된 할 일이 없습니다.</p>
        ) : (
          <ul className="todo-list">
            {todos.map((todo) => (
              <li
                key={todo._id}
                className={`todo-item${todo.completed ? ' completed' : ''}`}
              >
                <input
                  type="checkbox"
                  className="todo-check"
                  checked={todo.completed}
                  onChange={() => toggleCompleted(todo)}
                  aria-label={`${todo.title} 완료 표시`}
                />

                {editingId === todo._id ? (
                  <div className="edit-row">
                    <input
                      type="text"
                      className="edit-input"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      maxLength={500}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(todo._id)
                        if (e.key === 'Escape') cancelEdit()
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-small"
                      onClick={() => saveEdit(todo._id)}
                    >
                      저장
                    </button>
                    <button
                      type="button"
                      className="btn btn-small btn-ghost"
                      onClick={cancelEdit}
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="todo-title">{todo.title}</span>
                    <div className="todo-actions">
                      <button
                        type="button"
                        className="btn btn-small btn-ghost"
                        onClick={() => startEdit(todo)}
                        disabled={todo.completed}
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        className="btn btn-small btn-danger"
                        onClick={() => handleDelete(todo._id)}
                      >
                        삭제
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {!loading && error && todos.length === 0 && (
        <button type="button" className="btn btn-ghost retry" onClick={loadTodos}>
          다시 시도
        </button>
      )}
    </div>
  )
}

export default App