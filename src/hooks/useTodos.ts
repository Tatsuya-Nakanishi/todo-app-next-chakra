import { useState, useEffect } from "react";
import {
  useGetTodosQuery,
  useUpdateTodoStatusMutation,
  useCreateTodoMutation,
  useUpdateTodoContentMutation,
  useDeleteTodoMutation,
  TodoStatus,
} from "@/generated/graphql";
import { aTodoModel } from "@/generated/mocks";

export interface Todo {
  id: string;
  title: string;
  description: string;
  status: TodoStatus;
  userId: string;
  createdAt: any;
  updatedAt?: any;
}

export const useTodos = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [useMockData, setUseMockData] = useState(false); // モックデータフラグをfalseに変更

  // GraphQLクエリとミューテーション
  const { data, loading, error, refetch } = useGetTodosQuery({
    fetchPolicy: "network-only",
    skip: useMockData, // モックデータを使用する場合のみスキップ
  });

  const [updateTodoStatusMutation] = useUpdateTodoStatusMutation();
  const [createTodoMutation] = useCreateTodoMutation();
  const [updateTodoContentMutation] = useUpdateTodoContentMutation();
  const [deleteTodoMutation] = useDeleteTodoMutation();

  // モックデータの生成
  useEffect(() => {
    if (useMockData) {
      const mockTodos: Todo[] = [
        aTodoModel({
          id: "1",
          title: "デザインの作成",
          description: "アプリのUIデザインを作成する",
          status: TodoStatus.NotStarted,
          userId: "user1",
          createdAt: new Date().toISOString(),
        }),
        aTodoModel({
          id: "2",
          title: "バックエンドAPI実装",
          description: "GraphQLエンドポイントの実装",
          status: TodoStatus.InProgress,
          userId: "user1",
          createdAt: new Date().toISOString(),
        }),
        aTodoModel({
          id: "3",
          title: "認証機能の実装",
          description: "Firebaseを使った認証機能の実装",
          status: TodoStatus.InProgress,
          userId: "user1",
          createdAt: new Date().toISOString(),
        }),
        aTodoModel({
          id: "4",
          title: "要件定義",
          description: "アプリケーションの要件を定義する",
          status: TodoStatus.Completed,
          userId: "user1",
          createdAt: new Date().toISOString(),
        }),
        aTodoModel({
          id: "5",
          title: "プロジェクト設定",
          description: "Next.jsプロジェクトの初期設定",
          status: TodoStatus.Completed,
          userId: "user1",
          createdAt: new Date().toISOString(),
        }),
      ];
      setTodos(mockTodos);
    }
  }, [useMockData]);

  // APIデータが変更されたらtodosステートを更新
  useEffect(() => {
    if (data?.todos && !useMockData) {
      setTodos(data.todos as Todo[]);
    }
  }, [data, useMockData]);

  // Todoのステータスを更新する関数
  const updateTodoStatus = async (id: string, status: TodoStatus) => {
    if (useMockData) {
      // モックデータの場合はローカルで更新
      setTodos((prevTodos) =>
        prevTodos.map((todo) =>
          todo.id === id
            ? { ...todo, status, updatedAt: new Date().toISOString() }
            : todo
        )
      );
      return;
    }

    try {
      const response = await updateTodoStatusMutation({
        variables: {
          input: {
            id,
            status,
          },
        },
      });

      // レスポンスにエラーが含まれている場合、エラーをスロー
      if (response.errors && response.errors.length > 0) {
        const error = response.errors[0];
        if (error.extensions?.code === "UNAUTHENTICATED") {
          throw new Error("認証エラー: ログインしているか確認してください");
        } else {
          throw new Error(`GraphQLエラー: ${error.message}`);
        }
      }

      if (response.data) {
        await refetch();
      }
    } catch (error: any) {
      console.error("Error updating todo status:", error);
      const errorMessage = error.message || "Unknown error occurred";
      throw new Error(`ステータス更新に失敗しました: ${errorMessage}`);
    }
  };

  // 新規Todoを作成する関数
  const createTodo = async (todoData: Partial<Todo>) => {
    console.log("createTodo", todoData);

    if (useMockData) {
      // モックデータの場合はローカルで作成
      const newTodo = aTodoModel({
        id: `mock-${Date.now()}`,
        title: todoData.title || "",
        description: todoData.description || "",
        status: todoData.status || TodoStatus.NotStarted,
        userId: "user1",
        createdAt: new Date().toISOString(),
      });

      setTodos((prevTodos) => [...prevTodos, newTodo]);
      return;
    }

    try {
      console.log("Sending GraphQL mutation to create todo");
      const response = await createTodoMutation({
        variables: {
          title: todoData.title || "",
          description: todoData.description || "",
        },
      });

      console.log("GraphQL mutation response:", response);

      // レスポンスにエラーが含まれている場合、エラーをスロー
      if (response.errors && response.errors.length > 0) {
        const error = response.errors[0];
        // 認証エラーの場合
        if (error.extensions?.code === "UNAUTHENTICATED") {
          throw new Error("認証エラー: ログインしているか確認してください");
        } else {
          throw new Error(`GraphQLエラー: ${error.message}`);
        }
      }

      // データが正常に返ってきた場合のみリフェッチ
      if (response.data) {
        await refetch();
      }
    } catch (error: any) {
      console.error("Error creating todo:", error);
      // エラーメッセージを整形
      const errorMessage = error.message || "Unknown error occurred";
      throw new Error(`タスク作成に失敗しました: ${errorMessage}`);
    }
  };

  // Todoの内容を更新する関数
  const updateTodo = async (todoData: Partial<Todo>) => {
    if (!todoData.id) return;

    if (useMockData) {
      // モックデータの場合はローカルで更新
      setTodos((prevTodos) =>
        prevTodos.map((todo) =>
          todo.id === todoData.id
            ? {
                ...todo,
                title: todoData.title || todo.title,
                description: todoData.description || todo.description,
                status: todoData.status || todo.status,
                updatedAt: new Date().toISOString(),
              }
            : todo
        )
      );
      return;
    }

    try {
      const response = await updateTodoContentMutation({
        variables: {
          id: todoData.id,
          title: todoData.title || "",
          description: todoData.description || "",
        },
      });

      // レスポンスにエラーが含まれている場合、エラーをスロー
      if (response.errors && response.errors.length > 0) {
        const error = response.errors[0];
        if (error.extensions?.code === "UNAUTHENTICATED") {
          throw new Error("認証エラー: ログインしているか確認してください");
        } else {
          throw new Error(`GraphQLエラー: ${error.message}`);
        }
      }

      // ステータスも変更する場合
      if (todoData.status) {
        const statusResponse = await updateTodoStatusMutation({
          variables: {
            input: {
              id: todoData.id,
              status: todoData.status,
            },
          },
        });

        if (statusResponse.errors && statusResponse.errors.length > 0) {
          const error = statusResponse.errors[0];
          if (error.extensions?.code === "UNAUTHENTICATED") {
            throw new Error("認証エラー: ログインしているか確認してください");
          } else {
            throw new Error(`GraphQLエラー: ${error.message}`);
          }
        }
      }

      await refetch();
    } catch (error: any) {
      console.error("Error updating todo:", error);
      const errorMessage = error.message || "Unknown error occurred";
      throw new Error(`タスク更新に失敗しました: ${errorMessage}`);
    }
  };

  // Todoを削除する関数
  const deleteTodo = async (id: string) => {
    if (useMockData) {
      // モックデータの場合はローカルで削除
      setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== id));
      return;
    }

    try {
      const response = await deleteTodoMutation({
        variables: {
          id,
        },
      });

      // レスポンスにエラーが含まれている場合、エラーをスロー
      if (response.errors && response.errors.length > 0) {
        const error = response.errors[0];
        if (error.extensions?.code === "UNAUTHENTICATED") {
          throw new Error("認証エラー: ログインしているか確認してください");
        } else {
          throw new Error(`GraphQLエラー: ${error.message}`);
        }
      }

      await refetch();
    } catch (error: any) {
      console.error("Error deleting todo:", error);
      const errorMessage = error.message || "Unknown error occurred";
      throw new Error(`タスク削除に失敗しました: ${errorMessage}`);
    }
  };

  return {
    todos,
    loading,
    error,
    refetch,
    updateTodoStatus,
    createTodo,
    updateTodo,
    deleteTodo,
    useMockData,
    setUseMockData,
  };
};
