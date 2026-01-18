import { useUIStore } from '../../stores/uiStore'
import type { StrokeData } from '../../types'
import styles from './CharacterEditor.module.css'

interface StrokeInspectorProps {
  strokes: StrokeData[]
  onChange: (strokeId: string, prop: keyof StrokeData, value: number) => void
}

export function StrokeInspector({ strokes, onChange }: StrokeInspectorProps) {
  const { selectedStrokeId } = useUIStore()
  const selectedStroke = strokes.find((s) => s.id === selectedStrokeId)

  if (!selectedStroke) {
    return (
      <div className={styles.strokeInspector}>
        <h3 className={styles.sectionTitle}>Stroke Properties</h3>
        <div className={styles.emptyState}>획을 선택해주세요</div>
      </div>
    )
  }

  return (
    <div className={styles.strokeInspector}>
      <h3 className={styles.sectionTitle}>Stroke: {selectedStroke.id}</h3>

      {/* 속성 입력 */}
      <div className={styles.propertyList}>
        <div className={styles.propertyItem}>
          <label className={styles.propertyLabel}>X</label>
          <input
            type="number"
            min="0"
            max="1"
            step="0.01"
            value={selectedStroke.x.toFixed(2)}
            onChange={(e) => onChange(selectedStroke.id, 'x', parseFloat(e.target.value) || 0)}
            className={styles.propertyInput}
          />
        </div>
        <div className={styles.propertyItem}>
          <label className={styles.propertyLabel}>Y</label>
          <input
            type="number"
            min="0"
            max="1"
            step="0.01"
            value={selectedStroke.y.toFixed(2)}
            onChange={(e) => onChange(selectedStroke.id, 'y', parseFloat(e.target.value) || 0)}
            className={styles.propertyInput}
          />
        </div>
        <div className={styles.propertyItem}>
          <label className={styles.propertyLabel}>Width</label>
          <input
            type="number"
            min="0.01"
            max="1"
            step="0.01"
            value={selectedStroke.width.toFixed(2)}
            onChange={(e) => onChange(selectedStroke.id, 'width', parseFloat(e.target.value) || 0.01)}
            className={styles.propertyInput}
          />
        </div>
        <div className={styles.propertyItem}>
          <label className={styles.propertyLabel}>Height</label>
          <input
            type="number"
            min="0.01"
            max="1"
            step="0.01"
            value={selectedStroke.height.toFixed(2)}
            onChange={(e) => onChange(selectedStroke.id, 'height', parseFloat(e.target.value) || 0.01)}
            className={styles.propertyInput}
          />
        </div>
      </div>

      {/* 메타 정보 */}
      <div className={styles.metaInfo}>
        <span className={styles.metaLabel}>Direction:</span>
        <span className={styles.metaValue}>
          {selectedStroke.direction === 'horizontal' ? '가로 (Horizontal)' : '세로 (Vertical)'}
        </span>
      </div>
    </div>
  )
}
