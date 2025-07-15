/**
 * Checks whether a password is strong according to the following rules:
 * - At least 15 characters long
 * - Contains at least one lowercase letter
 * - Contains at least one uppercase letter
 * - Contains at least one digit
 * - Contains at least one special character or underscore
 *
 * @param pw  The password string to validate.
 * @returns   True if the password meets all strength criteria; otherwise, false.
 */
export function isStrongPassword(pw: string) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{15,}$/.test(pw);
}

/**
 * Validates whether a string is a properly formatted email address.
 * This simple regex checks for a local part, an '@' symbol, and a domain with at least one dot,
 * ensuring the top-level domain is at least two characters long.
 *
 * @param email  The email address to validate.
 * @returns      True if the email matches the basic pattern; otherwise, false.
 */
export function isEmailValid(email: string) {
  return /^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/.test(email);
}
