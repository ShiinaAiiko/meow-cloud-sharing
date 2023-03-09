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
} from '../store'
import './SelectMembers.scss'
import { useTranslation } from 'react-i18next'
import { prompt, alert, snackbar } from '@saki-ui/core'
import { eventTarget } from '../store/config'
import { SyncOff } from './Icon'
import { validation } from '@nyanyajs/utils'
import { protoRoot } from '../protos'
import { FriendItem } from '../store/contacts'

interface Member {
	uid: string
	avatar: string
	nickname: string
	bio: string
	selected: boolean
	lastSeenTime: string
}

const SelectMembersComponent = ({
	title,
	onCancel,
	cancelButtonText = 'Back',
	createButtonText = 'Add',
	createButtonLoading,
	onSelectMembers,
	members,
}: {
	members: Member[]
	title: string
	cancelButtonText: string
	createButtonText: string
	createButtonLoading: boolean
	onCancel: (visible: boolean) => void
	onSelectMembers: (
		uids: {
			type: 'Join' | 'Leave'
			uid: string
		}[]
	) => void
}) => {
	const { t, i18n } = useTranslation('index-header')
	const config = useSelector((state: RootState) => state.config)
	const contacts = useSelector((state: RootState) => state.contacts)
	
	const appStatus = useSelector((state: RootState) => state.config.status)
	const user = useSelector((state: RootState) => state.user)

	const dispatch = useDispatch<AppDispatch>()
	const [avatar, setAvatar] = useState<{ base64Url: string; blob: Blob }>()
	const [keyword, setKeyword] = useState('')
	const [isSelectMembers, setIsSelectMembers] = useState(true)
	const [selectMembers, setSelectMember] = useState<Member[]>([])

	const location = useLocation()
	const history = useNavigate()

	const [membersMap, setMembersMap] = useState<{
		[k: string]: Member
	}>({})

	useEffect(() => {
		let obj: {
			[k: string]: Member
		} = {}
		members.forEach((v) => {
			obj[v.uid] = v
		})
		setSelectMember(members.filter((v) => v.selected))
		setMembersMap(obj)
	}, [members])

	// const selectMembers = () => {}

	return (
		<div className={'select-members-component ' + config.deviceType}>
			<div className='ngd-title'>
				<div className='title'>{title}</div>
				<div className='count'>({selectMembers.length})</div>
			</div>

			<div className='ngd-search'>
				<saki-input
					ref={bindEvent({
						changevalue: (v) => {
							setKeyword(v.detail)
						},
					})}
					value={keyword}
					padding='16px 0'
					placeholder={t('search', {
						ns: 'common',
					})}
					close-icon
					type='Search'
				></saki-input>
			</div>
			<div className='ngd-select-contacts'>
				{selectMembers.map((v, i) => {
					return (
						<saki-chat-layout-contact-tag
							key={i}
							avatar-text={!v?.avatar ? v?.nickname : ''}
							nickname={v?.nickname}
							avatar={v?.avatar}
							delete-icon
							margin='0 6px 6px 0'
							ref={bindEvent({
								delete: () => {
									console.log('delete')

									setSelectMember(
										selectMembers.filter((sv) => sv.uid !== v.uid)
									)
								},
							})}
						></saki-chat-layout-contact-tag>
					)
				})}
			</div>
			<div className='ngd-contacts'>
				<saki-scroll-view mode='Inherit'>
					<saki-chat-layout-contact>
						<saki-checkbox
							ref={bindEvent({
								selectvalue: (e) => {
									console.log(
										e,
										e.detail.values,
										// friendsMap,
										// e.detail.values.map((v: any) => {
										// 	return friendsMap[v]
										// })
									)
									console.log(membersMap)
									setSelectMember(
										e.detail.values.map((v: any) => {
											return membersMap[v]
										})
									)
								},
							})}
							value={selectMembers.map((v, i) => v.uid).join(',')}
							type='Checkbox'
							flex-direction='Column'
						>
							{members
								.filter((v) => {
									return (
										String(v?.uid)?.indexOf(keyword) >= 0 ||
										String(v?.nickname)?.indexOf(keyword) >= 0
									)
								})
								.map((v, i) => {
									return (
										<saki-checkbox-item
											margin='0'
											padding='0 10px'
											hover-background-color='#eee'
											key={i}
											disabled={v.selected}
											value={v.uid}
										>
											<saki-chat-layout-contact-item
												padding='0 10px 0 6px'
												avatar-text={!v?.avatar ? v?.nickname : ''}
												nickname={v?.nickname?.toUpperCase()}
                        avatar={v?.avatar}
												nickname-font-size='14px'
												hover-background-color='rgba(0,0,0,0)'
												username={v.bio}
												display-icons-layout-width='auto'
												last-seen-time={''}
											></saki-chat-layout-contact-item>
										</saki-checkbox-item>
									)
								})}
						</saki-checkbox>
					</saki-chat-layout-contact>
				</saki-scroll-view>
			</div>
			<div className='ngd-buttons'>
				<saki-button
					ref={bindEvent({
						tap: () => {
							onCancel?.(false)
						},
					})}
					disabled={createButtonLoading}
					padding='6px 18px'
					font-size='14px'
					type='Normal'
				>
					{cancelButtonText}
				</saki-button>
				<saki-button
					ref={bindEvent({
						tap: () => {
							onSelectMembers?.(
								selectMembers.map((v) => {
									return {
										type: 'Join',
										uid: String(v?.uid),
									}
								})
							)
						},
					})}
					// disabled={!selectMembers.length}
					padding='6px 18px'
					loading={createButtonLoading}
					margin='0 0 0 10px'
					font-size='14px'
					type='Primary'
				>
					{createButtonText}
				</saki-button>
			</div>
		</div>
	)
}

export default SelectMembersComponent
