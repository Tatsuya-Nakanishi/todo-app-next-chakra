import { Box, Flex, Text, Badge } from "@chakra-ui/react";
import { TodoStatus } from "@/generated/graphql";
import { Todo } from "@/hooks/useTodos";
import { useStatusHelpers } from "@/components/pages/dashboard/hooks/useStatusHelpers";

interface TodoItemProps {
  todo: Todo;
  getStatusColor: (status: TodoStatus) => string;
  onClick?: () => void;
}

export function TodoItem({ todo, getStatusColor, onClick }: TodoItemProps) {
  const { getStatusLabel } = useStatusHelpers();

  return (
    <Box
      mb={2}
      p={3}
      bg="white"
      borderRadius="md"
      boxShadow="sm"
      onClick={onClick}
      _hover={onClick ? { boxShadow: "md", cursor: "pointer" } : undefined}
    >
      <Flex justify="space-between" align="center" mb={2}>
        <Text fontWeight="bold">{todo.title}</Text>
        <Badge colorScheme={getStatusColor(todo.status)}>
          {getStatusLabel(todo.status)}
        </Badge>
      </Flex>
      <Text noOfLines={2} fontSize="sm" color="gray.600">
        {todo.description}
      </Text>
    </Box>
  );
}
