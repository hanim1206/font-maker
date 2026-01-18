import { useEffect } from 'react'
import { useUIStore } from '../../stores/uiStore'
import type { StrokeData, BoxConfig } from '../../types'

interface StrokeEditorProps {
  strokes: StrokeData[]
  onChange: (strokeId: string, prop: keyof StrokeData, value: number) => void
  boxInfo?: BoxConfig & { juH?: BoxConfig; juV?: BoxConfig }
}

const MOVE_STEP = 0.01
const RESIZE_STEP = 0.01

export function StrokeEditor({ strokes, onChange, boxInfo: _boxInfo = { x: 0, y: 0, width: 1, height: 1 } }: StrokeEditorProps) {
  // TODO: _boxInfo를 사용하여 박스 영역 내에서만 이동 가능하도록 제한
  void _boxInfo
  const { selectedStrokeId } = useUIStore()
  const selectedStroke = strokes.find((s) => s.id === selectedStrokeId)
  
  // 박스 영역 내에서만 이동 가능하도록 제한하는 헬퍼 함수
  const clampToBox = (value: number, min: number, max: number) => {
    return Math.max(min, Math.min(max, value))
  }

  // 키보드 컨트롤
  useEffect(() => {
    if (!selectedStroke) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // 입력 필드에서 입력 중일 때는 무시
      if (e.target instanceof HTMLInputElement) return

      const isShift = e.shiftKey

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          if (isShift) {
            // Shift + 왼쪽: width 감소 (박스 영역 내에서만)
            const newWidth = selectedStroke.width - RESIZE_STEP
            onChange(
              selectedStroke.id,
              'width',
              clampToBox(newWidth, 0.01, 1 - selectedStroke.x)
            )
          } else {
            // 왼쪽: x 감소 (박스 영역 내에서만)
            const newX = selectedStroke.x - MOVE_STEP
            onChange(selectedStroke.id, 'x', clampToBox(newX, 0, 1 - selectedStroke.width))
          }
          break
        case 'ArrowRight':
          e.preventDefault()
          if (isShift) {
            // Shift + 오른쪽: width 증가 (박스 영역 내에서만)
            const newWidth = selectedStroke.width + RESIZE_STEP
            onChange(
              selectedStroke.id,
              'width',
              clampToBox(newWidth, 0.01, 1 - selectedStroke.x)
            )
          } else {
            // 오른쪽: x 증가 (박스 영역 내에서만)
            const newX = selectedStroke.x + MOVE_STEP
            onChange(selectedStroke.id, 'x', clampToBox(newX, 0, 1 - selectedStroke.width))
          }
          break
        case 'ArrowUp':
          e.preventDefault()
          if (isShift) {
            // Shift + 위: height 감소 (박스 영역 내에서만)
            const newHeight = selectedStroke.height - RESIZE_STEP
            onChange(
              selectedStroke.id,
              'height',
              clampToBox(newHeight, 0.01, 1 - selectedStroke.y)
            )
          } else {
            // 위: y 감소 (박스 영역 내에서만)
            const newY = selectedStroke.y - MOVE_STEP
            onChange(selectedStroke.id, 'y', clampToBox(newY, 0, 1 - selectedStroke.height))
          }
          break
        case 'ArrowDown':
          e.preventDefault()
          if (isShift) {
            // Shift + 아래: height 증가 (박스 영역 내에서만)
            const newHeight = selectedStroke.height + RESIZE_STEP
            onChange(
              selectedStroke.id,
              'height',
              clampToBox(newHeight, 0.01, 1 - selectedStroke.y)
            )
          } else {
            // 아래: y 증가 (박스 영역 내에서만)
            const newY = selectedStroke.y + MOVE_STEP
            onChange(selectedStroke.id, 'y', clampToBox(newY, 0, 1 - selectedStroke.height))
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedStroke, onChange])

  // UI 렌더링 없음 - 키보드 컨트롤만 담당
  return null
}
