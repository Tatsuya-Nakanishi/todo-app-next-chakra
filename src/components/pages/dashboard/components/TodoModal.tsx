import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  HStack,
} from "@chakra-ui/react";
import { TodoStatus } from "@/generated/graphql";
import { Todo } from "@/hooks/useTodos";
import { useTodoModal } from "../hooks/useTodoModal";

interface TodoModalProps {
  isOpen: boolean;
  onClose: () => void;
  todo: Todo | null;
  onSave: (todo: Partial<Todo>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export default function TodoModal({
  isOpen,
  onClose,
  todo,
  onSave,
  onDelete,
}: TodoModalProps) {
  const {
    title,
    setTitle,
    description,
    setDescription,
    status,
    setStatus,
    isSubmitting,
    handleSubmit,
    handleDelete,
  } = useTodoModal({ todo, onSave, onDelete, onClose });

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{todo ? "タスクの編集" : "新規タスク作成"}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl mb={4} isRequired>
            <FormLabel>タイトル</FormLabel>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="タスクのタイトルを入力"
            />
          </FormControl>
          <FormControl mb={4}>
            <FormLabel>説明</FormLabel>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="タスクの詳細を入力"
              rows={4}
            />
          </FormControl>
          <FormControl>
            <FormLabel>ステータス</FormLabel>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as TodoStatus)}
            >
              <option value={TodoStatus.NotStarted}>未対応</option>
              <option value={TodoStatus.InProgress}>作業中</option>
              <option value={TodoStatus.Completed}>完了</option>
            </Select>
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={2}>
            {todo && onDelete && (
              <Button
                colorScheme="red"
                onClick={handleDelete}
                isLoading={isSubmitting}
              >
                削除
              </Button>
            )}
            <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
              キャンセル
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSubmit}
              isLoading={isSubmitting}
            >
              {todo ? "更新" : "作成"}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
