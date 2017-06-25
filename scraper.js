var builder = require('botbuilder');
var Xray = require('x-ray');
var OpenCC = require('opencc');

// set language conversion
var opencc = new OpenCC('s2twp.json');

const trimFilt = function trimFilter (value) {
  const stringArr = value.split("\n");
  return stringArr.map(string => string.trim()).join('');
}

const splitLine = function splitLine (value) {
  const stringArr = value.split("\n");
  return stringArr.map(string => string.trim()).filter(value => value);
}

const getSuggestion = function getSuggestion (suggestions) {
  return suggestions.slice(0, 3).map(suggest => {
    return {
      type: "postback",
      title: suggest,
      payload: suggest
    }
  });
}

var x = Xray({
  filters: {
    trimFilt: function (value) {
      return typeof value === 'string' ? opencc.convertSync(trimFilt(value)) : value;
    },
    splitLine : function (value) {
      return typeof value === 'string' ? opencc.convertSync(splitLine(value)) : value;
    }
  }
});

var scrape = function (session, query) {
    const url = "http://www.iciba.com/" + query;

    x(url, {
      keyword: '.keyword | trimFilt',
      kk: '.base-speak | trimFilt',
      chinese: '.switch_part | trimFilt',
      keyword2: '.in-base-top h1 | trimFilt',
      tranlate: '.in-base-top div | trimFilt',
      suggestion: '.sug-words | splitLine'
    })(function (err, obj) {
        const hasResult = obj.keyword || obj.keyword2;

        if (hasResult) {
          const msg = new builder.Message(session);
          
          const keyword = obj.keyword || obj.keyword2;
          const kk = obj.kk || '';
          const tranlate = obj.chinese || obj.tranlate;
          const text = `${keyword}\n - ${kk}\n - ${tranlate}`;

          msg.sourceEvent({
              facebook: {
                  attachment: {
                      type: "template",
                      payload: {
                          template_type: "button",
                          text: text,
                          buttons:[
                            {
                              type: "web_url",
                              url: url,
                              title: "詳細資料"
                            }
                          ]
                      }
                  }
              }
          });

          session.send(msg);
          session.send("還想查什麼嗎?");
          return false;
        } else if (obj.suggestion.length > 0) {
          const msg = new builder.Message(session);

          const suggestion = getSuggestion(obj.suggestion);

          msg.sourceEvent({
            facebook: {
              attachment: {
                type: "template",
                payload: {
                  template_type: "generic",
                  elements: [
                    {
                        title: "查不到耶，您要查的是不是：",
                        buttons: suggestion
                    }
                  ]
                }
              }
            }
          });

          session.send(msg);
          session.send("還想查什麼嗎?");
          return false;
        }

        session.send("抱歉查不到耶，還想查什麼嗎?");
    });
}

module.exports = {
    scrape: scrape
}