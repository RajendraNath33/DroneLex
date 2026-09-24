import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import PhoneFrame from '@/components/PhoneFrame';
import BottomTabBar from '@/components/BottomTabBar';
import SplashScreen from '@/screens/SplashScreen';
import OnboardingScreen from '@/screens/OnboardingScreen';
import AuthScreen from '@/screens/AuthScreen';
import HomeScreen from '@/screens/HomeScreen';
import ChatScreen from '@/screens/ChatScreen';
import TrainingScreen from '@/screens/TrainingScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import type { ScreenName } from '@/types';

const ONBOARDING_KEY = 'dronelex_onboarded';

function AppContent() {
  const { user, loading } = useAuth();
  const [phase, setPhase] = useState<'splash' | 'onboarding' | 'app'>('splash');
  const [screen, setScreen] = useState<ScreenName>('home');
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(ONBOARDING_KEY);
    if (stored) setOnboarded(true);
  }, []);

  // If user is already logged in and onboarded, skip splash/onboarding faster
  useEffect(() => {
    if (!loading && user && onboarded && phase === 'splash') {
      // Still show splash briefly for brand, then go to app
    }
  }, [loading, user, onboarded, phase]);

  if (loading) {
    return (
      <PhoneFrame>
        <div className="flex h-full items-center justify-center bg-slate-950">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
        </div>
      </PhoneFrame>
    );
  }

  // Splash
  if (phase === 'splash') {
    return (
      <PhoneFrame>
        <SplashScreen onComplete={() => setPhase('onboarding')} />
      </PhoneFrame>
    );
  }

  // Onboarding (only show if not onboarded or not logged in)
  if (phase === 'onboarding' && !onboarded) {
    return (
      <PhoneFrame>
        <OnboardingScreen
          onComplete={() => {
            localStorage.setItem(ONBOARDING_KEY, 'true');
            setOnboarded(true);
            setPhase('app');
          }}
        />
      </PhoneFrame>
    );
  }

  // Auth
  if (!user) {
    return (
      <PhoneFrame>
        <AuthScreen />
      </PhoneFrame>
    );
  }

  // Main app
  const showTabBar = screen !== 'chat' || true;

  return (
    <PhoneFrame>
      <div className="relative h-full">
        {screen === 'home' && <HomeScreen onNavigate={setScreen} />}
        {screen === 'chat' && <ChatScreen />}
        {screen === 'training' && <TrainingScreen />}
        {screen === 'profile' && <ProfileScreen onNavigate={setScreen} />}
        {showTabBar && <BottomTabBar active={screen} onNavigate={setScreen} />}
      </div>
    </PhoneFrame>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
