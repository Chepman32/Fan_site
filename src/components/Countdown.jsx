import { useEffect, useMemo, useRef, useState } from 'react'
import { Clock } from 'lucide-react'
import { useTranslation } from '../i18n/useTranslation.jsx'
import { createCountdownWebglRenderer } from './countdownWebgl.js'
import './Countdown.css'

function calculateCountdown(targetDate) {
  const difference = targetDate - new Date()

  if (difference <= 0) {
    return {
      isReleased: true,
      timeLeft: { days: 0, hours: 0, minutes: 0, seconds: 0 },
    }
  }

  return {
    isReleased: false,
    timeLeft: {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
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

  const timeUnits = useMemo(
    () => [
      { value: countdown.timeLeft.days, label: t.countdown.days, pad: 2 },
      { value: countdown.timeLeft.hours, label: t.countdown.hours, pad: 2 },
      { value: countdown.timeLeft.minutes, label: t.countdown.minutes, pad: 2 },
      { value: countdown.timeLeft.seconds, label: t.countdown.seconds, pad: 2 },
    ],
    [countdown.timeLeft, t.countdown.days, t.countdown.hours, t.countdown.minutes, t.countdown.seconds],
  )
  const primaryReadout = String(countdown.timeLeft.days)
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
          <span>{t.countdown.days}</span>
        </div>
        <div className="countdown-precision-panel" aria-hidden="true">
          <span suppressHydrationWarning>{precisionReadout}</span>
          <small>{t.countdown.hours} / {t.countdown.minutes} / {t.countdown.seconds}</small>
        </div>
        <div className={`countdown-units${webglReady ? ' is-fallback-hidden' : ''}`} aria-hidden={webglReady}>
          <div className="countdown-unit">
            <div className="countdown-value" suppressHydrationWarning>
              {primaryReadout}
            </div>
          </div>
        </div>
      </div>
      <div className="countdown-unit-strip" aria-hidden="true">
        <span>{t.countdown.days}</span>
        <span suppressHydrationWarning>{precisionReadout}</span>
      </div>
    </div>
  )
}

export default Countdown
