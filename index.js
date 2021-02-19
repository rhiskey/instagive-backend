const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 8080
const mysql = require('mysql2');
const bodyParser = require("body-parser");
const cors = require('cors')
var session = require('express-session');
const httpRequest = require('request');
var cookieSession = require('cookie-session')

const Instagram = require('instagram-web-api')
const { IG_USERNAME, IG_PASSWORD } = process.env
const client = new Instagram({ IG_USERNAME, IG_PASSWORD })

const Bot = require('./Bot'); // this directly imports the Bot/index.js file
// const PUPconfig = require('./Bot/config/puppeter.json'); //Need 1 value = hrs to run Scheduler

var instaAccs;

// const resultNick = require('./Bot/')
const run = async (userNickname) => {
    const bot = new Bot();

    const startTime = Date();

    await bot.initPuppeter().then(() => console.log("PUPPETEER INITIALIZED"));

    await bot.visitInstagram().then(() => console.log("BROWSING INSTAGRAM"));

    //await bot.visitHashtagUrl().then(() => console.log("VISITED HASH-TAG URL"));

    await bot.visitFollowedUrl(userNickname).then(() => console.log("VISITED USERNAME URL"));

    //BAD URL TIMESTAMP
    //await bot.parseAvatar(userNickname).then(() => console.log("AVATAR ADDED TO DATABASE"));


    // await bot.unFollowUsers();

    // await bot.closeBrowser().then(() => console.log("BROWSER CLOSED"));

    const endTime = Date();

    console.log(`START TIME - ${startTime} / END TIME - ${endTime}`)

    // await bot.closeBrowser().then(() => console.log("BROWSER CLOSED"));

};


require('dotenv').config();

var db_config = {
    connectionLimit: 5,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_DATABASENAME,
    password: process.env.DB_PASSWORD
}


var connection;

connection = mysql.createConnection(db_config);

const urlencodedParser = bodyParser.urlencoded({ extended: false });

const app = express();

var expiryDate = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hour
app.use(cookieSession({
    name: 'session',
    keys: ['key1', 'key2'],

    cookie: {
        secure: true,
        httpOnly: true,
        domain: 'www.instagive.ga/',
        path: 'page/session',
        expires: expiryDate
    }
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cors());

app.use(express.urlencoded());

app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));
app.set("view engine", "hbs");

app.get("/", function (req, res) {
    if (req.session.loggedin) {
        connection.query("SELECT * FROM givaway.mainusers", function (err, data) {
            if (err) return console.log(err);
            res.render("index.hbs", {
                users: data
            });
        });
    } else {
        res.sendFile(path.join(__dirname + '/login.html'));
    }

});


// возвращаем форму для добавления данных
app.get("/create", function (req, res) {
    if (req.session.loggedin) {
        res.render("create.hbs");
    } else {
        res.sendFile(path.join(__dirname + '/login.html'));
    }
});

function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; 
}

// получаем отправленные данные и добавляем их в БД 
app.post("/create", urlencodedParser, function (req, res) {

    if (!req.body) return res.sendStatus(400);
    const sql = "INSERT INTO givaway.mainusers (username, link, giveinfo, avatar, userid) VALUES (?, ?, ?, ?, ?) ";
    const userID = getRandomIntInclusive(1, 99999);
    var instalink = "https://instagram.com/";
    var link = instalink + req.body.userName;
    const data = [req.body.userName, link, req.body.userGiveinfo, req.body.userAvatar, userID];
    connection.query(sql, data, function (err, results) {
        if (err) console.log(err);
        const username2Parse = req.body.userName;

        run(username2Parse).catch(e => console.log(e.message));
        res.redirect("/");
    });

});


// возвращаем форму 
app.get("/getfollowers", function (req, res) {
    if (req.session.loggedin) {
        const sql = "SELECT username FROM givaway.mainusers";
        connection.query(sql, function (err, results) {
            if (err) console.log(err);
            res.render("getfollowers.hbs", { dropdownVals: results });
        })
    } else {
        res.sendFile(path.join(__dirname + '/login.html'));
    }

});

// получаем отправленные данные 
app.post("/getfollowers", urlencodedParser, function (req, res) {
    if (!req.body) return res.sendStatus(400);
    const username2Parse = req.body.userName;
    //Получить id по нику, если ID есть - > Добавить в БД
    const sql = "SELECT username, userid FROM givaway.mainusers WHERE username = ?";
    connection.query(sql, [username2Parse], function (err, results) {
        if (err) console.log(err);
        if (results) {
            var instaID = results[0];
            console.log(instaID);
            if (instaID) {
                run(username2Parse).catch(e => console.log(e.message));
                res.redirect("/");
            } else { res.send(500, 'Такого юзера не существует в БД') }
        }
    });

});

// получем id редактируемого пользователя, получаем его из бд и отправлям с формой редактирования
app.get("/edit/:id", function (req, res) {
    if (req.session.loggedin) {
        const id = req.params.id;
        connection.query("SELECT * FROM givaway.mainusers WHERE id=?", [id], function (err, data) {
            if (err) return console.log(err);
            res.render("edit.hbs", {
                user: data[0]
            });
        });
    } else {
        res.sendFile(path.join(__dirname + '/login.html'));
    }

});

// получаем отредактированные данные и отправляем их в БД
app.post("/edit", urlencodedParser, function (req, res) {

    if (!req.body) return res.sendStatus(400);
    const name = req.body.userName;
    const link = req.body.userLink;
    const info = req.body.userGiveinfo;
    const avatar = req.body.userAvatar;
    const uid = req.body.userID;
    const id = req.body.id;
    const show = req.body.showgive;
    const rating = req.body.rating;
    connection.query("UPDATE givaway.mainusers SET username=?, giveinfo=?, avatar=?, link=?, userid=?, rating=? WHERE id=?;", [name, info, avatar, link, uid, rating, id], function (err, data) {
        if (err) return console.log(err);
        res.redirect("/");
    });
});

// получаем id удаляемого пользователя и удаляем его из бд
app.post("/delete/:id", function (req, res) {

    const id = req.params.id;

    connection.query("SELECT userid FROM givaway.mainusers WHERE id =?", [id], function (err, data) {
        if (err) return console.log(err);
        const userid = data[0].userid;
        try{
        connection.query("DELETE FROM givaway.Follow WHERE followedid=?", [userid], function (err, data) {
            if (err) return console.log(err);

        });
        } catch (e) {console.log(e.message)}
        connection.query("DELETE FROM givaway.mainusers WHERE id=?", [id], function (err, data) {
            if (err) return console.log(err);

            res.redirect("/");
        });
    });

});

// получаем id изменяемой раздачи и изменяем видимость
app.post("/visible/:id", function (req, res) {
    const id = req.params.id;
    const show = 1;
    connection.query("UPDATE givaway.mainusers SET showgive=? WHERE id=?", [show, id], function (err, data) {
        if (err) return console.log(err);
        res.redirect("/");
    });
});

app.post("/hide/:id", function (req, res) {
    const id = req.params.id;
    const show = 0;
    connection.query("UPDATE givaway.mainusers SET showgive=? WHERE id=?", [show, id], function (err, data) {
        if (err) return console.log(err);
        res.redirect("/");
    });
});

//Очищаем фолловеров
app.post("/clearfollowed/:userid", function (req, res) {
    const userid = req.params.userid;
    connection.query("DELETE FROM givaway.Follow WHERE followedid=?", [userid], function (err, data) {
        if (err) return console.log(err);
        res.redirect("/");
    });
});

// получаем аккаунты, на которых подписан юзер
app.post("/followed", function (req, res) {
    if (!req.body) return res.sendStatus(400);
    const uid = req.body.userID;
    const name = req.body.userName;
});

// возвращаем форму для поиска подписанных
app.get("/followed", function (req, res) {
    if (req.session.loggedin) {
        const sql = "SELECT id, usernameFollower, linkFollower, LEFT(avatarFollower, 256), useridFollower, followedid FROM givaway.Follow LIMIT 1000";
        connection.query(sql, function (err, results) {
            if (err) console.log(err);
            res.render("followed.hbs", { users: results });

        })
    } else {
        res.sendFile(path.join(__dirname + '/login.html'));
    }

});


// Предложенные с фронта раздачи
app.post("/offer", function (req, res) {
    if (!req.body) return res.sendStatus(400);
    const username = req.body.offerUserName;
    const giveinfo = req.body.offerUserGiveinfo;
    const avatar = req.body.offerUserAvatar;
    const sql = "INSERT INTO givaway.offer (username, link, giveinfo, avatar, userid) VALUES (?, ?, ?, ?, ?) ";
    const userID = getRandomIntInclusive(1, 99999);
    var instalink = "https://instagram.com/";
    var link = instalink + req.body.offerUserName;
    const data = [username, link, giveinfo, avatar, userID];
    connection.query(sql, data, function (err, results) {
        if (err) console.log(err);
        res.sendStatus(200);
    });

});

// возвращаем список предложенных раздач в бэк
app.get("/offer", function (req, res) {
    if (req.session.loggedin) {
        const sql = "SELECT * FROM givaway.offer LIMIT 1000";
        connection.query(sql, function (err, results) {
            if (err) console.log(err);
            res.render("offer.hbs", { users: results });

        })

    } else {
        res.sendFile(path.join(__dirname + '/login.html'));
    }

});


// получаем id удаляемого раздачи и удаляем его из бд
app.post("/denyoffer/:id", function (req, res) {
    const id = req.params.id;
    connection.query("DELETE FROM givaway.offer WHERE id=?", [id], function (err, data) {
        if (err) return console.log(err);
        res.redirect("/offer");
    });
});

// получаем id раздачи и добавляем в основную БД
app.post("/acceptoffer/:id", function (req, res) {
    const id = req.params.id;
    const sql = "SELECT * FROM givaway.offer WHERE id=?";
    connection.query(sql, [id], function (err, results) {
        if (err) return console.log(err);

        const username = results[0].username;
        const link = results[0].link;
        const giveinfo = results[0].giveinfo;
        const avatar = results[0].avatar;

        const sql = "INSERT INTO givaway.mainusers (username, link, giveinfo, avatar, userid) VALUES (?, ?, ?, ?, ?) ";

        const userID = getRandomIntInclusive(1, 99999);
        const data = [username, link, giveinfo, avatar, userID];
        connection.query(sql, data, function (err, results) {
            if (err) return console.log(err);
            connection.query("DELETE FROM givaway.offer WHERE id=?", [id], function (err, data) {
                if (err) return console.log(err);
                res.redirect("/offer");
            });
        });
    });

});


// Поменять пароль
app.get("/changeadmin", function (req, res) {
    if (req.session.loggedin) {
        const sql = "SELECT * FROM givaway.accounts LIMIT 1000";
        connection.query(sql, function (err, results) {
            if (err) console.log(err);
            res.render("changeadmin.hbs", { users: results });

        })

    } else {
        res.sendFile(path.join(__dirname + '/login.html'));
    }

});


// Поменять пароль
app.post("/changeadmin", function (req, res) {
    if (!req.body) return res.sendStatus(400);
    const username = req.body.userName;
    const pass = req.body.userNewPass;

    const sql = "INSERT INTO givaway.accounts (username, password) VALUES (?, ?) ";
    const data = [username, pass];
    connection.query(sql, data, function (err, results) {
        if (err) console.log(err);
        res.sendStatus(200);
    });

});


app.post('/auth', function (request, response) {
    var username = request.body.username;
    var password = request.body.password;
    if (username && password) {
        connection.query('SELECT * FROM givaway.accounts WHERE username = ? AND password = ?', [username, password], function (error, results, fields) {
            if (results.length > 0) {
                request.session.loggedin = true;
                request.session.username = username;
                response.redirect('/');
            } else {
                response.send('Неправильные Username или Password!');
            }
            response.end();
        });
    } else {
        response.send('Введите логин и пароль!');
        response.end();
    }
});

app.get('/home', function (request, response) {
    if (request.session.loggedin) {
        response.send('Снова здравствуй, ' + request.session.username + '!');
    } else {
        response.send('Пожалуйста авторизируйтесь для просмотра данной страницы!');
    }
    response.end();
});


app.get('/onlyshow', function (req, res) {
    // Проверка авторизации, отправлять POST запрос сюда с данными авторизации
    connection.connect();
    connection.query('SELECT * FROM givaway.mainusers WHERE showgive = 1', function (error, results, fields) {
        if (error) throw error;
        res.send(JSON.stringify(results))
    });

});

app.get('/alljoin', function (req, res) {
    // Проверка авторизации, отправлять POST запрос сюда с данными авторизации
    connection.connect();
    connection.query('SELECT Follow.id, Follow.linkFollower, Follow.avatarFollower, Follow.usernameFollower, mainusers.giveinfo, mainusers.username, mainusers.avatar, mainusers.link FROM Follow INNER JOIN mainusers ON Follow.followedid=mainusers.userid;', function (error, results, fields) {
        if (error) throw error;
        res.send(JSON.stringify(results))
    });
});

app.get('/follow', function (req, res) {
    connection.connect();
    connection.query('SELECT * FROM givaway.Follow', function (error, results, fields) {
        if (error) throw error;
        res.send(JSON.stringify(results))
    });
});

// получаем данные со фронта и отправляем их в БД - в ответе возвращаем список фолловеров из бд
app.post("/getfollowers", urlencodedParser, function (req, res) {

    if (!req.body) return res.sendStatus(400);
    console.log(req.body);
    const name = req.body.username;
    // console.log(req.body.username);
    // По имени из mainusers - получить userID - затем в таблице Follow получить все записи у которых followedid совпадает с userID
    connection.query('SELECT userid FROM givaway.mainusers WHERE username=?', [name], function (err, responseID) {
        if (err) return console.log(err);
        console.log(responseID);

        //// Если вдруг их много (имя одно и тоже а ID разные)
        // const users = responseID;
        // for(let i=0; i < users.length; i++){
        //   console.log(users[i].userid);

        const ID = responseID[0].userid;
        console.log(ID);
        connection.query('SELECT * FROM givaway.Follow WHERE followedid=?', [ID], function (err, followers) {
            if (err) return console.log(err);
            console.log(followers);
            res.send(JSON.stringify(followers));
        });
    });
});

// Получить с фронта запросом responseInstagram -> отправляет сюда {authCode} на страницу /oauth
app.post("/oauth", urlencodedParser, function (request, responseAuth) {
    if (!request.body) return responseAuth.sendStatus(400);
    console.log(request.body);
    var inBoundResp = responseAuth;

    // ЭТО ключи приложения INSTAGRAM SECRET и ID
    var options = {
        url: 'https://api.instagram.com/oauth/access_token',
        method: 'POST',
        form: {
            client_id: process.env.IG_CLIENT_ID,
            client_secret: process.env.IG_CLIENT_SECRET,
            grant_type: 'authorization_code',
            redirect_uri: process.env.FRONTEND,
            code: request.body.authCode
        }
    };
    //Отправка в  апи инсты
    httpRequest(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var user = JSON.parse(body);
            console.log(user)
            //Шлем обратно на фронт токен, можно ещё в БД 
            inBoundResp.send(`${user.access_token}`);
            console.log(user.access_token)

        } else { inBoundResp.send(`${response.statusCode}`); } //Если ошибка отправляем статус во фроннт
    }, (error, res, body) => {
        if (error) {
            console.error(error)
            return
        }
    });

});


// Start the server
app.listen(PORT, () => {
    console.log('Go to http://localhost: ${ PORT } 5000 8080/accounts to see accounts');
});


app.use(express.static(path.join(__dirname, 'public')));

app.get('*', function (req, res) {
    res.sendFile(process.env.FRONTEND + '/index.html');
});