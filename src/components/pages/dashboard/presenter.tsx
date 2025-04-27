import { useState } from "react";
import {
  Box,
  Flex,
  Heading,
  Button,
  useDisclosure,
  SimpleGrid,
} from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";
import { useTodos, Todo } from "@/hooks/useTodos";
import TodoModal from "@/components/pages/dashboard/components/TodoModal";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { TodoItem } from "@/components/pages/dashboard/components/TodoItem";
import { TodoColumn } from "@/components/pages/dashboard/components/TodoColumn";
import {
  useDragAndDrop,
  COLUMN_IDS,
} from "@/components/pages/dashboard/hooks/useDragAndDrop";
import { useStatusHelpers } from "@/components/pages/dashboard/hooks/useStatusHelpers";

export default function DashboardPresenter() {
  const {
    todos,
    loading,
    updateTodoStatus,
    createTodo,
    updateTodo,
    deleteTodo,
  } = useTodos();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);

  const { getStatusColor, filterTodosByStatus } = useStatusHelpers();

  const {
    displayTodos,
    activeTodo,
    detectCollision,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
  } = useDragAndDrop({ todos, updateTodoStatus });

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

  const handleAddTodo = () => {
    setSelectedTodo(null);
    onOpen();
  };

  const handleEditTodo = (todo: Todo) => {
    setSelectedTodo(todo);
    onOpen();
  };

  // ステータスごとにタスクをフィルタリング
  const { notStartedTodos, inProgressTodos, completedTodos } =
    filterTodosByStatus(displayTodos);

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
            <TodoColumn
              id={COLUMN_IDS.NOT_STARTED}
              title="未対応"
              colorScheme="red"
              todos={notStartedTodos}
              getStatusColor={getStatusColor}
              onTodoClick={handleEditTodo}
            />

            {/* 作業中カラム */}
            <TodoColumn
              id={COLUMN_IDS.IN_PROGRESS}
              title="作業中"
              colorScheme="blue"
              todos={inProgressTodos}
              getStatusColor={getStatusColor}
              onTodoClick={handleEditTodo}
            />

            {/* 完了カラム */}
            <TodoColumn
              id={COLUMN_IDS.COMPLETED}
              title="完了"
              colorScheme="green"
              todos={completedTodos}
              getStatusColor={getStatusColor}
              onTodoClick={handleEditTodo}
            />
          </SimpleGrid>

          {/* ドラッグ中のオーバーレイ */}
          <DragOverlay>
            {activeTodo ? (
              <TodoItem todo={activeTodo} getStatusColor={getStatusColor} />
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
}
