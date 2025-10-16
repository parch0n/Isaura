import ExcelJS from 'exceljs';

export interface PortfolioToken {
	symbol: string;
	total: number;
	totalUSD: number;
	networks: string[];
	logoURI?: string;
}

export interface ExportPortfolioOptions {
	tokens: PortfolioToken[];
	walletLabel: string;
}

export async function exportPortfolioToExcel(options: ExportPortfolioOptions): Promise<void> {
	const { tokens, walletLabel } = options;

	if (tokens.length === 0) {
		throw new Error('No portfolio data to export');
	}

	// Calculate totals
	const totalValue = tokens.reduce((acc, t) => acc + (t.totalUSD || 0), 0);
	const uniqueNetworks = new Set<string>();
	tokens.forEach((t) => (t.networks || []).forEach((n) => uniqueNetworks.add(n)));

	// Sort data by totalUSD descending
	const sortedRows = [...tokens].sort((a, b) => (b.totalUSD || 0) - (a.totalUSD || 0));

	// Create a new workbook and worksheet
	const workbook = new ExcelJS.Workbook();
	const worksheet = workbook.addWorksheet('Portfolio', {
		views: [{ state: 'frozen', xSplit: 0, ySplit: 9 }],
	});

	// Set column widths and properties
	worksheet.columns = [
		{ width: 20, style: { alignment: { horizontal: 'left' } } }, // Token Symbol
		{ width: 24, style: { alignment: { horizontal: 'right' } } }, // Amount
		{ width: 16, style: { alignment: { horizontal: 'right' } } }, // Value USD
		{ width: 62, style: { alignment: { horizontal: 'left' } } }, // Networks
	];

	// Add title row with styling
	const titleRow = worksheet.addRow([`Portfolio Export - ${walletLabel}`]);
	titleRow.height = 25;
	titleRow.font = { size: 16, bold: true, color: { argb: 'FF334155' } };
	titleRow.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
	worksheet.mergeCells(1, 1, 1, 4);

	// Add timestamp row
	const timestampRow = worksheet.addRow([`Generated: ${new Date().toLocaleString()}`]);
	timestampRow.font = { size: 10, italic: true, color: { argb: 'FF64748B' } };
	timestampRow.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
	worksheet.mergeCells(2, 1, 2, 4);

	// Add empty row
	worksheet.addRow([]);

	// Add summary section header
	const summaryHeaderRow = worksheet.addRow(['Summary']);
	summaryHeaderRow.height = 30;
	summaryHeaderRow.font = { size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
	summaryHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };
	worksheet.mergeCells(4, 1, 4, 2); // Merge only first 2 columns

	// Style only the first 2 columns (merged cell)
	summaryHeaderRow.getCell(1).fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: 'FF64748B' },
	};
	summaryHeaderRow.getCell(1).border = {
		top: { style: 'thick', color: { argb: 'FF334155' } },
		left: { style: 'thick', color: { argb: 'FF334155' } },
		bottom: { style: 'medium', color: { argb: 'FF475569' } },
		right: { style: 'thick', color: { argb: 'FF334155' } },
	};

	// Add summary rows with styling and borders
	const totalValueRow = worksheet.addRow(['Total Value', totalValue]);
	totalValueRow.font = { size: 12 };
	totalValueRow.height = 16;
	totalValueRow.getCell(1).font = { bold: true, color: { argb: 'FF334155' } };
	totalValueRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
	totalValueRow.getCell(2).font = { size: 12, color: { argb: 'FF1E40AF' } };
	totalValueRow.getCell(2).alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };
	totalValueRow.getCell(2).numFmt = '$#,##0.00';

	// Borders for Total Value row
	totalValueRow.getCell(1).border = {
		left: { style: 'thick', color: { argb: 'FF334155' } },
		right: { style: 'medium', color: { argb: 'FF64748B' } },
		bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
	};
	totalValueRow.getCell(2).border = {
		right: { style: 'thick', color: { argb: 'FF334155' } },
		bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
	};

	const tokensRow = worksheet.addRow(['Total Tokens', tokens.length]);
	tokensRow.font = { size: 12 };
	tokensRow.height = 16;
	tokensRow.getCell(1).font = { bold: true, color: { argb: 'FF334155' } };
	tokensRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
	tokensRow.getCell(2).alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };

	// Borders for Tokens row
	tokensRow.getCell(1).border = {
		left: { style: 'thick', color: { argb: 'FF334155' } },
		right: { style: 'medium', color: { argb: 'FF64748B' } },
		bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
	};
	tokensRow.getCell(2).border = {
		right: { style: 'thick', color: { argb: 'FF334155' } },
		bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
	};

	const networksRow = worksheet.addRow(['Networks', uniqueNetworks.size]);
	networksRow.font = { size: 12 };
	networksRow.height = 16;
	networksRow.getCell(1).font = { bold: true, color: { argb: 'FF334155' } };
	networksRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
	networksRow.getCell(2).alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };

	// Borders for Networks row (bottom of summary section)
	networksRow.getCell(1).border = {
		left: { style: 'thick', color: { argb: 'FF334155' } },
		right: { style: 'medium', color: { argb: 'FF64748B' } },
		bottom: { style: 'thick', color: { argb: 'FF334155' } },
	};
	networksRow.getCell(2).border = {
		right: { style: 'thick', color: { argb: 'FF334155' } },
		bottom: { style: 'thick', color: { argb: 'FF334155' } },
	};

	// Add empty row
	worksheet.addRow([]);

	// Add column headers with beautiful styling
	const headerRow = worksheet.addRow(['Token Symbol', 'Amount', 'Value (USD)', 'Networks']);
	headerRow.height = 30;
	headerRow.font = { size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
	headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

	// Header cells with muted colors and thick borders - only style columns 1-4
	for (let colNumber = 1; colNumber <= 4; colNumber++) {
		const cell = headerRow.getCell(colNumber);
		const isFirstCol = colNumber === 1;
		const isLastCol = colNumber === 4;

		cell.fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: 'FF64748B' },
		};
		cell.border = {
			top: { style: 'thick', color: { argb: 'FF334155' } },
			bottom: { style: 'medium', color: { argb: 'FF475569' } },
			left: isFirstCol
				? { style: 'thick', color: { argb: 'FF334155' } }
				: { style: 'medium', color: { argb: 'FF94A3B8' } },
			right: isLastCol
				? { style: 'thick', color: { argb: 'FF334155' } }
				: { style: 'medium', color: { argb: 'FF94A3B8' } },
		};
	}

	// Track the first and last data row for borders
	const firstDataRow = 10;
	const lastDataRow = firstDataRow + sortedRows.length - 1;

	// Add data rows with alternating colors
	sortedRows.forEach((token, index) => {
		const currentRow = firstDataRow + index;
		const dataRow = worksheet.addRow([
			token.symbol,
			token.total, // Store as number
			token.totalUSD, // Store as number
			token.networks.join(', '),
		]);

		// Style cells individually (not entire row)
		dataRow.font = { size: 10 };
		dataRow.height = 16;
		dataRow.alignment = { vertical: 'middle' };

		// Token symbol - bold and left-aligned with subtle alternating background
		const symbolCell = dataRow.getCell(1);
		symbolCell.font = { size: 11, bold: true, color: { argb: 'FF1E293B' } };
		symbolCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
		if (index % 2 === 0) {
			symbolCell.fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: 'FFFAFAFA' },
			};
		}

		// Amount - right-aligned, stored as number with alternating background
		const amountCell = dataRow.getCell(2);
		amountCell.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };
		amountCell.font = { size: 10 };
		amountCell.numFmt = '#,##0.000000'; // Number format with up to 6 decimals
		if (index % 2 === 0) {
			amountCell.fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: 'FFFAFAFA' },
			};
		}

		// Value USD - right-aligned, stored as currency number with blue color
		const valueCell = dataRow.getCell(3);
		valueCell.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };
		valueCell.font = { size: 11, color: { argb: 'FF1E40AF' } };
		valueCell.numFmt = '$#,##0.00'; // Currency format
		if (index % 2 === 0) {
			valueCell.fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: 'FFFAFAFA' },
			};
		}

		// Networks - left-aligned with alternating background
		const networksCell = dataRow.getCell(4);
		networksCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
		networksCell.font = { size: 9, color: { argb: 'FF64748B' } };
		if (index % 2 === 0) {
			networksCell.fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: 'FFFAFAFA' },
			};
		}

		// Add borders to each cell - only style columns 1-4
		for (let colNumber = 1; colNumber <= 4; colNumber++) {
			const cell = dataRow.getCell(colNumber);
			const isFirstRow = currentRow === firstDataRow;
			const isLastRow = currentRow === lastDataRow;
			const isFirstCol = colNumber === 1;
			const isLastCol = colNumber === 4;

			cell.border = {
				top: isFirstRow
					? { style: 'medium', color: { argb: 'FF475569' } }
					: { style: 'thin', color: { argb: 'FFE2E8F0' } },
				bottom: isLastRow
					? { style: 'thick', color: { argb: 'FF334155' } }
					: { style: 'thin', color: { argb: 'FFE2E8F0' } },
				left: isFirstCol
					? { style: 'thick', color: { argb: 'FF334155' } }
					: { style: 'medium', color: { argb: 'FF94A3B8' } },
				right: isLastCol
					? { style: 'thick', color: { argb: 'FF334155' } }
					: { style: 'medium', color: { argb: 'FF94A3B8' } },
			};
		}
	});

	// Add a summary row at the bottom
	const lastRow = worksheet.addRow(['TOTAL', '', totalValue, '']);
	lastRow.height = 28;
	lastRow.font = { size: 12, bold: true, color: { argb: 'FF1E293B' } };

	// Style total row cells individually
	lastRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
	lastRow.getCell(1).fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: 'FFE2E8F0' },
	};

	lastRow.getCell(2).fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: 'FFE2E8F0' },
	};

	lastRow.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
	lastRow.getCell(3).numFmt = '$#,##0.00';
	lastRow.getCell(3).font = { size: 13, bold: true, color: { argb: 'FF1E40AF' } };
	lastRow.getCell(3).fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: 'FFE2E8F0' },
	};

	lastRow.getCell(4).fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: 'FFE2E8F0' },
	};

	// Add thick borders around total row - only style columns 1-4
	for (let colNumber = 1; colNumber <= 4; colNumber++) {
		const cell = lastRow.getCell(colNumber);
		const isFirstCol = colNumber === 1;
		const isLastCol = colNumber === 4;

		cell.border = {
			top: { style: 'double', color: { argb: 'FF475569' } },
			bottom: { style: 'thick', color: { argb: 'FF334155' } },
			left: isFirstCol
				? { style: 'thick', color: { argb: 'FF334155' } }
				: { style: 'medium', color: { argb: 'FF94A3B8' } },
			right: isLastCol
				? { style: 'thick', color: { argb: 'FF334155' } }
				: { style: 'medium', color: { argb: 'FF94A3B8' } },
		};
	}

	// Generate filename with date
	const dateStr = new Date().toISOString().split('T')[0];
	const filename = `portfolio-${walletLabel}-${dateStr}.xlsx`;

	// Write to buffer and download
	const buffer = await workbook.xlsx.writeBuffer();
	const blob = new Blob([buffer], {
		type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	});
	const url = window.URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	link.click();
	window.URL.revokeObjectURL(url);
}
