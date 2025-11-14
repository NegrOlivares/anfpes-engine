import type { DerivedPlayer } from '@anfpes/engine';
import { useEffect, useMemo, useState } from 'react';
import { useCacheStore } from '../store/cacheStore';
import {
  DEFAULT_TABLE_COLUMNS,
  FIELD_GROUPS,
  getTableHeaderLabel,
} from '../constants/playerFields';
import { POSITION_COLORS, type SortConfig } from '../types/table';
import { TableCell } from './TableCell';
import {
  formatClub,
  formatNationality,
  formatSelectionDisplay,
  getFieldFilterValue,
  getFieldLabel,
  normalizeFieldKey,
  shouldDisplayField,
  SPECIAL_SKILL_FIELDS,
} from '../utils/playerDisplay';
import { usePlayerViews, type FilterCondition } from '../hooks/usePlayerViews';
import { getNationalityInfo } from '../data/nationalities';
import { getFlagImagePath, getClubShieldPath } from '../utils/imageHelpers';

type FilterOperator = 'eq' | 'contains' | 'gte' | 'lte' | 'between';

const POSITION_CODES = [
  { code: 'GK', label: 'PT', color: POSITION_COLORS.PT },
  { code: 'SWP', label: 'LIB', color: POSITION_COLORS.LIB },
  { code: 'CB', label: 'CT', color: POSITION_COLORS.CT },
  { code: 'RB', label: 'DD', color: POSITION_COLORS.DD },
  { code: 'LB', label: 'DI', color: POSITION_COLORS.DI },
  { code: 'DMF', label: 'CCD', color: POSITION_COLORS.CCD },
  { code: 'RWB', label: 'DLD', color: POSITION_COLORS.DLD },
  { code: 'LWB', label: 'DLI', color: POSITION_COLORS.DLI },
  { code: 'CMF', label: 'CC', color: POSITION_COLORS.CC },
  { code: 'RMF', label: 'CDR', color: POSITION_COLORS.CDR },
  { code: 'LMF', label: 'CIZ', color: POSITION_COLORS.CIZ },
  { code: 'AMF', label: 'MP', color: POSITION_COLORS.MP },
  { code: 'RWF', label: 'ED', color: POSITION_COLORS.ED },
  { code: 'LWF', label: 'EI', color: POSITION_COLORS.EI },
  { code: 'SS', label: 'SD', color: POSITION_COLORS.SD },
  { code: 'CF', label: 'DC', color: POSITION_COLORS.DC },
];

const DEMARCATION_COLUMNS = [
  'D',
  'E',
  'M',
  'A',
  'R',
  'C',
  'A_1',
  'C_1',
  'I',
  'O',
  'N',
] as const;

// Lista de clubes ANFPES
const ANFPES_CLUBS = new Set([
  'A.C. Milan',
  'A.S. Roma',
  'Ajax',
  'Arsenal',
  'Athletic Club',
  'Bayern M├╝nchen',
  'Boca Juniors',
  'Celtic',
  'Chelsea FC',
  'Chievo Verona',
  'Dynamo Kiev',
  'F.C. Barcelona',
  'Fiorentina',
  'Girondins de Bordeaux',
  'Inter',
  'Juventus',
  'Lazio',
  'Liverpool FC',
  'Manchester City',
  'Manchester United',
  'Newcastle United FC',
  'Olympique de Marseille',
  'Olympique Lyonnais',
  'Paris Saint-Germain',
  'Parma',
  'R. Madrid',
  'R. Sociedad',
  'R.C. Celta',
  'Roda JC',
  'Sevilla F.C.',
  'Sporting Lisbon',
  'Villarreal C.F.',
]);

// Lista de Jugadores Leyenda (Selecciones Cl├ísicas + Shop Leyendas)
const LEGEND_PLAYERS = new Set([
  'Jack Charlton',
  'J├║nior',
  'K. Andersson',
  'Bobby Robson',
  'Fran',
  'Paul Ince',
  'Ronald Koeman',
  'Berry van Aerle',
  'Jan Wouters',
  'W. Overath',
  'A. Tarantini',
  'Am├®rico Gallego',
  'D. Passarella',
  'Daniel Bertoni',
  'Diego Maradona',
  'F. Redondo',
  'G. Batistuta',
  'J. Burruchaga',
  'Jorge Valdano',
  'Jos├® Cuciuffo',
  'Jos├® Luis Brown',
  'Leopoldo Luque',
  'Luis Galv├ín',
  'Mario Kempes',
  'Nery Pumpido',
  'Olarticoechea',
  '├ôscar Ruggeri',
  'Osvaldo Ardiles',
  'Sergio Batista',
  'Ubaldo Fillol',
  'Bebeto',
  'Brito',
  'C. Taffarel',
  'Careca',
  'Clodoaldo',
  'Dunga',
  'F├®lix',
  'Gerson',
  'Jairzinho',
  'Leonardo',
  'Luiz Pereira',
  'Paulo Falcao',
  'Pel├®',
  'Piazza',
  'R. Rivelino',
  'Ra├¡',
  'S├│crates',
  'Toninho Cerezo',
  'Tostao',
  'Zico',
  'Alan Ball',
  'Bobby Charlton',
  'Bobby Moore',
  'David Seaman',
  'Gary Lineker',
  'Geoff Hurst',
  'Gordon Banks',
  'Ian Wright',
  'John Barnes',
  'Kevin Keegan',
  'Martin Keown',
  'Martin Peters',
  'Nobby Stiles',
  'Paul Gascoigne',
  'Peter Shilton',
  'Ray Wilson',
  'Tom Hoodle',
  'Tony Adams',
  'Alain Giresse',
  'D. Rocheteau',
  'David Ginola',
  'Didier Six',
  'Emmanuel Petit',
  '├ëric Cantona',
  'Jean M. Ferreri',
  'Jean P. Papin',
  'Jean Tigana',
  'Jean-Luc Ettori',
  'Jo├½l Bats',
  'Laurent Blanc',
  'Luis Fern├índez',
  'Manuel Amor├│s',
  'Marius Tr├®sor',
  'Maxime Bossis',
  'Michel Platini',
  'Thierry Tusseau',
  'Andreas Brehme',
  'B. H├Âlzenbein',
  'Bernd Schuster',
  'Berti Vogts',
  'Bodo Illgner',
  'F. Beckenbauer',
  'Gerd M├╝ller',
  'Guido Buchwald',
  'J. Grabowski',
  'J. Klinsmann',
  'J├╝rgen Kohler',
  'K-H Rummenigge',
  'Lothar Matth├ñus',
  'Matthias Sammer',
  'Oliver Bierhoff',
  'P. Littbarski',
  'Paul Breitner',
  'Rainer Bonhof',
  'Rudi V├Âller',
  'Schwarzenbeck',
  'Sepp Maier',
  'Antonio Cabrini',
  'Bruno Conti',
  'Claudio Gentile',
  'D. Albertini',
  'Dino Zoff',
  'F. Collovati',
  'Franco Baresi',
  'G. Bergomi',
  'Gabriele Oriali',
  'Gaetano Scirea',
  'Gianfranco Zola',
  'Gianluca Vialli',
  'Gianni Rivera',
  'Marco Tardelli',
  'P. Vierchowod',
  'Paolo Rossi',
  'R. Donadoni',
  'Roberto Baggio',
  'Roberto Mancini',
  'S. Schillaci',
  'Walter Zenga',
  'A. van Tiggelen',
  'Arie Haan',
  'Arnold M├╝hren',
  'Frank Rijkaard',
  'G. Vanenburg',
  'Jan Jongbloed',
  'Johan Cruyff',
  'Johan Neeskens',
  'Johnny Rep',
  'M. van Basten',
  'Piet Keizer',
  'Rob Rensenbrink',
  'Ruud Gullit',
  'Ruud Krol',
  'Van Breukelen',
  'W. van Hanegem',
  'Wim Jansen',
  'Wim Suurbier',
  'Everaldo',
  'H├®ctor Enrique',
  'Mat├¡as Almeyda',
  'Carlos Alberto',
  'F. Ravanelli',
  'Mauro Silva',
  'F. Asprilla',
  'George Cohen',
  'Wim Rijsbergen',
  'Frank Leboeuf',
  'Tony Yeboah',
  'C. Alberto',
  'F. Graziani',
  'Angelo Di Livio',
  'Ricardo Giusti',
  'B. Genghini',
  'Roger Hunt',
  'Bruno Bellone',
  'G├®rard Janvion',
  'Erwin Koeman',
  'Uli H├Âeness',
  'A. Mostov├│i',
  'Alen Boksic',
  'C. Caniggia',
  'C. Valderrama',
  'E. Francescoli',
  'Enzo Scifo',
  'Eus├®bio',
  'Fernando Hierro',
  'G. Popescu',
  'Garrincha',
  'Gheorghe Hagi',
  'Hugo S├ínchez',
  'Ian Rush',
  'Iv├ín Zamorano',
  'Jamie Redknapp',
  'Kenny Dalglish',
  'Oleg Blokhin',
  'Roger Milla',
  'S├índor Kocsis',
  'Valeri Karpin',
  'A. Di St├®fano',
  'D. Stojkovic',
  'Davor Suker',
  'Dejan Savicevic',
  'Denis Law',
  'Dragan Dzajic',
  'G. Giannini',
  'G. Lentini',
  'George Best',
  'George Weah',
  'K. Balakov',
  'P. Andersson',
  'P. Schmeichel',
  "Patrick M'Boma",
  'Paulo Sousa',
  'Thomas Ravelli',
  'Tomas Brolin',
  'Zvonimir Boban',
  'Billy Bremner',
  'Brian Laudrup',
  'E. Butrague├▒o',
  'Ferenc Pusk├ís',
  'G. Signori',
  'H. Stoichkov',
  'J. Chilavert',
  'Jorge Campos',
  'Jos├® M. Bakero',
  'Lev Yashin',
  'Luis Enrique',
  'Marc Overmars',
  'Mark Hughes',
  'Martin Dahlin',
  'Matt Le Tissier',
  'Michael Laudrup',
  'P. Mijatovic',
  'Ren├® Higuita',
  'Thomas H├ñssler',
  'Adrian Ilie',
  'Allan Simonsen',
  'Andreas Herzog',
  'Denis Irwin',
  'Djalminha',
  'Falcao',
  'Haim Revivo',
  'Igor Protti',
  '├ìhor Bel├ínov',
  'Luis Su├írez M.',
  "M. Preud'homme",
  'Magrao',
  'Marc-Vivien Fo├®',
  'Pat Jennings',
  'Preben Elkjaer',
  'Rub├®n Sosa',
  'S. Matthews',
  'T. Begiristain',
  'Zbigniew Boniek',
  'Ciro Ferrara',
  'Jens Jeremies',
  'Mauro Tassotti',
  'R. Prosinecki',
  'D. Deschamps',
  'Sergi Barjuan',
  'Christian Ziege',
]);

// Lista de Jugadores ML (Master League)
const ML_PLAYERS = new Set([
  'Boyano',
  'Metelger',
  'Andre',
  'Burchet',
  'Ceciu',
  'Dodo',
  'Espimas',
  'Fouque',
  'Giersen',
  'Hamsun',
  'Huylens',
  'Iouga',
  'Ivarov',
  'Jaric',
  'Libermann',
  'Lothar',
  'Macco',
  'Minanda',
  'Ordaz',
  'Ruskin',
  'Stein',
  'Stremer',
  'Valeny',
  'Ximelez',
  'Zamenhof',
  'Barota',
  'Celnili',
  'Dulic',
  'Edingson',
  'Harty',
  'Kelsen',
  'Nachdecal',
  'Njorgo',
  'Ostwaut',
  'Vornander',
  'Aaltonen',
  'Abdel Salam',
  'Acosta',
  'Adam',
  'Ahmet',
  'Alexeev',
  'Andrews',
  'Arts',
  'Baker',
  'Barth',
  'Baumann',
  'Benon',
  'Berger',
  'Bianchi',
  'Bilic',
  'Boffa',
  'Borges',
  'Bos',
  'Bosnjak',
  'Bouquet',
  'Bradley',
  'Buchanan',
  'Buga',
  'Bustos',
  'Cabrera',
  'Camacho',
  'Carter',
  'Cem',
  'Cervantes',
  'Chacon',
  'Chapi',
  'Che Hyon Hon',
  'Cho Jin Wha',
  'Clarke',
  'Clement',
  'Cocio',
  'Conwey',
  'Cooper',
  'Cuypers',
  'Delios',
  'Dietrich',
  'Doesburg',
  'Dupont',
  'Eckstein',
  'El Moubarki',
  'Engin',
  'Ettori',
  'Fatecha',
  'Fernandez',
  'Feurer',
  'Fischer',
  'Franovic',
  'Frederiksen',
  'Fredriksson',
  'Gambino',
  'Gibson',
  'Gottwald',
  'Graham',
  'Griffiths',
  'Guegan',
  'Guimaraes',
  'Gunther',
  'Gutierrez',
  'Herrero',
  'Hoekstra',
  'Hoffmann',
  'Holzer',
  'Hong Yon Nam',
  'Hugo',
  'I Chol Yon',
  'I Gyon Fun',
  'Ioannidis',
  'Jackson',
  'Jacobs',
  'Jacobsen',
  'Jasinski',
  'Jean',
  'Jovancevic',
  'Juarez',
  'Khumalo',
  'Kim Cyun Hi',
  'Kim Jon Yoru',
  'Kim Myon U',
  'Kim U Don',
  'Kobayashi',
  'Koeman',
  'Komol',
  'Kooistra',
  'Kremer',
  'Kruger',
  'Leclerc',
  'Lindner',
  'Lorenz',
  'Machado',
  'Marchand',
  'Martel',
  'Matic',
  'Matsumoto',
  'Mattsson',
  'McKenzie',
  'Menendez',
  'Merino',
  'Mertens',
  'Mitchell',
  'Mokrani',
  'Moulin',
  'Murray',
  'Nascimento',
  'Navarro',
  'Newman',
  'Nijkamp',
  'Nikolic',
  'Nikolov',
  'Noushevar',
  'Oliver',
  'Oscar',
  "O'Sullivan",
  'Palmieri',
  'Park Jyun Hi',
  'Pelaez',
  'Perrin',
  'Postma',
  'Prandini',
  'Prieto',
  'Ramon',
  'Reeves',
  'Renard',
  'Ribeiro',
  'Riou',
  'Rivero',
  'Rolong',
  'Rowland',
  'Rubio',
  'Sahafi',
  'Samuels',
  'Sanz',
  'Sasaki',
  'Schmidt',
  'Serrano',
  'Shaw',
  'Shittu',
  'Shubin',
  'Siegl',
  'Simpson',
  'Soares',
  'Soler',
  'Sousa',
  'Spencer',
  'Stoyanov',
  'Szalai',
  'Takahashi',
  'Thijs',
  'Traore',
  'Van den Berg',
  'Van der Meer',
  'Van Dijk',
  'Wang Mingwei',
  'Weber',
  'Wiart',
  'Wilkins',
  'Wolf',
  'Wood',
  'Yamada',
  'Yegorov',
  'Zakharov',
  'Zarate',
  'Sarto',
  'Como',
  'Solimar',
  'Nzom Gole',
  'R. Acuna',
  'Cejumi',
  'Walton',
  'Kmou',
  'Sutto',
  'Otam',
  'Ranow',
  'Chigrat',
  'Dogue',
  'Heycory',
  'Marsatto',
  'Virota',
  'Boanerm',
  'Sirojuntle',
  'Pjinatnigh',
  'Kaiser',
  'Kondelenan',
  'Cinu Santiku',
  'Ciurmira',
  'Jaromton',
  'Agata',
  'Alnenda',
  'Romaldinho',
  'De Kaam',
  'Nirimorf',
  'Huber',
  'Espinosa',
  'Rodiguez',
  'Rane',
  'Azara',
  'Van Heert',
  'Iujimano',
  'Razetow',
  'Schwarz',
  'Orellano',
  'Sariw',
  'Jig',
  'Castolo',
  'Footyn',
  'Ita',
  'Houtmael',
  'Duffy',
  'Shimizu',
  'Pas Chiton',
  'Fillco',
  'Lanalkiss',
  'Legus',
  'Bag',
  'Sazi',
  'Aunugi',
]);

const STATIC_FIELD_OPTIONS: Record<string, string[]> = {
  PIE: ['Derecho', 'Izquierdo', 'Ambos'],
  'FAVOURED SIDE': ['Derecho', 'Izquierdo', 'Ambos'],
  'SKIN COLOR': ['Claro', 'Medio', 'Moreno', 'Negro'],
  'TOLERANCIA LESIONES': ['A', 'B', 'C'],
  CONSISTENCIA: ['1', '2', '3', '4', '5', '6', '7', '8'],
  'CONDICI\u00D3N FITNESS': ['1', '2', '3', '4', '5', '6', '7', '8'],
  'PRECICI\u00D3N PIE MALO': ['1', '2', '3', '4', '5', '6', '7', '8'],
  'FRECUENCIA PIE MALO': ['1', '2', '3', '4', '5', '6', '7', '8'],
  'nro selecci├│n': ['Si', 'No'],
  'nro clasico': ['Si', 'No'],
  ANFPES: ['Si', 'No'],
};
const DYNAMIC_OPTION_FIELDS = new Set(['NACIONALIDAD', 'CLUB']);

SPECIAL_SKILL_FIELDS.forEach((field) => {
  STATIC_FIELD_OPTIONS[field] = ['Si', 'No'];
});

const OPERATOR_OPTIONS: Array<{
  value: FilterOperator;
  label: string;
  needsSecond?: boolean;
}> = [
  { value: 'eq', label: 'Es exactamente' },
  { value: 'contains', label: 'Contiene' },
  { value: 'gte', label: 'Es mayor o igual que' },
  { value: 'lte', label: 'Es menor o igual que' },
  { value: 'between', label: 'Es entre', needsSecond: true },
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function safeNormalize(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  return normalize(String(value));
}

export function PlayerSearch() {
  const players = useCacheStore((state) => state.players);
  const status = useCacheStore((state) => state.status);
  const error = useCacheStore((state) => state.error);
  const selectedId = useCacheStore((state) => state.selectedPlayerId);
  const setSelectedPlayer = useCacheStore((state) => state.setSelectedPlayer);

  const {
    savedViews,
    currentViewId,
    saveView,
    deleteView,
    loadView,
    saveLastViewState,
    loadLastViewState,
  } = usePlayerViews();

  const [query, setQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const [positionsFilter, setPositionsFilter] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig[]>([
    { key: 'PROMEDIO', direction: 'desc' },
  ]);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(DEFAULT_TABLE_COLUMNS),
  );
  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false);
  const [viewsMenuOpen, setViewsMenuOpen] = useState(false);
  const [saveViewDialogOpen, setSaveViewDialogOpen] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);

  // Cargar el ├║ltimo estado al iniciar
  useEffect(() => {
    const lastState = loadLastViewState();
    if (lastState) {
      setFilters(lastState.filters);
      setPositionsFilter(lastState.positionsFilter);
      setSortConfig(lastState.sortConfig);
      setVisibleColumns(new Set(lastState.visibleColumns));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Guardar el estado actual cuando cambie
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveLastViewState({
        filters,
        positionsFilter,
        sortConfig,
        visibleColumns: Array.from(visibleColumns),
      });
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [filters, positionsFilter, sortConfig, visibleColumns, saveLastViewState]);

  const normalizedQuery = query.trim().toLowerCase();

  const fieldOptions = useMemo(() => {
    if (!players || !players.length) {
      return [];
    }

    const options: Array<{ value: string; label: string; isGroup?: boolean }> = [];

    FIELD_GROUPS.forEach((group) => {
      // Agregar el divisor de grupo
      options.push({
        value: `__group_${group.label}`,
        label: group.label,
        isGroup: true,
      });

      // Agregar los campos del grupo
      group.fields.forEach((field) => {
        if (shouldDisplayField(field)) {
          options.push({
            value: field,
            label: getFieldLabel(field),
          });
        }
      });
    });

    return options;
  }, [players]);

  const fieldValueOptions = useMemo<Record<string, string[]>>(() => {
    const base: Record<string, string[]> = { ...STATIC_FIELD_OPTIONS };
    if (!players) {
      return base;
    }

    const collectors = new Map<string, Set<string>>();
    DYNAMIC_OPTION_FIELDS.forEach((field) => collectors.set(field, new Set<string>()));

    players.forEach((player) => {
      Object.keys(player).forEach((rawField) => {
        const canonical = normalizeFieldKey(rawField);
        const bucket = collectors.get(canonical);
        if (!bucket) {
          return;
        }
        const value = getFieldFilterValue(rawField as keyof DerivedPlayer, player);
        if (value && value !== '-') {
          bucket.add(value);
        }
      });
    });

    collectors.forEach((set, field) => {
      base[field] = Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
    });

    return base;
  }, [players]);

  const results = useMemo(() => {
    if (!players) {
      return [];
    }

    let filtered = players.filter((player) => {
      const matchesSearch =
        !normalizedQuery ||
        [
          player.NOMBRE,
          formatClub(player.CLUB as string, player.NACIONALIDAD as string),
          formatNationality(player.NACIONALIDAD as string),
        ].some((value) => safeNormalize(value).includes(normalizedQuery));

      if (!matchesSearch) {
        return false;
      }

      if (filters.length && !filters.every((filter) => evaluateFilter(filter, player))) {
        return false;
      }

      return matchesPositions(player, positionsFilter);
    });

    // Aplicar ordenamiento
    if (sortConfig.length > 0) {
      filtered = [...filtered].sort((a, b) => {
        for (const sort of sortConfig) {
          const aValue = a[sort.key];
          const bValue = b[sort.key];

          let comparison = 0;
          if (typeof aValue === 'number' && typeof bValue === 'number') {
            comparison = aValue - bValue;
          } else {
            const aStr = String(aValue ?? '');
            const bStr = String(bValue ?? '');
            comparison = aStr.localeCompare(bStr, 'es');
          }

          if (comparison !== 0) {
            return sort.direction === 'asc' ? comparison : -comparison;
          }
        }
        return 0;
      });
    }

    return filtered;
  }, [players, normalizedQuery, filters, positionsFilter, sortConfig]);

  const totalPages = Math.ceil(results.length / itemsPerPage);
  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return results.slice(start, start + itemsPerPage);
  }, [results, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [normalizedQuery, filters, positionsFilter]);

  useEffect(() => {
    if (!paginatedResults.length) {
      setSelectedPlayer(null);
      return;
    }

    if (!selectedId || !paginatedResults.some((player) => player.ID === selectedId)) {
      setSelectedPlayer(paginatedResults[0].ID as string);
    }
  }, [paginatedResults, selectedId, setSelectedPlayer]);

  const loading = status === 'idle' || status === 'loading';

  const handleAddFilter = () => {
    if (!fieldOptions.length) {
      return;
    }
    // Buscar el primer campo que no sea un grupo
    const firstValidField = fieldOptions.find((opt) => !opt.isGroup);
    if (!firstValidField) {
      return;
    }
    const newFilter: FilterCondition = {
      id: crypto.randomUUID(),
      field: firstValidField.value,
      operator: 'eq',
      value: '',
    };
    setFilters((current) => [...current, newFilter]);
    setFiltersOpen(true);
  };

  const handleUpdateFilter = (id: string, partial: Partial<FilterCondition>) => {
    setFilters((current) =>
      current.map((filter) => {
        if (filter.id !== id) {
          return filter;
        }
        const next: FilterCondition = { ...filter, ...partial };
        if (partial.field) {
          next.value = '';
          next.secondaryValue = undefined;
        }
        return next;
      }),
    );
  };

  const handleRemoveFilter = (id: string) => {
    setFilters((current) => current.filter((filter) => filter.id !== id));
  };

  const handleClearFilters = () => {
    setFilters([]);
    setPositionsFilter([]);
  };

  const handleSaveView = () => {
    if (!newViewName.trim()) {
      return;
    }
    saveView(newViewName.trim(), {
      filters,
      positionsFilter,
      sortConfig,
      visibleColumns: Array.from(visibleColumns),
    });
    setNewViewName('');
    setSaveViewDialogOpen(false);
  };

  const handleLoadView = (viewId: string) => {
    const view = loadView(viewId);
    if (view) {
      setFilters(view.filters);
      setPositionsFilter(view.positionsFilter);
      setSortConfig(view.sortConfig);
      setVisibleColumns(new Set(view.visibleColumns));
    }
    setViewsMenuOpen(false);
  };

  const handleDeleteView = (viewId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('┬┐Est├ís seguro de que quieres eliminar esta vista?')) {
      deleteView(viewId);
    }
  };

  const handleClearCurrentView = () => {
    setFilters([]);
    setPositionsFilter([]);
    setSortConfig([{ key: 'PROMEDIO', direction: 'desc' }]);
    setVisibleColumns(new Set(DEFAULT_TABLE_COLUMNS));
  };

  const handleSort = (key: keyof DerivedPlayer, multi: boolean) => {
    setSortConfig((current) => {
      if (multi) {
        const existing = current.find((s) => s.key === key);
        if (existing) {
          if (existing.direction === 'desc') {
            return current.map((s) =>
              s.key === key ? { ...s, direction: 'asc' as const } : s,
            );
          }
          return current.filter((s) => s.key !== key);
        }
        return [...current, { key, direction: 'desc' }];
      }
      const existing = current.find((s) => s.key === key);
      if (existing && existing.direction === 'desc') {
        return [{ key, direction: 'asc' }];
      }
      if (existing && existing.direction === 'asc') {
        return [];
      }
      return [{ key, direction: 'desc' }];
    });
  };

  const toggleColumn = (column: string) => {
    setVisibleColumns((current) => {
      const next = new Set(current);
      if (next.has(column)) {
        if (column !== 'NOMBRE' && next.size > 1) next.delete(column);
      } else {
        next.add(column);
      }
      return next;
    });
  };

  const getColumnType = (
    field: string,
  ): 'text' | 'number' | 'stat' | 'rating' | 'injury' => {
    if (field === 'TOLERANCIA LESIONES') return 'injury';

    // Ratings de posici├│n (promedios con barras)
    if (
      [
        'PT',
        'LIB',
        'CT',
        'SA',
        'LA',
        'CCD',
        'CC',
        'VOL',
        'MP',
        'EX',
        'SD',
        'DC',
      ].includes(field)
    ) {
      return 'rating';
    }

    // Promedios principales (con barras)
    if (['PROMEDIO', 'MEJOR PROMEDIO'].includes(field)) {
      return 'stat';
    }

    // MacroStats (con barras)
    if (['ATK', 'TEC', 'RES', 'DEF', 'FUE', 'VEL'].includes(field)) {
      return 'stat';
    }

    // Stats generales (con barras)
    if (
      [
        'ATAQUE',
        'DEFENSA',
        'ESTABILIDAD',
        'RESISTENCIA',
        'VELOCIDAD M├üXIMA',
        'ACELERACI├ôN',
        'REPUESTA',
        'AGILIDAD',
        'PRECISI├ôN DRIBBLE',
        'VELOCIDAD DRIBBLE',
        'PRECISI├ôN   P CORTO',
        'VELOCIDAD  P CORTO',
        'PRECISI├ôN       P LARGO',
        'VELOCIDAD     P LARGO',
        'PRECISI├ôN DISPARO',
        'POTENCIA DISPARO',
        'T├ëCNICA DISPARO',
        'PRECISI├ôN TIRO LIBRE',
        'EFECTO',
        'CABEZAZO',
        'SALTO',
        'T├ëCNICA',
        'AGRESIVIDAD',
        'MENTALIDAD',
        'ARQUERO',
        'TRABAJO EN EQUIPO',
      ].includes(field)
    ) {
      return 'stat';
    }

    // M├®tricas (con barras)
    if (
      [
        'DESTREZA ATAQUE',
        'DESTREZA DEFENSA',
        'FINIQUITO',
        'VELOCIDAD',
        'EXPLOSIVIDAD',
        'PROMEDIO AGILIDADES',
        'POTENCIA DE PATADA',
        'RECUPERACION DE BAL├ôN',
        'ALETISMO',
        'JUEGO AEREO',
        'CREATIVIDAD',
      ].includes(field)
    ) {
      return 'stat';
    }

    // Atributos f├¡sicos num├®ricos (con color pero sin barras)
    if (
      [
        'CONSISTENCIA',
        'CONDICI├ôN FITNESS',
        'PRECICI├ôN PIE MALO',
        'FRECUENCIA PIE MALO',
      ].includes(field)
    ) {
      return 'number';
    }

    // Campos num├®ricos b├ísicos
    if (field === 'EDAD' || field === 'ALTURA' || field === 'PESO') {
      return 'number';
    }

    return 'text';
  };

  return (
    <section className="card player-search">
      <header className="search-header">
        <div className="search-field">
          <input
            className="search-input"
            type="text"
            placeholder="Nombre, Club o Nacionalidad"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="search-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => setViewsMenuOpen((open) => !open)}
          >
            Vistas {viewsMenuOpen ? 'Ôû▓' : 'Ôû╝'}
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setFiltersOpen((open) => !open)}
          >
            Filtros
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setColumnsMenuOpen((open) => !open)}
          >
            Columnas {columnsMenuOpen ? 'Ôû▓' : 'Ôû╝'}
          </button>
          <button
            type="button"
            className="secondary-button ghost"
            onClick={handleClearFilters}
            disabled={!filters.length && !positionsFilter.length}
          >
            Limpiar filtros
          </button>
        </div>
      </header>

      {viewsMenuOpen && (
        <div className="views-panel">
          <div className="views-header">
            <h4>Vistas Guardadas</h4>
            <button
              type="button"
              className="secondary-button small"
              onClick={() => setSaveViewDialogOpen(true)}
            >
              Guardar Vista Actual
            </button>
          </div>
          {savedViews.length === 0 ? (
            <p className="muted">No hay vistas guardadas</p>
          ) : (
            <div className="views-list">
              {savedViews.map((view) => (
                <div
                  key={view.id}
                  className={`view-item ${currentViewId === view.id ? 'active' : ''}`}
                >
                  <button
                    type="button"
                    className="view-name"
                    onClick={() => handleLoadView(view.id)}
                  >
                    {view.name}
                  </button>
                  <button
                    type="button"
                    className="icon-button delete-view"
                    onClick={(e) => handleDeleteView(view.id, e)}
                    aria-label="Eliminar vista"
                  >
                    ├ù
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            className="secondary-button ghost"
            onClick={handleClearCurrentView}
          >
            Limpiar Vista Actual
          </button>
        </div>
      )}

      {saveViewDialogOpen && (
        <div className="save-view-dialog">
          <h4>Guardar Vista</h4>
          <input
            type="text"
            value={newViewName}
            onChange={(e) => setNewViewName(e.target.value)}
            placeholder="Nombre de la vista"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSaveView();
              }
            }}
          />
          <div className="dialog-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={handleSaveView}
              disabled={!newViewName.trim()}
            >
              Guardar
            </button>
            <button
              type="button"
              className="secondary-button ghost"
              onClick={() => {
                setSaveViewDialogOpen(false);
                setNewViewName('');
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {filtersOpen && (
        <div className="filters-panel">
          <div className="positions-grid">
            {POSITION_CODES.map((position) => {
              const active = positionsFilter.includes(position.code);
              return (
                <button
                  type="button"
                  key={position.code}
                  className={active ? 'position-button active' : 'position-button'}
                  style={
                    active
                      ? ({ '--pos-color': position.color } as React.CSSProperties)
                      : undefined
                  }
                  onClick={() => togglePosition(position.code, setPositionsFilter)}
                >
                  {position.label}
                </button>
              );
            })}
          </div>

          {filters.length > 0 && (
            <div className="filters-list">
              {filters.map((filter) => {
                const canonical = normalizeFieldKey(filter.field);
                const baseOptions =
                  STATIC_FIELD_OPTIONS[canonical] ?? fieldValueOptions[canonical];
                const needsSecond =
                  OPERATOR_OPTIONS.find((option) => option.value === filter.operator)
                    ?.needsSecond ?? false;

                return (
                  <div key={filter.id} className="filter-row">
                    <select
                      value={filter.field}
                      onChange={(event) =>
                        handleUpdateFilter(filter.id, { field: event.target.value })
                      }
                    >
                      {fieldOptions.map((option) =>
                        option.isGroup ? (
                          <option
                            key={option.value}
                            value={option.value}
                            disabled
                            className="field-group-header"
                          >
                            ÔöÇÔöÇ {option.label} ÔöÇÔöÇ
                          </option>
                        ) : (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ),
                      )}
                    </select>

                    <select
                      value={filter.operator}
                      onChange={(event) =>
                        handleUpdateFilter(filter.id, {
                          operator: event.target.value as FilterOperator,
                          secondaryValue: undefined,
                        })
                      }
                    >
                      {OPERATOR_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    {baseOptions && baseOptions.length > 0 ? (
                      <select
                        value={filter.value}
                        onChange={(event) =>
                          handleUpdateFilter(filter.id, { value: event.target.value })
                        }
                      >
                        <option value="">Selecciona...</option>
                        {baseOptions.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={filter.value}
                        onChange={(event) =>
                          handleUpdateFilter(filter.id, { value: event.target.value })
                        }
                        placeholder="Valor"
                      />
                    )}

                    {needsSecond &&
                      (baseOptions && baseOptions.length > 0 ? (
                        <>
                          <span className="filter-between-label">y</span>
                          <select
                            value={filter.secondaryValue ?? ''}
                            onChange={(event) =>
                              handleUpdateFilter(filter.id, {
                                secondaryValue: event.target.value,
                              })
                            }
                          >
                            <option value="">Selecciona...</option>
                            {baseOptions.map((value) => (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            ))}
                          </select>
                        </>
                      ) : (
                        <>
                          <span className="filter-between-label">y</span>
                          <input
                            type="text"
                            value={filter.secondaryValue ?? ''}
                            onChange={(event) =>
                              handleUpdateFilter(filter.id, {
                                secondaryValue: event.target.value,
                              })
                            }
                            placeholder="Valor"
                          />
                        </>
                      ))}

                    <button
                      type="button"
                      className="icon-button remove-filter"
                      onClick={() => handleRemoveFilter(filter.id)}
                      aria-label="Eliminar filtro"
                    >
                      ├ù
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <button
            type="button"
            className="secondary-button add-filter"
            onClick={handleAddFilter}
            disabled={!fieldOptions.length}
          >
            Agregar filtro
          </button>
        </div>
      )}

      {loading && <p className="loading">Leyendo jugadores...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <>
          <div className="search-toolbar">
            <div className="search-info">
              <span>
                <strong>{results.length}</strong> jugadores encontrados
                {totalPages > 1 && ` (p├ígina ${currentPage} de ${totalPages})`}
              </span>
            </div>
            {totalPages > 1 && (
              <div className="pagination-inline">
                <button
                  type="button"
                  className="pagination-button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  title="P├ígina anterior"
                >
                  ÔåÉ
                </button>
                <button
                  type="button"
                  className="pagination-button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  title="P├ígina siguiente"
                >
                  ÔåÆ
                </button>
              </div>
            )}
          </div>

          {columnsMenuOpen && (
            <div className="columns-menu">
              <h4>Columnas visibles ({visibleColumns.size - 1})</h4>
              {FIELD_GROUPS.map((group) => {
                const excludedFromSelector = new Set([
                  'NOMBRE',
                  'nro selecci├│n',
                  'nro clasico',
                  'ANFPES',
                ]);
                const groupFields = group.fields.filter(
                  (field) =>
                    shouldDisplayField(field) && !excludedFromSelector.has(field),
                );
                if (groupFields.length === 0) return null;

                return (
                  <div key={group.label} className="column-group">
                    <div className="column-group-header">{group.label}</div>
                    {groupFields.map((field) => (
                      <label key={field} className="column-option">
                        <input
                          type="checkbox"
                          checked={visibleColumns.has(field)}
                          onChange={() => toggleColumn(field)}
                          disabled={field === 'NOMBRE'}
                        />
                        <span>{getFieldLabel(field)}</span>
                      </label>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {results.length === 0 ? (
            <p className="muted">
              No hay coincidencias para <strong>{query || '...'}</strong>.
            </p>
          ) : (
            <>
              <div className="table-container">
                <table className="player-table">
                  <thead className="sticky-header">
                    <tr>
                      {Array.from(visibleColumns).map((column) => {
                        const sortIndex = sortConfig.findIndex((s) => s.key === column);
                        const sortDir =
                          sortIndex >= 0 ? sortConfig[sortIndex].direction : null;
                        const headerLabel = getTableHeaderLabel(column);
                        const isNameColumn = column === 'NOMBRE';
                        const isImageColumn =
                          column === 'NACIONALIDAD' || column === 'CLUB';
                        const columnType = getColumnType(column);
                        return (
                          <th
                            key={column}
                            className={`sortable${isNameColumn ? ' player-name-header' : ''}${isImageColumn ? ' image-header' : ''}`}
                            data-type={columnType}
                            onClick={(e) =>
                              handleSort(column as keyof DerivedPlayer, e.shiftKey)
                            }
                            title={headerLabel}
                          >
                            <div className="th-content">
                              <span>{headerLabel}</span>
                              {sortDir && (
                                <span className="sort-indicator">
                                  {sortDir === 'asc' ? 'Ôû▓' : 'Ôû╝'}
                                  {sortConfig.length > 1 && sortIndex >= 0 && (
                                    <sup>{sortIndex + 1}</sup>
                                  )}
                                </span>
                              )}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedResults.map((player) => (
                      <tr
                        key={player.ID}
                        className={player.ID === selectedId ? 'selected' : undefined}
                        onClick={() => setSelectedPlayer(player.ID as string)}
                      >
                        {Array.from(visibleColumns).map((column) => {
                          if (column === 'NOMBRE') {
                            const rawNationality = player.NACIONALIDAD as string;
                            const rawClub = player.CLUB as string;
                            const playerName = player.NOMBRE as string;
                            const hasNationalTeam = formatSelectionDisplay(
                              player['nro selecci├│n'],
                            );
                            const hasClassic = formatSelectionDisplay(
                              player['nro clasico'],
                            );
                            const isLegend =
                              hasClassic !== 'No' || LEGEND_PLAYERS.has(playerName);
                            const isMLPlayer = ML_PLAYERS.has(playerName);
                            const isAnfpes = ANFPES_CLUBS.has(rawClub);

                            return (
                              <td key={column} className="player-name-cell">
                                <div className="player-name-primary">
                                  <span className="player-name-text">
                                    {player.NOMBRE}
                                  </span>
                                  <span className="player-badges">
                                    {hasNationalTeam !== 'No' && (
                                      <span
                                        className="badge"
                                        title="Seleccionado Nacional"
                                      >
                                        ­ƒîì
                                      </span>
                                    )}
                                    {isLegend && (
                                      <span
                                        className="badge legend"
                                        title="Jugador Leyenda"
                                      >
                                        Ôÿà
                                      </span>
                                    )}
                                    {isMLPlayer && (
                                      <span className="badge ml" title="Jugador ML">
                                        ML
                                      </span>
                                    )}
                                    {isAnfpes && (
                                      <span
                                        className="badge anfpes"
                                        title="Afiliado a la ANFPES"
                                      >
                                        ANFPES
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </td>
                            );
                          }

                          if (column === 'NACIONALIDAD') {
                            const rawNationality = player.NACIONALIDAD as string;
                            const flagPath = getFlagImagePath(rawNationality);
                            const nationalityInfo = getNationalityInfo(rawNationality);
                            const displayName = nationalityInfo?.name || rawNationality;

                            return (
                              <td key={column} className="image-cell" title={displayName}>
                                {flagPath && (
                                  <img src={flagPath} alt="" className="flag-icon" />
                                )}
                              </td>
                            );
                          }

                          if (column === 'CLUB') {
                            const rawClub = player.CLUB as string;
                            const shieldPath = getClubShieldPath(rawClub);
                            const rawNationality = player.NACIONALIDAD as string;
                            const clubDisplay = formatClub(rawClub, rawNationality);

                            return (
                              <td key={column} className="image-cell" title={clubDisplay}>
                                {shieldPath ? (
                                  <img src={shieldPath} alt="" className="club-shield" />
                                ) : (
                                  <span className="club-icon">ÔÜ¢</span>
                                )}
                              </td>
                            );
                          }

                          return (
                            <td key={column} data-type={getColumnType(column)}>
                              <TableCell
                                field={column as keyof DerivedPlayer}
                                player={player}
                                type={getColumnType(column)}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}

function evaluateFilter(filter: FilterCondition, player: DerivedPlayer): boolean {
  // Manejo especial para filtro ANFPES
  if (filter.field === 'ANFPES') {
    const playerClub = player.CLUB as string;
    const isAnfpesClub = ANFPES_CLUBS.has(playerClub);
    const filterValue = filter.value.trim().toLowerCase();

    if (filterValue === 'si') {
      return isAnfpesClub;
    } else if (filterValue === 'no') {
      return !isAnfpesClub;
    }
    return true; // Si no hay valor, no filtrar
  }

  const rawValue = player[filter.field as keyof DerivedPlayer];
  const displayValue = getFieldFilterValue(filter.field as keyof DerivedPlayer, player);
  const normalizedDisplay = displayValue.toLowerCase();
  const normalizedFilterValue = filter.value.trim().toLowerCase();

  switch (filter.operator) {
    case 'contains':
      if (!normalizedFilterValue) {
        return true;
      }
      return normalizedDisplay.includes(normalizedFilterValue);
    case 'eq':
      if (!normalizedFilterValue) {
        return true;
      }
      return normalizedDisplay === normalizedFilterValue;
    case 'gte': {
      const playerNumber = toNumber(rawValue);
      const filterNumber = toNumber(filter.value);
      if (playerNumber === null || filterNumber === null) {
        return false;
      }
      return playerNumber >= filterNumber;
    }
    case 'lte': {
      const playerNumber = toNumber(rawValue);
      const filterNumber = toNumber(filter.value);
      if (playerNumber === null || filterNumber === null) {
        return false;
      }
      return playerNumber <= filterNumber;
    }
    case 'between': {
      const playerNumber = toNumber(rawValue);
      const start = toNumber(filter.value);
      const end = toNumber(filter.secondaryValue);
      if (playerNumber === null || start === null || end === null) {
        return false;
      }
      const min = Math.min(start, end);
      const max = Math.max(start, end);
      return playerNumber >= min && playerNumber <= max;
    }
    default:
      return true;
  }
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value.replace(',', '.'));
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return null;
}

function matchesPositions(player: DerivedPlayer, positions: string[]): boolean {
  if (!positions.length) {
    return true;
  }
  const playerPositions = DEMARCATION_COLUMNS.map(
    (column) => player[column as keyof DerivedPlayer],
  ).filter(Boolean) as string[];
  if (!playerPositions.length) {
    return false;
  }
  return playerPositions.some((code) => positions.includes(code));
}

function togglePosition(
  code: string,
  setPositions: React.Dispatch<React.SetStateAction<string[]>>,
) {
  setPositions((current) =>
    current.includes(code)
      ? current.filter((position) => position !== code)
      : [...current, code],
  );
}
