const fs = require('fs');

const filename = 'points.json'

var getPoints = function() {
    return JSON.parse(fs.readFileSync(filename))
}

var setPoints = function(points) {
    fs.writeFileSync(filename, JSON.stringify(points));
}

var addNewUsers = function(userIDs) {
    var points = getPoints()
    userIDs.forEach(userID => {
        var userFound = false;
        points.people.forEach(person => {
            if (userID.toString() === person.username) {
                userFound = true;
            }
        })
        if (!userFound) {
            points.people.push({
                username: userID.toString(),
                points: 0,
                win: 0,
                loss: 0,
                spent: 0,
                gamesWon: 0,
                gamesLost: 0
            })
        }
    })
}

var getUser = function(userID) {
    const points = getPoints();
    console.log(userID.toString())
    return points.people.find(person => person.username === userID.toString())
}

var getTop = function(n) {
    const points = getPoints();
    var sortedPeople = points.people.sort((a, b) => {
        if (a.points > b.points) {
            return -1;
        } else if (a.points === b.points) {
            return 0;
        } else {
            return 1;
        }
    })
    return sortedPeople.splice(0, n);
}

var addPoints = function(userID, amount, win = null, gameWon = null, spent = false) {
    var points = getPoints();
    const userIndex = points.people.findIndex(person => person.username === userID.toString())
    points.people[userIndex].points = points.people[userIndex].points + amount;
    if (win === true) {
        points.people[userIndex].win = points.people[userIndex].win + Math.abs(amount);
    } else if (win === false) {
        points.people[userIndex].loss = points.people[userIndex].loss + Math.abs(amount);
    }
    if (gameWon === true) {
        points.people[userIndex].gamesWon = points.people[userIndex].gamesWon + 1
    } else if (gameWon === false) {
        points.people[userIndex].gamesLost = points.people[userIndex].gamesLost + 1
    }
    if (spent === true) {
        points.people[userIndex].spent = points.people[userIndex].spent + Math.abs(amount);
    }
    setPoints(points);
    
}

var getPersonCount = function() {
    const points = getPoints();
    return points.people.length;
}

module.exports = {
    getUser: getUser,
    addNewUsers: addNewUsers,
    addPoints: addPoints,
    getTop: getTop,
    getPersonCount: getPersonCount
}