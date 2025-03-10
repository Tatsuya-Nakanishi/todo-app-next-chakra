import { useState } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  useDisclosure,
  Badge,
  SimpleGrid,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { TodoStatus } from '@/generated/graphql';
import { useTodos } from '@/hooks/useTodos';
import TodoModal from '@/components/pages/dashboard/components/TodoModal';
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
  UniqueIdentifier
} from '@dnd-kit/core';
import { 
  SortableContext, 
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { SortableTodoItem } from '@/components/pages/dashboard/components/SortableTodoItem';
import { TodoItem } from '@/components/pages/dashboard/components/TodoItem';

// カラムのID定義
const COLUMN_IDS = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
};

export default function DashboardPresenter() {
  const { todos, loading, updateTodoStatus, createTodo, updateTodo, deleteTodo } = useTodos();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedTodo, setSelectedTodo] = useState<any>(null);
  const [activeTodoId, setActiveTodoId] = useState<UniqueIdentifier | null>(null);

  // ドラッグ中のTodoを取得
  const activeTodo = activeTodoId ? todos.find(todo => todo.id === activeTodoId) : null;

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
  };

  // ドラッグ終了時の処理
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveTodoId(null);
    
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
      
      // ステータス更新
      await updateTodoStatus(todoId, newStatus);
    }
  };
  
  // ドラッグオーバー時の処理
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    // ドロップ先がない場合は何もしない
    if (!over) return;
    
    // 同じ要素の場合は何もしない
    if (active.id === over.id) return;
    
    // ドロップ先のカラムIDを取得
    const overId = String(over.id);
    
    // 別のTodoアイテムの上にドラッグした場合
    if (!Object.values(COLUMN_IDS).includes(overId)) {
      const overTodo = todos.find(todo => todo.id === overId);
      if (overTodo) {
        // ドラッグ中のTodoのステータスを、ドロップ先のTodoのステータスに合わせる
        const todoId = String(active.id);
        updateTodoStatus(todoId, overTodo.status);
      }
    }
  };

  const handleAddTodo = () => {
    setSelectedTodo(null);
    onOpen();
  };

  const handleEditTodo = (todo: any) => {
    setSelectedTodo(todo);
    onOpen();
  };

  // ステータスごとにタスクをフィルタリング
  const notStartedTodos = todos?.filter(todo => todo.status === TodoStatus.NotStarted) || [];
  const inProgressTodos = todos?.filter(todo => todo.status === TodoStatus.InProgress) || [];
  const completedTodos = todos?.filter(todo => todo.status === TodoStatus.Completed) || [];

  // ステータスに応じた色を返す関数
  const getStatusColor = (status: TodoStatus) => {
    switch (status) {
      case TodoStatus.NotStarted:
        return 'red';
      case TodoStatus.InProgress:
        return 'blue';
      case TodoStatus.Completed:
        return 'green';
      default:
        return 'gray';
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
          collisionDetection={closestCorners}
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
              data-droppable
            >
              <Heading size="md" mb={4} display="flex" alignItems="center">
                <Badge colorScheme="red" mr={2}>
                  {notStartedTodos.length}
                </Badge>
                未対応
              </Heading>
              <SortableContext 
                items={notStartedTodos.map(todo => todo.id)} 
                strategy={verticalListSortingStrategy}
                id={COLUMN_IDS.NOT_STARTED}
              >
                <Box minH="200px">
                  {notStartedTodos.map((todo) => (
                    <SortableTodoItem
                      key={todo.id}
                      todo={todo}
                      getStatusColor={getStatusColor}
                      onClick={() => handleEditTodo(todo)}
                    />
                  ))}
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
              data-droppable
            >
              <Heading size="md" mb={4} display="flex" alignItems="center">
                <Badge colorScheme="blue" mr={2}>
                  {inProgressTodos.length}
                </Badge>
                作業中
              </Heading>
              <SortableContext 
                items={inProgressTodos.map(todo => todo.id)} 
                strategy={verticalListSortingStrategy}
                id={COLUMN_IDS.IN_PROGRESS}
              >
                <Box minH="200px">
                  {inProgressTodos.map((todo) => (
                    <SortableTodoItem
                      key={todo.id}
                      todo={todo}
                      getStatusColor={getStatusColor}
                      onClick={() => handleEditTodo(todo)}
                    />
                  ))}
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
              data-droppable
            >
              <Heading size="md" mb={4} display="flex" alignItems="center">
                <Badge colorScheme="green" mr={2}>
                  {completedTodos.length}
                </Badge>
                完了
              </Heading>
              <SortableContext 
                items={completedTodos.map(todo => todo.id)} 
                strategy={verticalListSortingStrategy}
                id={COLUMN_IDS.COMPLETED}
              >
                <Box minH="200px">
                  {completedTodos.map((todo) => (
                    <SortableTodoItem
                      key={todo.id}
                      todo={todo}
                      getStatusColor={getStatusColor}
                      onClick={() => handleEditTodo(todo)}
                    />
                  ))}
                </Box>
              </SortableContext>
            </Box>
          </SimpleGrid>

          {/* ドラッグ中のオーバーレイ */}
          <DragOverlay>
            {activeTodo ? (
              <TodoItem
                todo={activeTodo}
                getStatusColor={getStatusColor}
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
} 