import { protoRoot, PARAMS, Request } from '../../../../protos'
import store from '../../../../store'
import axios from 'axios'
import { getUrl } from '..'
import { R } from '../../../../store/config'
import { apiUrls } from './apiUrls'

export const v1 = {
	async getAppToken(params: protoRoot.saass.GetAppToken.IRequest) {
		const { apiNames } = store.getState().api
		return await Request<protoRoot.saass.GetAppToken.IResponse>(
			{
				method: 'POST',
				// config: requestConfig,
				data: PARAMS<protoRoot.saass.GetAppToken.IRequest>(
					params,
					protoRoot.saass.GetAppToken.Request
				),
				url: getUrl(apiNames.v1.baseUrl, apiNames.v1.getAppToken),
			},
			protoRoot.saass.GetAppToken.Response
		)
	},
	async gerUsers(params: protoRoot.user.GerUsers.IRequest) {
		const { apiNames } = store.getState().api
		return await Request<protoRoot.user.GerUsers.IResponse>(
			{
				method: 'GET',
				// config: requestConfig,
				data: PARAMS<protoRoot.user.GerUsers.IRequest>(
					params,
					protoRoot.user.GerUsers.Request
				),
				url: getUrl(apiNames.v1.baseUrl, apiNames.v1.gerUsers),
			},
			protoRoot.user.GerUsers.Response
		)
	},
}
