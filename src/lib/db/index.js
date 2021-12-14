const mongoose = require('mongoose')
mongoose
    .connect(
        'mongodb+srv://doadmin:3UAzS8db4ci65701@db-mongodb-nyc3-07265-dd6a67db.mongo.ondigitalocean.com/admin?authSource=admin&replicaSet=db-mongodb-nyc3-07265&tls=true&tlsCAFile=ca-certificate.crt',
        {
            useNewUrlParser: true,

            useUnifiedTopology: true
        }
    )
    .then(db => console.log('conexion exitosa'))
    .catch(err => console.log('error: ', err))
