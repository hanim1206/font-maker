import { useUIStore } from '../../stores/uiStore'
import { JUNGSEONG_MAP } from '../../data/Hangul'
import type { StrokeData, BoxConfig } from '../../types'
import styles from './CharacterEditor.module.css'

interface CharacterPreviewProps {
  jamoChar: string
  strokes: StrokeData[]
  boxInfo?: BoxConfig & { juH?: BoxConfig; juV?: BoxConfig }
  jamoType?: 'choseong' | 'jungseong' | 'jongseong'
}

const VIEW_BOX_SIZE = 100
const BASE_SIZE = 400

// 획 두께 (VIEW_BOX_SIZE 기준, 고정값)
const STROKE_THICKNESS = 2

// 박스 타입별 색상
const BOX_COLORS: Record<string, string> = {
  CH: '#ff6b6b',
  JU: '#4ecdc4',
  JU_H: '#ff9500',
  JU_V: '#ffd700',
  JO: '#4169e1',
}

export function CharacterPreview({ jamoChar, strokes, boxInfo = { x: 0, y: 0, width: 1, height: 1 }, jamoType }: CharacterPreviewProps) {
  const { selectedStrokeId, setSelectedStrokeId, editingJamoType } = useUIStore()
  
  // jamoType이 전달되지 않으면 store에서 가져오기
  const currentJamoType = jamoType || editingJamoType

  // 혼합 중성인지 확인하고, 각 획이 어느 박스에 속하는지 확인
  const isMixed = currentJamoType === 'jungseong' && boxInfo.juH && boxInfo.juV
  let horizontalStrokeIds: Set<string> | null = null
  let verticalStrokeIds: Set<string> | null = null

  if (isMixed) {
    const jamo = JUNGSEONG_MAP[jamoChar]
    if (jamo?.horizontalStrokes && jamo?.verticalStrokes) {
      horizontalStrokeIds = new Set(jamo.horizontalStrokes.map(s => s.id))
      verticalStrokeIds = new Set(jamo.verticalStrokes.map(s => s.id))
    }
  }

  // 박스 비율에 맞춰 SVG 크기 계산
  const aspectRatio = boxInfo.width / boxInfo.height
  const svgWidth = aspectRatio >= 1 ? BASE_SIZE : BASE_SIZE * aspectRatio
  const svgHeight = aspectRatio >= 1 ? BASE_SIZE / aspectRatio : BASE_SIZE

  // viewBox도 비율에 맞게 조정 (전체 영역을 보여주되, 박스 영역을 강조)
  const viewBoxWidth = VIEW_BOX_SIZE
  const viewBoxHeight = VIEW_BOX_SIZE / aspectRatio

  // 박스 영역을 viewBox 좌표로 변환
  const boxX = boxInfo.x * VIEW_BOX_SIZE
  const boxY = boxInfo.y * VIEW_BOX_SIZE
  const boxWidth = boxInfo.width * VIEW_BOX_SIZE
  const boxHeight = boxInfo.height * VIEW_BOX_SIZE

  // 박스 타입에 따른 색상 결정
  const boxColor = currentJamoType === 'choseong' ? BOX_COLORS.CH :
                   currentJamoType === 'jongseong' ? BOX_COLORS.JO :
                   BOX_COLORS.JU

  return (
    <div className={styles.preview}>
      <svg 
        width={svgWidth} 
        height={svgHeight} 
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      >
        {/* 전체 영역 배경 */}
        <rect
          x={0}
          y={0}
          width={viewBoxWidth}
          height={viewBoxHeight}
          fill="#2a2a2a"
          opacity={0.3}
        />
        
        {/* 혼합 중성인 경우 JU_H와 JU_V 박스를 각각 표시 */}
        {isMixed && boxInfo.juH && boxInfo.juV ? (
          <>
            {/* JU_H 박스 */}
            <rect
              x={boxInfo.juH.x * VIEW_BOX_SIZE}
              y={boxInfo.juH.y * VIEW_BOX_SIZE}
              width={boxInfo.juH.width * VIEW_BOX_SIZE}
              height={boxInfo.juH.height * VIEW_BOX_SIZE}
              fill={BOX_COLORS.JU_H}
              opacity={0.2}
              stroke={BOX_COLORS.JU_H}
              strokeWidth={2}
              strokeDasharray="4,4"
            />
            {/* JU_V 박스 */}
            <rect
              x={boxInfo.juV.x * VIEW_BOX_SIZE}
              y={boxInfo.juV.y * VIEW_BOX_SIZE}
              width={boxInfo.juV.width * VIEW_BOX_SIZE}
              height={boxInfo.juV.height * VIEW_BOX_SIZE}
              fill={BOX_COLORS.JU_V}
              opacity={0.2}
              stroke={BOX_COLORS.JU_V}
              strokeWidth={2}
              strokeDasharray="4,4"
            />
          </>
        ) : (
          /* 일반 박스 영역 */
          <rect
            x={boxX}
            y={boxY}
            width={boxWidth}
            height={boxHeight}
            fill={boxColor}
            opacity={0.2}
            stroke={boxColor}
            strokeWidth={2}
            strokeDasharray="4,4"
          />
        )}
        
        {/* 획들 (박스 영역 내 상대 좌표) */}
        {strokes.map((stroke) => {
          const isSelected = stroke.id === selectedStrokeId
          
          // 혼합 중성인 경우, 각 획을 원래 박스 위치에 맞게 변환
          let strokeX: number
          let strokeY: number
          let strokeWidth: number
          let strokeHeight: number
          
          if (isMixed && boxInfo.juH && boxInfo.juV && horizontalStrokeIds && verticalStrokeIds) {
            // horizontalStrokes는 JU_H 박스 기준
            if (horizontalStrokeIds.has(stroke.id)) {
              strokeX = boxInfo.juH.x * VIEW_BOX_SIZE + stroke.x * boxInfo.juH.width * VIEW_BOX_SIZE
              strokeY = boxInfo.juH.y * VIEW_BOX_SIZE + stroke.y * boxInfo.juH.height * VIEW_BOX_SIZE
              // 가로획: height 고정, width 비례
              strokeWidth = stroke.width * boxInfo.juH.width * VIEW_BOX_SIZE
              strokeHeight = STROKE_THICKNESS
            } 
            // verticalStrokes는 JU_V 박스 기준
            else if (verticalStrokeIds.has(stroke.id)) {
              strokeX = boxInfo.juV.x * VIEW_BOX_SIZE + stroke.x * boxInfo.juV.width * VIEW_BOX_SIZE
              strokeY = boxInfo.juV.y * VIEW_BOX_SIZE + stroke.y * boxInfo.juV.height * VIEW_BOX_SIZE
              // 세로획: width 고정, height 비례
              strokeWidth = STROKE_THICKNESS
              strokeHeight = stroke.height * boxInfo.juV.height * VIEW_BOX_SIZE
            } else {
              // 기본 (혹시 모를 경우)
              strokeX = boxX + stroke.x * boxWidth
              strokeY = boxY + stroke.y * boxHeight
              // direction에 따라 두께 고정
              if (stroke.direction === 'horizontal') {
                strokeWidth = stroke.width * boxWidth
                strokeHeight = STROKE_THICKNESS
              } else {
                strokeWidth = STROKE_THICKNESS
                strokeHeight = stroke.height * boxHeight
              }
            }
          } else {
            // 일반 경우: 박스 영역 내 상대 좌표를 절대 좌표로 변환
            strokeX = boxX + stroke.x * boxWidth
            strokeY = boxY + stroke.y * boxHeight
            // direction에 따라 두께 고정
            if (stroke.direction === 'horizontal') {
              // 가로획: height 고정, width 비례
              strokeWidth = stroke.width * boxWidth
              strokeHeight = STROKE_THICKNESS
            } else {
              // 세로획: width 고정, height 비례
              strokeWidth = STROKE_THICKNESS
              strokeHeight = stroke.height * boxHeight
            }
          }
          
          return (
            <rect
              key={stroke.id}
              x={strokeX}
              y={strokeY}
              width={strokeWidth}
              height={strokeHeight}
              fill={isSelected ? '#ff6b6b' : '#1a1a1a'}
              stroke={isSelected ? '#ff0000' : 'none'}
              strokeWidth={2}
              rx={1}
              ry={1}
              onClick={() => setSelectedStrokeId(stroke.id)}
              style={{ cursor: 'pointer' }}
            />
          )
        })}
      </svg>
      <span className={styles.jamoLabel}>{jamoChar}</span>
    </div>
  )
}
