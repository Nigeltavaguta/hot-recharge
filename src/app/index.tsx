import { Redirect } from 'expo-router';

import { useStore } from '@/state/createStore';
import { sessionStore } from '@/state/sessionStore';

/** The app's entry route: sends the user to home or to sign-in. */
export default function Index() {
  const signedIn = useStore(sessionStore, (s) => s.user !== null);
  return <Redirect href={signedIn ? '/home' : '/login'} />;
}
