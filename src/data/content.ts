export interface MenuItem {
  id: string;
  name: string;
  category: 'fish' | 'sides' | 'drinks' | 'desserts';
  description: string;
  priceNote: string; // "prix à confirmer"
  image?: string;
  imageAlt?: string;
  badge?: string;
}

export interface SpaceDetail {
  id: string;
  name: string;
  capacity: string;
  description: string;
  atmosphere: string;
  image: string;
  features: string[];
}

export interface FlightBeat {
  id: string;
  title: string;
  subtitle?: string;
  copy: string;
  subCopy?: string;
  ctaText?: string;
  ctaHref?: string;
  startPercent: number; // 0 to 1
  endPercent: number;
  holdPercent?: number; // point where text holds
  frameRange: [number, number];
}

export const EZAZOZO_CONTENT = {
  restaurant: {
    name: 'EZAZOZO',
    tagline: 'Haute Braise & Lounge Gastronomique',
    city: 'Lomé',
    country: 'Togo',
    neighborhood: 'Quartier Agoé Assiyéyé',
    landmark: 'À proximité de la station Total Minamadou',
    addressDisplay: 'Agoé Assiyéyé, près de la station Total Minamadou, Lomé — Togo',
    phone: '+228 90 00 39 21',
    whatsappUrl: 'https://wa.me/22890003921',
    hours: 'Ouvert tous les jours jusqu’à 00h00',
    services: [
      { id: 'terrasse', label: 'Service à table', desc: 'Grande terrasse pavée couverte et salon climatisé' },
      { id: 'takeaway', label: 'À emporter', desc: 'Emballage soigné préservant la chaleur et le croustillant' },
      { id: 'delivery', label: 'Livraison express', desc: 'Livraison fiable et soignée dans tout Lomé' },
      { id: 'parking', label: 'Parking gratuit & sécurisé', desc: 'Stationnement aisé et surveillé le long de la voie' },
      { id: 'pmr', label: 'Accès fauteuil roulant', desc: 'Terrasse de plain-pied et circulation accessible' }
    ]
  },

  flightStory: [
    {
      scene: '01 — Arrivée',
      visualStory: 'Crépuscule, hauteur des yeux dans la rue devant EZAZOZO. Arc devant le grill au bois de palétuvier fumant avec des poissons entiers à l’entrée, alignement avec l’entrée ouverte de la terrasse couverte pavée, glissade à l’intérieur.',
      copyH1: 'Ici, le poisson se braise au feu de bois.',
      subCopy: 'EZAZOZO, Haute Braise & Lounge Gastronomique, Agoé Assiyéyé, Lomé.',
      cta: 'Réserver une table',
      ctaHref: '#reserver'
    },
    {
      scene: '02 — Terrasse & braise',
      visualStory: 'Ralentissement, virage le long de la braise où le maître-grilleur retourne les poissons sur les braises incandescentes, regard vers les tables de la terrasse, courbe en S entre les convives vers l’arche du salon.',
      copyH1: 'Le feu fait tout.',
      subCopy: 'Bar de ligne, vivaneau rouge, capitaine, carpe marinés aux épices du terroir, accompagnés d’alloco, attiéké ou frites de manioc.',
      cta: 'Commander',
      ctaHref: '#commander'
    },
    {
      scene: 'Transition — Porte du salon',
      visualStory: 'Un serveur tient la porte du salon ouverte et la caméra file droit à travers.',
      copyH1: '',
      subCopy: '',
      cta: '',
      ctaHref: ''
    },
    {
      scene: '03 — Salon & cave',
      visualStory: 'Balayage fluide le long du bar et de la cave à vin, cadrage des tentures géométriques d’art textile ouest-africain, aperçu exclusif du salon VIP de 8 places.',
      copyH1: 'Un lounge pour prendre son temps.',
      subCopy: 'Vins fins, bières togolaises glacées, cocktails signatures et douceurs maison.',
      cta: 'Réserver l’espace VIP',
      ctaHref: '#reserver'
    },
    {
      scene: 'Transition — Sortie et demi-tour',
      visualStory: 'Sortie par l’ouverture arrière vers la cour et les palmiers sous la brise nocturne, maintien du mouvement puis lacet à 180° face au bâtiment.',
      copyH1: '',
      subCopy: '',
      cta: '',
      ctaHref: ''
    },
    {
      scene: '04 — Révélation',
      visualStory: 'Recul en montée ascensionnelle découvrant l’ensemble du restaurant connecté à sa rue, le parking gratuit et sécurisé, les toitures basses environnantes, les palmiers et l’artère éclairée près de la station.',
      copyH1: 'Ouvert tous les jours jusqu’à minuit.',
      subCopy: 'Près de la station Total Minamadou, parking gratuit et sécurisé, accès fauteuil roulant.',
      cta: 'Réserver sur WhatsApp',
      ctaHref: 'https://wa.me/22890003921?text=Bonjour%20EZAZOZO,%20je%20souhaite%20r%C3%A9server%20une%20table'
    }
  ],

  menu: {
    fish: [
      {
        id: 'bar',
        name: 'Bar de ligne braisé au bois de palétuvier',
        category: 'fish',
        description: 'Chair noble et fondante, peau croustillante caramélisée, assaisonnée de notre marinade ancestrale secrète et coiffée de relish tomate-oignon pilée.',
        priceNote: 'prix à confirmer',
        image: '/images/braise.webp',
        badge: 'Prise du jour'
      },
      {
        id: 'vivaneau',
        name: 'Vivaneau rouge braisé à la flamme vive',
        category: 'fish',
        description: 'Écailles dorées au feu intense, arômes fumés profonds, chair savoureuse parfumée aux aromates locaux et piment doux.',
        priceNote: 'prix à confirmer',
        image: '/images/plat.webp',
        badge: 'Signature braise'
      },
      {
        id: 'capitaine',
        name: 'Capitaine frais façon braiseuse d’Agoé',
        category: 'fish',
        description: 'Gros calibre saisi sur grille épaisse, cœur tendre et juteux, servi bien chaud avec son jus de braisage corsé.',
        priceNote: 'prix à confirmer',
        image: '/images/braise.webp',
        badge: 'Favori des habitués'
      },
      {
        id: 'carpe',
        name: 'Carpe d’eau douce marinée & grillée',
        category: 'fish',
        description: 'Marinade généreuse aux épices du Togo, ail écrasé et gingembre sauvage, grillée à cœur sur charbon dense.',
        priceNote: 'prix à confirmer',
        image: '/images/plat.webp',
        badge: 'Authentique'
      }
    ] as MenuItem[],
    sides: [
      {
        id: 'alloco',
        name: 'Alloco moelleux doré',
        category: 'sides',
        description: 'Bananes plantains mûres frites à point, dorées et fondantes.',
        priceNote: 'prix à confirmer'
      },
      {
        id: 'frites-manioc',
        name: 'Frites de manioc croustillantes maison',
        category: 'sides',
        description: 'Bâtonnets de manioc frais précuits et saisis à haute température, cœur moelleux.',
        priceNote: 'prix à confirmer'
      },
      {
        id: 'attieke',
        name: 'Attiéké frais de qualité supérieure',
        category: 'sides',
        description: 'Semoule de manioc cuite à la vapeur, légère, acidulée et aérée.',
        priceNote: 'prix à confirmer'
      },
      {
        id: 'frites-pommes',
        name: 'Frites de pommes de terre croustillantes',
        category: 'sides',
        description: 'Taillées fraîches, double friture pour un croustillant impeccable.',
        priceNote: 'prix à confirmer',
        image: '/images/plat.webp',
        imageAlt: 'Poisson braisé garni de relish et de frites, servi en barquette'
      }
    ] as MenuItem[],
    drinks: [
      {
        id: 'biere-locale',
        name: 'Bières togolaises glacées (Awooyo, Beaufort, Castel)',
        category: 'drinks',
        description: 'Servies à température ultra-fraîche, parfaites pour accompagner le piquant de la braise.',
        priceNote: 'prix à confirmer',
        image: '/images/terrasse-bouteilles.webp',
        imageAlt: 'Bouteilles posées sur les tables de la terrasse couverte'
      },
      {
        id: 'vin-cave',
        name: 'Sélection de la Cave à Vin',
        category: 'drinks',
        description: 'Vins rouges charpentés, blancs minéraux et rosés frais conservés en cave régulée.',
        priceNote: 'prix à confirmer',
        image: '/images/table-vin.webp',
        imageAlt: 'Bouteille de vin sur une table en bois de la terrasse'
      },
      {
        id: 'cocktails-lounge',
        name: 'Cocktails Signatures EZAZOZO',
        category: 'drinks',
        description: 'Créations maison aux agrumes frais, gingembre pilé et spiritueux fins.',
        priceNote: 'prix à confirmer'
      }
    ] as MenuItem[],
    desserts: [
      {
        id: 'dessert-maison',
        name: 'Douceurs raffinées maison',
        category: 'desserts',
        description: 'Sélection sucrée du jour préparée avec soin pour clore la dégustation.',
        priceNote: 'prix à confirmer'
      }
    ] as MenuItem[]
  },

  spaces: [
    {
      id: 'vip',
      name: 'Espace VIP Privatif',
      capacity: 'Plafonné strictement à 8 places assises',
      description: 'Un écrin confidentiel et feutré réservé aux dîners d’affaires, célébrations intimes et hôtes recherchant la plus haute discrétion.',
      atmosphere: 'Lumières tamisées pourpres, mobilier grand confort, service dédié exclusif.',
      image: '/images/interieur.webp',
      features: ['Table d’honneur 8 chaises', 'Salon climatisé indépendant', 'Service sommelier & braise dédié', 'Réservation préalable obligatoire']
    },
    {
      id: 'standard',
      name: 'Espace Standard : Terrasse Pavée & Salon',
      capacity: 'Grande capacité conviviale',
      description: 'L’âme vibrante d’EZAZOZO. La vaste terrasse couverte aux pavés autobloquants sous la brise nocturne, bordée de plantes tropicales et jouxtant le grill.',
      atmosphere: 'Ambiance chaleureuse, ampoules incandescentes, tentures d’art textile ouest-africain au salon.',
      image: '/images/terrasse-nuit.webp',
      features: ['Terrasse de plain-pied couverte', 'Proximité du grill ouvert', 'Salon d’art textile', 'Accès PMR direct']
    }
  ]
};
