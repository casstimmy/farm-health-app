import '@/styles/globals.css';
import Layout from '@/components/layout/Layout';
import AuthLayout from '@/components/layout/AuthLayout';
import EmptyLayout from '@/components/layout/EmptyLayout';
import { BusinessProvider } from '@/context/BusinessContext';
import { AnimalDataProvider } from '@/context/AnimalDataContext';

/**
 * App Wrapper with Layout Support
 * 
 * Automatically applies the appropriate layout based on page configuration:
 * - Authenticated pages: Use Layout with navigation
 * - Auth pages (login/register): Use AuthLayout
 * - Special pages: Use EmptyLayout
 * 
 * To specify layout for a page:
 * export const layoutType = 'auth'; // or 'empty', or undefined for default
 */
function MyApp({ Component, pageProps }) {
  // Determine which layout to use
  const layoutType = Component.layoutType || 'default';

  // Get layout props from component
  const layoutProps = Component.layoutProps || {};

  // Render with appropriate layout
  if (layoutType === 'auth') {
    return (
      <BusinessProvider>
        <AuthLayout {...layoutProps}>
          <Component {...pageProps} />
        </AuthLayout>
      </BusinessProvider>
    );
  }

  if (layoutType === 'empty') {
    return (
      <BusinessProvider>
        <EmptyLayout {...layoutProps}>
          <Component {...pageProps} />
        </EmptyLayout>
      </BusinessProvider>
    );
  }

  // Default: Use main Layout with navigation
  return (
    <BusinessProvider>
      <AnimalDataProvider>
        <Layout {...layoutProps}>
          <Component {...pageProps} />
        </Layout>
      </AnimalDataProvider>
    </BusinessProvider>
  );
}

export default MyApp;
