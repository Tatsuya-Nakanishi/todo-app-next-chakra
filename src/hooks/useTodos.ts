import { useState, useEffect } from 'react';
import { 
  useGetTodosQuery, 
  useUpdateTodoStatusMutation, 
  useCreateTodoMutation,
  useUpdateTodoContentMutation,
  useDeleteTodoMutation,
  TodoStatus 
} from '@/generated/graphql';
import { aTodoModel } from '@/generated/mocks';

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
  const [useMockData, setUseMockData] = useState(true); // 開発用モックデータフラグ
  
  // GraphQLクエリとミューテーション
  const { data, loading, error, refetch } = useGetTodosQuery({
    fetchPolicy: 'network-only',
    skip: true // 常にスキップしてモックデータを使用
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
          id: '1', 
          title: 'デザインの作成', 
          description: 'アプリのUIデザインを作成する', 
          status: TodoStatus.NotStarted,
          userId: 'user1',
          createdAt: new Date().toISOString()
        }),
        aTodoModel({ 
          id: '2', 
          title: 'バックエンドAPI実装', 
          description: 'GraphQLエンドポイントの実装', 
          status: TodoStatus.InProgress,
          userId: 'user1',
          createdAt: new Date().toISOString()
        }),
        aTodoModel({ 
          id: '3', 
          title: '認証機能の実装', 
          description: 'Firebaseを使った認証機能の実装', 
          status: TodoStatus.InProgress,
          userId: 'user1',
          createdAt: new Date().toISOString()
        }),
        aTodoModel({ 
          id: '4', 
          title: '要件定義', 
          description: 'アプリケーションの要件を定義する', 
          status: TodoStatus.Completed,
          userId: 'user1',
          createdAt: new Date().toISOString()
        }),
        aTodoModel({ 
          id: '5', 
          title: 'プロジェクト設定', 
          description: 'Next.jsプロジェクトの初期設定', 
          status: TodoStatus.Completed,
          userId: 'user1',
          createdAt: new Date().toISOString()
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
      setTodos(prevTodos => 
        prevTodos.map(todo => 
          todo.id === id ? { ...todo, status, updatedAt: new Date().toISOString() } : todo
        )
      );
      return;
    }
    
    try {
      await updateTodoStatusMutation({
        variables: {
          input: {
            id,
            status
          }
        }
      });
      refetch();
    } catch (error) {
      console.error('Error updating todo status:', error);
      throw error;
    }
  };
  
  // 新規Todoを作成する関数
  const createTodo = async (todoData: Partial<Todo>) => {
    if (useMockData) {
      // モックデータの場合はローカルで作成
      const newTodo = aTodoModel({
        id: `mock-${Date.now()}`,
        title: todoData.title || '',
        description: todoData.description || '',
        status: todoData.status || TodoStatus.NotStarted,
        userId: 'user1',
        createdAt: new Date().toISOString()
      });
      
      setTodos(prevTodos => [...prevTodos, newTodo]);
      return;
    }
    
    try {
      await createTodoMutation({
        variables: {
          title: todoData.title || '',
          description: todoData.description || ''
        }
      });
      refetch();
    } catch (error) {
      console.error('Error creating todo:', error);
      throw error;
    }
  };
  
  // Todoの内容を更新する関数
  const updateTodo = async (todoData: Partial<Todo>) => {
    if (!todoData.id) return;
    
    if (useMockData) {
      // モックデータの場合はローカルで更新
      setTodos(prevTodos => 
        prevTodos.map(todo => 
          todo.id === todoData.id 
            ? { 
                ...todo, 
                title: todoData.title || todo.title,
                description: todoData.description || todo.description,
                status: todoData.status || todo.status,
                updatedAt: new Date().toISOString() 
              } 
            : todo
        )
      );
      return;
    }
    
    try {
      await updateTodoContentMutation({
        variables: {
          id: todoData.id,
          title: todoData.title || '',
          description: todoData.description || ''
        }
      });
      
      // ステータスも変更する場合
      if (todoData.status) {
        await updateTodoStatusMutation({
          variables: {
            input: {
              id: todoData.id,
              status: todoData.status
            }
          }
        });
      }
      
      refetch();
    } catch (error) {
      console.error('Error updating todo:', error);
      throw error;
    }
  };
  
  // Todoを削除する関数
  const deleteTodo = async (id: string) => {
    if (useMockData) {
      // モックデータの場合はローカルで削除
      setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
      return;
    }
    
    try {
      await deleteTodoMutation({
        variables: {
          id
        }
      });
      refetch();
    } catch (error) {
      console.error('Error deleting todo:', error);
      throw error;
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
    setUseMockData
  };
}; 