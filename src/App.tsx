import { AuthProvider, useAuth } from '@/lib/auth';
import { RouterProvider } from '@/lib/router';
import { AppShell } from '@/components/AppShell';
import { AuthScreen } from '@/pages/AuthScreen';
import { Spinner } from '@/components/ui';

function Gate() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-warm">
        <Spinner label="Caricamento…" />
      </div>
    );
  }
  if (!user) return <AuthScreen />;
  return (
    <RouterProvider>
      <AppShell />
    </RouterProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}

export default App;
