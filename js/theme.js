(function () {
  var saved = localStorage.getItem('audiobytes-theme');
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  var theme = saved || (prefersDark ? 'dark' : 'light');
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.classList.toggle('light', theme === 'light');
})();

window.__toggleTheme = function () {
  var html = document.documentElement;
  var isDark = html.classList.contains('dark');
  html.classList.toggle('dark', !isDark);
  html.classList.toggle('light', isDark);
  var theme = isDark ? 'light' : 'dark';
  localStorage.setItem('audiobytes-theme', theme);
  var meta = document.getElementById('theme-color');
  if (meta) meta.content = isDark ? '#ffffff' : '#0F1115';
};

export function toggleTheme() {
  window.__toggleTheme();
}
