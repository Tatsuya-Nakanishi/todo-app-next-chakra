import { Box, Heading, Badge, Flex, Text } from "@chakra-ui/react";
import { TodoStatus } from "@/generated/graphql";
import { Todo } from "@/hooks/useTodos";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableTodoItem } from "./SortableTodoItem";

interface TodoColumnProps {
  id: string;
  title: string;
  colorScheme: string;
  todos: Todo[];
  getStatusColor: (status: TodoStatus) => string;
  onTodoClick: (todo: Todo) => void;
}

export function TodoColumn({
  id,
  title,
  colorScheme,
  todos,
  getStatusColor,
  onTodoClick,
}: TodoColumnProps) {
  return (
    <Box
      bg="gray.50"
      p={4}
      borderRadius="md"
      boxShadow="sm"
      id={id}
      data-droppable="true"
    >
      <Heading size="md" mb={4} display="flex" alignItems="center">
        <Badge colorScheme={colorScheme} mr={2}>
          {todos.length}
        </Badge>
        {title}
      </Heading>
      <SortableContext
        items={todos.map((todo) => todo.id)}
        strategy={verticalListSortingStrategy}
        id={id}
      >
        <Box minH="200px">
          {todos.map((todo) => (
            <SortableTodoItem
              key={todo.id}
              todo={todo}
              getStatusColor={getStatusColor}
              onClick={() => onTodoClick(todo)}
            />
          ))}
          {todos.length === 0 && (
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
  );
}
