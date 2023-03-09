import { protoRoot } from '../protos'
import store, { methods } from '../store'
import qs from 'qs'

export const getDialogueInfo = (v: any) => {
	const { mwc } = store.getState()
	if (!v)
		return {
			avatar: '',
			name: '',
			bio: '',
		}
	if (v.type === 'Group') {
		const ginfo = mwc.cache.group.get(v.id || '')

		return {
			avatar: ginfo?.avatar || '',
			name: ginfo?.name || '',
			bio: '',
		}
	}
	const uinfo = mwc.cache.userInfo.get(v.id || '')

	return {
		avatar: uinfo?.userInfo?.avatar || '',
		name: uinfo?.userInfo?.nickname || '',
		bio: uinfo?.userInfo?.bio || '',
	}
}

export const Query = (
	url: string,
	query: {
		[k: string]: string
	},
	searchParams: URLSearchParams
) => {
	let obj: {
		[k: string]: string
	} = {}
	searchParams.forEach((v, k) => {
		obj[k] = v
	})
	let o = Object.assign(obj, query)
	return (
		url +
		'?' +
		qs.stringify(
			Object.keys(o).reduce(
				(fin, cur) => (o[cur] !== '' ? { ...fin, [cur]: o[cur] } : fin),
				{}
			)
		)
	)
}

export const getUnix = () => {
	return Math.round(new Date().getTime() / 1000)
}
