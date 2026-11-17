# Vue + Express 게시판 REST API

웹서비스설계 실습의 기존 Vue + Express 게시판을 확장하여 **GET·POST·PUT·DELETE 메서드별 2개씩, 총 8개 REST API**를 구현한 프로젝트입니다. 기존 PATCH API도 유지하며, 요청 로그 미들웨어와 HTTP 상태 코드별 오류 처리를 포함합니다.

## 1. 기술 스택

- **Frontend:** Vue 3, HTML, CSS, JavaScript
- **Backend:** Node.js, Express 5
- **Database:** SQLite(sql.js), TypeORM
- **API 테스트:** VS Code REST Client (`requests.http`)

## 2. 설치 및 실행

Node.js **20.19 이상**이 필요합니다.

```bash
npm ci
npm start
```

- 웹 화면: http://127.0.0.1:3000
- API 기본 주소: http://127.0.0.1:3000/api/posts
- 개발 중 자동 재시작: `npm run dev`

서버를 실행한 상태에서 브라우저 또는 VS Code REST Client로 API를 확인합니다. 데이터는 프로젝트의 `posts.sqlite`에 저장됩니다.

## 3. REST API 명세 (필수 8개)

| 번호 | 메서드 | 경로 | 기능 | 정상 상태 코드 |
|---|---|---|---|---|
| 1 | POST | `/api/posts` | 게시글 생성 | `201 Created` |
| 2 | POST | `/api/posts/:id/duplicate` | 기존 게시글 복제 | `201 Created` |
| 3 | GET | `/api/posts` | 전체 게시글 조회 | `200 OK` |
| 4 | GET | `/api/posts/:id` | 특정 게시글 조회 | `200 OK` |
| 5 | PUT | `/api/posts/:id` | 제목과 내용 전체 수정 | `200 OK` |
| 6 | PUT | `/api/posts/:id/title` | 제목만 수정 | `200 OK` |
| 7 | DELETE | `/api/posts/:id` | 특정 게시글 삭제 | `204 No Content` |
| 8 | DELETE | `/api/posts` | 전체 게시글 삭제 | `204 No Content` |

기존 `PATCH /api/posts/:id`(일부 수정)는 추가 기능으로 유지하지만 필수 API 8개 집계에는 포함하지 않습니다.


### 요청 예시

게시글 생성:

```http
POST http://127.0.0.1:3000/api/posts
Content-Type: application/json

{
  "title": "첫 게시글",
  "content": "웹서비스설계 실습입니다."
}
```

생성 성공 시 `201 Created`와 `Location: /api/posts/{id}` 헤더 및 생성된 게시글 JSON이 반환됩니다.

전체 수정:

```http
PUT http://127.0.0.1:3000/api/posts/5
Content-Type: application/json

{
  "title": "수정된 제목",
  "content": "수정된 내용"
}
```

제목만 수정:

```http
PUT http://127.0.0.1:3000/api/posts/6/title
Content-Type: application/json

{
  "title": "새로운 제목"
}
```

위 ID `5`, `6`은 예시입니다. POST 생성·복제 응답에서 받은 실제 ID를 사용해야 합니다.

## 4. 요청 로그 미들웨어

`server/main.js`에서 모든 요청의 HTTP 메서드, URL, 응답 상태 코드 및 처리 시간을 기록하는 미들웨어를 사용합니다.

```text
[REQUEST] GET /api/posts
[RESPONSE] 200 - 9ms
```

`res.on('finish')` 이벤트로 응답 완료 시점의 상태 코드와 처리 시간을 출력하며, `next()`로 후속 처리에 요청을 전달합니다.

## 5. HTTP 상태 코드 검증

| 범주 | 상태 코드 | 검증 시나리오 |
|---|---|---|
| 2xx | `200 OK` | 게시글 목록 또는 상세 조회 |
| 2xx | `201 Created` | 게시글 생성 또는 복제 |
| 4xx | `400 Bad Request` | 빈 제목으로 게시글 생성 요청 |
| 4xx | `404 Not Found` | 존재하지 않거나 삭제된 게시글 조회 |
| 5xx | `500 Internal Server Error` | 개발용 오류 재현 경로 호출 |
| 5xx | `503 Service Unavailable` | 개발용 서비스 이용 불가 경로 호출 |

개발용 오류 재현 경로는 다음과 같습니다.

```http
GET http://127.0.0.1:3000/api/test/500
GET http://127.0.0.1:3000/api/test/503
```

두 경로는 `NODE_ENV !== 'production'` 조건에서만 등록하도록 구성했습니다. 실제 서비스 운영 시 테스트용 오류 경로가 노출되지 않도록 주의해야 합니다.

오류 응답 예시:

```json
{
  "statusCode": 400,
  "message": "title는 1–100자여야 합니다."
}
```

서버 오류(5xx)는 내부 오류 세부 정보를 응답에 노출하지 않고 공통 메시지 `서버 처리 중 오류가 발생했습니다.`를 반환합니다.

## 6. API 8개 테스트 시나리오

테스트 도구: **VS Code REST Client**. 서버를 먼저 실행한 뒤 `requests.http`에서 아래 순서대로 요청을 보냅니다.

| 순서 | 요청 | 확인 사항 | 예상 결과 |
|---|---|---|---|
| 1 | POST 게시글 생성 | 새 게시글 ID 반환 | 201 |
| 2 | GET 전체 목록 | 생성된 게시글 포함 | 200 |
| 3 | GET 상세 조회 | 생성한 게시글 내용 일치 | 200 |
| 4 | POST 게시글 복제 | 원본과 다른 ID로 복제 | 201 |
| 5 | PUT 전체 수정 | 제목과 내용 모두 변경 | 200 |
| 6 | PUT 제목 수정 | 제목만 변경되고 내용 유지 | 200 |
| 7 | DELETE 개별 삭제 | 지정 게시글 삭제 | 204 |
| 8 | DELETE 전체 삭제 | 남은 게시글 모두 삭제 | 204 |

**추가 확인:** 전체 삭제 후 `GET /api/posts`는 `200 OK`와 빈 배열 `[]`를 반환해야 합니다. 개별 삭제한 게시글을 다시 조회하면 `404 Not Found`가 정상입니다.

모든 API 테스트는 개발 환경에서 REST Client로 직접 수행했습니다. 

## 7. 프로젝트 구조

```text
week03-express-vue/
├── server/
│   ├── main.js            # Express 서버, 미들웨어, 오류 처리
│   ├── posts.routes.js    # REST API 라우팅
│   ├── posts.service.js   # 게시글 비즈니스 로직
│   ├── input.js           # 입력값 및 ID 검증
│   ├── database.js        # TypeORM 및 SQLite 연결
│   ├── post.entity.js     # 게시글 엔티티
│   └── migration.js       # DB 초기 스키마
├── public/
│   ├── index.html         # 게시판 화면
│   ├── app.js             # Vue 프론트엔드 동작
│   └── style.css          # 화면 스타일
├── requests.http          # API 수동 테스트 요청
├── package.json
├── package-lock.json
└── README.md
```

## 8. 구현 및 테스트 시 유의사항

- `POST /api/posts`의 응답 ID를 확인하여 상세 조회·수정·삭제 요청에 사용합니다.
- 복제 API가 반환한 새 ID는 원본 게시글의 ID와 다릅니다.
- `204 No Content`는 응답 본문이 없는 것이 정상입니다.
- 빈 목록을 조회할 때는 `404`가 아니라 `200 OK`와 `[]`를 반환합니다.
- `PUT /api/posts/:id/title`과 기존 `PATCH /api/posts/:id`는 제목만 변경하는 요청에서 결과가 비슷하지만 메서드와 경로가 다릅니다.
- 테스트용 500·503 경로는 서버 오류 응답 처리를 검증하기 위한 개발용 기능입니다.

## 9. 참고 문서

- [Express Routing](https://expressjs.com/en/guide/routing.html)
- [Express Error Handling](https://expressjs.com/en/guide/error-handling.html)
- [Vue Guide](https://vuejs.org/guide/introduction.html)
