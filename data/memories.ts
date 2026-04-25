export type MemoryMedia = {
  type: 'image' | 'video'
  url: string
  thumb?: string
}

export type MemoryEvent = {
  id: string
  date: string
  title: string
  description: string
  tags: string[]
  media: MemoryMedia[]
}

export type MemoryYear = {
  year: number
  title: string
  summary: string
  cover: string
  events: MemoryEvent[]
}

export const memoryYears: MemoryYear[] = [
  {
    year: 2017,
    title: 'The Beginning',
    summary: 'First pages of our story started here.',
    cover: '/cats/cat1.png',
    events: [
      {
        id: '2017-01',
        date: '2017-03-12',
        title: 'First Memory Marker',
        description: 'The first memory we saved from this year.',
        tags: ['start', 'milestone'],
        media: [{ type: 'image', url: '/cats/cat1.png' }],
      },
      {
        id: '2017-02',
        date: '2017-11-22',
        title: 'A Day Worth Saving',
        description: 'A small moment that turned into a core memory.',
        tags: ['special'],
        media: [{ type: 'video', url: 'https://drive.google.com' }],
      },
    ],
  },
  {
    year: 2018,
    title: 'More Chapters',
    summary: 'Moments became patterns, patterns became stories.',
    cover: '/cats/cat2.png',
    events: [
      {
        id: '2018-01',
        date: '2018-02-04',
        title: 'A Shared Laugh',
        description: 'One of those days we still talk about.',
        tags: ['funny'],
        media: [{ type: 'image', url: '/cats/cat2.png' }],
      },
      {
        id: '2018-02',
        date: '2018-09-15',
        title: 'Tiny Celebration',
        description: 'A little celebration that meant a lot.',
        tags: ['celebration'],
        media: [{ type: 'video', url: 'https://drive.google.com' }],
      },
    ],
  },
  {
    year: 2019,
    title: 'Growing Closer',
    summary: 'More depth, more comfort, more us.',
    cover: '/cats/cat3.png',
    events: [
      {
        id: '2019-01',
        date: '2019-01-29',
        title: 'Quiet Day, Big Meaning',
        description: 'A calm day that stayed unforgettable.',
        tags: ['calm'],
        media: [{ type: 'image', url: '/cats/cat3.png' }],
      },
      {
        id: '2019-02',
        date: '2019-08-08',
        title: 'The Unexpected Moment',
        description: 'A surprise that became a favorite memory.',
        tags: ['surprise'],
        media: [{ type: 'video', url: 'https://drive.google.com' }],
      },
    ],
  },
  {
    year: 2020,
    title: 'Holding On',
    summary: 'Even in difficult times, we found moments to keep.',
    cover: '/cats/cat1.png',
    events: [
      {
        id: '2020-01',
        date: '2020-04-17',
        title: 'Check-In Tradition',
        description: 'Routine check-ins that made everything easier.',
        tags: ['support'],
        media: [{ type: 'image', url: '/cats/cat1.png' }],
      },
      {
        id: '2020-02',
        date: '2020-12-31',
        title: 'Year-End Promise',
        description: 'A promise that carried into the next year.',
        tags: ['milestone'],
        media: [{ type: 'video', url: 'https://drive.google.com' }],
      },
    ],
  },
  {
    year: 2021,
    title: 'New Rhythm',
    summary: 'Life changed shape, and we adapted together.',
    cover: '/cats/cat2.png',
    events: [
      {
        id: '2021-01',
        date: '2021-05-09',
        title: 'Small Victory',
        description: 'A win that deserved to be remembered.',
        tags: ['achievement'],
        media: [{ type: 'image', url: '/cats/cat2.png' }],
      },
      {
        id: '2021-02',
        date: '2021-10-20',
        title: 'Favorite Clip',
        description: 'One of the videos we keep replaying.',
        tags: ['favorite'],
        media: [{ type: 'video', url: 'https://drive.google.com' }],
      },
    ],
  },
  {
    year: 2022,
    title: 'High Points',
    summary: 'A year of bright days and strong memories.',
    cover: '/cats/cat3.png',
    events: [
      {
        id: '2022-01',
        date: '2022-03-01',
        title: 'The Day We Smiled Most',
        description: 'An all-day memory worth replaying.',
        tags: ['happy'],
        media: [{ type: 'image', url: '/cats/cat3.png' }],
      },
      {
        id: '2022-02',
        date: '2022-11-13',
        title: 'Night of Stories',
        description: 'A night full of stories and screenshots.',
        tags: ['story'],
        media: [{ type: 'video', url: 'https://drive.google.com' }],
      },
    ],
  },
  {
    year: 2023,
    title: 'Details Matter',
    summary: 'The little moments started to shine more.',
    cover: '/cats/cat1.png',
    events: [
      {
        id: '2023-01',
        date: '2023-02-26',
        title: 'Morning Memory',
        description: 'A simple morning that became iconic.',
        tags: ['daily'],
        media: [{ type: 'image', url: '/cats/cat1.png' }],
      },
      {
        id: '2023-02',
        date: '2023-09-30',
        title: 'Late-Night Clip',
        description: 'A late-night recording we kept close.',
        tags: ['night'],
        media: [{ type: 'video', url: 'https://drive.google.com' }],
      },
    ],
  },
  {
    year: 2024,
    title: 'Bolder Memories',
    summary: 'Big moments and beautiful milestones.',
    cover: '/cats/cat2.png',
    events: [
      {
        id: '2024-01',
        date: '2024-01-14',
        title: 'First Big Highlight',
        description: 'A major highlight from this year.',
        tags: ['highlight'],
        media: [{ type: 'image', url: '/cats/cat2.png' }],
      },
      {
        id: '2024-02',
        date: '2024-12-18',
        title: 'Unforgettable Clip',
        description: 'A clip we keep revisiting.',
        tags: ['favorite'],
        media: [{ type: 'video', url: 'https://drive.google.com' }],
      },
    ],
  },
  {
    year: 2025,
    title: 'Everything Feels Real',
    summary: 'Memories gained more context and depth.',
    cover: '/cats/cat3.png',
    events: [
      {
        id: '2025-01',
        date: '2025-04-06',
        title: 'A Day to Frame',
        description: 'A frame-worthy memory with a perfect vibe.',
        tags: ['photo'],
        media: [{ type: 'image', url: '/cats/cat3.png' }],
      },
      {
        id: '2025-02',
        date: '2025-10-11',
        title: 'Voice + Video Memory',
        description: 'A memory where everything clicked.',
        tags: ['video'],
        media: [{ type: 'video', url: 'https://drive.google.com' }],
      },
    ],
  },
  {
    year: 2026,
    title: 'This Chapter',
    summary: 'The newest memories, still unfolding.',
    cover: '/cats/cat1.png',
    events: [
      {
        id: '2026-01',
        date: '2026-01-10',
        title: 'Latest Saved Moment',
        description: 'Recent memory we want to keep close.',
        tags: ['recent'],
        media: [{ type: 'image', url: '/cats/cat1.png' }],
      },
      {
        id: '2026-02',
        date: '2026-02-13',
        title: 'Today Marker',
        description: 'Current point in the timeline build.',
        tags: ['today'],
        media: [{ type: 'video', url: 'https://drive.google.com' }],
      },
    ],
  },
]
