// Seed crafts shown on the Home and Explore pages. These are stored in the
// CraftsContext alongside any user-published crafts. Images are loaded from
// Wikimedia / public-domain sources via direct URLs to avoid bundling binaries.

export const seedCrafts = [
  {
    id: 'seed_madhubani_01',
    title: 'Fish & Lotus Madhubani',
    craft: 'Madhubani',
    region: 'Mithila, Bihar',
    maker: { name: 'Sita Devi', region: 'Madhubani' },
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Madhubani_painting_-_Mithila_painting_3.jpg/1024px-Madhubani_painting_-_Mithila_painting_3.jpg',
    ],
    description:
      'A handpainted Mithila composition in natural pigments. The fish symbolises fertility and the lotus, purity. Painted on handmade paper using twigs and matchsticks for fine line work.',
    materials: 'Handmade paper, natural pigments (lampblack, turmeric, vermillion), bamboo twigs',
    technique:
      'Outlines are drawn with twigs dipped in lampblack. Colour is filled with cotton swabs. The composition leaves no empty space — every gap is filled with motifs.',
    time: '3–5 days',
    modelSrc:
      'https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/Avocado/glTF-Binary/Avocado.glb',
    publishedAt: '2026-04-10',
  },
  {
    id: 'seed_kutch_mirror_01',
    title: 'Mirror-work yoke',
    craft: 'Kutchi mirror embroidery',
    region: 'Bhuj, Kutch, Gujarat',
    maker: { name: 'Hira Ben', region: 'Bhuj' },
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Kutchi_embroidery_DSC0083.jpg/1024px-Kutchi_embroidery_DSC0083.jpg',
    ],
    description:
      'A yoke of Suf and Aari work, dotted with abhla — small mirrors anchored with chain stitch. The geometry is counted from the back of the cloth, never traced.',
    materials: 'Cotton ground cloth, silk thread, abhla mirrors',
    technique:
      'Suf is a counted-thread surface satin stitch. The maker counts warp/weft on the back of the cloth, then satin-stitches a mirrored pattern on the front, fixing each mirror with herringbone.',
    time: '6–10 days',
    modelSrc:
      'https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb',
    publishedAt: '2026-04-14',
  },
  {
    id: 'seed_pattachitra_01',
    title: 'Krishna Lila Pattachitra',
    craft: 'Pattachitra',
    region: 'Raghurajpur, Odisha',
    maker: { name: 'Bhaskar Mahapatra', region: 'Puri' },
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Pattachitra_Painting.jpg/1024px-Pattachitra_Painting.jpg',
    ],
    description:
      'A scroll narrative painted on cloth treated with tamarind paste and chalk. The figures are drawn in profile with elongated eyes; borders are richly ornamented.',
    materials: 'Cotton cloth (patta), tamarind seed gum, chalk, natural mineral pigments',
    technique:
      'The cloth is layered with tamarind gum and chalk to make the patta. Outlines are drawn first in red, filled with mineral pigments, then re-outlined in black. A final coat of resin gives the sheen.',
    time: '10–15 days',
    modelSrc:
      'https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/BoomBox/glTF-Binary/BoomBox.glb',
    publishedAt: '2026-04-02',
  },
  {
    id: 'seed_dokra_01',
    title: 'Dhokra horse',
    craft: 'Dhokra (lost-wax metal casting)',
    region: 'Bastar, Chhattisgarh',
    maker: { name: 'Ramesh Ghadwa', region: 'Bastar' },
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Dhokra_artisans_of_Bastar.jpg/1024px-Dhokra_artisans_of_Bastar.jpg',
    ],
    description:
      'A galloping horse cast in brass using the lost-wax process. The body is built up in fine wax threads — once cast, those threads become the surface texture you see.',
    materials: 'Beeswax, riverbed clay, scrap brass',
    technique:
      'A clay core is wrapped in detailed wax threads, then encased in another clay layer. The whole piece is fired — wax escapes, brass is poured into the cavity. The mould is then broken to reveal the casting.',
    time: '7–14 days',
    modelSrc:
      'https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/Horse/glTF-Binary/Horse.glb',
    publishedAt: '2026-03-28',
  },
  {
    id: 'seed_blueprint_01',
    title: 'Sanganeri block print stole',
    craft: 'Sanganeri block printing',
    region: 'Sanganer, Rajasthan',
    maker: { name: 'Ashok Chhipa', region: 'Sanganer' },
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Block_printing_at_Sanganer.jpg/1024px-Block_printing_at_Sanganer.jpg',
    ],
    description:
      'A cotton stole printed with hand-carved teakwood blocks. The famed Sanganeri butis are printed on a cream ground, dyed with madder and indigo.',
    materials: 'Mill-spun cotton, natural dyes (madder, indigo, pomegranate), teakwood blocks',
    technique:
      'The cloth is washed, sun-dried and treated with myrobalan. Blocks are dipped in a tray of dye and stamped down with a heel-of-palm thump. The cloth is then steamed and washed to fix the dye.',
    time: '2–3 days',
    modelSrc:
      'https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/Lantern/glTF-Binary/Lantern.glb',
    publishedAt: '2026-04-22',
  },
  {
    id: 'seed_warli_01',
    title: 'Wedding Warli',
    craft: 'Warli',
    region: 'Palghar, Maharashtra',
    maker: { name: 'Jivya Soma', region: 'Dahanu' },
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Warli_Painting_by_Jivya_Soma_Mashe_-_DSC00299.jpg/1024px-Warli_Painting_by_Jivya_Soma_Mashe_-_DSC00299.jpg',
    ],
    description:
      'A Warli wedding scene built from triangles and circles. The whole village dances around the central deity, Palaghata.',
    materials: 'Cow-dung washed wall, rice paste, bamboo stick',
    technique:
      'A bamboo stick is chewed at one end into a soft brush. Rice paste is the only pigment. The whole composition is built from two triangles meeting at the apex — a body — and a circle — a head.',
    time: '1–2 days',
    modelSrc:
      'https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/Duck/glTF-Binary/Duck.glb',
    publishedAt: '2026-04-19',
  },
]

export const ALL_REGIONS = [
  'Mithila, Bihar',
  'Bhuj, Kutch, Gujarat',
  'Raghurajpur, Odisha',
  'Bastar, Chhattisgarh',
  'Sanganer, Rajasthan',
  'Palghar, Maharashtra',
  'Srinagar, Kashmir',
  'Channapatna, Karnataka',
  'Kanchipuram, Tamil Nadu',
  'Thanjavur, Tamil Nadu',
  'Varanasi, Uttar Pradesh',
  'Cuttack, Odisha',
]

export const ALL_CRAFT_TRADITIONS = [
  'Madhubani',
  'Pattachitra',
  'Warli',
  'Kalamkari',
  'Phad',
  'Gond',
  'Kutchi mirror embroidery',
  'Phulkari',
  'Chikankari',
  'Kantha',
  'Dhokra (lost-wax metal casting)',
  'Bidriware',
  'Channapatna woodcraft',
  'Blue pottery',
  'Sanganeri block printing',
  'Bagh print',
  'Pashmina weaving',
  'Banarasi weaving',
  'Kanchipuram silk',
]
