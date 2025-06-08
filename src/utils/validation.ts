export function isStrongPassword(pw: string) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{15,}$/.test(pw);
}

export function isEmailValid(email: string) {
  return /^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/.test(email);
}
