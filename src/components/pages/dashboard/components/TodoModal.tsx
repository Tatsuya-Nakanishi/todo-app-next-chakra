import { useState, useEffect } from 'react';
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
  useToast
} from '@chakra-ui/react';
import { TodoStatus } from '@/generated/graphql';
import { Todo } from '@/hooks/useTodos';

interface TodoModalProps {
  isOpen: boolean;
  onClose: () => void;
  todo: Todo | null;
  onSave: (todo: Partial<Todo>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export default function TodoModal({ isOpen, onClose, todo, onSave, onDelete }: TodoModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TodoStatus>(TodoStatus.NotStarted);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (todo) {
      setTitle(todo.title);
      setDescription(todo.description);
      setStatus(todo.status);
    } else {
      setTitle('');
      setDescription('');
      setStatus(TodoStatus.NotStarted);
    }
  }, [todo]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({
        title: 'タイトルを入力してください',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (todo) {
        // 更新
        await onSave({
          id: todo.id,
          title,
          description,
          status
        });
        toast({
          title: 'タスクを更新しました',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // 新規作成
        await onSave({
          title,
          description,
          status
        });
        toast({
          title: 'タスクを作成しました',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      onClose();
    } catch (error) {
      toast({
        title: 'エラーが発生しました',
        description: error instanceof Error ? error.message : '不明なエラー',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!todo) return;
    
    setIsSubmitting(true);
    try {
      await onDelete!(todo.id);
      toast({
        title: 'タスクを削除しました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } catch (error) {
      toast({
        title: 'エラーが発生しました',
        description: error instanceof Error ? error.message : '不明なエラー',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{todo ? 'タスクの編集' : '新規タスク作成'}</ModalHeader>
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
              {todo ? '更新' : '作成'}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 