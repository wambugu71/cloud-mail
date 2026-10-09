import emailUtils from '../utils/email-utils';

function escapeHtml(str) {
	return (str || '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

export default function emailMsgTemplate(email, tgMsgTo, tgMsgFrom, tgMsgText) {

	const subject = escapeHtml(email.subject || 'No Subject');
	const name = escapeHtml(email.name || '');
	const sendEmail = escapeHtml(email.sendEmail || '');
	const toEmail = escapeHtml(email.toEmail || '');

	let template = `<b>${subject}</b>`;

	if (tgMsgFrom === 'only-name') {
		template += `\n\nFrom\u200B：${name}`;
	} else if (tgMsgFrom === 'show') {
		template += `\n\nFrom\u200B：${name}  &lt;${sendEmail}&gt;`;
	}

	if (tgMsgTo === 'show') {
		template += `\nTo：\u200B${toEmail}`;
	}

	const rawText = escapeHtml(emailUtils.formatText(email.text) || emailUtils.htmlToText(email.content) || '');

	if (tgMsgText === 'show') {
		const maxLen = 3800;
		const budget = maxLen - template.length;
		if (budget > 100) {
			const truncatedText = rawText.length > budget
				? rawText.slice(0, budget) + '\n\n... [message truncated]'
				: rawText;
			template += `\n\n${truncatedText}`;
		}
	}

	if (template.length > 4000) {
		template = template.slice(0, 3900) + '\n\n... [truncated]';
	}

	return template;

}
