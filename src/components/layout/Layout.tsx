import { Box } from '@chakra-ui/react';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <Box minH="100vh" bg="gray.50">
      <Header />
      <Box as="main" maxW="container.xl" mx="auto" px={4} py={6}>
        {children}
      </Box>
    </Box>
  );
} 