import { useState, useRef, useCallback } from "react";
import {
  Box,
  Flex,
  Heading,
  Button,
  useDisclosure,
  Badge,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";
import { TodoStatus } from "@/generated/graphql";
import { useTodos, Todo } from "@/hooks/useTodos";
import TodoModal from "@/components/pages/dashboard/components/TodoModal";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  UniqueIdentifier,
  CollisionDetection,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  SortableData,
} from "@dnd-kit/sortable";
import { SortableTodoItem } from "@/components/pages/dashboard/components/SortableTodoItem";
import { TodoItem } from "@/components/pages/dashboard/components/TodoItem";

// カラムのID定義
const COLUMN_IDS = {
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
};

// ステータスマッピング
const STATUS_MAP = {
  [COLUMN_IDS.NOT_STARTED]: TodoStatus.NotStarted,
  [COLUMN_IDS.IN_PROGRESS]: TodoStatus.InProgress,
  [COLUMN_IDS.COMPLETED]: TodoStatus.Completed,
};

export const DashboardPresenter = () => {
  const {
    todos,
    loading,
    updateTodoStatus,
    createTodo,
    updateTodo,
    deleteTodo,
  } = useTodos();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedTodo, setSelectedTodo] = useState<any>(null);
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

  // センサーの設定
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px動かすとドラッグ開始
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
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

    console.log("ドロップ先:", over.id);

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
        console.log("既にステータスが更新済みです:", newStatus);
        return;
      }

      // ステータス更新
      try {
        await updateTodoStatus(todoId, newStatus);
        console.log(`Todoステータスを更新しました: ${todoId} => ${newStatus}`);
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

      console.log(`カラム上にドラッグ: ${activeId} => ${newStatus}`);

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

      console.log(`別のTodo上にドラッグ: ${activeId} => ${newStatus}`);

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

  const handleAddTodo = () => {
    setSelectedTodo(null);
    onOpen();
  };

  const handleEditTodo = ({ todo }: { todo: Todo }) => {
    setSelectedTodo(todo);
    onOpen();
  };

  // ステータスごとにタスクをフィルタリング
  const notStartedTodos =
    displayTodos?.filter((todo) => todo.status === TodoStatus.NotStarted) || [];
  const inProgressTodos =
    displayTodos?.filter((todo) => todo.status === TodoStatus.InProgress) || [];
  const completedTodos =
    displayTodos?.filter((todo) => todo.status === TodoStatus.Completed) || [];

  // ステータスに応じた色を返す関数
  const getStatusColor = ({ status }: { status: TodoStatus }): string => {
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

  if (loading) {
    return <Box p={4}>タスクを読み込み中...</Box>;
  }

  return (
    <>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">タスク管理ボード</Heading>
        <Button
          leftIcon={<AddIcon />}
          colorScheme="teal"
          onClick={handleAddTodo}
        >
          新規タスク作成
        </Button>
      </Flex>

      {todos.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={detectCollision}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
        >
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            {/* 未対応カラム */}
            <Box
              bg="gray.50"
              p={4}
              borderRadius="md"
              boxShadow="sm"
              id={COLUMN_IDS.NOT_STARTED}
              data-droppable="true"
            >
              <Heading size="md" mb={4} display="flex" alignItems="center">
                <Badge colorScheme="red" mr={2}>
                  {notStartedTodos.length}
                </Badge>
                未対応
              </Heading>
              <SortableContext
                items={notStartedTodos.map((todo) => todo.id)}
                strategy={verticalListSortingStrategy}
                id={COLUMN_IDS.NOT_STARTED}
              >
                <Box minH="200px">
                  {notStartedTodos.map((todo) => (
                    <SortableTodoItem
                      key={todo.id}
                      todo={todo}
                      getStatusColor={() =>
                        getStatusColor({ status: todo.status })
                      }
                      onClick={() => handleEditTodo({ todo })}
                    />
                  ))}
                  {notStartedTodos.length === 0 && (
                    <Flex
                      height="100%"
                      minH="200px"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text color="gray.500">ここにタスクをドロップ</Text>
                    </Flex>
                  )}
                </Box>
              </SortableContext>
            </Box>

            {/* 作業中カラム */}
            <Box
              bg="gray.50"
              p={4}
              borderRadius="md"
              boxShadow="sm"
              id={COLUMN_IDS.IN_PROGRESS}
              data-droppable="true"
            >
              <Heading size="md" mb={4} display="flex" alignItems="center">
                <Badge colorScheme="blue" mr={2}>
                  {inProgressTodos.length}
                </Badge>
                作業中
              </Heading>
              <SortableContext
                items={inProgressTodos.map((todo) => todo.id)}
                strategy={verticalListSortingStrategy}
                id={COLUMN_IDS.IN_PROGRESS}
              >
                <Box minH="200px">
                  {inProgressTodos.map((todo) => (
                    <SortableTodoItem
                      key={todo.id}
                      todo={todo}
                      getStatusColor={() =>
                        getStatusColor({ status: todo.status })
                      }
                      onClick={() => handleEditTodo({ todo })}
                    />
                  ))}
                  {inProgressTodos.length === 0 && (
                    <Flex
                      height="100%"
                      minH="200px"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text color="gray.500">ここにタスクをドロップ</Text>
                    </Flex>
                  )}
                </Box>
              </SortableContext>
            </Box>

            {/* 完了カラム */}
            <Box
              bg="gray.50"
              p={4}
              borderRadius="md"
              boxShadow="sm"
              id={COLUMN_IDS.COMPLETED}
              data-droppable="true"
            >
              <Heading size="md" mb={4} display="flex" alignItems="center">
                <Badge colorScheme="green" mr={2}>
                  {completedTodos.length}
                </Badge>
                完了
              </Heading>
              <SortableContext
                items={completedTodos.map((todo) => todo.id)}
                strategy={verticalListSortingStrategy}
                id={COLUMN_IDS.COMPLETED}
              >
                <Box minH="200px">
                  {completedTodos.map((todo) => (
                    <SortableTodoItem
                      key={todo.id}
                      todo={todo}
                      getStatusColor={() =>
                        getStatusColor({ status: todo.status })
                      }
                      onClick={() => handleEditTodo({ todo })}
                    />
                  ))}
                  {completedTodos.length === 0 && (
                    <Flex
                      height="100%"
                      minH="200px"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text color="gray.500">ここにタスクをドロップ</Text>
                    </Flex>
                  )}
                </Box>
              </SortableContext>
            </Box>
          </SimpleGrid>

          {/* ドラッグ中のオーバーレイ */}
          <DragOverlay>
            {activeTodo ? (
              <TodoItem
                todo={activeTodo}
                getStatusColor={() =>
                  getStatusColor({ status: activeTodo.status })
                }
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <TodoModal
        isOpen={isOpen}
        onClose={onClose}
        todo={selectedTodo}
        onSave={selectedTodo ? updateTodo : createTodo}
        onDelete={selectedTodo ? deleteTodo : undefined}
      />
    </>
  );
};
