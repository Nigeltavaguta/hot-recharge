import { useState } from 'react';
import { apiMode } from '@/config/api';

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
    const accessCode = mobile.trim();
    const email = apiMode === 'live' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accessCode);
    const validMobile = isValidMobile(accessCode) && (apiMode === 'mock' || /^[+\d\s()-]+$/.test(accessCode));
    if (!email && !validMobile) next.mobile = apiMode === 'live'
      ? 'Enter your registered email address or mobile number'
      : 'Enter a valid mobile number, e.g. 0772345678';
    if (apiMode === 'live' ? !password.trim() : password.length < 6) next.password = apiMode === 'live'
      ? 'Enter your HOT Recharge password' : 'Password must be at least 6 characters';
    setErrors(next);
    if (next.mobile || next.password) return;

    setLoading(true);
    try {
      const user = await api.login({ mobile: email ? accessCode : normalizeMobile(accessCode), password });
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
