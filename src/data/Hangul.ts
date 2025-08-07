export interface StrokeRel {
  strokeId: string
  x: number // 상대 박스 기준 0~1 좌표
  y: number
  width: number
  height: number
  direction: 'horizontal' | 'vertical'
}

export interface JamoData {
  char: string
  type: 'choseong' | 'jungseong' | 'jongseong'
  box: { x: number; y: number; width: number; height: number }
  strokes: StrokeRel[]
}

export const CHOSEONG_LIST = [
  'ㄱ',
  'ㄲ',
  'ㄴ',
  'ㄷ',
  'ㄸ',
  'ㄹ',
  'ㅁ',
  'ㅂ',
  'ㅃ',
  'ㅅ',
  'ㅆ',
  'ㅇ',
  'ㅈ',
  'ㅉ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
]
export const JUNGSEONG_LIST = [
  'ㅏ',
  'ㅐ',
  'ㅑ',
  'ㅒ',
  'ㅓ',
  'ㅔ',
  'ㅕ',
  'ㅖ',
  'ㅗ',
  'ㅘ',
  'ㅙ',
  'ㅚ',
  'ㅛ',
  'ㅜ',
  'ㅝ',
  'ㅞ',
  'ㅟ',
  'ㅠ',
  'ㅡ',
  'ㅢ',
  'ㅣ',
]
export const JONGSEONG_LIST = [
  '',
  'ㄱ',
  'ㄲ',
  'ㄳ',
  'ㄴ',
  'ㄵ',
  'ㄶ',
  'ㄷ',
  'ㄹ',
  'ㄺ',
  'ㄻ',
  'ㄼ',
  'ㄽ',
  'ㄾ',
  'ㄿ',
  'ㅀ',
  'ㅁ',
  'ㅂ',
  'ㅄ',
  'ㅅ',
  'ㅆ',
  'ㅇ',
  'ㅈ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
]

// 초성 ㄱ (U+1100)
export const CHOSEONG_MAP: Record<string, JamoData> = {
  '0x1100': {
    char: 'ㄱ',
    type: 'choseong',
    box: { x: 2, y: 2, width: 20, height: 20 },
    strokes: [
      {
        strokeId: 'ㄱ-1',
        x: 2 / 20,
        y: 2 / 20,
        width: 14 / 20,
        height: 3 / 20,
        direction: 'horizontal',
      },
      {
        strokeId: 'ㄱ-2',
        x: 17 / 20,
        y: 2 / 20,
        width: 3 / 20,
        height: 16 / 20,
        direction: 'vertical',
      },
    ],
  },
}

// 중성 ㅣ (U+1175)
export const JUNGSEONG_MAP: Record<string, JamoData> = {
  '0x1175': {
    char: 'ㅣ',
    type: 'jungseong',
    box: { x: 2, y: 2, width: 20, height: 20 },
    strokes: [
      {
        strokeId: 'ㅣ-1',
        x: 14 / 20,
        y: 2 / 20,
        width: 2 / 20,
        height: 20 / 20,
        direction: 'vertical',
      },
    ],
  },
}

// 종성 ㅁ (U+11B7)
export const JONGSEONG_MAP: Record<string, JamoData> = {
  '0x11b7': {
    char: 'ㅁ',
    type: 'jongseong',
    box: { x: 2, y: 2, width: 20, height: 20 },
    strokes: [
      {
        strokeId: 'ㅁ-1',
        x: 4 / 20,
        y: 16 / 20,
        width: 16 / 20,
        height: 2 / 20,
        direction: 'horizontal',
      },
      {
        strokeId: 'ㅁ-2',
        x: 4 / 20,
        y: 16 / 20,
        width: 2 / 20,
        height: 6 / 20,
        direction: 'vertical',
      },
      {
        strokeId: 'ㅁ-3',
        x: 18 / 20,
        y: 16 / 20,
        width: 2 / 20,
        height: 6 / 20,
        direction: 'vertical',
      },
      {
        strokeId: 'ㅁ-4',
        x: 4 / 20,
        y: 22 / 20,
        width: 16 / 20,
        height: 2 / 20,
        direction: 'horizontal',
      },
    ],
  },
}
