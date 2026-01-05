# 자동 코드리뷰 가이드라인

이 문서는 자동 코드리뷰 시 체크할 항목들을 정의합니다.
자연어로 작성하여 유연하게 관리할 수 있습니다.

## 🔒 보안 (Security)

### SQL Injection
- PreparedStatement를 사용하는가?
- 사용자 입력을 직접 쿼리에 삽입하지 않는가?
- MyBatis를 사용하는 경우 `#{}` 사용 (not `${}`)

```java
// ❌ 나쁜 예
String query = "SELECT * FROM users WHERE id = " + userId;

// ✅ 좋은 예
String query = "SELECT * FROM users WHERE id = ?";
```

### XSS (Cross-Site Scripting)
- 사용자 입력을 그대로 HTML에 출력하지 않는가?
- 입력 검증 및 이스케이프 처리가 되어 있는가?

### 민감정보 하드코딩
- API Key, Password, Secret Key 등이 코드에 하드코딩되지 않았는가?
- 환경변수나 설정 파일을 사용하는가?

```java
// ❌ 나쁜 예
String apiKey = "sk-1234567890abcdef";

// ✅ 좋은 예
String apiKey = System.getenv("API_KEY");
```

### 권한 체크
- 중요한 API 엔드포인트에 권한 체크 로직이 있는가?
- `@PreAuthorize` 또는 수동 권한 검증이 적절히 구현되었는가?

### 인증/인가
- 로그인이 필요한 기능에 인증 체크가 있는가?
- 다른 사용자의 데이터 접근 시 권한 검증이 있는가?

---

## ⚡ 성능 (Performance)

### N+1 쿼리 문제
- JPA Lazy Loading으로 인한 N+1 쿼리가 발생하지 않는가?
- `@EntityGraph`, `fetch join`, `@BatchSize` 등을 고려했는가?

```java
// ❌ 나쁜 예 - N+1 발생
for (Member member : members) {
    member.getOrders().size(); // 각 member마다 쿼리 1회
}

// ✅ 좋은 예 - fetch join 사용
@Query("SELECT m FROM Member m JOIN FETCH m.orders")
List<Member> findAllWithOrders();
```

### 불필요한 DB 호출
- 같은 데이터를 여러 번 조회하지 않는가?
- 캐시를 활용할 수 있는가?

### 대용량 데이터 처리
- 페이징 처리가 되어 있는가?
- 메모리 사용량을 고려했는가?
- Batch 처리가 필요한가?

```java
// ❌ 나쁜 예 - 전체 데이터 조회
List<Member> allMembers = memberRepository.findAll();

// ✅ 좋은 예 - 페이징
Page<Member> members = memberRepository.findAll(PageRequest.of(0, 100));
```

### 불필요한 반복문
- Stream API를 적절히 활용하는가?
- 중첩 반복문의 시간복잡도는 적절한가? (O(n²) 주의)

### 캐시 활용
- 자주 조회되는 데이터는 캐시를 고려했는가?
- `@Cacheable` 사용이 적절한가?

---

## 🎯 코드 품질 (Code Quality)

### 중복 코드 (DRY - Don't Repeat Yourself)
- 같은 로직이 여러 곳에 반복되지 않는가?
- 공통 로직을 메서드나 유틸 클래스로 분리했는가?

### 네이밍 (Naming Convention)
- 변수/메서드/클래스명이 명확하고 의미 있는가?
- 팀의 네이밍 컨벤션을 따르는가?
- 약어 사용이 적절한가?

```java
// ❌ 나쁜 예
int d; // 무엇을 의미하는가?
void proc(); // 무슨 처리?

// ✅ 좋은 예
int daysUntilExpiration;
void processPayment();
```

### 메서드 길이
- 하나의 메서드가 너무 길지 않은가? (50줄 이상 주의)
- 하나의 메서드는 하나의 책임만 가지는가?

### 주석 품질
- 복잡한 로직에 설명 주석이 있는가?
- 불필요한 주석은 없는가?
- TODO/FIXME가 남아있지 않은가?

### Exception 처리
- 적절한 예외 처리가 되어 있는가?
- `catch (Exception e)` 같은 광범위한 catch는 피했는가?
- 예외를 무시하지 않는가? (empty catch block)

```java
// ❌ 나쁜 예
try {
    riskyOperation();
} catch (Exception e) {
    // 무시
}

// ✅ 좋은 예
try {
    riskyOperation();
} catch (SpecificException e) {
    log.error("Operation failed", e);
    throw new CustomException("Failed to process", e);
}
```

### 테스트 코드
- 새로운 기능에 대한 테스트 코드가 작성되었는가?
- 기존 테스트가 깨지지 않았는가?
- 엣지 케이스에 대한 테스트가 있는가?

### 매직 넘버/문자열
- 하드코딩된 숫자나 문자열을 상수로 정의했는가?

```java
// ❌ 나쁜 예
if (status == 1) { ... }

// ✅ 좋은 예
private static final int STATUS_ACTIVE = 1;
if (status == STATUS_ACTIVE) { ... }
```

---

## 🏗️ 아키텍처 (Architecture)

### Layer 분리
- Controller - Service - Repository 계층이 명확히 분리되어 있는가?
- 각 계층의 책임이 적절한가?
- Controller에 비즈니스 로직이 들어가지 않았는가?

### 순환 참조
- 클래스/모듈 간 순환 참조가 없는가?
- 의존성 방향이 명확한가?

### 불필요한 의존성
- 사용하지 않는 import가 있는가?
- 꼭 필요한 의존성만 추가했는가?

### DTO vs Entity
- Entity를 직접 반환하지 않고 DTO를 사용하는가?
- 계층 간 데이터 전달에 적절한 객체를 사용하는가?

### 트랜잭션 관리
- `@Transactional` 사용이 적절한가?
- 트랜잭션 범위가 너무 크지 않은가?
- readOnly 옵션을 활용하는가?

---

## 🔧 기타 (Others)

### 로깅
- 적절한 로그 레벨을 사용하는가? (DEBUG, INFO, WARN, ERROR)
- 민감정보가 로그에 남지 않는가?
- 불필요하게 많은 로그를 남기지 않는가?

```java
// ❌ 나쁜 예
log.info("User password: " + password);

// ✅ 좋은 예
log.info("User login attempt: userId={}", userId);
```

### 설정 파일
- 환경별 설정이 적절히 분리되어 있는가?
- 하드코딩된 설정값을 외부 설정 파일로 관리하는가?

### API 스펙 변경
- 기존 API를 breaking change 없이 수정했는가?
- 버전 관리가 필요한가?

### 문서화
- API 문서가 업데이트되었는가?
- README나 위키 업데이트가 필요한가?

---

## 📋 체크리스트 우선순위

### 🔴 Critical (반드시 체크)
1. 보안 취약점 (SQL Injection, XSS, 민감정보 노출)
2. N+1 쿼리 문제
3. Exception 처리 누락
4. 트랜잭션 관리 문제

### 🟡 Important (중요)
1. 코드 중복
2. 성능 이슈
3. 테스트 코드 누락
4. Layer 분리 위반

### 🟢 Nice to Have (권장)
1. 네이밍 개선
2. 주석 추가
3. 매직 넘버 제거
4. 로깅 개선

---

## 💡 리뷰 코멘트 작성 가이드

### 좋은 코멘트 예시

**보안 이슈**
```
⚠️ **보안**: SQL Injection 취약점

현재 사용자 입력을 직접 쿼리에 삽입하고 있습니다.

Line 45:
String query = "SELECT * FROM users WHERE name = '" + userName + "'";

**개선 제안**:
PreparedStatement 또는 MyBatis의 #{} 문법을 사용하세요.
String query = "SELECT * FROM users WHERE name = ?";
```

**성능 이슈**
```
⚡ **성능**: N+1 쿼리 발생 가능

Line 67-70의 반복문에서 각 Member마다 Orders를 조회하고 있습니다.
100명의 회원이면 101번의 쿼리가 실행됩니다.

**개선 제안**:
fetch join을 사용하여 한 번에 조회하세요.
@Query("SELECT m FROM Member m LEFT JOIN FETCH m.orders")
```

**코드 품질**
```
📝 **리팩토링 제안**: 중복 코드

Line 120-130과 Line 200-210에 동일한 검증 로직이 있습니다.

**개선 제안**:
공통 메서드로 추출하는 것이 좋겠습니다.
private void validateMemberStatus(Member member) { ... }
```

### 코멘트 톤
- 부정적이지 않고 건설적으로
- "왜 이것이 문제인지" 설명
- 구체적인 개선 방안 제시
- 코드 예시 포함

---

## 🚀 추가 설정 방법

이 파일을 수정하여 팀의 코드리뷰 기준을 커스터마이징할 수 있습니다.

```bash
vi ~/.claude/skills/pr-automation/review-guidelines.md
```

새로운 체크 항목을 추가하거나, 기존 항목의 우선순위를 조정할 수 있습니다.
