// Theme Toggle Engine for Jordan Brand Website
document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) return;

  const icon = themeToggle.querySelector('.material-symbols-outlined');

  // Function to update the toggle icon based on active theme
  function updateIcon(theme) {
    if (icon) {
      icon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
    }
  }

  // Initial icon set
  const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  updateIcon(currentTheme);

  // Toggle theme click handler
  themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    const newTheme = isDark ? 'dark' : 'light';
    localStorage.setItem('jordan_theme', newTheme);
    updateIcon(newTheme);
    
    // Dispatch custom event if other components need to react
    window.dispatchEvent(new CustomEvent('themechanged', { detail: { theme: newTheme } }));
  });
});
