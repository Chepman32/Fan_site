import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import './Countdown.css'

function Countdown({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })
  const [isReleased, setIsReleased] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = targetDate - new Date()
      
      if (difference <= 0) {
        setIsReleased(true)
        return { days: 0, hours: 0, minutes: 0, seconds: 0 }
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      }
    }

    setTimeLeft(calculateTimeLeft())
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [targetDate])

  if (isReleased) {
    return (
      <div className="countdown released">
        <Clock size={20} />
        <span>GTA VI IS NOW AVAILABLE!</span>
      </div>
    )
  }

  const timeUnits = [
    { value: timeLeft.days, label: 'DAYS' },
    { value: timeLeft.hours, label: 'HOURS' },
    { value: timeLeft.minutes, label: 'MINUTES' },
    { value: timeLeft.seconds, label: 'SECONDS' },
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
