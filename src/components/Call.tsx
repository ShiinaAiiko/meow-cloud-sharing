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
	contactsSlice,
	callSlice,
} from '../store'
import './Call.scss'
import { useTranslation } from 'react-i18next'
import { prompt, alert, snackbar } from '@saki-ui/core'
import { eventTarget } from '../store/config'
import { SyncOff } from './Icon'
import * as Ion from 'ion-sdk-js/lib/connector'
import moment from 'moment'
import { SFUClient, SFUSignal, SFUStream } from '@nyanyajs/utils/dist/ionSfuSdk'
import { Stream } from 'stream'
import { getDialogueInfo } from '../modules/methods'
import { deepCopy, QueueLoop } from '@nyanyajs/utils'
import { meowWhisperCore } from '../config'

const CallComponent = () => {
	const { t, i18n } = useTranslation('call')
	const call = useSelector((state: RootState) => state.call)
	const config = useSelector((state: RootState) => state.config)
	const mwc = useSelector((state: RootState) => state.mwc)
	const appStatus = useSelector((state: RootState) => state.config.status)
	const user = useSelector((state: RootState) => state.user)

	const dispatch = useDispatch<AppDispatch>()

	const location = useLocation()
	const history = useNavigate()
	const [queueloop] = useState(
		new QueueLoop({
			delayms: 1000,
		})
	)

	const [isShowDevices, setIsShowDevices] = useState(false)
	const [isHideIcon, setIsHideIcon] = useState(false)

	const newCall = async () => {
		try {
			let count = 0

			if (
				call.options.participatingUsers.filter((v) => {
					return v.caller && v.uid === user.userInfo.uid
				}).length
			) {
				queueloop.increase(
					're-invite',
					async () => {
						count++
						if (count >= 30) {
							hangup()
							return
						}
						if (count % 5 === 0) {
							console.log('开始重新邀请')
							await mwc.sdk?.api.message.startCalling({
								roomId: call.options.roomId,
								type: call.options.type,
								participants: call.options.participatingUsers,
							})
						}
					},
					{
						loop: true,
					}
				)
			}

			dispatch(methods.call.connect(true))
		} catch (error) {
			console.log(error)
		}
	}

	useEffect(() => {
		if (call.enable) {
			console.log('callOptions.enable', call.enable)
			newCall()
		}
	}, [call.enable])
	useEffect(() => {
		console.log('config.notification.callSound', config.notification.callSound)
		if (call.enable) {
			switch (call.status) {
				case -1:
					config.notification.callSound && call.sound.play()
					break
				case 0:
					queueloop.decrease('re-invite')
					config.notification.callSound && call.sound.stop()

					call.time.startTime &&
						queueloop.increase(
							'setCallCurrentTimestamp',
							setCallCurrentTimestamp,
							{
								loop: true,
							}
						)
					break

				default:
					break
			}
		}
	}, [call.status])

	useEffect(() => {
		if (call.reconnectionCount >= 3) {
			console.log('开始挂断', call.reconnectionCount)
			// hangup()
		}
		console.log('重连中')
		console.log(
			'连接次数',
			Object.keys(call.connectionQualityStats).length &&
				Object.keys(call.connectionQualityStats)
					.map((v) => {
						return call.connectionQualityStats[v]?.count?.connected
					})
					?.reduce((p, c) => {
						return p + c
					})
		)
		console.log(
			'中断次数',
			Object.keys(call.connectionQualityStats).length &&
				Object.keys(call.connectionQualityStats)
					.map((v) => {
						return call.connectionQualityStats[v]?.count?.disconnect
					})
					?.reduce((p, c) => {
						return p + c
					})
		)
	}, [call.reconnectionCount])

	useEffect(() => {
		console.log('call.deviceStatus', call.deviceStatus)
	}, [call.deviceStatus])

	const setCallCurrentTimestamp = () => {
		dispatch(
			callSlice.actions.setTime({
				type: 'currentTime',
				value: Math.floor(new Date().getTime() / 1000),
			})
		)
		// setCallModal({
		// 	...callModal,
		// 	currentTimestamp: Math.floor(new Date().getTime() / 1000),
		// })
	}

	const hangup = () => {
		queueloop.decreaseAll()
		dispatch(methods.call.hangup(true))
	}

	const getTime = (second: number = 0) => {
		if (second < 0) second = 0
		let time = moment.duration(second, 'seconds') //得到一个对象，里面有对应的时分秒等时间对象值
		let hours = time.hours() || 0
		let minutes = time.minutes() || 0
		let seconds = time.seconds() || 0
		return moment({ h: hours, m: minutes, s: seconds }).format('HH:mm:ss')
	}

	const changeStreamId = (e: CustomEvent<any>) => {
		// console.log('changeStreamId', e)
		if (e.detail.streamId) {
			const stream = call.streams.filter(
				(v) => v.stream && v.stream.id === e.detail.streamId
			)
			const el: any = e.target
			if (stream.length && stream[0].stream) {
				el.setStream(stream[0].stream)
				if (stream[0].stream.type === 'Local' && stream[0].isMain) {
					el?.setMediaDevices?.(call.mediaDevices)
				}
			}
		}
	}

	const info = mwc.cache.userInfo.get(call.options.participatingUsers[0]?.uid)

	const formatDeviceSubtitle = (kind: string) => {
		switch (kind) {
			case 'Audio':
				return t('audio')
			case 'Video':
				return t('video')
			case 'ScreenShare':
				return t('screenShare')

			default:
				return ''
		}
	}

	const connectionStatus = (s: SFUStream, v: any) => {
		console.log('connectionStatus', s, v)
		// s.setStatus(v)
		// dispatch(
		// 	callSlice.actions.setStreamStatus({
		// 		s,
		// 		v,
		// 	})
		// )
	}

	const repushStream = (s: SFUStream) => {
		// console.log('repushStream', s.id, s)
		// s.republish()
	}

	return (
		<>
			{/* modal部分 */}
			<saki-modal
				visible={call.enable}
				hide={call.modal.showSmallWindow}
				width='100%'
				height='100%'
				max-width={config.deviceType === 'Mobile' ? '100%' : '800px'}
				max-height={config.deviceType === 'Mobile' ? '100%' : '450px'}
				mask
				border-radius={config.deviceType === 'Mobile' ? '0px' : ''}
				border={config.deviceType === 'Mobile' ? 'none' : ''}
				mask-closable='false'
				background-color='#fff'
				ref={bindEvent({
					close: (e) => {
						console.log('close', e)
						// hangup()
					},
				})}
			>
				<saki-call-container>
					<div className='call-header' slot='header'>
						<saki-call-header
							ref={bindEvent({
								minimize: () => {
									dispatch(callSlice.actions.minimize())
								},
							})}
							center-text={
								call.status === -2
									? t('hangingUp')
									: call.status === 0
									? getTime(call.time.currentTime - call.time.startTime)
									: t('awaitingResponse')
							}
						>
							<div className='call-h-right' slot='right'>
								<saki-row align-items='center'>
									<saki-col>
										<div
											style={{
												color: '#fff',
												fontSize: '12px',
											}}
										>
											{call.options.participatingUsers.length}{' '}
											{t('members', {
												ns: 'modal',
											})}
										</div>
									</saki-col>
									<saki-col margin='0 0 0 6px'>
										<div
											ref={
												bindEvent({
													click: () => {
														setIsHideIcon(!isHideIcon)
													},
												}) as any
											}
											style={{
												margin: '3px 0 0 0',
											}}
											title='Hide bottom button'
											className='call-h-r-hide'
										>
											{isHideIcon ? (
												<saki-icon color='#fff' type='EyeSlash'></saki-icon>
											) : (
												<saki-icon color='#fff' type='Eye'></saki-icon>
											)}
										</div>
									</saki-col>
								</saki-row>
							</div>
						</saki-call-header>
					</div>
					<div className='call-main' slot='main'>
						<div
							ref={
								bindEvent({
									click: () => {
										setIsHideIcon(!isHideIcon)
									},
								}) as any
							}
							className='call-video'
						>
							{call.streams
								.filter((item) => item?.isMain)
								.map((v, i) => {
									return (
										<saki-call-main-video
											ref={bindEvent({
												changestreamid: (e) => {
													console.log(e)
													changeStreamId(e)
												},
												connectionStatus: (e) => {
													v.stream && connectionStatus(v.stream, e.detail)
												},
												repushStream: () => {
													v.stream && repushStream(v.stream)
												},
											})}
											key={i}
											background-color='#272822'
											stream-id={v.stream?.id}
										></saki-call-main-video>
									)
								})}
						</div>
					</div>
					<div className='call-info' slot='call-info'>
						{(call.status === -1 ||
							(call.deviceStatus.video || call.deviceStatus.screenShare
								? false
								: false)) &&
						info?.userInfo?.nickname ? (
							<saki-call-info
								avatar={info?.userInfo?.avatar}
								nickname={info?.userInfo?.nickname}
							></saki-call-info>
						) : (
							''
						)}
					</div>
					<div className='call-hint' slot='call-hint'>
						{(call.reconnectionTime > 0 && call.status !== -1) ||
						call.status === -2 ? (
							<div className='network-status'>
								{call.status === -2 ? '聊天已结束' : '网络异常，正在重连'}
							</div>
						) : (
							''
						)}
					</div>
					<div className='call-small-window' slot='small-window'>
						{call.streams
							.filter((item) => !item?.isMain)
							.map((v, i) => {
								return (
									<saki-call-mini-video
										ref={bindEvent({
											changestreamid: (e) => {
												console.log(e)
												changeStreamId(e)
												// switchMainVideoStream(streamId) {
												//   // console.log('id', id)
												// }
											},
											tap: () => {
												console.log('切换视频')
												dispatch(
													callSlice.actions.switchMainVideoStream(
														v?.stream?.id || ''
													)
												)
												// call.switchMainVideoStream(item.stream?.id)
											},
											connectionStatus: (e) => {
												v.stream && connectionStatus(v.stream, e.detail)
											},
											repushStream: () => {
												v.stream && repushStream(v.stream)
											},
										})}
										key={i}
										width='160px'
										height='90px'
										background-color='#272822'
										stream-id={v?.stream?.id || ''}
										avatar={v.userInfo.avatar}
										avatar-text={v.userInfo.nickname}
										nickname={v.userInfo.nickname}
										className='mini-video'
									/>
								)
							})}
					</div>
					<div className='call-footer' slot='footer'>
						<saki-call-footer
							ref={bindEvent({
								switchmic: () => {
									dispatch(
										callSlice.actions.switchAudio(!call.deviceStatus.audio)
									)
								},
								switchvideo: () => {
									dispatch(
										callSlice.actions.switchVideo(!call.deviceStatus.video)
									)
								},
								switchscreenshare: () => {
									dispatch(
										callSlice.actions.switchScreenShare(
											!call.deviceStatus.screenShare
										)
									)
								},
								message: () => {
									console.log('发送消息')

									dispatch(callSlice.actions.minimize())
								},
								hangup: () => {
									hangup()
								},
							})}
							hide={isHideIcon}
							mic-is-on={call.deviceStatus.audio}
							video-is-on={call.deviceStatus.video}
							screen-share-is-on={call.deviceStatus.screenShare}
						>
							<div slot='left'>
								<saki-dropdown
									ref={bindEvent({
										close: () => {
											setIsShowDevices(false)
										},
									})}
									visible={isShowDevices}
									direction='Bottom'
								>
									<div className='call-f-left'>
										<div
											ref={
												bindEvent({
													click: () => {
														setIsShowDevices(true)
													},
												}) as any
											}
											className='call-f-l-switch-device'
										>
											{call.deviceStatus.video ? (
												<span>{call.mediaDevices.activeVideoDevice}</span>
											) : (
												''
											)}

											{!call.deviceStatus.video ? (
												<span>{call.mediaDevices.activeAudioDevice}</span>
											) : (
												''
											)}

											<svg
												className={
													'call-f-l-s-icon ' + (isShowDevices ? 'active' : '')
												}
												viewBox='0 0 1024 1024'
												version='1.1'
												xmlns='http://www.w3.org/2000/svg'
												p-id='4078'
												width='10'
												height='10'
											>
												<path
													d='M549.1 732.1L943.4 371c21.5-19.7 22.9-53 3.3-74.4-19.7-21.5-53-22.9-74.4-3.3L513.5 621.9 153.7 293.6c-21.5-19.6-54.8-18.1-74.4 3.4-19.6 21.5-18.1 54.8 3.4 74.4l394.9 360.5c0.8 0.7 1.7 1.5 2.5 2.1 19.9 16.4 49.4 16.1 69-1.9z'
													fill=''
													p-id='4079'
												></path>
											</svg>
										</div>
									</div>
									<div className='friend-item-i-r-more' slot='main'>
										<saki-menu
											ref={bindEvent({
												selectvalue: (e) => {
													console.log(e, isShowDevices)
													setIsShowDevices(false)
													dispatch(
														callSlice.actions.switchDevice({
															index: e.detail.index,
															deviceId: e.detail.value,
														})
													)
												},
												close: () => {
													setIsShowDevices(false)
												},
											})}
										>
											{call.mediaDevices.list.map((v, i) => {
												return (
													<saki-menu-item
														key={i}
														active={
															v.label === call.mediaDevices.activeAudioDevice ||
															v.label === call.mediaDevices.activeVideoDevice
														}
														subtitle={formatDeviceSubtitle(v.subtitle)}
														value={v.deviceId}
													>
														{v.label}
													</saki-menu-item>
												)
											})}
										</saki-menu>
									</div>
								</saki-dropdown>
							</div>
						</saki-call-footer>
					</div>
				</saki-call-container>
			</saki-modal>
			{/* 是否允许通讯 */}
			{/* 悬浮窗部分 */}
			{call.modal.showSmallWindow ? (
				<saki-floating-container
					margin-x='20'
					margin-y='40'
					keep-aside
					default-x='10000'
					default-y='0'
				>
					<div slot='container'>
						<saki-call-floating
							ref={bindEvent({
								maximize: () => {
									console.log('maximize')
									dispatch(callSlice.actions.maximize())
								},
								message: () => {
									console.log('发送消息')

									// dispatch(
									//   callSlice.actions.setModal({
									//     type: 'hideModal',
									//     value: true,
									//   })
									// )
									// dispatch(
									//   callSlice.actions.setModal({
									//     type: 'showSmallWindow',
									//     value: true,
									//   })
									// )
								},
								hangup: () => {
									hangup()
								},
							})}
							time={
								call.status === -2
									? 'Hanging up...'
									: call.status === 0
									? getTime(call.time.currentTime - call.time.startTime)
									: 'Awaiting response...'
							}
							avatar={info.userInfo?.avatar}
							nickname={info.userInfo?.nickname}
							button-text='Hang Up'
						>
							{/* {call.streams
								.filter((s) => s?.isMinimize)
								.map((v, i) => {
									return (
										<saki-call-main-video
											ref={bindEvent({
												changestreamid: (e) => {
													console.log(e)
													changeStreamId(e)
												},
												connectionStatus: (e) => {
													v.stream && connectionStatus(v.stream, e.detail)
												},
												repushStream: () => {
													v.stream && repushStream(v.stream)
												},
											})}
											key={i}
											background-color='#272822'
											stream-id={v.stream?.id}
										></saki-call-main-video>
									)
								})} */}
						</saki-call-floating>
					</div>
				</saki-floating-container>
			) : (
				''
			)}
		</>
	)
}

export default CallComponent
