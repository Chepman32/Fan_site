import { useEffect, useMemo, useRef, useState } from 'react'
import { Clock } from 'lucide-react'
import { useTranslation } from '../i18n/useTranslation.jsx'
import { createCountdownWebglRenderer } from './countdownWebgl.js'
import './Countdown.css'

const DAY_MS = 1000 * 60 * 60 * 24
const HOUR_MS = 1000 * 60 * 60
const MINUTE_MS = 1000 * 60

function addMonthsClamped(date, months) {
  const result = new Date(date)
  const dayOfMonth = result.getDate()

  result.setDate(1)
  result.setMonth(result.getMonth() + months)
  result.setDate(Math.min(dayOfMonth, new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate()))

  return result
}

function getCompleteMonthsBetween(startDate, endDate) {
  const monthDelta =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    endDate.getMonth() -
    startDate.getMonth()
  let months = Math.max(0, monthDelta)

  if (addMonthsClamped(startDate, months) > endDate) {
    months -= 1
  }

  return Math.max(0, months)
}

function calculateCountdown(targetDate) {
  const now = new Date()
  const difference = targetDate - now

  if (difference <= 0) {
    return {
      isReleased: true,
      timeLeft: { months: 0, weeks: 0, days: 0, hours: 0, minutes: 0, seconds: 0 },
    }
  }

  const months = getCompleteMonthsBetween(now, targetDate)
  const monthAnchor = addMonthsClamped(now, months)
  const differenceAfterMonths = targetDate - monthAnchor
  const totalDaysAfterMonths = Math.floor(differenceAfterMonths / DAY_MS)

  return {
    isReleased: false,
    timeLeft: {
      months,
      weeks: Math.floor(totalDaysAfterMonths / 7),
      days: totalDaysAfterMonths % 7,
      hours: Math.floor((differenceAfterMonths / HOUR_MS) % 24),
      minutes: Math.floor((differenceAfterMonths / MINUTE_MS) % 60),
      seconds: Math.floor((differenceAfterMonths / 1000) % 60),
    },
  }
}

function Countdown({ targetDate }) {
  const { t } = useTranslation()
  const [countdown, setCountdown] = useState(() => calculateCountdown(targetDate))
  const [webglReady, setWebglReady] = useState(false)
  const canvasRef = useRef(null)
  const rendererRef = useRef(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(calculateCountdown(targetDate))
    }, 1000)

    return () => clearInterval(timer)
  }, [targetDate])

  const primaryUnits = useMemo(
    () => [
      { value: countdown.timeLeft.months, label: t.countdown.months },
      { value: countdown.timeLeft.weeks, label: t.countdown.weeks },
      { value: countdown.timeLeft.days, label: t.countdown.days },
    ],
    [countdown.timeLeft, t.countdown.days, t.countdown.months, t.countdown.weeks],
  )
  const timeUnits = useMemo(
    () => [
      ...primaryUnits,
      { value: countdown.timeLeft.hours, label: t.countdown.hours, pad: 2 },
      { value: countdown.timeLeft.minutes, label: t.countdown.minutes, pad: 2 },
      { value: countdown.timeLeft.seconds, label: t.countdown.seconds, pad: 2 },
    ],
    [countdown.timeLeft, primaryUnits, t.countdown.hours, t.countdown.minutes, t.countdown.seconds],
  )
  const primaryReadout = primaryUnits.map((unit) => String(unit.value).padStart(2, '0')).join(':')
  const precisionReadout = [
    countdown.timeLeft.hours,
    countdown.timeLeft.minutes,
    countdown.timeLeft.seconds,
  ].map((value) => String(value).padStart(2, '0')).join(':')
  const readableReadout = useMemo(
    () => timeUnits.map((unit) => `${unit.value} ${unit.label.toLowerCase()}`).join(', '),
    [timeUnits],
  )

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return undefined
    }

    const renderer = createCountdownWebglRenderer(canvas)

    if (!renderer) {
      setWebglReady(false)
      return undefined
    }

    rendererRef.current = renderer
    setWebglReady(true)

    return () => {
      renderer.destroy()
      rendererRef.current = null
    }
  }, [])

  useEffect(() => {
    rendererRef.current?.setText(primaryReadout)
  }, [primaryReadout])

  if (countdown.isReleased) {
    return (
      <div className="countdown released">
        <Clock size={20} />
        <span>{t.countdown.nowAvailable}</span>
      </div>
    )
  }

  return (
    <div className="countdown" role="timer">
      <div className="countdown-label">
        <Clock size={14} />
        <span>{t.countdown.timeUntilRelease}</span>
      </div>
      <span className="countdown-screen-reader" suppressHydrationWarning>
        {readableReadout}
      </span>
      <div className={`countdown-stage${webglReady ? ' is-webgl-ready' : ''}`}>
        <div className="countdown-stage-grid" aria-hidden="true" />
        <canvas
          ref={canvasRef}
          className="countdown-canvas"
          aria-hidden="true"
        />
        <div className="countdown-hud-lines" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="countdown-object-label" aria-hidden="true">
          <span>{t.countdown.months} / {t.countdown.weeks} / {t.countdown.days}</span>
        </div>
        <div className="countdown-primary-labels" aria-hidden="true">
          {primaryUnits.map((unit) => (
            <span key={unit.label}>{unit.label}</span>
          ))}
        </div>
        <div className="countdown-precision-panel" aria-hidden="true">
          <span suppressHydrationWarning>{precisionReadout}</span>
          <small>{t.countdown.hours} / {t.countdown.minutes} / {t.countdown.seconds}</small>
        </div>
        <div className={`countdown-units${webglReady ? ' is-fallback-hidden' : ''}`} aria-hidden={webglReady}>
          {primaryUnits.map((unit) => (
            <div className="countdown-unit" key={unit.label}>
              <div className="countdown-value" suppressHydrationWarning>
                {String(unit.value).padStart(2, '0')}
              </div>
              <span className="countdown-unit-label">{unit.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Countdown
