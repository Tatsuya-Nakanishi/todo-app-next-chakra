import { useState, useRef, useCallback } from "react";
import {
  closestCorners,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  UniqueIdentifier,
  CollisionDetection,
} from "@dnd-kit/core";
import { SortableData } from "@dnd-kit/sortable";
import { TodoStatus } from "@/generated/graphql";
import { Todo } from "@/hooks/useTodos";

// カラムのID定義
export const COLUMN_IDS = {
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
};

// ステータスマッピング
export const STATUS_MAP = {
  [COLUMN_IDS.NOT_STARTED]: TodoStatus.NotStarted,
  [COLUMN_IDS.IN_PROGRESS]: TodoStatus.InProgress,
  [COLUMN_IDS.COMPLETED]: TodoStatus.Completed,
};

interface UseDragAndDropProps {
  todos: Todo[];
  updateTodoStatus: (id: string, status: TodoStatus) => Promise<void>;
}

export function useDragAndDrop({
  todos,
  updateTodoStatus,
}: UseDragAndDropProps) {
  const [activeTodoId, setActiveTodoId] = useState<UniqueIdentifier | null>(
    null
  );
  const [tempTodos, setTempTodos] = useState<Todo[]>([]);
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdatedStatusRef = useRef<TodoStatus | null>(null);

  // 表示するTodos（ドラッグ中か通常時か）
  const displayTodos = tempTodos.length > 0 ? tempTodos : todos;

  // ドラッグ中のTodoを取得
  const activeTodo = activeTodoId
    ? todos.find((todo) => todo.id === activeTodoId)
    : null;

  // カスタム衝突判定 - 空のカラムへのドロップを適切に処理
  const detectCollision: CollisionDetection = (args) => {
    // 基本の衝突判定を取得
    const cornerCollisions = closestCorners(args);

    // 最も近いコンテナ（ステータスカラム）を見つける
    const closestContainer = cornerCollisions.find((collision) => {
      return Object.values(COLUMN_IDS).includes(String(collision.id));
    });

    // コンテナが見つからない場合は通常の衝突判定を返す
    if (!closestContainer) {
      return cornerCollisions;
    }

    // 見つかったコンテナ内の要素だけをフィルタリング
    const containerCollisions = cornerCollisions.filter(({ data }) => {
      if (!data?.droppableContainer?.data?.current) {
        return false;
      }

      const droppableData = data.droppableContainer.data
        .current as SortableData;
      if (!droppableData.sortable) {
        return false;
      }

      const containerId = droppableData.sortable.containerId;
      return containerId === closestContainer.id;
    });

    // コンテナ内に衝突する要素がなければコンテナ自体を返す
    if (containerCollisions.length === 0) {
      return [closestContainer];
    }

    return containerCollisions;
  };

  // デバウンス処理付きのステータス更新
  const debouncedUpdateStatus = useCallback(
    (todoId: string, newStatus: TodoStatus) => {
      // 前回のタイマーをクリア
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
      }

      // 最後に更新したステータスを記録
      lastUpdatedStatusRef.current = newStatus;

      // 新しいタイマーをセット（250ms後に実行）
      updateTimerRef.current = setTimeout(() => {
        updateTodoStatus(todoId, newStatus).catch((error) => {
          console.error("ステータス更新エラー:", error);
        });
      }, 250);
    },
    [updateTodoStatus]
  );

  // ドラッグ開始時の処理
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveTodoId(active.id);

    // ドラッグ開始時にtempTodosを初期化
    setTempTodos([...todos]);

    // リファレンスをリセット
    lastUpdatedStatusRef.current = null;
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
      updateTimerRef.current = null;
    }
  };

  // ドラッグ終了時の処理
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveTodoId(null);

    // 一時的なTodos状態をクリア
    setTempTodos([]);

    // タイマーをクリア
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
      updateTimerRef.current = null;
    }

    // ドロップ先がない場合は何もしない
    if (!over) return;

    // 同じ要素にドロップした場合は何もしない
    if (active.id === over.id) return;

    // ドロップ先のカラムIDを取得
    const overId = String(over.id);

    // カラムにドロップした場合
    if (Object.values(COLUMN_IDS).includes(overId)) {
      const todoId = String(active.id);
      let newStatus: TodoStatus;

      // ステータスの変換
      switch (overId) {
        case COLUMN_IDS.NOT_STARTED:
          newStatus = TodoStatus.NotStarted;
          break;
        case COLUMN_IDS.IN_PROGRESS:
          newStatus = TodoStatus.InProgress;
          break;
        case COLUMN_IDS.COMPLETED:
          newStatus = TodoStatus.Completed;
          break;
        default:
          return;
      }

      // ドラッグ中に既に更新済みなら再度更新しない
      if (lastUpdatedStatusRef.current === newStatus) {
        return;
      }

      // ステータス更新
      try {
        await updateTodoStatus(todoId, newStatus);
      } catch (error) {
        console.error("ステータス更新エラー:", error);
      }
    }
  };

  // ドラッグオーバー時の処理
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    // ドロップ先がない場合は何もしない
    if (!over) return;

    // 同じ要素の場合は何もしない
    if (active.id === over.id) return;

    // ドロップ先のIDを取得
    const overId = String(over.id);
    const activeId = String(active.id);

    // ドラッグ中のTodoを取得
    const activeTodoItem = tempTodos.find((todo) => todo.id === activeId);
    if (!activeTodoItem) return;

    const currentStatus = activeTodoItem.status;

    // カラム（ステータス）上にドラッグした場合
    if (Object.values(COLUMN_IDS).includes(overId)) {
      const newStatus = STATUS_MAP[overId as keyof typeof STATUS_MAP];

      // 既に同じステータスならスキップ
      if (currentStatus === newStatus) return;

      // UIの即時更新のためにtempTodosを更新
      setTempTodos((prev) =>
        prev.map((todo) =>
          todo.id === activeId ? { ...todo, status: newStatus } : todo
        )
      );

      // APIの更新はデバウンス処理
      debouncedUpdateStatus(activeId, newStatus);
      return;
    }

    // 別のTodoアイテムの上にドラッグした場合
    const overTodo = tempTodos.find((todo) => todo.id === overId);
    if (!overTodo) return;

    // 異なるステータスのTodo上にドラッグした場合
    if (currentStatus !== overTodo.status) {
      const newStatus = overTodo.status;

      // UIの即時更新のためにtempTodosを更新
      setTempTodos((prev) =>
        prev.map((todo) =>
          todo.id === activeId ? { ...todo, status: newStatus } : todo
        )
      );

      // APIの更新はデバウンス処理
      debouncedUpdateStatus(activeId, newStatus);
    }
  };

  return {
    displayTodos,
    activeTodo,
    detectCollision,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
  };
}
