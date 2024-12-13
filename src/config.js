require('dotenv').config();

module.exports={
    app:{
        port :process.env.PORT,
    },
    mysql:{
        host     :process.env.MYSQL_HOST,
        user     :process.env.MYSQL_USER,
        password :process.env.MYSQL_PASSWORD,
        database :process.env.MYSQL_DB,
        mysqlport:process.env.MYSQL_PORT,
    }
}
