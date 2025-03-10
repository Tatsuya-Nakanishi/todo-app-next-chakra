import { Box, Flex, Heading, Button, HStack, useColorMode } from '@chakra-ui/react';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function Header() {
  const { colorMode, toggleColorMode } = useColorMode();
  const router = useRouter();
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('ログアウトに失敗しました', error);
    }
  };

  return (
    <Box as="header" bg="white" boxShadow="sm" position="sticky" top={0} zIndex={10}>
      <Flex 
        maxW="container.xl" 
        mx="auto" 
        px={4} 
        py={3} 
        align="center" 
        justify="space-between"
      >
        <Link href="/" passHref>
          <Heading as="h1" size="md" cursor="pointer" color="brandBlue.500">
            Todo App
          </Heading>
        </Link>

        <HStack spacing={4}>
          <Button 
            variant="ghost" 
            onClick={toggleColorMode}
            aria-label={colorMode === 'light' ? 'ダークモードに切り替え' : 'ライトモードに切り替え'}
          >
            {colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
          </Button>
          
          {currentUser ? (
            <>
              <Button 
                colorScheme="blue" 
                variant="outline"
                onClick={() => router.push('/dashboard')}
              >
                ダッシュボード
              </Button>
              <Button 
                colorScheme="red" 
                onClick={handleLogout}
              >
                ログアウト
              </Button>
            </>
          ) : (
            <>
              {router.pathname !== '/login' && (
                <Button 
                  colorScheme="blue" 
                  onClick={() => router.push('/login')}
                >
                  ログイン
                </Button>
              )}
              
              {router.pathname === '/login' && (
                <Button 
                  variant="outline" 
                  colorScheme="blue" 
                  onClick={() => router.push('/')}
                >
                  ホームに戻る
                </Button>
              )}
            </>
          )}
        </HStack>
      </Flex>
    </Box>
  );
} 