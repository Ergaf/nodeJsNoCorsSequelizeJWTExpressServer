const express = require('express');
const jwt = require('jsonwebtoken');
const users = require('./users.json');
const app = express();
const port = 90;
const bodyParser = require('body-parser');
const cors = require('cors');
const Sequelize = require("sequelize");


const sequelize = new Sequelize("daridas", "root", "12346", {
    dialect: "mysql",
    dialectOptions: {
        charset: 'utf8',
    },
    host: "localhost",
});

const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'contentType', 'Content-Type', 'Accept', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(bodyParser.urlencoded({extended: false}));

app.use(bodyParser.json());

app.use('/form_handler', bodyParser.urlencoded({
    extended: true
}));

app.use(express.static('/'));

//обьекты БД ----------------------
const Orders = sequelize.define("orders", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    Adress: {
        type: Sequelize.STRING
    },
    City: {
        type: Sequelize.STRING
    },
    Phone: {
        type: Sequelize.STRING
    },
    Client: {
        type: Sequelize.STRING
    },
    totalPrice: {
        type: Sequelize.STRING
    },
    dispatchMethod: {
        type: Sequelize.STRING
    },
    payMethod: {
        type: Sequelize.STRING
    },
});

const Products = sequelize.define("products", {
    ProductID: {
        type: Sequelize.STRING
    },
    Summary: {
        type: Sequelize.STRING
    },
    Price: {
        type: Sequelize.STRING
    },
    Count: {
        type: Sequelize.STRING
    },
});
Orders.hasMany(Products);

const ProductsForBase = sequelize.define("productsForBaseV2", {
    idA: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    name: {
        type: Sequelize.STRING
    },
    description: {
        type: Sequelize.STRING
    },
    gaz: {
        type: Sequelize.BOOLEAN
    },
    productQuantity: {
        type: Sequelize.STRING
    },
    productPrice: {
        type: Sequelize.STRING
    },
    src: {
        type: Sequelize.STRING
    },
    id: {
        type: Sequelize.INTEGER
    },
    price: {
        type: Sequelize.FLOAT
    },
})


const user = sequelize.define("users", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
    },
    user: {
        type: Sequelize.STRING
    },
    pass: {
        type: Sequelize.STRING
    },
})
//обьекты БД конец ----------------------

//функция синхронизации обьектов с БД -----
// {force: true}
sequelize.sync().then(result => {
    console.log(result);
})
    .catch(err => console.log(err));
//БД конец ---------------------------------------

//JWT token use --------------------
const tokenKey = '1a2w-3c4d-5e6f-7g8h';
app.use((req, res, next) => {
    if(req.headers.authorization){
        jwt.verify(req.headers.authorization.split(' ')[1], tokenKey, (err, payload) => {
            if(err)
                next();
            else if(payload){
                for(let user of users){
                    if(user.id === payload.id){
                        req.user = user;
                        next();
                    }
                }

                if(!req.user) next();
            }
        });
    }

    next();
});
//-----------------------------------

//получение и добавление заказов в бд
app.post("/", function (req, res) {
    console.log("пришел заказ");
    res.json("1");
    Orders.create({
        Adress: req.body.address,
        City: req.body.city,
        Phone: req.body.phone,
        Client: req.body.fullName,
        totalPrice: req.body.totalPrice,
        dispatchMethod: req.body.dispatchMethod,
        payMethod: req.body.payMethod
    }).then(order => {
        let id = JSON.parse(req.body.id);
        console.log(id);
        id.forEach((e) => {
            console.log(e);
            Products.create({
                ProductID: e.productId,
                Summary: e.info.price,
                Price: e.info.productPrice,
                Count: e.amount
            }).then(product => {
                order.setProducts(product).catch(err => console.log(err));
            });
        });
        const user = {
            Adress: res.Adress,
            City: res.City,
            Phone: res.Phone,
            Client: res.Client,
            totalPrice: res.totalPrice,
            dispatchMethod: res.dispatchMethod,
            payMethod: res.payMethod
        };
        console.log(user);
    }).catch(err => console.log(err));
});

//получение заказов ----------------
app.get("/", function (req, res) {
    Orders.findAll({raw: true}).then(orders => {
        res.json(orders)
    }).catch(err => console.log(err));

});

//админка-------------------------
app.get("/admin", function (req, res) {
    let isAdmin = 1;
    console.log("сессии в списке сессий: " + sessionID);
    console.log('Cookies: ', req.cookies)
    sessionID.forEach(e => {
        if (e === req.body.cookie) {
            isAdmin = e;
        }
    })
    res.json(isAdmin);
})
//--
app.post("/admin", function (req, res) {
    if (req.user)
        try {
            ProductsForBase.create({
                name: req.body.name,
                description: req.body.description,
                gaz: req.body.gaz,
                productQuantity: req.body.productQuantity,
                productPrice: req.body.productPrice,
                src: req.body.src,
                id: req.body.id,
                price: req.body.price,
            })
            return res.json("удачно добавлено в бд: " + req.body);
        } catch (e) {
            return res.json("ошибка БД: " + e);
        }
    else
        return res.status(401).json({message: 'Not authorized'});
})
//--
app.put("/admin", async function (req, res) {
    if (req.user)
        try {
            ProductsForBase.update(
                {
                    name: req.body.name,
                    price: req.body.price,
                    productPrice: req.body.productPrice,
                    productQuantity: req.body.productQuantity,
                    src: req.body.src
                },
                {
                    where:
                        {
                            idA: req.body.id
                        }
                });
            return res.json(req.body);
        } catch (e) {
            console.log("ошибка");
            return res.json("ошибка базы данных: " + e)
        }
    else
        return res.status(401).json({message: 'Not authorized'});
})
//--
app.delete("/admin", function (req, res) {
    if (req.user)
        try {
            ProductsForBase.destroy(
                {
                    where:
                        {idA: req.body.id}
                })
            return res.json(req.body);
        } catch (e) {
            return res.json("ошибка БД: " + e);
        }
    else
        return res.status(401).json({message: 'Not authorized'});
})
//админка конец-------------------------

app.get("/productsAll", function (req, res) {
    ProductsForBase.findAll({raw: true}).then(orders => {
        res.json(orders)
    }).catch(err => console.log(err));
})

//для пуша данных из json файла ------------------------
// app.post("/addall", function (req, res) {
//     console.log(req.body.products);
//     req.body.products.forEach(e => {
//         ProductsForBase.create({
//             name: e.name,
//             description: e.description,
//             gaz: e.gaz,
//             productQuantity: e.productQuantity,
//             productPrice: e.productPrice,
//             src: e.src,
//             id: e.id,
//             price: e.price,
//         })
//     })
//     res.json(req.body)
// })
//для пуша данных из json файла конец ------------------------

//логин ------------------------
app.post("/login", function (req, res) {
    for(let user of users){
        if(req.body.user === user.login && req.body.pass === user.password){
            return res.status(200).json({
                id: user.id,
                login: user.login,
                token: jwt.sign({id: user.id}, tokenKey)
            });
        }
    }

    return res.status(404).json({message: 'User not found'});
})
//логин конец ------------------------

app.listen(port, (err) => {
    if (err) {
        return console.log('something bad happened', err)
    }
    console.log(`Server has been started on ${port} port...`)
});