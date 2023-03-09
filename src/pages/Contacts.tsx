import React, { useEffect, useState } from 'react'
import { RouterProps, useNavigate, useSearchParams } from 'react-router-dom'
import logo from '../logo.svg'
import { Helmet } from 'react-helmet-async'
import './Contacts.scss'
import store, {
	RootState,
	AppDispatch,
	useAppDispatch,
	methods,
	configSlice,
	messagesSlice,
} from '../store'
import { useSelector, useDispatch } from 'react-redux'

import NewGroupComponent from '../components/NewGroup'
import AddContactComponent from '../components/AddContact'
import JoinGroupComponent from '../components/JoinGroup'

import { prompt, alert, snackbar, bindEvent } from '@saki-ui/core'
import { useTranslation } from 'react-i18next'
import { deepCopy, getInitials } from '@nyanyajs/utils'
import { TransitionGroup, CSSTransition } from 'react-transition-group'
import { eventTarget } from '../store/config'
import { protoRoot } from '../protos'
import { Query } from '../modules/methods'
import MeowWhisperCoreSDK from '../modules/MeowWhisperCoreSDK'

const ContactsPage = ({ children }: RouterProps) => {
	const { t, i18n } = useTranslation('contactsPage')
	const dispatch = useDispatch<AppDispatch>()
	const config = useSelector((state: RootState) => state.config)
	const contacts = useSelector((state: RootState) => state.contacts)
	const group = useSelector((state: RootState) => state.group)
	const mwc = useSelector((state: RootState) => state.mwc)
	const user = useSelector((state: RootState) => state.user)
	const [openLoginUserDropDownMenu, setOpenLoginUserDropDownMenu] =
		useState(false)
	const [openRegisterUserDropDownMenu, setOpenRegisterUserDropDownMenu] =
		useState(false)
	const [openAddUserDropDownMenu, setAddUserOpenDropDownMenu] = useState(false)
	const [openJoinGroupDropDownMenu, setJoinGroupOpenDropDownMenu] =
		useState(false)
	const [openNewGroupDropDownMenu, setOpenNewGroupDropDownMenu] =
		useState(false)
	const [openAddContactDropDownMenu, setOpenAddContactDropDownMenu] =
		useState(false)

	const [openContactMoreDownMenuId, setOpenContactMoreDownMenuId] = useState('')

	const [activeTabLabel, setActiveTabLabel] = useState('contacts')
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()

	useEffect(() => {
		// setTimeout(() => {
		// 	setOpenNewGroupDropDownMenu(true)
		// }, 1000)
	}, [])
	return (
		<>
			<Helmet>
				<title>
					{t('pageTitle') +
						' - ' +
						t('appTitle', {
							ns: 'common',
						})}
				</title>
			</Helmet>
			<div className={'contacts-page ' + config.deviceType}>
				<saki-page-header
					padding='0 10px'
					left
					center
					right
					title-font-size='22px'
					title={t('pageTitle')}
				>
					<div slot='right'>
						<saki-dropdown
							visible={openAddUserDropDownMenu}
							floating-direction='Left'
							ref={bindEvent({
								close: (e) => {
									setAddUserOpenDropDownMenu(false)
								},
							})}
						>
							<saki-button
								ref={bindEvent({
									tap: () => {
										setAddUserOpenDropDownMenu(true)
									},
								})}
								border='none'
								className='hydrated'
							>
								<div className='cp-add-contact-button'>
									<saki-icon
										color='#666'
										width='18px'
										height='18px'
										type='AddUser'
										margin='1px 0 0 0'
									></saki-icon>
									<span className='name'>{t('addContact')}</span>
								</div>
							</saki-button>
							<div slot='main'>
								<saki-menu
									ref={bindEvent({
										selectvalue: async (e) => {
											console.log(e.detail.value)
											switch (e.detail.value) {
												case 'NewGroup':
													setOpenNewGroupDropDownMenu(true)
													break
												case 'AddContact':
													setOpenAddContactDropDownMenu(true)
													break
												case 'JoinGroup':
													setJoinGroupOpenDropDownMenu(true)
													break

												default:
													break
											}
											setAddUserOpenDropDownMenu(false)
										},
									})}
								>
									<saki-menu-item padding='10px 18px' value={'AddContact'}>
										<div className='cp-add-contact-item'>
											<saki-icon
												color='#666'
												width='16px'
												height='16px'
												type='AddUser'
											></saki-icon>
											<span
												style={{
													whiteSpace: 'nowrap',
												}}
											>
												{t('addContact')}
											</span>
										</div>
									</saki-menu-item>
									<saki-menu-item padding='10px 18px' value={'JoinGroup'}>
										<div className='cp-add-contact-item'>
											<saki-icon
												color='#666'
												width='18px'
												height='18px'
												type='JoinGroup'
											></saki-icon>
											<span
												style={{
													whiteSpace: 'nowrap',
												}}
											>
												{t('joinGroup')}
											</span>
										</div>
									</saki-menu-item>
									<saki-menu-item padding='10px 18px' value={'NewGroup'}>
										<div className='cp-add-contact-item'>
											<saki-icon
												color='#666'
												width='18px'
												height='18px'
												type='Group'
											></saki-icon>
											<span
												style={{
													whiteSpace: 'nowrap',
												}}
											>
												{t('newGroup')}
											</span>
										</div>
									</saki-menu-item>
								</saki-menu>
							</div>
						</saki-dropdown>
					</div>
				</saki-page-header>
				<saki-tabs
					type='Flex'
					// header-background-color='rgb(245, 245, 245)'
					// header-max-width='740px'
					// header-border-bottom='none'
					header-padding='0 10px'
					header-item-min-width='80px'
					active-tab-label={activeTabLabel}
					ref={bindEvent({
						tap: (e) => {
							console.log('tap', e)
							setActiveTabLabel(e.detail.label)
							// setOpenDropDownMenu(false)
						},
					})}
				>
					<saki-tabs-item
						font-size='14px'
						label='contacts'
						name={t('pageTitle')}
					>
						{/* padding='20px 16px' */}
						<saki-page-container full>
							<div slot='header'></div>
							<div slot='main'>
								<saki-scroll-view mode='Auto'>
									<saki-page-main align='center' full>
										<div className='contact-list-page'>
											<saki-chat-layout-contact show-letter>
												{contacts.list.map((v, i) => {
													return (
														<saki-chat-layout-contact-item
															key={i}
															letter={v.userInfo?.letter}
															avatar={v.userInfo?.avatar}
															avatar-text={
																!v.userInfo?.avatar ? v.userInfo?.nickname?.toUpperCase() : ''
															}
															nickname={v.userInfo?.nickname}
															username={'@' + v.userInfo?.uid}
															display-icons-layout-width='auto'
															display-icons-layout
															display-center-layout
															last-seen-time={MeowWhisperCoreSDK.methods.getLastSeenTime(
																Number(v?.userInfo?.lastSeenTime)
															)}
															hover-background-color='rgb(247,247,247)'
														>
															<div className='clp-contact-icons' slot='right'>
																<saki-button
																	margin={'0 0 0 6px'}
																	type='CircleIconGrayHover'
																	ref={bindEvent({
																		tap: () => {
																			dispatch(
																				configSlice.actions.setModalUserId(
																					String(v.userInfo?.uid)
																				)
																			)
																		},
																	})}
																>
																	<saki-icon
																		color='#666'
																		type='Magnifier'
																		margin='2px 0 0 0'
																	></saki-icon>
																</saki-button>
																<saki-button
																	ref={bindEvent({
																		tap: () => {
																			dispatch(
																				methods.messages.setChatDialogue({
																					roomId: v.id || '',
																					type: 'Contact',
																					id: v.userInfo?.uid || '',
																					showMessageContainer: true,
																					unreadMessageCount: -2,
																					sort: -1,
																				})
																			)
																			// history?.('/chat')
																			navigate?.(
																				Query(
																					'/',
																					{
																						roomId: v.id || '',
																					},
																					searchParams
																				),
																				{}
																			)
																		},
																	})}
																	margin={'0 0 0 6px'}
																	type='CircleIconGrayHover'
																>
																	<saki-icon
																		color='#666'
																		type='Message'
																		width='19px'
																		height='19px'
																		margin='2px 0 0 0'
																	></saki-icon>
																</saki-button>
																<saki-button
																	margin={'0 0 0 6px'}
																	type='CircleIconGrayHover'
																>
																	<saki-icon
																		color='#666'
																		type='Call'
																		margin='2px 0 0 0'
																	></saki-icon>
																</saki-button>

																<saki-dropdown
																	visible={openContactMoreDownMenuId === v.id}
																	direction='Bottom'
																	ref={bindEvent({
																		close: () => {
																			setOpenContactMoreDownMenuId('')
																		},
																	})}
																>
																	<saki-button
																		ref={bindEvent({
																			tap: () => {
																				setOpenContactMoreDownMenuId(v.id || '')
																			},
																		})}
																		margin={'0 0 0 6px'}
																		type='CircleIconGrayHover'
																	>
																		<saki-icon
																			color='#666'
																			type='More'
																			width='20px'
																			height='20px'
																			margin='2px 0 0 0'
																		></saki-icon>
																	</saki-button>
																	<div
																		className="'friend-item-i-r-more'"
																		slot='main'
																	>
																		<saki-menu
																			ref={bindEvent({
																				selectvalue: async (e) => {
																					const f = contacts.list.filter(
																						(v) =>
																							v.id === openContactMoreDownMenuId
																					)?.[0]
																					const u = f?.users?.filter((v) => {
																						return v.uid !== user.userInfo.uid
																					})?.[0]?.userInfo
																					if (f && u) {
																						console.log(e, f, u)
																						switch (e.detail.value) {
																							case 'Delete':
																								dispatch(
																									methods.contacts.deleteContact(
																										{
																											uid: String(u.uid),
																										}
																									)
																								)
																								break

																							default:
																								break
																						}
																					}

																					setOpenContactMoreDownMenuId('')
																				},
																			})}
																		>
																			<saki-menu-item value='Delete'>
																				<span>{t('deleteContact')}</span>
																			</saki-menu-item>
																		</saki-menu>
																	</div>
																</saki-dropdown>
															</div>
														</saki-chat-layout-contact-item>
													)
												})}
											</saki-chat-layout-contact>
										</div>
									</saki-page-main>
								</saki-scroll-view>
							</div>
						</saki-page-container>
					</saki-tabs-item>
					<saki-tabs-item font-size='14px' label='group' name={t('groups')}>
						<saki-page-container full>
							<div slot='header'></div>
							<div slot='main'>
								<saki-scroll-view mode='Auto'>
									<saki-page-main align='center' full>
										<div className='group-page'>
											<saki-chat-layout-contact>
												{group.list.map((v) => {
													return (
														<saki-chat-layout-contact-item
															ref={bindEvent({
																tap: () => {
																	console.log(11111111)
																	dispatch(
																		configSlice.actions.setModalGroupId(
																			String(v.id)
																		)
																	)
																},
															})}
															key={v.id}
															avatar={v.avatar}
															avatar-text={!v.avatar ? v.name?.toUpperCase() : ''}
															nickname={v.name}
															username={''}
															display-icons-layout-width='auto'
															display-icons-layout
															display-center-layout
															last-seen-time={MeowWhisperCoreSDK.methods.getLastMessageFullTime(
																Number(v.lastMessageTime)
															)}
															hover-background-color='rgb(247,247,247)'
														>
															<div className='clp-contact-icons' slot='right'>
																<saki-button
																	margin={'0 0 0 6px'}
																	type='CircleIconGrayHover'
																	ref={bindEvent({
																		tap: () => {
																			dispatch(
																				configSlice.actions.setModalGroupId(
																					String(v.id)
																				)
																			)
																		},
																	})}
																>
																	<saki-icon
																		color='#666'
																		type='Magnifier'
																		margin='2px 0 0 0'
																	></saki-icon>
																</saki-button>

																<saki-button
																	ref={bindEvent({
																		tap: () => {
																			dispatch(
																				methods.messages.setChatDialogue({
																					roomId: v.id || '',
																					type: 'Group',
																					id: v.id || '',
																					showMessageContainer: true,
																					unreadMessageCount: -2,
																					sort: -1,
																				})
																			)
																			// history?.('/chat')
																			navigate?.(
																				Query(
																					'/',
																					{
																						roomId: v.id || '',
																					},
																					searchParams
																				),
																				{}
																			)
																		},
																	})}
																	margin={'0 0 0 6px'}
																	type='CircleIconGrayHover'
																>
																	<saki-icon
																		color='#666'
																		type='Message'
																		width='19px'
																		height='19px'
																		margin='2px 0 0 0'
																	></saki-icon>
																</saki-button>

																<saki-dropdown
																	visible={openContactMoreDownMenuId === v.id}
																	direction='Bottom'
																	ref={bindEvent({
																		close: () => {
																			setOpenContactMoreDownMenuId('')
																		},
																	})}
																>
																	<saki-button
																		ref={bindEvent({
																			tap: () => {
																				setOpenContactMoreDownMenuId(v.id || '')
																			},
																		})}
																		margin={'0 0 0 6px'}
																		type='CircleIconGrayHover'
																	>
																		<saki-icon
																			color='#666'
																			type='More'
																			width='20px'
																			height='20px'
																			margin='2px 0 0 0'
																		></saki-icon>
																	</saki-button>
																	<div
																		className="'friend-item-i-r-more'"
																		slot='main'
																	>
																		<saki-menu
																			ref={bindEvent({
																				selectvalue: async (e) => {
																					switch (e.detail.value) {
																						case 'Delete':
																							if (
																								v.authorId === user.userInfo.uid
																							) {
																								dispatch(
																									methods.group.disbandGroup({
																										groupId: v.id || '',
																									})
																								)
																							} else {
																								dispatch(
																									methods.group.leaveGroup({
																										groupId: v.id || '',
																									})
																								)
																							}
																							break

																						default:
																							break
																					}

																					setOpenContactMoreDownMenuId('')
																				},
																			})}
																		>
																			<saki-menu-item value='Delete'>
																				<span>
																					{v.authorId === user.userInfo.uid
																						? t('disbandGroup')
																						: t('leaveGroup')}
																				</span>
																			</saki-menu-item>
																		</saki-menu>
																	</div>
																</saki-dropdown>
															</div>
														</saki-chat-layout-contact-item>
													)
												})}
											</saki-chat-layout-contact>
										</div>
									</saki-page-main>
								</saki-scroll-view>
							</div>
						</saki-page-container>
					</saki-tabs-item>
				</saki-tabs>

				<NewGroupComponent
					visible={openNewGroupDropDownMenu}
					onChange={(e) => {
						setOpenNewGroupDropDownMenu(e)
					}}
				></NewGroupComponent>

				<AddContactComponent
					visible={openAddContactDropDownMenu}
					onChange={(e) => {
						setOpenAddContactDropDownMenu(e)
					}}
				></AddContactComponent>

				<JoinGroupComponent
					visible={openJoinGroupDropDownMenu}
					onChange={(e) => {
						setJoinGroupOpenDropDownMenu(e)
					}}
				></JoinGroupComponent>
			</div>
		</>
	)
}

export default ContactsPage
