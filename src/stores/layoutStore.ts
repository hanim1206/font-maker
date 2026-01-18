import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { LayoutType, BoxConfig, LayoutSchema, Part } from '../types'
import { DEFAULT_LAYOUT_CONFIGS, DEFAULT_LAYOUT_SCHEMAS, type LayoutConfig } from '../data/layoutConfigs'
import { calculateBoxes, DEFAULT_LAYOUT_SCHEMAS as CALC_SCHEMAS } from '../utils/layoutCalculator'

interface LayoutState {
  // 레이아웃 타입별 스키마 (Split + Padding 기반)
  layoutSchemas: Record<LayoutType, LayoutSchema>
  // 레이아웃 타입별 설정 (호환성 - 계산된 boxes)
  layoutConfigs: Record<LayoutType, LayoutConfig>
}

interface LayoutActions {
  // ===== Schema 기반 API (새로운 방식) =====
  
  // 레이아웃 스키마 조회
  getLayoutSchema: (layoutType: LayoutType) => LayoutSchema

  // Split 값 업데이트
  updateSplit: (layoutType: LayoutType, splitIndex: number, value: number) => void

  // Padding 값 업데이트
  updatePadding: (
    layoutType: LayoutType,
    side: 'top' | 'bottom' | 'left' | 'right',
    value: number
  ) => void

  // 계산된 박스 조회
  getCalculatedBoxes: (layoutType: LayoutType) => Partial<Record<Part, BoxConfig>>

  // 스키마 리셋
  resetLayoutSchema: (layoutType: LayoutType) => void
  resetAllLayoutSchemas: () => void

  // ===== 레거시 API (호환성 유지) =====
  
  // 레이아웃 설정 조회
  getLayoutConfig: (layoutType: LayoutType) => LayoutConfig

  // 레이아웃 설정 업데이트
  updateLayoutConfig: (layoutType: LayoutType, boxes: LayoutConfig['boxes']) => void

  // 특정 박스만 업데이트
  updateBox: (layoutType: LayoutType, part: keyof LayoutConfig['boxes'], box: BoxConfig) => void

  // 기본값으로 리셋
  resetLayoutConfig: (layoutType: LayoutType) => void
  resetAllLayoutConfigs: () => void
}

// 스키마에서 계산된 boxes로 config 동기화
function syncConfigFromSchema(
  state: LayoutState,
  layoutType: LayoutType
): void {
  const schema = state.layoutSchemas[layoutType]
  const boxes = calculateBoxes(schema)
  state.layoutConfigs[layoutType] = {
    layoutType,
    boxes: boxes as LayoutConfig['boxes'],
  }
}

export const useLayoutStore = create<LayoutState & LayoutActions>()(
  immer((set, get) => ({
    // 초기 상태
    layoutSchemas: { ...CALC_SCHEMAS },
    layoutConfigs: { ...DEFAULT_LAYOUT_CONFIGS },

    // ===== Schema 기반 API =====

    getLayoutSchema: (layoutType) => {
      return get().layoutSchemas[layoutType]
    },

    updateSplit: (layoutType, splitIndex, value) =>
      set((state) => {
        const schema = state.layoutSchemas[layoutType]
        if (schema.splits && splitIndex < schema.splits.length) {
          schema.splits[splitIndex].value = value
          syncConfigFromSchema(state, layoutType)
        }
      }),

    updatePadding: (layoutType, side, value) =>
      set((state) => {
        const schema = state.layoutSchemas[layoutType]
        if (!schema.padding) {
          schema.padding = { top: 0.05, bottom: 0.05, left: 0.05, right: 0.05 }
        }
        schema.padding[side] = value
        syncConfigFromSchema(state, layoutType)
      }),

    getCalculatedBoxes: (layoutType) => {
      const schema = get().layoutSchemas[layoutType]
      return calculateBoxes(schema)
    },

    resetLayoutSchema: (layoutType) =>
      set((state) => {
        state.layoutSchemas[layoutType] = { ...CALC_SCHEMAS[layoutType] }
        syncConfigFromSchema(state, layoutType)
      }),

    resetAllLayoutSchemas: () =>
      set((state) => {
        state.layoutSchemas = { ...CALC_SCHEMAS }
        // 모든 config 동기화
        Object.keys(state.layoutSchemas).forEach((lt) => {
          syncConfigFromSchema(state, lt as LayoutType)
        })
      }),

    // ===== 레거시 API (호환성) =====

    getLayoutConfig: (layoutType) => {
      return get().layoutConfigs[layoutType]
    },

    updateLayoutConfig: (layoutType, boxes) =>
      set((state) => {
        state.layoutConfigs[layoutType].boxes = boxes
      }),

    updateBox: (layoutType, part, box) =>
      set((state) => {
        if (part && box) {
          state.layoutConfigs[layoutType].boxes[part] = box
        }
      }),

    resetLayoutConfig: (layoutType) =>
      set((state) => {
        state.layoutConfigs[layoutType] = { ...DEFAULT_LAYOUT_CONFIGS[layoutType] }
      }),

    resetAllLayoutConfigs: () =>
      set((state) => {
        state.layoutConfigs = { ...DEFAULT_LAYOUT_CONFIGS }
      }),
  }))
)
