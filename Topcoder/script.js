window.contests = null
$.getJSON("contests.json")
    .done(function (data) {
        for (let contest of data) {
            contest.submissionStartDate = new Date(contest.submissionStartDate)
            contest.submissionEndDate = new Date(contest.submissionEndDate)
            contest.stage = 1
            if (contest.submissionStartDate.getUTCMonth() <= 2) contest.stage = 3
            else if (contest.submissionStartDate.getUTCMonth() >= 9) contest.stage = 2
            else if (contest.submissionStartDate.getUTCMonth() <= 5) contest.stage = 4
        }
        contests = data.filter(c => c.leaderboard.length > 0)
        listContests()
        updateLeaderboards()
    })

function listContests() {
    var tbody = $('#contestBody')
    for (let contest of contests) {
        let index = contests.indexOf(contest)
        var tr = $(`<tr id="row-${contest.id}"/>`).appendTo(tbody)
        tr.append(`<td><a href="https://www.topcoder.com/challenges/${contest.id}">${contest.name}</a></td>`)
        tr.append(`<td>${contest.submissionStartDate.toISOString().slice(0, 10)}</td>`)
        tr.append(`<td>${contest.submissionEndDate.toISOString().slice(0, 10)}</td>`)
        tr.append(`<td>${contest.stage}</td>`)
        let detailedStats = ''
        if (contest.detailedStats) detailedStats = `<a class="btn btn-primary btn-sm" target="_blank" href="${contest.detailedStats}">detailed</a>`
        tr.append(`<td><a href="#" class="btn btn-primary btn-sm ${contest.leaderboard.length > 0 ? "" : "disabled"}" id="btn-${contest.id}" onclick="show('${contest.id}')">show</a> ${detailedStats}</td>`)
    }
}

function show(id) {
    var contest = contests.filter(c => c.id == id)[0]
    console.log(contest)
    var btn = $('#btn-' + id)
    var tr = $('#row-' + id)
    if (btn.text() == 'hide') {
        btn.text('show')
        $('#table-' + id).remove()
        return
    }
    btn.text('hide')
    var table = $(`<table id="table-${id}" class="table table-striped m-3"/>`)
    table.append('<thead><tr><th>Rank</th><th>Player</th><th>Score</th><th>Provisional</th><th>TCO Points</th></tr></thead><tbody>')
    var players = contest.leaderboard
    players.sort((a, b) => estimateScore(b, contest) - estimateScore(a, contest))
    for (let p of players) {
        table.append(`<tr><td>${1 + players.filter(pl => pl.score > p.score).length}</td><td>${p.name}</td><td>${Math.round(p.score * 100000) / 100000}</td><td>${Math.round(p.provisional * 100000) / 100000}</td><td>${p.TCO}</td></tr>`)
    }
    table.append('</tbody>')
    table.insertAfter(tr)
}

function estimateScore(player, contest) {
    if (player.score != 1) return player.score

    factors = []
    for (let p of contest.leaderboard) {
        if (p.score > 1 && p.provisional > 1) factors.push(p.score / p.provisional)
    }
    return player.provisional * factors.reduce((a, b) => a + b) / factors.length
}

function updateLeaderboards() {
    if (contests.filter(c => c.leaderboard == null).length > 0) return
    var leaderboards = $('#leaderboards')
    leaderboards.empty()

    playerContests = {}
    for (let c of contests.filter(c => c.leaderboard != null)) {
        for (let player of c.leaderboard) {
            player.TCO = 0
            if (player.score <= 0) continue
            playerContests[player.name] = playerContests[player.name] || []
            rank = c.leaderboard.filter(p => estimateScore(p, c) > estimateScore(player, c)).length
            player.TCO = [100, 75, 60, 50, 45, 40, 36, 32, 29, 26, 24, 22, 20, 18, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 5, 5, 5, 5][rank] || 1
            playerContests[player.name].push({ contest: c.name, points: player.TCO, rank: rank, stage: c.stage })
        }
    }

    for (let stage = 0; stage <= 3; stage++) {
        var stagePointsSingle = {}
        var stagePoints = {}
        for (let playerName of Object.keys(playerContests)) {
            stagePointsSingle[playerName] = playerContests[playerName].filter(c => stage == 0 || stage == c.stage)
            let total = stagePointsSingle[playerName].map(c => c.points).reduce((a, b) => a + b, 0)
            if (total > 0) stagePoints[playerName] = total
        }
        var players = Object.keys(stagePoints).map(key => ({ player: key, points: stagePoints[key] }))
        players.sort((a, b) => b.points - a.points)

        var table = '<table class="table table-striped"><thead><tr><th>Rank</th><th>Player</th><th>Points</th></tr></thead><tbody>'
        var rank = 1
        for (const player of players) {
            tooltip = `<b>${player.player}</b>`
            for (let c of stagePointsSingle[player.player]) tooltip += `</br>${c.contest}: <b>${c.points}</b>`
            table += `<tr data-bs-placement="bottom" data-bs-toggle="tooltip" data-bs-html="true" title="${tooltip}"><td>${1 + players.filter(p => p.points > player.points).length}</td><td>${player.player}</td><td>${player.points}</td></tr>`
            rank++
        }
        table += '</tbody></table>'
        leaderboards.append(`<div class="col col-sm-6 col-lg-3"><h3>${stage == 0 ? "Overall" : "Stage " + stage}</h3>${table}</div>`)
    }

    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    })
}