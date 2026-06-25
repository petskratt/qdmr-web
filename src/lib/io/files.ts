// Browser file helpers for import (read) and export (download).

export function downloadText(filename: string, text: string, mime = 'text/yaml'): void {
	const blob = new Blob([text], { type: `${mime};charset=utf-8` });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.style.display = 'none';
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

/** Strip directory + extension(s) from a filename for use as a dataset name. */
export function baseName(filename: string): string {
	const last = filename.split(/[\\/]/).pop() ?? filename;
	return last.replace(/\.(ya?ml|json|csv|conf|txt)$/i, '') || last;
}
