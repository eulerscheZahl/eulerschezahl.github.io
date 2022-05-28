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
        contests = data
        listContests()
        updateLeaderboards()
    })

function toggle(index) {
    contests[index].tcoRelevant = !contests[index].tcoRelevant
    updateLeaderboards()
}

function listContests() {
    var tbody = $('#contestBody')
    for (let contest of contests) {
        let index = contests.indexOf(contest)
        var tr = $(`<tr id="row-${contest.id}"/>`).appendTo(tbody)
        tr.append(`<td><a href="https://www.topcoder.com/challenges/${contest.id}">${contest.name}</a></td>`)
        tr.append(`<td>${contest.submissionStartDate.toISOString().slice(0, 10)}</td>`)
        tr.append(`<td>${contest.submissionEndDate.toISOString().slice(0, 10)}</td>`)
        tr.append(`<td>${contest.stage}</td>`)
        tr.append(`<td><input type="checkbox" ${contest.tcoRelevant ? "checked" : ""} onchange="toggle(${index})"/></td>`)
        tr.append(`<td><a href="#" class="btn btn-primary btn-sm ${contest.leaderboard.length > 0 ? "" : "disabled"}" id="btn-${contest.id}" onclick="show('${contest.id}')">show</a></td>`)
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
    table.append('<thead><tr><th>Rank</th><th>Player</th><th>Score</th><th>TCO Points</th></tr></thead><tbody>')
    var players = contest.leaderboard
    players.sort((a, b) => b.score - a.score)
    for (let p of players) {
        table.append(`<tr><td>${1 + players.filter(pl => pl.score > p.score).length}</td><td>${p.name}</td><td>${p.score}</td><td>${p.TCO}</td></tr>`)
    }
    table.append('</tbody>')
    table.insertAfter(tr)
}

function updateLeaderboards() {
    if (contests.filter(c => c.leaderboard == null).length > 0) return
    var leaderboards = $('#leaderboards')
    leaderboards.empty()
    finalists = []
    for (let stage = 1; stage <= 4; stage++) {
        var stagePoints = {}
        var stagePointsSingle = {}
        for (let r of contests.filter(c => c.leaderboard != null && c.tcoRelevant && c.stage == stage)) {
            for (let player of r.leaderboard) {
                player.TCO = finalists.includes(player.name) ? '(qualified)' : 0
                if (finalists.includes(player.name) || player.score <= 0) continue
                rank = r.leaderboard.filter(p => !finalists.includes(p.name) && p.score > player.score).length
                player.TCO = [100, 75, 60, 50, 45, 40, 36, 32, 29, 26, 24, 22, 20, 18, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1][rank] || 1
                stagePoints[player.name] = player.TCO + (stagePoints[player.name] || 0)
                stagePointsSingle[player.name] = stagePointsSingle[player.name] || []
                stagePointsSingle[player.name].push({ contest: r.name, points: player.TCO })
            }
        }
        var players = Object.keys(stagePoints).map(key => ({ player: key, points: stagePoints[key] }))
        players.sort((a, b) => b.points - a.points)

        var table = '<table class="table table-striped"><thead><tr><th>Rank</th><th>Player</th><th>Points</th></tr></thead><tbody>'
        var rank = 1
        for (const player of players) {
            tooltip = `<b>${player.player}</b>`
            for (let c of stagePointsSingle[player.player]) tooltip += `</br>${c.contest}: <b>${c.points}</b>`
            table += `<tr data-bs-placement="bottom" data-bs-toggle="tooltip" data-bs-html="true" title="${tooltip}"><td>${1+players.filter(p => p.points > player.points).length}</td><td>${player.player}</td><td>${player.points}</td></tr>`
            if (rank <= 3) finalists.push(player.player)
            rank++
        }
        table += '</tbody></table>'
        leaderboards.append(`<div class="col col-sm-6 col-lg-3"><h3>Stage ${stage}</h3>${table}</div>`)
    }

    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    })
}