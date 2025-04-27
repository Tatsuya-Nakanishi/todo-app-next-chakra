import { TodoStatus } from "@/generated/graphql";
import { Todo } from "@/hooks/useTodos";

export function useStatusHelpers() {
  // ステータスに応じた色を返す関数
  const getStatusColor = (status: TodoStatus) => {
    switch (status) {
      case TodoStatus.NotStarted:
        return "red";
      case TodoStatus.InProgress:
        return "blue";
      case TodoStatus.Completed:
        return "green";
      default:
        return "gray";
    }
  };

  // ステータスに応じたラベルを返す関数
  const getStatusLabel = (status: TodoStatus) => {
    switch (status) {
      case TodoStatus.NotStarted:
        return "未対応";
      case TodoStatus.InProgress:
        return "作業中";
      case TodoStatus.Completed:
        return "完了";
      default:
        return "";
    }
  };

  // ステータスごとにタスクをフィルタリング
  const filterTodosByStatus = (todos: Todo[]) => {
    const notStartedTodos =
      todos.filter((todo) => todo.status === TodoStatus.NotStarted) || [];
    const inProgressTodos =
      todos.filter((todo) => todo.status === TodoStatus.InProgress) || [];
    const completedTodos =
      todos.filter((todo) => todo.status === TodoStatus.Completed) || [];

    return {
      notStartedTodos,
      inProgressTodos,
      completedTodos,
    };
  };

  return {
    getStatusColor,
    getStatusLabel,
    filterTodosByStatus,
  };
}
