window.contests = null
$.getJSON("minified/contests.json")
    .done(function (data) {
        for (let contest of data) {
            contest.submissionStartDate = new Date(contest.submissionStartDate)
            contest.submissionEndDate = new Date(contest.submissionEndDate)
            contest.stage = 1
            if (contest.submissionStartDate.getUTCMonth() <= 2) contest.stage = 3
            else if (contest.submissionStartDate.getUTCMonth() >= 9) contest.stage = 2
            else if (contest.submissionStartDate.getUTCMonth() <= 5) contest.stage = 4

            $.getJSON("minified/" + contest.id + ".json")
                .done(function (data) {
                    contest.leaderboard = data
                    updateLeaderboards()
                })
        }
        contests = data
        listContests()
    })

function toggle(index) {
    contests[index].tcoRelevant = !contests[index].tcoRelevant
    updateLeaderboards()
}

function listContests() {
    var tbody = $('#contestBody')
    for (let contest of contests) {
        let index = contests.indexOf(contest)
        var tr = $('<tr/>').appendTo(tbody)
        tr.append('<td><a href="https://www.topcoder.com/challenges/' + contest.id + '">' + contest.name + '</a></td>')
        tr.append('<td>' + contest.submissionStartDate.toISOString().slice(0, 10) + '</td>')
        tr.append('<td>' + contest.submissionEndDate.toISOString().slice(0, 10) + '</td>')
        tr.append('<td>' + contest.stage + '</td>')
        tr.append('<td><input type="checkbox" ' + (contest.tcoRelevant ? "checked" : "") + ' onchange="toggle(' + index + ')" /></td>')
    }
}

function updateLeaderboards() {
    if (contests.filter(c => c.leaderboard == null).length > 0) return
    var leaderboards = $('#leaderboards')
    leaderboards.empty()
    finalists = []
    for (let stage = 1; stage <= 4; stage++) {
        var stageScores = {}
        var stageScoreSingle = {}
        for (let r of contests.filter(c => c.leaderboard != null && c.tcoRelevant && c.stage == stage)) {
            for (let player of r.leaderboard) {
                if (finalists.includes(player.name) || player.score <= 0) continue
                rank = r.leaderboard.filter(p => !finalists.includes(p.name) && p.score > player.score).length
                points = [100, 75, 60, 50, 45, 40, 36, 32, 29, 26, 24, 22, 20, 18, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1][rank] || 1
                stageScores[player.name] = points + (stageScores[player.name] || 0)
                stageScoreSingle[player.name] = stageScoreSingle[player.name] || []
                stageScoreSingle[player.name].push([r, points])
            }
        }
        var players = Object.keys(stageScores).map(key => [key, stageScores[key]])
        players.sort((a, b) => b[1] - a[1])

        var table = '<table class="table table-striped"><thead><tr><th>Rank</th><th>Player</th><th>Points</th></tr></thead><tbody>'
        var rank = 1
        for (const player of players) {
            tooltip = '<b>' + player[0] + '</b>'
            for (let c of stageScoreSingle[player[0]]) tooltip += '</br>' + c[0].name + ': <b>' + c[1] + '</b>'
            table += '<tr data-bs-placement="bottom" data-bs-toggle="tooltip" data-bs-html="true" title="' + tooltip + '"><td>' + rank + '</td><td>' + player[0] + '</td><td>' + player[1] + '</td></tr>'
            if (rank <= 3) finalists.push(player[0])
            rank++
        }
        table += '</tbody></table>'
        leaderboards.append('<div class="col col-sm-6 col-lg-3"><h3>Stage ' + stage + '</h3>' + table + '</div>')
    }

    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    })
}