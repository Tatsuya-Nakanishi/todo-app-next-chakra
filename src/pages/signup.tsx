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
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'パスワードが一致しません')
    .required('パスワード（確認）は必須です'),
});

type SignupFormData = {
  email: string;
  password: string;
  confirmPassword: string;
};

export default function Signup() {
  const { signup } = useAuth();
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: SignupFormData) => {
    try {
      setLoading(true);
      await signup(data.email, data.password);
      toast({
        title: 'アカウント作成成功',
        description: 'アカウントが正常に作成されました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      router.push('/dashboard');
    } catch (error: any) {
      let message = 'アカウント作成に失敗しました';
      if (error.code === 'auth/email-already-in-use') {
        message = 'このメールアドレスは既に使用されています';
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
        <Heading textAlign="center">新規登録</Heading>
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
            
            <FormControl isInvalid={!!errors.confirmPassword}>
              <FormLabel>パスワード（確認）</FormLabel>
              <Input
                type="password"
                placeholder="******"
                {...register('confirmPassword')}
              />
              <FormErrorMessage>{errors.confirmPassword?.message}</FormErrorMessage>
            </FormControl>
            
            <Button
              colorScheme="teal"
              width="full"
              mt={4}
              type="submit"
              isLoading={loading}
            >
              アカウント作成
            </Button>
          </VStack>
        </Box>
        
        <Text textAlign="center">
          既にアカウントをお持ちの方は{' '}
          <Link as={NextLink} href="/login" color="teal.500">
            ログイン
          </Link>
        </Text>
      </VStack>
    </Container>
  );
} 