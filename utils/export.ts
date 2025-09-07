import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { Transaction } from './supabase';

export interface ExportData {
  Date: string;
  Time: string;
  Type: string;
  Amount: number;
  Category: string;
  Description: string;
  'Balance Impact': string;
}

export function exportTransactionsToExcel(transactions: Transaction[], filename?: string) {
  try {
    // Transform data for Excel export
    const exportData: ExportData[] = transactions.map(transaction => ({
      Date: format(new Date(transaction.created_at), 'dd/MM/yyyy'),
      Time: format(new Date(transaction.created_at), 'hh:mm:ss a'),
      Type: transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1),
      Amount: parseFloat(transaction.amount.toString()),
      Category: transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1),
      Description: transaction.description || 'No description',
      'Balance Impact': transaction.type === 'income' ? `+₹${transaction.amount}` : `-₹${transaction.amount}`
    }));

    // Calculate summary data
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    
    const balance = totalIncome - totalExpenses;

    // Add summary rows
    const summaryData = [
      { Date: '', Time: '', Type: '', Amount: '', Category: '', Description: '', 'Balance Impact': '' },
      { Date: 'SUMMARY', Time: '', Type: '', Amount: '', Category: '', Description: '', 'Balance Impact': '' },
      { Date: 'Total Income', Time: '', Type: '', Amount: totalIncome, Category: '', Description: '', 'Balance Impact': `+₹${totalIncome}` },
      { Date: 'Total Expenses', Time: '', Type: '', Amount: totalExpenses, Category: '', Description: '', 'Balance Impact': `-₹${totalExpenses}` },
      { Date: 'Net Balance', Time: '', Type: '', Amount: balance, Category: '', Description: '', 'Balance Impact': balance >= 0 ? `+₹${balance}` : `-₹${Math.abs(balance)}` },
    ];

    // Combine data
    const finalData = [...exportData, ...summaryData];

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(finalData);
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 12 }, // Date
      { wch: 12 }, // Time
      { wch: 10 }, // Type
      { wch: 12 }, // Amount
      { wch: 15 }, // Category
      { wch: 30 }, // Description
      { wch: 15 }, // Balance Impact
    ];

    // Style the header row
    const headerRow = 1;
    const headerCells = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1'];
    headerCells.forEach(cell => {
      if (worksheet[cell]) {
        worksheet[cell].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: 'E0E0E0' } },
          alignment: { horizontal: 'center' }
        };
      }
    });

    // Style summary rows
    const summaryStartRow = exportData.length + 2;
    const summaryRows = [summaryStartRow + 1, summaryStartRow + 2, summaryStartRow + 3, summaryStartRow + 4];
    summaryRows.forEach(row => {
      const cellA = `A${row}`;
      const cellD = `D${row}`;
      const cellG = `G${row}`;
      
      if (worksheet[cellA]) {
        worksheet[cellA].s = { font: { bold: true } };
      }
      if (worksheet[cellD]) {
        worksheet[cellD].s = { font: { bold: true } };
      }
      if (worksheet[cellG]) {
        worksheet[cellG].s = { font: { bold: true } };
      }
    });

    // Create workbook and add worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    // Create blob and save
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const defaultFilename = `ClearBudget_Transactions_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.xlsx`;
    saveAs(data, filename || defaultFilename);
    
    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error('Failed to export data to Excel');
  }
}

export function exportFilteredTransactions(
  transactions: Transaction[], 
  dateRange?: { start: Date; end: Date },
  type?: 'income' | 'expense' | 'all',
  category?: string
) {
  let filteredTransactions = transactions;

  // Filter by date range
  if (dateRange) {
    filteredTransactions = filteredTransactions.filter(t => {
      const transactionDate = new Date(t.created_at);
      return transactionDate >= dateRange.start && transactionDate <= dateRange.end;
    });
  }

  // Filter by type
  if (type && type !== 'all') {
    filteredTransactions = filteredTransactions.filter(t => t.type === type);
  }

  // Filter by category
  if (category) {
    filteredTransactions = filteredTransactions.filter(t => 
      t.category.toLowerCase().includes(category.toLowerCase())
    );
  }

  const filename = `ClearBudget_Filtered_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.xlsx`;
  return exportTransactionsToExcel(filteredTransactions, filename);
}
