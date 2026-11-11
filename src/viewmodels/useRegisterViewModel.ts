import { useState } from 'react';
import { Linking } from 'react-native';

import type { RegisterInput } from '@/models';
import { api, errorMessage } from '@/services';
import { isValidMobile, normalizeMobile } from '@/utils/phone';

type Field = keyof RegisterInput | 'confirmPassword';
type Errors = Partial<Record<Field | 'form', string>>;

const EMPTY: Record<Field, string> = {
  firstName: '',
  lastName: '',
  mobile: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export function useRegisterViewModel() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function setField(field: Field, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate(): Errors {
    const e: Errors = {};
    if (!values.firstName.trim()) e.firstName = 'Enter your first name';
    if (!values.lastName.trim()) e.lastName = 'Enter your last name';
    if (!isValidMobile(values.mobile)) e.mobile = 'Enter a valid mobile number, e.g. 0772345678';
    if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) e.email = 'Enter a valid email address';
    if (values.password.length < 8) e.password = 'Use at least 8 characters';
    if (values.confirmPassword !== values.password) e.confirmPassword = 'Passwords do not match';
    return e;
  }

  async function submit() {
    if (loading) return;
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    try {
      const result = await api.register({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        mobile: normalizeMobile(values.mobile),
        email: values.email.trim(),
        password: values.password,
      });
      if (result.status === 'externalOnboardingRequired' && result.url === 'https://www.hot.co.zw/') {
        await Linking.openURL(result.url);
        setDone(true);
      }
    } catch (error) {
      setErrors({ form: errorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  return { values, setField, errors, loading, done, submit };
}
