export function setupTabs(): void {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  const params = new URLSearchParams(window.location.search);
  const initialTab = params.get('tab') || 'library';

  const setActiveTab = (tabName: string) => {
    tabButtons.forEach((btn) => {
      if (btn instanceof HTMLElement) {
        if (btn.dataset.tab === tabName) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      }
    });

    tabContents.forEach((content) => {
      if (content instanceof HTMLElement) {
        if (content.dataset.content === tabName) {
          content.classList.remove('hidden');
        } else {
          content.classList.add('hidden');
        }
      }
    });
  };

  setActiveTab(initialTab);

  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (!(button instanceof HTMLElement)) return;
      const tabName = button.dataset.tab;
      if (!tabName) return;

      setActiveTab(tabName);

      const url = new URL(window.location.href);
      url.searchParams.set('tab', tabName);
      window.history.pushState({}, '', url);
    });
  });

  window.addEventListener('popstate', () => {
    const params = new URLSearchParams(window.location.search);
    const currentTab = params.get('tab') || 'library';
    setActiveTab(currentTab);
  });
}

export function setupStatusMessages(): void {
  const statusMessages = document.querySelectorAll(
    '#success-message, #error-message'
  );
  statusMessages.forEach((message) => {
    setTimeout(() => {
      message.classList.add('opacity-0', 'transition-opacity', 'duration-500');
      setTimeout(() => message.remove(), 500);
    }, 5000);
  });
}
