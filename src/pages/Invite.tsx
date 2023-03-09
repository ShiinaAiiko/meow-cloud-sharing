import React, { useEffect, useState } from 'react'
import {
	RouterProps,
	useNavigate,
	useParams,
	useSearchParams,
} from 'react-router-dom'
import logo from '../logo.svg'
import { Helmet } from 'react-helmet-async'
import './Invite.scss'
import store, {
	RootState,
	AppDispatch,
	useAppDispatch,
	methods,
	configSlice,
} from '../store'
import { useSelector, useDispatch } from 'react-redux'

import { prompt, alert, snackbar, bindEvent } from '@saki-ui/core'
import { useTranslation } from 'react-i18next'
import { Debounce, deepCopy } from '@nyanyajs/utils'
import { TransitionGroup, CSSTransition } from 'react-transition-group'
import { eventTarget } from '../store/config'
import MeowWhisperCoreSDK from '../modules/MeowWhisperCoreSDK'
import { Query } from '../modules/methods'

const SettingsPage = ({ children }: RouterProps) => {
	const [debounce] = useState(new Debounce())
	const { t, i18n } = useTranslation('SettingsPage')
	const dispatch = useDispatch<AppDispatch>()
	const config = useSelector((state: RootState) => state.config)
	const mwc = useSelector((state: RootState) => state.mwc)
	const user = useSelector((state: RootState) => state.user)
	const [openLoginUserDropDownMenu, setOpenLoginUserDropDownMenu] =
		useState(false)
	const [openRegisterUserDropDownMenu, setOpenRegisterUserDropDownMenu] =
		useState(false)

	const [uid, setUid] = useState('')
	const [uidError, setUidError] = useState('')

	const [password, setPassword] = useState('')
	const [passwordError, setPasswordError] = useState('')
	const { id } = useParams()
	const [searchParams] = useSearchParams()
	const [type, setType] = useState('')
	const [avatar, setAvatar] = useState('')
	const [name, setName] = useState('')
	const [desc, setDesc] = useState('')
	const [roomId, setRoomId] = useState('')
	const [isAdded, setIsAdded] = useState(false)

	const navigate = useNavigate()

	useEffect(() => {
		let t = searchParams.get('t') === '0' ? 'Contact' : 'Group'
		setType(t)
	}, [])

	useEffect(() => {
		console.log(
			'user.isLogin',
			user.isInit,
			user.isLogin,
			type && mwc.sdk && user.isInit
		)
		if (type && mwc.sdk && user.isInit) {
			debounce.increase(() => {
				getInfo()
			}, 300)
		}
	}, [type, mwc.sdk, user.isInit, user.isLogin])

	const getInfo = async () => {
		console.log(type)
		console.log('getInfo', avatar, name, desc)
		if (type === 'Contact') {
			const res = await mwc.sdk?.api.contact.searchContact({
				userId: id || '',
			})
			console.log('getInfores c', res)
			if (res?.code === 200) {
				const u = MeowWhisperCoreSDK.methods.formatSimpleAnonymousUserInfo(
					res.data?.userInfo
				)
				setAvatar(u?.avatar || '')
				setName(u?.nickname || '')
				setIsAdded(res.data.isFriend || false)
				setRoomId(res.data.roomId || '')
				setDesc(
					Number(u?.lastSeenTime) >= 10
						? MeowWhisperCoreSDK.methods.getLastSeenTime(
								Number(u?.lastSeenTime) || 0
						  )
						: '@' + u?.uid
				)
			}
		} else {
			const res = await mwc.sdk?.api.group.getGroupInfo({
				groupId: id || '',
			})
			console.log('getInfores g', res)
			if (res?.code === 200) {
				// const u = MeowWhisperCoreSDK.methods.formatSimpleAnonymousUserInfo(
				// 	res.data?.userInfo
				// )
				setAvatar(res.data.group?.avatar || '')
				setName(res.data.group?.name || '')
				setDesc(res.data.group?.members + ' members')
				//
				setIsAdded(
					res.data.group?.ownMemberInfo?.authorId === user.userInfo.uid
				)
				setRoomId(res.data.group?.id || '')
			}
		}
	}

	const join = async () => {
		console.log('join', roomId)
		if (type === 'Contact') {
			const add = await dispatch(
				methods.contacts.addContact({
					userId: id || '',
					remark: '',
				})
			).unwrap()
			if (add) {
				setRoomId(add)
				setIsAdded(true)
			}
		} else {
			const add = await dispatch(
				methods.group.joinGroup({
					groupId: id || '',
					uid: [user.userInfo.uid],
					remark: '',
				})
			).unwrap()
			if (add) {
				setIsAdded(true)
			}
		}
	}

	const sendMessage = () => {
		console.log('sendMessage', roomId)
		navigate?.(
			Query(
				'/',
				{
					roomId: roomId,
					t: '',
				},
				searchParams
			),
			{
				replace: !!searchParams.get('roomId'),
			}
		)
		// window.location.href = Query(
		// 	'/',
		// 	{
		// 		roomId: roomId,
		// 	},
		// 	searchParams
		// )
	}
	return (
		<>
			<Helmet>
				<title>
					{`@${name} - ${t('appTitle', {
						ns: 'common',
					})}`}
				</title>
			</Helmet>
			<div className={'invite-page ' + config.deviceType}>
				<saki-page-container padding='0 0px'>
					<div slot='main'>
						<saki-page-main align='center' max-width='500px'>
							<div className='scs-main'>
								<div className='csc-m-info'>
									<div className='csc-m-i-avatar'>
										<saki-avatar
											border-radius='50%'
											width='100px'
											height='100px'
											nickname={name}
											src={avatar}
										></saki-avatar>
									</div>
									<div className='csc-m-i-name'>
										<span>{name}</span>
									</div>
									<div className='csc-m-i-desc'>
										<span>{desc}</span>
									</div>
									<div className='csc-m-i-buttons'>
										<saki-button
											ref={bindEvent({
												tap: () => {
													if (!user.isLogin) {
														dispatch(
															configSlice.actions.setStatus({
																type: 'loginModalStatus',
																v: true,
															})
														)
														return
													}
													if (user.userInfo.uid === id) {
														navigate?.(
															Query(
																'/',
																{
																	roomId: '',
																	t: '',
																},
																searchParams
															)
														)
														return
													}
													if (isAdded) {
														sendMessage()
													} else {
														join()
													}
												},
											})}
											height='40px'
											width='200px'
											border-radius='20px'
											type='Primary'
											font-weight='700'
											loading={!name}
										>
											<span
												style={{
													fontSize: '16px',
													fontWeight: 500,
												}}
											>
												{/* 进入了的就发送消息，没有则加入 */}
												{user.userInfo.uid === id
													? '打开' +
													  t('appTitle', {
															ns: 'common',
													  })
													: isAdded
													? '发送消息'
													: type === 'Group'
													? '加入群组'
													: '添加联系人'}
											</span>
										</saki-button>
										{/* <saki-button
											height='40px'
											width='200px'
											border-radius='20px'
											type='Normal'
											margin='10px 0 0 0'
											font-size='18px'
											font-weight='600'
											border='none'
											color='var(--default-color)'
										>
											<span
												style={{
													fontSize: '16px',
													fontWeight: 500,
												}}
											>
												Download App
											</span>
										</saki-button> */}
									</div>
									{/* <div className='csc-m-i-webapp'>
											Join on web?
											<a href='/'>Launch it now</a>
										</div> */}
								</div>
							</div>
						</saki-page-main>
					</div>
				</saki-page-container>
			</div>
		</>
	)
}

export default SettingsPage
