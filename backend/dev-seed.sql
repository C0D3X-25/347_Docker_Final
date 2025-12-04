USE db_347;

-- Insert 10 sample users
INSERT INTO users (name, password)
VALUES
  ('alice', 'password1'),
  ('bob', 'password2'),
  ('charlie', 'password3'),
  ('diana', 'password4'),
  ('edward', 'password5'),
  ('fiona', 'password6'),
  ('george', 'password7'),
  ('hannah', 'password8'),
  ('ian', 'password9'),
  ('jane', 'password10');

-- Insert random scores (1-4 per user, values 0-100)
INSERT INTO scores (fk_user, score) VALUES
  (1, 42), (1, 87), (1, 15),
  (2, 63), (2, 29),
  (3, 91), (3, 54), (3, 8), (3, 76),
  (4, 33),
  (5, 72), (5, 45), (5, 88),
  (6, 19), (6, 67),
  (7, 5), (7, 98), (7, 41), (7, 23),
  (8, 56),
  (9, 84), (9, 37), (9, 62),
  (10, 11), (10, 79);