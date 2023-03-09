import React, { useEffect, useState } from 'react'
import { bindEvent } from '../modules/bindEvent'

import { useSelector, useDispatch } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import store, {
	RootState,
	AppDispatch,
	useAppDispatch,
	methods,
	configSlice,
	userSlice,
	messagesSlice,
} from '../store'
import './DeleteMessages.scss'
import { useTranslation } from 'react-i18next'
import { prompt, alert, snackbar } from '@saki-ui/core'
import { eventTarget } from '../store/config'
import { SyncOff } from './Icon'
import { protoRoot } from '../protos'
import MeowWhisperCoreSDK from '../modules/MeowWhisperCoreSDK'

const DeleteMessagesComponent = () => {
	const { t, i18n } = useTranslation('index-header')
	const config = useSelector((state: RootState) => state.config)
	const contacts = useSelector((state: RootState) => state.contacts)
	const mwc = useSelector((state: RootState) => state.mwc)
	const messages = useSelector((state: RootState) => state.messages)
	const appStatus = useSelector((state: RootState) => state.config.status)
	const user = useSelector((state: RootState) => state.user)

	const [isAllUser, setIsAllUser] = useState(false)
	const [groupInfo, setGroupInfo] = useState<protoRoot.group.IGroup>()
	const [members, setMembers] = useState<protoRoot.group.IGroupMembers[]>([])
	const [membersLoading, setMembersLoading] = useState('loading')

	const dispatch = useDispatch<AppDispatch>()

	const location = useLocation()
	const history = useNavigate()

	useEffect(() => {
		setIsAllUser(false)
	}, [messages.deleteMessage.list.length])

	return (
		<saki-modal
			visible={!!messages.deleteMessage.list.length}
			width='100%'
			max-width={'320px'}
			mask
			border={config.deviceType === 'Mobile' ? 'none' : ''}
			mask-closable='false'
			background-color='#fff'
			ref={bindEvent({
				close: () => {
					dispatch(configSlice.actions.setModalGroupId(''))
				},
			})}
		>
			<div className={'delete-messages-component ' + config.deviceType}>
				<saki-row padding='20px 20px' flex-direction='column' width='100%'>
					<saki-col padding='10px 0 0'>
						{messages.deleteMessage.list.includes('AllMessages') ? (
							<>
								<p>确定要删除所有的消息吗？</p>
							</>
						) : (
							<>
								<p>想要删除此条消息吗？</p>
							</>
						)}
					</saki-col>
					<saki-col flex-direction='column' padding='20px 0'>
						<div>
							<saki-checkbox
								ref={bindEvent({
									selectvalue: (e) => {
										setIsAllUser(e.detail.values.includes('AllUser'))
									},
								})}
								value={isAllUser ? ['AllUser'] : ['']}
								type='Checkbox'
							>
								<saki-checkbox-item padding='0 4px' value='AllUser'>
									<span>
										同时为
										{MeowWhisperCoreSDK.methods.getType(
											messages.deleteMessage.roomId || ''
										) === 'Contact'
											? '好友'
											: '群组内成员'}
										删除这些消息吗？
									</span>
								</saki-checkbox-item>
							</saki-checkbox>
						</div>

						<p
							style={{
								fontSize: '13px',
								color: '#999',
								margin: '10px 0 0px 0',
							}}
						>
							* 非自己发的消息无法为好友删除
						</p>
					</saki-col>
					<saki-col width='100%'>
						<saki-row width='100%' justify-content='flex-end'>
							<saki-col>
								<saki-button
									ref={bindEvent({
										tap: () => {
											dispatch(
												messagesSlice.actions.setDeleteMessage({
													roomId: '',
													list: [],
												})
											)
										},
									})}
									padding='6px 18px'
									font-size='14px'
									type='Normal'
								>
									Cancel
								</saki-button>
							</saki-col>
							<saki-col>
								<saki-button
									ref={bindEvent({
										tap: async () => {
											await dispatch(
												methods.messages.deleteMessages({
													roomId: messages.deleteMessage.roomId,
													deleteAll: false,
													messageIdList: messages.deleteMessage.list,
													type: isAllUser ? 'AllUser' : 'MySelf',
													expirationTime: 100 * 365 * 24 * 60 * 60,
												})
											)
											dispatch(
												messagesSlice.actions.setDeleteMessage({
													roomId: '',
													list: [],
												})
											)
										},
									})}
									// disabled={!selectMembers.length}
									padding='6px 18px'
									margin='0 0 0 10px'
									font-size='14px'
									type='Primary'
								>
									Delete
								</saki-button>
							</saki-col>
						</saki-row>
					</saki-col>
				</saki-row>
			</div>
		</saki-modal>
	)
}

export default DeleteMessagesComponent
