import { useEffect, useRef, useState } from 'react'

const BUSINESS_TIME = 120

const foods = [
  { emoji: '🌶️', name: '떡볶이', cookingTime: 2, price: 4000 },
  { emoji: '🍙', name: '김밥', cookingTime: 2, price: 3500 },
  { emoji: '🍢', name: '어묵', cookingTime: 1, price: 1500 },
  { emoji: '🍤', name: '튀김', cookingTime: 2, price: 3000 },
]

const customers = [
  { emoji: '👧🏻', label: '어린이 손님' },
  { emoji: '👦🏻', label: '어린이 손님' },
  { emoji: '👩🏻', label: '여성 손님' },
  { emoji: '👨🏻', label: '남성 손님' },
  { emoji: '👵🏻', label: '할머니 손님' },
  { emoji: '👴🏻', label: '할아버지 손님' },
]

function getRandomFood() {
  const randomIndex = Math.floor(Math.random() * foods.length)
  return foods[randomIndex] ?? foods[0]
}

function getRandomCustomer(previousEmoji?: string) {
  const availableCustomers = previousEmoji
    ? customers.filter((customer) => customer.emoji !== previousEmoji)
    : customers
  const randomIndex = Math.floor(Math.random() * availableCustomers.length)
  return availableCustomers[randomIndex] ?? customers[0]
}

function App() {
  const [order, setOrder] = useState(getRandomFood)
  const [customer, setCustomer] = useState(getRandomCustomer)
  const [money, setMoney] = useState(10000)
  const [cookingFood, setCookingFood] = useState<(typeof foods)[number] | null>(null)
  const [cookingProgress, setCookingProgress] = useState(0)
  const [isWaitingForCustomer, setIsWaitingForCustomer] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [lastSalePrice, setLastSalePrice] = useState(0)
  const [customerTimeLeft, setCustomerTimeLeft] = useState(10)
  const [customerResult, setCustomerResult] = useState<'success' | 'timeout'>('success')
  const [businessTimeLeft, setBusinessTimeLeft] = useState(BUSINESS_TIME)
  const [isGameOver, setIsGameOver] = useState(false)
  const [totalSales, setTotalSales] = useState(0)
  const [visitorCount, setVisitorCount] = useState(1)
  const [successCount, setSuccessCount] = useState(0)
  const [failureCount, setFailureCount] = useState(0)
  const [successStreak, setSuccessStreak] = useState(0)
  const [bestSuccessStreak, setBestSuccessStreak] = useState(0)
  const gameOverRef = useRef(false)

  gameOverRef.current = isGameOver

  const isCooking = cookingFood !== null && cookingProgress < 100
  const isComplete = cookingFood !== null && cookingProgress === 100
  const remainingTime = cookingFood
    ? Math.max(0, cookingFood.cookingTime * (1 - cookingProgress / 100))
    : 0

  useEffect(() => {
    if (!cookingFood || isGameOver) return

    const startedAt = Date.now()
    const duration = cookingFood.cookingTime * 1000

    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt
      const nextProgress = Math.min(100, (elapsed / duration) * 100)

      setCookingProgress(nextProgress)

      if (nextProgress === 100) {
        window.clearInterval(timer)
      }
    }, 50)

    return () => window.clearInterval(timer)
  }, [cookingFood, isGameOver])

  useEffect(() => {
    if (!isWaitingForCustomer || isGameOver) return

    const timer = window.setTimeout(() => {
      if (gameOverRef.current) return

      setOrder(getRandomFood())
      setCustomer((currentCustomer) => getRandomCustomer(currentCustomer.emoji))
      setVisitorCount((currentCount) => currentCount + 1)
      setFeedbackMessage('')
      setIsWaitingForCustomer(false)
    }, 1300)

    return () => window.clearTimeout(timer)
  }, [isWaitingForCustomer, isGameOver])

  useEffect(() => {
    if (isWaitingForCustomer || isGameOver) return

    const startedAt = Date.now()
    const waitingTime = 10000

    setCustomerTimeLeft(10)

    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt
      const nextTimeLeft = Math.max(0, (waitingTime - elapsed) / 1000)

      setCustomerTimeLeft(nextTimeLeft)

      if (nextTimeLeft === 0) {
        window.clearInterval(timer)
        if (gameOverRef.current) return

        setCustomerResult('timeout')
        setFeedbackMessage('손님이 화가 나서 떠났어요!')
        setLastSalePrice(0)
        setFailureCount((currentCount) => currentCount + 1)
        setSuccessStreak(0)
        setCookingFood(null)
        setCookingProgress(0)
        setIsWaitingForCustomer(true)
      }
    }, 100)

    return () => window.clearInterval(timer)
  }, [isWaitingForCustomer, isGameOver])

  useEffect(() => {
    if (isGameOver) return

    const startedAt = Date.now()
    const duration = BUSINESS_TIME * 1000

    setBusinessTimeLeft(BUSINESS_TIME)

    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt
      const nextTimeLeft = Math.max(0, (duration - elapsed) / 1000)

      setBusinessTimeLeft(nextTimeLeft)

      if (nextTimeLeft === 0) {
        window.clearInterval(timer)
        gameOverRef.current = true
        setIsGameOver(true)
      }
    }, 100)

    return () => window.clearInterval(timer)
  }, [isGameOver])

  function startCooking(food: (typeof foods)[number]) {
    if (cookingFood || isWaitingForCustomer || isGameOver) return

    setFeedbackMessage('')
    setCookingProgress(0)
    setCookingFood(food)
  }

  function giveFoodToCustomer() {
    if (!cookingFood || !isComplete || isGameOver) return

    if (cookingFood.name === order.name) {
      setMoney((currentMoney) => currentMoney + cookingFood.price)
      setTotalSales((currentSales) => currentSales + cookingFood.price)
      setSuccessCount((currentCount) => currentCount + 1)
      const nextStreak = successStreak + 1
      setSuccessStreak(nextStreak)
      setBestSuccessStreak((currentBest) => Math.max(currentBest, nextStreak))
      setLastSalePrice(cookingFood.price)
      setCustomerResult('success')
      setFeedbackMessage('판매 성공!')
      setIsWaitingForCustomer(true)
    } else {
      setFeedbackMessage(`주문 메뉴는 ${order.name}입니다! 다시 만들어 주세요.`)
    }

    setCookingFood(null)
    setCookingProgress(0)
  }

  function restartGame() {
    gameOverRef.current = false
    setOrder(getRandomFood())
    setCustomer((currentCustomer) => getRandomCustomer(currentCustomer.emoji))
    setMoney(10000)
    setCookingFood(null)
    setCookingProgress(0)
    setIsWaitingForCustomer(false)
    setFeedbackMessage('')
    setLastSalePrice(0)
    setCustomerTimeLeft(10)
    setCustomerResult('success')
    setBusinessTimeLeft(BUSINESS_TIME)
    setTotalSales(0)
    setVisitorCount(1)
    setSuccessCount(0)
    setFailureCount(0)
    setSuccessStreak(0)
    setBestSuccessStreak(0)
    setIsGameOver(false)
  }

  if (isGameOver) {
    return (
      <main className="game-shell">
        <section className="game-result" aria-labelledby="result-title">
          <span className="result-emoji" aria-hidden="true">🏆</span>
          <p className="result-subtitle">오늘도 수고했어요!</p>
          <h1 id="result-title">영업 종료</h1>

          <div className="result-highlight">
            <span>총 매출</span>
            <strong>{totalSales.toLocaleString('ko-KR')}원</strong>
          </div>

          <dl className="result-stats">
            <div>
              <dt>방문 손님 수</dt>
              <dd>{visitorCount}명</dd>
            </div>
            <div>
              <dt>성공 주문 수</dt>
              <dd>{successCount}건</dd>
            </div>
            <div>
              <dt>실패 주문 수</dt>
              <dd>{failureCount}건</dd>
            </div>
            <div>
              <dt>최고 연속 성공</dt>
              <dd>{bestSuccessStreak}회</dd>
            </div>
          </dl>

          <button className="restart-button" type="button" onClick={restartGame}>
            다시 영업하기 🔥
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="game-shell">
      <section className="shop" aria-label="우리동네 분식집 게임 화면">
        <header className="shop-header">
          <div className="signboard">
            <span className="signboard-decoration" aria-hidden="true">🍥</span>
            <div>
              <p className="shop-subtitle">정겨운 골목 맛집</p>
              <h1>우리동네 분식집</h1>
            </div>
            <span className="signboard-decoration" aria-hidden="true">🍥</span>
          </div>

          <div className="status-bar">
            <div className="status-card money-card">
              <span className="status-icon" aria-hidden="true">💰</span>
              <div>
                <span className="status-label">보유금액</span>
                <strong>{money.toLocaleString('ko-KR')}원</strong>
              </div>
            </div>
            <div className={`status-card time-card ${businessTimeLeft <= 10 ? 'is-urgent' : ''}`}>
              <span className="status-icon" aria-hidden="true">⏰</span>
              <div>
                <span className="status-label">남은 영업시간</span>
                <strong>{Math.ceil(businessTimeLeft)}초</strong>
              </div>
            </div>
          </div>
        </header>

        <section className="customer-area" aria-label="손님과 주문">
          <div className="awning" aria-hidden="true">
            <span /><span /><span /><span /><span /><span /><span />
          </div>
          {isWaitingForCustomer ? (
            <div className={`sale-success ${customerResult === 'timeout' ? 'is-timeout' : ''}`} role="status">
              <span className="sale-success-emoji" aria-hidden="true">
                {customerResult === 'success' ? '🎉' : '😠'}
              </span>
              <strong>{feedbackMessage}</strong>
              <span className="sale-amount">
                {customerResult === 'success'
                  ? `+${lastSalePrice.toLocaleString('ko-KR')}원`
                  : '판매금액 0원'}
              </span>
              <p>새로운 손님이 오고 있어요...</p>
            </div>
          ) : (
            <div className="customer-scene customer-arrival">
              <div className="customer">
                <span className="customer-emoji" role="img" aria-label={customer.label}>{customer.emoji}</span>
                <span className="customer-label">손님</span>
              </div>

              <div className="order-bubble" aria-label={`손님의 주문: ${order.name} 1개`}>
                <span className="order-label">주문</span>
                <p>
                  <span className="ordered-food-emoji" aria-hidden="true">{order.emoji}</span>
                  <strong>{order.name}</strong> 1개 주세요!
                </p>
                <span className="order-note">맛있게 부탁해요 ♪</span>
                <div className={`patience ${customerTimeLeft <= 3 ? 'is-urgent' : ''}`}>
                  <div className="patience-heading">
                    <span>손님 기다림</span>
                    <strong>{Math.ceil(customerTimeLeft)}초</strong>
                  </div>
                  <div
                    className="patience-track"
                    role="progressbar"
                    aria-label="손님 기다림 시간"
                    aria-valuemin={0}
                    aria-valuemax={10}
                    aria-valuenow={Math.ceil(customerTimeLeft)}
                  >
                    <span
                      className="patience-fill"
                      style={{ width: `${(customerTimeLeft / 10) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="counter" aria-hidden="true">
            <span>어서오세요!</span>
          </div>
        </section>

        <section className="menu-area" aria-labelledby="menu-title">
          <div className="menu-heading">
            <span aria-hidden="true">🥢</span>
            <h2 id="menu-title">음식을 골라주세요</h2>
            <span aria-hidden="true">🥢</span>
          </div>

          {feedbackMessage && !isWaitingForCustomer && (
            <div className="feedback-message" role="alert">
              🙅 {feedbackMessage}
            </div>
          )}

          <div className={`cooking-station ${isComplete ? 'is-complete' : ''}`} aria-live="polite">
            {cookingFood ? (
              <>
                <div className="cooking-status">
                  <span className="cooking-food-emoji" aria-hidden="true">{cookingFood.emoji}</span>
                  <div>
                    <strong>{cookingFood.name}</strong>
                    <span>{isComplete ? '조리 완료!' : `조리 중 · ${remainingTime.toFixed(1)}초 남음`}</span>
                  </div>
                  <span className="progress-number">{Math.round(cookingProgress)}%</span>
                </div>
                <div
                  className="progress-track"
                  role="progressbar"
                  aria-label={`${cookingFood.name} 조리 진행률`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(cookingProgress)}
                >
                  <span className="progress-fill" style={{ width: `${cookingProgress}%` }} />
                </div>
                {isComplete && (
                  <button className="serve-button" type="button" onClick={giveFoodToCustomer}>
                    손님에게 주기 🙌
                  </button>
                )}
              </>
            ) : (
              <p className="empty-station">🍳 아래에서 조리할 음식을 골라주세요!</p>
            )}
          </div>

          <div className="food-buttons">
            {foods.map((food) => (
              <button
                className="food-button"
                type="button"
                key={food.name}
                onClick={() => startCooking(food)}
                disabled={cookingFood !== null || isWaitingForCustomer}
              >
                <span className="food-emoji" aria-hidden="true">{food.emoji}</span>
                <span className="food-info">
                  <span className="food-name">{food.name}</span>
                  <span className="menu-price">{food.price.toLocaleString('ko-KR')}원</span>
                </span>
                <span className="cooking-time">{food.cookingTime}초</span>
              </button>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}

export default App
