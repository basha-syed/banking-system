/**
 * Admin Panel Controller - User Management & System Metrics
 */

class Admin {
  static async load() {
    await Promise.all([
      this.loadMetrics(),
      this.loadUsersList(),
      this.loadSystemTransactions()
    ]);
  }

  // 1. Load System Metrics Widgets
  static async loadMetrics() {
    try {
      const res = await API.get('/admin/metrics');
      const metrics = res.metrics;

      const usersEl = document.getElementById('admin-stat-users');
      const depositsEl = document.getElementById('admin-stat-deposits');
      const txCountEl = document.getElementById('admin-stat-txcount');
      const volumeEl = document.getElementById('admin-stat-volume');

      if (usersEl) usersEl.textContent = metrics.totalUsers;
      if (depositsEl) depositsEl.textContent = `$${metrics.totalDeposits.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      if (txCountEl) txCountEl.textContent = metrics.totalTransactions;
      if (volumeEl) volumeEl.textContent = `$${metrics.totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    } catch (error) {
      console.error('Failed to load admin metrics:', error);
    }
  }

  // 2. Load User Management Table
  static async loadUsersList() {
    const tableBody = document.getElementById('admin-users-table');
    if (!tableBody) return;

    try {
      const res = await API.get('/admin/users');
      const users = res.users;

      if (!users || users.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center">No registered users found.</td></tr>`;
        return;
      }

      tableBody.innerHTML = users.map(u => {
        const isBlocked = u.is_blocked || u.account_status === 'blocked';
        const roleBadge = u.role === 'admin' ? 'badge-danger' : 'badge-success';

        return `
          <tr>
            <td><strong>#${u.id}</strong></td>
            <td>
              <div class="user-cell">
                <div><strong>${u.full_name}</strong></div>
                <div class="text-muted text-sm">${u.email}</div>
              </div>
            </td>
            <td>${u.account_number || 'N/A'}</td>
            <td><strong>$${parseFloat(u.balance || 0).toFixed(2)}</strong></td>
            <td><span class="badge ${roleBadge}">${u.role}</span></td>
            <td>
              <span class="badge ${isBlocked ? 'badge-danger' : 'badge-success'}">
                ${isBlocked ? 'Blocked' : 'Active'}
              </span>
            </td>
            <td>
              ${u.role !== 'admin' ? `
                <button class="btn btn-sm ${isBlocked ? 'btn-success' : 'btn-danger'}" onclick="Admin.toggleBlockUser(${u.id}, ${!isBlocked})">
                  ${isBlocked ? '<i class="fas fa-unlock"></i> Unblock' : '<i class="fas fa-ban"></i> Block'}
                </button>
              ` : '<span class="text-muted">Protected</span>'}
            </td>
          </tr>
        `;
      }).join('');
    } catch (error) {
      tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Failed to load user list.</td></tr>`;
    }
  }

  // 3. Toggle User Block / Unblock Status
  static async toggleBlockUser(userId, shouldBlock) {
    const actionName = shouldBlock ? 'block' : 'unblock';
    if (!confirm(`Are you sure you want to ${actionName} this user account?`)) return;

    try {
      const res = await API.post(`/admin/users/${userId}/block`, { block: shouldBlock });
      UI.showToast('success', 'User Updated', res.message);
      await Promise.all([this.loadMetrics(), this.loadUsersList()]);
    } catch (error) {
      UI.showToast('error', 'Action Failed', error.message);
    }
  }

  // 4. Load System Transactions Log
  static async loadSystemTransactions() {
    const tableBody = document.getElementById('admin-transactions-table');
    if (!tableBody) return;

    try {
      const res = await API.get('/admin/transactions');
      const txs = res.transactions;

      tableBody.innerHTML = txs.map(tx => `
        <tr>
          <td><strong>${tx.transaction_id}</strong></td>
          <td><span class="badge badge-warning">${tx.type}</span></td>
          <td>${tx.sender_name || 'System/ATM'}</td>
          <td>${tx.receiver_name || 'System/ATM'}</td>
          <td>$${parseFloat(tx.amount).toFixed(2)}</td>
          <td>${new Date(tx.created_at).toLocaleString()}</td>
        </tr>
      `).join('');
    } catch (error) {
      tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Failed to load system log.</td></tr>`;
    }
  }
}

window.Admin = Admin;
