(function () {
  'use strict';

  var L = window.VinciLogic;
  var evaluate = L.evaluate, multiple = L.multiple, geoMean = L.geoMean, verdict = L.verdict;
  var sig = L.sig, compact = L.compact, full = L.full, fmtMult = L.fmtMult;

  /* ---------- player identity and API ---------- */
  var PID_KEY = 'vinci-player-v1', memPid = null;
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    var b = crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
    var h = Array.prototype.map.call(b, function (x) { return (x < 16 ? '0' : '') + x.toString(16); }).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }
  function playerId() {
    try {
      var id = localStorage.getItem(PID_KEY);
      if (!id) { id = uuid(); localStorage.setItem(PID_KEY, id); }
      return id;
    } catch (e) { return memPid || (memPid = uuid()); }
  }
  function api(method, path, body) {
    var headers = { 'X-Player-Id': playerId() };
    if (body) headers['Content-Type'] = 'application/json';
    return fetch(path, { method: method, headers: headers, body: body ? JSON.stringify(body) : undefined }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) { var err = new Error(j.error || 'Request failed'); err.status = r.status; throw err; }
        return j;
      });
    });
  }

  /* ---------- storage ---------- */
  var KEY = 'napkin-ticker-v1';
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || { days: {} }; } catch (e) { return { days: {} }; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} }
  var store = load(); if (!store.days) store.days = {};

  /* ---------- date and state ---------- */
  var todayData = null, todayKey = '', dayNo = 1;

  var mode = 'daily', set, guesses, i, phase;
  function startDaily() {
    mode = 'daily';
    set = todayData.questions.map(function (q) {
      return { id: q.id, topic: q.topic, q: q.q, unit: q.unit, answer: todayData.answers[q.id] };
    });
    guesses = [];
    for (var k = 0; k < 3; k++) {
      var g = todayData.guesses[set[k].id];
      if (typeof g !== 'number' || !(g > 0)) break;
      guesses.push(g);
    }
    if (guesses.length >= 3) { i = 3; phase = 'done'; syncScore(); } else { i = guesses.length; phase = 'ask'; }
  }
  function startPractice() {
    return api('GET', '/api/practice').then(function (r) {
      mode = 'practice'; set = r.questions; guesses = []; i = 0; phase = 'ask';
    });
  }

  /* Records the finished day locally (for the personal record) and on the server. The server recomputes the score. */
  var scoreP = Promise.resolve();
  function syncScore() {
    var rec = store.days[todayKey] || {};
    if (typeof rec.score !== 'number') {
      rec.score = geoMean(guesses.map(function (g, k) { return multiple(g, set[k].answer); }));
      store.days[todayKey] = rec; save();
    }
    scoreP = api('POST', '/api/score', { puzzleNo: dayNo }).catch(function () {});
  }

  /* ---------- rendering ---------- */
  var elMeta = document.getElementById('meta'), elTape = document.getElementById('tape'), elStage = document.getElementById('stage');

  function renderMeta() {
    var d = new Date(todayKey + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
    elMeta.textContent = mode === 'daily' ? 'No. ' + String(dayNo).padStart(3, '0') + ' · ' + d : 'Practice set';
  }
  /* Answered cells are buttons that reopen that question's result. While looking back, the next unanswered cell returns to the live question. */
  function renderTape() {
    var html = '';
    for (var k = 0; k < 3; k++) {
      var cls = 'cell', val = '—', go = false;
      if (k < guesses.length) {
        var m = multiple(guesses[k], set[k].answer);
        cls += ' ' + verdict(m).cls; val = fmtMult(m); go = true;
      } else if (k === i && phase !== 'done') { cls += ' now'; val = 'now'; }
      else if (k === guesses.length) go = true;
      var inner = '<span class="lab">Q' + (k + 1) + '</span><span class="val">' + val + '</span>';
      html += go ? '<button type="button" class="' + cls + '" data-k="' + k + '" aria-label="Question ' + (k + 1) + '">' + inner + '</button>'
                 : '<div class="' + cls + '">' + inner + '</div>';
    }
    elTape.innerHTML = html;
  }

  var submitting = false;
  elTape.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-k]');
    if (!b || submitting) return;
    var k = +b.getAttribute('data-k');
    i = k; phase = k < guesses.length ? 'reveal' : 'ask';
    render(false); window.scrollTo(0, 0);
  });

  function cardHead(q, n) {
    return '<div class="card-head"><span class="chip">' + q.topic + '</span><span class="qno">Q' + n + ' / 3</span></div><h2 class="q">' + q.q + '</h2>';
  }

  function renderAsk(focus) {
    var q = set[i];
    elStage.innerHTML =
      '<section class="card">' + cardHead(q, i + 1) +
      '<form id="f" novalidate><div class="field"><label class="sr" for="guess">Your estimate</label>' +
      '<input id="guess" type="text" inputmode="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="your estimate">' +
      '<span class="unit">' + q.unit + '</span></div>' +
      '<output id="preview" class="preview" aria-live="polite"></output>' +
      '<div class="actions"><button type="submit" class="btn primary">Lock it in</button></div></form></section>';

    var input = document.getElementById('guess'), preview = document.getElementById('preview');
    var form = document.getElementById('f');

    function updatePreview() {
      var v = input.value.trim();
      preview.className = 'preview';
      if (!v) { preview.textContent = ''; return; }
      var n = evaluate(v);
      if (n === null) { preview.textContent = 'Keep typing. Try 2.5b or 8*365*1e6.'; preview.className = 'preview err'; return; }
      if (n <= 0) { preview.textContent = 'Use a number above zero.'; preview.className = 'preview err'; return; }
      preview.textContent = '= ' + compact(n);
    }
    input.addEventListener('input', updatePreview);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (submitting) return;
      var n = evaluate(input.value);
      if (n === null || n <= 0) { updatePreview(); if (!input.value.trim()) { preview.textContent = 'Enter a guess first.'; preview.className = 'preview err'; } input.focus(); return; }
      submitting = true;
      var q = set[i];
      // Practice guesses are never stored. Daily guesses go to the server, which returns the answer and keeps only the first guess.
      var sent = mode === 'daily' ? api('POST', '/api/guess', { puzzleNo: dayNo, questionId: q.id, guess: n }) : Promise.resolve({ guess: n, answer: q.answer });
      sent.then(function (res) {
        q.answer = res.answer;
        guesses.push(res.guess);
        if (mode === 'daily') {
          todayData.guesses[q.id] = res.guess; todayData.answers[q.id] = res.answer;
          if (guesses.length === 3) syncScore();
        }
        submitting = false;
        phase = 'reveal'; render(true);
      }, function (err) {
        submitting = false;
        preview.textContent = err.status === 409 ? 'Today’s puzzle has closed. Reload the page for the new one.' : 'Couldn’t save your guess. Check your connection and try again.';
        preview.className = 'preview err';
      });
    });

    if (focus) input.focus();
  }

  /* ---------- other players (shared db) ---------- */
  var cmp = {}; // questionId -> { state: 'loading' | 'on' | 'off', guesses: [] }

  function validNum(x) { return typeof x === 'number' && isFinite(x) && x > 0 && x < 1e21; }

  function loadOthers(qid) {
    cmp[qid] = { state: 'loading', guesses: [] };
    api('GET', '/api/distribution?questionId=' + encodeURIComponent(qid)).then(function (r) {
      cmp[qid] = { state: 'on', guesses: (r.guesses || []).filter(validNum) }; refreshCompare(false);
    }, function () { cmp[qid] = { state: 'off', guesses: [] }; refreshCompare(false); });
  }

  function cstate(q) { return cmp[q.id] ? cmp[q.id].state : 'loading'; }
  function othersFor(q) { return cstate(q) === 'on' ? cmp[q.id].guesses : []; }

  function shortNum(n) {
    var a = Math.abs(n), u = [[1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']];
    for (var k = 0; k < u.length; k++) if (a >= u[k][0]) return sig(n / u[k][0]) + u[k][1];
    return sig(n);
  }

  /* Typical guesses: how far off a typical player is, as a normal curve on the log10 error with spread REF_SIGMA (defined with the
     score graph below). It counts as REF_WEIGHT players and fades out as real guesses arrive. */
  function normCdf(x) { // Abramowitz and Stegun 7.1.26
    var t = 1 / (1 + 0.3275911 * Math.abs(x) / Math.SQRT2);
    var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x / 2);
    return x >= 0 ? (1 + y) / 2 : (1 - y) / 2;
  }

  /* Share of players (real guesses plus the typical curve) whose guess was further from the answer than yours. */
  function beatenShare(q, g) {
    var mine = multiple(g, q.answer), beaten = 0, others = othersFor(q);
    others.forEach(function (o) { var m = multiple(o, q.answer); if (m > mine) beaten += 1; else if (m === mine) beaten += 0.5; });
    beaten += REF_WEIGHT * 2 * (1 - normCdf(Math.log10(mine) / REF_SIGMA));
    return beaten / (others.length + REF_WEIGHT);
  }

  function rankHtml(q, g) {
    if (cstate(q) === 'loading') return 'Checking other players…';
    return 'Closer than <b>' + Math.round(100 * beatenShare(q, g)) + '%</b> of players';
  }

  function histHtml(q, g, anim) {
    var a = q.answer, you = Math.log10(g / a);
    var others = othersFor(q);
    var logs = others.map(function (o) { return Math.log10(o / a); });
    var far = Math.abs(you); logs.forEach(function (l) { far = Math.max(far, Math.abs(l)); });
    // At least 2 decades each side: any tighter and the typical curve's tails pile up into the two end bars.
    var span = Math.max(2, Math.min(3, Math.ceil(far - 1e-9)));
    function pos(l) { return (Math.max(-span, Math.min(span, l)) + span) / (2 * span); }
    var BINS = 21, counts = [], k;
    for (k = 0; k < BINS; k++) {
      var lo = k === 0 ? -Infinity : -span + k * 2 * span / BINS, hi = k === BINS - 1 ? Infinity : -span + (k + 1) * 2 * span / BINS;
      counts.push(REF_WEIGHT * (normCdf(hi / REF_SIGMA) - normCdf(lo / REF_SIGMA)));
    }
    logs.forEach(function (l) { counts[Math.min(BINS - 1, Math.floor(pos(l) * BINS))]++; });
    var max = Math.max.apply(null, counts), bars = '';
    for (k = 0; k < BINS; k++) {
      var hgt = max ? Math.max(counts[k] ? 8 : 0, counts[k] / max * 100) : 0;
      bars += '<span style="height:' + hgt.toFixed(1) + '%;animation-delay:' + (k * 18) + 'ms"></span>';
    }
    var yp = pos(you) * 100, tagp = Math.max(10, Math.min(90, yp));
    var cls = verdict(multiple(g, a)).cls;
    return '<h3 class="sec-h">How everyone guessed</h3>' +
      '<div class="plot ' + cls + '" role="img" aria-label="Histogram of players’ guesses on a log scale, with your guess and the answer marked">' +
      '<div class="bars' + (anim ? ' anim' : '') + '">' + bars + '</div>' +
      '<span class="ansline"></span>' +
      '<span class="youline" style="left:' + yp.toFixed(2) + '%"></span>' +
      '<span class="youtag" style="left:' + tagp.toFixed(2) + '%"><span>You</span></span></div>' +
      '<div class="axis"><span>' + shortNum(a / Math.pow(10, span)) + '</span><b>' + shortNum(a) + '<small>ANSWER</small></b><span>' + shortNum(a * Math.pow(10, span)) + '</span></div>';
  }

  function refreshCompare(anim) {
    if (phase !== 'reveal') return;
    var q = set[i], g = guesses[i], hist = document.getElementById('hist'), rank = document.getElementById('rank');
    if (hist) hist.innerHTML = histHtml(q, g, anim);
    if (rank) { var r = rankHtml(q, g); rank.innerHTML = r; rank.hidden = !r; }
  }

  function renderReveal() {
    var q = set[i], g = guesses[i], a = q.answer, m = multiple(g, a), v = verdict(m);
    var dir = m < 1.005 ? 'Spot on' : g < a ? 'Too low' : 'Too high';
    var last = i === 2;
    elStage.innerHTML =
      '<section class="card">' + cardHead(q, i + 1) +
      '<div class="result">' +
      '<div class="boxes">' +
      '<div class="box mine"><span class="k">You guessed</span><span class="v">' + compact(g) + '</span><span class="full">' + full(g) + '</span></div>' +
      '<div class="box truth"><span class="k">Answer</span><span class="v">' + compact(a) + '</span><span class="full">' + full(a) + '</span><span class="u">' + q.unit + '</span></div></div>' +
      '<div class="landing">' +
      '<div class="landed ' + v.cls + '"><h3 class="sec-h">You landed</h3><span class="mult">' + fmtMult(m) + '</span><span class="dir">' + dir + '</span><p class="rank" id="rank"></p></div>' +
      '<div class="hist" id="hist"></div></div>' +
      '<div class="bottom"><button type="button" class="btn primary" id="next">' + (last ? 'See my score →' : 'Question ' + (i + 2) + ' →') + '</button></div>' +
      '</div></section>';

    loadOthers(q.id);
    refreshCompare(true);
    var next = document.getElementById('next');
    next.addEventListener('click', function () {
      i++; phase = i < guesses.length ? 'reveal' : i >= 3 ? 'done' : 'ask'; render(true);
    });
    next.focus({ preventScroll: true });
  }

  function recordStats() {
    var scores = [];
    Object.keys(store.days).forEach(function (k) { var s = store.days[k].score; if (typeof s === 'number' && s >= 1) scores.push(s); });
    if (!scores.length) return null;
    return { played: scores.length, best: Math.min.apply(null, scores), avg: geoMean(scores) };
  }

  /* ---------- everyone's scores (daily only) ---------- */
  var board = { state: 'loading', scores: [], players: 0, rank: null };
  var SCORE_SPAN = 3; // x axis runs from 1x to 1,000x on a log scale
  var SCORE_BINS = 20;

  /* While there are few real players, the graph is blended with a modelled "typical" curve so it is never empty and the player
     still gets a sense of how good their score is. The model: each of a typical player's three guesses is off by a factor
     10^|N(0, REF_SIGMA)|, and their score is the geometric mean of those. REF_WEIGHT is how many real players it takes to
     match the model's influence. Both numbers are estimates: refit them from real scores once there are a few hundred. */
  var REF_SIGMA = 0.8, REF_WEIGHT = 30;
  var refCounts = null;

  function scoreBin(x) { return Math.min(SCORE_BINS - 1, Math.floor(Math.max(0, Math.min(1, Math.log10(Math.max(1, x)) / SCORE_SPAN)) * SCORE_BINS)); }

  function refHistogram() {
    if (refCounts) return refCounts;
    var a = 20261024, N = 4000, c = [], k, j;
    function rand() { // mulberry32, so the curve is identical for everyone
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
    function gauss() { return Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand()); }
    for (k = 0; k < SCORE_BINS; k++) c.push(0);
    for (j = 0; j < N; j++) {
      var s = 0; for (k = 0; k < 3; k++) s += Math.abs(gauss()) * REF_SIGMA;
      c[scoreBin(Math.pow(10, s / 3))]++;
    }
    refCounts = c.map(function (x) { return x / N * REF_WEIGHT; });
    return refCounts;
  }

  function loadBoard() {
    board = { state: 'loading', scores: [], players: 0, rank: null };
    scoreP.then(function () { return api('GET', '/api/leaderboard?puzzleNo=' + dayNo); }).then(function (r) {
      board = { state: 'on', scores: (r.scores || []).filter(validNum), players: r.players || 0, rank: r.rank };
      refreshBoard(false);
    }, function () { board.state = 'off'; refreshBoard(false); });
  }

  function boardHtml(score, anim) {
    var BINS = SCORE_BINS, counts = refHistogram().slice(), k;
    function pos(x) { return Math.max(0, Math.min(1, Math.log10(Math.max(1, x)) / SCORE_SPAN)); }
    if (board.state === 'on') board.scores.forEach(function (x) { counts[scoreBin(x)]++; });
    var max = Math.max.apply(null, counts), bars = '', total = 0, better = 0, mine = scoreBin(score);
    for (k = 0; k < BINS; k++) {
      var hgt = max ? Math.max(counts[k] ? 8 : 0, counts[k] / max * 100) : 0;
      bars += '<span style="height:' + hgt.toFixed(1) + '%;animation-delay:' + (k * 18) + 'ms"></span>';
      total += counts[k];
      if (k < mine) better += counts[k]; else if (k === mine) better += counts[k] / 2;
    }
    var yp = pos(score) * 100, tagp = Math.max(10, Math.min(90, yp));
    var top = Math.max(1, Math.min(100, Math.ceil(100 * better / total)));
    var chip = board.state === 'loading' ? '' : '<p class="rank-row"><span class="chip">TOP ' + top + '%</span></p>';
    return chip + '<h3 class="sec-h">How everyone did</h3>' +
      '<div class="plot ' + verdict(score).cls + '" role="img" aria-label="Histogram of all players’ scores today on a log scale, with your score marked">' +
      '<div class="bars' + (anim ? ' anim' : '') + '">' + bars + '</div>' +
      '<span class="youline" style="left:' + yp.toFixed(2) + '%"></span>' +
      '<span class="youtag" style="left:' + tagp.toFixed(2) + '%"><span>You</span></span></div>' +
      '<div class="axis four"><span>1×</span><span>10×</span><span>100×</span><span>1,000×</span></div>';
  }

  function refreshBoard(anim) {
    var el = document.getElementById('board');
    if (el && phase === 'done' && mode === 'daily') el.innerHTML = boardHtml(geoMean(guesses.map(function (g, k) { return multiple(g, set[k].answer); })), anim);
  }

  function renderDone() {
    var ms = guesses.map(function (g, k) { return multiple(g, set[k].answer); });
    var score = geoMean(ms), v = verdict(score);
    var rows = ms.map(function (m, k) {
      var q = set[k], g = guesses[k], vv = verdict(m);
      return '<li><span class="n">Q' + (k + 1) + '</span><span class="t">' + q.q + '<small>You ' + compact(g) + ' · Answer ' + compact(q.answer) + '</small></span>' +
        '<span class="m ' + vv.cls + '">' + fmtMult(m) + ' ' + (g < q.answer ? '↓' : '↑') + '</span></li>';
    }).join('');
    var rs = mode === 'daily' ? recordStats() : null;
    var recHtml = rs ? '<div class="record"><div><span class="k">Days played</span><span class="v">' + rs.played + '</span></div><div><span class="k">Best day</span><span class="v">' + fmtMult(rs.best) + '</span></div><div><span class="k">Average</span><span class="v">' + fmtMult(rs.avg) + '</span></div></div>' : '';
    var other = mode === 'daily' ? '<button type="button" class="btn ghost" id="practice">Play a practice set</button>' :
      '<button type="button" class="btn ghost" id="practice">Another practice set</button><button type="button" class="btn ghost" id="back">Back to today</button>';
    elStage.innerHTML =
      '<section class="card"><p class="eyebrow">' + (mode === 'daily' ? 'Today’s score' : 'Practice score') + '</p>' +
      '<div class="big ' + v.cls + '">' + (score < 10 ? score.toFixed(2) : score < 100 ? score.toFixed(1) : Math.round(score).toLocaleString('en-US')) + '<span>×</span></div>' +
      '<p class="rate-line">' + v.label + '. Geometric mean of your three misses.</p>' +
      '<ol class="rows">' + rows + '</ol>' +
      (mode === 'daily' ? '<div class="hist score-hist" id="board"></div>' : '') +
      recHtml + '<div class="actions">' + other + '<span class="status" id="status" role="status"></span></div></section>';

    if (mode === 'daily') { loadBoard(); refreshBoard(true); }

    document.getElementById('practice').addEventListener('click', function () {
      var btn = this, st = document.getElementById('status');
      btn.disabled = true;
      startPractice().then(function () { render(true); window.scrollTo(0, 0); }, function () {
        btn.disabled = false; st.textContent = 'Couldn’t load a practice set.'; st.style.color = 'var(--bad)';
      });
    });
    var back = document.getElementById('back');
    if (back) back.addEventListener('click', function () { startDaily(); render(false); window.scrollTo(0, 0); });
  }

  function render(focus) {
    renderMeta(); renderTape();
    if (phase === 'ask') renderAsk(focus);
    else if (phase === 'reveal') renderReveal();
    else renderDone();
  }

  /* ---------- start up ---------- */
  function showMessage(html, retry) {
    elMeta.textContent = ''; elTape.innerHTML = '';
    elStage.innerHTML = '<section class="card"><p class="q" style="margin:0">' + html + '</p>' +
      (retry ? '<div class="actions"><button type="button" class="btn primary" id="retry">Try again</button></div>' : '') + '</section>';
    var b = document.getElementById('retry'); if (b) b.addEventListener('click', boot);
  }

  function boot() {
    showMessage('Loading today’s puzzle…', false);
    api('GET', '/api/today').then(function (d) {
      todayData = d; todayKey = d.date; dayNo = d.puzzleNo;
      startDaily(); render(false);
    }, function () { showMessage('Couldn’t load today’s puzzle. Check your connection.', true); });
  }

  boot();
})();
