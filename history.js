const addHistory = function addHistoryFun (session, query) {
    const history_arr = session.userData.history || [];
    history_arr.push(query);
    session.userData.history = history_arr.slice(-10);
}

const getHistory = function getHistoryFun (session) {
    const historys = session.userData.history;
    if (historys) {
        return historys.slice().reverse().map(history => {
            const decodeHistory = decodeURI(history);
            return {
                content_type: "text",
                title: decodeHistory,
                payload: decodeHistory
            }
        });
    } else {
        return false;
    }
}

module.exports = {
    add: addHistory,
    get: getHistory
}