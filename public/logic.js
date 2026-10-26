/* Scoring and answer parsing for Vinci. Function bodies are unchanged from the original vinci.html. */
(function (root) {
  'use strict';

  var MULT = { k: 1e3, thousand: 1e3, m: 1e6, million: 1e6, b: 1e9, billion: 1e9, t: 1e12, trillion: 1e12 };

  function tokenize(src) {
    var s = String(src).toLowerCase().replace(/,/g, '');
    var out = [], i = 0;
    while (i < s.length) {
      var c = s.charAt(i);
      if (/\s/.test(c)) { i++; continue; }
      var m = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/.exec(s.slice(i));
      if (m) {
        var n = parseFloat(m[0]); i += m[0].length;
        var sm = /^\s*(thousand|million|billion|trillion|k|m|b|t)(?![a-z])/.exec(s.slice(i));
        if (sm) { n *= MULT[sm[1]]; i += sm[0].length; }
        out.push({ n: n }); continue;
      }
      if (c === '×' || c === 'x' || c === '*') { out.push({ o: '*' }); i++; continue; }
      if (c === '÷' || c === '/') { out.push({ o: '/' }); i++; continue; }
      if (c === '−' || c === '–' || c === '-') { out.push({ o: '-' }); i++; continue; }
      if (c === '+' || c === '^' || c === '(' || c === ')') { out.push({ o: c }); i++; continue; }
      return null;
    }
    return out;
  }

  function evaluate(src) {
    var t = tokenize(src);
    if (!t || !t.length) return null;
    var p = 0;
    function peek() { return t[p]; }
    function expr() {
      var v = term(); if (v === null) return null;
      while (peek() && (peek().o === '+' || peek().o === '-')) {
        var op = t[p++].o, r = term(); if (r === null) return null;
        v = op === '+' ? v + r : v - r;
      }
      return v;
    }
    function term() {
      var v = unary(); if (v === null) return null;
      while (peek() && (peek().o === '*' || peek().o === '/')) {
        var op = t[p++].o, r = unary(); if (r === null) return null;
        v = op === '*' ? v * r : v / r;
      }
      return v;
    }
    function unary() {
      if (peek() && peek().o === '-') { p++; var v = unary(); return v === null ? null : -v; }
      if (peek() && peek().o === '+') { p++; return unary(); }
      return power();
    }
    function power() {
      var b = atom(); if (b === null) return null;
      if (peek() && peek().o === '^') { p++; var e = unary(); if (e === null) return null; return Math.pow(b, e); }
      return b;
    }
    function atom() {
      var k = peek(); if (!k) return null;
      if (k.n !== undefined) { p++; return k.n; }
      if (k.o === '(') {
        p++; var v = expr();
        if (v === null || !peek() || peek().o !== ')') return null;
        p++; return v;
      }
      return null;
    }
    var v = expr();
    if (v === null || p !== t.length || !isFinite(v)) return null;
    return v;
  }

  function multiple(g, a) { return g >= a ? g / a : a / g; }
  function geoMean(arr) { return Math.exp(arr.reduce(function (s, x) { return s + Math.log(x); }, 0) / arr.length); }
  function verdict(m) {
    var label = m <= 1.1 ? 'Bullseye' : m <= 1.5 ? 'Sharp' : m <= 3 ? 'Close' : m <= 10 ? 'Ballpark' : m <= 100 ? 'Wide of the mark' : 'Off by orders of magnitude';
    var cls = m <= 1.5 ? 'good' : m <= 5 ? 'warn' : 'bad';
    return { label: label, cls: cls };
  }
  function sig(x) { return x >= 100 ? String(Math.round(x)) : x >= 10 ? String(+x.toFixed(1)) : String(+x.toFixed(2)); }
  function compact(n) {
    var abs = Math.abs(n);
    if (abs >= 1e12) return sig(n / 1e12) + ' trillion';
    if (abs >= 1e9) return sig(n / 1e9) + ' billion';
    if (abs >= 1e6) return sig(n / 1e6) + ' million';
    if (abs >= 1000) return Math.round(n).toLocaleString('en-US');
    return sig(n);
  }
  function full(n) { return n >= 1000 ? Math.round(n).toLocaleString('en-US') : sig(n); }
  function fmtMult(m) {
    if (m >= 1000) return Math.round(m).toLocaleString('en-US') + '×';
    return (m < 10 ? m.toFixed(2) : m < 100 ? m.toFixed(1) : String(Math.round(m))) + '×';
  }

  var api = {
    evaluate: evaluate, multiple: multiple, geoMean: geoMean, verdict: verdict,
    sig: sig, compact: compact, full: full, fmtMult: fmtMult
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.VinciLogic = api;
})(typeof self !== 'undefined' ? self : this);
