//ig-bot/Bot/index.js
const mysql = require('mysql2');
require('dotenv').config({ path: __dirname + '/./../.env' }) //Загружаем файл с переменными среды

var instaAccString;
var parsed = false;
var instaNick;

var db_config = {
    connectionLimit: 5,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_DATABASENAME,
    password: process.env.DB_PASSWORD
}

var connection;

connection = mysql.createConnection(db_config);

class InstagramBot {

    constructor() {
        var config = {
            base_url: "https://www.instagram.com",
            username: process.env.IG_USERNAME,
            password: process.env.IG_PASSWORD,
            hashTags: ["instagive", "раздачи", "giveaway"],
            settings: {
                run_every_x_hours: 3,
                like_ratio: 0.75,
                unfollow_after_days: 2,
                headless: true //true для heroku - в фоне, false - для запуска на ПК (открыть окно браузера)
            },
            selectors: {
                home_to_login_button: ".izU2O a",
                username_field: "input[type=\"text\"]",
                password_field: "input[type=\"password\"]",
                login_button: "button[type=\"submit\"]",
                post_heart_grey: "span.glyphsSpriteHeart__outline__24__grey_9",
                post_username: "div.e1e1d > h2.BrX75 > a",
                post_follow_link: ".bY2yH > button",
                post_like_button: "span.fr66n > button",
                post_follow_button: "span.oW_lN._1OSdk > button",
                post_close_button: "button.ckWGn",
                user_unfollow_button: "span.vBF20 > button._5f5mN",
                user_unfollow_confirm_button: "div.mt3GC > button.aOOlW.-Cab_",
                user_followed_button: ".Y8-fY a",
                not_now_button: ".cmbtv",
                not_now_button_new: ".aOOlW.HoLwm",
                not_now_button_class: ".sqdOP.yWX7d.y3zKF",
                hash_tags_base_class: ".EZdmt",
                div_accounts: ".isgrP",
                ul_accounts: ".jSC57._6xe7A",
                li_accounts: ".PZuss",
                its_me_button: ".", //TODO
                send_security_button: ".5f5mN.jIbKX.KUBKM.yZn4P",
                send_security_span: ".idhGk._1OSdk",
                avatar_span: "._2dbep",
                avatar: "._6q-tv"
            },
            speed_scrolling: 150,
            user_name: false, // true
            height_scrolling: []
        }
        this.config = config;
        // this.firebase_db = require('./db');
        //this.config = require('./config/puppeteer.json');
    }


    async initPuppeter() {
        const puppeteer = require('puppeteer');
        this.browser = await puppeteer.launch({
            headless: this.config.settings.headless,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
            ],

        });
        this.page = await this.browser.newPage();
        this.page.setViewport({ width: 1500, height: 764 });
    }

    async visitInstagram() {
        await this.page.goto(this.config.base_url, { waitUntil: 'load', timeout: 60000 });
        //await this.page.waitFor(2500);

        //Register
        // await this.page.click(this.config.selectors.home_to_login_button);
        // await this.page.waitFor(2500);

        /* Click on the username field using the field selector*/
        await this.page.waitForSelector(this.config.selectors.username_field);
        await this.page.click(this.config.selectors.username_field);
        await this.page.keyboard.type(this.config.username);

        await this.page.waitForSelector(this.config.selectors.password_field);
        await this.page.click(this.config.selectors.password_field);
        await this.page.keyboard.type(this.config.password);

        await this.page.waitForSelector(this.config.selectors.login_button);
        await this.page.click(this.config.selectors.login_button);

        await this.page.waitForNavigation();

        //Close Turn On Notification modal after login
        // //  waiting for selector ".cmbtv" failed: timeout 30000ms exceeded

        try { //Save login settings?
            await this.page.waitForSelector(this.config.selectors.not_now_button);
            await this.page.click(this.config.selectors.not_now_button);
            await this.page.waitFor(2500);
        } catch (e) {
            console.log('Пытались нажать "Не сейчас" при запросе сохранить данные, не вышло(');
        }

        try {
            //Close window IT's me Verification from NEw Location
            await this.page.waitForSelector(this.config.selectors.its_me_button);
            await this.page.click(this.config.selectors.its_me_button);
        } catch (e) {
            console.log('Пытались нажать "Это я" при запросе с нового местоположения, не вышло(');
        }
    }

    async visitFollowedUrl(instagramNickname) {
        console.log('<<<< Currently Exploring >>>> ' + instagramNickname);

        instaNick = instagramNickname;
        //https://www.instagram.com/username/following/
        await this.page.goto(`${this.config.base_url}/` + instagramNickname, { waitUntil: 'load', timeout: 60000 });
        await this.page.waitFor(2500);

        // // Жмём на кнопку "Подписок"
        // await this.page.click(this.config.selectors.user_followed_button); //Нужно кликнуть на [2]

        //NEW
        // Click on the following link
        //Evaluation failed: TypeError: Cannot read property 'click' of null
        await this.page.waitForSelector("a[href*='following']");
        await this.page.evaluate(() => document.querySelector("a[href*='following']").click())

        // // Wait for the followers modal and profiles
        // await this.page.waitFor("div[role='presentation'] div[role='dialog'] div:nth-child(2) ul li");

        // // Get followers that are in the list in the second div of that modal
        // const people = await this.page.evaluate(() => {
        //     return [...document.querySelectorAll("div[role='presentation'] div[role='dialog'] div:nth-child(2) ul li")]
        //         .map(user => {

        //             const profLink = user.querySelector("a[title]")
        //             return {
        //                 "name": profLink.textContent,
        //                 "url": profLink.href
        //             };

        //         })
        // })

        // console.log(people)

        // await this.page.goto(`${this.config.base_url}/` + instagramNickname + '/following/');
        await this.page.waitFor(2500);
        // Листать вниз и парсить подписоту
        // let accStr = await this._doScrollFollowingParsing(this.config.selectors.div_accounts, this.config.selectors.ul_accounts, this.config.selectors.li_accounts, this.page)
        var accStr = await this._doScrollFollowingParsing(this.config.selectors.div_accounts, this.config.selectors.ul_accounts, this.config.selectors.li_accounts, this.page).then(() => console.log("Start Parsing"));
        //  console.log("---------------NEW------------"+ accStr);

        await this.page.waitFor(2500);
    }

    async _doScrollFollowingParsing(p_div_accounts, p_ul_accounts, p_li_accounts, page) {
        try {
            // ОБЪЯВЛЕНИЕ ПЕРЕМЕННЫХ
            var div_accounts = p_div_accounts; // класс тега div списка аккаунтов
            var ul_accounts = p_ul_accounts; // класс тега ul списка аккаунтов
            //var li_accounts = document.getElementsByClassName("wo9IH"); // класс тега li списка тег аккаунтов
            var li_accounts = p_li_accounts;
            var height_scrolling = []; // массив размеров (высот) скроллинга
            var accountsString = "accs"; //Для возврата в основу
            // ----------------------------------------------------------------------------------
            // СКОРОСТЬ ПРОКРУТКИ
            // Задаётся в миллисекундах
            // ----------------------------------------------------------------------------------
            var speed_scrolling = 150;
            // ----------------------------------------------------------------------------------
            // УКАЖИТЕ ТРЕБУЕМОЕ КОЛ-ВО АККАУНТОВ ДЛЯ СБОРА
            // Если указать 0 (ноль) - соберет все аккаунты, по умолчанию стоит 700, свыше возможны
            // ограничения - лимиты самого Instagram (ошибка 429)
            // ----------------------------------------------------------------------------------
            var user_count = 700;
            // ----------------------------------------------------------------------------------
            // ДЛЯ СБОРА ИМЕН АККАУНТОВ УКАЖИТЕ true ВМЕСТО false
            // ----------------------------------------------------------------------------------
            var user_name = false; // true
            // ----------------------------------------------------------------------------------
            // Выборка кол-ва подписчиков и подписок по языку RU-EN
            // Классы расположены на главной странице Подписчики-Подписки
            // ----------------------------------------------------------------------------------
            var titleH1 = await page.evaluate(x => {
                let element = document.querySelector(x);
                return Promise.resolve(element ? element.innerHTML : '');
            }, ".m82CD");
            console.log(`INTERACTING WITH Followers Title:` + titleH1);

            //var titleH1 = document.getElementsByClassName("m82CD")[0]; // класс тега h1 заголовка окна "Подписки"

            //var titleDIV = titleH1.getElementsByTagName("div")[0]; // тег div заголовка
            var title = titleH1.innerHTML;
            // ----------------------------------------------------------------------------------
            // УСЛОВИЕ ВЫБОРА ПОДПИСЧИКИ ИЛИ ПОДПИСКИ
            // ----------------------------------------------------------------------------------
            if (title == "Подписчики" || title == "Followers") {
                // var total_count = document.getElementsByClassName("Y8-fY")[1].innerHTML;

                var total_count = await page.evaluate(x => {
                    let element = document.getElementsByClassName(x)[1]; //<a class="-nal3 " href="/n0wadayyy/following/" tabindex="0"><span class="g47SY ">281</span> подписок</a>
                    return Promise.resolve(element ? element.innerHTML : '');
                }, "Y8-fY");

                console.log(`INTERACTING WITH Total Count Followers:` + total_count);

            } else {
                // var total_count = document.getElementsByClassName("Y8-fY")[2].innerHTML;

                var total_count1 = await page.evaluate(x => {
                    let element = document.getElementsByClassName(x)[2];
                    return Promise.resolve(element ? element.innerHTML : '');
                }, "Y8-fY");

                // var total_count1 = await page.$eval(".Y8-fY", node => node.innerHTML);

                // Нужно достать элемент innerHTML внутри total_count который равен 281
                ///"a.-nal3 > span.g47SY"
                //<a class="-nal3 " href="/n0wadayyy/following/" tabindex="0"><span class="g47SY ">281</span> подписок</a>


                console.log(`INTERACTING WITH Total Count Followers 2: ` + total_count1);
            }
            // ----------------------------------------------------------------------------------
            // Общее кол-во аккаунтов для сбора
            // ----------------------------------------------------------------------------------
            // total_count = total_count.match(/[^"]+/g).join('').match(/[^\s]+/g).join('').match(/[^,]+/g).join('');
            let firstvariable = "class=\"g47SY \">";
            let secondvariable = "</span>"
            total_count1 = total_count1.match(new RegExp(firstvariable + "(.*)" + secondvariable));
            var total_count = total_count1[1];
            // ----------------------------------------------------------------------------------
            console.log('%cОбщее кол-во аккаунтов для сбора: ' + total_count + ' шт.', 'color: #13a555; font-size:16px;');

            // ----------------------------------------------------------------------------------
            if (user_count != 0) {
                console.log('%cКол-во заданное пользователем: ' + user_count + ' шт.', 'color: #13a555; font-size:16px;');
            }
            // ----------------------------------------------------------------------------------
            console.log('%cНачался сбор данных, дождитесь выполнения...', 'color: #13a555; font-size:16px;');

            // ----------------------------------------------------------------------------------
            // СТАРТ РАБОТЫ СКРОЛЛИНГА + СБОР ДАННЫХ
            // ----------------------------------------------------------------------------------
            // run_scrolling();
            await run_scrolling(page);
            // ----------------------------------------------------------------------------------
            // ----------------------------------------------------------------------------------
            // ФУНКЦИЯ СБОРА ДАННЫХ
            // ----------------------------------------------------------------------------------
            async function start_parsing(page) {
                // var accounts = ul_accounts[0].innerHTML;

                var accounts = await page.$eval(ul_accounts, node => node.innerHTML);
                // console.log(`INTERACTING WITH ul_accounts:` + accounts);
                // ------------------------------------------------------------------------------
                // Разбор ников аккаунтов
                // ------------------------------------------------------------------------------
                var result_nick = accounts.match(/title="[^"]+"/g);
                result_nick.splice(user_count);
                var result_count = result_nick.length;
                if (result_nick != 'Подтвержденный' && result_nick != 'Verified') {
                    result_nick = result_nick.join(' ').match(/"[^"]+"/g).join(' ').match(/[^"]+/g).join('').match(/[^\s]+/g).join('\n');
                }
                // ------------------------------------------------------------------------------
                // Разбор аватаров аккаунтов
                // ------------------------------------------------------------------------------
                var result_avatar = accounts.match(/src="[^"]+"/g);
                result_avatar.splice(user_count);
                result_avatar = result_avatar.join(' ').match(/"[^"]+"/g).join(' ').match(/[^"]+/g).join('').match(/[^\s]+/g).join('\n');
                // ------------------------------------------------------------------------------
                // Разбор имен аккаунтов
                // ------------------------------------------------------------------------------
                if (user_name == true) {
                    var result_name = accounts.match(/<div class="wFPL8 ">[^<]+/g)
                    result_name.splice(user_count);
                    result_nick = result_nick.match(/[^\n]+/g);
                    result_name = result_name.join('').match(/>[^<]+/g).join('').match(/[^>]+/g).join('\n');

                    result_name = result_name.match(/[^\n]+/g);
                    // --------------------------------------------------------------------------
                    // Создаем ассоциативный массив и преобразовываем в строку
                    // --------------------------------------------------------------------------
                    var result_nick_name = {};
                    for (var i = 0; i < result_nick.length; i++) {
                        result_nick_name[result_nick[i]] = result_name[i];
                    }
                    result_nick_name = JSON.stringify(result_nick_name);
                    result_nick_name = result_nick_name.match(/[^{}"]+/g).join('').match(/[^,]+/g).join('\n').match(/[^:]+/g).join(' : ');
                }
                if (user_name == true) {
                    console.log(result_nick_name);
                    //Добавить в окошко /БД
                    return result_nick_name;
                } else {
                    // console.log(result_nick);
                    // console.log(result_avatar);

                    // Followers.setFollowed(result_nick);


                    setAcc(result_nick);
                    instaAccString = result_nick;
                    //passResults(result_nick);

                    //Добавить в окошко /БД
                    // return result_nick;

                    const sql = "SELECT userid FROM givaway.mainusers WHERE username = ?";
                    const data = instaNick;
                    connection.query(sql, data, function(err, results) {
                        if (err) console.log(err);

                        if (results) { //Если есть такой юзер
                            console.log("ID аккаунта организатора: " + results[0].userid);
                            //Вставляем
                            const accString = result_nick;
                            var separator = '\n';
                            var arrayOfStrings = accString.split(separator);
                            //Для каждого элемента строки с разделителем пробел
                            var i;
                            for (i = 0; i < arrayOfStrings.length; i++) {
                                var nick = arrayOfStrings[i];
                                console.log("Parse: " + nick + '\n');
                                // Проверка на пустое и на "Подтвержденный"
                                if (nick && nick != "Подтвержденный" && nick != "Verified") { //если не пустая, двойная проверка
                                    const sql = "INSERT INTO givaway.Follow (usernameFollower, followedid, linkFollower) VALUES (?, ?, ?) ";
                                    var instalink = "https://instagram.com/";
                                    var link = instalink + nick;
                                    const data = [nick, results[0].userid, link];
                                    // connection.connect();
                                    connection.query(sql, data, function(err, results) {
                                        if (err) console.log(err);
                                        // console.log(results);
                                    });
                                }
                            }
                            console.log("Подписчики успешно добавлены в БД");
                        }
                    });



                }
                console.log('%cАккаунтов собрано: ' + result_count + ' шт.', 'color: #13a555; font-size:18px;');
                //console.log('Аватары: '+result_avatar); //В БД
                return instaAccString;


                // console.log('%cВыделите собранные имена аккаунтов выше и нажмите CTRL-C, чтобы скопировать.', 'color: #13a555; font-size:16px;');

            }
            // ----------------------------------------------------------------------------------
            // ФУНКЦИЯ СКРОЛЛИНГА
            // ----------------------------------------------------------------------------------

            async function run_scrolling(page) {

                // Определяем размер (высоту) прокрутки div_accounts
                var div_accounts_height = await page.$eval(div_accounts,
                    e => {
                        return e.scrollHeight
                    }
                )
                console.log(`INTERACTING WITH div_accounts_height:` + div_accounts_height);

                // Заносим размеры в массив
                height_scrolling.push(div_accounts_height);
                // Если пользовательское значение больше реального или установлен 0, то собрать все аккаунты 
                if (user_count >= total_count || user_count == 0) {
                    user_count = total_count;
                }
                if ((li_accounts.length != total_count) && (user_count > li_accounts.length) && (height_scrolling[0] != height_scrolling[4])) {
                    // Скроллим
                    await page.$eval(div_accounts,
                            e => {
                                return e.scrollBy(0, 500)
                            }
                        )
                        //  Если в массиве размеров скроллинга более 5 элементов, обнуляем
                    if (height_scrolling.length == 5) {
                        height_scrolling = [];
                    }
                    var timeoutID = setTimeout(run_scrolling, speed_scrolling, page);
                } else {
                    var page2pass = page;
                    clearTimeout(timeoutID);
                    accountsString = await start_parsing(page2pass);
                    console.log("---------------Accounts:------------" + "\n" + accountsString);

                    // if (accountsString) parsed = true;

                    //Получить id по нику, если ID есть - > Добавить в БД


                }
                return false;
                //return accountsString;
                // } catch (e) { console.log(e.message); }
            }
            //console.log("---------------NEW------------" + "\n" + accountsString);
            //return accountsString;

        } catch (e) {
            console.log('%cНажмите на странице Instagram на Подписчиков или Подписки, и запустите заново скрипт', 'color: #a22e1c; font-size:18px;' + '\n' + e.message);
        }
    }

    async parseAvatar(userNickName) {
        var avatar = await this.page.$eval(this.config.selectors.avatar_span, node => node.innerHTML);

        // this.config.selectors.avatar_span;
        // this.config.selectors.avatar;
        // ------------------------------------------------------------------------------
        // Разбор аватаров аккаунтов
        // ------------------------------------------------------------------------------
        var result_avatar = avatar.match(/src="[^"]+"/g);
        //src="https://scontent-arn2-1.cdninstagram.com/v/t51.2885-19/s150x150/106212193_290471092311333_7334423558466710724_n.jpg?_nc_ht=scontent-arn2-1.cdninstagram.com&amp;_nc_ohc=11Kn5_-9ilQAX8UPXWM&amp;oh=282980cbbbe8bf55494f06eb144c4584&amp;oe=5F2E24BF"
        // result_avatar.splice(user_count);
        // result_avatar = result_avatar.join(' ').match(/"[^"]+"/g).join(' ').match(/[^"]+/g).join('').match(/[^\s]+/g).join('\n');

        //Delete src=" "
        //var ret = result_avatar.replace('src="','');
        var new_result_avatar = result_avatar.toString().replace('src=\"', '');
        new_result_avatar = new_result_avatar.replace('\"', '');
        //UPDATE AVATAR IN SQL
        const sql = "UPDATE givaway.mainusers SET avatar= ? WHERE username = ?";
        const data = [new_result_avatar, userNickName];
        connection.query(sql, data, function(err, results) {
            if (err) console.log(err);
        });
    }

    async visitHashtagUrl() {
        const shuffle = require('shuffle-array');
        let hashTags = shuffle(this.config.hashTags);
        // loop through hashTags
        for (let tagIndex = 0; tagIndex < hashTags.length; tagIndex++) {
            console.log('<<<< Currently Exploring >>>> #' + hashTags[tagIndex]);
            //visit the hash tag url
            await this.page.goto(`${this.config.base_url}/explore/tags/` + hashTags[tagIndex] + '/?hl=en');
            // Loop through the latest 9 posts
            await this._doPostLikeAndFollow(this.config.selectors.hash_tags_base_class, this.page)
        }
    }

    async _doPostLikeAndFollow(parentClass, page) {

        for (let r = 1; r < 4; r++) { //loops through each row
            for (let c = 1; c < 4; c++) { //loops through each item in the row

                let br = false;
                //Try to select post
                await page.click(`${parentClass} > div > div > .Nnq7C:nth-child(${r}) > .v1Nh3:nth-child(${c}) > a`)
                    .catch((e) => {
                        console.log(e.message);
                        br = true;
                    });
                await page.waitFor(2250 + Math.floor(Math.random() * 250)); //wait for random amount of time
                if (br) continue; //if successfully selecting post continue

                //get the current post like status by checking if the selector exist
                let hasEmptyHeart = await page.$(this.config.selectors.post_heart_grey);

                //get the username of the current post
                let username = await page.evaluate(x => {
                    let element = document.querySelector(x);
                    return Promise.resolve(element ? element.innerHTML : '');
                }, this.config.selectors.post_username);
                console.log(`INTERACTING WITH ${username}'s POST`);


                //like the post if not already liked. Check against our like ratio so we don't just like all post
                if (hasEmptyHeart !== null && Math.random() < this.config.settings.like_ratio) {
                    await page.click(this.config.selectors.post_like_button); //click the like button
                    await page.waitFor(10000 + Math.floor(Math.random() * 5000)); // wait for random amount of time.
                }

                //let's check from our archive if we've follow this user before
                let isArchivedUser = null;
                await this.firebase_db.inHistory(username).then(data => isArchivedUser = data)
                    .catch(() => isArchivedUser = false);

                //get the current status of the current user using the text content of the follow button selector
                let followStatus = await page.evaluate(x => {
                    let element = document.querySelector(x);
                    return Promise.resolve(element ? element.innerHTML : '');
                }, this.config.selectors.post_follow_link);

                console.log("followStatus", followStatus);
                //If the text content of followStatus selector is Follow and we have not follow this user before
                // Save his name in the list of user we now follow and follow him, else log that we already follow him
                // or show any possible error
                if (followStatus === 'Follow' && !isArchivedUser) {
                    await this.firebase_db.addFollowing(username).then(() => {
                        return page.click(this.config.selectors.post_follow_link);
                    }).then(() => {
                        console.log('<<< STARTED FOLLOWING >>> ' + username);
                        return page.waitFor(10000 + Math.floor(Math.random() * 5000));
                    }).catch((e) => {
                        console.log('<<< ALREADY FOLLOWING >>> ' + username);
                        console.log('<<< POSSIBLE ERROR >>>' + username + ':' + e.message);
                    });
                }

                //Closing the current post modal
                await page.click(this.config.selectors.post_close_button)
                    .catch((e) => console.log('<<< ERROR CLOSING POST >>> ' + e.message));
                //Wait for random amount of time
                await page.waitFor(2250 + Math.floor(Math.random() * 250));
            }
        }
    };

    async unFollowUsers() {
        let date_range = new Date().getTime() - (this.config.settings.unfollow_after_days * 86400000);

        // get the list of users we are currently following
        let following = await this.firebase_db.getFollowings();
        let users_to_unfollow = [];
        if (following) {
            const all_users = Object.keys(following);
            // filter our current following to get users we've been following since day specified in config
            users_to_unfollow = all_users.filter(user => following[user].added < date_range);
        }

        if (users_to_unfollow.length) {
            for (let n = 0; n < users_to_unfollow.length; n++) {
                let user = users_to_unfollow[n];
                await this.page.goto(`${this.config.base_url}/${user}/?hl=en`);
                await this.page.waitFor(1500 + Math.floor(Math.random() * 500));

                let followStatus = await this.page.evaluate(x => {
                    let element = document.querySelector(x);
                    return Promise.resolve(element ? element.innerHTML : '');
                }, this.config.selectors.user_unfollow_button);

                if (followStatus === 'Following') {
                    console.log('<<< UNFOLLOW USER >>>' + user);
                    //click on unfollow button
                    await this.page.click(this.config.selectors.user_unfollow_button);
                    //wait for a sec
                    await this.page.waitFor(1000);
                    //confirm unfollow user
                    await this.page.click(this.config.selectors.user_unfollow_confirm_button);
                    //wait for random amount of time
                    await this.page.waitFor(20000 + Math.floor(Math.random() * 5000));
                    //save user to following history
                    await this.firebase_db.unFollow(user);
                } else {
                    //save user to our following history
                    this.firebase_db.unFollow(user);
                }
            }

        }
    }

    async closeBrowser() {
        await this.browser.close();
    }

    // async setAcc(acc) {
    //     instaAccString = acc;
    // }

    // async getAcc() { instaAccString };

}

const setAcc = acc => {
    instaAccString = acc;
}

const getAcc = () => { return instaAccString; };

// module.exports.result_nick;
module.exports = { instaAccString };

module.exports = InstagramBot;

// var Followers = module.exports = {
//     InstagramBot,
//     setFollowed: function(acc) {
//         instaAccString = acc;
//     },
//     getFollowed: function() {
//         return instaAccString;
//     }
// }
// class InstagramBot{
//     constructor(instaAccString) {
//         this.instaAccString = instaAccString;
//     }
//     accs(){
//         return this.instaAccString;
//     }
// };