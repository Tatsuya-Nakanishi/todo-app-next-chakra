import { useState, useEffect } from "react";
import { useToast } from "@chakra-ui/react";
import { TodoStatus } from "@/generated/graphql";
import { Todo } from "@/hooks/useTodos";

interface UseTodoModalProps {
  todo: Todo | null;
  onSave: (todo: Partial<Todo>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onClose: () => void;
}

export function useTodoModal({
  todo,
  onSave,
  onDelete,
  onClose,
}: UseTodoModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TodoStatus>(TodoStatus.NotStarted);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (todo) {
      setTitle(todo.title);
      setDescription(todo.description);
      setStatus(todo.status);
    } else {
      setTitle("");
      setDescription("");
      setStatus(TodoStatus.NotStarted);
    }
  }, [todo]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({
        title: "タイトルを入力してください",
        status: "error",
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
          status,
        });
        toast({
          title: "タスクを更新しました",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        // 新規作成
        await onSave({
          title,
          description,
          status,
        });
        toast({
          title: "タスクを作成しました",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
      onClose();
    } catch (error) {
      // エラーの詳細を表示
      const errorMessage =
        error instanceof Error ? error.message : "不明なエラー";

      // エラーメッセージを分析して適切なタイトルを表示
      let title = "エラーが発生しました";
      if (errorMessage.includes("認証エラー")) {
        title = "認証エラー";
      } else if (errorMessage.includes("GraphQLエラー")) {
        title = "GraphQLエラー";
      }

      toast({
        title: title,
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!todo || !onDelete) return;

    setIsSubmitting(true);
    try {
      await onDelete(todo.id);
      toast({
        title: "タスクを削除しました",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } catch (error) {
      toast({
        title: "エラーが発生しました",
        description: error instanceof Error ? error.message : "不明なエラー",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    title,
    setTitle,
    description,
    setDescription,
    status,
    setStatus,
    isSubmitting,
    handleSubmit,
    handleDelete,
  };
}
