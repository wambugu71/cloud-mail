import KvConst from '../const/kv-const';
import setting from '../entity/setting';
import orm from '../entity/orm';
import {verifyRecordType} from '../const/entity-const';
import fileUtils from '../utils/file-utils';
import r2Service from './r2-service';
import constant from '../const/constant';
import BizError from '../error/biz-error';
import {t} from '../i18n/i18n'
import verifyRecordService from './verify-record-service';
import userContext from '../security/user-context';

const settingService = {

	async selectSettingRow(c) {
		try {
			const row = await orm(c).select().from(setting).get();
			if (row) return row;
		} catch (e) {
			console.warn('Direct ORM select failed, attempting auto-migration:', e.message);
			const alters = [
				`ALTER TABLE setting ADD COLUMN black_subject TEXT NOT NULL DEFAULT '';`,
				`ALTER TABLE setting ADD COLUMN black_content TEXT NOT NULL DEFAULT '';`,
				`ALTER TABLE setting ADD COLUMN black_from TEXT NOT NULL DEFAULT '';`,
				`ALTER TABLE setting ADD COLUMN ai_code INTEGER NOT NULL DEFAULT 1;`,
				`ALTER TABLE setting ADD COLUMN ai_code_filter TEXT NOT NULL DEFAULT '';`,
				`ALTER TABLE setting ADD COLUMN auto_clean_days INTEGER NOT NULL DEFAULT 0;`,
				`ALTER TABLE setting ADD COLUMN subaddress INTEGER NOT NULL DEFAULT 1;`,
				`ALTER TABLE setting ADD COLUMN webhook_url TEXT NOT NULL DEFAULT '';`,
				`ALTER TABLE setting ADD COLUMN webhook_status INTEGER NOT NULL DEFAULT 1;`,
				`ALTER TABLE setting ADD COLUMN webhook_secret TEXT NOT NULL DEFAULT '';`,
				`ALTER TABLE setting ADD COLUMN webhook_headers TEXT NOT NULL DEFAULT '{}';`
			];
			for (const sql of alters) {
				try { await c.env.db.prepare(sql).run(); } catch (_) {}
			}
			try {
				const retryRow = await orm(c).select().from(setting).get();
				if (retryRow) return retryRow;
			} catch (retryErr) {
				console.warn('Retry after migration failed, querying raw table:', retryErr.message);
				try {
					const rawRow = await c.env.db.prepare('SELECT * FROM setting LIMIT 1;').first();
					if (rawRow) {
						return {
							register: 0,
							receive: 0,
							title: '',
							manyEmail: 0,
							addEmail: 0,
							autoRefresh: 0,
							addEmailVerify: 1,
							registerVerify: 1,
							regVerifyCount: 1,
							addVerifyCount: 1,
							send: 1,
							r2Domain: '',
							secretKey: '',
							siteKey: '',
							regKey: 1,
							background: '',
							tgBotToken: '',
							tgChatId: '',
							tgBotStatus: 1,
							forwardEmail: '',
							forwardStatus: 1,
							ruleEmail: '',
							ruleType: 0,
							loginOpacity: 0.88,
							resendTokens: '{}',
							noticeTitle: '',
							noticeContent: '',
							noticeType: '',
							noticeDuration: 0,
							noticePosition: '',
							noticeOffset: 0,
							noticeWidth: 400,
							notice: 0,
							noRecipient: 1,
							loginDomain: 0,
							bucket: '',
							region: '',
							endpoint: '',
							s3AccessKey: '',
							s3SecretKey: '',
							forcePathStyle: 1,
							customDomain: '',
							tgMsgFrom: 'only-name',
							tgMsgTo: 'show',
							tgMsgText: 'hide',
							minEmailPrefix: 0,
							emailPrefixFilter: '',
							blackSubject: '',
							blackContent: '',
							blackFrom: '',
							aiCode: 1,
							aiCodeFilter: '',
							autoCleanDays: 0,
							subaddress: 1,
							webhookUrl: '',
							webhookStatus: 1,
							webhookSecret: '',
							webhookHeaders: '{}',
							...rawRow
						};
					}
				} catch (rawErr) {
					console.error('Raw select failed:', rawErr.message);
				}
			}
		}
		return null;
	},

	async refresh(c) {
		const settingRow = await this.selectSettingRow(c);
		if (!settingRow) return;
		if (typeof settingRow.resendTokens === 'string') {
			try {
				settingRow.resendTokens = JSON.parse(settingRow.resendTokens);
			} catch {
				settingRow.resendTokens = {};
			}
		} else if (!settingRow.resendTokens || typeof settingRow.resendTokens !== 'object') {
			settingRow.resendTokens = {};
		}
		c.set?.('setting', settingRow);
		await c.env.kv.put(KvConst.SETTING, JSON.stringify(settingRow));
	},

	async query(c) {

		if (c.get?.('setting')) {
			return c.get('setting')
		}

		let settingData = await c.env.kv.get(KvConst.SETTING, { type: 'json' });

		if (!settingData) {
			const settingRow = await this.selectSettingRow(c);
			if (!settingRow) {
				throw new BizError('数据库未初始化 Database not initialized.');
			}
			if (typeof settingRow.resendTokens === 'string') {
				try {
					settingRow.resendTokens = JSON.parse(settingRow.resendTokens);
				} catch {
					settingRow.resendTokens = {};
				}
			} else if (!settingRow.resendTokens || typeof settingRow.resendTokens !== 'object') {
				settingRow.resendTokens = {};
			}
			await c.env.kv.put(KvConst.SETTING, JSON.stringify(settingRow));
			settingData = settingRow;
		}

		if (typeof settingData.resendTokens === 'string') {
			try {
				settingData.resendTokens = JSON.parse(settingData.resendTokens);
			} catch {
				settingData.resendTokens = {};
			}
		} else if (!settingData.resendTokens || typeof settingData.resendTokens !== 'object') {
			settingData.resendTokens = {};
		}

		let domainList = c.env.domain;

		if (typeof domainList === 'string') {
			try {
				domainList = JSON.parse(domainList)
			} catch (error) {
				throw new BizError(t('notJsonDomain'));
			}
		}

		if (!c.env.domain) {
			throw new BizError(t('noDomainVariable'));
		}

		domainList = domainList.map(item => '@' + item);
		settingData.domainList = domainList;


		let linuxdoSwitch = c.env.linuxdo_switch;
		let projectLink = c.env.project_link;

		if (typeof linuxdoSwitch === 'string' && linuxdoSwitch === 'true') {
			linuxdoSwitch = true
		} else if (linuxdoSwitch === true) {
			linuxdoSwitch = true
		} else {
			linuxdoSwitch = false
		}

		console.log(projectLink)

		if (typeof projectLink === 'string' && projectLink === 'false') {
			projectLink = false
		} else if (projectLink === false) {
			projectLink = false
		} else {
			projectLink = true
		}

		settingData.projectLink = projectLink;

		settingData.linuxdoClientId = c.env.linuxdo_client_id;
		settingData.linuxdoCallbackUrl = c.env.linuxdo_callback_url;
		settingData.linuxdoSwitch = linuxdoSwitch;

		if (typeof settingData.emailPrefixFilter === 'string') {
			settingData.emailPrefixFilter = settingData.emailPrefixFilter.split(",").filter(Boolean);
		} else if (!Array.isArray(settingData.emailPrefixFilter)) {
			settingData.emailPrefixFilter = [];
		}

		c.set?.('setting', settingData);
		return settingData;
	},

	async get(c, showSiteKey = false) {

		const [settingRow, recordList] = await Promise.all([
			this.query(c),
			verifyRecordService.selectListByIP(c).catch(() => [])
		]);

		const res = { ...settingRow };

		if (!showSiteKey) {
			res.siteKey = res.siteKey ? `${res.siteKey.slice(0, 6)}******` : null;
		}

		res.secretKey = res.secretKey ? `${res.secretKey.slice(0, 6)}******` : null;

		let maskedTokens = {};
		if (typeof res.resendTokens === 'string') {
			try {
				maskedTokens = JSON.parse(res.resendTokens);
			} catch {
				maskedTokens = {};
			}
		} else if (res.resendTokens && typeof res.resendTokens === 'object') {
			maskedTokens = { ...res.resendTokens };
		}

		Object.keys(maskedTokens).forEach(key => {
			const tokenVal = maskedTokens[key];
			maskedTokens[key] = typeof tokenVal === 'string' ? `${tokenVal.slice(0, 12)}******` : '';
		});
		res.resendTokens = maskedTokens;

		res.s3AccessKey = res.s3AccessKey ? `${res.s3AccessKey.slice(0, 12)}******` : null;
		res.s3SecretKey = res.s3SecretKey ? `${res.s3SecretKey.slice(0, 12)}******` : null;
		res.hasR2 = !!c.env.r2

		let regVerifyOpen = false
		let addVerifyOpen = false

		const records = Array.isArray(recordList) ? recordList : [];
		records.forEach(row => {
			if (row.type === verifyRecordType.REG) {
				regVerifyOpen = row.count >= res.regVerifyCount
			}
			if (row.type === verifyRecordType.ADD) {
				addVerifyOpen = row.count >= res.addVerifyCount
			}
		})

		res.regVerifyOpen = regVerifyOpen
		res.addVerifyOpen = addVerifyOpen

		res.storageType = await r2Service.storageType(c);

		return res;
	},

	async set(c, params) {
		const settingData = await this.query(c);
		let existingTokens = {};
		if (typeof settingData.resendTokens === 'string') {
			try { existingTokens = JSON.parse(settingData.resendTokens); } catch { existingTokens = {}; }
		} else if (settingData.resendTokens && typeof settingData.resendTokens === 'object') {
			existingTokens = settingData.resendTokens;
		}
		let resendTokens = { ...existingTokens, ...(params.resendTokens || {}) };
		Object.keys(resendTokens).forEach(domain => {
			if (!resendTokens[domain]) delete resendTokens[domain];
		});

		if (Array.isArray(params.emailPrefixFilter)) {
			params.emailPrefixFilter = params.emailPrefixFilter.join(',');
		}

		if (Array.isArray(params.aiCodeFilter)) {
			params.aiCodeFilter = params.aiCodeFilter.join(',');
		}

		if (typeof params.webhookHeaders === 'object' && params.webhookHeaders !== null) {
			params.webhookHeaders = JSON.stringify(params.webhookHeaders);
		}

		params.resendTokens = JSON.stringify(resendTokens);
		try {
			await orm(c).update(setting).set({ ...params }).returning().get();
		} catch (updateErr) {
			console.warn('ORM update failed, ensuring columns exist:', updateErr.message);
			await this.selectSettingRow(c);
			await orm(c).update(setting).set({ ...params }).run();
		}
		await this.refresh(c);
	},

	async setBlacklist(c, params) {
		const { blackSubject, blackContent, blackFrom } = params;
		try {
			await orm(c).update(setting).set({ blackSubject, blackContent, blackFrom }).run();
		} catch (e) {
			await this.selectSettingRow(c);
			await orm(c).update(setting).set({ blackSubject, blackContent, blackFrom }).run();
		}
		await this.refresh(c);
		return this.get(c);
	},

	async deleteBackground(c) {

		const { background } = await this.query(c);
		if (!background) return

		if (background.startsWith('http')) {
			await orm(c).update(setting).set({ background: '' }).run();
			await this.refresh(c)
			return;
		}

		if (background) {
			await r2Service.delete(c,background)
			await orm(c).update(setting).set({ background: '' }).run();
			await this.refresh(c)
		}
	},

	async setBackground(c, params) {

		let { background } = params

		await this.deleteBackground(c);

		if (background && !background.startsWith('http')) {

			const file = fileUtils.base64ToFile(background)

			const arrayBuffer = await file.arrayBuffer();
			background = constant.BACKGROUND_PREFIX + await fileUtils.getBuffHash(arrayBuffer) + fileUtils.getExtFileName(file.name);


			await r2Service.putObj(c, background, arrayBuffer, {
				contentType: file.type,
				cacheControl: `public, max-age=31536000, immutable`,
				contentDisposition: `inline; filename="${file.name}"`
			});

		}

		await orm(c).update(setting).set({ background }).run();
		await this.refresh(c);
		return background;
	},

	async websiteConfig(c) {

		const settingRow = await this.get(c, true);
		const token = await userContext.getToken(c);

		return {
			register: settingRow.register,
			title: settingRow.title,
			manyEmail: settingRow.manyEmail,
			addEmail: settingRow.addEmail,
			autoRefresh: settingRow.autoRefresh,
			addEmailVerify: settingRow.addEmailVerify,
			registerVerify: settingRow.registerVerify,
			send: settingRow.send,
			r2Domain: settingRow.r2Domain,
			siteKey: settingRow.siteKey,
			background: settingRow.background,
			loginOpacity: settingRow.loginOpacity,
			domainList: settingRow.loginDomain === 1 && !token ? [] : settingRow.domainList,
			regKey: settingRow.regKey,
			regVerifyOpen: settingRow.regVerifyOpen,
			addVerifyOpen: settingRow.addVerifyOpen,
			noticeTitle: settingRow.noticeTitle,
			noticeContent: settingRow.noticeContent,
			noticeType: settingRow.noticeType,
			noticeDuration: settingRow.noticeDuration,
			noticePosition: settingRow.noticePosition,
			noticeWidth: settingRow.noticeWidth,
			noticeOffset: settingRow.noticeOffset,
			notice: settingRow.notice,
			loginDomain: settingRow.loginDomain,
			linuxdoClientId: settingRow.linuxdoClientId,
			linuxdoCallbackUrl: settingRow.linuxdoCallbackUrl,
			linuxdoSwitch: settingRow.linuxdoSwitch,
			minEmailPrefix: settingRow.minEmailPrefix,
			projectLink: settingRow.projectLink
		};
	}
};

export default settingService;
