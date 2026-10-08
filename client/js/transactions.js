/**
 * Transaction History Controller, Filtering & PDF Statement Engine
 */

class Transactions {
  static currentPage = 1;
  static currentLimit = 10;

  static async load() {
    await this.fetchHistory();
  }

  // 1. Fetch Transaction History with Filters
  static async fetchHistory(page = 1) {
    this.currentPage = page;
    const tableBody = document.getElementById('tx-history-table');
    const paginationContainer = document.getElementById('tx-pagination');

    if (!tableBody) return;

    const search = document.getElementById('tx-search-input')?.value || '';
    const type = document.getElementById('tx-type-select')?.value || '';
    const startDate = document.getElementById('tx-start-date')?.value || '';
    const endDate = document.getElementById('tx-end-date')?.value || '';

    try {
      tableBody.innerHTML = `<tr><td colspan="6" class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading transactions...</td></tr>`;

      const queryParams = new URLSearchParams({
        page: this.currentPage,
        limit: this.currentLimit,
        search,
        type,
        startDate,
        endDate
      });

      const res = await API.get(`/transactions/history?${queryParams.toString()}`);
      const transactions = res.data;
      const pagination = res.pagination;

      if (!transactions || transactions.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No transactions match your search criteria.</td></tr>`;
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
      }

      tableBody.innerHTML = transactions.map(tx => {
        const isDeposit = tx.type === 'deposit';
        const isWithdraw = tx.type === 'withdraw';
        const amountClass = isDeposit ? 'badge-success' : isWithdraw ? 'badge-danger' : 'badge-warning';

        return `
          <tr>
            <td><strong>${tx.transaction_id}</strong></td>
            <td><span class="badge ${amountClass}">${tx.type}</span></td>
            <td>${tx.description || 'N/A'}</td>
            <td>${tx.sender_name ? `${tx.sender_name} (${tx.sender_account_number})` : tx.receiver_name ? `To: ${tx.receiver_name}` : 'Self'}</td>
            <td>${new Date(tx.created_at).toLocaleString()}</td>
            <td><strong>$${parseFloat(tx.amount).toFixed(2)}</strong></td>
          </tr>
        `;
      }).join('');

      // Render Pagination Buttons
      this.renderPagination(pagination, paginationContainer);

    } catch (error) {
      tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Failed to load transaction history.</td></tr>`;
    }
  }

  // 2. Render Pagination Controls
  static renderPagination(pagination, container) {
    if (!container) return;

    const { page, totalPages } = pagination;
    let html = `
      <div class="pagination-info">Page ${page} of ${totalPages}</div>
      <div class="pagination-controls">
        <button class="btn btn-secondary btn-sm" ${page <= 1 ? 'disabled' : ''} onclick="Transactions.fetchHistory(${page - 1})">
          <i class="fas fa-chevron-left"></i> Previous
        </button>
        <button class="btn btn-secondary btn-sm" ${page >= totalPages ? 'disabled' : ''} onclick="Transactions.fetchHistory(${page + 1})">
          Next <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    `;
    container.innerHTML = html;
  }

  // 3. Client-Side PDF Bank Statement Generation using jsPDF
  static async downloadPDFStatement() {
    try {
      UI.showToast('info', 'Generating PDF', 'Preparing your official bank statement...');

      const startDate = document.getElementById('tx-start-date')?.value || '';
      const endDate = document.getElementById('tx-end-date')?.value || '';

      const queryParams = new URLSearchParams({ startDate, endDate });
      const res = await API.get(`/transactions/statement?${queryParams.toString()}`);
      const statement = res.statement;

      // Use jsPDF from window object
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      // Header Banner
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 210, 30, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('APEX DIGITAL BANK', 14, 18);

      doc.setFontSize(10);
      doc.text('OFFICIAL ACCOUNT STATEMENT', 14, 25);

      // Customer Details Section
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Customer Name: ${statement.customerName}`, 14, 42);
      doc.text(`Account Number: ${statement.accountNumber}`, 14, 49);
      doc.text(`Account Type: ${statement.accountType.toUpperCase()}`, 14, 56);
      doc.text(`Generated On: ${new Date(statement.generatedAt).toLocaleDateString()}`, 130, 42);
      doc.text(`Current Balance: $${statement.currentBalance.toFixed(2)}`, 130, 49);

      // Divider Line
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 62, 196, 62);

      // Table Formatting
      const tableData = statement.transactions.map(tx => [
        tx.transaction_id,
        tx.type.toUpperCase(),
        tx.description || '-',
        new Date(tx.created_at).toLocaleDateString(),
        `$${parseFloat(tx.amount).toFixed(2)}`
      ]);

      doc.autoTable({
        startY: 68,
        head: [['TXN ID', 'TYPE', 'DESCRIPTION', 'DATE', 'AMOUNT ($)']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
        styles: { fontSize: 9 }
      });

      // Footer Statement
      const finalY = doc.lastAutoTable.finalY + 15;
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text('This is an electronically generated statement and requires no physical signature.', 14, finalY);

      // Save PDF file
      doc.save(`Apex_Bank_Statement_${statement.accountNumber}.pdf`);
      UI.showToast('success', 'PDF Ready', 'Bank statement downloaded successfully.');

    } catch (error) {
      UI.showToast('error', 'PDF Export Failed', error.message);
    }
  }
}

window.Transactions = Transactions;
