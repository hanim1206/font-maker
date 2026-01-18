# 한글 폰트 메이커 (Korean Font Maker)

## 프로젝트 개요

한글 글자를 자모(초성, 중성, 종성)로 분해하여 각 부분의 위치와 크기를 조정할 수 있는 웹 기반 폰트 디자인 도구입니다. 사용자가 직접 레이아웃 프리셋을 만들고, 자모의 획(stroke) 데이터를 편집할 수 있습니다.

## 주요 기능

### 1. 레이아웃 편집 모드
- **박스 위치 조정**: 초성(CH), 중성(JU), 종성(JO) 각각의 위치(x, y)와 크기(width, height) 조정
- **프리셋 시스템**: 다양한 레이아웃 타입(L1, L2, L3 등)별로 프리셋 생성 및 관리
- **실시간 미리보기**: 입력한 텍스트에 레이아웃 적용 결과 즉시 확인
- **코드 생성**: 편집한 프리셋을 defaultPresets.ts 형식의 코드로 출력

### 2. 문자 편집 모드 (최근 추가)
- **자모 선택**: 초성 19개, 중성 21개, 종성 27개 중 선택
- **획 편집**:
  - 클릭으로 획 선택
  - 키보드 컨트롤:
    - 방향키: 획 위치 이동 (x, y ±0.01)
    - Shift + 방향키: 획 크기 조절 (width, height ±0.01)
  - 숫자 입력으로 정밀 조정
- **실시간 미리보기**: 선택된 획은 빨간색으로 강조 표시
- **코드 생성**: 편집한 자모를 Hangul.ts 형식의 코드로 출력

### 3. 뷰 모드
- **Preview**: 텍스트 입력 및 글자별 미리보기
- **Presets**: 프리셋 목록 및 선택
- **Editor**: 레이아웃/문자 편집

## 기술 스택

- **프레임워크**: React 18 + TypeScript
- **빌드 도구**: Vite
- **상태 관리**: Zustand (with Immer)
- **스타일링**: CSS Modules
- **PWA**: Vite PWA Plugin

## 프로젝트 구조

```
my-font-maker/
├── src/
│   ├── components/           # React 컴포넌트
│   │   ├── BoxEditor/       # 레이아웃 편집 UI
│   │   │   ├── BoxEditor.tsx
│   │   │   ├── BoxConfigForm.tsx
│   │   │   └── BoxPreview.tsx
│   │   ├── CharacterEditor/ # 문자 편집 UI (신규)
│   │   │   ├── CharacterEditor.tsx
│   │   │   ├── JamoSelector.tsx
│   │   │   ├── CharacterPreview.tsx
│   │   │   ├── StrokeList.tsx
│   │   │   └── StrokeEditor.tsx
│   │   ├── PreviewPanel/    # 미리보기 패널
│   │   └── PresetPanel/     # 프리셋 패널
│   │
│   ├── stores/              # Zustand 상태 관리
│   │   ├── uiStore.ts       # UI 상태 (뷰모드, 선택, 편집모드 등)
│   │   └── presetStore.ts   # 프리셋 데이터
│   │
│   ├── data/                # 정적 데이터
│   │   ├── Hangul.ts        # 자모 획 데이터 (CHOSEONG_MAP, JUNGSEONG_MAP, JONGSEONG_MAP)
│   │   └── defaultPresets.ts # 기본 레이아웃 프리셋
│   │
│   ├── utils/               # 유틸리티 함수
│   │   └── hangulUtils.ts   # 한글 분해/조합 로직
│   │
│   ├── renderers/           # 렌더링 로직
│   │   └── SvgRenderer.tsx  # SVG 렌더링 엔진
│   │
│   └── types/               # TypeScript 타입 정의
│       └── index.ts
│
└── public/                  # 정적 파일
```

## 핵심 개념

### 1. 한글 분해 (Hangul Decomposition)

한글 음절(예: "한")을 초성(ㅎ), 중성(ㅏ), 종성(ㄴ)으로 분해합니다.

```typescript
// 예: "한" → { choseong: 'ㅎ', jungseong: 'ㅏ', jongseong: 'ㄴ' }
const syllable = decomposeSyllable('한')
```

### 2. 레이아웃 타입 (Layout Type)

중성의 모양에 따라 9가지 레이아웃으로 분류:
- **L1**: 세로 중성 + 종성 없음 (예: 가, 나)
- **L2**: 세로 중성 + 종성 있음 (예: 간, 난)
- **L3**: 가로 중성 + 종성 없음 (예: 고, 노)
- **L4**: 가로 중성 + 종성 있음 (예: 곤, 논)
- **L5**: 혼합 중성 + 종성 없음 (예: 과, 놔)
- **L6**: 혼합 중성 + 종성 있음 (예: 관, 놴)
- **L7-L9**: 특수 케이스

### 3. 박스 시스템 (Box System)

각 자모가 차지할 영역을 정규화된 좌표(0-1)로 정의:

```typescript
interface BoxConfig {
  x: number      // 0-1 (왼쪽부터)
  y: number      // 0-1 (위에서부터)
  width: number  // 0-1
  height: number // 0-1
}

// 예: L1 레이아웃의 초성 박스
CH: { x: 0.05, y: 0.05, width: 0.45, height: 0.9 }
```

### 4. 획 시스템 (Stroke System)

각 자모의 획을 사각형으로 표현:

```typescript
interface StrokeData {
  id: string           // 예: 'ㄱ-1'
  x: number           // 0-1 (자모 박스 내 상대 좌표)
  y: number           // 0-1
  width: number       // 0-1
  height: number      // 0-1
  direction: 'horizontal' | 'vertical'
}

// 예: ㄱ의 첫 번째 획 (가로)
h('ㄱ-1', 0.1, 0.15, 0.7, 0.15)
```

### 5. 렌더링 파이프라인

```
입력 텍스트
    ↓
decomposeSyllable() - 자모 분해
    ↓
레이아웃 타입 결정 (L1-L9)
    ↓
프리셋에서 박스 좌표 가져오기
    ↓
Hangul.ts에서 획 데이터 가져오기
    ↓
SvgRenderer - SVG로 렌더링
```

## 상태 관리

### UIStore (uiStore.ts)

```typescript
{
  viewMode: 'preview' | 'presets' | 'editor',
  inputText: string,
  selectedPresetId: string | null,
  editingPresetId: string | null,
  selectedCharIndex: number,
  editMode: 'layout' | 'character',      // 편집 모드
  editingJamoType: 'choseong' | 'jungseong' | 'jongseong' | null,
  editingJamoChar: string | null,        // 예: 'ㄱ'
  selectedStrokeId: string | null        // 예: 'ㄱ-1'
}
```

### PresetStore (presetStore.ts)

```typescript
{
  presets: Preset[],
  addPreset: (preset: Preset) => void,
  updatePreset: (id: string, changes: Partial<Preset>) => void,
  deletePreset: (id: string) => void
}
```

## 데이터 흐름

### 레이아웃 편집 워크플로우

1. 사용자가 프리셋 선택 → `setEditingPresetId()`
2. BoxEditor가 프리셋 로드 → draft state에 복사
3. 사용자가 박스 좌표 수정 → `setDraftBox()`
4. "저장" 클릭 → `updatePreset()` + 콘솔에 코드 출력
5. 사용자가 defaultPresets.ts에 코드 붙여넣기

### 문자 편집 워크플로우

1. "문자 편집" 모드 진입 → `setEditMode('character')`
2. 자모 선택 (예: ㄱ) → `setEditingJamo('choseong', 'ㄱ')`
3. CHOSEONG_MAP['ㄱ'].strokes 로드 → draft state
4. 획 선택 → `setSelectedStrokeId('ㄱ-1')`
5. 키보드/마우스로 편집 → draft strokes 업데이트
6. "저장" 클릭 → 콘솔에 코드 출력
7. 사용자가 Hangul.ts에 코드 붙여넣기 → 페이지 새로고침

## 주요 파일 설명

### Hangul.ts
자모별 획 데이터 정의. 초성 19개, 중성 21개, 종성 27개의 획 정보를 포함합니다.

```typescript
export const CHOSEONG_MAP: Record<string, JamoData> = {
  'ㄱ': {
    char: 'ㄱ',
    type: 'choseong',
    strokes: [
      h('ㄱ-1', 0.1, 0.15, 0.7, 0.15),  // 가로획
      v('ㄱ-2', 0.7, 0.15, 0.15, 0.7),  // 세로획
    ],
  },
  // ... 18개 더
}
```

### hangulUtils.ts
한글 처리 핵심 로직:
- `decomposeSyllable()`: 음절 → 자모 분해
- `getLayoutType()`: 중성에 따른 레이아웃 타입 결정
- Unicode 기반 한글 계산

### SvgRenderer.tsx
획 데이터와 박스 좌표를 받아 SVG로 렌더링:
- ViewBox: 100x100 (정규화된 공간)
- 박스 좌표와 획 좌표를 곱해서 최종 위치 계산
- 둥근 모서리(rx, ry) 적용

## 개발 가이드

### 로컬 실행

```bash
npm install
npm run dev
```

### 빌드

```bash
npm run build
```

### 새 프리셋 추가

1. PresetPanel에서 "프리셋 추가" 클릭
2. BoxEditor에서 박스 좌표 조정
3. "저장" 클릭 → 콘솔에서 코드 복사
4. `src/data/defaultPresets.ts`에 붙여넣기

### 자모 획 수정

1. BoxEditor에서 "문자 편집" 모드 진입
2. 수정할 자모 선택 (예: ㄱ)
3. 획 선택 후 키보드/마우스로 편집
4. "저장" 클릭 → 콘솔에서 코드 복사
5. `src/data/Hangul.ts`에 붙여넣기
6. 페이지 새로고침

## 확장 가능성

### 향후 개선 방향

1. **획 추가/삭제**: 현재는 기존 획만 수정 가능
2. **드래그 앤 드롭**: 마우스로 획 직접 이동/리사이즈
3. **Undo/Redo**: 편집 히스토리 관리
4. **내보내기**: TTF/OTF 폰트 파일 생성
5. **협업 기능**: 프리셋/자모 데이터 공유
6. **모바일 최적화**: 터치 기반 편집 UI

## 라이선스

MIT

## 문의

GitHub Issues를 통해 버그 리포트나 기능 제안을 남겨주세요.
