/* The old site's /forum?year=2019 addresses: that year's forum page (the years come from the page's script tag). */
(function () {
  var me = document.currentScript, years = {};
  try { years = JSON.parse(me.getAttribute('data-years') || '{}'); } catch (e) { /* no years: the events page */ }
  var y = (location.search.match(/year=(\d{4})/) || [])[1];
  if (y && years[y] && /^\/[^/]/.test(years[y])) location.replace(years[y]);
})();
