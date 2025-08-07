// src/App.tsx
import { useForm, type SubmitHandler } from 'react-hook-form'
import './App.css'
import { CHOSEONG_MAP, JONGSEONG_MAP, JUNGSEONG_MAP, type JamoData } from './data/Hangul'

type SyllableLayout =
  | 'choseong' //초성만
  | 'jungseongVertical' //세로중성만
  | 'jungseongHorizontal' //가로중성만
  | 'jungseonMixed' // 혼합중성만
  | 'choseong-jungseongVertical' //초성 + 세로중성
  | 'choseong-jungseongHorizontal' //초성 + 가로중성
  | 'choseong-jungseongMixed' // 초성 + 혼합중성
  | 'choseong-jungseongVertical-jongseoung' // 초성 + 세로중성 + 종성
  | 'choseong-jungseongHorizontal-jongseoung' // 초성 + 가로중성 + 종성
  | 'choseong-jungseongMixed-jongseoung' // 초성 + 혼합중성 + 종성

type SyllablePart = 'choseong' | 'jungseong' | 'jongseong'

const CANVAS_WIDTH = 24
const CANVAS_HEIGHT = 24

type SyllableMap = {
  choseong: JamoData | null
  jungseong: JamoData | null
  jongseong: JamoData | null
}

// 1) 자모 합성 제거: 그냥 split
function splitToChars(input: string): string[] {
  return input.split('')
}

// 2) 음절/자모 분해
function getUnicode(char: string): SyllableMap {
  const code = char.charCodeAt(0)
  // 완성된 음절 객체로 분해
  if (code >= 0xac00 && code <= 0xd7a3) {
    const sIndex = code - 0xac00
    const I = Math.floor(sIndex / (21 * 28))
    const M = Math.floor((sIndex % (21 * 28)) / 28)
    const F = sIndex % 28
    const iCode = 0x1100 + I
    const mCode = 0x1161 + M
    const fCode = F > 0 ? 0x11a7 + F : null
    return {
      choseong: CHOSEONG_MAP[`0x${iCode.toString(16)}`] || null,
      jungseong: JUNGSEONG_MAP[`0x${mCode.toString(16)}`] || null,
      jongseong: fCode ? JONGSEONG_MAP[`0x${fCode.toString(16)}`] || null : null,
    }
  }
  //초성만 입력시 객체로 분해
  for (const m of Object.values(CHOSEONG_MAP))
    if (m.char === char) return { choseong: m, jungseong: null, jongseong: null }
  //중성만 입력시 객체로 분해
  for (const m of Object.values(JUNGSEONG_MAP))
    if (m.char === char) return { choseong: null, jungseong: m, jongseong: null }
  //종성만 입력시 객체로 분해
  for (const m of Object.values(JONGSEONG_MAP))
    if (m.char === char) return { choseong: null, jungseong: null, jongseong: m }
  //한글이 아닌 경우
  return { choseong: null, jungseong: null, jongseong: null }
}

// 3) syllableLayout 분기
const classifyMedialType = (ch: string) => {
  if (['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅣ'].includes(ch)) return 'vertical'
  if (['ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ'].includes(ch)) return 'horizontal'
  return 'mixed'
}
function classifyLayout({ choseong, jungseong, jongseong }: SyllableMap): SyllableLayout {
  const hasI = !!choseong,
    hasM = !!jungseong,
    hasF = !!jongseong

  console.log(hasI, 'hasI')
  console.log(hasM, 'hasM')
  console.log(hasF, 'hasF')

  if (hasI && !hasM && !hasF) return 'choseong' //초성만
  if (!hasI && hasM && !hasF) return `jungseong-only-${classifyMedialType(jungseong!.char)}` as any //중성버티컬만 | 중성호리전탈만
  if (hasI && hasM && !hasF)
    return `choseong-jungseong-${classifyMedialType(jungseong!.char)}` as any // 초성+중성
  if (hasI && hasM && hasF)
    return `choseong-jungseong-${classifyMedialType(jungseong!.char)}` as any // 초성+중성+종성
  return 'full'
}

// 4) box 조정
function adjustBoxForLayout(
  box: { x: number; y: number; width: number; height: number },
  syllableLayout: SyllableLayout,
  part: SyllablePart
) {
  let { x, y, width, height } = box
  switch (syllableLayout) {
    case 'choseong':
      break
    case 'jungseongVertical':
      break
    case 'jungseongHorizontal':
      break
    case 'jungseonMixed':
      break
    case 'choseong-jungseongVertical':
      width *= 0.8
      height *= 0.8
      if (part === 'choseong') x += 2
      if (part === 'jungseong') x += 24 - width - 2
      break
    case 'choseong-jungseongHorizontal':
      width *= 0.85
      height *= 0.85
      if (part === 'choseong') y += 2
      if (part === 'jungseong') y += 24 - height - 2
      break
    case 'choseong-jungseongMixed':
      if (part === 'choseong') {
        width *= 0.7
        height *= 0.7
        x += 2
        y += 2
      }
      if (part === 'jungseong') {
        width *= 0.7
        height *= 0.7
        x += 24 - width - 2
        y += 2
      }
      if (part === 'jongseong') {
        width *= 0.5
        height *= 0.5
        x += (24 - width) / 2
        y += 24 - height - 2
      }
      break

    case 'choseong-jungseongVertical-jongseoung':
      if (part === 'choseong') {
        width *= 0.7
        height *= 0.7
        x += 2
        y += 2
      }
      if (part === 'jungseong') {
        width *= 0.7
        height *= 0.7
        x += 24 - width - 2
        y += 2
      }
      if (part === 'jongseong') {
        width *= 0.5
        height *= 0.5
        x += (24 - width) / 2
        y += 24 - height - 2
      }
      break
  }
  return { x, y, width, height }
}

// 5) paintHangul: split → 분해 → syllableLayout → draw
function paintHangul(input: string) {
  const chars = splitToChars(input)
  const parsed = chars.map((ch) => {
    const syll = getUnicode(ch)
    return {
      syllableLetter: ch,
      syllableLayout: classifyLayout(syll),
      syllableMap: syll,
    }
  })

  console.log(parsed, 'parsed')

  const canvas = document.getElementById('myCanvas') as HTMLCanvasElement
  const ctx = canvas.getContext('2d')!
  canvas.width = CANVAS_WIDTH * parsed.length
  canvas.height = CANVAS_HEIGHT
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = 'black'

  parsed.forEach(({ syllableLayout, syllableMap }, i) => {
    const ox = i * CANVAS_WIDTH
    ;(['choseong', 'jungseong', 'jongseong'] as SyllablePart[]).forEach((part) => {
      const data = syllableMap[part]
      if (!data) return
      const box = adjustBoxForLayout(data.box, syllableLayout, part)
      // 박스에 담아야 함
      console.log(box, 'box')
      data.strokes.forEach((s) => {
        const x = ox + box.x + s.x * box.width
        const y = box.y + s.y * box.height
        const w = s.width * box.width
        const h = s.height * box.height
        ctx.fillRect(x, y, w, h)
      })
    })
  })
}

// 6) React 컴포넌트
export default function App() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ myText: string }>()
  const onSubmit: SubmitHandler<{ myText: string }> = ({ myText }) => {
    paintHangul(myText)
  }
  return (
    <div style={{ padding: 20 }}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input
          {...register('myText', { required: true })}
          placeholder='한글 입력'
        />
        {errors.myText && <span style={{ color: 'red' }}>필수입니다</span>}
        <button type='submit'>저장</button>
      </form>
      <canvas
        id='myCanvas'
        style={{ border: '1px solid gray', marginTop: 12 }}
      />
    </div>
  )
}
