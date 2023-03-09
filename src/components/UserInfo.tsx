import React, { useEffect, useState } from 'react'
import { bindEvent } from '../modules/bindEvent'

import { useSelector, useDispatch } from 'react-redux'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import store, {
	RootState,
	AppDispatch,
	useAppDispatch,
	methods,
	configSlice,
	userSlice,
} from '../store'
import './UserInfo.scss'
import { useTranslation } from 'react-i18next'
import { prompt, alert, snackbar } from '@saki-ui/core'
import { eventTarget } from '../store/config'
import { SyncOff } from './Icon'
import { protoRoot } from '../protos'
import { FriendItem } from '../store/contacts'
import { deepCopy } from '@nyanyajs/utils'
import MeowWhisperCoreSDK from '../modules/MeowWhisperCoreSDK'
import { Query } from '../modules/methods'
import { baseUrl } from '../config'

const UserInfoComponent = () => {
	const { t, i18n } = useTranslation('modal')
	const config = useSelector((state: RootState) => state.config)
	const contacts = useSelector((state: RootState) => state.contacts)
	const mwc = useSelector((state: RootState) => state.mwc)
	const appStatus = useSelector((state: RootState) => state.config.status)
	const user = useSelector((state: RootState) => state.user)

	const [activeTabLabel, setActiveTabLabel] = useState('')
	const [uInfo, setUInfo] = useState<FriendItem>()
	const [isFriend, setIsFriend] = useState<boolean>(false)
	const [allowWatchContactList, setAllowWatchContactList] = useState(false)
	const [members, setMembers] = useState<protoRoot.group.IGroupMembers[]>([])
	const [membersLoading, setMembersLoading] = useState('loading')

	const dispatch = useDispatch<AppDispatch>()

	const location = useLocation()
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()

	useEffect(() => {
		if (config.modal.userId) {
			setActiveTabLabel('')
			getUserInfo()
		}
	}, [config.modal.userId])
	useEffect(() => {
		if (allowWatchContactList) {
			checkIsFriend()
		}
	}, [contacts.list])

	const checkIsFriend = () => {
		let cListU = contacts.list.filter((v) => {
			return v.userInfo?.uid === config.modal.userId
		})?.[0]
		setIsFriend(!!cListU)

		cListU && setUInfo(cListU)
	}

	const getUserInfo = async () => {
		console.log(config.modal.userId)

		// 先从缓存
		// 再从联系人
		checkIsFriend()
		// 最后获取最新

		const res = await dispatch(
			methods.contacts.getContactInfo({
				userId: config.modal.userId,
			})
		).unwrap()
		// console.log(res)
		if (!res?.id) {
			setIsFriend(false)
		}
		if (res) {
			setUInfo({
				...uInfo,
				...res,
			})
		} else {
			setUInfo(deepCopy(contacts.defaultContact))

			snackbar({
				message: '该用户不存在',
				autoHideDuration: 2000,
				vertical: 'top',
				horizontal: 'center',
				backgroundColor: 'var(--saki-default-color)',
				color: '#fff',
			}).open()
		}
		console.log('getUserInfo', res)
		// if (res?.code === 200 && res?.data?.group) {
		// 	setUserInfo(res?.data?.group)
		// }
	}

	const getMembers = async () => {
		// if (members?.length !== 0) return
		setMembersLoading('loading')
		const res = await mwc.sdk?.api.group.getGroupMembers({
			groupId: config.modal.userId,
		})
		console.log('getMembers', res)
		if (res?.code === 200) {
			setMembers(res?.data?.list || [])
		}
		setMembersLoading('loaded')
	}

	useEffect(() => {
		if (activeTabLabel === 'Members') {
			getMembers()
		}
	}, [activeTabLabel])

	const addContact = async () => {
		setAllowWatchContactList(true)
		await dispatch(
			methods.contacts.addContact({
				userId: config.modal.userId,
				remark: '',
			})
		)
		setAllowWatchContactList(false)
	}

	return (
		<saki-modal
			visible={!!config.modal.userId}
			width='100%'
			height='100%'
			max-width={config.deviceType === 'Mobile' ? '100%' : '420px'}
			max-height={config.deviceType === 'Mobile' ? '100%' : '560px'}
			mask
			border-radius={config.deviceType === 'Mobile' ? '0px' : ''}
			border={config.deviceType === 'Mobile' ? 'none' : ''}
			mask-closable='false'
			background-color='#fff'
			ref={bindEvent({
				close: () => {
					dispatch(configSlice.actions.setModalUserId(''))
				},
			})}
		>
			<div className={'user-info-component ' + config.deviceType}>
				<saki-modal-header
					ref={bindEvent({
						close: () => {
							dispatch(configSlice.actions.setModalUserId(''))
						},
					})}
					close-icon
					title={t('userInfo')}
				></saki-modal-header>
				<div className='uic-container'>
					<div className='uic-header'>
						<saki-row width='100%' align-items='center'>
							<saki-col span={2}>
								<saki-row align-items='center'>
									<saki-col span={0}>
										<saki-avatar
											width='70px'
											height='70px'
											border-radius='50%'
											src={uInfo?.userInfo?.avatar}
											nickname={
												!uInfo?.userInfo?.avatar
													? uInfo?.userInfo?.nickname?.toUpperCase()
													: ''
											}
										></saki-avatar>
									</saki-col>
									<saki-col padding='0 0 0 10px' span={1}>
										<div className='uic-h-info'>
											<div className='uic-h-i-nickname text-two-elipsis'>
												{uInfo?.userInfo?.nickname}
											</div>
											{(uInfo?.lastMessageTime || 0) > 0 ? (
												<div className='uic-h-i-memebers'>
													{MeowWhisperCoreSDK.methods.getLastSeenTime(
														Number(uInfo?.userInfo?.lastSeenTime)
													) || uInfo?.userInfo?.bio}
												</div>
											) : (
												''
											)}
										</div>
									</saki-col>
								</saki-row>
							</saki-col>
							<saki-col justify-content='flex-end' span={0}>
								<saki-button
									ref={bindEvent({
										tap: () => {
											console.log('isfriend', isFriend)
											// addContact()
										},
									})}
									style={{
										display:
											!isFriend && user.userInfo.uid !== config.modal.userId
												? 'block'
												: 'none',
									}}
									width='50px'
									height='50px'
									type='CircleIconGrayHover'
								>
									<saki-icon
										width='20px'
										height='20px'
										type='AddUser'
										color='#999'
									></saki-icon>
								</saki-button>
							</saki-col>
						</saki-row>
					</div>
					<saki-tabs
						type='Flex'
						full
						// header-background-color='rgb(245, 245, 245)'
						header-max-width='740px'
						// header-border-bottom='none'
						header-padding='0 10px'
						header-item-min-width='80px'
						active-tab-label={activeTabLabel}
						ref={bindEvent({
							tap: (e) => {
								console.log('changename tap', e)
								setActiveTabLabel(e.detail.label)
								// setOpenDropDownMenu(false)
							},
						})}
					>
						<saki-tabs-item font-size='14px' label='Info' name={t('info')}>
							<saki-scroll-view mode='Inherit'>
								<div className='uic-info-page'>
									<saki-card hide-title hide-subtitle>
										<saki-title
											level='5'
											color='default'
											margin='10px 0 10px 0'
										>
											{t('uid')}
										</saki-title>
										<div>{uInfo?.userInfo?.uid}</div>
										<saki-title
											level='5'
											color='default'
											margin='10px 0 10px 0'
										>
											{t('bio')}
										</saki-title>
										<div>
											{uInfo?.userInfo?.bio ||
												t('nothingIsWritten', {
													ns: 'common',
												})}
										</div>
									</saki-card>
									{isFriend || user.userInfo.uid === config.modal.userId ? (
										<saki-row
											margin='30px 0 0 0'
											align-items='center'
											flex-direction='column'
										>
											<saki-col>
												<saki-button
													ref={bindEvent({
														tap: () => {
															dispatch(
																methods.messages.setChatDialogue({
																	roomId: uInfo?.id || '',
																	type: 'Contact',
																	id: uInfo?.userInfo?.uid || '',
																	showMessageContainer: true,
																	unreadMessageCount: -2,
																	sort: -1,
																})
															)
															navigate?.(
																Query(
																	'/',
																	{
																		roomId: uInfo?.id || '',
																	},
																	searchParams
																),
																{
																	replace: !!searchParams.get('roomId'),
																}
															)
															dispatch(configSlice.actions.setModalUserId(''))
														},
													})}
													width='160px'
													padding='8px 0px'
													margin='0 0 0 10px'
													font-size='14px'
													type='Primary'
												>
													{t('sendMessage', {
														ns: 'common',
													})}
												</saki-button>
											</saki-col>
											<saki-col>
												<saki-button
													ref={bindEvent({
														tap: () => {
															dispatch(
																methods.tools.copy({
																	content:
																		baseUrl +
																		'/invite/' +
																		uInfo?.userInfo?.uid +
																		'?t=0',
																})
															)
														},
													})}
													width='160px'
													padding='8px 0px'
													margin='10px 0 0 10px'
													font-size='14px'
													type='Normal'
												>
													{t('share', {
														ns: 'common',
													})}
												</saki-button>
											</saki-col>
										</saki-row>
									) : (
										<saki-row
											margin='30px 0 0 0'
											align-items='center'
											flex-direction='column'
										>
											<saki-col>
												<saki-button
													ref={bindEvent({
														tap: () => {
															addContact()
														},
													})}
													width='160px'
													padding='8px 0px'
													margin='0 0 0 10px'
													font-size='14px'
													type='Primary'
												>
													{t('addContact', {
														ns: 'contactsPage',
													})}
												</saki-button>
											</saki-col>
										</saki-row>
									)}
								</div>
							</saki-scroll-view>
						</saki-tabs-item>
						<saki-tabs-item
							font-size='14px'
							label='Settings'
							name={t('settings')}
						>
							<saki-scroll-view mode='Inherit'>
								<div className='uic-settings-page'>
									<saki-row
										margin='10px 0 0 0'
										align-items='center'
										flex-direction='column'
									>
										<saki-col>
											{isFriend && user.userInfo.uid !== config.modal.userId ? (
												<saki-button
													ref={bindEvent({
														tap: async () => {
															await dispatch(
																methods.contacts.deleteContact({
																	uid: String(uInfo?.userInfo?.uid),
																})
															)
															checkIsFriend()
														},
													})}
													width='160px'
													padding='8px 0px'
													margin='10px 0 0 10px'
													font-size='14px'
													color='var(--saki-default-color)'
													type='Normal'
												>
													{t('delete', {
														ns: 'common',
													})}
												</saki-button>
											) : (
												''
											)}
										</saki-col>
									</saki-row>
									<div className='uic-s-buttons'></div>
								</div>
							</saki-scroll-view>
						</saki-tabs-item>
					</saki-tabs>
				</div>
			</div>
		</saki-modal>
	)
}

export default UserInfoComponent
