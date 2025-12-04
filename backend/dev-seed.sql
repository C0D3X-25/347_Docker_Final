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

-- Insert 2 scores for each user
INSERT INTO scores (fk_user, score)
SELECT u.id, s.score
FROM users u
JOIN (
  SELECT 50 AS score
  UNION ALL SELECT 75
) s;

INSERT INTO scores (fk_user, score)
SELECT u.id, s.score
FROM users u
JOIN (
  SELECT 88 AS score
  UNION ALL SELECT 92
) s;