import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
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
  const [countdown, setCountdown] = useState(() => calculateCountdown(targetDate))

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(calculateCountdown(targetDate))
    }, 1000)

    return () => clearInterval(timer)
  }, [targetDate])

  if (countdown.isReleased) {
    return (
      <div className="countdown released">
        <Clock size={20} />
        <span>GTA VI IS NOW AVAILABLE!</span>
      </div>
    )
  }

  const timeUnits = [
    { value: countdown.timeLeft.days, label: 'DAYS' },
    { value: countdown.timeLeft.hours, label: 'HOURS' },
    { value: countdown.timeLeft.minutes, label: 'MINUTES' },
    { value: countdown.timeLeft.seconds, label: 'SECONDS' },
  ]

  return (
    <div className="countdown">
      <div className="countdown-label">
        <Clock size={14} />
        <span>TIME UNTIL RELEASE</span>
      </div>
      <div className="countdown-units">
        {timeUnits.map((unit, index) => (
          <div key={unit.label} className="countdown-unit">
            <div className="countdown-value">
              {String(unit.value).padStart(2, '0')}
            </div>
            <div className="countdown-unit-label">{unit.label}</div>
            {index < timeUnits.length - 1 && (
              <div className="countdown-separator">:</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Countdown
