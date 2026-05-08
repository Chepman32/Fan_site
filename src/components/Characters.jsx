import { Users } from 'lucide-react'
import './Characters.css'

const characters = [
  {
    name: 'Lucia Caminos',
    role: 'Protagonist',
    description: 'The series\'s first non-optional female protagonist. Imprisoned at Leonida Penitentiary after fighting for her family from Liberty City.',
    color: '#ff2d95',
    initial: 'L',
  },
  {
    name: 'Jason Duval',
    role: 'Protagonist',
    description: 'A former Army soldier who worked for local drug runners in the Leonida Keys. Forms a romantic criminal duo with Lucia.',
    color: '#00d9ff',
    initial: 'J',
  },
  {
    name: 'Cal Hampton',
    role: 'Supporting',
    description: 'Jason\'s paranoid friend who gets caught up in the duo\'s criminal activities across Leonida.',
    color: '#9d4edd',
    initial: 'C',
  },
  {
    name: 'Boobie Ike',
    role: 'Supporting',
    description: 'A powerful businessman who runs an empire in Vice City with connections to the music industry.',
    color: '#ff6b35',
    initial: 'B',
  },
]

function Characters() {
  return (
    <section id="characters" className="section-padding characters">
      <div className="container">
        <div className="section-header">
          <div className="section-badge">
            <Users size={14} />
            <span>THE CAST</span>
          </div>
          <h2 className="section-title">
            MEET THE <span className="gradient-text">CHARACTERS</span>
          </h2>
        </div>

        <div className="characters-grid">
          {characters.map((char, index) => (
            <div 
              key={index} 
              className="character-card"
              style={{ 
                animationDelay: `${index * 0.15}s`,
                '--char-color': char.color 
              }}
            >
              <div className="character-avatar" style={{ backgroundColor: `${char.color}20`, color: char.color }}>
                <span>{char.initial}</span>
              </div>
              <div className="character-info">
                <span className="character-role" style={{ color: char.color }}>{char.role}</span>
                <h3>{char.name}</h3>
                <p>{char.description}</p>
              </div>
              <div className="character-glow" style={{ background: char.color }}></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Characters
