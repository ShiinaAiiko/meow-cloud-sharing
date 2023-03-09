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
import './NewGroup.scss'
import { useTranslation } from 'react-i18next'
import { prompt, alert, snackbar } from '@saki-ui/core'
import { eventTarget } from '../store/config'
import { SyncOff } from './Icon'
import { validation } from '@nyanyajs/utils'
import { protoRoot } from '../protos'
import { FriendItem } from '../store/contacts'
import SelectMembersComponent from './SelectMembers'
import MeowWhisperCoreSDK from '../modules/MeowWhisperCoreSDK'

const NewGroupComponent = ({
	visible,
	onChange,
}: {
	visible: boolean
	onChange: (visible: boolean) => void
}) => {
	const { t, i18n } = useTranslation('contactsPage')
	const mwc = useSelector((state: RootState) => state.mwc)
	const config = useSelector((state: RootState) => state.config)
	const contacts = useSelector((state: RootState) => state.contacts)
	
	const appStatus = useSelector((state: RootState) => state.config.status)
	const user = useSelector((state: RootState) => state.user)

	const dispatch = useDispatch<AppDispatch>()

	const [avatar, setAvatar] = useState<{ base64Url: string; blob: Blob }>()
	const [name, setName] = useState('')
	const [isSelectMembers, setIsSelectMembers] = useState(false)
	const [createButtonLoading, setCreateButtonLoading] = useState(false)
	const [selectMembers, setSelectMember] = useState<FriendItem[]>([])

	const location = useLocation()
	const history = useNavigate()

	useEffect(() => {
		setAvatar({
			base64Url: '',
			blob: new Blob(),
		})
		setName('')
		setIsSelectMembers(false)
		setCreateButtonLoading(false)
	}, [visible])

	const avatarOutput = (src: { base64Url: string; blob: Blob }) => {
		if (!src?.blob) return
		setAvatar(src)
		// 获取Blob
	}

	const create = async (
		uids: {
			type: 'Join' | 'Leave'
			uid: string
		}[]
	) => {
		console.log(name, avatar, uids)
		if (createButtonLoading) return
		setCreateButtonLoading(true)

		const res = await mwc.sdk?.api.group.newGroup({
			name,
			avatar: '',
			members: uids,
		})
		console.log(res)
		if (res?.code === 200 || res?.code === 10303) {
			snackbar({
				message: '群组创建成功',
				autoHideDuration: 2000,
				vertical: 'top',
				horizontal: 'center',
				backgroundColor: 'var(--saki-default-color)',
				color: '#fff',
			}).open()
		} else {
			snackbar({
				message: '群组创建失败',
				autoHideDuration: 2000,
				vertical: 'top',
				horizontal: 'center',
				backgroundColor: 'var(--saki-default-color)',
				color: '#fff',
			}).open()
		}
		onChange?.(false)
	}

	return (
		<saki-modal
			visible={visible}
			width='100%'
			height='100%'
			max-width={config.deviceType === 'Mobile' ? '100%' : '420px'}
			max-height={
				config.deviceType === 'Mobile'
					? 'auto'
					: isSelectMembers
					? '520px'
					: '170px'
			}
			mask
			border-radius={config.deviceType === 'Mobile' ? '0px' : ''}
			border={config.deviceType === 'Mobile' ? 'none' : ''}
			mask-closable='false'
			background-color='#fff'
			ref={bindEvent({
				close: (e) => {
					onChange?.(false)
				},
			})}
		>
			<div
				style={{
					width: '100%',
					height: '100%',
				}}
			>
				{isSelectMembers ? (
					<SelectMembersComponent
						title={t('addMembers')}
						members={
							contacts.list.map((v) => {
								return {
									uid: v.userInfo?.uid || '',
									avatar: v.userInfo?.avatar || '',
									nickname: v.userInfo?.nickname || '',
									bio:
										(v?.lastSeenTime || 0) > 0
											? MeowWhisperCoreSDK.methods.getLastSeenTime(
													Number(v.lastSeenTime)
											  ) || ''
											: '',
									selected: false,
									lastSeenTime: '',
								}
							}) || []
						}
						onCancel={(e) => {
							if (!createButtonLoading) {
								setIsSelectMembers(false)
							}
						}}
						cancelButtonText={t('back', {
              ns: 'common',
            })}
						createButtonText={t('create', {
              ns: 'common',
            })}
						createButtonLoading={createButtonLoading}
						onSelectMembers={(uids) => {
							create(uids)
						}}
					></SelectMembersComponent>
				) : (
					<div className={'new-group-dropdown ' + config.deviceType}>
						<div className='ngd-item'>
							{/* <saki-avatar
								ref={bindEvent({
									output: (e) => {
										console.log(e)
										avatarOutput(e.detail)
									},
								})}
								border-radius='50%'
								width='60px'
								height='60px'
								crop-container-width='600px'
								crop-container-height='450px'
								outpur-width='400'
								outpur-height='400'
								output-quality='0.8'
								src={avatar?.base64Url || ''}
								edit-icon
								edit-icon-show-mode={avatar?.base64Url ? 'Hover' : 'Always'}
								crop
							></saki-avatar> */}
							<saki-input
								ref={bindEvent({
									changevalue: (e) => {
										setName(e.detail)
									},
								})}
								value={name}
								type='Text'
								height='56px'
								placeholder={t('groupName')}
								placeholder-animation='MoveUp'
							></saki-input>
						</div>
						<div className='ngd-buttons'>
							<saki-button
								ref={bindEvent({
									tap: () => {
										onChange?.(false)
									},
								})}
								padding='6px 18px'
								font-size='14px'
								type='Normal'
							>
								{t('cancel', {
									ns: 'common',
								})}
							</saki-button>
							<saki-button
								ref={bindEvent({
									tap: () => {
										console.log(name)
										let message = ''
										if (!name) {
											message = '未输入群组名称'
										}
										if (message) {
											snackbar({
												message: message,
												autoHideDuration: 2000,
												vertical: 'top',
												horizontal: 'center',
												backgroundColor: 'var(--saki-default-color)',
												color: '#fff',
											}).open()
											return
										}
										setIsSelectMembers(true)
									},
								})}
								padding='6px 18px'
								margin='0 0 0 10px'
								font-size='14px'
								type='Primary'
							>
								{t('next', {
									ns: 'common',
								})}
							</saki-button>
						</div>
					</div>
				)}
			</div>
		</saki-modal>
	)
}

export default NewGroupComponent
