# ☕ 커피수첩

나만의 커피 추출 기록 앱. 레시피를 관리하고, 추출 과정을 기록하고, 히스토리를 분석하세요.

## Prerequisites

| 요구사항 | 버전 |
|----------|------|
| **Node.js** | v18.18.0 이상 |
| **npm** | v9 이상 (Node.js에 포함) |
| **Python** | v3.x (better-sqlite3 네이티브 빌드에 필요) |
| **C++ 빌드 도구** | OS별 아래 참고 |

### OS별 C++ 빌드 도구 설치

better-sqlite3는 네이티브 모듈이므로 빌드 도구가 필요합니다.

**macOS:**
```bash
xcode-select --install
```

**Ubuntu/Debian:**
```bash
sudo apt-get install -y build-essential python3
```

**Windows:**
```bash
npm install -g windows-build-tools
# 또는 Visual Studio Build Tools 설치
```

## Getting Started

```bash
# 1. 저장소 클론
git clone https://github.com/johnkim6823/Coffee-Note.git
cd Coffee-Note

# 2. 의존성 설치
npm install

# 3. 개발 서버 시작
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 앱을 확인하세요.

> SQLite 데이터베이스(`coffee-note.db`)는 첫 실행 시 자동 생성되며, 기본 레시피(모모스 6종)가 시드됩니다.

## Scripts

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 시작 (http://localhost:3000) |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 시작 |
| `npm run lint` | ESLint 코드 검사 |

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: SQLite (better-sqlite3)
- **Runtime**: Node.js

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── recipes/        # 레시피 CRUD API
│   │   └── records/        # 기록 CRUD API
│   ├── globals.css         # 글로벌 스타일
│   ├── layout.tsx          # 루트 레이아웃
│   └── page.tsx            # 메인 페이지 (탭 네비게이션)
├── components/
│   ├── RecipesTab.tsx      # 탭1: 레시피 목록
│   ├── RecipeForm.tsx      # 레시피 추가/수정 폼
│   ├── RecordTab.tsx       # 탭2: 기록하기
│   ├── HistoryTab.tsx      # 탭3: 히스토리
│   ├── BrewTimer.tsx       # 추출 타이머
│   └── StatsView.tsx       # 통계/분석
└── lib/
    ├── db.ts               # SQLite 초기화 + 시드
    └── types.ts            # 타입 정의 + 유틸
```

## Features

### 레시피 관리
- 로스터리/블랜드 종류별 섹션 구분
- Hot/Iced 모드 전환
- ×3 룰 자동 계산 지원
- 교반 타이밍 강조 (초록색), 최종 목표량 강조 (노란색)
- 기본 제공 레시피 잠금, 사용자 레시피 추가/수정/삭제

### 추출 기록
- 원두 선택 시 레시피 기준값 자동 표시
- 단계별 실제 추출량 입력 + 총 추출량 자동 합산
- 별점 (1~5) + 자유 텍스트 후기

### 추출 타이머
- 단계별 스톱워치 (시작/다음단계/정지)
- 각 단계 소요 시간 자동 기록
- 기록 저장 시 타이머 데이터 함께 저장

### 히스토리 & 통계
- 최신순 기록 목록 + 원두명/Hot·Iced 필터
- 카드 클릭 상세보기 + 삭제
- 원두별 평균 별점, 추출 횟수, 선호 온도 분석

### 기타
- 레시피 내보내기/가져오기 (JSON)
- 같은 원두 기록 비교 기능
- 다크 모드 지원
- 모바일 우선 반응형 디자인

## Default Recipes

모모스(MOMOS) 로스터리 기본 제공:

| 원두명 | 블랜드 | Hot | Iced |
|--------|--------|-----|------|
| 가을온기 | 시즈널 | 16~18g / 94~97°C / ×3룰 | 22g / 90~100°C |
| 겨울 툰드라 | 시즈널 | 16~18g / 94~97°C / ×3룰 | 22g / 97~100°C |
| 에스쇼콜라 | 시그니처 | 20g / 93~95°C | 20g / 93~95°C |
| 부산 블랜드 | 시그니처 | 20g / 93~95°C | 20g / 93~95°C |
| 푸루티봉봉 | 시그니처 | 14~18g / 94~95°C / ×3룰 | 22g / 97~100°C |
| 모쵸베리 블랜드 | 시그니처 | 16~18g / 94~97°C / ×3룰 | 22g / 97~100°C |

## License

Private project.
