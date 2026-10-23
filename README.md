# Food Reservation

Command-line backend for student food reservations. The program is a Node.js process that reads and writes students, food items, reservations, and balance transactions in PostgreSQL.

You run one command at a time from `code/`. Each command checks the current rows, updates the tables described below, and prints a one-line result.

## Features

- Add a student, or remove a student by student ID.
- Top up an existing student's balance.
- Add a food item for lunch or dinner, or remove a food item by name.
- Reserve a food item for a student, record a cancellation, or record a change from one food item to another.

Database errors are printed to standard error with the name of the operation that failed. The connection closes after a recognized command finishes.

## Tech stack

- Node.js
- PostgreSQL through the `pg` package
- `dotenv` for the connection settings in `code/connection.js`
- SQL statements in `code/queries/queries.sql`
- db-migrate migration files in `code/migrations`, with connection settings in `code/database.json`

`code/api.js` is the entry point. It loads the command name and arguments from `process.argv` and runs the matching function. The file also loads the `express` package; it does not call `listen` or register routes. `package.json` lists `uuid` as well, and no application file requires it. `fs` and `path` in the application code are the Node.js built-in modules.

db-migrate itself is not listed in `package.json`. The migration runner is invoked with `npx` from the `code` directory, as described under Migrations.

## Database schema

Application statements in `code/queries/queries.sql` use the tables and columns below. Column types are whatever the database was created with; this repository does not declare them.

### `students`

| Column | Role |
| --- | --- |
| `studentid` | Identifier passed on the command line. Used to find, insert, update, and delete a student. |
| `major` | Stored as given when the student is added. |
| `birth_date` | Stored as given when the student is added. |
| `first_name` | Stored as given when the student is added. |
| `last_name` | Stored as given when the student is added. |
| `balance` | Set when the student is added. Increased by a top-up. Decreased by the food price during reserve and change. |

### `foods`

| Column | Role |
| --- | --- |
| `foodid` | Used to read price and inventory and to update inventory. The insert statement does not supply this column. |
| `name` | Inserted for a new food and used to find or delete a food. |
| `date` | Time of day. The CLI stores `13:00:00` for lunch and `19:00:00` for dinner. |
| `price` | Inserted for a new food. Read when a student reserves or changes a reservation. |
| `inventory` | Inserted for a new food. Decreased by 1 on reserve and on change. Increased by 1 on cancellation. |

### `reservations`

| Column | Role |
| --- | --- |
| `id` | Read after a reservation is inserted. The insert statement supplies `studentid` and `foodid` only. |
| `studentid` | Student the reservation belongs to. |
| `foodid` | Food the reservation is for. |

### `transaction`

| Column | Role |
| --- | --- |
| `src_reservationid` | Set from an existing reservation id when a cancellation or a change is recorded. Null when a new reservation is recorded. |
| `dst_reservationid` | Set from a reservation id when a reservation is created. Null when a cancellation is recorded. |
| `date` | Local calendar date at the time of the command, formatted `YYYY-MM-DD`. |

## Migrations

There is one db-migrate migration, `20240323211035-initialize`.

`code/migrations/20240323211035-initialize.js` wires the two directions:

- **up** reads `code/migrations/sqls/20240323211035-initialize-up.sql`, prints the file contents, and runs the SQL with `db.runSql`.
- **down** reads `code/migrations/sqls/20240323211035-initialize-down.sql`, prints the file contents, and runs the SQL with `db.runSql`.

The up file contains:

```sql
INSERT INTO users WHERE username = $1;
```

The down file contains:

```sql
DELETE FROM users WHERE username = $1;
```

Those statements are what the migration runs. They do not create or drop `students`, `foods`, `reservations`, or `transaction`. Those tables need to exist, with the columns listed above, before the CLI commands can succeed.

`code/database.json` is the db-migrate configuration. The default environment is `dev`, and the driver is `pg`. Host, port, user, password, and database are taken from the environment variables in the Configuration section. If `DB_HOST`, `DB_PORT`, `DB_USER`, or `DB_NAME` is missing or empty, db-migrate uses `localhost`, `5432`, `postgres`, and `school`. `DB_PASSWORD` has no fallback value.

`code/.db-migraterc` sets `dotenvCustomPath` to `../.env`, so a db-migrate process started in `code/` loads the repository-root `.env` before it reads `database.json`. db-migrate also loads `code/.env` when that rc path is not applied.

From `code/`, after the variables are available:

```bash
npx db-migrate up
npx db-migrate down
```

`up` applies migrations that are not yet recorded. `down` reverts them.

## Setup

Install Node.js and PostgreSQL. Create a database whose name matches `DB_NAME` (the sample value is `school`) and create the tables listed under Database schema. The migration in this repository does not create those tables.

```bash
cd code
npm install
cp ../.env.example ../.env
```

Edit the repository-root `.env` and set `DB_PASSWORD` to the PostgreSQL user's password. That file is the one both the CLI and db-migrate read. An optional `code/.env` is described under Configuration; db-migrate does not load it while `code/.db-migraterc` points at `../.env`.

`npm install` installs the packages in `code/package.json`, including `pg` and `dotenv`.

## Configuration

Connection settings come from the process environment. `code/connection.js` loads dotenv twice: first `code/.env`, then the repository-root `.env`. dotenv does not replace a variable that is already set, so the shell environment wins over both files, and keys set in `code/.env` win over the root file for the CLI.

db-migrate, started in `code/`, follows `code/.db-migraterc` and loads the repository-root `.env` only. Keep the shared password and host settings in that root file.

| Variable | Used for | Value when unset or empty |
| --- | --- | --- |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USER` | PostgreSQL user | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | none |
| `DB_NAME` | Database name | `school` |

`DB_PASSWORD` is passed through as set. Leave it empty in the example file and fill it only in the untracked `.env`. `.gitignore` ignores `.env` and `node_modules/`.

The same variable names are what `code/database.json` reads for migrations. For `npx db-migrate` from `code/`, put the values in the repository-root `.env` (loaded via `code/.db-migraterc`) or export them in the shell before running the command:

```bash
set -a
. ../.env
set +a
```

## Usage

Run commands from the `code` directory:

```bash
node api.js <command> [arguments]
```

`api.js` calls `client.connect()` as soon as it loads, then runs the command. An unknown command prints:

```text
Invalid command. Please provide a valid command.
```

Arguments are separate shell words. A value that contains spaces has to be quoted so it stays one argument.

### `add_std`

```bash
node api.js add_std <studentID> <major> <birth_date> <first_name> <last_name> <balance>
```

Inserts a row into `students` when `studentID` is not already present, then prints `User <studentID> added successfully!`. When the ID is already present, prints `Student with studentid <studentID> has exist!`.

```bash
node api.js add_std 40031073 ce 030626 danial faraji 1000
```

### `remove_std`

```bash
node api.js remove_std <studentID>
```

Deletes that student when the ID exists, then prints `User <studentID> removed successfully!`. When the ID is absent, prints `User <studentID> doesn't exist!`.

```bash
node api.js remove_std 40031073
```

### `charge_std_balance`

```bash
node api.js charge_std_balance <studentID> <amount>
```

An amount less than or equal to zero prints `Input amount is less than allowed amount`. When the student exists, the amount is parsed as an integer and added to the current `balance`, and the program prints `User <studentID> balance successfully changed to <newBalance>!`. When the student does not exist, it prints `Student with studentid <studentID> doesn't exist!`.

```bash
node api.js charge_std_balance 40031073 100
```

### `add_new_food`

```bash
node api.js add_new_food <name> <meal> <price> <inventory>
```

`meal` is `L` or `D`. `L` is stored in `foods.date` as `13:00:00`. `D` is stored as `19:00:00`. Any other meal value prints `Input amount for time of food have to be D or L !`.

A price or inventory less than or equal to zero prints `Input amount is less than allowed amount`.

When the name is new, the row is inserted and the program prints `Food <name> added successfully!`. When the name already exists, it prints `Food <name> has exist!`. The new `foodid` is not printed.

```bash
node api.js add_new_food ghormesabzi D 75 50
```

### `remove_food`

```bash
node api.js remove_food <name>
```

Deletes the food with that name when it exists, then prints `Food <name> removed successfully!`. When the name is absent, prints `Food <name> doesn't exist!`.

```bash
node api.js remove_food ghormesabzi
```

### `reserve_food`

```bash
node api.js reserve_food <studentID> <foodID>
```

`foodID` is the numeric `foods.foodid`, not the food name.

When a reservation for that pair already exists, the program prints `Reservation with std_id: <studentID> and food_id: <foodID> has exist!`.

When it does not, the command proceeds in this order:

1. Read `foods.price` for `foodID` and `students.balance` for `studentID`.
2. If the price is greater than the balance, print `Student balance isn't enough!` and stop.
3. Subtract the price from the balance and write the new balance.
4. Read `foods.inventory` for `foodID`. If it is not greater than zero, print `This food doesnt exist enough!` and stop. The balance written in the previous step stays reduced, and no reservation row is inserted.
5. Decrease that inventory by 1.
6. Insert a `reservations` row with the student ID and food ID.
7. Read `reservations.id` for that pair.
8. Insert a `transaction` row with `src_reservationid` null, `dst_reservationid` set to that id, and `date` set to the local date.
9. Print `Reservation with std_id: <studentID> and food_id: <foodID> added successfully!!`.

```bash
node api.js reserve_food 40031073 1
```

### `remove_reservation`

```bash
node api.js remove_reservation <studentID> <foodID>
```

When a reservation for that pair exists, the command:

1. Reads `reservations.id` for the pair.
2. Inserts a `transaction` row with `src_reservationid` set to that id, `dst_reservationid` null, and `date` set to the local date.
3. Adds 1 to `foods.inventory` for `foodID`.
4. Prints `Reservation with std_id: <studentID> and food_id: <foodID> removed successfully!`.

The `reservations` row stays in the table. `students.balance` stays unchanged. When the pair is absent, the program prints `Reservation with std_id: <studentID> and food_id: <foodID> doesn't exist!`.

```bash
node api.js remove_reservation 40031073 1
```

### `change_reservation`

```bash
node api.js change_reservation <studentID> <foodID> <newFoodID>
```

When no reservation exists for `studentID` and `foodID`, the program prints `Reservation with std_id: <studentID> and food_id: <foodID> doesn't exist!`.

When it does, inventory and price are taken from the current food (`foodID`), and the command proceeds in this order:

1. Read `foods.inventory` for `foodID`. If it is not greater than zero, print `This food doesnt exist enough!` and stop.
2. Decrease that inventory by 1.
3. Read `foods.price` for `foodID` and `students.balance` for `studentID`. If the price is greater than the balance, print `Student balance isn't enough!` and stop. The inventory written in the previous step stays reduced.
4. Subtract that price from the balance and write the new balance.
5. Insert a `reservations` row for `studentID` and `newFoodID`.
6. Read `reservations.id` for `studentID` and the original `foodID`.
7. Insert a `transaction` row whose `src_reservationid` and `dst_reservationid` are both that id, with `date` set to the local date.
8. Print `Reservation with food_id: <foodID> successfully changed to food_id: <newFoodID> !`.

The original reservation row is still in `reservations`. Inventory and price for `newFoodID` are not read.

```bash
node api.js change_reservation 40031073 1 2
```

## Project structure

```text
.
├── .env.example          # sample DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
├── .gitignore            # .env and node_modules
├── README.md
└── code
    ├── api.js            # command-line commands
    ├── connection.js     # PostgreSQL client; loads dotenv
    ├── database.json     # db-migrate dev connection, from the same variables
    ├── .db-migraterc     # tells db-migrate to load ../.env
    ├── package.json
    ├── package-lock.json
    ├── migrations
    │   ├── 20240323211035-initialize.js
    │   └── sqls
    │       ├── 20240323211035-initialize-down.sql
    │       └── 20240323211035-initialize-up.sql
    └── queries
        └── queries.sql   # statements used by api.js
```

`api.js` loads `queries.sql`, splits it on semicolons, and picks a statement by searching for a comment label. The labels in the SQL file and in `api.js` are:

- `check_exist_std`, `add_student`, `remove_student`
- `get_student_blance`, `change_student_balance` for top-up
- `get_student_balance`, `update_student_balance` for reserve and change
- `check_exist_food`, `add_new_food`, `remove_food`
- `get_food_price`, `get_food_inventroy`, `update_food_amount`
- `check_exist_reservation`, `reserve_food`, `get_reservation_id`, `insert_transaction`

`get_student_blance` and `get_food_inventroy` are spelled that way in both files. The command looks for those exact strings.
