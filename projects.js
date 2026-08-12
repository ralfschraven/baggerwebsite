const projectFeedRoot = document.querySelector("[data-project-feed]");
const projectFeaturedRoot = document.querySelector("[data-project-featured]");
const projectGridRoot = document.querySelector("[data-project-grid]");
const projectBoardRoot = document.querySelector("[data-project-board]");
const projectDetailRoot = document.querySelector("[data-project-detail]");
const projectAdminRoot = document.querySelector("[data-project-admin]");
const homeProjectsRoot = document.querySelector("[data-home-projects]");
const adminForm = document.querySelector("[data-admin-form]");
const adminList = document.querySelector("[data-admin-list]");
const adminStatus = document.querySelector("[data-admin-status]");
const adminResetButton = document.querySelector("[data-admin-reset]");
const adminDashboard = document.querySelector("[data-admin-dashboard]");
const adminDashboardOpenButtons = document.querySelectorAll("[data-admin-dashboard-open]");
const builderSidebarToggle = document.querySelector("[data-builder-sidebar-toggle]");
const builderSidebarRestore = document.querySelector("[data-builder-sidebar-restore]");
const builderFullscreenToggle = document.querySelector("[data-builder-fullscreen-toggle]");
const builderFullscreenExit = document.querySelector("[data-builder-fullscreen-exit]");
const builderEditorRegions = document.querySelectorAll("[data-builder-editor]");
const blockBuilder = document.querySelector("[data-block-builder]");
const blockList = document.querySelector("[data-block-list]");
const blockAddSelect = document.querySelector("[data-block-add]");
const blockPalette = document.querySelector("[data-block-palette]");
const blockInspector = document.querySelector("[data-block-inspector]");
const builderPreview = document.querySelector("[data-builder-preview]");
const projectSwitch = document.querySelector("[data-project-switch]");
let adminBlocks = [];
let draggedBlockId = "";
let draggedBlockType = "";
let activeBlockId = "";
let adminProjectsCache = [];
let renderingPreviewBlock = null;
let activePreviewTextBlockId = "";
let activePreviewTextKey = "";

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function slugifyProject(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat(window.siteLanguage === "en" ? "en-GB" : "nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function normalizeAssetUrl(value) {
  const raw = String(value || "").trim();

  if (!raw) {
    return "";
  }

  if (/^(https?:)?\/\//i.test(raw) || raw.startsWith("/") || raw.startsWith("data:")) {
    return raw;
  }

  return `/${raw.replace(/^\.?\//, "")}`;
}

function projectDetailUrl(slug) {
  return `/project-detail?slug=${encodeURIComponent(slug || "")}`;
}

function coverMarkup(project, className) {
  const image = normalizeAssetUrl(project.coverImage);

  if (image) {
    return `<div class="${className}"><img src="${escapeHtml(image)}" alt="${escapeHtml(project.title)}" /></div>`;
  }

  return `<div class="${className}"></div>`;
}

function projectMeta(project, dark = false) {
  return `
    <div class="${dark ? "detail-meta" : "blog-meta"}">
      <span class="pill ${dark ? "pill--dark" : ""}">${escapeHtml(projectCategoryLabel(project))}</span>
      <span class="pill ${dark ? "pill--dark" : ""}">${escapeHtml(project.status)}</span>
      <span class="pill ${dark ? "pill--dark" : ""}">${escapeHtml(project.location)}</span>
      <span class="pill ${dark ? "pill--dark" : ""}">${escapeHtml(formatDate(project.date))}</span>
    </div>
  `;
}

const projectBoardSections = [
  {
    key: "samenwerkingen",
    label: "Samenwerkingen",
    match: ["samenwerking", "partner", "consortium", "provincie", "gemeente", "tbi", "deltares", "tu delft"],
    placeholders: [
      { title: "Beton uit Bagger / TBI", mark: "TBI", slug: "beton-uit-bagger-tbi" },
      { title: "DC Bricks", mark: "DC", slug: "bakstenen-uit-bagger-dc-bricks" },
      { title: "Circulaire Bagger Consortium", mark: "CBC", slug: "circulaire-bagger-consortium" },
    ],
  },
  {
    key: "praktijktesten",
    label: "Praktijktesten",
    match: ["pilot", "praktijk", "test", "case", "locatie", "dry run", "uitvoering", "amsterdam"],
    placeholders: [
      { title: "Amsterdam / Centraal Station", mark: "AMS", slug: "amsterdam-centraal-station" },
      { title: "Provincie Zuid-Holland", mark: "PZH", slug: "provincie-zuid-holland" },
      { title: "Amsterdam / IJburg", mark: "IJ", slug: "amsterdam-ijburg" },
    ],
  },
  {
    key: "rd",
    label: "R&D",
    match: ["r&d", "research", "onderzoek", "verkenning", "ontwikkeling", "extractie", "pfas", "3d", "print"],
    placeholders: [
      { title: "Zware Metalen extractie uit Bagger", mark: "ZM", slug: "zware-metalen-extractie-uit-bagger" },
      { title: "PFAS extractie uit Bagger", mark: "PFAS", slug: "pfas-extractie-uit-bagger" },
      { title: "3D-printen met Bagger", mark: "3D", slug: "3d-printen-met-bagger" },
    ],
  },
];

const defaultProjectCategory = "Praktijktesten";

const staticProjectPages = {
  "beton-uit-bagger-tbi": {
    crumb: "Beton uit Bagger / TBI",
    tag: "Samenwerking",
    titleLines: [
      'Beton uit <em>Bagger</em>',
      "in samenwerking met TBI",
    ],
    subtitle: "Van waterbodem naar betonmengsel",
    body: [
      "In samenwerking met TBI onderzoekt Blauwe Bagger of en hoe bagger direct kan worden ingezet als grondstof voor betonproductie. TBI is een van de grootste bouw- en techniekbedrijven van Nederland en heeft de ambitie om haar bouwprocessen significant te verduurzamen.",
      "Dit project richt zich op de toepassing van BlueSand en BlueFiller - twee secundaire grondstoffen die Blauwe Bagger wint uit gebaggerd sediment - als vervangers voor primaire zand- en vulfracties in betonmengsels.",
    ],
    stats: [
      { number: "BlueSand", label: "Zandfractie uit bagger" },
      { number: "BlueFiller", label: "Kleifractie als vulmiddel" },
      { number: "CO2 &darr;", label: "Lagere voetafdruk per m3 beton" },
    ],
    stepsTitle: "Aanpak",
    steps: [
      {
        title: "Waterbodemonderzoek & datafase",
        desc: "Blauwe Bagger analyseert de waterbodemonderzoeken van de baggerlocaties van TBI. Op basis van korrelgrootte, verontreiniging en organisch gehalte wordt bepaald welke fracties geschikt zijn voor hoogwaardig hergebruik.",
      },
      {
        title: "Scheiding op locatie met de BlueBox",
        desc: "De mobiele BlueBox van Blauwe Bagger wordt ingezet op de baggerlocatie. De installatie ontwatert en scheidt de bagger ter plekke in bruikbare fracties.",
      },
      {
        title: "Labotesten & betonproeven",
        desc: "De gewonnen fracties worden getest op mechanische eigenschappen en vergeleken met primaire grondstoffen. TBI integreert de materialen vervolgens in proefmengsels en kleinschalige bouwapplicaties.",
      },
      {
        title: "Opschaling naar bouwprojecten",
        desc: "Bij positieve resultaten wordt de samenwerking opgeschaald naar concrete TBI-bouwprojecten, waar de secundaire grondstoffen standaard worden ingezet naast of ter vervanging van primaire materialen.",
      },
    ],
    highlightsTitle: "Wat levert dit op?",
    highlights: [
      ["Minder primaire winning", "Zand en vulmiddelen hoeven niet langer uit de grond gewonnen te worden"],
      ["Lagere stortkosten", "Bagger wordt nuttig ingezet in plaats van afgevoerd naar een depot"],
      ["Circulair bouwverhaal", "TBI kan aantoonbaar duurzamer bouwen en scoort sterker bij aanbestedingen"],
      ["Lokale keten", "Grondstoffen gewonnen uit Nederlandse wateren, geen lange aanvoerketens"],
    ],
    cta: "Interesse in samenwerking? Neem contact op om te bekijken hoe Blauwe Bagger jouw baggerproject kan omzetten in waardevolle grondstoffen voor de bouwsector.",
  },
  "bakstenen-uit-bagger-dc-bricks": {
    crumb: "Bakstenen uit Bagger / DC-bricks",
    tag: "Samenwerking",
    titleLines: [
      'Bakstenen uit <em>Bagger</em>',
      "in samenwerking met DC-bricks",
    ],
    subtitle: "Duurzame bouwmaterialen uit waterbodem",
    body: [
      "DC-bricks ontwikkelt duurzame, circulaire bouwmaterialen met een minimale CO2-voetafdruk. In samenwerking met Blauwe Bagger onderzoeken zij of kleifracties gewonnen uit bagger kunnen worden ingezet als grondstof voor de productie van bakstenen en andere keramische bouwmaterialen.",
      "De kleifractie - ook wel BlueFiller of BlueCalc - die Blauwe Bagger wint via de BlueBox heeft eigenschappen die kansrijk zijn voor de keramische industrie. Dit project brengt die kansen in kaart.",
    ],
    stats: [
      { number: "Klei", label: "Primaire grondstof voor keramiek" },
      { number: "BlueCalc", label: "Gecalcineerde kleifractie" },
      { number: "8%", label: "CO2-reductie potentieel bouwsector" },
    ],
    stepsTitle: "Aanpak",
    steps: [
      {
        title: "Karakterisatie van kleifracties",
        desc: "Niet alle klei is gelijk. Blauwe Bagger analyseert de samenstelling van de gewonnen kleifracties op mineralogische eigenschappen, plasticiteitsgrenzen en verontreinigingsgehalte.",
      },
      {
        title: "Calcinering en nabewerking",
        desc: "De kansrijke kleifracties worden gecalcineerd - verhit tot hoge temperatuur - waarna de puzzolane eigenschappen worden geactiveerd. DC-bricks test de gebakken producten op sterkte en duurzaamheid.",
      },
      {
        title: "Productintegratie",
        desc: "Succesvolle fracties worden geintegreerd in het DC-bricks productieproces en getest als vervangers voor primaire klei in de productie van duurzame bakstenen en gevelelementen.",
      },
    ],
    highlightsTitle: "Wat levert dit op?",
    highlights: [
      ["Nieuwe afzetmarkt", "Kleifracties vinden een hoogwaardige toepassing in de keramische industrie"],
      ["Minder primaire kleiwinning", "Vermindert de druk op eindige kleivoorraden in Nederland"],
      ["Circulaire baksteen", "Een aantoonbaar duurzaam bouwproduct dat de markt kan veranderen"],
    ],
    cta: "Meer weten? Neem contact op met Blauwe Bagger om te ontdekken of jouw baggerstroom kansrijke kleifracties bevat voor de keramische industrie.",
  },
  "circulaire-bagger-consortium": {
    crumb: "Circulaire Bagger Consortium",
    tag: "Samenwerking",
    titleLines: ['<em>Circulaire</em> Bagger Consortium'],
    subtitle: "Sectorbreed samenwerken aan de circulaire baggerketen",
    body: [
      "Het Circulaire Bagger Consortium brengt partijen uit de baggersector, bouwsector, kennisinstellingen en overheden samen om gezamenlijk te werken aan de grootschalige verduurzaming van baggerstromen in Nederland.",
      "Blauwe Bagger neemt deel als technologiepartner die de data-infrastructuur en scheidingstechnologie inbrengt. Het consortium heeft als doel om standaarden te ontwikkelen, pilots te financieren en regelgeving te agenderen die de circulaire baggerketen mogelijk maakt.",
    ],
    stats: [
      { number: "Multi", label: "Sectoroverstijgende samenwerking" },
      { number: "Standaard", label: "Ontwikkeling van sectornormen" },
      { number: "NL-breed", label: "Schaal van de ambitie" },
    ],
    stepsTitle: "Rol van Blauwe Bagger",
    steps: [
      {
        title: "Data & analyse",
        desc: "Blauwe Bagger levert de methodiek voor het ontsluiten en analyseren van waterbodemonderzoeken en maakt baggerstromen inzichtelijk voor alle consortiumpartners.",
      },
      {
        title: "Technologie-inbreng",
        desc: "De BlueBox-technologie wordt beschikbaar gesteld voor consortiumprojecten als bewezen scheidingsoplossing op locatie.",
      },
      {
        title: "Regelgevingsagenda",
        desc: "Blauwe Bagger werkt samen met beleidsmakers om de erkenning van secundaire grondstoffen uit bagger te versnellen en juridische barrieres te slechten.",
      },
    ],
    cta: "Wil jij deelnemen aan het consortium? We zijn altijd op zoek naar nieuwe partners uit de bagger-, bouw- en grondstofsector.",
  },
  "amsterdam-centraal-station": {
    crumb: "Amsterdam / Centraal Station",
    tag: "Praktijktest",
    titleLines: ['Amsterdam <em>Centraal Station</em>'],
    subtitle: "Grootschalige scheiding in een stedelijke omgeving",
    body: [
      "Rondom het Amsterdam Centraal Station wordt regelmatig gebaggerd om de vaarwegen rondom het station bevaarbaar te houden. Deze bagger - afkomstig uit drukke havengebieden - is complex van samenstelling en bevat een mix van organisch materiaal, zand en klei.",
      "Blauwe Bagger heeft in dit project de BlueBox ingezet om de bagger direct op locatie te ontwateren en te scheiden. Het doel: aantonen dat ook in stedelijke, complexe omgevingen hoogwaardige fracties gewonnen kunnen worden.",
    ],
    stats: [
      { number: "Stedelijk", label: "Complex baggermilieu" },
      { number: "&gt;50%", label: "Reductie transportvolume" },
      { number: "Pilot", label: "Eerste grootschalige stedelijke test" },
    ],
    stepsTitle: "Uitdagingen & bevindingen",
    steps: [
      {
        title: "Complexe baggersamenstelling",
        desc: "Stedelijke bagger bevat meer verontreinigingen en organisch materiaal dan bagger uit open vaarwegen. De data-analyse vooraf maakte het mogelijk om realistische verwachtingen te stellen over de opbrengst per fractie.",
      },
      {
        title: "Ruimtelijke beperkingen",
        desc: "De BlueBox werd ingezet op een beperkte werkplaats naast het station. De compactheid van de installatie bleek een doorslaggevend voordeel voor stedelijke inzetbaarheid.",
      },
      {
        title: "Resultaten",
        desc: "Een significante hoeveelheid zandfractie kon worden gewonnen en is na nabewerking geleverd als BlueSand. De stortkosten voor de opdrachtgever werden aanzienlijk verlaagd.",
      },
    ],
    cta: "Heeft u een vergelijkbaar project? Wij voeren graag een vrijblijvende analyse uit van uw waterbodemonderzoek.",
  },
  "provincie-zuid-holland": {
    crumb: "Provincie Zuid-Holland",
    tag: "Praktijktest",
    titleLines: ['Provincie <em>Zuid-Holland</em>'],
    subtitle: "Data-gedreven baggerbeheer op provinciale schaal",
    body: [
      "Zuid-Holland beheert honderden kilometers aan watergangen en vaarten. De provincie heeft de ambitie om haar baggerbeheer te verduurzamen en tegelijk de kosten te verlagen. In samenwerking met Blauwe Bagger is een pilot gestart om te onderzoeken hoe de provincie haar baggerstromen structureel anders kan organiseren.",
      "Dit project richt zich niet alleen op het winnen van grondstoffen, maar ook op het opbouwen van een provinciaal databeheer voor waterbodemonderzoeken - zodat op jaarbasis kan worden bepaald welke baggerlocaties het meest kansrijk zijn voor hergebruik.",
    ],
    stats: [
      { number: "Provinciaal", label: "Schaal van het project" },
      { number: "Data", label: "Centraal databeheer waterbodem" },
      { number: "Structureel", label: "Langjarige samenwerking" },
    ],
    stepsTitle: "Aanpak",
    steps: [
      {
        title: "Inventarisatie bestaande onderzoeken",
        desc: "Alle beschikbare waterbodemonderzoeken van de provincie zijn geinventariseerd en geanalyseerd. Blauwe Bagger heeft een ruimtelijk overzicht gemaakt van kansrijke baggerlocaties.",
      },
      {
        title: "Pilotlocaties selecteren",
        desc: "Op basis van de data zijn drie locaties geselecteerd voor een praktijktest met de BlueBox. Criteria: hoeveelheid bagger, toegankelijkheid en verwachte kwaliteit van de zandfractie.",
      },
      {
        title: "Structureel baggerbeheerplan",
        desc: "Op basis van de pilotresultaten wordt een meerjarig baggerbeheerplan opgesteld dat circulair hergebruik als standaard integreert in de provinciale baggerplanning.",
      },
    ],
    cta: "Bent u een waterschap of gemeente? Blauwe Bagger helpt ook uw baggerbeheer data-gedreven en circulair te maken.",
  },
  "amsterdam-ijburg": {
    crumb: "Amsterdam / IJburg",
    tag: "Praktijktest",
    titleLines: ['Amsterdam <em>IJburg</em>'],
    subtitle: "Bagger als bouwgrondstof voor uitbreidingswijken",
    body: [
      "De uitbreiding van IJburg vraagt om grootschalige grondwerkzaamheden en baggeroperaties in het IJmeer. Gemeente Amsterdam en haar aannemers staan voor de vraag hoe de vrijkomende bagger zo duurzaam en kostenefficient mogelijk kan worden verwerkt.",
      "Blauwe Bagger heeft in dit project aangetoond dat een deel van de bagger - na scheiding op locatie - direct inzetbaar is als ophoogmateriaal en als grondstof voor de lokale bouwsector. Hiermee sluit de keten: de bagger van IJburg wordt de grondstof voor de gebouwen van IJburg.",
    ],
    stats: [
      { number: "Lokaal", label: "Gesloten keten op wijkniveau" },
      { number: "Ophoog", label: "Zand als ophoogmateriaal" },
      { number: "Bouw", label: "Grondstoffen voor nieuwbouw" },
    ],
    stepsTitle: "Bevindingen",
    steps: [
      {
        title: "Schone zandfractie gewonnen",
        desc: "Het IJmeerbagger bleek relatief schoon van samenstelling. Een groot deel van de zandfractie voldeed aan de normen voor toepassing als ophoogzand en bouwzand.",
      },
      {
        title: "Aanzienlijke kostenreductie",
        desc: "Door ter plekke te scheiden hoefde er minder volume te worden getransporteerd naar een depot. De besparing op transport- en stortkosten was substantieel.",
      },
      {
        title: "Model voor stedelijke uitbreiding",
        desc: "IJburg toont aan dat circulaire baggerverwerking haalbaar is als vast onderdeel van de planvorming bij stedelijke uitbreidingsprojecten - mits vroegtijdig meegenomen in de aanbestedingsstrategie.",
      },
    ],
    cta: "Werkt u aan een gebiedsontwikkeling? Blauwe Bagger denkt graag mee over de baggerstrategie en het hergebruik van vrijkomende grondstoffen.",
  },
  "zware-metalen-extractie-uit-bagger": {
    crumb: "Zware Metalen extractie uit Bagger",
    tag: "R&D",
    titleLines: [
      'Zware Metalen <em>extractie</em>',
      "uit Bagger",
    ],
    subtitle: "Van verontreiniging naar waardevolle grondstof",
    body: [
      "Bagger bevat niet alleen zand en klei - in sommige watergebieden zijn er ook concentraties van zware metalen zoals koper, zink en nikkel aanwezig. Dit zijn doorgaans de fracties die bagger ongeschikt maken voor hergebruik en zorgen voor hoge verwerkingskosten.",
      "Blauwe Bagger onderzoekt in dit R&D-project of deze zware metalen selectief kunnen worden geextraheerd uit de bagger - zodat de resterende fracties schoner zijn en de metalen zelf als secundaire grondstof kunnen worden aangeboden aan de maakindustrie.",
    ],
    stats: [
      { number: "Cu, Zn", label: "Koper, zink & andere metalen" },
      { number: "R&D", label: "Fase: laboratorium & pilotschaal" },
      { number: "2 stromen", label: "Schone fractie + metalenconcentraat" },
    ],
    stepsTitle: "Onderzoeksvragen",
    steps: [
      {
        title: "Binding van metalen aan baggerfracties",
        desc: "Aan welke korrelgrootten en minerale fases zijn de zware metalen gebonden? Dit bepaalt welk scheidingsproces het meest effectief is.",
      },
      {
        title: "Extractiemethoden",
        desc: "Blauwe Bagger test zowel fysische scheiding (hydrocycloon, dichtheidsscheiding) als chemische extractiemethoden op laboratoriumschaal.",
      },
      {
        title: "Valorisatie van het metalenconcentraat",
        desc: "In overleg met metaalverwerkende industrieen wordt onderzocht welke kwaliteitseisen gelden voor het metalenconcentraat en of afname haalbaar is.",
      },
    ],
    cta: "Bent u actief in de metalensector of waterbodemonderzoek? We werken graag samen met kennispartners en potentiele afnemers van het metalenconcentraat.",
  },
  "pfas-extractie-uit-bagger": {
    crumb: "PFAS extractie uit Bagger",
    tag: "R&D",
    titleLines: [
      'PFAS <em>extractie</em>',
      "uit Bagger",
    ],
    subtitle: "Het eeuwige chemie probleem aanpakken aan de bron",
    body: [
      "PFAS - poly- en perfluoralkylstoffen - vormen een van de grootste uitdagingen voor de baggersector. Door de aanwezigheid van PFAS in waterbodem is een groeiend deel van de bagger in Nederland niet meer vrij toepasbaar, wat leidt tot sterk stijgende verwerkingskosten en capaciteitsproblemen bij depots.",
      "Blauwe Bagger onderzoekt of PFAS via gerichte scheidingstechnieken kan worden geconcentreerd in een kleine, beheersbare fractie - zodat het overgrote deel van de bagger vrijkomt voor hergebruik als grondstof.",
    ],
    stats: [
      { number: "PFAS", label: "Meest urgente baggerprobleem NL" },
      { number: "Scheiding", label: "Concentreren in kleine fractie" },
      { number: "Vrijval", label: "Schone fractie voor hergebruik" },
    ],
    stepsTitle: "Onderzoeksaanpak",
    steps: [
      {
        title: "PFAS-mapping in waterbodem",
        desc: "Op basis van waterbodemonderzoeken brengt Blauwe Bagger in kaart in welke fracties (fijn/grof, organisch/mineraal) PFAS-verbindingen zich het sterkst concentreren.",
      },
      {
        title: "Scheidingstechnieken",
        desc: "Verschillende fysische en oxidatieve scheidingsmethoden worden getest om PFAS te concentreren in een zo klein mogelijke fractie, zodat de rest van de bagger onder de norm blijft.",
      },
      {
        title: "Eindverwerking van de PFAS-fractie",
        desc: "In samenwerking met gespecialiseerde thermische verwerkingsbedrijven wordt onderzocht hoe de PFAS-concentraatfractie veilig en definitief verwerkt kan worden.",
      },
    ],
    cta: "Heeft u te maken met PFAS-problematiek in uw baggerproject? Neem contact op voor een vrijblijvend gesprek over de mogelijkheden.",
  },
  "3d-printen-met-bagger": {
    crumb: "3D-printen met Bagger",
    tag: "R&D",
    titleLines: ['3D-printen met <em>Bagger</em>'],
    subtitle: "In samenwerking met Urban Reef",
    body: [
      "In samenwerking met Urban Reef - een pionier in bioreceptieve architectuur en 3D-print technologie - onderzoekt Blauwe Bagger of baggermateriaal kan worden ingezet als printmedium voor grootschalige 3D-geprinte constructies.",
      "Urban Reef ontwerpt complexe, organische structuren die worden geprint uit betonachtige mengsels. Bagger - mits van de juiste samenstelling en zuiverheid - zou een duurzame vervanging kunnen zijn voor de primaire grondstoffen die nu in hun printmengsels worden gebruikt.",
    ],
    stats: [
      { number: "3D-print", label: "Nieuwe toepassing voor bagger" },
      { number: "Bioreceptief", label: "Structuren voor natuur & architectuur" },
      { number: "Urban Reef", label: "Technologiepartner" },
    ],
    stepsTitle: "Wat wordt onderzocht?",
    steps: [
      {
        title: "Printbaarheid van baggermengsels",
        desc: "Welke korrelgrootteverdeling en consistentie heeft een baggermengsel nodig om printvriendelijk te zijn? Blauwe Bagger en Urban Reef testen verschillende recepturen op vloeibaarheid, stijfheid en hechting.",
      },
      {
        title: "Mechanische eigenschappen",
        desc: "Geprinte testtegels en structuurelementen worden getest op druksterkte, wateropname en duurzaamheid. Dit bepaalt of het materiaal geschikt is voor constructieve of decoratieve toepassingen.",
      },
      {
        title: "Bioreceptiviteit",
        desc: "Een van de unieke eigenschappen van Urban Reef's structuren is dat ze microhabitats vormen voor flora en fauna. Bagger bevat organische stoffen die deze bioreceptiviteit kunnen versterken.",
      },
    ],
    cta: "Bent u actief in 3D-print technologie, architectuur of materiaalontwikkeling? Blauwe Bagger staat open voor nieuwe R&D-samenwerkingen op het snijvlak van bagger en innovatieve bouwmaterialen.",
  },
};

// The built-in showcase projects are content, rather than UI labels. Keep an
// English version alongside the Dutch source so the language switch also
// works on these detail pages (CMS-authored projects remain editable content).
const staticProjectTranslations = {
  "beton-uit-bagger-tbi": {
    crumb: "Concrete from sediment / TBI",
    tag: "Collaboration",
    titleLines: ['Concrete from <em>sediment</em>', "in collaboration with TBI"],
    subtitle: "From waterbed to concrete mix",
    body: [
      "Together with TBI, Blauwe Bagger is investigating whether dredged sediment can be used directly as circular material for concrete. TBI is one of the Netherlands' largest construction and engineering companies and is committed to making its building processes significantly more sustainable.",
      "This project focuses on BlueSand and BlueFiller, two secondary circular materials recovered from dredged sediment, as replacements for primary sand and filler fractions in concrete mixes.",
    ],
    stats: [
      { number: "BlueSand", label: "Sand fraction from sediment" },
      { number: "BlueFiller", label: "Clay fraction as filler" },
      { number: "CO2 &darr;", label: "Lower footprint per m3 of concrete" },
    ],
    stepsTitle: "Approach",
    steps: [
      { title: "Waterbed survey and data phase", desc: "Blauwe Bagger analyses TBI's waterbed surveys. Grain size, contamination and organic content determine which fractions are suitable for high-value reuse." },
      { title: "On-site separation with the BlueBox", desc: "The mobile BlueBox is deployed at the dredging location to dewater and separate the sediment into usable fractions on site." },
      { title: "Lab tests and concrete trials", desc: "The recovered fractions are tested for mechanical properties and compared with primary materials. TBI then integrates them into trial mixes and small-scale applications." },
      { title: "Scaling to construction projects", desc: "When results are positive, the collaboration scales to concrete TBI projects where secondary materials can replace primary materials." },
    ],
    highlightsTitle: "What does this deliver?",
    highlights: [
      ["Less primary extraction", "Sand and fillers no longer need to be extracted from the ground"],
      ["Lower disposal costs", "Sediment is put to use instead of being sent to a depot"],
      ["Circular construction story", "TBI can build more sustainably and strengthen its tender position"],
      ["Local chain", "Materials recovered from Dutch waters, without long supply chains"],
    ],
    cta: "Interested in collaborating? Get in touch to explore how Blauwe Bagger can turn your dredging project into valuable circular materials for construction.",
  },
  "bakstenen-uit-bagger-dc-bricks": {
    crumb: "Bricks from sediment / DC-bricks",
    tag: "Collaboration",
    titleLines: ['Bricks from <em>sediment</em>', "in collaboration with DC-bricks"],
    subtitle: "Sustainable building materials from the waterbed",
    body: [
      "DC-bricks develops sustainable, circular building materials with a minimal CO2 footprint. Together with Blauwe Bagger, they are investigating whether clay fractions recovered from sediment can be used to produce bricks and other ceramic building materials.",
      "The clay fraction, also known as BlueFiller or BlueCalc, has promising properties for the ceramic industry. This project maps those opportunities.",
    ],
    stats: [
      { number: "Clay", label: "Primary circular material for ceramics" },
      { number: "BlueCalc", label: "Calcined clay fraction" },
      { number: "8%", label: "Potential reduction in construction emissions" },
    ],
    stepsTitle: "Approach",
    steps: [
      { title: "Characterising clay fractions", desc: "Blauwe Bagger analyses mineralogical properties, plasticity limits and contamination levels in the recovered clay fractions." },
      { title: "Calcination and post-processing", desc: "Promising fractions are calcined, activating their pozzolanic properties. DC-bricks tests the fired products for strength and durability." },
      { title: "Product integration", desc: "Successful fractions are integrated into the DC-bricks process and tested as replacements for primary clay in sustainable bricks and façade elements." },
    ],
    highlightsTitle: "What does this deliver?",
    highlights: [
      ["New outlet", "Clay fractions find a high-value application in ceramics"],
      ["Less primary clay extraction", "Reducing pressure on finite Dutch clay reserves"],
      ["Circular brick", "A demonstrably sustainable building product that can change the market"],
    ],
    cta: "Want to know more? Contact Blauwe Bagger to discover whether your sediment stream contains promising clay fractions for ceramics.",
  },
  "circulaire-bagger-consortium": {
    crumb: "Circular Dredging Consortium",
    tag: "Collaboration",
    titleLines: ['<em>Circular</em> Dredging Consortium'],
    subtitle: "Working across the sector on a circular dredging chain",
    body: [
      "The Circular Dredging Consortium brings together parties from the dredging and construction sectors, knowledge institutions and governments to make dredged material flows in the Netherlands more sustainable at scale.",
      "Blauwe Bagger participates as the technology partner, contributing data infrastructure and separation technology. The consortium develops standards, funds pilots and puts forward the regulations needed for a circular dredging chain.",
    ],
    stats: [
      { number: "Multi", label: "Cross-sector collaboration" },
      { number: "Standard", label: "Developing sector standards" },
      { number: "NL-wide", label: "Ambition at national scale" },
    ],
    stepsTitle: "Blauwe Bagger's role",
    steps: [
      { title: "Data and analysis", desc: "Blauwe Bagger provides the method for unlocking and analysing waterbed surveys and makes sediment flows transparent for all consortium partners." },
      { title: "Technology contribution", desc: "BlueBox technology is made available to consortium projects as a proven on-site separation solution." },
      { title: "Regulatory agenda", desc: "Blauwe Bagger works with policymakers to accelerate recognition of secondary materials from sediment and remove legal barriers." },
    ],
    cta: "Would you like to join the consortium? We are always looking for new partners from the dredging, construction and raw-material sectors.",
  },
  "amsterdam-centraal-station": {
    crumb: "Amsterdam / Central Station",
    tag: "Practical test",
    titleLines: ['Amsterdam <em>Central Station</em>'],
    subtitle: "Large-scale separation in an urban environment",
    body: [
      "The waterways around Amsterdam Central Station are dredged regularly to keep them navigable. This sediment comes from busy harbour areas, has a complex composition and contains a mix of organic matter, sand and clay.",
      "Blauwe Bagger deployed the BlueBox here to dewater and separate the sediment directly on site. The goal was to show that high-value fractions can also be recovered in complex urban environments.",
    ],
    stats: [
      { number: "Urban", label: "Complex dredging environment" },
      { number: ">50%", label: "Reduction in transport volume" },
      { number: "Pilot", label: "First large-scale urban test" },
    ],
    stepsTitle: "Challenges and findings",
    steps: [
      { title: "Complex sediment composition", desc: "Urban sediment contains more contamination and organic matter than sediment from open waterways. Up-front data analysis made realistic yield expectations possible." },
      { title: "Space constraints", desc: "The BlueBox operated in a limited work area beside the station. Its compact footprint proved decisive for urban deployment." },
      { title: "Results", desc: "A significant sand fraction was recovered and supplied as BlueSand after post-processing. The client's disposal costs were reduced considerably." },
    ],
    cta: "Have a similar project? We would be happy to carry out a no-obligation analysis of your waterbed survey.",
  },
  "provincie-zuid-holland": {
    crumb: "Province of Zuid-Holland",
    tag: "Practical test",
    titleLines: ['Province of <em>Zuid-Holland</em>'],
    subtitle: "Data-driven dredging management at provincial scale",
    body: [
      "Zuid-Holland manages hundreds of kilometres of waterways. The province wants to make dredging management more sustainable while reducing costs. Together with Blauwe Bagger, it started a pilot to explore how its sediment flows can be organised differently over the long term.",
      "The project is not only about recovering circular materials, but also about building a provincial data system for waterbed surveys, so the most promising reuse locations can be identified each year.",
    ],
    stats: [
      { number: "Provincial", label: "Project scale" },
      { number: "Data", label: "Central waterbed data management" },
      { number: "Structural", label: "Long-term collaboration" },
    ],
    stepsTitle: "Approach",
    steps: [
      { title: "Inventory of existing surveys", desc: "All available provincial waterbed surveys were inventoried and analysed. Blauwe Bagger created a spatial overview of promising dredging locations." },
      { title: "Selecting pilot locations", desc: "Three locations were selected for a BlueBox practical test based on volume, accessibility and expected sand quality." },
      { title: "Structural dredging plan", desc: "The pilot results inform a multi-year management plan that makes circular reuse a standard part of provincial planning." },
    ],
    cta: "Are you a water authority or municipality? Blauwe Bagger can make your dredging management data-driven and circular too.",
  },
  "amsterdam-ijburg": {
    crumb: "Amsterdam / IJburg",
    tag: "Practical test",
    titleLines: ['Amsterdam <em>IJburg</em>'],
    subtitle: "Sediment as circular construction material for new districts",
    body: [
      "The expansion of IJburg requires large-scale earthworks and dredging in the IJmeer. The City of Amsterdam and its contractors need to process the released sediment as sustainably and cost-effectively as possible.",
      "This project showed that part of the sediment can be used directly as fill material and as circular material for local construction after on-site separation. The chain closes: IJburg's sediment becomes circular material for IJburg's buildings.",
    ],
    stats: [
      { number: "Local", label: "Closed chain at district level" },
      { number: "Fill", label: "Sand used as fill material" },
      { number: "Build", label: "Circular materials for new construction" },
    ],
    stepsTitle: "Findings",
    steps: [
      { title: "Clean sand fraction recovered", desc: "The IJmeer sediment was relatively clean. A large part of the sand fraction met the standards for fill and construction sand." },
      { title: "Significant cost reduction", desc: "On-site separation reduced the volume transported to a depot, creating substantial savings on transport and disposal." },
      { title: "Model for urban expansion", desc: "IJburg shows that circular sediment processing can be a fixed part of urban expansion planning when included early in the tender strategy." },
    ],
    cta: "Working on area development? Blauwe Bagger is happy to help shape the sediment strategy and reuse of released materials.",
  },
  "zware-metalen-extractie-uit-bagger": {
    crumb: "Heavy-metal extraction from sediment",
    tag: "R&D",
    titleLines: ['Heavy-metal <em>extraction</em>', "from sediment"],
    subtitle: "From contamination to valuable circular material",
    body: [
      "Sediment contains more than sand and clay. In some waterways it also contains concentrations of heavy metals such as copper, zinc and nickel. These fractions often make sediment unsuitable for reuse and lead to high processing costs.",
      "In this R&D project, Blauwe Bagger is investigating whether these metals can be extracted selectively, leaving cleaner fractions and making the metals themselves available as secondary circular materials for manufacturing.",
    ],
    stats: [
      { number: "Cu, Zn", label: "Copper, zinc and other metals" },
      { number: "R&D", label: "Laboratory and pilot phase" },
      { number: "2 streams", label: "Clean fraction plus metal concentrate" },
    ],
    stepsTitle: "Research questions",
    steps: [
      { title: "How metals bind to sediment fractions", desc: "Which grain sizes and mineral phases contain the heavy metals? This determines the most effective separation process." },
      { title: "Extraction methods", desc: "Blauwe Bagger is testing physical separation as well as chemical extraction methods at laboratory scale." },
      { title: "Valorising the metal concentrate", desc: "With metal-processing industries, we are mapping quality requirements and whether an outlet is feasible." },
    ],
    cta: "Active in metals or waterbed research? We would be glad to work with knowledge partners and potential buyers of the metal concentrate.",
  },
  "pfas-extractie-uit-bagger": {
    crumb: "PFAS extraction from sediment",
    tag: "R&D",
    titleLines: ['PFAS <em>extraction</em>', "from sediment"],
    subtitle: "Tackling the forever-chemicals problem at the source",
    body: [
      "PFAS, or per- and polyfluoroalkyl substances, are one of the dredging sector's greatest challenges. Their presence in waterbeds means a growing share of Dutch sediment cannot be freely applied, driving up processing costs and depot capacity pressure.",
      "Blauwe Bagger is investigating whether targeted separation can concentrate PFAS in a small, manageable fraction, releasing most of the sediment for reuse as circular material.",
    ],
    stats: [
      { number: "PFAS", label: "Most urgent sediment challenge in NL" },
      { number: "Separation", label: "Concentrated in a small fraction" },
      { number: "Release", label: "Clean fraction for reuse" },
    ],
    stepsTitle: "Research approach",
    steps: [
      { title: "PFAS mapping in waterbeds", desc: "Waterbed surveys show in which fine or coarse, organic or mineral fractions PFAS compounds concentrate most strongly." },
      { title: "Separation techniques", desc: "Physical and oxidative methods are tested to concentrate PFAS in the smallest possible fraction, keeping the remainder below the standard." },
      { title: "Final treatment of the PFAS fraction", desc: "With specialist thermal processors, we are investigating how the concentrate can be treated safely and permanently." },
    ],
    cta: "Dealing with PFAS in your dredging project? Contact us for an informal conversation about the options.",
  },
  "3d-printen-met-bagger": {
    crumb: "3D printing with sediment",
    tag: "R&D",
    titleLines: ['3D printing with <em>sediment</em>'],
    subtitle: "In collaboration with Urban Reef",
    body: [
      "Together with Urban Reef, a pioneer in bioreceptive architecture and 3D-printing technology, Blauwe Bagger is investigating whether sediment can serve as the print medium for large-scale 3D-printed structures.",
      "Urban Reef designs complex, organic structures printed from concrete-like mixes. Sediment, when it has the right composition and purity, could sustainably replace the primary materials currently used in those mixes.",
    ],
    stats: [
      { number: "3D print", label: "New application for sediment" },
      { number: "Bioreceptive", label: "Structures for nature and architecture" },
      { number: "Urban Reef", label: "Technology partner" },
    ],
    stepsTitle: "What is being researched?",
    steps: [
      { title: "Printability of sediment mixes", desc: "What grain distribution and consistency does a sediment mix need to be printable? Blauwe Bagger and Urban Reef test recipes for flow, stiffness and adhesion." },
      { title: "Mechanical properties", desc: "Printed test tiles and structural elements are tested for compressive strength, water absorption and durability." },
      { title: "Bioreceptivity", desc: "Urban Reef's structures form microhabitats for flora and fauna. Organic matter in sediment may strengthen this bioreceptivity." },
    ],
    cta: "Active in 3D printing, architecture or materials development? Blauwe Bagger is open to new R&D collaborations at the intersection of sediment and innovative building materials.",
  },
};

function localizeStaticProject(project) {
  if (window.siteLanguage !== "en" || !project) {
    return project;
  }

  const entry = Object.values(staticProjectPages).find((candidate) => candidate === project);
  const slug = entry ? Object.keys(staticProjectPages).find((key) => staticProjectPages[key] === entry) : "";
  return staticProjectTranslations[slug] ? { ...project, ...staticProjectTranslations[slug] } : project;
}

const cmsProjectTranslations = {
  "dry-run-2025-voorbereiding-op-circulaire-baggerprojecten": {
    title: "Dry Run 2025, preparing for circular dredging projects",
    excerpt: "A preparatory project phase in which mobile processing, logistics and the outlet for material streams were tested together.",
    body: [
      "This dry run tested how a mobile container unit fits into circular dredging projects. The focus was not only on technology, but also on how logistics, processing and application connect.",
      "By considering dewatering, separation and material routes early, the project approach becomes scalable. The pilot showed where the mobile unit adds speed and where outlets for separate streams must be included from the start.",
      "The result is not an endpoint but a project framework: the conditions required, the promising streams and the moments when scaling up makes sense.",
    ],
    highlights: [
      "Pilot used as a blueprint for scaling up",
      "Container unit central to the project logic",
      "Material routes mapped early",
    ],
  },
  "locatie-logistiek-en-materiaalstroom-in-een-aanpak": {
    title: "Location, logistics and material flow in one approach",
    excerpt: "A project exploration in which accessibility and on-site processing determined the setup from day one.",
    location: "Western Netherlands",
    status: "Completed",
    body: [
      "This exploration focused not only on the sediment stream, but also on how the location influences the technical approach. In hard-to-reach places, every extra transport movement counts twice.",
      "The project therefore used a compact setup: less back-and-forth, earlier separation and better insight into which streams are genuinely reusable. The mobile unit was treated as a link in the whole project story, not as a standalone machine.",
      "This way of working gave more control over planning and material value and formed the basis for the next execution phase.",
    ],
    highlights: [
      "Location choice directly linked to processing strategy",
      "Fewer logistical detours",
      "More control over usable outgoing streams",
    ],
  },
  "van-projectvraag-naar-toepassingsroute": {
    title: "From project question to application route",
    excerpt: "A project in which value came from linking material streams to possible end uses at an early stage.",
    location: "Central Netherlands",
    body: [
      "Some projects succeed or fail not because of technology, but because a material stream receives a credible next step in time. In this trajectory, that question was part of the project structure from the start.",
      "By determining early which fractions are promising and which quality requirements apply, the project gets a useful decision framework sooner. This prevents processed sediment from remaining in an interim status.",
      "The case shows that project success is not only about separation, but about linking separation to application.",
    ],
    highlights: [
      "Application route determined early",
      "Quality and outlet linked sooner",
      "Project structure guided by reuse",
    ],
  },
};

function localizePublicProject(project) {
  if (window.siteLanguage !== "en" || !project?.slug || !cmsProjectTranslations[project.slug]) {
    return project;
  }

  return { ...project, ...cmsProjectTranslations[project.slug] };
}

function plainStaticProjectText(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function staticProjectToEditableProject(slug, project) {
  const title = plainStaticProjectText((project.titleLines || []).join(" ")) || project.crumb || slug;
  const body = Array.isArray(project.body) ? project.body : [];
  const highlights = Array.isArray(project.highlights)
    ? project.highlights.map((item) => (Array.isArray(item) ? item[0] : item)).filter(Boolean)
    : [];

  return {
    id: `static_${slug}`,
    slug,
    title,
    excerpt: project.subtitle || body[0] || "",
    date: "2026-05-01",
    category: projectCategoryLabel(project.tag || defaultProjectCategory),
    location: "Nederland",
    status: "Actief",
    coverImage: projectCoverFallback({ category: project.tag, title }),
    featured: false,
    body,
    highlights,
    blocks: defaultProjectBlocks({
      title,
      excerpt: project.subtitle || body[0] || "",
      category: project.tag || defaultProjectCategory,
      coverImage: projectCoverFallback({ category: project.tag, title }),
      body,
      highlights,
    }),
  };
}

function staticEditableProject(slug) {
  const project = staticProjectPages[slug];
  return project ? staticProjectToEditableProject(slug, project) : null;
}

function projectBoardSectionFor(project) {
  const category = String(project.category || "").toLowerCase();

  if (/(samenwerking|partner|consortium)/.test(category)) {
    return "samenwerkingen";
  }

  if (/(r&d|onderzoek|research|verkenning|ontwikkeling)/.test(category)) {
    return "rd";
  }

  if (/(pilot|praktijk|test|case)/.test(category)) {
    return "praktijktesten";
  }

  const haystack = `${project.status || ""} ${project.location || ""} ${project.title || ""} ${
    project.excerpt || ""
  }`.toLowerCase();
  const match = projectBoardSections.find((section) => section.match.some((term) => haystack.includes(term)));

  return match?.key || "praktijktesten";
}

function projectCategoryLabel(project) {
  const sectionKey = projectBoardSectionFor(
    typeof project === "string" ? { category: project } : project || { category: defaultProjectCategory },
  );
  return projectBoardSections.find((section) => section.key === sectionKey)?.label || defaultProjectCategory;
}

function projectCoverFallback(project) {
  const key = projectBoardSectionFor(project);

  if (key === "samenwerkingen") {
    return "/assets/media/installatie.jpeg";
  }

  if (key === "rd") {
    return "/assets/media/bluebox-tablet.png";
  }

  return "/assets/media/truck.png";
}

function renderProjectBoardCard(project) {
  const image = normalizeAssetUrl(project.coverImage || projectCoverFallback(project));
  const category = projectCategoryLabel(project);

  return `
    <a class="project-board-card project-board-card--live reveal is-visible" href="${escapeAttribute(projectDetailUrl(project.slug))}">
      <div class="project-board-card__media" aria-hidden="true">
        <img src="${escapeHtml(image)}" alt="${escapeHtml(project.title)}" />
      </div>
      <div class="project-board-card__body">
        <div class="project-board-card__meta">
          <span>${escapeHtml(category)}</span>
        </div>
        <h3>${escapeHtml(project.title)}</h3>
        <span class="project-board-card__cta">
          <span>Bekijk project</span>
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h13m-5-5 5 5-5 5" /></svg>
        </span>
      </div>
    </a>
  `;
}

function renderProjectBoardPlaceholder(item, index) {
  const fallbackImages = [
    "/assets/media/installatie.jpeg",
    "/assets/media/bricks-background.jpg",
    "/assets/media/bluebox-tablet.png",
  ];
  const image = fallbackImages[index % fallbackImages.length];

  return `
    <a class="project-board-card project-board-card--placeholder reveal is-visible" href="${escapeAttribute(projectDetailUrl(item.slug))}" data-placeholder-index="${index + 1}">
      <div class="project-board-card__media project-board-card__media--placeholder" aria-hidden="true">
        <img src="${escapeHtml(image)}" alt="" />
        <span>${escapeHtml(item.mark)}</span>
      </div>
      <div class="project-board-card__body">
        <h3>${escapeHtml(item.title)}</h3>
        <span class="project-board-card__cta">
          <span>Lees meer</span>
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h13m-5-5 5 5-5 5" /></svg>
        </span>
      </div>
    </a>
  `;
}

function splitListLine(line) {
  const parts = String(line || "").split(/\s*[,|]\s*/);
  const first = parts.shift() || "";
  return [first.trim(), parts.join(", ").trim()];
}

function splitListParts(line, maxParts = 2) {
  const parts = String(line || "")
    .split(/\s*[,|]\s*/)
    .map((part) => part.trim());

  if (parts.length <= maxParts) {
    return parts;
  }

  return [...parts.slice(0, maxParts - 1), parts.slice(maxParts - 1).join(", ")];
}

function parseGalleryItems(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const commaIndex = line.indexOf(",");
      const image = (commaIndex === -1 ? line : line.slice(0, commaIndex)).trim();
      const caption = (commaIndex === -1 ? "" : line.slice(commaIndex + 1)).trim();
      return { image, caption };
    })
    .filter((item) => item.image);
}

function serializeGalleryItems(items) {
  return items
    .map((item) => {
      const image = String(item.image || "").trim();
      const caption = String(item.caption || "").trim();
      return caption ? `${image}, ${caption}` : image;
    })
    .filter(Boolean)
    .join("\n");
}

function normalizeClientParagraphs(input) {
  if (Array.isArray(input)) {
    return input.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(input || "")
    .split(/\n\s*\n/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function isBuilderEditor() {
  return Boolean(builderPreview);
}

function renderProjectBoard(projects = []) {
  if (!projectBoardRoot) {
    return false;
  }

  const cmsProjects = Array.isArray(projects)
    ? projects.filter((project) => project?.slug && project?.title).map(localizePublicProject)
    : [];
  const hasCmsProjects = cmsProjects.length > 0;

  projectBoardRoot.innerHTML = projectBoardSections
    .map((section) => {
      const sectionProjects = cmsProjects.filter((project) => projectBoardSectionFor(project) === section.key);
      const cards = hasCmsProjects
        ? sectionProjects.map(renderProjectBoardCard).join("")
        : section.placeholders.map(renderProjectBoardPlaceholder).join("");

      if (!cards) {
        return "";
      }

      return `
        <section class="project-board-row reveal is-visible" aria-labelledby="project-board-${section.key}">
          <h2 id="project-board-${section.key}" class="project-board-row__label">${section.label}</h2>
          <div class="project-board-carousel" data-project-carousel>
            <button
              class="project-board-arrow project-board-arrow--prev"
              type="button"
              aria-label="Vorige projecten in ${section.label}"
              data-project-carousel-prev
            >
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M15 6 9 12l6 6" /></svg>
            </button>
            <div class="project-board-row__grid" data-project-carousel-track>
              ${cards}
            </div>
            <button
              class="project-board-arrow project-board-arrow--next"
              type="button"
              aria-label="Volgende projecten in ${section.label}"
              data-project-carousel-next
            >
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m9 6 6 6-6 6" /></svg>
            </button>
          </div>
        </section>
      `;
    })
    .join("");

  if (!projectBoardRoot.innerHTML.trim()) {
    projectBoardRoot.innerHTML = window.siteLanguage === "en"
      ? `<div class="empty-state">No projects have been published yet. Use <a href="/projecten-beheer">the management tool</a> to add the first post.</div>`
      : `<div class="empty-state">Er zijn nog geen projecten gepubliceerd. Gebruik <a href="/projecten-beheer">de beheertool</a> om de eerste post toe te voegen.</div>`;
  }

  if (typeof window.translatePublicSubtree === "function") {
    window.translatePublicSubtree(projectBoardRoot);
  }

  window.requestAnimationFrame(updateProjectBoardCarousels);
  return true;
}

function updateProjectCarouselButtons(carousel) {
  const track = carousel?.querySelector("[data-project-carousel-track]");
  const prevButton = carousel?.querySelector("[data-project-carousel-prev]");
  const nextButton = carousel?.querySelector("[data-project-carousel-next]");

  if (!track || !prevButton || !nextButton) {
    return;
  }

  const canScroll = track.scrollWidth - track.clientWidth > 2;
  prevButton.disabled = !canScroll;
  nextButton.disabled = !canScroll;
  carousel.classList.toggle("has-overflow", canScroll);
}

function updateProjectBoardCarousels() {
  if (!projectBoardRoot) {
    return;
  }

  projectBoardRoot.querySelectorAll("[data-project-carousel]").forEach(updateProjectCarouselButtons);
}

function moveProjectCarousel(button) {
  const carousel = button.closest("[data-project-carousel]");
  const track = carousel?.querySelector("[data-project-carousel-track]");

  if (!track || button.disabled) {
    return;
  }

  const direction = button.matches("[data-project-carousel-next]") ? 1 : -1;
  const card = track.querySelector(".project-board-card");
  const trackStyles = window.getComputedStyle(track);
  const gap = Number.parseFloat(trackStyles.columnGap || trackStyles.gap || "0") || 0;
  const cardWidth = (card?.getBoundingClientRect().width || track.clientWidth) + gap;
  const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
  const isAtStart = track.scrollLeft <= 2;
  const isAtEnd = track.scrollLeft >= maxScroll - 2;
  let target = track.scrollLeft + direction * cardWidth;

  if (direction > 0 && isAtEnd) {
    target = 0;
  } else if (direction < 0 && isAtStart) {
    target = maxScroll;
  }

  track.scrollTo({
    left: Math.max(0, Math.min(maxScroll, target)),
    behavior: "smooth",
  });
}

function initProjectBoardCarouselControls() {
  if (!projectBoardRoot) {
    return;
  }

  projectBoardRoot.addEventListener("click", (event) => {
    const button = event.target.closest("[data-project-carousel-prev], [data-project-carousel-next]");

    if (button) {
      moveProjectCarousel(button);
    }
  });

  projectBoardRoot.addEventListener(
    "scroll",
    (event) => {
      if (event.target.matches("[data-project-carousel-track]")) {
        updateProjectCarouselButtons(event.target.closest("[data-project-carousel]"));
      }
    },
    true,
  );

  window.addEventListener("resize", updateProjectBoardCarousels);
}

async function fetchProjects() {
  const response = await fetch("/api/projects");

  if (response.ok) {
    return response.json();
  }

  const fallbackResponse = await fetch("/data/projects.json");

  if (!fallbackResponse.ok) {
    throw new Error("Projecten konden niet worden geladen.");
  }

  return fallbackResponse.json();
}

async function fetchProject(slug) {
  const response = await fetch(`/api/projects/${encodeURIComponent(slug)}`);

  if (response.ok) {
    return response.json();
  }

  const projects = await fetchProjects();
  const project = projects.find((item) => item.slug === slug);

  if (!project) {
    throw new Error("Project niet gevonden.");
  }

  return project;
}

function renderProjectFeed(projects) {
  if (renderProjectBoard(projects)) {
    return;
  }

  if (!projectFeedRoot || !projectFeaturedRoot || !projectGridRoot) {
    return;
  }

  projects = projects.map(localizePublicProject);

  if (!projects.length) {
    projectFeaturedRoot.innerHTML = window.siteLanguage === "en"
      ? `<div class="empty-state">No projects have been published yet. Use <a href="/projecten-beheer">the management tool</a> to add the first post.</div>`
      : `<div class="empty-state">Er zijn nog geen projecten gepubliceerd. Gebruik <a href="/projecten-beheer">de beheertool</a> om de eerste post toe te voegen.</div>`;
    projectGridRoot.innerHTML = "";
    if (typeof window.translatePublicSubtree === "function") {
      window.translatePublicSubtree(projectFeedRoot);
    }
    return;
  }

  const featuredProject = projects.find((project) => project.featured) || projects[0];
  const remainingProjects = projects.filter((project) => project.slug !== featuredProject.slug);

  projectFeaturedRoot.innerHTML = `
    ${coverMarkup(featuredProject, "blog-featured__media")}
    <div class="blog-featured__copy">
      ${projectMeta(featuredProject, true)}
      <h2>${escapeHtml(featuredProject.title)}</h2>
      <p>${escapeHtml(featuredProject.excerpt)}</p>
      <a class="primary-link" href="${escapeAttribute(projectDetailUrl(featuredProject.slug))}">
        <span>Lees project</span>
        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h13m-5-5 5 5-5 5" /></svg>
      </a>
    </div>
  `;

  projectGridRoot.innerHTML = remainingProjects
    .map(
      (project) => `
        <a class="blog-card reveal is-visible" href="${escapeAttribute(projectDetailUrl(project.slug))}">
          ${coverMarkup(project, "blog-card__media")}
          <div class="blog-card__body">
            ${projectMeta(project)}
            <h3>${escapeHtml(project.title)}</h3>
            <p>${escapeHtml(project.excerpt)}</p>
            <span class="link-arrow">
              <span>Lees meer</span>
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h13m-5-5 5 5-5 5" /></svg>
            </span>
          </div>
        </a>
      `,
    )
    .join("");

  if (typeof window.translatePublicSubtree === "function") {
    window.translatePublicSubtree(projectFeedRoot);
  }
}

function renderHomeProjects(projects) {
  if (!homeProjectsRoot) {
    return;
  }

  projects = projects.map(localizePublicProject);

  if (!projects.length) {
    homeProjectsRoot.innerHTML = window.siteLanguage === "en"
      ? `<div class="empty-state">No projects found yet. Use <a href="/projecten-beheer">the management tool</a> to populate the homepage.</div>`
      : `<div class="empty-state">Nog geen projecten gevonden. Gebruik <a href="/projecten-beheer">de beheertool</a> om de homepage te vullen.</div>`;
    if (typeof window.translatePublicSubtree === "function") {
      window.translatePublicSubtree(homeProjectsRoot);
    }
    return;
  }

  const featuredProject = projects.find((project) => project.featured) || projects[0];
  const remainingProjects = projects.filter((project) => project.slug !== featuredProject.slug);
  const homeProjects = [featuredProject, ...remainingProjects].slice(0, 4);

  homeProjectsRoot.innerHTML = homeProjects
    .map((project, index) => {
      const variant = index === 0 ? "featured" : index === 1 ? "tall" : "small";

      return `
        <a class="home-project-card home-project-card--${variant} reveal is-visible" href="${escapeAttribute(projectDetailUrl(project.slug))}">
          ${coverMarkup(project, "home-project-card__media")}
          <div class="home-project-card__meta">
            <span class="home-project-chip">${escapeHtml(projectCategoryLabel(project))}</span>
          </div>
          <h3>${escapeHtml(project.title)}</h3>
          <span class="home-project-card__cta">
            <span>Ontdek Meer</span>
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h13m-5-5 5 5-5 5" /></svg>
          </span>
        </a>
      `;
    })
    .join("");
}

function renderStaticProjectCta(value) {
  const text = String(value || "");
  const questionIndex = text.indexOf("?");

  if (questionIndex === -1) {
    return escapeHtml(text);
  }

  return `<strong>${escapeHtml(text.slice(0, questionIndex + 1))}</strong>${escapeHtml(text.slice(questionIndex + 1))}`;
}

function renderStaticProjectDetail(project) {
  if (!projectDetailRoot) {
    return;
  }

  project = localizeStaticProject(project);

  document.body.classList.add("has-project-static-detail");
  document.title = `Blauwe Bagger | ${project.crumb}`;

  const titleLines = project.titleLines
    .map((line, index) => {
      const style = index > 0 ? ` style="font-size:24px; margin-top:4px;"` : "";
      return `<div class="detail-title"${style}>${line}</div>`;
    })
    .join("");

  const body = project.body
    .map((paragraph) => `<p class="body-text">${escapeHtml(paragraph)}</p>`)
    .join("");

  const stats = project.stats
    .map(
      (stat) => `
        <div class="stat-block">
          <span class="stat-number">${stat.number}</span>
          <div class="stat-label">${escapeHtml(stat.label)}</div>
        </div>
      `,
    )
    .join("");

  const steps = (project.steps || [])
    .map(
      (step, index) => `
        <div class="step">
          <div class="step-num">${index + 1}</div>
          <div class="step-content">
            <div class="step-title">${escapeHtml(step.title)}</div>
            <div class="step-desc">${escapeHtml(step.desc)}</div>
          </div>
        </div>
      `,
    )
    .join("");

  const highlights = (project.highlights || [])
    .map(
      ([label, value]) => `
        <div class="highlight-item">
          <span class="highlight-label">${escapeHtml(label)}</span>
          <span class="highlight-dash">-</span>
          <span>${escapeHtml(value)}</span>
        </div>
      `,
    )
    .join("");

  projectDetailRoot.innerHTML = `
    <div class="project-static-page">
      <div class="breadcrumb">
        <span><a href="/projecten">Projecten</a></span>
        <span>&rsaquo;</span>
        <span>${escapeHtml(project.crumb)}</span>
      </div>

      <div class="detail-hero">
        <div class="tag-pill">${escapeHtml(project.tag)}</div>
        ${titleLines}
        <div class="detail-subtitle">${escapeHtml(project.subtitle)}</div>
      </div>

      <div class="detail-section">
        ${body}
      </div>

      <div class="stats-row">
        ${stats}
      </div>

      <div class="detail-section alt">
        <div class="section-title">${escapeHtml(project.stepsTitle)}</div>
        <div class="step-list">
          ${steps}
        </div>
      </div>

      ${
        highlights
          ? `
            <div class="detail-section">
              <div class="section-title">${escapeHtml(project.highlightsTitle)}</div>
              <div class="highlight-list">
                ${highlights}
              </div>
            </div>
          `
          : ""
      }

      <div class="detail-cta">
        <p class="cta-text">${renderStaticProjectCta(project.cta)}</p>
        <a class="outline-btn" href="/contact">Neem contact op &rarr;</a>
      </div>
    </div>
  `;

  if (typeof window.translatePublicSubtree === "function") {
    window.translatePublicSubtree(projectDetailRoot);
  }
}

const projectBlockTypes = {
  hero: {
    label: "Hero met beeld",
    fields: [
      ["overline", "Bovenregel", "input"],
      ["title", "Titel", "input"],
      ["emphasis", "Blauw/cursief woord", "input"],
      ["subtitle", "Intro tekst", "textarea"],
      ["image", "Achtergrondbeeld", "image"],
      ["align", "Uitlijning", "select", ["Links", "Midden"]],
    ],
  },
  meta: {
    label: "Projectgegevens",
    fields: [
      ["location", "Locatie", "input"],
      ["period", "Periode", "input"],
      ["volume", "Volume", "input"],
      ["client", "Opdrachtgever", "input"],
      ["status", "Status", "input"],
    ],
  },
  facts: {
    label: "Intro en kernpunten",
    fields: [
      ["eyebrow", "Label", "input"],
      ["body", "Tekst", "textarea"],
      ["facts", "Kernpunten, een per regel: label, waarde", "textarea"],
    ],
  },
  metrics: {
    label: "Resultatenrij",
    fields: [["items", "Resultaten, een per regel: getal, label", "textarea"]],
  },
  statQuote: {
    label: "Stat quote",
    fields: [
      ["number", "Groot cijfer", "input"],
      ["label", "Label onder cijfer", "input"],
      ["caption", "Kleine regel", "input"],
      ["text", "Quote tekst", "textarea"],
    ],
  },
  resultCards: {
    label: "Resultaatkaarten",
    fields: [
      ["eyebrow", "Label", "input"],
      ["items", "Kaarten, een per regel: getal, titel, tekst", "textarea"],
    ],
  },
  metalScience: {
    label: "pH extractiekaarten",
    fields: [
      ["eyebrow", "Label", "input"],
      ["title", "Titel", "input"],
      ["body", "Tekst", "textarea"],
      ["items", "Kaarten, een per regel: symbool, naam, pH-label, tekst", "textarea"],
    ],
  },
  text: {
    label: "Tekstblok",
    fields: [
      ["eyebrow", "Label", "input"],
      ["title", "Titel", "input"],
      ["body", "Tekst", "textarea"],
      ["variant", "Stijl", "select", ["Wit", "Blauw vlak"]],
    ],
  },
  simpleText: {
    label: "Simpel tekstblok",
    fields: [
      ["title", "Titel", "input"],
      ["body", "Tekst", "textarea"],
      ["width", "Breedte", "select", ["Normaal", "Breed"]],
    ],
  },
  columns: {
    label: "Twee kolommen",
    fields: [
      ["leftEyebrow", "Linker label", "input"],
      ["leftBody", "Linker tekst", "textarea"],
      ["rightEyebrow", "Rechter label", "input"],
      ["rightBody", "Rechter tekst", "textarea"],
    ],
  },
  imageText: {
    label: "Beeld en tekst",
    fields: [
      ["image", "Afbeelding", "image"],
      ["eyebrow", "Label", "input"],
      ["title", "Titel", "input"],
      ["emphasis", "Cursieve regel", "input"],
      ["body", "Tekst", "textarea"],
      ["imageSide", "Afbeelding", "select", ["Links", "Rechts"]],
    ],
  },
  featureGrid: {
    label: "Vier vakken",
    fields: [
      ["title", "Titel", "input"],
      ["items", "Vakken, een per regel: label, titel, tekst", "textarea"],
    ],
  },
  process: {
    label: "Stappenplan",
    fields: [
      ["title", "Titel", "input"],
      ["steps", "Stappen, een per regel: titel, tekst", "textarea"],
    ],
  },
  testList: {
    label: "Testlijst",
    fields: [
      ["title", "Titel", "input"],
      ["steps", "Onderdelen, een per regel: titel, tekst", "textarea"],
    ],
  },
  gallery: {
    label: "Fotogalerij",
    fields: [
      ["title", "Titel", "input"],
      ["images", "Afbeeldingen", "gallery"],
    ],
  },
  photoCollage: {
    label: "Fotocollage",
    fields: [
      ["title", "Titel", "input"],
      ["images", "Afbeeldingen", "gallery"],
    ],
  },
  cta: {
    label: "Contactblok",
    fields: [
      ["text", "Tekst", "textarea"],
      ["buttonLabel", "Knoptekst", "input"],
      ["buttonHref", "Link", "input"],
    ],
  },
};

function createProjectBlock(type, project = {}) {
  const id = `block_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const body = Array.isArray(project.body) ? project.body.join("\n\n") : String(project.body || "");
  const highlights = Array.isArray(project.highlights)
    ? project.highlights.join("\n")
    : String(project.highlights || "");
  const title = project.title || "Nieuw project";
  const heroImage = project.coverImage || "assets/media/installatie.jpeg";

  const defaults = {
    hero: {
      overline: `${projectCategoryLabel(project)}${project.date ? `, ${formatDate(project.date)}` : ""}`.trim(),
      title,
      emphasis: "",
      subtitle: project.excerpt || "",
      image: heroImage,
      align: "Links",
    },
    meta: {
      location: project.location || "Kildepot, Dordrecht",
      period: project.date ? formatDate(project.date) : "Mei 2026",
      volume: "10 m3",
      client: "Provincie Zuid-Holland",
      status: project.status || "Afgerond",
    },
    facts: {
      eyebrow: "Over dit project",
      body: body || project.excerpt || "",
      facts: [
        `Locatie, ${project.location || "Nederland"}`,
        `Periode, ${project.date ? formatDate(project.date) : "Nog te bepalen"}`,
        `Status, ${project.status || "Actief"}`,
      ].join("\n"),
    },
    metrics: {
      items: highlights
        ? highlights
            .split(/\r?\n/)
            .filter(Boolean)
            .slice(0, 3)
            .map((item) => `${item}, Kernpunt`)
            .join("\n")
        : "BlueSand, Secundaire zandfractie\nBlueFiller, Fijne kleifractie\nCO2 omlaag, Minder primaire winning",
    },
    statQuote: {
      number: "90%",
      label: "circulaire verwaarding",
      caption: "van baggerspecie in 2030",
      text:
        "De maatschappelijke kosten van baggerspecie omzetten in maatschappelijke baten - en de wereldwijde positie van Nederland als baggerland versterken.",
    },
    resultCards: {
      eyebrow: "Resultaten praktijktest",
      items:
        "43,5%, Volumereductie behaald, Significant minder volume hoeft te worden afgevoerd naar een depot.\n69 - 15 - 16, Scheidingsverdeling baggerspecie, 69,0% klei 15,1% zand 15,9% grof materiaal\nInzicht \u2713, Verontreinigingen in kaart, Inzicht verkregen in verontreinigingen van de gescheiden grondstoffen per fractie.",
    },
    metalScience: {
      eyebrow: "De wetenschap achter de extractie",
      title: "Elk metaal lost op bij een eigen pH-waarde",
      body:
        "De kern van de extractiemethode ligt in zuurgraad. Elk zwaar metaal heeft een specifieke pH-waarde waarop het in oplossing gaat - en dus uit de baggermatrix kan worden losgemaakt. Door de zuurgraad stapsgewijs te verlagen kunnen metalen een voor een worden afgescheiden. Dit maakt gerichte extractie mogelijk zonder de hele baggerstroom te behandelen als een verontreinigde massa.",
      items:
        "Cu, Koper, pH=5-6, Koper lost op bij een relatief milde verlaging van de pH - extractie kan plaatsvinden zonder sterk zure omstandigheden.\nZn, Zink, pH=4-5, Zink vereist een iets lagere zuurgraad dan koper. Door de pH na koperextractie verder te verlagen kan zink selectief worden afgescheiden.\nNi, Nikkel, pH=3-4, Nikkel lost op onder sterkere zure omstandigheden. De sequentiele aanpak maakt het mogelijk ook nikkel gericht te winnen uit de restfractie.",
    },
    text: {
      eyebrow: "Verdieping",
      title: "Wat hebben we gedaan?",
      body: body || project.excerpt || "",
      variant: "Wit",
    },
    simpleText: {
      title: "Opstap naar schaal",
      body:
        "Na afronding van alle praktijktesten in 2026 bundelt Blauwe Bagger de opgedane inzichten in de ontwikkeling van de BlueBox v2 - een installatie die 25 m3 per uur kan verwerken. Dat is de snelheid waarop de meeste reguliere baggerprojecten worden uitgevoerd. De stap van praktijktest naar volwaardige inzet wordt zo klein mogelijk gemaakt.",
      width: "Normaal",
    },
    columns: {
      leftEyebrow: "Over dit project",
      leftBody:
        body ||
        "Beschrijf hier de achtergrond van het project. Gebruik een lege regel om een nieuwe alinea te beginnen.\n\nVoeg daarna de context, partijen en belangrijkste aanleiding toe.",
      rightEyebrow: "De samenwerking",
      rightBody:
        "Beschrijf hier de ambitie, doelstelling of gezamenlijke missie van het project. Houd deze tekst ruim en redactioneel.",
      noteTitle: "",
      noteBody: "",
    },
    imageText: {
      image: project.coverImage || "assets/media/installatie.jpeg",
      eyebrow: "Stadsontwikkeling Amsterdam",
      title: "Buiteneiland als onderdeel van",
      emphasis: "duurzame gebiedsontwikkeling",
      body:
        "Het Buiteneiland wordt gefaseerd aangelegd en opgevuld met herbruikbare grond, vervoerd per schip om wegverkeer te minimaliseren.\n\nDeze praktijktest sluit direct aan op die ambitie: baggerspecie wordt niet afgevoerd, maar ter plekke omgezet in bouwmateriaal.",
      imageSide: "Links",
    },
    featureGrid: {
      title: "Wat doet het consortium?",
      items:
        "Standaarden, Sectornormen ontwikkelen, Het consortium werkt aan eenduidige kwaliteitsstandaarden voor secundaire grondstoffen uit bagger.\nPilots, Praktijkproeven financieren, Via het consortium worden pilots opgezet waarbij baggerstromen daadwerkelijk circulair worden verwerkt.\nRegelgeving, Beleid agenderen, Overheden en waterschappen worden betrokken om regelgeving rond baggerhergebruik te moderniseren.\nNetwerk, Ketensamenwerking opbouwen, Door partijen aan elkaar te verbinden ontstaat de keten die nodig is om bagger als grondstof te laten functioneren.",
    },
    process: {
      title: "Aanpak",
      steps:
        "Analyse, We brengen de baggerstroom en randvoorwaarden in kaart.\nScheiding, De BlueBox scheidt materiaalstromen op locatie.\nToepassing, Bruikbare fracties worden voorbereid voor hergebruik.",
    },
    testList: {
      title: "Wat doen we tijdens deze test?",
      steps:
        "Scheiding op locatie met de BlueBox v1, De BlueBox wordt op een baggerlocatie ingezet. De installatie ontwatert en scheidt de bagger ter plekke in bruikbare fracties.\nFysische en chemische analyses, De gescheiden fracties worden onderzocht op mechanische en chemische eigenschappen en vergeleken met waterbodemonderzoek.\nValidatie scheidingstechnologie, Een kerndoel van de test is het valideren van de BlueBox in een nieuw baggermilieu.\nIteratieve verbetering, Verbeterpunten die naar voren komen worden na de test doorgevoerd in de installatie.",
    },
    gallery: {
      title: "Foto's van het project",
      images: [project.coverImage || "assets/media/bluebox-tablet.png", "assets/media/installatie.jpeg", "assets/media/baggeren.jpeg"]
        .filter(Boolean)
        .map((image) => `${image}, ${title}`)
        .join("\n"),
    },
    photoCollage: {
      title: "Foto's van de praktijktest",
      images: [
        project.coverImage || "assets/media/bluebox-tablet.png",
        "assets/media/installatie.jpeg",
        "assets/media/baggeren.jpeg",
      ]
        .filter(Boolean)
        .map((image) => `${image}, ${title}`)
        .join("\n"),
    },
    cta: {
      text: "Ben je een waterschap, gemeente of partner? Blauwe Bagger denkt mee over de circulaire route voor jouw baggerstroom.",
      buttonLabel: "Neem contact op",
      buttonHref: "/contact",
    },
  };

  return {
    id,
    type,
    fields: defaults[type] || {},
  };
}

function defaultProjectBlocks(project = {}) {
  return ["hero", "meta", "facts", "metrics", "gallery", "cta"].map((type) => createProjectBlock(type, project));
}

function normalizeAdminBlocks(blocks, project = {}) {
  if (Array.isArray(blocks) && blocks.length) {
    return blocks
      .filter((block) => projectBlockTypes[block.type])
      .map((block) => ({
        id: block.id || `block_${Math.random().toString(36).slice(2, 9)}`,
        type: block.type,
        fields: { ...(block.fields || {}) },
      }));
  }

  return defaultProjectBlocks(project);
}

function linesToPairs(value, options = {}) {
  const mergeContinuations = Boolean(options.mergeContinuations);
  const pairs = [];

  String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const hasDivider = /[,|]/.test(line);
      const pair = splitListLine(line);

      if (mergeContinuations && pairs.length && (!hasDivider || !looksLikeListPair(pair))) {
        pairs[pairs.length - 1][1] = [pairs[pairs.length - 1][1], line.replace(/\s+/g, " ").trim()]
          .filter(Boolean)
          .join(" ");
        return;
      }

      pairs.push(pair);
    });

  return pairs.filter(([label, body]) => label || body);
}

function looksLikeListPair([label, body]) {
  const cleanLabel = String(label || "").trim();

  if (!cleanLabel || !String(body || "").trim()) {
    return false;
  }

  if (cleanLabel.length > 90 || cleanLabel.split(/\s+/).length > 10) {
    return false;
  }

  if (/^[a-z]/.test(cleanLabel) || /[.!?]$/.test(cleanLabel)) {
    return false;
  }

  return true;
}

function pairsToLines(pairs) {
  return pairs
    .map(([label, body]) => [label, body].map((value) => String(value || "").replace(/\s+/g, " ").trim()))
    .map(([label, body]) => (body ? `${label}, ${body}` : label))
    .filter(Boolean)
    .join("\n");
}

function metalScienceItems(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [symbol = "", name = "", ph = "", body = ""] = splitListParts(line, 4);
      return { symbol, name, ph, body };
    })
    .filter((item) => item.symbol || item.name || item.ph || item.body);
}

function metalScienceItemsToLines(items) {
  return items
    .map((item) => [item.symbol, item.name, item.ph, item.body].map((value) => String(value || "").replace(/\s+/g, " ").trim()))
    .map((parts) => parts.join(", ").replace(/(?:,\s*)+$/g, ""))
    .filter(Boolean)
    .join("\n");
}

function blockTitle(block) {
  return projectBlockTypes[block.type]?.label || "Blok";
}

function blockFontScale(block) {
  const value = Number(block.fields?.fontScale);
  return Number.isFinite(value) ? Math.min(130, Math.max(70, value)) : 100;
}

function blockFontScaleStyle(block) {
  return `style="--block-font-scale: ${(blockFontScale(block) / 100).toFixed(2)}"`;
}

function fieldFontScales(block) {
  const scales = block?.fields?.fontScales;

  if (scales && typeof scales === "object" && !Array.isArray(scales)) {
    return scales;
  }

  if (typeof scales === "string") {
    try {
      const parsed = JSON.parse(scales);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  return {};
}

function textScaleKey(field) {
  return `field:${field}`;
}

function listTextScaleKey(field, index, part) {
  return `list:${field}:${index}:${part}`;
}

function textFontScale(block, key) {
  const value = Number(fieldFontScales(block)[key]);

  if (Number.isFinite(value)) {
    return Math.min(130, Math.max(70, value));
  }

  return blockFontScale(block);
}

function textFontScaleStyle(block, key) {
  const scale = textFontScale(block, key);
  return scale === 100 ? "" : ` style="font-size: calc(1em * ${(scale / 100).toFixed(2)})"`;
}

function scalePreviewText(block, key, delta) {
  if (!block || !key || !Number.isFinite(delta)) {
    return;
  }

  const nextScale = Math.min(130, Math.max(70, textFontScale(block, key) + delta));

  block.fields.fontScales = {
    ...fieldFontScales(block),
    [key]: String(nextScale),
  };
  delete block.fields.fontScale;
}

function renderBlockField(block, field) {
  const [name, label, kind, options = []] = field;
  const value = block.fields?.[name] || "";
  const fieldId = `${block.id}-${name}`;

  if (kind === "image") {
    const image = normalizeAssetUrl(value);

    return `
      <div class="builder-upload-field">
        <span class="builder-upload-label">${escapeHtml(label)}</span>
        <input id="${escapeAttribute(fieldId)}" type="hidden" data-block-field="${escapeAttribute(name)}" value="${escapeAttribute(value)}" />
        <label class="builder-upload-control">
          <span>${image ? "Afbeelding vervangen" : "Afbeelding uploaden"}</span>
          <small>${image ? "Afbeelding staat klaar" : "Sleep of kies een bestand"}</small>
          <input type="file" accept="image/*" data-image-upload data-target-field="${escapeAttribute(name)}" />
        </label>
        ${image ? `<img class="builder-upload-preview" src="${escapeAttribute(image)}" alt="" />` : ""}
      </div>
    `;
  }

  if (kind === "gallery") {
    const items = parseGalleryItems(value);

    return `
      <div class="builder-gallery-field" data-gallery-field="${escapeAttribute(name)}">
        <span class="builder-upload-label">${escapeHtml(label)}</span>
        <input id="${escapeAttribute(fieldId)}" type="hidden" data-block-field="${escapeAttribute(name)}" value="${escapeAttribute(value)}" />
        <div class="builder-gallery-list">
          ${
            items.length
              ? items
                  .map(
                    (item, index) => `
                      <article class="builder-gallery-item" data-gallery-item data-gallery-image="${escapeAttribute(item.image)}">
                        <img src="${escapeAttribute(normalizeAssetUrl(item.image))}" alt="" />
                        <div class="builder-gallery-item__body">
                          <input data-gallery-caption value="${escapeAttribute(item.caption)}" placeholder="Bijschrift" aria-label="Bijschrift afbeelding ${index + 1}" />
                          <div class="builder-gallery-item__actions">
                            <button type="button" data-gallery-move="-1" ${index === 0 ? "disabled" : ""} aria-label="Afbeelding omhoog" title="Omhoog">
                              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m6 15 6-6 6 6" /></svg>
                            </button>
                            <button type="button" data-gallery-move="1" ${index === items.length - 1 ? "disabled" : ""} aria-label="Afbeelding omlaag" title="Omlaag">
                              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>
                            </button>
                            <button type="button" data-gallery-remove aria-label="Afbeelding verwijderen" title="Verwijder">
                              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 7h14M10 11v6M14 11v6M8 7l1-3h6l1 3M7 7l1 13h8l1-13" /></svg>
                            </button>
                          </div>
                        </div>
                      </article>
                    `,
                  )
                  .join("")
              : `<div class="builder-gallery-empty">Nog geen afbeeldingen gekozen.</div>`
          }
        </div>
        <label class="builder-upload-control">
          <span>Afbeeldingen uploaden</span>
          <small>Nieuwe beelden worden onderaan toegevoegd</small>
          <input type="file" accept="image/*" multiple data-gallery-upload data-target-field="${escapeAttribute(name)}" />
        </label>
      </div>
    `;
  }

  if (kind === "textarea") {
    return `
      <label for="${escapeAttribute(fieldId)}">
        ${escapeHtml(label)}
        <textarea id="${escapeAttribute(fieldId)}" data-block-field="${escapeAttribute(name)}" rows="4">${escapeHtml(value)}</textarea>
      </label>
    `;
  }

  if (kind === "select") {
    return `
      <label for="${escapeAttribute(fieldId)}">
        ${escapeHtml(label)}
        <select id="${escapeAttribute(fieldId)}" data-block-field="${escapeAttribute(name)}">
          ${options
            .map(
              (option) =>
                `<option value="${escapeAttribute(option)}" ${option === value ? "selected" : ""}>${escapeHtml(option)}</option>`,
            )
            .join("")}
        </select>
      </label>
    `;
  }

  return `
    <label for="${escapeAttribute(fieldId)}">
      ${escapeHtml(label)}
      <input id="${escapeAttribute(fieldId)}" data-block-field="${escapeAttribute(name)}" value="${escapeAttribute(value)}" />
    </label>
  `;
}

function renderBlockEditor() {
  if (!blockList) {
    return;
  }

  if (!adminBlocks.length) {
    blockList.innerHTML = "";
    if (blockInspector) {
      blockInspector.innerHTML = "";
    }
    renderBuilderPreview();
    return;
  }

  if (!activeBlockId || !adminBlocks.some((block) => block.id === activeBlockId)) {
    activeBlockId = adminBlocks[0].id;
  }

  blockList.innerHTML = adminBlocks
    .map((block, index) => {
      return `
        <button class="admin-block-item ${block.id === activeBlockId ? "is-active" : ""}" type="button" data-block-id="${escapeAttribute(
          block.id,
        )}" draggable="true">
          <span class="admin-block-item__index">${String(index + 1).padStart(2, "0")}</span>
          <strong>${escapeHtml(blockTitle(block))}</strong>
          <span class="admin-block-item__drag" aria-hidden="true">::</span>
        </button>
      `;
    })
    .join("");

  renderBlockInspector();
  renderBuilderPreview();
}

function previewEditable(value, field, tagName = "span", className = "") {
  const scaleKey = textScaleKey(field);
  const scaleAttributes = renderingPreviewBlock
    ? `${textFontScaleStyle(renderingPreviewBlock, scaleKey)} data-preview-scale-key="${escapeAttribute(scaleKey)}"`
    : "";

  if (!isBuilderEditor()) {
    return `<${tagName}${className ? ` class="${className}"` : ""}${scaleAttributes}>${escapeHtml(value)}</${tagName}>`;
  }

  return `<${tagName}${className ? ` class="${className}"` : ""}${scaleAttributes} contenteditable="true" spellcheck="false" data-preview-field="${escapeAttribute(
    field,
  )}">${escapeHtml(value)}</${tagName}>`;
}

function previewListEditable(value, field, index, part, tagName = "span", className = "") {
  const scaleKey = listTextScaleKey(field, index, part);
  const scaleAttributes = renderingPreviewBlock
    ? `${textFontScaleStyle(renderingPreviewBlock, scaleKey)} data-preview-scale-key="${escapeAttribute(scaleKey)}"`
    : "";

  if (!isBuilderEditor()) {
    return `<${tagName}${className ? ` class="${className}"` : ""}${scaleAttributes}>${escapeHtml(value)}</${tagName}>`;
  }

  return `<${tagName}${className ? ` class="${className}"` : ""}${scaleAttributes} contenteditable="true" spellcheck="false" data-preview-list-field="${escapeAttribute(
    field,
  )}" data-preview-list-index="${escapeAttribute(index)}" data-preview-list-part="${escapeAttribute(part)}">${escapeHtml(
    value,
  )}</${tagName}>`;
}

function wrapPreviewBlock(block, markup) {
  if (!isBuilderEditor()) {
    return blockFontScale(block) === 100
      ? markup
      : `<div class="project-builder-font-scale" ${blockFontScaleStyle(block)}>${markup}</div>`;
  }

  const active = block.id === activeBlockId ? " is-selected" : "";

  return `
    <div class="builder-preview-block${active}" data-preview-block-id="${escapeAttribute(block.id)}" ${blockFontScaleStyle(
      block,
    )} draggable="true">
      <div class="builder-preview-toolbar" contenteditable="false">
        <button type="button" data-preview-font-scale="-5" aria-label="Geselecteerde tekst kleiner" title="Geselecteerde tekst kleiner">
          <span aria-hidden="true" class="builder-preview-toolbar__type builder-preview-toolbar__type--small">A-</span>
          <span class="sr-only">Geselecteerde tekst kleiner</span>
        </button>
        <button type="button" data-preview-font-scale="5" aria-label="Geselecteerde tekst groter" title="Geselecteerde tekst groter">
          <span aria-hidden="true" class="builder-preview-toolbar__type">A+</span>
          <span class="sr-only">Geselecteerde tekst groter</span>
        </button>
        <button type="button" data-preview-move="-1" aria-label="Omhoog" title="Omhoog">
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m6 15 6-6 6 6" /></svg>
          <span class="sr-only">Omhoog</span>
        </button>
        <button type="button" data-preview-move="1" aria-label="Omlaag" title="Omlaag">
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>
          <span class="sr-only">Omlaag</span>
        </button>
        <button type="button" data-preview-remove aria-label="Verwijder" title="Verwijder">
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 7h14M10 11v6M14 11v6M8 7l1-3h6l1 3M7 7l1 13h8l1-13" /></svg>
          <span class="sr-only">Verwijder</span>
        </button>
      </div>
      ${markup}
    </div>
  `;
}

function setAdminBlocks(blocks) {
  adminBlocks = normalizeAdminBlocks(blocks);
  activeBlockId = adminBlocks[0]?.id || "";
  renderBlockEditor();
}

function collectAdminBlocks() {
  if (!blockList) {
    return [];
  }

  [blockList, blockInspector].filter(Boolean).forEach((root) => {
    const blockElement = root.closest?.("[data-block-id]");
    const scopedBlockId = blockElement?.getAttribute("data-block-id") || activeBlockId;
    const block = adminBlocks.find((item) => item.id === scopedBlockId);

    if (!block) {
      return;
    }

    root.querySelectorAll("[data-block-field]").forEach((field) => {
      block.fields[field.getAttribute("data-block-field")] = field.value;
    });

    if ((block.type === "process" || block.type === "testList") && block.fields.steps) {
      block.fields.steps = pairsToLines(linesToPairs(block.fields.steps, { mergeContinuations: true }));
    }
  });

  return adminBlocks.map((block) => ({
    id: block.id,
    type: block.type,
    fields: { ...block.fields },
  }));
}

function currentAdminProjectFromForm() {
  if (!adminForm) {
    return {};
  }

  const formData = new FormData(adminForm);

  return {
    title: formData.get("title") || "Nieuw project",
    slug: formData.get("slug") || "",
    date: formData.get("date") || new Date().toISOString().slice(0, 10),
    category: projectCategoryLabel(formData.get("category")),
    location: formData.get("location") || "Nederland",
    status: formData.get("status") || "Actief",
    coverImage: formData.get("coverImage") || "",
    excerpt: formData.get("excerpt") || "",
    body: normalizeClientParagraphs(formData.get("body")),
    highlights: String(formData.get("highlights") || "")
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean),
    featured: formData.get("featured") === "on",
    blocks: collectAdminBlocks(),
  };
}

function renderBuilderPreview() {
  if (!builderPreview) {
    return;
  }

  const project = currentAdminProjectFromForm();

  builderPreview.innerHTML = `
    <div class="project-builder-page">
      ${renderProjectBlocks(project)}
    </div>
  `;
}

function galleryItemsFromField(root) {
  return Array.from(root.querySelectorAll("[data-gallery-item]")).map((item) => ({
    image: item.getAttribute("data-gallery-image") || item.querySelector("img")?.getAttribute("src") || "",
    caption: item.querySelector("[data-gallery-caption]")?.value || "",
  }));
}

function updateGalleryBlockField(root, shouldRenderInspector = false) {
  const fieldName = root?.getAttribute("data-gallery-field");
  const hiddenField = root?.querySelector("[data-block-field]");
  const block = adminBlocks.find((item) => item.id === activeBlockId);

  if (!fieldName || !hiddenField || !block) {
    return;
  }

  const value = serializeGalleryItems(galleryItemsFromField(root));
  hiddenField.value = value;
  block.fields[fieldName] = value;

  if (shouldRenderInspector) {
    renderBlockInspector();
  }

  renderBuilderPreview();
}

function renderBlockInspector() {
  if (!blockInspector) {
    return;
  }

  const block = adminBlocks.find((item) => item.id === activeBlockId);

  if (!block) {
    blockInspector.innerHTML = "";
    return;
  }

  const definition = projectBlockTypes[block.type];
  blockInspector.innerHTML = `
    <div class="builder-inspector__head">
      <strong>${escapeHtml(blockTitle(block))}</strong>
      <button class="button-ghost button-danger" type="button" data-block-remove-active>Verwijder</button>
    </div>
    <div class="admin-block-fields">
      ${definition.fields.map((field) => renderBlockField(block, field)).join("")}
    </div>
  `;
}

function renderProjectSwitch(projects) {
  if (!projectSwitch) {
    return;
  }

  const currentSlug = adminForm?.dataset.editingSlug || "";
  projectSwitch.innerHTML = `
    <option value="">Nieuw project</option>
    ${projects
      .map(
        (project) =>
          `<option value="${escapeAttribute(project.slug)}" ${project.slug === currentSlug ? "selected" : ""}>${escapeHtml(
            project.title,
          )}</option>`,
      )
      .join("")}
  `;
}

function updateInspectorField(fieldName, value) {
  if (!blockInspector) {
    return;
  }

  const field = blockInspector.querySelector(`[data-block-field="${CSS.escape(fieldName)}"]`);

  if (field && field.value !== value) {
    field.value = value;
  }
}

function updateBlockListField(block, fieldName, index, part, value) {
  if (block.type === "metalScience" && fieldName === "items") {
    const items = metalScienceItems(block.fields?.items);
    const lineIndex = Number(index);

    if (!Number.isFinite(lineIndex) || lineIndex < 0) {
      return;
    }

    while (items.length <= lineIndex) {
      items.push({ symbol: "", name: "", ph: "", body: "" });
    }

    const key = part === "label" ? "symbol" : part === "title" ? "name" : part === "badge" ? "ph" : "body";
    items[lineIndex][key] = String(value || "").replace(/\s+/g, " ").trim();
    block.fields.items = metalScienceItemsToLines(items);
    updateInspectorField("items", block.fields.items);
    return;
  }

  const pairs = linesToPairs(block.fields?.[fieldName], { mergeContinuations: fieldName === "steps" });
  const lineIndex = Number(index);

  if (!Number.isFinite(lineIndex) || lineIndex < 0) {
    return;
  }

  while (pairs.length <= lineIndex) {
    pairs.push(["", ""]);
  }

  pairs[lineIndex][part === "label" ? 0 : 1] = String(value || "").replace(/\s+/g, " ").trim();
  block.fields[fieldName] = pairsToLines(pairs);
  updateInspectorField(fieldName, block.fields[fieldName]);
}

function moveAdminBlock(id, direction) {
  collectAdminBlocks();
  const index = adminBlocks.findIndex((block) => block.id === id);
  const nextIndex = index + direction;

  if (index < 0 || nextIndex < 0 || nextIndex >= adminBlocks.length) {
    return;
  }

  const [block] = adminBlocks.splice(index, 1);
  adminBlocks.splice(nextIndex, 0, block);
  renderBlockEditor();
}

function moveAdminBlockTo(id, targetIndex) {
  collectAdminBlocks();
  const fromIndex = adminBlocks.findIndex((block) => block.id === id);

  if (fromIndex < 0) {
    return;
  }

  const [block] = adminBlocks.splice(fromIndex, 1);
  const nextIndex = Math.max(0, Math.min(targetIndex > fromIndex ? targetIndex - 1 : targetIndex, adminBlocks.length));
  adminBlocks.splice(nextIndex, 0, block);
  activeBlockId = block.id;
  renderBlockEditor();
}

function insertAdminBlock(type, targetIndex = adminBlocks.length) {
  if (!type || !projectBlockTypes[type]) {
    return;
  }

  collectAdminBlocks();
  const block = createProjectBlock(type, currentAdminProjectFromForm());
  const nextIndex = Math.max(0, Math.min(targetIndex, adminBlocks.length));
  adminBlocks.splice(nextIndex, 0, block);
  activeBlockId = block.id;
  renderBlockEditor();
}

function addAdminBlock(type) {
  insertAdminBlock(type);
}

function clearBuilderDropState() {
  draggedBlockId = "";
  draggedBlockType = "";
  [blockList, builderPreview, blockPalette].filter(Boolean).forEach((root) => {
    root.querySelectorAll(".is-dragging, .is-drop-target, .is-drop-before, .is-drop-after").forEach((element) => {
      element.classList.remove("is-dragging", "is-drop-target", "is-drop-before", "is-drop-after");
    });
  });
}

function previewDropIndex(event) {
  const blockElement = event.target.closest("[data-preview-block-id]");

  if (!blockElement) {
    return adminBlocks.length;
  }

  const blockId = blockElement.getAttribute("data-preview-block-id");
  const index = adminBlocks.findIndex((block) => block.id === blockId);
  const rect = blockElement.getBoundingClientRect();
  const isAfter = event.clientY > rect.top + rect.height / 2;

  return Math.max(0, index + (isAfter ? 1 : 0));
}

function markPreviewDropTarget(event) {
  builderPreview?.querySelectorAll(".is-drop-target, .is-drop-before, .is-drop-after").forEach((element) => {
    element.classList.remove("is-drop-target", "is-drop-before", "is-drop-after");
  });

  const blockElement = event.target.closest("[data-preview-block-id]");

  if (!blockElement) {
    builderPreview?.classList.add("is-drop-after");
    return;
  }

  const rect = blockElement.getBoundingClientRect();
  blockElement.classList.add("is-drop-target", event.clientY > rect.top + rect.height / 2 ? "is-drop-after" : "is-drop-before");
}

const maxUploadRequestBytes = 7.5 * 1024 * 1024;
const maxUploadImageBytes = 5 * 1024 * 1024;
const maxUploadImageEdge = 2400;

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Afbeelding kon niet worden gelezen."));
    reader.readAsDataURL(file);
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("Afbeelding kon niet worden verkleind."));
      },
      type,
      quality,
    );
  });
}

function imageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Afbeelding kon niet worden gelezen."));
    };
    image.src = url;
  });
}

async function prepareImageForUpload(file) {
  const canResize = /^image\/(jpeg|png|webp)$/i.test(file.type || "");
  const image = canResize ? await imageFromFile(file) : null;
  const shouldResize =
    image &&
    (file.size > maxUploadImageBytes ||
      Math.max(image.naturalWidth || image.width || 0, image.naturalHeight || image.height || 0) > maxUploadImageEdge);

  if (!shouldResize) {
    const data = await fileToDataUrl(file);

    if (data.length > maxUploadRequestBytes) {
      throw new Error("Afbeelding is te groot. Gebruik een kleinere afbeelding of exporteer hem onder 5 MB.");
    }

    return {
      data,
      filename: file.name,
      type: file.type,
    };
  }

  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const scale = Math.min(1, maxUploadImageEdge / Math.max(sourceWidth, sourceHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sourceWidth * scale));
  canvas.height = Math.max(1, Math.round(sourceHeight * scale));

  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const blob = await canvasToBlob(canvas, "image/webp", 0.84);
  const data = await fileToDataUrl(blob);

  if (data.length > maxUploadRequestBytes) {
    throw new Error("Afbeelding blijft te groot na verkleinen. Gebruik een afbeelding onder 5 MB.");
  }

  return {
    data,
    filename: file.name.replace(/\.[a-z0-9]+$/i, "") + ".webp",
    type: "image/webp",
  };
}

async function uploadImageFile(file) {
  const upload = await prepareImageForUpload(file);
  const response = await fetch("/api/uploads", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filename: upload.filename,
      type: upload.type,
      data: upload.data,
    }),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Upload mislukt.");
  }

  return payload.url;
}

function setUploadingStatus(message, isError = false) {
  setAdminStatus(message, isError);
}

function renderProjectBlockHero(block, project) {
  const fields = block.fields || {};
  const image = normalizeAssetUrl(fields.image || project.coverImage || "assets/media/installatie.jpeg");
  const title = fields.title || project.title;
  const emphasis = fields.emphasis ? ` <em>${escapeHtml(fields.emphasis)}</em>` : "";
  const centered = fields.align === "Midden" ? " project-builder-hero--center" : "";

  const markup = `
    <section class="project-builder-hero${centered}" ${image ? `style="--project-hero-image: url('${escapeAttribute(image)}')"` : ""}>
      <div class="project-builder-hero__copy">
        ${previewEditable(fields.overline || projectCategoryLabel(project), "overline", "p")}
        <h1>${previewEditable(title, "title", "span", "project-builder-hero__title-text")}${emphasis}</h1>
        ${previewEditable(fields.subtitle || project.excerpt || "", "subtitle", "span", "project-builder-hero__subtitle")}
      </div>
    </section>
  `;

  return wrapPreviewBlock(block, markup);
}

function renderProjectBlockFacts(block) {
  const fields = block.fields || {};
  const facts = linesToPairs(fields.facts)
    .map(
      ([label, value], index) => `
        <div>
          <dt>${previewListEditable(label, "facts", index, "label")}</dt>
          <dd>${previewListEditable(value, "facts", index, "value")}</dd>
        </div>
      `,
    )
    .join("");
  const paragraphs = String(fields.body || "")
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => `<p>${escapeHtml(item)}</p>`)
    .join("");

  const markup = `
    <section class="project-builder-section project-builder-facts">
      <div>
        ${previewEditable(fields.eyebrow || "Over dit project", "eyebrow", "p", "project-builder-kicker")}
        <div class="project-builder-richtext" ${
          isBuilderEditor() ? 'contenteditable="true" spellcheck="false" data-preview-field="body"' : ""
        }>${paragraphs}</div>
      </div>
      <dl>${facts}</dl>
    </section>
  `;

  return wrapPreviewBlock(block, markup);
}

function renderProjectBlockMeta(block) {
  const fields = block.fields || {};
  const items = [
    ["Locatie", "location", fields.location || ""],
    ["Periode", "period", fields.period || ""],
    ["Volume", "volume", fields.volume || ""],
    ["Opdrachtgever", "client", fields.client || ""],
    ["Status", "status", fields.status || ""],
  ];

  const markup = `
    <section class="project-builder-meta">
      ${items
        .map(([label, field, value]) => {
          const isStatus = label === "Status";

          return `
            <div class="${isStatus ? "project-builder-meta__status" : ""}">
              <span>${escapeHtml(label)}</span>
              ${previewEditable(value, field, isStatus ? "strong" : "p")}
            </div>
          `;
        })
        .join("")}
    </section>
  `;

  return wrapPreviewBlock(block, markup);
}

function renderProjectBlockMetrics(block) {
  const metricPairs = linesToPairs(block.fields?.items).slice(0, 4);
  const items = metricPairs
    .map(
      ([number, label], index) => `
        <div class="project-builder-metric">
          ${previewListEditable(number, "items", index, "label", "strong")}
          ${previewListEditable(label, "items", index, "value", "span")}
        </div>
      `,
    )
    .join("");

  return wrapPreviewBlock(
    block,
    `<section class="project-builder-metrics project-builder-metrics--count-${metricPairs.length}" data-metric-count="${metricPairs.length}">${items}</section>`,
  );
}

function renderProjectBlockStatQuote(block) {
  const fields = block.fields || {};
  const textScaleKeyName = textScaleKey("text");
  const textScaleAttributes = renderingPreviewBlock
    ? `${textFontScaleStyle(renderingPreviewBlock, textScaleKeyName)} data-preview-scale-key="${escapeAttribute(textScaleKeyName)}"`
    : "";

  const markup = `
    <section class="project-builder-section project-builder-stat-quote">
      <div class="project-builder-stat-quote__stat">
        ${previewEditable(fields.number || "90%", "number", "strong")}
        ${previewEditable(fields.label || "circulaire verwaarding", "label", "span")}
        ${previewEditable(fields.caption || "van baggerspecie in 2030", "caption", "small")}
      </div>
      <div class="project-builder-stat-quote__divider" aria-hidden="true"></div>
      <p class="project-builder-stat-quote__text"${textScaleAttributes} ${
        isBuilderEditor() ? 'contenteditable="true" spellcheck="false" data-preview-field="text"' : ""
      }>${escapeHtml(
        fields.text ||
          "De maatschappelijke kosten van baggerspecie omzetten in maatschappelijke baten - en de wereldwijde positie van Nederland als baggerland versterken.",
      )}</p>
    </section>
  `;

  return wrapPreviewBlock(block, markup);
}

function renderProjectBlockResultCards(block) {
  const fields = block.fields || {};
  const cards = String(fields.items || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/(?:\s*\|\s*|,\s+)/);
      const value = String(parts.shift() || "").replace(/^inzicht\s+v$/i, "Inzicht \u2713");
      const title = parts.shift() || "";
      return {
        value,
        title,
        body: parts.join(", "),
      };
    })
    .slice(0, 4)
    .map(
      (item, index) => `
        <article class="project-builder-result-card">
          ${previewListEditable(item.value, "items", index, "label", "strong")}
          ${previewListEditable(item.title, "items", index, "title", "h3")}
          ${previewListEditable(item.body, "items", index, "value", "p")}
        </article>
      `,
    )
    .join("");

  const markup = `
    <section class="project-builder-section project-builder-result-cards">
      ${previewEditable(fields.eyebrow || "Resultaten praktijktest", "eyebrow", "p", "project-builder-kicker")}
      <div class="project-builder-result-cards__grid">
        ${cards}
      </div>
    </section>
  `;

  return wrapPreviewBlock(block, markup);
}

function renderProjectBlockMetalScience(block) {
  const fields = block.fields || {};
  const cards = metalScienceItems(fields.items)
    .slice(0, 6)
    .map(
      (item, index) => `
        <article class="project-builder-metal-card">
          ${previewListEditable(item.symbol, "items", index, "label", "strong")}
          ${previewListEditable(item.name, "items", index, "title", "span", "project-builder-metal-card__name")}
          ${previewListEditable(item.ph, "items", index, "badge", "span", "project-builder-metal-card__ph")}
          ${previewListEditable(item.body, "items", index, "value", "p", "project-builder-metal-card__body")}
        </article>
      `,
    )
    .join("");

  const markup = `
    <section class="project-builder-section project-builder-metal-science">
      <div class="project-builder-metal-science__intro">
        ${previewEditable(fields.eyebrow || "De wetenschap achter de extractie", "eyebrow", "p", "project-builder-kicker")}
        ${previewEditable(fields.title || "Elk metaal lost op bij een eigen pH-waarde", "title", "h2")}
        ${renderColumnRichText(fields.body || "", "body", "project-builder-metal-science__body")}
      </div>
      <div class="project-builder-metal-science__grid">
        ${cards}
      </div>
    </section>
  `;

  return wrapPreviewBlock(block, markup);
}

function renderProjectBlockText(block) {
  const fields = block.fields || {};
  const dark = fields.variant === "Blauw vlak" ? " project-builder-section--dark" : "";
  const bodyScaleKey = textScaleKey("body");
  const bodyScaleAttributes = renderingPreviewBlock
    ? `${textFontScaleStyle(renderingPreviewBlock, bodyScaleKey)} data-preview-scale-key="${escapeAttribute(bodyScaleKey)}"`
    : "";
  const paragraphs = String(fields.body || "")
    .split(/\n\s*\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => `<p>${escapeHtml(item)}</p>`)
    .join("");

  const markup = `
    <section class="project-builder-section project-builder-text${dark}">
      ${previewEditable(fields.eyebrow || "Verdieping", "eyebrow", "p", "project-builder-kicker")}
      ${previewEditable(fields.title || "", "title", "h2")}
      <div class="project-builder-richtext"${bodyScaleAttributes} ${
        isBuilderEditor() ? 'contenteditable="true" spellcheck="false" data-preview-field="body"' : ""
      }>${paragraphs}</div>
    </section>
  `;

  return wrapPreviewBlock(block, markup);
}

function renderProjectBlockSimpleText(block) {
  const fields = block.fields || {};
  const wide = fields.width === "Breed" ? " project-builder-simple-text--wide" : "";

  const markup = `
    <section class="project-builder-section project-builder-simple-text${wide}">
      ${previewEditable(fields.title || "Opstap naar schaal", "title", "h2")}
      ${renderColumnRichText(fields.body || "", "body", "project-builder-simple-text__body")}
    </section>
  `;

  return wrapPreviewBlock(block, markup);
}

function renderColumnRichText(value, fieldName, className = "project-builder-column-copy") {
  const scaleKey = textScaleKey(fieldName);
  const scaleAttributes = renderingPreviewBlock
    ? `${textFontScaleStyle(renderingPreviewBlock, scaleKey)} data-preview-scale-key="${escapeAttribute(scaleKey)}"`
    : "";
  const paragraphs = String(value || "")
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => `<p>${escapeHtml(item)}</p>`)
    .join("");

  return `<div class="${className}"${scaleAttributes} ${
    isBuilderEditor() ? `contenteditable="true" spellcheck="false" data-preview-field="${escapeAttribute(fieldName)}"` : ""
  }>${paragraphs}</div>`;
}

function renderProjectBlockColumns(block) {
  const fields = block.fields || {};
  const rightEyebrow = String(fields.rightEyebrow || "").trim();
  const rightEyebrowLabel =
    !rightEyebrow || rightEyebrow.toLowerCase() === "missie" ? "De samenwerking" : fields.rightEyebrow;
  const markup = `
    <section class="project-builder-section project-builder-columns">
      <div class="project-builder-column">
        ${previewEditable(fields.leftEyebrow || "Over dit project", "leftEyebrow", "p", "project-builder-kicker")}
        ${renderColumnRichText(fields.leftBody || "", "leftBody")}
      </div>
      <div class="project-builder-column">
        ${previewEditable(rightEyebrowLabel, "rightEyebrow", "p", "project-builder-kicker")}
        ${renderColumnRichText(fields.rightBody || "", "rightBody")}
      </div>
    </section>
  `;

  return wrapPreviewBlock(block, markup);
}

function renderProjectBlockImageText(block) {
  const fields = block.fields || {};
  const image = normalizeAssetUrl(fields.image || "assets/media/installatie.jpeg");
  const reversed = fields.imageSide === "Rechts" ? " project-builder-image-text--reverse" : "";
  const imageMarkup = image
    ? `<figure class="project-builder-image-text__media"><img src="${escapeAttribute(image)}" alt="${escapeAttribute(
        fields.title || "Projectbeeld",
      )}" /></figure>`
    : `<figure class="project-builder-image-text__media"></figure>`;

  const markup = `
    <section class="project-builder-section project-builder-image-text${reversed}">
      ${imageMarkup}
      <div class="project-builder-image-text__copy">
        <h2>
          ${previewEditable(fields.title || "Buiteneiland als onderdeel van", "title", "span")}
          ${previewEditable(fields.emphasis || "duurzame gebiedsontwikkeling", "emphasis", "span")}
        </h2>
        ${renderColumnRichText(fields.body || "", "body", "project-builder-image-text__body")}
      </div>
    </section>
  `;

  return wrapPreviewBlock(block, markup);
}

function renderProjectBlockFeatureGrid(block) {
  const fields = block.fields || {};
  const items = String(fields.items || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/\s*[,|]\s*/);
      return {
        eyebrow: parts.shift() || "",
        title: parts.shift() || "",
        body: parts.join(", "),
      };
    })
    .slice(0, 4);

  const cards = items
    .map(
      (item, index) => `
        <article class="project-builder-feature-cell">
          ${previewListEditable(item.eyebrow, "items", index, "label", "p", "project-builder-kicker")}
          ${previewListEditable(item.title, "items", index, "title", "h3")}
          ${previewListEditable(item.body, "items", index, "value", "p", "project-builder-feature-cell__body")}
        </article>
      `,
    )
    .join("");

  const markup = `
    <section class="project-builder-section project-builder-feature-grid">
      ${previewEditable(fields.title || "Wat doet het consortium?", "title", "h2")}
      <div class="project-builder-feature-grid__cells">
        ${cards}
      </div>
    </section>
  `;

  return wrapPreviewBlock(block, markup);
}

function renderProjectBlockProcess(block) {
  const steps = linesToPairs(block.fields?.steps, { mergeContinuations: true })
    .map(
      ([title, text], index) => `
        <li>
          <span>${String(index + 1).padStart(2, "0")}</span>
          <div>
            ${previewListEditable(title, "steps", index, "label", "strong")}
            ${previewListEditable(text, "steps", index, "value", "p")}
          </div>
        </li>
      `,
    )
    .join("");

  const markup = `
    <section class="project-builder-section project-builder-process">
      ${previewEditable(block.fields?.title || "Aanpak", "title", "h2")}
      <ol>${steps}</ol>
    </section>
  `;

  return wrapPreviewBlock(block, markup);
}

function renderProjectBlockTestList(block) {
  const fields = block.fields || {};
  const rows = linesToPairs(fields.steps, { mergeContinuations: true })
    .map(
      ([title, text], index) => `
        <li>
          <span class="project-builder-test-list__number">${index + 1}</span>
          <div>
            ${previewListEditable(title, "steps", index, "label", "strong")}
            ${previewListEditable(text, "steps", index, "value", "p")}
          </div>
        </li>
      `,
    )
    .join("");

  const markup = `
    <section class="project-builder-section project-builder-test-list">
      ${previewEditable(fields.title || "Wat doen we tijdens deze test?", "title", "h2")}
      <ol>${rows}</ol>
    </section>
  `;

  return wrapPreviewBlock(block, markup);
}

function renderProjectBlockGallery(block) {
  const images = linesToPairs(block.fields?.images)
    .map(([image, alt]) => {
      const src = normalizeAssetUrl(image);
      return src
        ? `<figure><img src="${escapeAttribute(src)}" alt="${escapeAttribute(alt || "Projectbeeld")}" /></figure>`
        : "";
    })
    .join("");

  const markup = `
    <section class="project-builder-section project-builder-gallery">
      ${previewEditable(block.fields?.title || "Foto's", "title", "p", "project-builder-kicker")}
      <div>${images}</div>
    </section>
  `;

  return wrapPreviewBlock(block, markup);
}

function renderProjectBlockPhotoCollage(block) {
  const fields = block.fields || {};
  const images = linesToPairs(fields.images)
    .slice(0, 6)
    .map(([image, alt]) => {
      const src = normalizeAssetUrl(image);
      return src
        ? `<figure><img src="${escapeAttribute(src)}" alt="${escapeAttribute(alt || "Projectbeeld")}" /></figure>`
        : "";
    })
    .join("");

  const markup = `
    <section class="project-builder-section project-builder-photo-collage">
      ${previewEditable(fields.title || "Foto's van de praktijktest", "title", "p", "project-builder-kicker")}
      <div class="project-builder-photo-collage__grid">${images}</div>
    </section>
  `;

  return wrapPreviewBlock(block, markup);
}

function renderProjectBlockCta(block) {
  const fields = block.fields || {};
  const markup = `
    <section class="project-builder-cta">
      ${previewEditable(fields.text || "", "text", "p")}
      <a class="outline-btn" href="${escapeAttribute(fields.buttonHref || "/contact")}">${previewEditable(
        fields.buttonLabel || "Neem contact op",
        "buttonLabel",
      )} &rarr;</a>
    </section>
  `;

  return wrapPreviewBlock(block, markup);
}

function renderProjectBlocks(project) {
  const blocks = normalizeAdminBlocks(project.blocks, project);
  return blocks
    .map((block) => {
      renderingPreviewBlock = block;

      try {
        if (block.type === "hero") return renderProjectBlockHero(block, project);
        if (block.type === "meta") return renderProjectBlockMeta(block);
        if (block.type === "facts") return renderProjectBlockFacts(block);
        if (block.type === "metrics") return renderProjectBlockMetrics(block);
        if (block.type === "statQuote") return renderProjectBlockStatQuote(block);
        if (block.type === "resultCards") return renderProjectBlockResultCards(block);
        if (block.type === "metalScience") return renderProjectBlockMetalScience(block);
        if (block.type === "text") return renderProjectBlockText(block);
        if (block.type === "simpleText") return renderProjectBlockSimpleText(block);
        if (block.type === "columns") return renderProjectBlockColumns(block);
        if (block.type === "imageText") return renderProjectBlockImageText(block);
        if (block.type === "featureGrid") return renderProjectBlockFeatureGrid(block);
        if (block.type === "process") return renderProjectBlockProcess(block);
        if (block.type === "testList") return renderProjectBlockTestList(block);
        if (block.type === "gallery") return renderProjectBlockGallery(block);
        if (block.type === "photoCollage") return renderProjectBlockPhotoCollage(block);
        if (block.type === "cta") return renderProjectBlockCta(block);
        return "";
      } finally {
        renderingPreviewBlock = null;
      }
    })
    .join("");

  if (typeof window.translatePublicSubtree === "function") {
    window.translatePublicSubtree(homeProjectsRoot);
  }
}

function renderProjectDetail(project) {
  if (!projectDetailRoot) {
    return;
  }

  project = localizePublicProject(project);
  document.body.classList.remove("has-project-static-detail");
  const hasBlocks = Array.isArray(project.blocks) && project.blocks.length;

  const paragraphs = (project.body || [])
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");
  const highlights = (project.highlights || [])
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");

  document.title = `Blauwe Bagger | ${project.title}`;

  if (hasBlocks) {
    projectDetailRoot.innerHTML = `
      <div class="project-builder-page">
        ${renderProjectBlocks(project)}
      </div>
    `;
    if (typeof window.translatePublicSubtree === "function") {
      window.translatePublicSubtree(projectDetailRoot);
    }
    return;
  }

  projectDetailRoot.innerHTML = `
    <div class="section-inner detail-shell">
      <div class="page-toolbar">
        <a class="secondary-link" href="/projecten">Terug naar projecten</a>
        <a class="secondary-link" href="/projecten-beheer">Beheer projecten</a>
      </div>

      <article class="detail-header">
        ${coverMarkup(project, "detail-header__media")}
        <div class="detail-header__copy">
          ${projectMeta(project, true)}
          <h1>${escapeHtml(project.title)}</h1>
          <p>${escapeHtml(project.excerpt)}</p>
        </div>
      </article>

      <div class="detail-layout">
        <div class="detail-body">
          ${paragraphs || `<p>${escapeHtml(project.excerpt)}</p>`}
        </div>
        <aside class="detail-sidebar">
          <h2>Belangrijk in dit project</h2>
          <ul>
            ${
              highlights ||
              `<li>Voeg highlights toe via <a href="/projecten-beheer">de beheertool</a> om hier kernpunten te tonen.</li>`
            }
          </ul>
        </aside>
      </div>
    </div>
  `;

  if (typeof window.translatePublicSubtree === "function") {
    window.translatePublicSubtree(projectDetailRoot);
  }
}

function setAdminStatus(message, isError = false) {
  if (!adminStatus) {
    return;
  }

  adminStatus.textContent = message;
  adminStatus.classList.toggle("is-error", isError);
}

function projectToFormState(project) {
  return {
    title: project.title || "",
    slug: project.slug || "",
    date: project.date || new Date().toISOString().slice(0, 10),
    category: projectCategoryLabel(project),
    location: project.location || "Nederland",
    status: project.status || "Actief",
    coverImage: project.coverImage || "",
    excerpt: project.excerpt || "",
    body: Array.isArray(project.body) ? project.body.join("\n\n") : "",
    highlights: Array.isArray(project.highlights) ? project.highlights.join("\n") : "",
    featured: Boolean(project.featured),
    blocks: normalizeAdminBlocks(project.blocks, project),
  };
}

function fillAdminForm(project, updateUrl = true) {
  if (!adminForm) {
    return;
  }

  const values = projectToFormState(project);
  adminForm.dataset.editingSlug = project.slug;
  adminForm.dataset.slugManual = "true";

  Object.entries(values).forEach(([key, value]) => {
    if (key === "blocks") {
      return;
    }

    const field = adminForm.elements.namedItem(key);

    if (!field) {
      return;
    }

    if (field.type === "checkbox") {
      field.checked = Boolean(value);
    } else {
      field.value = value;
    }
  });

  setAdminBlocks(values.blocks);
  renderBuilderPreview();

  setAdminStatus(`Je bewerkt nu "${project.title}".`);
  showProjectEditor(updateUrl);
}

function setBuilderViewMode(mode = "editor") {
  if (!projectAdminRoot) {
    return;
  }

  projectAdminRoot.classList.toggle("is-sidebar-collapsed", mode === "collapsed");
  projectAdminRoot.classList.toggle("is-preview-fullscreen", mode === "fullscreen");

  if (builderSidebarToggle) {
    const isCollapsed = mode === "collapsed";
    const label = isCollapsed ? "Menu openen" : "Menu sluiten";
    const icon = builderSidebarToggle.querySelector("svg");
    const screenReaderLabel = builderSidebarToggle.querySelector(".sr-only");

    builderSidebarToggle.setAttribute("aria-label", label);
    builderSidebarToggle.setAttribute("title", label);
    builderSidebarToggle.setAttribute("aria-pressed", isCollapsed ? "true" : "false");

    if (screenReaderLabel) {
      screenReaderLabel.textContent = label;
    }

    if (icon) {
      icon.innerHTML = isCollapsed
        ? '<path d="M4 6h16M4 12h16M4 18h16" />'
        : '<path d="M6 6l12 12M18 6 6 18" />';
    }
  }

  if (builderFullscreenToggle) {
    builderFullscreenToggle.setAttribute("aria-pressed", mode === "fullscreen" ? "true" : "false");
  }
}

function showProjectDashboard(updateUrl = true) {
  setBuilderViewMode("editor");
  adminDashboard?.removeAttribute("hidden");
  builderEditorRegions.forEach((region) => {
    region.setAttribute("hidden", "");
  });

  if (updateUrl) {
    window.history.pushState({}, "", "/projecten-beheer");
  }
}

function showProjectEditor(updateUrl = true) {
  adminDashboard?.setAttribute("hidden", "");
  builderEditorRegions.forEach((region) => {
    region.removeAttribute("hidden");
  });

  if (updateUrl) {
    const slug = adminForm?.dataset.editingSlug || "";
    window.history.pushState({}, "", slug ? `/projecten-beheer?edit=${encodeURIComponent(slug)}` : "/projecten-beheer?new=1");
  }
}

function resetAdminForm(openEditor = false, updateUrl = true) {
  if (!adminForm) {
    return;
  }

  adminForm.reset();
  adminForm.dataset.editingSlug = "";
  adminForm.dataset.slugManual = "";

  const dateField = adminForm.elements.namedItem("date");
  const statusField = adminForm.elements.namedItem("status");
  const categoryField = adminForm.elements.namedItem("category");

  if (dateField) {
    dateField.value = new Date().toISOString().slice(0, 10);
  }

  if (statusField) {
    statusField.value = "Actief";
  }

  if (categoryField) {
    categoryField.value = defaultProjectCategory;
  }

  setAdminBlocks(defaultProjectBlocks({}));
  if (projectSwitch) {
    projectSwitch.value = "";
  }
  renderBuilderPreview();

  setAdminStatus("Klaar voor een nieuw project.");

  if (openEditor) {
    showProjectEditor(updateUrl);
  }
}

function renderAdminList(projects) {
  adminProjectsCache = projects;
  renderProjectSwitch(projects);

  if (!adminList) {
    return;
  }

  const newProjectCard = `
    <button class="admin-project-card admin-project-card--new admin-project-card--board" type="button" data-new-project-card>
      <span class="admin-project-card__plus" aria-hidden="true">+</span>
      <strong>New project</strong>
    </button>
  `;

  const renderAdminProjectCard = (project) => {
    const image = normalizeAssetUrl(project.coverImage || projectCoverFallback(project));

    return `
      <article class="admin-project-card admin-project-card--board">
        <div class="admin-project-card__media">
          ${image ? `<img src="${escapeAttribute(image)}" alt="" />` : ""}
        </div>
        <div class="admin-project-card__body">
          <div class="blog-meta">
            <span class="pill">${escapeHtml(projectCategoryLabel(project))}</span>
            <span class="pill">${escapeHtml(project.status)}</span>
          </div>
          <h3>${escapeHtml(project.title)}</h3>
          <p>${escapeHtml(project.excerpt)}</p>
        </div>
        <div class="admin-project-card__actions">
          <button class="admin-project-card__icon" type="button" data-edit-project="${escapeAttribute(project.slug)}" aria-label="${escapeAttribute(
            `${project.title} bewerken`,
          )}" title="Bewerk">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m5 16-.8 3.8L8 19l10.5-10.5-3-3L5 16Z" /><path d="m14.5 6.5 3 3" /></svg>
          </button>
          <a class="admin-project-card__icon" href="${escapeAttribute(projectDetailUrl(project.slug))}" target="_blank" rel="noreferrer" aria-label="${escapeAttribute(
            `${project.title} live bekijken`,
          )}" title="Bekijk live">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 17 17 7" /><path d="M9 7h8v8" /></svg>
          </a>
          <button class="admin-project-card__icon admin-project-card__icon--danger" type="button" data-delete-project="${escapeAttribute(
            project.slug,
          )}" aria-label="${escapeAttribute(`${project.title} verwijderen`)}" title="Verwijder">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 7h14" /><path d="M10 11v6M14 11v6" /><path d="m9 7 .5-2h5l.5 2" /><path d="M7 7l1 12h8l1-12" /></svg>
          </button>
        </div>
      </article>
    `;
  };

  const rows = projectBoardSections
    .map((section) => {
      const cards = projects.filter((project) => projectBoardSectionFor(project) === section.key);

      return `
        <section class="admin-project-row" aria-labelledby="admin-project-row-${section.key}">
          <h2 id="admin-project-row-${section.key}">${escapeHtml(section.label)}</h2>
          <div class="admin-project-row__grid">
            ${cards.length ? cards.map(renderAdminProjectCard).join("") : `<div class="admin-project-empty">Nog geen projecten in ${escapeHtml(section.label)}.</div>`}
          </div>
        </section>
      `;
    })
    .join("");

  adminList.innerHTML = `
    <section class="admin-project-row admin-project-row--new" aria-label="Nieuw project">
      <div class="admin-project-row__grid admin-project-row__grid--new">${newProjectCard}</div>
    </section>
    ${rows}
  `;
}

async function refreshAdmin() {
  if (!projectAdminRoot) {
    return [];
  }

  try {
    const projects = await fetchProjects();
    renderAdminList(projects);
    return projects;
  } catch (error) {
    adminList.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
    return [];
  }
}

async function submitAdminForm(event) {
  event.preventDefault();

  if (!adminForm) {
    return;
  }

  const formData = new FormData(adminForm);
  const editingSlug = adminForm.dataset.editingSlug;
  const editingProjectExists = Boolean(editingSlug && adminProjectsCache.some((project) => project.slug === editingSlug));
  const method = editingProjectExists ? "PUT" : "POST";
  const url = editingProjectExists ? `/api/projects/${encodeURIComponent(editingSlug)}` : "/api/projects";

  const payload = {
    title: formData.get("title"),
    slug: formData.get("slug"),
    date: formData.get("date"),
    category: projectCategoryLabel(formData.get("category")),
    location: formData.get("location"),
    status: formData.get("status"),
    coverImage: formData.get("coverImage"),
    excerpt: formData.get("excerpt"),
    body: formData.get("body"),
    highlights: formData.get("highlights"),
    featured: formData.get("featured") === "on",
    blocks: collectAdminBlocks(),
  };

  setAdminStatus("Bezig met opslaan...");

  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Opslaan mislukt.");
    }

    setAdminStatus(editingSlug ? "Project bijgewerkt." : "Project toegevoegd.");
    await refreshAdmin();
    fillAdminForm(result);
  } catch (error) {
    setAdminStatus(error.message, true);
  }
}

async function handleAdminListClick(event) {
  const editButton = event.target.closest("[data-edit-project]");
  const deleteButton = event.target.closest("[data-delete-project]");
  const newProjectButton = event.target.closest("[data-new-project-card]");

  if (newProjectButton) {
    resetAdminForm(true);
    return;
  }

  if (editButton) {
    const slug = editButton.getAttribute("data-edit-project");
    const projects = await fetchProjects();
    const project = projects.find((item) => item.slug === slug);

    if (project) {
      fillAdminForm(project);
    }

    return;
  }

  if (deleteButton) {
    const slug = deleteButton.getAttribute("data-delete-project");
    const confirmed = window.confirm("Weet je zeker dat je dit project wilt verwijderen?");

    if (!confirmed) {
      return;
    }

    setAdminStatus("Project wordt verwijderd...");

    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Verwijderen mislukt.");
      }

      if (adminForm && adminForm.dataset.editingSlug === slug) {
        resetAdminForm();
      }

      setAdminStatus("Project verwijderd.");
      await refreshAdmin();
    } catch (error) {
      setAdminStatus(error.message, true);
    }
  }
}

async function initProjectFeed() {
  if (!projectFeedRoot) {
    return;
  }

  try {
    const projects = await fetchProjects();
    renderProjectFeed(projects);
  } catch (error) {
    if (projectFeaturedRoot) {
      const message = typeof window.translatePublicText === "function"
        ? window.translatePublicText(error.message)
        : error.message;
      projectFeaturedRoot.innerHTML = `<div class="empty-state">${escapeHtml(message)}</div>`;
      if (typeof window.translatePublicSubtree === "function") {
        window.translatePublicSubtree(projectFeaturedRoot);
      }
    }
  }
}

async function initHomeProjects() {
  if (!homeProjectsRoot) {
    return;
  }

  try {
    const projects = await fetchProjects();
    renderHomeProjects(projects);
  } catch (error) {
    const message = typeof window.translatePublicText === "function"
      ? window.translatePublicText(error.message)
      : error.message;
    homeProjectsRoot.innerHTML = `<div class="empty-state">${escapeHtml(message)}</div>`;
    if (typeof window.translatePublicSubtree === "function") {
      window.translatePublicSubtree(homeProjectsRoot);
    }
  }
}

async function initProjectDetail() {
  if (!projectDetailRoot) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const slug = (
    params.get("slug") ||
    decodeURIComponent(window.location.pathname.replace(/^\/projecten\//, "").replace(/^\/project-detail\/?/, "").replace(/\/$/, ""))
  ).trim();

  if (!slug) {
    const message = typeof window.translatePublicText === "function"
      ? window.translatePublicText("Geen projectslug gevonden.")
      : "Geen projectslug gevonden.";
    projectDetailRoot.innerHTML = `<div class="section-inner"><div class="empty-state">${escapeHtml(message)}</div></div>`;
    return;
  }

  try {
    const project = await fetchProject(slug);
    renderProjectDetail(project);
  } catch (error) {
    if (staticProjectPages[slug]) {
      renderStaticProjectDetail(staticProjectPages[slug]);
      return;
    }

    const message = typeof window.translatePublicText === "function"
      ? window.translatePublicText(error.message)
      : error.message;
    projectDetailRoot.innerHTML = `
      <div class="section-inner">
        <div class="empty-state">
          ${escapeHtml(message)}<br />
          <a class="link-arrow" href="/projecten">
            <span>Terug naar projecten</span>
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h13m-5-5 5 5-5 5" /></svg>
          </a>
        </div>
      </div>
    `;
    if (typeof window.translatePublicSubtree === "function") {
      window.translatePublicSubtree(projectDetailRoot);
    }
  }
}

async function initProjectAdmin() {
  if (!projectAdminRoot || !adminForm) {
    return;
  }

  const titleField = adminForm.elements.namedItem("title");
  const slugField = adminForm.elements.namedItem("slug");

  resetAdminForm();
  showProjectDashboard(false);
  const initialProjects = await refreshAdmin();
  const params = new URLSearchParams(window.location.search);
  const editSlug = params.get("edit");

  if (params.has("new")) {
    resetAdminForm(true, false);
  } else if (editSlug) {
    const project = initialProjects.find((item) => item.slug === editSlug) || staticEditableProject(editSlug);

    if (project) {
      fillAdminForm(project, false);
    }
  }

  adminDashboardOpenButtons.forEach((button) => {
    button.addEventListener("click", () => {
      showProjectDashboard();
    });
  });

  builderSidebarToggle?.addEventListener("click", () => {
    const isCollapsed = projectAdminRoot.classList.contains("is-sidebar-collapsed");
    setBuilderViewMode(isCollapsed ? "editor" : "collapsed");
  });

  builderSidebarRestore?.addEventListener("click", () => {
    setBuilderViewMode("editor");
  });

  builderFullscreenToggle?.addEventListener("click", () => {
    setBuilderViewMode("fullscreen");
  });

  builderFullscreenExit?.addEventListener("click", () => {
    setBuilderViewMode("editor");
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && projectAdminRoot.classList.contains("is-preview-fullscreen")) {
      setBuilderViewMode("editor");
    }
  });

  window.addEventListener("popstate", async () => {
    const nextParams = new URLSearchParams(window.location.search);
    const nextEditSlug = nextParams.get("edit");

    if (nextParams.has("new")) {
      resetAdminForm(false, false);
      showProjectEditor(false);
      return;
    }

    if (nextEditSlug) {
      const projects = adminProjectsCache.length ? adminProjectsCache : await refreshAdmin();
      const project = projects.find((item) => item.slug === nextEditSlug) || staticEditableProject(nextEditSlug);

      if (project) {
        fillAdminForm(project, false);
      }
      return;
    }

    showProjectDashboard(false);
  });

  titleField?.addEventListener("input", () => {
    if (adminForm.dataset.slugManual === "true") {
      renderBuilderPreview();
      return;
    }

    slugField.value = slugifyProject(titleField.value);
    renderBuilderPreview();
  });

  slugField?.addEventListener("input", () => {
    adminForm.dataset.slugManual = slugField.value.trim() ? "true" : "";
    renderBuilderPreview();
  });

  adminForm.addEventListener("input", (event) => {
    if (!event.target.closest("[data-block-inspector]")) {
      renderBuilderPreview();
    }
  });

  adminForm.addEventListener("change", (event) => {
    if (!event.target.closest("[data-block-inspector]")) {
      renderBuilderPreview();
    }
  });

  adminForm.querySelector("[data-project-cover-upload]")?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setUploadingStatus("Afbeelding uploaden...");
      const url = await uploadImageFile(file);
      const coverField = adminForm.elements.namedItem("coverImage");

      if (coverField) {
        coverField.value = url;
      }

      setUploadingStatus("Afbeelding geupload.");
      renderBuilderPreview();
    } catch (error) {
      setUploadingStatus(error.message, true);
    } finally {
      event.target.value = "";
    }
  });

  adminForm.addEventListener("submit", submitAdminForm);
  adminList?.addEventListener("click", async (event) => {
    try {
      await handleAdminListClick(event);
    } catch (error) {
      setAdminStatus(error.message || "Er ging iets mis in projectbeheer.", true);
    }
  });

  adminResetButton?.addEventListener("click", () => {
    resetAdminForm(true);
  });

  projectSwitch?.addEventListener("change", () => {
    const slug = projectSwitch.value;

    if (!slug) {
      resetAdminForm(true);
      return;
    }

    const project = adminProjectsCache.find((item) => item.slug === slug);

    if (project) {
      fillAdminForm(project);
    }
  });

  blockAddSelect?.addEventListener("change", () => {
    addAdminBlock(blockAddSelect.value);
    blockAddSelect.value = "";
  });

  blockPalette?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-add-block]");

    if (button) {
      addAdminBlock(button.getAttribute("data-add-block"));
    }
  });

  blockPalette?.querySelectorAll("[data-add-block]").forEach((button) => {
    button.setAttribute("draggable", "true");
  });

  blockPalette?.addEventListener("dragstart", (event) => {
    const button = event.target.closest("[data-add-block]");

    if (!button) {
      return;
    }

    draggedBlockId = "";
    draggedBlockType = button.getAttribute("data-add-block");
    button.classList.add("is-dragging");
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("text/plain", `block-type:${draggedBlockType}`);
  });

  blockPalette?.addEventListener("dragend", clearBuilderDropState);

  blockInspector?.addEventListener("input", (event) => {
    const galleryCaption = event.target.closest("[data-gallery-caption]");

    if (galleryCaption) {
      updateGalleryBlockField(galleryCaption.closest("[data-gallery-field]"));
      return;
    }

    const field = event.target.closest("[data-block-field]");

    if (!field) {
      return;
    }

    const block = adminBlocks.find((item) => item.id === activeBlockId);

    if (block) {
      block.fields[field.getAttribute("data-block-field")] = field.value;
      renderBuilderPreview();
    }
  });

  blockInspector?.addEventListener("click", (event) => {
    const moveButton = event.target.closest("[data-gallery-move]");
    const removeButton = event.target.closest("[data-gallery-remove]");

    if (!moveButton && !removeButton) {
      return;
    }

    const item = event.target.closest("[data-gallery-item]");
    const root = event.target.closest("[data-gallery-field]");

    if (!item || !root) {
      return;
    }

    event.preventDefault();

    if (removeButton) {
      item.remove();
      updateGalleryBlockField(root, true);
      return;
    }

    const direction = Number(moveButton.getAttribute("data-gallery-move"));
    const sibling = direction < 0 ? item.previousElementSibling : item.nextElementSibling;

    if (!sibling || !sibling.matches("[data-gallery-item]")) {
      return;
    }

    if (direction < 0) {
      root.querySelector(".builder-gallery-list")?.insertBefore(item, sibling);
    } else {
      root.querySelector(".builder-gallery-list")?.insertBefore(sibling, item);
    }

    updateGalleryBlockField(root, true);
  });

  blockInspector?.addEventListener("change", async (event) => {
    const imageUpload = event.target.closest("[data-image-upload]");
    const galleryUpload = event.target.closest("[data-gallery-upload]");

    if (!imageUpload && !galleryUpload) {
      return;
    }

    const files = Array.from(event.target.files || []);

    if (!files.length) {
      return;
    }

    const block = adminBlocks.find((item) => item.id === activeBlockId);
    const fieldName = event.target.getAttribute("data-target-field");

    if (!block || !fieldName) {
      return;
    }

    try {
      setUploadingStatus(files.length === 1 ? "Afbeelding uploaden..." : "Afbeeldingen uploaden...");
      const urls = [];

      for (const file of files) {
        urls.push(await uploadImageFile(file));
      }

      if (imageUpload) {
        block.fields[fieldName] = urls[0];
      }

      if (galleryUpload) {
        const currentValue = String(block.fields[fieldName] || "").trim();
        const additions = urls.map((url, index) => `${url}, ${files[index]?.name || "Afbeelding"}`).join("\n");
        block.fields[fieldName] = [currentValue, additions].filter(Boolean).join("\n");
      }

      setUploadingStatus(files.length === 1 ? "Afbeelding geupload." : "Afbeeldingen geupload.");
      renderBlockInspector();
      renderBuilderPreview();
    } catch (error) {
      setUploadingStatus(error.message, true);
    } finally {
      event.target.value = "";
    }
  });

  blockList?.addEventListener("click", (event) => {
    const blockElement = event.target.closest("[data-block-id]");

    if (!blockElement) {
      return;
    }

    const blockId = blockElement.getAttribute("data-block-id");
    activeBlockId = blockId;
    renderBlockEditor();
  });

  blockInspector?.addEventListener("click", (event) => {
    if (!event.target.closest("[data-block-remove-active]")) {
      return;
    }

    collectAdminBlocks();
    adminBlocks = adminBlocks.filter((block) => block.id !== activeBlockId);
    activeBlockId = adminBlocks[0]?.id || "";
    renderBlockEditor();
  });

  builderPreview?.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      event.preventDefault();
    }

    const toolbarButton = event.target.closest("[data-preview-move], [data-preview-remove], [data-preview-font-scale]");
    const blockElement = event.target.closest("[data-preview-block-id]");
    const textTarget = event.target.closest("[data-preview-scale-key]");

    if (!blockElement) {
      return;
    }

    const blockId = blockElement.getAttribute("data-preview-block-id");

    if (textTarget) {
      activePreviewTextBlockId = blockId;
      activePreviewTextKey = textTarget.getAttribute("data-preview-scale-key") || "";
    }

    if (toolbarButton) {
      event.preventDefault();
      event.stopPropagation();
      collectAdminBlocks();

      if (toolbarButton.matches("[data-preview-remove]")) {
        adminBlocks = adminBlocks.filter((block) => block.id !== blockId);
        activeBlockId = adminBlocks[0]?.id || "";
        renderBlockEditor();
        return;
      }

      if (toolbarButton.matches("[data-preview-font-scale]")) {
        const block = adminBlocks.find((item) => item.id === blockId);
        const delta = Number(toolbarButton.getAttribute("data-preview-font-scale"));
        const fallbackKey = blockElement.querySelector("[data-preview-scale-key]")?.getAttribute("data-preview-scale-key") || "";
        const targetKey = activePreviewTextBlockId === blockId && activePreviewTextKey ? activePreviewTextKey : fallbackKey;

        if (block && targetKey && Number.isFinite(delta)) {
          scalePreviewText(block, targetKey, delta);
          activeBlockId = blockId;
          activePreviewTextBlockId = blockId;
          activePreviewTextKey = targetKey;
          renderBlockEditor();
        }

        return;
      }

      moveAdminBlock(blockId, Number(toolbarButton.getAttribute("data-preview-move")));
      activeBlockId = blockId;
      renderBlockEditor();
      return;
    }

    if (activeBlockId !== blockId) {
      activeBlockId = blockId;
      renderBlockEditor();
    }
  });

  builderPreview?.addEventListener("input", (event) => {
    const field = event.target.closest("[data-preview-field]");
    const listField = event.target.closest("[data-preview-list-field]");
    const blockElement = event.target.closest("[data-preview-block-id]");

    if ((!field && !listField) || !blockElement) {
      return;
    }

    const block = adminBlocks.find((item) => item.id === blockElement.getAttribute("data-preview-block-id"));

    if (!block) {
      return;
    }

    const value = (field || listField).innerText.trim();
    activeBlockId = block.id;
    activePreviewTextBlockId = block.id;

    if (field) {
      const fieldName = field.getAttribute("data-preview-field");
      activePreviewTextKey = field.getAttribute("data-preview-scale-key") || textScaleKey(fieldName);
      block.fields[fieldName] = value;
      updateInspectorField(fieldName, value);
      return;
    }

    const fieldName = listField.getAttribute("data-preview-list-field");
    activePreviewTextKey =
      listField.getAttribute("data-preview-scale-key") ||
      listTextScaleKey(
        fieldName,
        listField.getAttribute("data-preview-list-index"),
        listField.getAttribute("data-preview-list-part"),
      );
    updateBlockListField(
      block,
      fieldName,
      listField.getAttribute("data-preview-list-index"),
      listField.getAttribute("data-preview-list-part"),
      value,
    );
  });

  builderPreview?.addEventListener(
    "keydown",
    (event) => {
      const previewField = event.target.closest("[data-preview-field]");
      const multilineField =
        previewField &&
        (previewField.matches("div") ||
          previewField.classList.contains("project-builder-richtext") ||
          previewField.classList.contains("project-builder-column-copy") ||
          previewField.classList.contains("project-builder-simple-text__body") ||
          previewField.classList.contains("project-builder-image-text__body"));

      if (
        (previewField || event.target.closest("[data-preview-list-field]")) &&
        event.key === "Enter" &&
        !event.shiftKey &&
        !multilineField
      ) {
        event.preventDefault();
        event.target.blur();
      }
    },
    true,
  );

  builderPreview?.addEventListener("dragstart", (event) => {
    const blockElement = event.target.closest("[data-preview-block-id]");

    if (!blockElement || event.target.closest("[data-preview-field], [data-preview-list-field]")) {
      event.preventDefault();
      return;
    }

    draggedBlockType = "";
    draggedBlockId = blockElement.getAttribute("data-preview-block-id");
    blockElement.classList.add("is-dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", `block-id:${draggedBlockId}`);
  });

  builderPreview?.addEventListener("dragover", (event) => {
    if (!draggedBlockId && !draggedBlockType) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = draggedBlockType ? "copy" : "move";
    markPreviewDropTarget(event);
  });

  builderPreview?.addEventListener("dragleave", (event) => {
    if (builderPreview.contains(event.relatedTarget)) {
      return;
    }

    builderPreview.querySelectorAll(".is-drop-target, .is-drop-before, .is-drop-after").forEach((element) => {
      element.classList.remove("is-drop-target", "is-drop-before", "is-drop-after");
    });
  });

  builderPreview?.addEventListener("drop", (event) => {
    if (!draggedBlockId && !draggedBlockType) {
      return;
    }

    event.preventDefault();
    const targetIndex = previewDropIndex(event);

    if (draggedBlockType) {
      insertAdminBlock(draggedBlockType, targetIndex);
      clearBuilderDropState();
      return;
    }

    if (draggedBlockId) {
      moveAdminBlockTo(draggedBlockId, targetIndex);
      clearBuilderDropState();
    }
  });

  builderPreview?.addEventListener("dragend", clearBuilderDropState);

  blockList?.addEventListener("dragstart", (event) => {
    const blockElement = event.target.closest("[data-block-id]");

    if (!blockElement) {
      return;
    }

    draggedBlockId = blockElement.getAttribute("data-block-id");
    draggedBlockType = "";
    blockElement.classList.add("is-dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", `block-id:${draggedBlockId}`);
  });

  blockList?.addEventListener("dragend", clearBuilderDropState);

  blockList?.addEventListener("dragover", (event) => {
    const blockElement = event.target.closest("[data-block-id]");

    if (!blockElement || !draggedBlockId || blockElement.getAttribute("data-block-id") === draggedBlockId) {
      return;
    }

    event.preventDefault();
    blockList.querySelectorAll(".is-drop-target").forEach((element) => element.classList.remove("is-drop-target"));
    blockElement.classList.add("is-drop-target");
  });

  blockList?.addEventListener("drop", (event) => {
    const blockElement = event.target.closest("[data-block-id]");
    const targetId = blockElement?.getAttribute("data-block-id");

    if (!targetId || !draggedBlockId || targetId === draggedBlockId) {
      return;
    }

    event.preventDefault();
    moveAdminBlockTo(draggedBlockId, adminBlocks.findIndex((block) => block.id === targetId));
  });
}

initProjectFeed();
initHomeProjects();
initProjectDetail();
initProjectAdmin();
initProjectBoardCarouselControls();
