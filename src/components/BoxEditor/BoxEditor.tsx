import { useState, useEffect, useMemo } from 'react'
import { useUIStore } from '../../stores/uiStore'
import { usePresetStore } from '../../stores/presetStore'
import { BoxConfigForm } from './BoxConfigForm'
import { BoxPreview } from './BoxPreview'
import { CharacterEditor } from '../CharacterEditor/CharacterEditor'
import { decomposeSyllable, isHangul } from '../../utils/hangulUtils'
import type { BoxConfig, Part } from '../../types'
import styles from './BoxEditor.module.css'

export function BoxEditor() {
  const {
    editingPresetId,
    setEditingPresetId,
    setViewMode,
    inputText,
    selectedCharIndex,
    editMode,
    setEditMode,
    setEditingJamo
  } = useUIStore()
  const { getPresetById, updatePreset } = usePresetStore()

  const preset = editingPresetId ? getPresetById(editingPresetId) : undefined

  // 로컬 draft 상태 (저장 전까지 store 변경 안 함)
  const [draftBox, setDraftBox] = useState<Record<string, BoxConfig>>({})

  // 프리셋이 로드되면 초기화
  useEffect(() => {
    if (preset) {
      setDraftBox({ ...preset.box })
    }
  }, [preset])

  // 프리셋이 없으면 빈 상태 표시
  if (!preset) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📝</div>
          <p className={styles.emptyText}>편집할 프리셋을 선택해주세요</p>
        </div>
      </div>
    )
  }

  const handleBoxChange = (part: Part, prop: keyof BoxConfig, value: number) => {
    setDraftBox((prev) => ({
      ...prev,
      [part]: {
        ...prev[part],
        [prop]: value,
      },
    }))
  }

  const handleSave = () => {
    updatePreset(preset.id, { box: draftBox })

    // defaultPresets.ts 형식으로 콘솔에 출력
    const boxEntries = Object.entries(draftBox)
      .map(([key, value]) => {
        return `      ${key}: { x: ${value.x}, y: ${value.y}, width: ${value.width}, height: ${value.height} },`
      })
      .join('\n')

    const presetCode = `  {
    id: '${preset.id}',
    name: '${preset.name}',
    layoutType: '${preset.layoutType}',
    isDefault: ${preset.isDefault},
    box: {
${boxEntries}
    },
  },`

    console.log('\n📋 defaultPresets.ts에 붙여넣기용:\n')
    console.log(presetCode)

    alert('프리셋이 저장되었습니다! (콘솔에서 코드 확인)')
    setViewMode('presets')
    setEditingPresetId(null)
  }

  const handleReset = () => {
    if (preset) {
      setDraftBox({ ...preset.box })
    }
  }

  const handleCancel = () => {
    setViewMode('presets')
    setEditingPresetId(null)
  }

  const handleEditJamo = (type: 'choseong' | 'jungseong' | 'jongseong', char: string) => {
    setEditMode('character')
    setEditingJamo(type, char)
  }

  // 선택된 음절 찾기 (레이아웃 타입 일치 시 사용)
  const selectedSyllable = useMemo(() => {
    if (!inputText || !preset) return null

    const hangulChars = inputText.split('').filter(isHangul)
    const charAtIndex = hangulChars[selectedCharIndex]

    if (!charAtIndex) return null

    const syllable = decomposeSyllable(charAtIndex)
    
    // 레이아웃 타입이 일치하는 경우에만 반환
    if (syllable.layoutType === preset.layoutType) {
      return syllable
    }

    return null
  }, [inputText, selectedCharIndex, preset])

  return (
    <div className={styles.container}>
      {/* 모드 토글 */}
      <div className={styles.modeToggle}>
        <button
          className={editMode === 'layout' ? styles.modeActive : ''}
          onClick={() => setEditMode('layout')}
        >
          레이아웃 편집
        </button>
        <button
          className={editMode === 'character' ? styles.modeActive : ''}
          onClick={() => setEditMode('character')}
        >
          문자 편집
        </button>
      </div>

      {editMode === 'layout' ? (
        <>
          {/* 헤더 */}
          <div className={styles.header}>
            <h2 className={styles.title}>박스 편집</h2>
            <p className={styles.presetName}>{preset.name}</p>
          </div>

      {/* 미리보기 */}
      <div className={styles.previewSection}>
        <span className={styles.sectionTitle}>미리보기</span>
        <BoxPreview
          layoutType={preset.layoutType}
          boxes={draftBox}
          syllable={selectedSyllable || undefined}
          onEditJamo={handleEditJamo}
        />
      </div>

      {/* 박스 설정 폼 */}
      <div className={styles.formSection}>
        <span className={styles.sectionTitle}>박스 설정</span>
        <BoxConfigForm
          layoutType={preset.layoutType}
          boxes={draftBox}
          onChange={handleBoxChange}
        />
      </div>

          {/* 버튼 그룹 */}
          <div className={styles.buttonGroup}>
            <button className={styles.resetButton} onClick={handleReset}>
              초기화
            </button>
            <button className={styles.cancelButton} onClick={handleCancel}>
              취소
            </button>
            <button className={styles.saveButton} onClick={handleSave}>
              저장
            </button>
          </div>
        </>
      ) : (
        <CharacterEditor />
      )}
    </div>
  )
}
