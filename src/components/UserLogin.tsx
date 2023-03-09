import React, { useEffect, useState } from 'react'
import { RouterProps } from 'react-router-dom'
import logo from '../logo.svg'
import { Helmet } from 'react-helmet-async'
import './UserLogin.scss'
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
import { deepCopy } from '@nyanyajs/utils'
import { TransitionGroup, CSSTransition } from 'react-transition-group'
import { eventTarget } from '../store/config'

const UserLoginPage = () => {
	const { t, i18n } = useTranslation('ChatPage')
	const dispatch = useDispatch<AppDispatch>()
	const mwcSDK = useSelector(
		(state: RootState) => state.mwc.sdk
	)
	const config = useSelector((state: RootState) => state.config)

	const [pageType, setPageType] = useState('Login')

	const [history, setHistory] = useState<string[]>(['Login'])

	// 生成一个随机UID。其他项目可直接传用户自己的UID
	const [uid, setUid] = useState('')
	const [uidError, setUidError] = useState('')

	const [nickname, setNickname] = useState('')
	const [nicknameError, setNicknameError] = useState('')

	const [password, setPassword] = useState('')
	const [passwordError, setPasswordError] = useState('')

	const [retypePassword, setRetypePassword] = useState('')
	const [retypePasswordError, setRetypePasswordError] = useState('')

	useEffect(() => {
		if (config.general.openLoginUserDropDownMenu) {
			setPageType('Register')
			setHistory(['Login', 'Register'])
			setUid('100000')
			setNickname('小爱一号')
			setPassword('zsyUY3asawZJmPq')
			setRetypePassword('zsyUY3asawZJmPq')
			// setPageType('Login')
			// setHistory(['Login'])
			// setUid('')
			// setUidError('')
			// setPassword('')
			// setPasswordError('')
			// setRetypePassword('')
			// setRetypePasswordError('')
		}
	}, [config.general.openLoginUserDropDownMenu])

	const filterTitle = () => {
		switch (pageType) {
			case 'Register':
				return 'Register'
			case 'Login':
				return 'Login'
			case 'ForgetPwd':
				return 'Forget password?'

			default:
				break
		}
	}
	const createAccount = () => {
		// mwcSDK?.api.createAccount()
	}

	return (
		<>
			<div className={'user-login-component ' + config.deviceType}>
				<saki-modal
					visible={config.general.openLoginUserDropDownMenu}
					width='100%'
					height='100%'
					max-width={config.deviceType === 'Mobile' ? '100%' : '420px'}
					max-height={config.deviceType === 'Mobile' ? '100%' : '420px'}
					mask
					border-radius={config.deviceType === 'Mobile' ? '0px' : ''}
					border={config.deviceType === 'Mobile' ? 'none' : ''}
					mask-closable='false'
					background-color='#fff'
					ref={bindEvent({
						close: (e) => {
							dispatch(configSlice.actions.setOpenLoginUserDropDownMenu(false))
						},
					})}
				>
					<div className={'login-user-component ' + config.deviceType}>
						<div className='lu-header'>
							<saki-modal-header
								border
								back-icon={history.length !== 1}
								close-icon={history.length === 1}
								ref={bindEvent({
									back() {
										setPageType(history[history.length - 2])
										setHistory(history.slice(0, history.length - 1))
									},
									close() {
										dispatch(
											configSlice.actions.setOpenLoginUserDropDownMenu(false)
										)
									},
								})}
								title={filterTitle()}
							/>
						</div>
						<div className='lu-main'>
							{pageType === 'Login' ? (
								<div className='lu-m-warp'>
									<div className='lu-m-title'>Welcome back!</div>

									<saki-input
										ref={bindEvent({
											changevalue: (e: CustomEvent) => {
												const value = e.detail.trim()
												if (!value) {
													setUidError(
														t('emailOrUsernameCannotBeEmpty', {
															ns: 'prompt',
														})
													)
													return
												}
												setUid(value)
												setUidError('')
											},
										})}
										value={uid}
										placeholder={'Uid'}
										height='56px'
										margin='20px 0 0'
										font-size='16px'
										placeholder-animation='MoveUp'
										error={uidError}
									></saki-input>

									<saki-input
										ref={bindEvent({
											changevalue: (e: CustomEvent) => {
												const value = e.detail.trim()
												if (!value) {
													setPasswordError(
														t('emailOrUsernameCannotBeEmpty', {
															ns: 'prompt',
														})
													)
													return
												}
												setPassword(value)
												setPasswordError('')
											},
										})}
										value={password}
										placeholder={'Password'}
										type='Password'
										height='56px'
										margin='20px 0 0'
										font-size='16px'
										placeholder-animation='MoveUp'
										error={passwordError}
									></saki-input>

									<saki-button
										ref={bindEvent({
											tap: () => {},
										})}
										margin='20px 0 0'
										height='40px'
										font-size='14px'
										type='Primary'
									>
										Next
									</saki-button>
									<div className='l-m-more'>
										<div className='l-m-m-left'></div>
										<div className='l-m-m-right'>
											<saki-button
												ref={bindEvent({
													tap: () => {
														setPageType('ForgetPwd')
														setHistory(history.concat(['ForgetPwd']))
													},
												})}
												font-size='14px'
												color='#888'
												border='none'
												padding='4px 10px'
												hover-color='#666'
												active-color='#444'
											>
												Forget password?
											</saki-button>
											<saki-button
												ref={bindEvent({
													tap: () => {
														setPageType('Register')
														setHistory(history.concat(['Register']))
													},
												})}
												font-size='14px'
												color='#888'
												border='none'
												padding='4px 10px'
												hover-color='#666'
												active-color='#444'
											>
												Register
											</saki-button>
										</div>
									</div>
								</div>
							) : pageType === 'Register' ? (
								<saki-scroll-view
									max-height={config.deviceType === 'Mobile' ? '100%' : '394px'}
									mode='Normal'
								>
									<div className='lu-m-warp'>
										<saki-input
											ref={bindEvent({
												changevalue: (e: CustomEvent) => {
													const value = e.detail.trim()
													if (!value) {
														setUidError(
															t('emailOrUsernameCannotBeEmpty', {
																ns: 'prompt',
															})
														)
														return
													}
													setUid(value)
													setUidError('')
												},
											})}
											value={uid}
											placeholder={'Uid'}
											height='56px'
											margin='20px 0 0'
											font-size='16px'
											placeholder-animation='MoveUp'
											error={uidError}
										></saki-input>
										<saki-input
											ref={bindEvent({
												changevalue: (e: CustomEvent) => {
													const value = e.detail.trim()
													if (!value) {
														setNicknameError(
															t('emailOrUsernameCannotBeEmpty', {
																ns: 'prompt',
															})
														)
														return
													}
													setNickname(value)
													setNicknameError('')
												},
											})}
											value={nickname}
											placeholder={'Nickname'}
											height='56px'
											margin='20px 0 0'
											font-size='16px'
											placeholder-animation='MoveUp'
											error={nicknameError}
										></saki-input>
										<saki-input
											ref={bindEvent({
												changevalue: (e: CustomEvent) => {
													const value = e.detail.trim()
													if (!value) {
														setPasswordError(
															t('emailOrUsernameCannotBeEmpty', {
																ns: 'prompt',
															})
														)
														return
													}
													setPassword(value)
													setPasswordError('')
												},
											})}
											value={password}
											placeholder={'Password'}
											height='56px'
											margin='20px 0 0'
											font-size='16px'
											placeholder-animation='MoveUp'
											auto-complete='new-password'
											type='Password'
											error={passwordError}
										></saki-input>
										<saki-input
											ref={bindEvent({
												changevalue: (e: CustomEvent) => {
													const value = e.detail.trim()
													if (!value) {
														setRetypePasswordError(
															t('emailOrUsernameCannotBeEmpty', {
																ns: 'prompt',
															})
														)
														return
													}
													setRetypePassword(value)
													setRetypePasswordError('')
												},
											})}
											value={retypePassword}
											placeholder={'Retype password'}
											height='56px'
											margin='20px 0 0'
											font-size='16px'
											placeholder-animation='MoveUp'
											auto-complete='new-password'
											type='Password'
											error={retypePasswordError}
										></saki-input>
										<saki-button
											ref={bindEvent({
												tap: () => {
													createAccount()
												},
											})}
											margin='20px 0 60px'
											height='40px'
											font-size='14px'
											type='Primary'
										>
											Create an account
										</saki-button>
									</div>
								</saki-scroll-view>
							) : (
								''
							)}
						</div>
					</div>
				</saki-modal>
			</div>
		</>
	)
}

export default UserLoginPage
