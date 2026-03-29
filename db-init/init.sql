DROP TABLE IF EXISTS users;

CREATE TABLE posts (
id SERIAL PRIMARY KEY,
author TEXT,
content TEXT
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE,
  password TEXT,
  role TEXT
);

-- Password for seed admin is 'adminpass' (bcrypt hash; matches services/web hashing)
INSERT INTO users(username,password,role)
VALUES ('admin','$2b$10$V4vE6WBNowZKsd9/ufYNxeoeJEHl1aZQKqCwro4gnfeKXCSyBkke2','admin');
