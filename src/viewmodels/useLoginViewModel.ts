import { useState } from 'react';

import { api, errorMessage } from '@/services';
import { signIn } from '@/state/sessionStore';
import { isValidMobile, normalizeMobile } from '@/utils/phone';

interface LoginErrors {
  mobile?: string;
  password?: string;
  form?: string;
}

export function useLoginViewModel() {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<LoginErrors>({});
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (loading) return;
    const next: LoginErrors = {};
    if (!isValidMobile(mobile)) next.mobile = 'Enter a valid mobile number, e.g. 0772345678';
    if (password.length < 6) next.password = 'Password must be at least 6 characters';
    setErrors(next);
    if (next.mobile || next.password) return;

    setLoading(true);
    try {
      const user = await api.login({ mobile: normalizeMobile(mobile), password });
      // The root layout swaps to the signed-in screens as soon as a user is set.
      signIn(user);
    } catch (error) {
      setErrors({ form: errorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  return { mobile, setMobile, password, setPassword, errors, loading, submit };
}
