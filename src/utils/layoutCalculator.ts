import type { LayoutSchema, BoxConfig, Part, Padding, LayoutType } from '../types'

// 기본 패딩 값
const DEFAULT_PADDING: Padding = {
  top: 0.05,
  bottom: 0.05,
  left: 0.05,
  right: 0.05,
}

// Split 없을 때 사용하는 기본 패딩 (넓은 여백)
const DEFAULT_SINGLE_SLOT_PADDING: Padding = {
  top: 0.15,
  bottom: 0.15,
  left: 0.15,
  right: 0.15,
}

/**
 * Padding으로부터 BoxConfig 계산
 */
function paddingToBox(padding: Padding): BoxConfig {
  return {
    x: padding.left,
    y: padding.top,
    width: 1 - padding.left - padding.right,
    height: 1 - padding.top - padding.bottom,
  }
}

/**
 * LayoutSchema로부터 각 슬롯의 BoxConfig 계산
 */
export function calculateBoxes(schema: LayoutSchema): Partial<Record<Part, BoxConfig>> {
  const boxes: Partial<Record<Part, BoxConfig>> = {}
  const padding = schema.padding || DEFAULT_PADDING
  const splits = schema.splits || []
  const layoutType = schema.id

  // Split 0개: padding만으로 단일 슬롯 계산
  if (splits.length === 0) {
    const singlePadding = schema.padding || DEFAULT_SINGLE_SLOT_PADDING
    const singleSlot = schema.slots[0]
    if (singleSlot) {
      boxes[singleSlot] = paddingToBox(singlePadding)
    }
    return boxes
  }

  // 레이아웃 타입별 계산 분기
  switch (layoutType) {
    case 'choseong-jungseong-vertical':
      return calculateVerticalSplit(schema, padding)

    case 'choseong-jungseong-horizontal':
      return calculateHorizontalSplit(schema, padding)

    case 'choseong-jungseong-vertical-jongseong':
      return calculateVerticalWithJongseong(schema, padding)

    case 'choseong-jungseong-horizontal-jongseong':
      return calculateHorizontalWithJongseong(schema, padding)

    case 'choseong-jungseong-mixed':
      return calculateMixedJungseong(schema, padding)

    case 'choseong-jungseong-mixed-jongseong':
      return calculateMixedJungseongWithJongseong(schema, padding)

    case 'jungseong-mixed-only':
      return calculateMixedJungseongOnly(schema, padding)

    default:
      // 단일 슬롯 (choseong-only, jungseong-*-only)
      const singlePadding = schema.padding || DEFAULT_SINGLE_SLOT_PADDING
      if (schema.slots[0]) {
        boxes[schema.slots[0]] = paddingToBox(singlePadding)
      }
      return boxes
  }
}

/**
 * 초성 + 세로중성 (X축 분할 1개)
 * CH: 좌측, JU: 우측
 */
function calculateVerticalSplit(
  schema: LayoutSchema,
  padding: Padding
): Partial<Record<Part, BoxConfig>> {
  const splitX = schema.splits?.[0]?.value ?? 0.6

  return {
    CH: {
      x: padding.left,
      y: padding.top,
      width: splitX - padding.left - padding.right * 0.5,
      height: 1 - padding.top - padding.bottom,
    },
    JU: {
      x: splitX + padding.left * 0.5,
      y: padding.top,
      width: 1 - splitX - padding.right - padding.left * 0.5,
      height: 1 - padding.top - padding.bottom,
    },
  }
}

/**
 * 초성 + 가로중성 (Y축 분할 1개)
 * CH: 상단, JU: 하단
 */
function calculateHorizontalSplit(
  schema: LayoutSchema,
  padding: Padding
): Partial<Record<Part, BoxConfig>> {
  const splitY = schema.splits?.[0]?.value ?? 0.55

  return {
    CH: {
      x: padding.left,
      y: padding.top,
      width: 1 - padding.left - padding.right,
      height: splitY - padding.top - padding.bottom * 0.5,
    },
    JU: {
      x: padding.left,
      y: splitY + padding.top * 0.5,
      width: 1 - padding.left - padding.right,
      height: 1 - splitY - padding.bottom - padding.top * 0.5,
    },
  }
}

/**
 * 초성 + 세로중성 + 종성 (X축 + Y축 분할)
 * CH: 좌상, JU: 우상, JO: 하단 전체
 */
function calculateVerticalWithJongseong(
  schema: LayoutSchema,
  padding: Padding
): Partial<Record<Part, BoxConfig>> {
  const splitX = schema.splits?.find((s) => s.axis === 'x')?.value ?? 0.6
  const splitY = schema.splits?.find((s) => s.axis === 'y')?.value ?? 0.55

  return {
    CH: {
      x: padding.left,
      y: padding.top,
      width: splitX - padding.left - 0.02,
      height: splitY - padding.top - 0.02,
    },
    JU: {
      x: splitX + 0.02,
      y: padding.top,
      width: 1 - splitX - padding.right - 0.02,
      height: splitY - padding.top - 0.02,
    },
    JO: {
      x: padding.left,
      y: splitY + 0.02,
      width: 1 - padding.left - padding.right,
      height: 1 - splitY - padding.bottom - 0.02,
    },
  }
}

/**
 * 초성 + 가로중성 + 종성 (Y축 분할 2개)
 * CH: 상단, JU: 중단, JO: 하단
 */
function calculateHorizontalWithJongseong(
  schema: LayoutSchema,
  padding: Padding
): Partial<Record<Part, BoxConfig>> {
  // Y축 splits를 순서대로 사용
  const ySplits = schema.splits?.filter((s) => s.axis === 'y') ?? []
  const splitY1 = ySplits[0]?.value ?? 0.37
  const splitY2 = ySplits[1]?.value ?? 0.60

  return {
    CH: {
      x: padding.left,
      y: padding.top,
      width: 1 - padding.left - padding.right,
      height: splitY1 - padding.top - 0.01,
    },
    JU: {
      x: padding.left,
      y: splitY1 + 0.01,
      width: 1 - padding.left - padding.right,
      height: splitY2 - splitY1 - 0.02,
    },
    JO: {
      x: padding.left,
      y: splitY2 + 0.01,
      width: 1 - padding.left - padding.right,
      height: 1 - splitY2 - padding.bottom - 0.01,
    },
  }
}

/**
 * 초성 + 혼합중성 (JU_H, JU_V 별도)
 */
function calculateMixedJungseong(
  schema: LayoutSchema,
  padding: Padding
): Partial<Record<Part, BoxConfig>> {
  const splitX = schema.splits?.find((s) => s.axis === 'x')?.value ?? 0.55
  const splitY = schema.splits?.find((s) => s.axis === 'y')?.value ?? 0.5

  return {
    CH: {
      x: padding.left,
      y: padding.top,
      width: splitX - padding.left - 0.02,
      height: splitY - padding.top - 0.02,
    },
    JU_H: {
      x: padding.left,
      y: splitY + 0.02,
      width: splitX - padding.left - 0.02,
      height: 1 - splitY - padding.bottom - 0.02,
    },
    JU_V: {
      x: splitX + 0.02,
      y: padding.top,
      width: 1 - splitX - padding.right - 0.02,
      height: 1 - padding.top - padding.bottom,
    },
  }
}

/**
 * 초성 + 혼합중성 + 종성
 */
function calculateMixedJungseongWithJongseong(
  schema: LayoutSchema,
  padding: Padding
): Partial<Record<Part, BoxConfig>> {
  const splitX = schema.splits?.find((s) => s.axis === 'x')?.value ?? 0.55
  // Y축 splits: 첫 번째는 CH/JU_H 경계, 두 번째는 JO 상단
  const ySplits = schema.splits?.filter((s) => s.axis === 'y') ?? []
  const splitY1 = ySplits[0]?.value ?? 0.5
  const splitY2 = ySplits[1]?.value ?? 0.75

  return {
    CH: {
      x: padding.left,
      y: padding.top,
      width: splitX - padding.left - 0.02,
      height: splitY1 - padding.top - 0.02,
    },
    JU_H: {
      x: padding.left,
      y: splitY1 + 0.02,
      width: splitX - padding.left - 0.02,
      height: splitY2 - splitY1 - 0.04,
    },
    JU_V: {
      x: splitX + 0.02,
      y: padding.top,
      width: 1 - splitX - padding.right - 0.02,
      height: splitY2 - padding.top - 0.02,
    },
    JO: {
      x: padding.left,
      y: splitY2 + 0.02,
      width: splitX - padding.left - 0.02,
      height: 1 - splitY2 - padding.bottom - 0.02,
    },
  }
}

/**
 * 혼합중성만 (JU_H, JU_V)
 */
function calculateMixedJungseongOnly(
  schema: LayoutSchema,
  padding: Padding
): Partial<Record<Part, BoxConfig>> {
  const splitX = schema.splits?.find((s) => s.axis === 'x')?.value ?? 0.5
  const splitY = schema.splits?.find((s) => s.axis === 'y')?.value ?? 0.5

  return {
    JU_H: {
      x: padding.left,
      y: splitY + 0.02,
      width: splitX - padding.left - 0.02,
      height: 1 - splitY - padding.bottom - 0.02,
    },
    JU_V: {
      x: splitX + 0.02,
      y: padding.top,
      width: 1 - splitX - padding.right - 0.02,
      height: 1 - padding.top - padding.bottom,
    },
  }
}

/**
 * 레이아웃 타입에 따른 기본 LayoutSchema 생성
 */
export function getDefaultSchema(layoutType: LayoutType): LayoutSchema {
  return DEFAULT_LAYOUT_SCHEMAS[layoutType]
}

/**
 * 기본 레이아웃 스키마 정의
 */
export const DEFAULT_LAYOUT_SCHEMAS: Record<LayoutType, LayoutSchema> = {
  'choseong-only': {
    id: 'choseong-only',
    slots: ['CH'],
    padding: { top: 0.15, bottom: 0.15, left: 0.15, right: 0.15 },
  },

  'jungseong-vertical-only': {
    id: 'jungseong-vertical-only',
    slots: ['JU'],
    padding: { top: 0.1, bottom: 0.1, left: 0.25, right: 0.25 },
  },

  'jungseong-horizontal-only': {
    id: 'jungseong-horizontal-only',
    slots: ['JU'],
    padding: { top: 0.3, bottom: 0.3, left: 0.1, right: 0.1 },
  },

  'jungseong-mixed-only': {
    id: 'jungseong-mixed-only',
    slots: ['JU_H', 'JU_V'],
    splits: [
      { axis: 'x', value: 0.5 },
      { axis: 'y', value: 0.5 },
    ],
    padding: { top: 0.15, bottom: 0.15, left: 0.15, right: 0.15 },
  },

  'choseong-jungseong-vertical': {
    id: 'choseong-jungseong-vertical',
    slots: ['CH', 'JU'],
    splits: [{ axis: 'x', value: 0.63 }],
    padding: { top: 0.1, bottom: 0.1, left: 0.08, right: 0.08 },
  },

  'choseong-jungseong-horizontal': {
    id: 'choseong-jungseong-horizontal',
    slots: ['CH', 'JU'],
    splits: [{ axis: 'y', value: 0.55 }],
    padding: { top: 0.05, bottom: 0.05, left: 0.1, right: 0.1 },
  },

  'choseong-jungseong-mixed': {
    id: 'choseong-jungseong-mixed',
    slots: ['CH', 'JU_H', 'JU_V'],
    splits: [
      { axis: 'x', value: 0.58 },
      { axis: 'y', value: 0.55 },
    ],
    padding: { top: 0.1, bottom: 0.1, left: 0.08, right: 0.07 },
  },

  'choseong-jungseong-vertical-jongseong': {
    id: 'choseong-jungseong-vertical-jongseong',
    slots: ['CH', 'JU', 'JO'],
    splits: [
      { axis: 'x', value: 0.62 },
      { axis: 'y', value: 0.55 },
    ],
    padding: { top: 0.05, bottom: 0.05, left: 0.08, right: 0.08 },
  },

  'choseong-jungseong-horizontal-jongseong': {
    id: 'choseong-jungseong-horizontal-jongseong',
    slots: ['CH', 'JU', 'JO'],
    splits: [
      { axis: 'y', value: 0.37 },
      { axis: 'y', value: 0.60 },
    ],
    padding: { top: 0.02, bottom: 0.03, left: 0.1, right: 0.1 },
  },

  'choseong-jungseong-mixed-jongseong': {
    id: 'choseong-jungseong-mixed-jongseong',
    slots: ['CH', 'JU_H', 'JU_V', 'JO'],
    splits: [
      { axis: 'x', value: 0.58 },
      { axis: 'y', value: 0.55 },
      { axis: 'y', value: 0.76 },
    ],
    padding: { top: 0.05, bottom: 0.05, left: 0.08, right: 0.06 },
  },
}

