import { Box, Flex, Text, Badge } from '@chakra-ui/react';
import { TodoStatus } from '@/generated/graphql';
import { Todo } from '@/hooks/useTodos';

interface TodoItemProps {
  todo: Todo;
  getStatusColor: (status: TodoStatus) => string;
  onClick?: () => void;
}

export function TodoItem({ todo, getStatusColor, onClick }: TodoItemProps) {
  // ステータスに応じたラベルを返す関数
  const getStatusLabel = (status: TodoStatus) => {
    switch (status) {
      case TodoStatus.NotStarted:
        return '未対応';
      case TodoStatus.InProgress:
        return '作業中';
      case TodoStatus.Completed:
        return '完了';
      default:
        return '';
    }
  };

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