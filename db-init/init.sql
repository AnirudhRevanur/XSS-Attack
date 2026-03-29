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

INSERT INTO users(username,password,role)
VALUES ('admin','adminpass','admin');
