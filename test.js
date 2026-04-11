const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Shoharabchy',
    database: 'ecocar'
});

connection.connect((err) => {
    if (err) {
        console.log('❌ Connection failed:', err.message);
    } else {
        console.log('✅ Connection successful!');
        connection.end();
    }
});