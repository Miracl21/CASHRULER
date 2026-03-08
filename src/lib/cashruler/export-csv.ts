import type { Expense, Income, Transfer, Compte } from '@/lib/cashruler/types';
import { CURRENCY_SYMBOL, EXPENSE_CATEGORIES, INCOME_TYPES } from '@/lib/cashruler/constants';
import { format, parseISO } from 'date-fns';

function escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

async function downloadCSV(filename: string, csvContent: string) {
    const BOM = '\uFEFF';
    const fullContent = BOM + csvContent;

    // Try Capacitor Share (works on native mobile)
    try {
        const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
        const { Share } = await import('@capacitor/share');

        // Write to temp file
        const result = await Filesystem.writeFile({
            path: filename,
            data: fullContent,
            directory: Directory.Cache,
            encoding: Encoding.UTF8,
        });

        // Share the file
        await Share.share({
            title: filename,
            url: result.uri,
        });
        return;
    } catch {
        // Fallback: browser download
    }

    // Browser fallback
    const blob = new Blob([fullContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export async function exportExpensesCSV(expenses: Expense[], comptes: Compte[]) {
    const header = `Date,Titre,Montant (${CURRENCY_SYMBOL}),Catégorie,Compte Source,Note`;
    const rows = expenses
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map(exp => {
            const compte = comptes.find(c => c.id === exp.sourceCompteId);
            const catLabel = EXPENSE_CATEGORIES.find(c => c.name === exp.category)?.label || exp.category || '';
            return [
                format(parseISO(exp.date), 'dd/MM/yyyy'),
                escapeCSV(exp.title),
                exp.amount.toString(),
                escapeCSV(catLabel),
                escapeCSV(compte?.name || 'Inconnu'),
                escapeCSV(exp.note || ''),
            ].join(',');
        });
    await downloadCSV(`cashruler_depenses_${format(new Date(), 'yyyy-MM-dd')}.csv`, [header, ...rows].join('\n'));
}

export async function exportIncomesCSV(incomes: Income[], comptes: Compte[]) {
    const header = `Date,Nom,Montant (${CURRENCY_SYMBOL}),Type,Compte Cible,Note`;
    const rows = incomes
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map(inc => {
            const compte = comptes.find(c => c.id === inc.targetCompteId);
            const typeLabel = INCOME_TYPES.find(t => t.name === inc.type)?.label || inc.type;
            return [
                format(parseISO(inc.date), 'dd/MM/yyyy'),
                escapeCSV(inc.name),
                inc.amount.toString(),
                escapeCSV(typeLabel),
                escapeCSV(compte?.name || 'Inconnu'),
                escapeCSV(inc.note || ''),
            ].join(',');
        });
    await downloadCSV(`cashruler_revenus_${format(new Date(), 'yyyy-MM-dd')}.csv`, [header, ...rows].join('\n'));
}

export async function exportTransfersCSV(transfers: Transfer[], comptes: Compte[]) {
    const header = `Date,De,Vers,Montant (${CURRENCY_SYMBOL}),Note`;
    const rows = transfers
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map(t => {
            const from = comptes.find(c => c.id === t.fromCompteId);
            const to = comptes.find(c => c.id === t.toCompteId);
            return [
                format(parseISO(t.date), 'dd/MM/yyyy'),
                escapeCSV(from?.name || 'Inconnu'),
                escapeCSV(to?.name || 'Inconnu'),
                t.amount.toString(),
                escapeCSV(t.note || ''),
            ].join(',');
        });
    await downloadCSV(`cashruler_transferts_${format(new Date(), 'yyyy-MM-dd')}.csv`, [header, ...rows].join('\n'));
}

export async function exportAllCSV(expenses: Expense[], incomes: Income[], transfers: Transfer[], comptes: Compte[]) {
    const header = `Date,Type,Description,Montant (${CURRENCY_SYMBOL}),Catégorie/Type,Compte,Note`;
    const allRows: string[] = [];

    expenses.forEach(exp => {
        const compte = comptes.find(c => c.id === exp.sourceCompteId);
        const catLabel = EXPENSE_CATEGORIES.find(c => c.name === exp.category)?.label || exp.category || '';
        allRows.push([
            format(parseISO(exp.date), 'dd/MM/yyyy'),
            'Dépense',
            escapeCSV(exp.title),
            (-exp.amount).toString(),
            escapeCSV(catLabel),
            escapeCSV(compte?.name || ''),
            escapeCSV(exp.note || ''),
        ].join(','));
    });

    incomes.forEach(inc => {
        const compte = comptes.find(c => c.id === inc.targetCompteId);
        allRows.push([
            format(parseISO(inc.date), 'dd/MM/yyyy'),
            'Revenu',
            escapeCSV(inc.name),
            inc.amount.toString(),
            escapeCSV(INCOME_TYPES.find(t => t.name === inc.type)?.label || inc.type),
            escapeCSV(compte?.name || ''),
            escapeCSV(inc.note || ''),
        ].join(','));
    });

    transfers.forEach(t => {
        const from = comptes.find(c => c.id === t.fromCompteId);
        const to = comptes.find(c => c.id === t.toCompteId);
        allRows.push([
            format(parseISO(t.date), 'dd/MM/yyyy'),
            'Transfert',
            escapeCSV(`${from?.name || 'Inconnu'} → ${to?.name || 'Inconnu'}`),
            t.amount.toString(),
            'Transfert',
            escapeCSV(from?.name || ''),
            escapeCSV(t.note || ''),
        ].join(','));
    });

    allRows.sort((a, b) => {
        const dateA = a.split(',')[0];
        const dateB = b.split(',')[0];
        return dateB.localeCompare(dateA);
    });

    await downloadCSV(`cashruler_export_complet_${format(new Date(), 'yyyy-MM-dd')}.csv`, [header, ...allRows].join('\n'));
}
