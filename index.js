var restify = require('restify');
var builder = require('botbuilder');
var scraper = require('./scraper');
var history = require('./history');

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD,
			});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

var intents = new builder.IntentDialog();



//=========================================================
// Bots Dialogs
//=========================================================
bot.dialog('/', intents);

intents.onDefault('/noResult');

intents.matches(/^USER_DEFINED_PAYLOAD/i, '/firstUse');
intents.matches(/#history|\u6b77\u53f2\u7d00\u9304|\u6b77\u53f2/i, '/history');
intents.matches(/#clear/i, '/clear');
intents.matches(/.*/, '/query');


bot.dialog('/firstUse', function (session) {
    const string = "你好，請輸入英文或是中文我就會幫忙查詢囉！";
    session.send(string);
    session.endDialog();
});

bot.dialog('/noResult', function (session) {
    session.send('888888888');
    session.endDialog();
});

bot.dialog('/query', function (session) {
    if (session && session.message && session.message.text) {
        session.sendTyping();
        const query = encodeURI(session.message.text);
        scraper.scrape(session, query);
        history.add(session, query);
    } else {
        session.send('888888888');
    }
    session.endDialog();
});

bot.dialog('/history', function (session) {
    const historys = history.get(session);
    const message = new builder.Message(session);

    if (historys) {
        message.sourceEvent({ 
            facebook: { 
                text: "歷史紀錄:",
                quick_replies: historys
            }
        });
    } else {
        message.text("目前還沒有歷史紀錄唷！");
    }
        
    session.send(message);
    session.endDialog();
});

bot.dialog('/clear', function (session) {
    session.userData.history = '';
    session.send("成功刪除歷史紀錄！");
    session.endDialog();
});
