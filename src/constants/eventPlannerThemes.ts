export interface FoodOption {
  id: string;
  label: string;
  ratePerPlate: number;
  description: string;
  badge?: string;
}

export interface DecorLevel {
  id: string;
  label: string;
  cost: number;
  description: string;
  badge?: string;
}

export interface MediaTier {
  id: string;
  label: string;
  cost: number;
  description: string;
  badge?: string;
}

export interface CelebrationTheme {
  id: string;
  name: string;
  tagline: string;
  category: 'wedding' | 'reception' | 'haldi' | 'birthday' | 'corporate' | 'gala';
  badge: string;
  image: string;
  baseVenueRate: number;
  description: string;
  color: string;
  gradient: [string, string];
  recommendedInclusions: string[];
  foodOptions: FoodOption[];
  decorLevels: DecorLevel[];
  mediaTiers: MediaTier[];
  aiTips: string[];
  suggestedAddons: { id: string; name: string; cost: number; desc: string }[];
}

export const CELEBRATION_THEMES: CelebrationTheme[] = [
  {
    id: 'vedic-vivah',
    name: 'Vedic Vivah & Royal Rajasthani',
    tagline: 'Regal Palace Mandap with Shehnai & 56-Bhog Royal Feast',
    category: 'wedding',
    badge: '👑 Most Popular Royal Choice',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    baseVenueRate: 175000,
    description: 'Immerse your guests in timeless royal heritage. Featuring hand-carved floral mandaps, traditional Shehnai & Nagada live troupe, brass diya illumination, royal varmala stage, and an authentic multi-course feast.',
    color: '#e11d48',
    gradient: ['#e11d48', '#be123c'],
    recommendedInclusions: [
      'Hand-crafted royal mandap with fresh red & gold roses',
      'Live Shehnai & Nagada welcoming ensemble',
      'Royal varmala revolving hydraulic stage with cold pyros',
      'Heritage brass lamps & floral pathway lighting',
      'Special VIP family lounge with personalized stewards',
    ],
    foodOptions: [
      {
        id: 'royal-veg-thali',
        label: 'Pure Satvik & Royal Rajasthani Thali',
        ratePerPlate: 950,
        description: 'Authentic Dal Baati Churma, Gatte ki Sabzi, Paneer Lababdar, 4 sweets & dry fruit shrikhand',
        badge: 'Pure Veg',
      },
      {
        id: 'deluxe-regal-buffet',
        label: 'Deluxe Royal Feast (Veg + Non-Veg Live Stalls)',
        ratePerPlate: 1350,
        description: 'Mutton Rogan Josh, Butter Chicken, Malai Paneer, Galouti Kebabs, 5 Live counters & Ice-cream bar',
        badge: 'Recommended',
      },
      {
        id: 'maharaja-gourmet',
        label: 'Maharaja 7-Course Imperial Gala Feast',
        ratePerPlate: 1850,
        description: 'Pan-Indian royal curries, live wood-fired tandoor, Dum Biryani handis, artisanal dessert carts',
        badge: 'Ultra Luxury',
      },
    ],
    decorLevels: [
      {
        id: 'decor-standard',
        label: 'Classic Heritage Elegance',
        cost: 85000,
        description: 'Marigold & red rose mandap, entry arch, 20 banquet table centerpieces & basic stage lighting',
      },
      {
        id: 'decor-premium',
        label: 'Grand Palace Production (LED + Fresh Florals)',
        cost: 165000,
        description: 'Imported Dutch roses, 40ft LED backdrop, illuminated royal carpet pathway & mist machines',
        badge: 'Best Value',
      },
      {
        id: 'decor-royal',
        label: 'Imperial Palace Extravaganza',
        cost: 285000,
        description: 'Full courtyard transformation, truss lighting, chandelier canopy, cold pyro revolving stage',
        badge: 'Ultra Grand',
      },
    ],
    mediaTiers: [
      {
        id: 'media-traditional',
        label: 'Traditional Photo & HD Video',
        cost: 35000,
        description: '2 Photographers, 1 Videographer, soft copy photos + 60 min master video film',
      },
      {
        id: 'media-cinematic',
        label: '4K Cinematic Film + 4K Drone Aerial',
        cost: 75000,
        description: 'Candid wedding portraiture, teaser reel (60s), cinematic wedding film, 4K Drone coverage',
        badge: 'Top Pick',
      },
      {
        id: 'media-celebrity',
        label: 'Complete 3-Day Cinematic & Pre-Wedding Suite',
        cost: 140000,
        description: 'Pre-wedding shoot, Haldi + Sangeet + Wedding coverage, 2 Drone operators, coffee table photobook',
      },
    ],
    aiTips: [
      'Booking a heritage lawn with guest accommodation bundled saves up to 22% compared to separate hotel room bookings.',
      'A 40-minute live chaat and mocktail counter before pheras reduces mainline dinner plate counts by ~12%.',
      'For royal themes, scheduling photographer portraits 1 hour before sunset captures the most stunning golden-hour shots without extra stage spotlights.',
    ],
    suggestedAddons: [
      { id: 'vintage-car', name: 'Vintage Royal Car Entry', cost: 18000, desc: 'Classic open-top vintage convertible for groom entry' },
      { id: 'fireworks-show', name: 'Synchronized Cold Pyro Show', cost: 15000, desc: '6 cold sparks towers for varmala & cake cutting' },
    ],
  },
  {
    id: 'pastel-romance',
    name: 'Pastel Romance & Modern Garden',
    tagline: 'Fairy Light Canopies, Blush Floral Arches & Acoustic Symphony',
    category: 'wedding',
    badge: '🌸 Trending Chic Theme',
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80',
    baseVenueRate: 140000,
    description: 'Subtle sophistication with soft blush pinks, ivory, and eucalyptus greens. Perfect for day-to-night open lawns or contemporary banquet pavilions with live acoustic melodies and fusion catering.',
    color: '#f43f5e',
    gradient: ['#fb7185', '#e11d48'],
    recommendedInclusions: [
      'Blush pink, peach & ivory fresh floral arbor',
      'Overhead warm fairy light tunnel & Edison bulbs',
      'Acoustic violin or saxophone entrance performance',
      'Personalized wooden signboards & polaroid guestbook nook',
      'Artisanal mocktail and smoothie bar with mixologist',
    ],
    foodOptions: [
      {
        id: 'garden-bistro-veg',
        label: 'Artisanal Garden Bistro (Pure Veg)',
        ratePerPlate: 850,
        description: 'Gourmet stuffed kulchas, exotic vegetable au gratin, Dal Makhani Bukhara, live pasta counter',
      },
      {
        id: 'modern-fusion-buffet',
        label: 'Modern Pan-Indian & Continental Fusion',
        ratePerPlate: 1250,
        description: 'Live dim-sum and bao bar, tandoori salmon, rosemary roasted chicken, dal makhani, churros & waffle station',
        badge: 'Recommended',
      },
      {
        id: 'global-grand-spread',
        label: 'Global Culinary Spread (Italian, Asian & Awadhi)',
        ratePerPlate: 1650,
        description: 'Wood-fired gourmet pizza, sushi platter, royal dum biryani, live gelato & molten lava bar',
        badge: 'Gourmet',
      },
    ],
    decorLevels: [
      {
        id: 'decor-standard',
        label: 'Pastel Garden Simplicity',
        cost: 65000,
        description: 'Floral arch backdrop, fairy light backdrop, 15 floral table centerpieces & pathway candles',
      },
      {
        id: 'decor-premium',
        label: 'Dreamy Fairy Light Canopy & Hydrangeas',
        cost: 130000,
        description: 'Full lawn fairy light ceiling, imported hydrangeas & carnations, mirror pathway, chic photo corners',
        badge: 'Most Popular',
      },
      {
        id: 'decor-royal',
        label: 'Enchanted Forest & Glass House Fantasy',
        cost: 220000,
        description: 'Glasshouse structure, cascading wisteria ceiling, crystal chandeliers, smoke entry & floral photobooths',
      },
    ],
    mediaTiers: [
      {
        id: 'media-traditional',
        label: 'Essential Modern Photo & Video',
        cost: 32000,
        description: '2 Contemporary photographers, candid & family portraits, edited online gallery',
      },
      {
        id: 'media-cinematic',
        label: 'Editorial Portraiture + 4K Cinematic Teaser',
        cost: 68000,
        description: 'Vogue-style couple portrait session, 4K Drone footage, 90-sec viral Instagram reel, cinematic wedding film',
        badge: 'Top Pick',
      },
      {
        id: 'media-celebrity',
        label: 'Signature Film Director Suite',
        cost: 125000,
        description: 'Lead cinematographer, dedicated portrait stylist, drone pilot, raw clips drive + archival album',
      },
    ],
    aiTips: [
      'Pastel and garden themes look most enchanting during daytime sunset transitions (4:30 PM - 8:00 PM), saving significantly on heavy stage floodlights.',
      'Pairing live acoustic saxophone with a mocktail bar creates a 5-star atmosphere at a fraction of full brass band cost.',
    ],
    suggestedAddons: [
      { id: 'polaroid-booth', name: 'Instant Polaroid Photo Booth', cost: 12000, desc: 'Unlimited polaroid prints for guests with custom event frames' },
      { id: 'acoustic-trio', name: 'Live Acoustic Trio Band', cost: 22000, desc: 'Guitar, violin & vocals for welcoming and dinner ambiance' },
    ],
  },
  {
    id: 'bollywood-sangeet',
    name: 'Bollywood Sangeet & Grand Gala',
    tagline: 'High-Energy LED Dance Floor, Concert Audio & Pyrotechnics',
    category: 'reception',
    badge: '⚡ High Energy Party',
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
    baseVenueRate: 110000,
    description: 'A concert-grade celebration where friends and family dance all night! Equipped with 3D LED dance floors, moving head beam lights, dry ice cloud entries, celebrity DJ, and finger-licking party platters.',
    color: '#8b5cf6',
    gradient: ['#a855f7', '#7c3aed'],
    recommendedInclusions: [
      'Customized 20x20ft LED animated dance floor',
      'Concert line-array sound system (JBL VTX / RCF)',
      '12 Intelligent moving head beam lights + hazers',
      'Dry ice cloud effects for couple dance performance',
      'Live finger food & cocktail finger food pass-arounds',
    ],
    foodOptions: [
      {
        id: 'sangeet-veg-delight',
        label: 'Party Starters & Royal Dinner (Pure Veg)',
        ratePerPlate: 750,
        description: '8 Pass-around starters (Hara Bhara Kebab, Paneer Tikka, Crispy Corn), Dal Makhani, Biryani & Gulab Jamun',
      },
      {
        id: 'sangeet-cocktail-buffet',
        label: 'Live Grills & Global Party Spread',
        ratePerPlate: 1150,
        description: 'Tandoori Murgh, Fish Amritsari, Dahi Kebab, live Pasta bar, Hyderabadi Biryani, Sizzling Brownies',
        badge: 'Recommended',
      },
      {
        id: 'sangeet-celebrity-vip',
        label: 'Celebrity Gala Spread & Live Dessert Counters',
        ratePerPlate: 1550,
        description: 'Lamb seekh kebabs, butter garlic prawns, paneer tikka, 4 live international counters, waffle & fondue bar',
        badge: 'VIP Feast',
      },
    ],
    decorLevels: [
      {
        id: 'decor-standard',
        label: 'Club Lounge Aesthetics',
        cost: 55000,
        description: 'Black & gold drape accents, fairy light photo wall, cocktail high-tables & neon signage',
      },
      {
        id: 'decor-premium',
        label: 'Concert Stage & Truss Lighting',
        cost: 110000,
        description: 'Full aluminum box truss, 30ft LED visual wall, moving head beams, smoke guns & VIP sofa lounge',
        badge: 'Best Experience',
      },
      {
        id: 'decor-royal',
        label: 'Full Arena Concert Experience',
        cost: 195000,
        description: 'Concert arena trussing, synchronized light show, CO2 cryo jets, cold pyros, LED tunnel entrance',
      },
    ],
    mediaTiers: [
      {
        id: 'media-traditional',
        label: 'Party Coverage (Photo & Video)',
        cost: 25000,
        description: '1 Candid photographer, 1 Party videographer, all raw dance performance clips',
      },
      {
        id: 'media-cinematic',
        label: 'Multi-Cam Concert Video + Dance Reels',
        cost: 55000,
        description: '3 Cameras (1 Jimmy Jib crane), fast-paced party highlights reel, full uncut family dance videos',
        badge: 'Recommended',
      },
      {
        id: 'media-celebrity',
        label: 'Live Streaming + 4K Broadcast Setup',
        cost: 95000,
        description: 'Multi-cam live switching, YouTube/Zoom private broadcast for overseas relatives, 4K Jimmy Jib crane',
      },
    ],
    aiTips: [
      'Focus budget on live finger food starters and drinks pass-around during the dance hours—guests consume 60% of food before main dinner is even opened.',
      'Booking your DJ and sound truss together with the hall package avoids equipment conflict and reduces sound vendor fees by ~15%.',
    ],
    suggestedAddons: [
      { id: 'co2-jets', name: 'CO2 Cryo Jets (4 Cannons)', cost: 14000, desc: 'High-energy cold smoke blasts during the peak dance numbers' },
      { id: 'dhol-troupe', name: 'Punjabi Dhol Troupe (4 Dholis)', cost: 10000, desc: 'High energy acoustic live dhol for baraat and dance floor' },
    ],
  },
  {
    id: 'haldi-mehendi',
    name: 'Vibrant Haldi & Mehendi Mela',
    tagline: 'Marigold Sunshine Canopies, Dholak Troupe & Street Chaat',
    category: 'haldi',
    badge: '🌼 Joyful Pre-Wedding Mela',
    image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80',
    baseVenueRate: 65000,
    description: 'A colorful, fun-filled celebration bursting with cheerful yellow and orange hues. Includes floral jewelry stations, Rajasthani puppet & bangle stalls, live mehendi artists, and authentic street food carts.',
    color: '#eab308',
    gradient: ['#facc15', '#ca8a04'],
    recommendedInclusions: [
      'Marigold flower curtain backdrops & sunflower photo frames',
      'Traditional brass urlis with flower petals for haldi bath',
      'Live Mehendi artist station (4 professional artists)',
      'Rajasthani turban tying and colorful umbrella props',
      'Live street chaat carts (Golgappas, Papdi, Tikki, Kulfi)',
    ],
    foodOptions: [
      {
        id: 'haldi-chaat-mela',
        label: 'Street Food Mela & Lunch Buffet (Pure Veg)',
        ratePerPlate: 550,
        description: '6 Live chaat counters (Pani Puri, Aloo Tikki, Pav Bhaji), Chole Bhature, Dal Tadka, Jeera Rice & Jalebi Rabdi',
        badge: 'Crowd Favorite',
      },
      {
        id: 'haldi-deluxe-brunch',
        label: 'Deluxe Celebration Brunch (Veg + Chicken Counters)',
        ratePerPlate: 850,
        description: 'Live Dosa counter, Kadhai Paneer, Chicken Tikka Chaat, Puri Sabzi, Gulab Jamun & Matka Kulfi',
        badge: 'Recommended',
      },
      {
        id: 'haldi-royal-carnival',
        label: 'Royal Carnival Feast with Artisanal Desserts',
        ratePerPlate: 1150,
        description: 'Full Awadhi lunch, live tawa paratha, non-veg kebab station, Falooda bar & live mocktails',
      },
    ],
    decorLevels: [
      {
        id: 'decor-standard',
        label: 'Yellow Sunshine Marigold Theme',
        cost: 35000,
        description: 'Marigold string backdrop, haldi urli setup, 10 marigold props, simple photo booth',
      },
      {
        id: 'decor-premium',
        label: 'Carnival Tent & Floral Umbrella Lounge',
        cost: 75000,
        description: 'Cabana seating with yellow/orange drapes, floral swing (jhula), wooden photo carts, smoke bomb entries',
        badge: 'Best Value',
      },
      {
        id: 'decor-royal',
        label: 'Grand Jaipur Haveli Mela Production',
        cost: 135000,
        description: 'Grand floral archway, royal painted urli with fountain, custom carnival tents, flower shower cannons',
      },
    ],
    mediaTiers: [
      {
        id: 'media-traditional',
        label: 'Candid Color Photography',
        cost: 18000,
        description: '1 Candid photographer capturing candid haldi splashes, family portraits & mehendi details',
      },
      {
        id: 'media-cinematic',
        label: 'Cinematic Haldi Splash Reel + Slow-Mo Video',
        cost: 38000,
        description: '2 Photographers/Videographers, slow-motion flower splash videos, 60s viral Instagram reel',
        badge: 'Top Pick',
      },
      {
        id: 'media-celebrity',
        label: 'Full Drone Splash & 4K Reel Production',
        cost: 65000,
        description: 'Drone aerial shots of flower shower, 2 videographers, same-day edited highlight reel for evening sharing',
      },
    ],
    aiTips: [
      'Haldi events work best from 10:00 AM to 3:00 PM in outdoor or poolside venues, saving 100% on night lighting costs.',
      'Organizing a high-energy live chaat and kulfi station keeps food costs moderate while creating the most praised guest experience.',
    ],
    suggestedAddons: [
      { id: 'flower-shower', name: 'Rose Petal Shower Cannons (4 Cannons)', cost: 8000, desc: 'Shower couple with fresh flower petals during the haldi ritual' },
      { id: 'smoke-bombs', name: 'Color Smoke Bomb Entry (8 Colors)', cost: 4500, desc: 'Vibrant organic yellow & orange smoke flares for photos' },
    ],
  },
  {
    id: 'milestone-birthday',
    name: 'Milestone Birthday & Glow Gala',
    tagline: 'Neon Signage, Balloon Architecture & Mixologist Mocktails',
    category: 'birthday',
    badge: '🎂 Glamour & Fun',
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80',
    baseVenueRate: 45000,
    description: 'Designed for memorable 1st, 18th, 25th, 50th, or milestone birthdays! Complete with custom neon name signs, organic balloon sculptures, interactive games host, designer theme cake, and gourmet finger foods.',
    color: '#06b6d4',
    gradient: ['#22d3ee', '#0891b2'],
    recommendedInclusions: [
      'Customized neon light name sign (yours to keep)',
      'Organic pastel or chrome balloon arch installation',
      'Theme designer tier cake table & dessert pedestals',
      'Professional anchor & fun interactive party games',
      'Kids & adults party props and LED party sunglasses',
    ],
    foodOptions: [
      {
        id: 'birthday-party-bites',
        label: 'Party Bites & Main Dinner (Pure Veg)',
        ratePerPlate: 499,
        description: 'French fries, cheese balls, mini pizzas, Paneer Butter Masala, Naan, Pulao & Chocolate brownie',
      },
      {
        id: 'birthday-deluxe-buffet',
        label: 'Deluxe Youth & Family Spread (Veg + Non-Veg)',
        ratePerPlate: 799,
        description: 'Chicken nuggets, peri-peri wings, spring rolls, pasta live counter, butter chicken, dal makhani & ice cream',
        badge: 'Recommended',
      },
      {
        id: 'birthday-gourmet-lounge',
        label: 'Lounge Barbecue & Live Dessert Buffet',
        ratePerPlate: 1099,
        description: 'Live grill station, gourmet sliders, Mexican tacos, biryani, chocolate fountain with marshmallows',
        badge: 'Premium',
      },
    ],
    decorLevels: [
      {
        id: 'decor-standard',
        label: 'Vibrant Balloon Backdrop & Cake Table',
        cost: 22000,
        description: 'Ring arch with pastel balloons, customized acrylic name cutout, 3 cake pedestals, basic LED spotlights',
      },
      {
        id: 'decor-premium',
        label: 'Neon Glamour & Shimmer Sequin Wall',
        cost: 45000,
        description: 'Shimmer wall, customized neon quote sign, organic balloon garland, photo booth with funny props',
        badge: 'Top Pick',
      },
      {
        id: 'decor-royal',
        label: 'Full Thematic Luxury Experience',
        cost: 85000,
        description: '3D theme props (e.g. Disney / Casino / Retro), LED dance floor, smoke machine, customized light projection',
      },
    ],
    mediaTiers: [
      {
        id: 'media-traditional',
        label: 'Event Photography (Candid + Posed)',
        cost: 15000,
        description: '1 Professional photographer, 100+ edited high-res digital photos, candid cake cutting coverage',
      },
      {
        id: 'media-cinematic',
        label: 'Cinematic Reel + Party Video Film',
        cost: 28000,
        description: '1 Photographer + 1 Videographer, 60s Instagram birthday reel, full cake cutting & games video',
        badge: 'Recommended',
      },
      {
        id: 'media-celebrity',
        label: 'VIP Live Streaming & 360 Spin Booth',
        cost: 50000,
        description: 'Includes 360-degree rotating selfie video booth with instant guest AirDrop/QR download',
      },
    ],
    aiTips: [
      'Choosing a rooftop or lounge venue often includes in-house ambient lighting and sound, cutting extra decor and DJ costs by up to 30%.',
      'A 360-degree selfie video booth is the single highest-rated engagement feature for birthday guests of all age groups.',
    ],
    suggestedAddons: [
      { id: '360-booth', name: '360-Degree Video Selfie Booth (3 Hours)', cost: 16000, desc: 'Slow-motion 360 rotating camera platform with instant mobile download' },
      { id: 'party-anchor', name: 'Professional Emcee & Games Host', cost: 8000, desc: 'Engaging host conducting trivia, dance-offs and games' },
    ],
  },
  {
    id: 'eco-courtyard',
    name: 'Eco-Courtyard & Intimate Gathering',
    tagline: 'Terracotta Aesthetics, Acoustic Sufi & Farm-to-Table Feast',
    category: 'corporate',
    badge: '🌿 Sustainable & Soulful',
    image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80',
    baseVenueRate: 85000,
    description: 'Curated for discerning families and intimate celebrations of 50 to 250 guests. Featuring brass oil lamps, terracotta tableware, live acoustic sufi or ghazal music, and farm-to-table regional cuisine.',
    color: '#059669',
    gradient: ['#10b981', '#047857'],
    recommendedInclusions: [
      'Earthy terracotta pots & fragrant jasmine flower decor',
      'Warm ambient oil lamp (diya) & brass lantern lighting',
      'Live unplugged Sufi / Ghazal / Folk acoustic performance',
      'Zero single-use plastic, sustainable banana leaf or leaf-plate service',
      'Artisanal regional beverage bar (Aam Panna, Sattu cooler, Masala Chai)',
    ],
    foodOptions: [
      {
        id: 'eco-satvik-spread',
        label: 'Organic Farm-to-Table Satvik Feast',
        ratePerPlate: 650,
        description: 'Authentic seasonal regional delicacies, handmade rotis, heirloom dal, kheer & jaggery sweets',
      },
      {
        id: 'eco-heritage-deluxe',
        label: 'Heritage Regional Banquet (Veg + Local Grills)',
        ratePerPlate: 950,
        description: 'Smoked paneer, rustic country chicken curry, handi mutton, litti chokha station & malpua live counter',
        badge: 'Recommended',
      },
      {
        id: 'eco-gourmet-spread',
        label: 'Slow-Cooked Awadhi & Bhojpuri Royal Spread',
        ratePerPlate: 1350,
        description: 'Slow-simmered handi roasts, zafrani pulao, artisanal regional desserts & kulhad chai station',
      },
    ],
    decorLevels: [
      {
        id: 'decor-standard',
        label: 'Warm Terracotta & Marigold Ambiance',
        cost: 30000,
        description: 'Clay pots with tuberose & marigold, fairy lights on heritage trees, brass table lamps',
      },
      {
        id: 'decor-premium',
        label: 'Rustic Cane & Floating Diya Courtyard',
        cost: 65000,
        description: 'Cane chandeliers, floating water lily urli, candlelit tables, jute carpets & rustic photo wall',
        badge: 'Top Pick',
      },
      {
        id: 'decor-royal',
        label: 'Grand Heritage Haveli Transformation',
        cost: 110000,
        description: 'Full courtyard antique lanterns, jasmine floral ceiling, live cooking station huts & mood lighting',
      },
    ],
    mediaTiers: [
      {
        id: 'media-traditional',
        label: 'Storytelling Candid Photography',
        cost: 20000,
        description: '1 Candid documentary photographer capturing intimate family emotions and laughter',
      },
      {
        id: 'media-cinematic',
        label: 'Soulful Documentary Film + 4K Portraits',
        cost: 45000,
        description: 'Candid photo & video coverage, documentary narrative wedding reel, drone garden footage',
        badge: 'Recommended',
      },
      {
        id: 'media-celebrity',
        label: 'Complete Archival Heritage Film',
        cost: 80000,
        description: 'Full multi-generational family interviews, cinematic film, premium embossed leather photobook',
      },
    ],
    aiTips: [
      'Intimate courtyard celebrations have a 95% higher guest satisfaction rating because hosts can converse personally with every invitee.',
      'A live Kulhad Chai and traditional dessert counter in the evening keeps guests cozy and creates a memorable communal feeling.',
    ],
    suggestedAddons: [
      { id: 'sufi-troupe', name: 'Live Sufi / Ghazal Troupe (3 Artists)', cost: 18000, desc: 'Harmonium, tabla & soulful vocals for candlelit evening dinner' },
      { id: 'litti-counter', name: 'Traditional Charcoal Litti Chokha Hut', cost: 12000, desc: 'Live wood-fired authentic litti chokha served in clay pots' },
    ],
  },
];
