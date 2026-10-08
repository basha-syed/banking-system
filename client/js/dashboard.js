/**
 * Dashboard Controller - Balance Animations, Chart.js Integration, Quick Actions
 */

class Dashboard {
  static async load() {
    try {
      await Promise.all([
        this.loadAccountInfo(),
        this.loadAnalyticsChart(),
        this.loadRecentActivity()
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  }

  // 1. Load Account Summary & Animate Balance
  static async loadAccountInfo() {
    try {
      const res = await API.get('/accounts/details');
      const account = res.account;

      // Update Card UI
      const accNumEl = document.getElementById('dash-card-number');
      const accTypeEl = document.getElementById('dash-card-type');
      const cardHolderEl = document.getElementById('dash-card-holder');

      if (accNumEl) accNumEl.textContent = `•••• •••• ${account.accountNumber.slice(-4)}`;
      if (accTypeEl) accTypeEl.textContent = `${account.accountType.toUpperCase()} ACCOUNT`;
      
      const user = JSON.parse(localStorage.getItem('apex_user') || '{}');
      if (cardHolderEl) cardHolderEl.textContent = user.fullName || 'Valued Customer';

      // Animate Balance Count Up
      UI.animateBalance('dash-balance-amount', account.balance);
    } catch (error) {
      UI.showToast('error', 'Dashboard Error', error.message);
    }
  }

  // 2. Load & Render Chart.js Analytics
  static async loadAnalyticsChart() {
    const canvas = document.getElementById('analytics-chart');
    if (!canvas) return;

    try {
      const res = await API.get('/transactions/analytics');
      const data = res.analytics;

      // Destroy existing chart if initialized
      if (window.myAnalyticsChart) {
        window.myAnalyticsChart.destroy();
      }

      const ctx = canvas.getContext('2d');
      window.myAnalyticsChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.labels.length ? data.labels : ['Jul 01', 'Jul 05', 'Jul 10', 'Jul 15', 'Jul 20'],
          datasets: data.datasets.length ? data.datasets : [
            {
              label: 'Money In ($)',
              data: [5000, 4000, 1000, 0, 0],
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              fill: true,
              tension: 0.4
            },
            {
              label: 'Money Out ($)',
              data: [0, 1200, 300, 150, 0],
              borderColor: '#ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              fill: true,
              tension: 0.4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                color: document.documentElement.getAttribute('data-theme') === 'dark' ? '#94a3b8' : '#475569'
              }
            }
          },
          scales: {
            x: {
              grid: { display: false }
            },
            y: {
              grid: { color: 'rgba(226, 232, 240, 0.2)' },
              ticks: {
                callback: function(value) { return '$' + value; }
              }
            }
          }
        }
      });
    } catch (error) {
      console.warn('Analytics chart error:', error);
    }
  }

  // 3. Load Recent Activity Feed
  static async loadRecentActivity() {
    const tableBody = document.getElementById('dash-recent-table');
    if (!tableBody) return;

    try {
      const res = await API.get('/transactions/history?limit=5');
      const transactions = res.data;

      if (!transactions.length) {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center">No recent transactions found.</td></tr>`;
        return;
      }

      tableBody.innerHTML = transactions.map(tx => {
        const isIncome = tx.type === 'deposit' || (tx.type === 'transfer' && tx.receiver_name);
        const amountClass = isIncome ? 'text-success' : 'text-danger';
        const sign = isIncome ? '+' : '-';

        return `
          <tr>
            <td>
              <span class="badge ${tx.type === 'deposit' ? 'badge-success' : tx.type === 'withdraw' ? 'badge-danger' : 'badge-warning'}">
                ${tx.type}
              </span>
            </td>
            <td><strong>${tx.transaction_id}</strong></td>
            <td>${tx.description || 'N/A'}</td>
            <td>${new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
            <td class="${amountClass}"><strong>${sign}$${parseFloat(tx.amount).toFixed(2)}</strong></td>
          </tr>
        `;
      }).join('');
    } catch (error) {
      tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Error loading recent activity.</td></tr>`;
    }
  }
}

window.Dashboard = Dashboard;
