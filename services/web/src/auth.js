const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 8;

function passwordValidationError(password) {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must contain at least one letter and one number";
  }
  return null;
}

function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/** Session-safe user object (no password hash). */
function publicUser(row) {
  if (!row) return null;
  return { id: row.id, username: row.username, role: row.role };
}

module.exports = {
  passwordValidationError,
  hashPassword,
  verifyPassword,
  publicUser
};
