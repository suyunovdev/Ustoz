import { describe, it, expect } from 'vitest';
import { validatePassword, isEmail, normalizeEmail } from '../validation';

describe('validatePassword — yagona parol siyosati', () => {
  it('8 belgidan qisqa parolni rad etadi', () => {
    expect(validatePassword('Ab1')).not.toBeNull();
    expect(validatePassword('Abc123')).not.toBeNull(); // 6 belgi
  });

  it('katta harf, kichik harf yoki raqam yo\'q bo\'lsa rad etadi', () => {
    expect(validatePassword('alllowercase1')).not.toBeNull(); // katta harf yo'q
    expect(validatePassword('ALLUPPER123')).not.toBeNull(); // kichik harf yo'q
    expect(validatePassword('NoDigitsHere')).not.toBeNull(); // raqam yo'q
  });

  it('kuchli parolni qabul qiladi (null qaytaradi)', () => {
    expect(validatePassword('Test1234!')).toBeNull();
    expect(validatePassword('Parol123')).toBeNull();
  });

  it('string bo\'lmagan qiymatni rad etadi', () => {
    expect(validatePassword(undefined)).not.toBeNull();
    expect(validatePassword(12345678)).not.toBeNull();
  });
});

describe('email yordamchilari', () => {
  it('isEmail to\'g\'ri/noto\'g\'ri', () => {
    expect(isEmail('a@b.uz')).toBe(true);
    expect(isEmail('notanemail')).toBe(false);
  });
  it('normalizeEmail kichik harf + trim', () => {
    expect(normalizeEmail('  User@Example.UZ ')).toBe('user@example.uz');
  });
});
