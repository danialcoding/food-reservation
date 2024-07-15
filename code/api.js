const client = require('./connection.js')
const express = require('express');
const fs = require('fs');
const path = require('path');

client.connect();

// Load SQL queries from files
const loadQueries = () => {
    const queryPath = path.join(__dirname, 'queries', 'queries.sql');
    const queriesContent = fs.readFileSync(queryPath, 'utf8');
    // Split queries based on semicolon and remove empty strings
    return queriesContent.split(';').filter(query => query.trim() !== '');
};

function getCurrentDateString() {
    const now = new Date();
  
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
  
    return `${year}-${month}-${day}`;
  }

// Define CLI commands
const commands = {
    remove_std: async (studentID) => {
        try {
            const queries = loadQueries();
            const checkExistStudentQuery = queries.find(query => query.includes('check_exist_std'));
            const existResult = await client.query(checkExistStudentQuery, [studentID]);

            if(((existResult.rows[0])['exists'])) {
                const queries = loadQueries();
                const removeStudentQuery = queries.find(query => query.includes('remove_student'));
                const removeResult = await client.query(removeStudentQuery, [studentID]);
                console.log(`User ${studentID} removed successfully!`);
            }
            else {
                console.log(`User ${studentID} doesn't exist!`);
            }
        } catch (error) {
            console.error('Error removing student:', error.message);
        } finally {
            client.end();
        }
    },
    add_std: async (studentID,major,birth_date,first_name,last_name,balance) => {
        try {
            const queries = loadQueries();
            const checkExistStudentQuery = queries.find(query => query.includes('check_exist_std'));
            const existResult = await client.query(checkExistStudentQuery, [studentID]);

            if(!((existResult.rows[0])['exists'])) {
                const addStudentQuery = queries.find(query => query.includes('add_student'));
                const addResult = await client.query(addStudentQuery, [studentID,major,birth_date,first_name,last_name,balance]);
                console.log(`User ${studentID} added successfully!`);
            }
            else {
                console.log(`Student with studentid ${studentID} has exist!`);
            }
        } catch (error) {
            console.error('Error adding student:', error.message);
        } finally {
            client.end();
        }
    },
    charge_std_balance: async (studentID,addBalance) => {
        try {
            if(addBalance <= 0) {
                console.log("Input amount is less than allowed amount");
                return;
            }

            const queries = loadQueries();
            const checkExistStudentQuery = queries.find(query => query.includes('check_exist_std'));
            const existResult = await client.query(checkExistStudentQuery, [studentID]);

            if(((existResult.rows[0])['exists'])) {
                const getStudentBlanceQuery = queries.find(query => query.includes('get_student_blance'));
                const getStudentBlanceResult = await client.query(getStudentBlanceQuery, [studentID]);
                const balance = (getStudentBlanceResult.rows[0])['balance'];
                const newBalance = parseInt(balance) + parseInt(addBalance);

                const changeStudentBalanceQuery = queries.find(query => query.includes('change_student_balance'));
                const changeBalanceResult = await client.query(changeStudentBalanceQuery, [studentID,newBalance]);

                console.log(`User ${studentID} balance successfully changed to ${newBalance}!`);
            }
            else {
                console.log(`Student with studentid ${studentID} doesn't exist!`);
            }
        } catch (error) {
            console.error('Error changing student balance:', error.message);
        } finally {
            client.end();
        }
    },
    add_new_food: async (name,date,price,inventory) => {
        try {
            if(inventory <= 0 || price <= 0) {
                console.log("Input amount is less than allowed amount");
                return;
            }

            if(date == 'L') {
                date = "13:00:00";
            }
            else if(date == 'D') {
                date =  "19:00:00";
            }
            else {
                console.log("Input amount for time of food have to be D or L !");
                return;
            }

            const queries = loadQueries();
            const checkExistFoodQuery = queries.find(query => query.includes('check_exist_food'));
            const existResult = await client.query(checkExistFoodQuery, [name]);

            if(!((existResult.rows[0])['exists'])) {
                const addNewFoodQuery = queries.find(query => query.includes('add_new_food'));
                const addNewFoodResult = await client.query(addNewFoodQuery, [name,date,price,inventory]);
                console.log(`Food ${name} added successfully!`);
            }
            else {
                console.log(`Food ${name} has exist!`);
            }
        } catch (error) {
            console.error('Error adding food:', error.message);
        } finally {
            client.end();
        }
    },
    remove_food: async (name) => {
        try {
            const queries = loadQueries();
            const checkExistFoodQuery = queries.find(query => query.includes('check_exist_food'));
            const existResult = await client.query(checkExistFoodQuery, [name]);

            if(((existResult.rows[0])['exists'])) {
                const removeFoodQuery = queries.find(query => query.includes('remove_food'));
                const removeFoodResult = await client.query(removeFoodQuery, [name]);
                console.log(`Food ${name} removed successfully!`);
            }
            else {
                console.log(`Food ${name} doesn't exist!`);
            }
        } catch (error) {
            console.error('Error removing food:', error.message);
        } finally {
            client.end();
        }
    },
    reserve_food: async(studentID,foodID) => {
        try {
            const queries = loadQueries();
            const checkExistReservationQuery = queries.find(query => query.includes('check_exist_reservation'));
            const existResult = await client.query(checkExistReservationQuery, [studentID,foodID]);

            if(!((existResult.rows[0])['exists'])) {
                const getFoodPriceQuery = queries.find(query => query.includes('get_food_price'));
                const getFoodPriceResult = await client.query(getFoodPriceQuery, [foodID]);

                const getStudentBalanceQuery = queries.find(query => query.includes('get_student_balance'));
                const getStudentBalanceResult = await client.query(getStudentBalanceQuery, [studentID]);

                const foodPrice = parseInt((getFoodPriceResult.rows[0])['price']);
                const stdBalance = parseInt((getStudentBalanceResult.rows[0])['balance']);

                if(foodPrice <= stdBalance) {
                    const newBalance = stdBalance - foodPrice;
                    const updateStudentBalanceQuery = queries.find(query => query.includes('update_student_balance'));
                    const updateStudentBalanceResult = await client.query(updateStudentBalanceQuery, [studentID,newBalance]);
                }
                else {
                    console.log("Student balance isn't enough!");
                    return;
                }

                const getFoodAmountQuery = queries.find(query => query.includes('get_food_inventroy'));
                const getFoodAmountResult = await client.query(getFoodAmountQuery, [foodID]);

                const inventory = parseInt((getFoodAmountResult.rows[0])['inventory']);

                if(inventory > 0) {
                    const newInventory = inventory - 1;

                    const updateFoodAmountQuery = queries.find(query => query.includes('update_food_amount'));
                    const updateFoodAmountResult = await client.query(updateFoodAmountQuery, [foodID,newInventory]);
                }
                else {
                    console.log("This food doesnt exist enough!");
                    return;
                }

                const reserveFoodQuery = queries.find(query => query.includes('reserve_food'));
                const reserveFoodResult = await client.query(reserveFoodQuery, [studentID,foodID]);

                const getReservationIdQuery = queries.find(query => query.includes('get_reservation_id'));
                const getReservationIdResult = await client.query(getReservationIdQuery, [studentID,foodID]);

                const reservationID = ((getReservationIdResult.rows[0])['id']);

                const insertTransactionQuery = queries.find(query => query.includes('insert_transaction'));
                const insertTransactionResult = await client.query(insertTransactionQuery, [null,reservationID,getCurrentDateString()]);

                console.log(`Reservation with std_id: ${studentID} and food_id: ${foodID} added successfully!!`);
            }
            else {
                console.log(`Reservation with std_id: ${studentID} and food_id: ${foodID} has exist!`);
            }
        } catch (error) {
            console.error('Error reserving food:', error.message);
        } finally {
            client.end();
        }
    },
    remove_reservation: async(studentID,foodID) => {
        try {
            const queries = loadQueries();
            const checkExistReservationQuery = queries.find(query => query.includes('check_exist_reservation'));
            const existResult = await client.query(checkExistReservationQuery, [studentID,foodID]);
            
            if(((existResult.rows[0])['exists'])) {
                const getReservationIdQuery = queries.find(query => query.includes('get_reservation_id'));
                const getReservationIdResult = await client.query(getReservationIdQuery, [studentID,foodID]);

                const reservationID = ((getReservationIdResult.rows[0])['id']);

                const insertTransactionQuery = queries.find(query => query.includes('insert_transaction'));
                const insertTransactionResult = await client.query(insertTransactionQuery, [reservationID,null,getCurrentDateString()]);

                const getFoodAmountQuery = queries.find(query => query.includes('get_food_inventroy'));
                const getFoodAmountResult = await client.query(getFoodAmountQuery, [foodID]);

                const inventory = parseInt((getFoodAmountResult.rows[0])['inventory']);

                const newInventory = inventory + 1;

                const updateFoodAmountQuery = queries.find(query => query.includes('update_food_amount'));
                const updateFoodAmountResult = await client.query(updateFoodAmountQuery, [foodID,newInventory]);

                console.log(`Reservation with std_id: ${studentID} and food_id: ${foodID} removed successfully!`);
            }
            else {
                console.log(`Reservation with std_id: ${studentID} and food_id: ${foodID} doesn't exist!`);
            }
        } catch (error) {
            console.error('Error removing reservation:', error.message);
        } finally {
            client.end();
        }
    },
    change_reservation: async(studentID,foodID,newFoodID) => {
        try {
            const queries = loadQueries();
            const checkExistReservationQuery = queries.find(query => query.includes('check_exist_reservation'));
            const existResult = await client.query(checkExistReservationQuery, [studentID,foodID]);
            
            if(((existResult.rows[0])['exists'])) {
                const getFoodAmountQuery = queries.find(query => query.includes('get_food_inventroy'));
                const getFoodAmountResult = await client.query(getFoodAmountQuery, [foodID]);

                const inventory = parseInt((getFoodAmountResult.rows[0])['inventory']);

                if(inventory > 0) {
                    const newInventory = inventory - 1;

                    const updateFoodAmountQuery = queries.find(query => query.includes('update_food_amount'));
                    const updateFoodAmountResult = await client.query(updateFoodAmountQuery, [foodID,newInventory]);
                }
                else {
                    console.log("This food doesnt exist enough!");
                    return;
                }

                const getSRCReservationIdQuery = queries.find(query => query.includes('get_reservation_id'));
                const getSRCReservationIdResult = await client.query(getSRCReservationIdQuery, [studentID,foodID]);


                const src_reservationID = ((getSRCReservationIdResult.rows[0])['id']);

                const getFoodPriceQuery = queries.find(query => query.includes('get_food_price'));
                const getFoodPriceResult = await client.query(getFoodPriceQuery, [foodID]);

                const getStudentBalanceQuery = queries.find(query => query.includes('get_student_balance'));
                const getStudentBalanceResult = await client.query(getStudentBalanceQuery, [studentID]);

                const foodPrice = parseInt((getFoodPriceResult.rows[0])['price']);
                const stdBalance = parseInt((getStudentBalanceResult.rows[0])['balance']);

                if(foodPrice <= stdBalance) {
                    const newBalance = stdBalance - foodPrice;
                    const updateStudentBalanceQuery = queries.find(query => query.includes('update_student_balance'));
                    const updateStudentBalanceResult = await client.query(updateStudentBalanceQuery, [studentID,newBalance]);
                }
                else {
                    console.log("Student balance isn't enough!");
                    return;
                }

                const reserveFoodQuery = queries.find(query => query.includes('reserve_food'));
                const reserveFoodResult = await client.query(reserveFoodQuery, [studentID,newFoodID]);

                const getDSTReservationIdQuery = queries.find(query => query.includes('get_reservation_id'));
                const getDSTReservationIdResult = await client.query(getDSTReservationIdQuery, [studentID,foodID]);

                const DSTreservationID = ((getDSTReservationIdResult.rows[0])['id']);

                const insertTransactionQuery = queries.find(query => query.includes('insert_transaction'));
                const insertTransactionResult = await client.query(insertTransactionQuery, [src_reservationID,DSTreservationID,getCurrentDateString()]);

                console.log(`Reservation with food_id: ${foodID} successfully changed to food_id: ${newFoodID} !`);
            }
            else {
                console.log(`Reservation with std_id: ${studentID} and food_id: ${foodID} doesn't exist!`);
            }
        } catch (error) {
            console.error('Error changing reservation:', error.message);
        } finally {
            client.end();
        }
    }
};


// Parse command line arguments
const [command, ...args] = process.argv.slice(2);

// Execute the command
if (commands[command]) {
    commands[command](...args);
} else {
    console.error('Invalid command. Please provide a valid command.');
}