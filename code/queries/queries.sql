-- add_student.sql
INSERT INTO students (studentid,major,birth_date,first_name,last_name,balance) VALUES ($1, $2, $3, $4, $5, $6);

-- check_exist_std.sql
SELECT EXISTS(
  SELECT 1
  FROM students
  WHERE studentid = $1
);

-- get_student_balance.sql
SELECT balance
FROM students
WHERE studentid = $1;

-- update_student_balance.sql
UPDATE students
SET balance = $2
WHERE studentid = $1;

-- remove_student.sql
DELETE FROM students WHERE studentid = $1;

-- get_student_blance.sql
SELECT balance
FROM students
WHERE studentid = $1;


-- change_student_balance.sql
UPDATE students
SET balance = $2
WHERE studentid = $1;


-- add_new_food.sql
INSERT INTO foods (name,date,price,inventory) VALUES ($1, $2, $3, $4);

-- check_exist_food.sql
SELECT EXISTS(
  SELECT 1
  FROM foods
  WHERE name = $1
);

-- update_food_amount.sql
UPDATE foods
SET inventory = $2
WHERE foodid = $1;

-- get_food_price.sql
SELECT price
FROM foods
WHERE foodid = $1;

-- get_food_inventroy.sql
SELECT inventory
FROM foods
WHERE foodid = $1;

-- remove_food.sql
DELETE FROM foods WHERE name = $1;

-- reserve_food.sql
INSERT INTO reservations (studentid,foodid) VALUES ($1, $2);

-- check_exist_reservation.sql
SELECT EXISTS(
  SELECT 1
  FROM reservations
  WHERE studentid = $1 AND foodid = $2
);

-- get_reservation_id.sql
SELECT id
FROM reservations
WHERE studentid = $1 AND foodid = $2;

-- insert_transaction.sql
INSERT INTO transaction (src_reservationid,dst_reservationid,date) VALUES ($1,$2,$3);