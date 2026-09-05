import { $, getYouTubeThumbnail } from '../js/utils.js';
import { store } from '../js/store.js';
import { render, setPageTitle } from '../js/ui.js';
import { closeSidebar } from './sidebar.js';

const GENRES = [
  {
    name: 'Blues',
    subgenres: [
      { name: 'Delta Blues', playlist: 'delta-blues' },
      { name: 'Chicago Blues', playlist: 'chicago-blues' },
      { name: 'Texas Blues', playlist: 'texas-blues' },
      { name: 'Electric Blues', playlist: 'electric-blues' },
      { name: 'Acoustic Blues', playlist: 'acoustic-blues' },
      { name: 'British Blues', playlist: 'british-blues' },
      { name: 'Blues Rock', playlist: 'blues-rock' },
      { name: 'Soul Blues', playlist: 'soul-blues' },
      { name: 'Contemporary Blues', playlist: 'contemporary-blues' },
      { name: 'Blues Ballad', playlist: 'blues-ballads' },
      { name: 'Blues Guitar Legends', playlist: 'blues-guitar-legends' },
      { name: 'Country Blues', playlist: 'americana-blues' },
      { name: 'Americana', playlist: 'americana-blues' }
    ],
    timeline: {
      slug: 'Blues',
      title: 'History of Blues Timeline',
      subtitle: 'Explore 16 eras from 1600s to present'
    }
  },
  {
    name: 'Rock',
    subgenres: [
      { name: 'Classic Rock', playlist: 'classic-rock' },
      { name: 'Hard Rock', playlist: 'hard-rock' },
      { name: 'Heavy Metal', playlist: 'heavy-metal' },
      { name: 'Psychedelic Rock', playlist: 'psychedelic-rock' },
      { name: 'Progressive Rock', playlist: 'progressive-rock' },
      { name: 'Blues Rock', playlist: 'blues-rock' },
      { name: 'Southern Rock', playlist: 'southern-rock' },
      { name: 'Glam Rock', playlist: 'glam-rock' },
      { name: 'Punk Rock', playlist: 'punk-rock' },
      { name: 'New Wave / Post-Punk', playlist: 'new-wave' },
      { name: 'Grunge', playlist: 'grunge' },
      { name: 'Alternative Rock', playlist: 'alternative-rock' },
      { name: 'Britpop', playlist: 'britpop' },
      { name: 'Nu Metal', playlist: 'nu-metal' },
      { name: 'Garage Rock', playlist: 'garage-rock' }
    ],
    timeline: {
      slug: 'Rock',
      title: 'History of Rock Timeline',
      subtitle: 'Explore 15 eras from the 1950s to present'
    }
  }
];

const BLUES_ERAS = [
  {
    period: 'Before the Blues',
    years: '1600s – 1865',
    description: 'Enslaved Africans carried musical traditions to North America — call-and-response, pentatonic scales, improvisation. Field hollers, work songs, ring shouts, and spirituals laid the foundation for everything to come.',
    playlists: []
  },
  {
    period: 'Reconstruction Era',
    years: '1865 – 1890',
    description: 'After emancipation, music shifted from collective work songs toward individual expression with guitar, banjo, and harmonica. Themes of hardship, lost love, and freedom emerged across the American South.',
    playlists: []
  },
  {
    period: 'Birth of the Blues',
    years: '1890 – 1910',
    description: 'The Mississippi Delta became the birthplace of Delta Blues. Blue notes, 12-bar progressions, slide guitar, and fingerpicking defined the sound. Musicians performed in juke joints and on street corners.',
    playlists: ['delta-blues', 'acoustic-blues']
  },
  {
    period: 'First Recognition',
    years: '1903 – 1912',
    description: 'W. C. Handy heard a guitarist playing slide with a knife at a train station in Tutwiler, Mississippi. He published "Memphis Blues" in 1912, bringing blues to a wider audience for the first time.',
    playlists: ['texas-blues']
  },
  {
    period: 'Classic Blues Era',
    years: '1910 – 1925',
    description: 'Women became the first commercially successful blues stars. Ma Rainey, Bessie Smith, and Mamie Smith recorded hit records. "Crazy Blues" (1920) became one of the first million-selling blues recordings.',
    playlists: ['blues-ballads']
  },
  {
    period: 'Country Blues Expansion',
    years: '1920s',
    description: 'Regional styles flourished across America. Delta Blues (Charley Patton, Son House), Texas Blues (Blind Lemon Jefferson), and Piedmont Blues (Blind Blake) developed distinct guitar techniques.',
    playlists: ['delta-blues', 'texas-blues', 'acoustic-blues']
  },
  {
    period: 'The Legendary Delta Period',
    years: '1930 – 1940',
    description: 'Robert Johnson recorded only 29 songs but became one of the most influential musicians of all time. The crossroads myth — selling his soul for musical ability — became central to blues folklore.',
    playlists: ['delta-blues', 'blues-guitar-legends']
  },
  {
    period: 'Migration & Urban Blues',
    years: '1940s',
    description: 'Millions of African Americans moved north during the Great Migration. The electric guitar, amplifier, bass, and drums transformed the sound for noisy urban clubs. Chicago became the new blues hub.',
    playlists: ['electric-blues']
  },
  {
    period: 'Chicago Blues',
    years: '1945 – 1965',
    description: 'Muddy Waters, Howlin\' Wolf, Willie Dixon, and Buddy Guy defined the electric Chicago sound. The harmonica (Little Walter), strong rhythm sections, and powerful vocals became hallmarks of the genre.',
    playlists: ['chicago-blues', 'electric-blues']
  },
  {
    period: 'Blues Inspires Rock & Roll',
    years: '1950s',
    description: 'Blues directly birthed rock and roll. Chuck Berry, Bo Diddley, and Little Richard took blues guitar riffs, song structures, and rhythms — amplified and sped up for a new generation of listeners.',
    playlists: ['blues-rock']
  },
  {
    period: 'British Blues Boom',
    years: '1960s',
    description: 'Young British musicians rediscovered American blues. Eric Clapton, The Rolling Stones, Cream, and John Mayall introduced blues to global audiences, sparking a worldwide revival of interest.',
    playlists: ['british-blues', 'blues-rock']
  },
  {
    period: 'Blues-Rock Explosion',
    years: 'Late 1960s – 1970s',
    description: 'Jimi Hendrix, Stevie Ray Vaughan, Johnny Winter, and Rory Gallagher fused blues with hard rock, psychedelic rock, jazz, and funk. The electric guitar reached new heights of expressive power.',
    playlists: ['blues-rock', 'blues-guitar-legends']
  },
  {
    period: 'Soul-Blues Crossover',
    years: '1970s – 1980s',
    description: 'Blues merged with soul and R&B, creating a smoother, gospel-infused sound. Artists like Bobby Bland brought blues to new audiences while preserving its emotional core and storytelling tradition.',
    playlists: ['soul-blues']
  },
  {
    period: 'Modern Blues Revival',
    years: '1980s – 2000s',
    description: 'Stevie Ray Vaughan led a blues resurgence. Robert Cray, Bonnie Raitt, and later Joe Bonamassa and Susan Tedeschi kept blues vital for new generations. Blues festivals expanded worldwide.',
    playlists: ['texas-blues', 'contemporary-blues']
  },
  {
    period: 'Contemporary Blues',
    years: '2010s – Present',
    description: 'Christone \'Kingfish\' Ingram, Gary Clark Jr., Samantha Fish, and Beth Hart blend traditional Delta blues with rock, soul, funk, and hip-hop. The genre continues evolving while honoring its roots.',
    playlists: ['contemporary-blues', 'americana-blues']
  },
  {
    period: 'The Legacy of Blues',
    years: 'Ongoing',
    description: 'Blues is the root music of the modern world. Its influence extends across jazz, rock, soul, R&B, funk, country, and hip-hop — a living tradition of resilience, expression, and emotional honesty.',
    playlists: ['blues-ballads', 'blues-guitar-legends', 'americana-blues', 'soul-blues']
  }
];

const ROCK_ERAS = [
  {
    period: 'Roots & Rock and Roll Is Born',
    years: '1947 – 1955',
    description: 'Jump blues, boogie-woogie, and R&B collided with country swing in the postwar South. Chuck Berry, Little Richard, and Elvis Presley electrified the mix, and the new sound got its name: rock and roll.',
    playlists: ['classic-rock', 'garage-rock']
  },
  {
    period: 'Rock & Roll Explosion',
    years: '1955 – 1963',
    description: 'Rock and roll swept the world as guitar heroes and teen idols took the charts. The raw 4/4 shuffle became the soundtrack of a generation — before a quiet lull set in just ahead of the British Invasion.',
    playlists: ['classic-rock']
  },
  {
    period: 'The British Invasion',
    years: '1964 – 1967',
    description: 'The Beatles, the Rolling Stones, the Who, and the Kinks stormed America, retooling blues and R&B into beat-driven pop. Garage bands everywhere grabbed cheap guitars and plugged in — rock became a movement.',
    playlists: ['classic-rock', 'garage-rock']
  },
  {
    period: 'The Psychedelic Era',
    years: '1966 – 1969',
    description: 'Acid rock stretched songs into heady explorations of feedback, sitars, and studio wizardry. Hendrix rewired the guitar, while San Francisco, London, and Los Angeles became psychedelic hothouses.',
    playlists: ['psychedelic-rock']
  },
  {
    period: 'Hard Rock Emerges',
    years: '1968 – 1972',
    description: 'Led Zeppelin, Deep Purple, and Black Sabbath turned up the amps, down-tuned the riffs, and built the template for heavy music. Volume and swagger became rock\'s new default setting.',
    playlists: ['hard-rock']
  },
  {
    period: 'Heavy Metal Is Born',
    years: '1969 – 1975',
    description: 'Out of the blues-rock furnace came a darker, louder beast. Ozzy\'s Sabbath codified the doom-laden riff, while Judas Priest added twin-guitar speed — the genre got its name, its look, and its ethos.',
    playlists: ['heavy-metal']
  },
  {
    period: 'The Progressive Rock Era',
    years: '1970s',
    description: 'Prog pushed rock toward classical ambition — time signatures, concept albums, and virtuoso musicianship. Pink Floyd and Genesis turned the album into a canvas and the arena into a cathedral.',
    playlists: ['progressive-rock']
  },
  {
    period: 'Southern Rock & Blues Rock',
    years: '1970s',
    description: 'Gritty boogie, twin leads, and three-chord howls defined the South. The Allmans jammed into the night, Skynyrd shouted free bird, and the blues-rock engine idled on in Britain and the States alike.',
    playlists: ['southern-rock', 'blues-rock']
  },
  {
    period: 'Glam Rock',
    years: '1971 – 1975',
    description: 'Platform boots, glitter, and theatricality — glam made rock a spectacle. Bowie, T. Rex, and the New York Dolls married stomping anthems to androgynous provocation, presaging punk and metal.',
    playlists: ['glam-rock']
  },
  {
    period: 'Punk Rock Revolution',
    years: '1976 – 1979',
    description: 'Fed up with bloated stadiums, punk stripped rock to three chords and raw fury. The Ramones in New York, the Sex Pistols in London — rebellion, safety pins, and do-it-yourself energy.',
    playlists: ['punk-rock']
  },
  {
    period: 'New Wave & Post-Punk',
    years: '1978 – 1984',
    description: 'The punk hangover turned electronic: synths, angular guitars, and detached cool. The Cars, Depeche Mode, and Talking Heads turned the fallout of punk into sleek, danceable, future-facing rock.',
    playlists: ['new-wave']
  },
  {
    period: 'Stadium Rock & Hair Metal',
    years: '1980s',
    description: 'Big riffs, bigger hair, packed arenas. Bon Jovi, Def Leppard, and Guns N\' Roses made rock a pop-chart juggernaut while glam rock returned as a slicked-up, MTV-ready spectacle.',
    playlists: ['hard-rock', 'glam-rock']
  },
  {
    period: 'Grunge & Alternative Breakthrough',
    years: '1989 – 1995',
    description: 'Seattle flannel replaced spandex as Nirvana, Pearl Jam, and Soundgarden turned angst into anthems. Alternative rock crashed the mainstream and never went back.',
    playlists: ['grunge', 'alternative-rock']
  },
  {
    period: 'Britpop & Nu Metal',
    years: '1995 – 2002',
    description: 'Britpop\'s guitar-pop swagger and nu metal\'s down-tuned aggression split the 90s down the middle. Oasis battled Blur for the charts while Korn and Limp Bizkit rattled the nu metal generation.',
    playlists: ['britpop', 'nu-metal']
  },
  {
    period: 'Modern Rock',
    years: '2000s – Present',
    description: 'Garage rock revivalists, post-punk retreads, and alt-metal survivors keep the flame alive. Rock no longer rules the charts outright — but its influence still powers the loudest corners of modern music.',
    playlists: ['garage-rock', 'alternative-rock', 'nu-metal']
  }
];

export function renderExplore() {
  const container = $('#page-view');
  if (!container) return;
  setPageTitle('Explore');

  const playlists = store.get('playlists') || [];
  const hash = window.location.hash;
  const parts = hash.split('/');
  const selectedGenre = parts[2] ? decodeURIComponent(parts[2]) : null;

  const timelineGenre = GENRES.find(g => g.timeline && g.timeline.slug.toLowerCase() === (selectedGenre || '').toLowerCase());

  if (timelineGenre) {
    const eras = timelineGenre.timeline.slug === 'Rock' ? ROCK_ERAS : BLUES_ERAS;
    render(container, `
      <div style="min-height:calc(100vh - 80px - 56px);">
        ${renderGenreTimeline(playlists, timelineGenre, eras)}
      </div>
    `);
    requestAnimationFrame(() => {
      setupTimelineObserver();
      setupTimelineEvents();
    });
    closeSidebar();
    return;
  }

  // Explore Overview Page — stunning hero design
  const accent = '#E95420';
  const genreIcons = { Blues: 'music_note', Rock: 'graphic_eq' };

  render(container, `
    <div style="position:relative;min-height:calc(100vh - 136px);overflow:hidden;">

      <!-- Ambient top glow -->
      <div style="position:absolute;top:-150px;left:50%;transform:translateX(-50%);width:900px;height:500px;background:radial-gradient(ellipse at center,rgba(233,84,32,0.06) 0%,transparent 70%);pointer-events:none;z-index:0;"></div>

      <!-- Page header -->
      <div style="max-width:72rem;margin:0 auto;padding:3rem 1.5rem 2rem;position:relative;z-index:10;">
        <p style="font-family:'Ubuntu',sans-serif !important;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.25em;color:${accent};margin:0 0 10px;">Illustrated Musicology</p>
        <h1 style="font-family:'Ubuntu',sans-serif !important;font-size:clamp(2rem,5vw,3.5rem);font-weight:900;text-transform:uppercase;letter-spacing:-0.03em;line-height:1;color:#fff;margin:0 0 12px;">Explore <span style="font-family:'Ubuntu',sans-serif !important;color:${accent};">Genre</span> Timelines</h1>
        <p style="font-family:'Ubuntu',sans-serif !important;font-size:14px;color:#64748b;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Dive into the complete history of a genre — every era, every pivotal moment, every subgenre curated for your ears.</p>
      </div>

      <!-- Genre list / accordion -->
      <div style="max-width:72rem;margin:0 auto;padding:0 1.5rem 4rem;display:flex;flex-direction:column;gap:1.25rem;position:relative;z-index:10;">
        ${GENRES.map((g, gi) => {
          const totalSubgenres = g.subgenres.length;
          const eraList = g.timeline.slug === 'Rock' ? ROCK_ERAS : BLUES_ERAS;
          const eraCount = eraList.length;

          return `
          <div style="border-radius:16px;background:rgba(18,21,28,0.9);border:1px solid rgba(255,255,255,0.08);overflow:hidden;transition:all 0.3s cubic-bezier(0.16,1,0.3,1);" id="genre-accordion-${gi}">
            
            <!-- Accordion Header Row -->
            <div style="padding:1.5rem;display:flex;align-items:center;justify-content:space-between;gap:1.5rem;cursor:pointer;background:linear-gradient(90deg, rgba(233,84,32,0.04) 0%, transparent 100%);"
                 onclick="
                   const content = document.getElementById('accordion-content-${gi}');
                   const icon = document.getElementById('accordion-icon-${gi}');
                   const isOpen = content.style.display !== 'none';
                   content.style.display = isOpen ? 'none' : 'block';
                   icon.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
                 "
                 onmouseover="this.parentElement.style.borderColor='rgba(233,84,32,0.4)';"
                 onmouseout="this.parentElement.style.borderColor='rgba(255,255,255,0.08)';">
              
              <!-- Left info -->
              <div style="flex:1;min-width:0;display:flex;align-items:center;gap:1.25rem;">
                <div style="width:48px;height:48px;border-radius:12px;background:rgba(233,84,32,0.12);border:1px solid rgba(233,84,32,0.25);display:flex;align-items:center;justify-content:center;color:${accent};flex-shrink:0;">
                  <span class="material-symbols-outlined" style="font-size:24px;">${genreIcons[g.name] || 'queue_music'}</span>
                </div>

                <div style="flex:1;min-width:0;">
                  <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">
                    <h2 style="font-size:1.35rem;font-weight:800;color:#f1f5f9;margin:0;letter-spacing:-0.02em;">${g.name}</h2>
                    <span style="padding:2px 8px;border-radius:9999px;background:rgba(255,255,255,0.06);color:#94a3b8;font-size:11px;font-weight:600;">${g.timeline.title}</span>
                  </div>
                  <p style="font-size:13px;color:#64748b;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${g.timeline.subtitle}</p>
                </div>
              </div>

              <!-- Right stats & controls -->
              <div style="display:flex;align-items:center;gap:1.5rem;flex-shrink:0;">
                <div style="display:flex;gap:1.25rem;text-align:right;">
                  <div>
                    <div style="font-size:1.15rem;font-weight:800;color:#fff;line-height:1;">${eraCount}</div>
                    <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#475569;margin-top:2px;">Eras</div>
                  </div>
                  <div style="width:1px;background:rgba(255,255,255,0.07);"></div>
                  <div>
                    <div style="font-size:1.15rem;font-weight:800;color:#fff;line-height:1;">${totalSubgenres}</div>
                    <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#475569;margin-top:2px;">Subgenres</div>
                  </div>
                </div>

                <a href="#/explore/${g.timeline.slug}" 
                   onclick="event.stopPropagation();"
                   style="padding:10px 18px;border-radius:10px;background:${accent};color:#fff;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;text-decoration:none;display:inline-flex;align-items:center;gap:6px;transition:all 0.2s;"
                   onmouseover="this.style.background='#d04416';this.style.transform='translateY(-1px)';"
                   onmouseout="this.style.background='${accent}';this.style.transform='translateY(0)';">
                  <span>Explore Timeline</span>
                  <span class="material-symbols-outlined" style="font-size:16px;">timeline</span>
                </a>

                <div style="width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:center;color:#94a3b8;transition:transform 0.3s ease;" id="accordion-icon-${gi}">
                  <span class="material-symbols-outlined" style="font-size:20px;">expand_more</span>
                </div>
              </div>

            </div>

            <!-- Accordion Expandable Content (Subgenres & Playlists List) -->
            <div id="accordion-content-${gi}" style="display:none;padding:1rem 1.5rem 1.5rem;border-top:1px solid rgba(255,255,255,0.06);background:rgba(10,12,16,0.6);">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.05);">
                <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${accent};">Subgenres & Playlists (${totalSubgenres})</span>
                <span style="font-size:11px;color:#64748b;">Click to view playlist</span>
              </div>
              <div style="display:flex;flex-direction:column;gap:6px;">
                ${g.subgenres.map(sg => {
                  const playlistId = sg.playlist;
                  const pl = playlists.find(p => p.id === playlistId);
                  const trackCount = pl && pl.tracks ? pl.tracks.length : (sg.tracks || 10);
                  return `
                  <a href="#/playlist/${playlistId}" style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-radius:10px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);color:#cbd5e1;text-decoration:none;transition:all 0.2s cubic-bezier(0.16,1,0.3,1);"
                     onmouseover="this.style.background='rgba(233,84,32,0.1)';this.style.borderColor='rgba(233,84,32,0.3)';this.style.color='#fff';this.style.transform='translateX(4px)';"
                     onmouseout="this.style.background='rgba(255,255,255,0.02)';this.style.borderColor='rgba(255,255,255,0.05)';this.style.color='#cbd5e1';this.style.transform='translateX(0)';">
                    <div style="display:flex;align-items:center;gap:12px;min-width:0;">
                      <div style="width:32px;height:32px;border-radius:8px;background:rgba(233,84,32,0.12);display:flex;align-items:center;justify-content:center;color:${accent};flex-shrink:0;">
                        <span class="material-symbols-outlined" style="font-size:18px;">graphic_eq</span>
                      </div>
                      <div>
                        <div style="font-size:13px;font-weight:700;color:#f1f5f9;line-height:1.2;">${sg.name}</div>
                        <div style="font-size:11px;color:#64748b;margin-top:2px;">Playlist • #${playlistId}</div>
                      </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
                      <span style="font-size:11px;font-weight:600;padding:3px 10px;border-radius:9999px;background:rgba(255,255,255,0.06);color:#94a3b8;">${trackCount} tracks</span>
                      <span class="material-symbols-outlined" style="font-size:16px;color:${accent};">arrow_forward</span>
                    </div>
                  </a>`;
                }).join('')}
              </div>
            </div>

          </div>`;
        }).join('')}
      </div>
    </div>
  `);
  closeSidebar();
}

function renderGenreTimeline(playlists, genre, eras) {
  const totalSongs = eras.reduce((s, era) => {
    return s + era.playlists.reduce((sum, plId) => {
      const pl = playlists.find(p => p.id === plId);
      return sum + (pl?.songs?.length || 0);
    }, 0);
  }, 0);

  const accentColor = '#E95420';

  return `
    <!-- Floating progress pill -->
    <div id="timeline-progress" style="position:fixed;top:4.5rem;left:50%;transform:translateX(-50%);z-index:50;padding:6px 16px;border-radius:9999px;background:${accentColor};color:#fff;font-size:11px;font-family:monospace;font-weight:700;letter-spacing:0.05em;pointer-events:none;opacity:0;transition:opacity 0.3s ease;box-shadow:0 4px 20px rgba(233,84,32,0.5);">0 of ${eras.length} eras</div>

    <div style="position:relative;min-height:calc(100vh - 136px);padding-bottom:6rem;overflow:hidden;">

      <!-- Ambient background glow -->
      <div style="position:absolute;top:-200px;left:50%;transform:translateX(-50%);width:800px;height:400px;background:radial-gradient(ellipse at center, rgba(233,84,32,0.07) 0%, transparent 70%);pointer-events:none;z-index:0;"></div>

      <!-- Header -->
      <div style="max-width:72rem;margin:0 auto;padding:2rem 1.5rem 2rem;position:relative;z-index:20;">
        <a href="#/explore" style="display:inline-flex;align-items:center;gap:8px;padding:8px 16px;border-radius:12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#94a3b8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;text-decoration:none;transition:all 0.2s ease;margin-bottom:2rem;" onmouseover="this.style.background='rgba(255,255,255,0.1)';this.style.color='#fff';this.style.borderColor='rgba(233,84,32,0.4)'" onmouseout="this.style.background='rgba(255,255,255,0.05)';this.style.color='#94a3b8';this.style.borderColor='rgba(255,255,255,0.1)'">
          <span class="material-symbols-outlined" style="font-size:16px;">arrow_back</span>
          Explore Timelines
        </a>

        <div style="display:grid;grid-template-columns:1fr auto;gap:1.5rem;align-items:flex-end;padding-bottom:2rem;border-bottom:1px solid rgba(255,255,255,0.08);">
          <div>
            <span style="display:block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.25em;color:${accentColor};margin-bottom:8px;">Illustrated Musicology</span>
            <h1 style="font-size:clamp(2.5rem,6vw,4.5rem);font-weight:900;text-transform:uppercase;letter-spacing:-0.03em;line-height:0.9;color:#fff;margin:0;">
              HISTORY OF <span style="color:${accentColor};">${genre.name.toUpperCase()}</span>
            </h1>
          </div>
          <div style="text-align:right;border-right:2px solid ${accentColor};padding-right:1rem;">
            <p style="font-size:11px;font-family:monospace;font-weight:700;text-transform:uppercase;color:#94a3b8;line-height:1.6;margin:0;">
              ${eras.length} HISTORICAL ERAS<br>
              <span style="color:${accentColor};">${totalSongs} CURATED TRACKS</span>
            </p>
          </div>
        </div>
      </div>

      <!-- Subgenres Section -->
      <div style="max-width:72rem;margin:0 auto;padding:2rem 1.5rem;position:relative;z-index:20;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:1rem;">
          <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.2em;color:#64748b;">All Subgenres</span>
          <div style="flex:1;height:1px;background:rgba(255,255,255,0.07);"></div>
          <span style="font-size:10px;font-weight:600;font-family:monospace;color:#64748b;">${genre.subgenres.length} styles</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
          ${genre.subgenres.map(sg => {
            const pl = playlists.find(p => p.id === sg.playlist);
            const trackCount = pl?.songs?.length || 0;
            return `<a href="#/playlist/${sg.playlist}"
              style="display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:9999px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#cbd5e1;font-size:12px;font-weight:600;text-decoration:none;transition:all 0.2s ease;white-space:nowrap;"
              onmouseover="this.style.background='rgba(233,84,32,0.12)';this.style.borderColor='rgba(233,84,32,0.45)';this.style.color='#E95420';"
              onmouseout="this.style.background='rgba(255,255,255,0.05)';this.style.borderColor='rgba(255,255,255,0.1)';this.style.color='#cbd5e1';">
              ${sg.name}
              ${trackCount ? `<span style="font-size:10px;font-family:monospace;color:#475569;font-weight:500;">${trackCount}</span>` : ''}
            </a>`;
          }).join('')}
        </div>
      </div>

      <!-- Timeline body -->
      <div style="max-width:72rem;margin:0 auto;padding:1.5rem 1.5rem 0;position:relative;">

        <!-- Section header -->
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:3rem;">
          <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.2em;color:#64748b;">Historical Timeline</span>
          <div style="flex:1;height:1px;background:rgba(255,255,255,0.07);"></div>
          <span style="font-size:10px;font-weight:600;font-family:monospace;color:#64748b;">${eras.length} eras</span>
        </div>

        <!-- Central glowing spine -->
        <div style="position:absolute;top:5.5rem;bottom:0;left:50%;transform:translateX(-50%);width:2px;background:linear-gradient(to bottom,transparent,${accentColor} 3%,${accentColor} 97%,transparent);box-shadow:0 0 12px rgba(233,84,32,0.6),0 0 30px rgba(233,84,32,0.2);z-index:1;pointer-events:none;"></div>

        <div style="display:flex;flex-direction:column;gap:4rem;">
          ${eras.map((era, i) => renderEraRow(playlists, era, i, accentColor)).join('')}
        </div>

      </div>
    </div>
  `;
}

function renderEraRow(playlists, era, index, accentColor) {
  const eraPlaylists = era.playlists
    .map(plId => playlists.find(p => p.id === plId))
    .filter(Boolean);

  const isLeft = index % 2 === 0;
  const yearMatch = era.years.match(/\d{4}/);
  const startYear = yearMatch ? yearMatch[0] : era.years.replace(/[^0-9s]/g, '').slice(0, 4) || '—';

  const card = `
    <div style="flex:0 0 calc(50% - 3.5rem);max-width:calc(50% - 3.5rem);">
      <div class="timeline-card" style="background:rgba(26,29,37,0.95);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:1.5rem;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);box-shadow:0 8px 32px rgba(0,0,0,0.4);transition:border-color 0.2s ease,box-shadow 0.2s ease;cursor:default;"
        onmouseover="this.style.borderColor='rgba(233,84,32,0.4)';this.style.boxShadow='0 8px 40px rgba(0,0,0,0.5),0 0 0 1px rgba(233,84,32,0.15)';"
        onmouseout="this.style.borderColor='rgba(255,255,255,0.08)';this.style.boxShadow='0 8px 32px rgba(0,0,0,0.4)';">

        <!-- Era badge + playlist count -->
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px;">
          <span style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:9999px;background:rgba(233,84,32,0.15);color:${accentColor};font-size:11px;font-weight:800;letter-spacing:0.06em;border:1px solid rgba(233,84,32,0.3);">
            <span class="material-symbols-outlined" style="font-size:14px;color:${accentColor};">calendar_today</span>
            ${era.years}
          </span>
          ${eraPlaylists.length ? `
            <span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;color:#94a3b8;">
              <span class="material-symbols-outlined" style="font-size:15px;color:${accentColor};">queue_music</span>
              ${eraPlaylists.length} playlist${eraPlaylists.length > 1 ? 's' : ''}
            </span>` : ''}
        </div>

        <!-- Era title -->
        <h3 style="font-size:1.1rem;font-weight:800;color:#f1f5f9;margin:0 0 8px;line-height:1.3;letter-spacing:-0.01em;display:flex;align-items:center;gap:8px;">
          <span class="material-symbols-outlined" style="font-size:18px;color:${accentColor};">music_note</span>
          ${era.period}
        </h3>

        <!-- Description -->
        <p style="font-size:12px;color:#94a3b8;line-height:1.65;margin:0 0 16px;">${era.description}</p>

        <!-- Playlists -->
        ${eraPlaylists.length ? `
          <div style="border-top:1px solid rgba(255,255,255,0.07);padding-top:12px;display:flex;flex-direction:column;gap:8px;">
            ${eraPlaylists.map(pl => renderTimelinePlaylist(pl)).join('')}
          </div>
        ` : ''}
      </div>
    </div>
  `;

  // Year marker — a sleek glowing year pill centered over the timeline spine
  const spacer = `
    <div style="flex:0 0 9rem;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;z-index:20;">
      <!-- Dashed horizontal connector line -->
      <div style="position:absolute;top:50%;left:0;right:0;height:1px;display:flex;pointer-events:none;z-index:10;">
        ${isLeft
          ? `<div style="flex:1;border-top:1px dashed ${accentColor};opacity:0.4;margin-top:-0.5px;"></div><div style="flex:1;"></div>`
          : `<div style="flex:1;"></div><div style="flex:1;border-top:1px dashed ${accentColor};opacity:0.4;margin-top:-0.5px;"></div>`
        }
      </div>
      <!-- Glowing Year Pill with solid background & thick masking ring to hide spine line -->
      <div style="position:relative;z-index:30;display:inline-flex;align-items:center;justify-content:center;padding:8px 20px;border-radius:9999px;background:#0F1115;border:2px solid ${accentColor};box-shadow:0 0 0 10px #0F1115, 0 0 20px ${accentColor}50;text-align:center;">
        <span style="font-size:16px;font-weight:900;color:${accentColor};letter-spacing:0.05em;line-height:1;font-family:'Ubuntu',sans-serif !important;">${startYear}</span>
      </div>
    </div>`;

  const empty = `<div style="flex:0 0 calc(50% - 4.5rem);max-width:calc(50% - 4.5rem);"></div>`;

  return `
    <div class="timeline-entry poster-era-row" data-index="${index}" style="display:flex;align-items:center;gap:0;width:100%;">
      ${isLeft ? card : empty}
      ${spacer}
      ${isLeft ? empty : card}
    </div>
  `;
}

function renderTimelinePlaylist(pl) {
  const firstSong = pl.songs?.[0];
  const thumb = firstSong?.youtube_id
    ? getYouTubeThumbnail(firstSong.youtube_id, 'mqdefault')
    : 'assets/images/fallback-album.svg';

  return `
    <div style="border-radius:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);overflow:hidden;transition:all 0.2s ease;cursor:pointer;"
      onclick="window.location.hash='#/playlist/${pl.id}'"
      onmouseover="this.style.background='rgba(233,84,32,0.12)';this.style.borderColor='rgba(233,84,32,0.45)';"
      onmouseout="this.style.background='rgba(255,255,255,0.04)';this.style.borderColor='rgba(255,255,255,0.07)';">
      <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;">
        <img src="${thumb}" alt="${pl.name || ''}" style="width:38px;height:38px;border-radius:8px;object-fit:cover;flex-shrink:0;border:1px solid rgba(255,255,255,0.1);" loading="lazy" onerror="this.src='assets/images/fallback-album.svg'">
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:6px;">
            <span class="material-symbols-outlined" style="font-size:15px;color:#E95420;flex-shrink:0;">graphic_eq</span>
            <a href="#/playlist/${pl.id}" onclick="event.stopPropagation()" style="display:block;font-size:13px;font-weight:800;color:#f1f5f9;text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:color 0.15s ease;"
              onmouseover="this.style.color='#E95420'" onmouseout="this.style.color='#f1f5f9'">${pl.name}</a>
          </div>
          <span style="display:inline-flex;align-items:center;gap:4px;font-size:10px;color:#94a3b8;margin-top:2px;">
            <span class="material-symbols-outlined" style="font-size:12px;color:#64748b;">audiotrack</span>
            ${pl.songs?.length || 0} tracks
          </span>
        </div>
        <button class="play-playlist-btn" data-playlist-id="${pl.id}" title="Play ${pl.name}"
          onclick="event.stopPropagation();"
          style="width:32px;height:32px;border-radius:50%;background:#E95420;color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 12px rgba(233,84,32,0.4);transition:transform 0.15s ease,box-shadow 0.15s ease;"
          onmouseover="this.style.transform='scale(1.1)';this.style.boxShadow='0 6px 18px rgba(233,84,32,0.6)'"
          onmouseout="this.style.transform='scale(1)';this.style.boxShadow='0 4px 12px rgba(233,84,32,0.4)'">
          <span class="material-symbols-outlined" style="font-size:18px;">play_arrow</span>
        </button>
      </div>
    </div>
  `;
}

function renderTimelineSongRow(s, index, playlistId) {
  return `
    <div class="song-play-row" data-song-id="${s.id}" data-playlist-id="${playlistId}"
      style="display:flex;align-items:center;gap:8px;padding:4px 6px;border-radius:6px;cursor:pointer;transition:background 0.15s ease;"
      onmouseover="this.style.background='rgba(255,255,255,0.06)'"
      onmouseout="this.style.background='transparent'">
      <span style="font-size:10px;font-family:monospace;color:#475569;width:14px;text-align:center;flex-shrink:0;">${index}</span>
      <span style="font-size:11px;color:#cbd5e1;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${s.title}</span>
      <span style="font-size:10px;font-family:monospace;color:#475569;flex-shrink:0;">${s.duration || '--:--'}</span>
    </div>
  `;
}

// Keep old names as aliases so setupTimelineObserver still finds .timeline-entry
function renderPosterSubgenreCard(pl, index) { return renderTimelinePlaylist(pl); }
function renderPosterSongRow(s, index, playlistId) { return renderTimelineSongRow(s, index, playlistId); }


function setupTimelineObserver() {
  const entries = document.querySelectorAll('.timeline-entry');
  if (!entries.length) return;
  const total = entries.length;
  const progressEl = $('#timeline-progress');
  const observer = new IntersectionObserver((observed) => {
    observed.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  entries.forEach(entry => observer.observe(entry));

  requestAnimationFrame(() => {
    entries.forEach(entry => {
      if (!entry.classList.contains('visible')) {
        const rect = entry.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          entry.classList.add('visible');
          observer.unobserve(entry);
        }
      }
    });
  });

  if (!progressEl) return;
  let ticking = false;
  const scrollHandler = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const visible = document.querySelectorAll('.timeline-entry.visible').length;
        progressEl.textContent = `${visible} of ${total} eras`;
        const firstEntry = entries[0];
        const lastEntry = entries[entries.length - 1];
        if (firstEntry && lastEntry) {
          const rect = firstEntry.getBoundingClientRect();
          const lastRect = lastEntry.getBoundingClientRect();
          const inView = rect.top < window.innerHeight - 80 && lastRect.bottom > 80;
          progressEl.style.opacity = inView ? '1' : '0';
        }
        ticking = false;
      });
      ticking = true;
    }
  };
  window.addEventListener('scroll', scrollHandler, { passive: true });
  scrollHandler();
}

function setupTimelineEvents() {
  const container = $('#page-view');
  if (!container) return;

  container.addEventListener('click', (e) => {
    const songRow = e.target.closest('.song-play-row');
    if (songRow) {
      const songId = songRow.dataset.songId;
      const playlistId = songRow.dataset.playlistId;
      const pl = store.getPlaylist(playlistId);
      if (pl) {
        const idx = pl.songs.findIndex(s => s.id === songId);
        if (idx > -1) store.playPlaylist(playlistId, idx);
      }
      return;
    }

    const playPlBtn = e.target.closest('.play-playlist-btn');
    if (playPlBtn) {
      const playlistId = playPlBtn.dataset.playlistId;
      const pl = store.getPlaylist(playlistId);
      if (pl && pl.songs?.length) {
        store.playPlaylist(playlistId, 0);
      }
      return;
    }
  });
}
