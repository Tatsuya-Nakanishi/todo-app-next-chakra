import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TodoStatus } from '@/generated/graphql';
import { Todo } from '@/hooks/useTodos';
import { TodoItem } from './TodoItem';

interface SortableTodoItemProps {
  todo: Todo;
  getStatusColor: (status: TodoStatus) => string;
  onClick: () => void;
}

export function SortableTodoItem({ todo, getStatusColor, onClick }: SortableTodoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <TodoItem
        todo={todo}
        getStatusColor={getStatusColor}
        onClick={onClick}
      />
    </div>
  );
} 