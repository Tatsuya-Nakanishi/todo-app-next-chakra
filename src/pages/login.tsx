import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  Link,
  useToast,
  Container,
  FormErrorMessage,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

// バリデーションスキーマ
const schema = yup.object({
  email: yup.string().email('有効なメールアドレスを入力してください').required('メールアドレスは必須です'),
  password: yup.string().required('パスワードは必須です').min(6, 'パスワードは6文字以上である必要があります'),
});

type LoginFormData = {
  email: string;
  password: string;
};

export default function Login() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true);
      await login(data.email, data.password);
      toast({
        title: 'ログイン成功',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      router.push('/dashboard');
    } catch (error: any) {
      let message = 'ログインに失敗しました';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        message = 'メールアドレスまたはパスワードが正しくありません';
      }
      toast({
        title: 'エラー',
        description: message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxW="md" py={12}>
      <VStack spacing={8} align="stretch">
        <Heading textAlign="center">ログイン</Heading>
        <Box as="form" onSubmit={handleSubmit(onSubmit)}>
          <VStack spacing={4}>
            <FormControl isInvalid={!!errors.email}>
              <FormLabel>メールアドレス</FormLabel>
              <Input
                type="email"
                placeholder="your-email@example.com"
                {...register('email')}
              />
              <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
            </FormControl>
            
            <FormControl isInvalid={!!errors.password}>
              <FormLabel>パスワード</FormLabel>
              <Input
                type="password"
                placeholder="******"
                {...register('password')}
              />
              <FormErrorMessage>{errors.password?.message}</FormErrorMessage>
            </FormControl>
            
            <Button
              colorScheme="teal"
              width="full"
              mt={4}
              type="submit"
              isLoading={loading}
            >
              ログイン
            </Button>
          </VStack>
        </Box>
        
        <Text textAlign="center">
          アカウントをお持ちでない方は{' '}
          <Link as={NextLink} href="/signup" color="teal.500">
            新規登録
          </Link>
        </Text>
      </VStack>
    </Container>
  );
} 