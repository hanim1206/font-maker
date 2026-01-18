import { useState, useEffect, useMemo } from 'react'
import { useUIStore } from '../../stores/uiStore'
import { useLayoutStore } from '../../stores/layoutStore'
import { CHOSEONG_MAP, JUNGSEONG_MAP, JONGSEONG_MAP } from '../../data/Hangul'
import { CharacterPreview } from '../CharacterEditor/CharacterPreview'
import { StrokeList } from '../CharacterEditor/StrokeList'
import { StrokeEditor } from '../CharacterEditor/StrokeEditor'
import { StrokeInspector } from '../CharacterEditor/StrokeInspector'
import type { StrokeData, JamoData, BoxConfig } from '../../types'
import styles from './JamoEditor.module.css'

function getJamoMap(type: 'choseong' | 'jungseong' | 'jongseong'): Record<string, JamoData> {
  switch (type) {
    case 'choseong':
      return CHOSEONG_MAP
    case 'jungseong':
      return JUNGSEONG_MAP
    case 'jongseong':
      return JONGSEONG_MAP
  }
}

function generateStrokeCode(strokes: StrokeData[], char: string, type: string): string {
  const formatStroke = (s: StrokeData) => {
    const fn = s.direction === 'horizontal' ? 'h' : 'v'
    return `      ${fn}('${s.id}', ${s.x}, ${s.y}, ${s.width}, ${s.height}),`
  }

  // 혼합 중성인지 확인
  const verticalJungseong = ['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅣ', 'ㅐ', 'ㅒ', 'ㅔ', 'ㅖ']
  const horizontalJungseong = ['ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ']
  const isMixed = type === 'jungseong' && !verticalJungseong.includes(char) && !horizontalJungseong.includes(char)

  if (isMixed) {
    // 혼합 중성의 경우, 원본 데이터에서 horizontalStrokes와 verticalStrokes에 속하는 획 ID 확인
    const jamoMap = getJamoMap('jungseong')
    const originalJamo = jamoMap[char]
    
    if (originalJamo?.horizontalStrokes && originalJamo?.verticalStrokes) {
      // 원본의 horizontalStrokes와 verticalStrokes에 속하는 획 ID 수집
      const horizontalStrokeIds = new Set(originalJamo.horizontalStrokes.map(s => s.id))
      const verticalStrokeIds = new Set(originalJamo.verticalStrokes.map(s => s.id))
      
      // 편집된 strokes를 horizontalStrokes와 verticalStrokes로 분리
      const horizontalStrokes = strokes.filter(s => horizontalStrokeIds.has(s.id))
      const verticalStrokes = strokes.filter(s => verticalStrokeIds.has(s.id))
      
      const horizontalLines = horizontalStrokes.map(formatStroke).join('\n')
      const verticalLines = verticalStrokes.map(formatStroke).join('\n')
      
      return `  '${char}': {
    char: '${char}',
    type: '${type}',
    // 혼합중성: 가로획 + 세로획
    horizontalStrokes: [
${horizontalLines}
    ],
    verticalStrokes: [
${verticalLines}
    ],
  },`
    }
  }

  // 일반 중성, 초성, 종성의 경우 기존 형식
  const strokeLines = strokes.map(formatStroke).join('\n')

  return `  '${char}': {
    char: '${char}',
    type: '${type}',
    strokes: [
${strokeLines}
    ],
  },`
}

interface JamoEditorProps {
  jamoType: 'choseong' | 'jungseong' | 'jongseong'
  jamoChar: string
}

export function JamoEditor({ jamoType, jamoChar }: JamoEditorProps) {
  const { setSelectedStrokeId } = useUIStore()
  const { layoutConfigs } = useLayoutStore()

  // Draft state for stroke edits
  const [draftStrokes, setDraftStrokes] = useState<StrokeData[]>([])

  // 편집 중인 자모의 박스 정보 계산 (비율 + 위치)
  // 혼합 중성의 경우 JU_H와 JU_V 박스 정보도 함께 반환
  const jamoBoxInfo = useMemo(() => {
    if (!jamoType || !jamoChar) return { x: 0, y: 0, width: 1, height: 1, juH: undefined, juV: undefined }

    // 중성의 경우, 실제 사용되는 레이아웃 타입을 정확히 찾아야 함
    if (jamoType === 'jungseong') {
      const jamoMap = getJamoMap('jungseong')
      const jamo = jamoMap[jamoChar]
      if (!jamo) return { x: 0, y: 0, width: 1, height: 1, juH: undefined, juV: undefined }

      // 중성 타입 분류
      const verticalJungseong = ['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅣ', 'ㅐ', 'ㅒ', 'ㅔ', 'ㅖ']
      const horizontalJungseong = ['ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ']
      const isVertical = verticalJungseong.includes(jamoChar)
      const isHorizontal = horizontalJungseong.includes(jamoChar)
      const isMixed = !isVertical && !isHorizontal

      // 혼합 중성의 경우
      if (isMixed) {
        const mixedLayoutTypes = [
          'jungseong-mixed-only',
          'choseong-jungseong-mixed',
          'choseong-jungseong-mixed-jongseong'
        ]
        
        for (const layoutType of mixedLayoutTypes) {
          const layoutConfig = layoutConfigs[layoutType as keyof typeof layoutConfigs]
          if (layoutConfig) {
            if (layoutConfig.boxes.JU_H && layoutConfig.boxes.JU_V) {
              const juH = layoutConfig.boxes.JU_H
              const juV = layoutConfig.boxes.JU_V
              const minX = Math.min(juH.x, juV.x)
              const minY = Math.min(juH.y, juV.y)
              const maxX = Math.max(juH.x + juH.width, juV.x + juV.width)
              const maxY = Math.max(juH.y + juH.height, juV.y + juV.height)
              const combinedWidth = maxX - minX
              const combinedHeight = maxY - minY
              return { 
                x: minX, 
                y: minY, 
                width: combinedWidth, 
                height: combinedHeight,
                juH: juH,
                juV: juV
              }
            } else if (layoutConfig.boxes.JU) {
              const ju = layoutConfig.boxes.JU
              return { x: ju.x, y: ju.y, width: ju.width, height: ju.height, juH: undefined, juV: undefined }
            }
          }
        }
      } else if (isVertical) {
        const verticalLayoutTypes = [
          'jungseong-vertical-only',
          'choseong-jungseong-vertical',
          'choseong-jungseong-vertical-jongseong'
        ]
        
        for (const layoutType of verticalLayoutTypes) {
          const layoutConfig = layoutConfigs[layoutType as keyof typeof layoutConfigs]
          if (layoutConfig) {
            if (layoutConfig.boxes.JU_V) {
              const juV = layoutConfig.boxes.JU_V
              return { x: juV.x, y: juV.y, width: juV.width, height: juV.height, juH: undefined, juV: undefined }
            } else if (layoutConfig.boxes.JU) {
              const ju = layoutConfig.boxes.JU
              return { x: ju.x, y: ju.y, width: ju.width, height: ju.height, juH: undefined, juV: undefined }
            }
          }
        }
      } else if (isHorizontal) {
        const horizontalLayoutTypes = [
          'jungseong-horizontal-only',
          'choseong-jungseong-horizontal',
          'choseong-jungseong-horizontal-jongseong'
        ]
        
        for (const layoutType of horizontalLayoutTypes) {
          const layoutConfig = layoutConfigs[layoutType as keyof typeof layoutConfigs]
          if (layoutConfig) {
            if (layoutConfig.boxes.JU_H) {
              const juH = layoutConfig.boxes.JU_H
              return { x: juH.x, y: juH.y, width: juH.width, height: juH.height, juH: undefined, juV: undefined }
            } else if (layoutConfig.boxes.JU) {
              const ju = layoutConfig.boxes.JU
              return { x: ju.x, y: ju.y, width: ju.width, height: ju.height, juH: undefined, juV: undefined }
            }
          }
        }
      }
    }

    // 초성, 종성의 경우
    const relevantLayoutTypes = Object.keys(layoutConfigs).filter((layoutType) => {
      if (jamoType === 'choseong') {
        return layoutType.includes('choseong')
      } else if (jamoType === 'jongseong') {
        return layoutType.includes('jongseong')
      }
      return false
    })

    for (const layoutType of relevantLayoutTypes) {
      const layoutConfig = layoutConfigs[layoutType as keyof typeof layoutConfigs]
      let box: BoxConfig | undefined

      if (jamoType === 'choseong') {
        box = layoutConfig.boxes.CH
      } else if (jamoType === 'jongseong') {
        box = layoutConfig.boxes.JO
      }

      if (box) {
        return { x: box.x, y: box.y, width: box.width, height: box.height, juH: undefined, juV: undefined }
      }
    }

    return { x: 0, y: 0, width: 1, height: 1, juH: undefined, juV: undefined }
  }, [jamoType, jamoChar, layoutConfigs])

  // 자모가 변경될 때 획 데이터 로드
  useEffect(() => {
    const jamoMap = getJamoMap(jamoType)
    const jamo = jamoMap[jamoChar]
    if (jamo) {
      // 혼합 중성의 경우 horizontalStrokes와 verticalStrokes를 합쳐서 사용
      if (jamo.horizontalStrokes && jamo.verticalStrokes) {
        setDraftStrokes([...jamo.horizontalStrokes, ...jamo.verticalStrokes])
      } else if (jamo.verticalStrokes) {
        // verticalStrokes만 있는 경우
        setDraftStrokes([...jamo.verticalStrokes])
      } else if (jamo.horizontalStrokes) {
        // horizontalStrokes만 있는 경우
        setDraftStrokes([...jamo.horizontalStrokes])
      } else if (jamo.strokes) {
        setDraftStrokes([...jamo.strokes])
      } else {
        setDraftStrokes([])
      }
    } else {
      setDraftStrokes([])
    }
    // 새 자모 선택 시 획 선택 초기화
    setSelectedStrokeId(null)
  }, [jamoType, jamoChar, setSelectedStrokeId])

  const handleStrokeChange = (strokeId: string, prop: keyof StrokeData, value: number) => {
    setDraftStrokes((prev) =>
      prev.map((s) => (s.id === strokeId ? { ...s, [prop]: value } : s))
    )
  }

  const handleSave = () => {
    const code = generateStrokeCode(draftStrokes, jamoChar, jamoType)
    console.log('\n📋 Hangul.ts에 붙여넣기용:\n')
    console.log(`// Replace the entry for '${jamoChar}' in ${jamoType.toUpperCase()}_MAP:\n`)
    console.log(code)

    const confirmed = confirm(
      `이 자모를 사용하는 모든 글자가 변경됩니다.\n\n획 데이터가 콘솔에 출력되었습니다.\nHangul.ts 파일에서 '${jamoChar}'의 항목을 교체해주세요.`
    )

    if (confirmed) {
      alert('콘솔에서 코드를 복사하여 Hangul.ts에 붙여넣은 후 페이지를 새로고침하세요.')
    }
  }

  const handleReset = () => {
    const jamoMap = getJamoMap(jamoType)
    const jamo = jamoMap[jamoChar]
    if (jamo) {
      // 혼합 중성의 경우 horizontalStrokes와 verticalStrokes를 합쳐서 사용
      if (jamo.horizontalStrokes && jamo.verticalStrokes) {
        setDraftStrokes([...jamo.horizontalStrokes, ...jamo.verticalStrokes])
      } else if (jamo.verticalStrokes) {
        // verticalStrokes만 있는 경우
        setDraftStrokes([...jamo.verticalStrokes])
      } else if (jamo.horizontalStrokes) {
        // horizontalStrokes만 있는 경우
        setDraftStrokes([...jamo.horizontalStrokes])
      } else if (jamo.strokes) {
        setDraftStrokes([...jamo.strokes])
      }
    }
  }

  if (draftStrokes.length === 0) {
    return (
      <div className={styles.container}>
        <p className={styles.emptyState}>획 데이터를 불러올 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* 3단 레이아웃 */}
      <div className={styles.threeColumnLayout}>
        {/* 좌측: 획 목록 */}
        <div className={styles.leftPanel}>
          <h3 className={styles.panelTitle}>획 목록</h3>
          <StrokeList strokes={draftStrokes} />
        </div>

        {/* 중앙: 큰 미리보기 + 키보드 힌트 */}
        <div className={styles.centerPanel}>
          <h3 className={styles.panelTitle}>미리보기</h3>
          <CharacterPreview jamoChar={jamoChar} strokes={draftStrokes} boxInfo={jamoBoxInfo} jamoType={jamoType} />
          <p className={styles.keyboardHint}>
            방향키: 위치 이동 | Shift + 방향키: 크기 조절
          </p>
        </div>

        {/* 우측: Stroke Inspector */}
        <div className={styles.rightPanel}>
          <h3 className={styles.panelTitle}>속성 편집</h3>
          <StrokeInspector strokes={draftStrokes} onChange={handleStrokeChange} />
        </div>
      </div>

      {/* 키보드 컨트롤 (UI 없음) */}
      <StrokeEditor strokes={draftStrokes} onChange={handleStrokeChange} boxInfo={jamoBoxInfo} />

      {/* 버튼 그룹 */}
      <div className={styles.buttonGroup}>
        <button className={styles.resetButton} onClick={handleReset}>
          초기화
        </button>
        <button className={styles.saveButton} onClick={handleSave}>
          저장
        </button>
      </div>
    </div>
  )
}
