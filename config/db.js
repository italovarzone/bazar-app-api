const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true, // Usado apenas se o SQL Server estiver em uma conexão segura
        enableArithAbort: true
    }
};

const poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then(pool => {
        console.log('Conectado ao SQL Server');
        return pool;
    })
    .catch(err => console.error('Falha na conexão com o SQL Server:', err));

module.exports = {
    sql, poolPromise
};
