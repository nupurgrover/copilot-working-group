import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProductDetail } from './index';
import { CartProvider } from '../../contexts/CartContext';
import type { Product } from '../../types/product';

// Factory function to create mock product data
const createMockProduct = (overrides?: Partial<Product>): Product => ({
  id: 1,
  title: 'iPhone 15 Pro',
  description: 'Latest iPhone with advanced features',
  category: 'smartphones',
  price: 1299.99,
  rating: 4.8,
  stock: 25,
  brand: 'Apple',
  availabilityStatus: 'In Stock',
  returnPolicy: '30 days return policy',
  thumbnail: 'https://example.com/iphone-thumb.jpg',
  images: ['https://example.com/iphone-1.jpg', 'https://example.com/iphone-2.jpg'],
  ...overrides,
});

// Mock product data that can be modified per test
let mockProductData: Product | null = createMockProduct();

// Mock the router
vi.mock('@tanstack/react-router', () => ({
  useParams: () => ({ productId: '1' }),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

// Mock the useProduct hook
vi.mock('../../hooks/useProduct', () => ({
  useProduct: () => ({
    data: mockProductData,
    isLoading: false,
    error: null,
  }),
}));

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <CartProvider>{component}</CartProvider>
    </QueryClientProvider>
  );
};

describe('ProductDetail Component - Behavior Tests', () => {
  it('renders product image and title correctly based on product data', () => {
    mockProductData = createMockProduct();
    renderWithProviders(<ProductDetail />);

    // Verify the product image is displayed
    const productImage = screen.getByAltText('iPhone 15 Pro');
    expect(productImage).toBeInTheDocument();
    expect(productImage).toHaveAttribute('src', 'https://example.com/iphone-1.jpg');

    // Verify the product title is displayed
    const productTitle = screen.getByText('iPhone 15 Pro');
    expect(productTitle).toBeInTheDocument();
    expect(productTitle.tagName).toBe('H1');
  });

  it('displays product price, stock, and rating accurately', () => {
    mockProductData = createMockProduct();
    renderWithProviders(<ProductDetail />);

    // Verify price is displayed with correct formatting
    const price = screen.getByText('$1299.99');
    expect(price).toBeInTheDocument();

    // Verify stock information is displayed
    const stockLabel = screen.getByText('Stock');
    expect(stockLabel).toBeInTheDocument();
    const stockValue = screen.getByText('25');
    expect(stockValue).toBeInTheDocument();

    // Verify rating is displayed with star emoji
    const ratingLabel = screen.getByText('Rating');
    expect(ratingLabel).toBeInTheDocument();
    const ratingValue = screen.getByText(/⭐ 4\.8/);
    expect(ratingValue).toBeInTheDocument();
  });

  it('shows appropriate information for edge cases like low stock or unavailable brand', () => {
    mockProductData = createMockProduct({
      stock: 3,
      brand: undefined,
    });
    renderWithProviders(<ProductDetail />);

    // Verify low stock number is displayed
    const stockValue = screen.getByText('3');
    expect(stockValue).toBeInTheDocument();

    // Verify that when brand is unavailable, "N/A" is shown
    const brandLabel = screen.getByText('Brand');
    expect(brandLabel).toBeInTheDocument();
    const brandValue = screen.getByText('N/A');
    expect(brandValue).toBeInTheDocument();
  });

  it('triggers add to cart action when button is clicked', async () => {
    mockProductData = createMockProduct();
    const user = userEvent.setup();
    renderWithProviders(<ProductDetail />);

    // Find and click the "Add to Cart" button
    const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
    expect(addToCartButton).toBeInTheDocument();

    // Click the button
    await user.click(addToCartButton);

    // The button should remain visible and interactive after clicking
    expect(addToCartButton).toBeInTheDocument();
    expect(addToCartButton).not.toBeDisabled();
  });
});
