import { parseHTML } from 'linkedom';

const emailUtils = {

	getDomain(email) {
		if (typeof email !== 'string') return '';
		const parts = email.split('@');
		return parts.length === 2 ? parts[1] : '';
	},

	getName(email) {
		if (typeof email !== 'string') return '';
		const parts = email.trim().split('@');
		return parts.length === 2 ? parts[0] : '';
	},

	parseSubaddress(email) {
		if (typeof email !== 'string') return { baseEmail: '', tag: '', hasTag: false, domain: '' };
		const atIdx = email.lastIndexOf('@');
		if (atIdx === -1) return { baseEmail: email, tag: '', hasTag: false, domain: '' };
		const localPart = email.substring(0, atIdx).trim();
		const domain = email.substring(atIdx + 1).trim();
		const plusIdx = localPart.indexOf('+');
		if (plusIdx > 0) {
			const baseLocal = localPart.substring(0, plusIdx);
			const tag = localPart.substring(plusIdx + 1);
			return {
				baseEmail: `${baseLocal}@${domain}`,
				tag,
				hasTag: true,
				domain
			};
		}
		return { baseEmail: email, tag: '', hasTag: false, domain };
	},

	formatText(text) {
		if (!text) return ''
		return text
			.split('\n')
			.map(line => {
				return line.replace(/[\u200B-\u200F\uFEFF\u034F\u200B-\u200F\u00A0\u3000\u00AD]/g, '')
					.replace(/\s+/g, ' ')
					.trim();
			})
			.join('\n')
			.replace(/\n{3,}/g, '\n')
			.trim();
	},

	htmlToText(content) {
		if (!content) return ''
		try {
			const wrappedContent = content.includes('<body')
				? content
				: `<!DOCTYPE html><html><body>${content}</body></html>`;
			const { document } = parseHTML(wrappedContent);
			document.querySelectorAll('style, script, title').forEach(el => el.remove());
			let text = document.body.innerText;
			return this.formatText(text);
		} catch (e) {
			console.error(e)
			return ''
		}
	}
};

export default emailUtils;
