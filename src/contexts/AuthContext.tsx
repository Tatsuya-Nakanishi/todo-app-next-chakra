import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  UserCredential
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/router';

// 認証コンテキストの型定義
interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserCredential>;
  signup: (email: string, password: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
}

// デフォルト値を修正
const defaultAuthContext: AuthContextType = {
  currentUser: null,
  loading: true,
  login: (async () => {
    throw new Error('Not implemented');
  }) as unknown as (email: string, password: string) => Promise<UserCredential>,
  signup: (async () => {
    throw new Error('Not implemented');
  }) as unknown as (email: string, password: string) => Promise<UserCredential>,
  logout: async () => {},
};

// コンテキスト作成
const AuthContext = createContext<AuthContextType>(defaultAuthContext);

// カスタムフック
export const useAuth = () => {
  return useContext(AuthContext);
};

// 認証プロバイダーコンポーネント
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ログイン処理
  const login = async (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // サインアップ処理
  const signup = async (email: string, password: string) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  // ログアウト処理
  const logout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  // 認証状態の監視
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // 非保護ページのリスト
  const publicPages = ['/login', '/signup'];

  // ページ遷移時の認証チェック
  useEffect(() => {
    if (!loading) {
      // ログインしていない場合、保護されたページへのアクセスをリダイレクト
      if (!currentUser && !publicPages.includes(router.pathname) && router.pathname !== '/') {
        router.push('/login');
      }
      
      // ログイン済みの場合、ログインページにアクセスしたらダッシュボードへリダイレクト
      if (currentUser && (router.pathname === '/login' || router.pathname === '/signup')) {
        router.push('/dashboard');
      }
    }
  }, [currentUser, loading, router.pathname]);

  const value = {
    currentUser,
    loading,
    login,
    signup,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 