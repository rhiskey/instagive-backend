//ig-bot/Bot/index.js

class InstagramBot {

    constructor() {
        var config = {
            base_url: "https://www.instagram.com",
            username: "memebukket",
            password: "654321meme123",
            hashTags: ["instagive", "раздачи", "giveaway"],
            settings: {
                run_every_x_hours: 3,
                like_ratio: 0.75,
                unfollow_after_days: 2,
                headless: false
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
                hash_tags_base_class: ".EZdmt",
                div_accounts: ".isgrP",
                ul_accounts: ".jSC57  _6xe7A",
                li_accounts: ".PZuss"
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
            args: ['--no-sandbox'],
        });
        this.page = await this.browser.newPage();
        this.page.setViewport({ width: 1500, height: 764 });
    }

    async visitInstagram() {
        await this.page.goto(this.config.base_url, { timeout: 60000 });
        await this.page.waitFor(2500);

        //Register
        // await this.page.click(this.config.selectors.home_to_login_button);
        // await this.page.waitFor(2500);

        /* Click on the username field using the field selector*/
        await this.page.click(this.config.selectors.username_field);
        await this.page.keyboard.type(this.config.username);
        await this.page.click(this.config.selectors.password_field);
        await this.page.keyboard.type(this.config.password);
        await this.page.click(this.config.selectors.login_button);
        await this.page.waitForNavigation();
        //Close Turn On Notification modal after login
        await this.page.click(this.config.selectors.not_now_button);
        await this.page.waitFor(2500);
    }

    async visitFollowedUrl(instagramNickname) {
        console.log('<<<< Currently Exploring >>>> ' + instagramNickname);
        //https://www.instagram.com/username/following/
        await this.page.goto(`${this.config.base_url}/` + instagramNickname);
        await this.page.waitFor(2500);
        // Жмём на кнопку "Подписок"
        await this.page.click(this.config.selectors.user_followed_button);
        // await this.page.goto(`${this.config.base_url}/` + instagramNickname + '/following/');
        await this.page.waitFor(2500);
        // Листать вниз и парсить подписоту
        await this._doScrollFollowingParsing(this.config.selectors.div_accounts, this.config.selectors.ul_accounts, this.config.selectors.li_accounts, this.page)
        await this.page.waitFor(2000);
        //await this._doScrollFollowingParsing(this.config.selectors.div_accounts, this.page)
    }

    async _doScrollFollowingParsing(p_div_accounts, p_ul_accounts, p_li_accounts, page) {
        try {
            // ОБЪЯВЛЕНИЕ ПЕРЕМЕННЫХ
            var div_accounts = p_div_accounts; // класс тега div списка аккаунтов
            var ul_accounts = p_ul_accounts; // класс тега ul списка аккаунтов
            //var li_accounts = document.getElementsByClassName("wo9IH"); // класс тега li списка тег аккаунтов
            var li_accounts = p_li_accounts;
            var height_scrolling = []; // массив размеров (высот) скроллинга
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

            // var titleH1 = document.getElementsByClassName("m82CD")[0]; // класс тега h1 заголовка окна "Подписки"

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

                // let total_count = await page.evaluate(() =>
                //     document.querySelectorAll("Y8-fY")[2].innerHTML
                // );

                var total_count1 = await page.evaluate(x => {
                    let element = document.getElementsByClassName(x)[2]; //<a class="-nal3 " href="/n0wadayyy/following/" tabindex="0"><span class="g47SY ">281</span> подписок</a>
                    return Promise.resolve(element ? element.innerHTML : '');
                }, "Y8-fY");
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
            // run_scrolling(total_count, page, speed_scrolling, user_count, user_name, div_accounts, ul_accounts, li_accounts);
            await run_scrolling(page);
            // ----------------------------------------------------------------------------------
            // ----------------------------------------------------------------------------------
            // ФУНКЦИЯ СБОРА ДАННЫХ
            // ----------------------------------------------------------------------------------
            async function start_parsing(page) {

                var accounts = await page.evaluate(x => {
                    let element = document.querySelector(x)[0];
                    return Promise.resolve(element ? element.innerHTML : '');
                }, ul_accounts);
                console.log(`INTERACTING WITH ul_accounts:` + accounts);

                // var accounts = ul_accounts[0].innerHTML;

                // ------------------------------------------------------------------------------
                // Разбор ников аккаунтов
                // ------------------------------------------------------------------------------
                var result_nick = accounts.match(/title="[^"]+"/g);
                result_nick.splice(user_count);
                var result_count = result_nick.length;
                if (result_nick != 'Подтвержденный') {
                    result_nick = result_nick.join(' ').match(/"[^"]+"/g).join(' ').match(/[^"]+/g).join('').match(/[^\s]+/g).join('\n');
                }
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
                } else {
                    console.log(result_nick);
                }
                console.log('%cАккаунтов собрано: ' + result_count + ' шт.', 'color: #13a555; font-size:18px;');
                console.log('%cВыделите собранные имена аккаунтов выше и нажмите CTRL-C, чтобы скопировать.', 'color: #13a555; font-size:16px;');

            }
            // ----------------------------------------------------------------------------------
            // ФУНКЦИЯ СКРОЛЛИНГА
            // ----------------------------------------------------------------------------------
            async function run_scrolling(page) {

                // await page.evaluate(async (div_accounts)=> {
                //     await new Promise((resolve,reject) => {
                //         var div_accounts_height = div_accounts[0].scrollHeight;
                //         resolve();
                //     })
                // })
                // let items = [];
                // // var previousHeight = await page.evaluate('document.page.scrollHeight');   

                // var div_accounts_height = await page.evaluate((div_accounts) => {
                //     const container = document.querySelector(div_accounts);
                //     // container.scrollTo(0, container.scrollHeight);
                //     // let scroll_height = document.body.scrollHeight;
                //     let div_accounts_height = container.scrollHeight;
                //     return div_accounts_height;
                // });

                // var div_accounts_height = await page.evaluate(e => e.scrollHeight, div_accounts)


                // Определяем размер (высоту) прокрутки div_accounts
                // var div_accounts_height = div_accounts[0].scrollHeight;

                try {
                    var div_accounts_height = await page.evaluate(x => {
                        let element = document.querySelector(x)[0];
                        return Promise.resolve(element ? element.scrollHeight : '');
                    }, div_accounts).then(height => { return height } );

                    // div_accounts_height.then(function (value) {
                    //     console.log(value);
                    // }, function (value) { });

                    console.log(`INTERACTING WITH div_accounts_height:` + div_accounts_height);

                    // Заносим размеры в массив
                    height_scrolling.push(div_accounts_height);
                    // Если пользовательское значение больше реального или установлен 0, то собрать все аккаунты 
                    if (user_count >= total_count || user_count == 0) {
                        user_count = total_count;
                    }
                    if ((li_accounts.length != total_count) && (user_count > li_accounts.length) && (height_scrolling[0] != height_scrolling[4])) {

                        var div_accounts_scroll = await page.evaluate(x => {
                            let element = document.querySelector(x)[0];
                            return Promise.resolve(element ? element.scrollBy(0, 500) : '');
                        }, div_accounts);
                        console.log(`INTERACTING WITH div_accounts_scroll:` + div_accounts_scroll);

                        // div_accounts[0].scrollBy(0, 500); 

                        //  Если в массиве размеров скроллинга более 5 элементов, обнуляем
                        if (height_scrolling.length == 5) {
                            height_scrolling = [];
                        }
                        // UnhandledPromiseRejectionWarning: TypeError [ERR_INVALID_CALLBACK]: Callback must be a function. Received Promise { <pending> }
                        var timeoutID = setTimeout(run_scrolling(page), speed_scrolling);
                    } else {
                        clearTimeout(timeoutID);
                        await start_parsing(page);
                    }
                    return false;

                } catch (e) { console.log(e.message); }
            }

        } catch (e) {
            console.log('%cНажмите на странице Instagram на Подписчиков или Подписки, и запустите заново скрипт', 'color: #a22e1c; font-size:18px;');
        }
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

        for (let r = 1; r < 4; r++) {//loops through each row
            for (let c = 1; c < 4; c++) {//loops through each item in the row

                let br = false;
                //Try to select post
                await page.click(`${parentClass} > div > div > .Nnq7C:nth-child(${r}) > .v1Nh3:nth-child(${c}) > a`)
                    .catch((e) => {
                        console.log(e.message);
                        br = true;
                    });
                await page.waitFor(2250 + Math.floor(Math.random() * 250));//wait for random amount of time
                if (br) continue;//if successfully selecting post continue

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
                    await page.click(this.config.selectors.post_like_button);//click the like button
                    await page.waitFor(10000 + Math.floor(Math.random() * 5000));// wait for random amount of time.
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


}

module.exports = InstagramBot;