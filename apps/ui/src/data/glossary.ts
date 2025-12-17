/**
 * Sistema de Glosario
 *
 * Definiciones extraídas del Excel original (data/raw/Glosario.xlsx)
 * con actualizaciones para reflejar la terminología de la UI actual.
 */

export type GlossaryCategory =
  | 'stats' // 31 términos: Stats básicos del PES
  | 'habilidades-especiales' // 24 términos: Habilidades con ★
  | 'metricas-calculadas' // 9 términos: Campos calculados en derived.ts (sin Agilidades)
  | 'macro-stats' // 6 términos: ATK, TEC, RES, DEF, FUE, VEL
  | 'posiciones' // 20 términos: GK, CB, DMF, etc.
  | 'info-jugador' // 8 términos: País, Dorsal, Altura, etc.
  | 'tipos-jugador'; // Leyenda, Master League

export interface GlossaryTerm {
  id: string;
  term: string; // Nombre en UI actual
  legacyTerm?: string; // Nombre en Excel original si es diferente
  badge?: string; // Badge icon/text para tipos de jugador
  badgeStyle?: {
    // Estilos del badge
    background: string;
    color: string;
  };
  category: GlossaryCategory;
  definition: string; // Definición del Excel original
  isCalculated?: boolean; // Si se calcula en derived.ts
  calculationFile?: string; // Referencia al archivo de cálculo
  relatedStats?: string[]; // Stats que lo componen
  formula?: string; // Fórmula simplificada para tooltip
  tags?: string[]; // Para búsqueda
}

// ============================================================================
// STATS BÁSICOS (31 términos)
// ============================================================================

const STATS_BASICOS: GlossaryTerm[] = [
  {
    id: 'ataque',
    term: 'Ataque',
    category: 'stats',
    definition:
      'Capacidad del jugador para crear peligro en una jugada ofensiva. Puede ser interpretado también como inteligencia ofensiva (capacidad del jugador para tomar la mejor decisión cuando tiene la pelota y que la jugada termine en una ocasión de gol) o qué tan incisivo es un jugador cuando ataca. Los jugadores con mucho ataque son propensos a estar en "situaciones" de gol y perder la marca rápidamente.',
    tags: ['mental', 'ofensivo'],
  },
  {
    id: 'defensa',
    term: 'Defensa',
    category: 'stats',
    definition:
      'Capacidad del jugador para defender cuando no tiene el balón. Se puede interpretar como inteligencia defensiva. Cuanta más alta sea la Defensa del jugador, mejor será su lectura del juego y podrá tomar mejores decisiones a la hora de marcar. Este stat se utiliza principalmente para medir qué tan bueno es el jugador recuperando el balón, quitándole la pelota al rival de forma limpia. Cuanto mejor sea el jugador en los tackles, mejor será su valor en Defensa.',
    tags: ['mental', 'defensivo'],
  },
  {
    id: 'estabilidad',
    term: 'Estabilidad',
    category: 'stats',
    definition:
      'La fuerza del jugador. Jugadores con niveles altos en Estabilidad podrán aguantar embestidas rivales y salir airosos de duelos físicos sin caer al suelo. La altura y el peso de los jugadores no influyen en la fuerza del jugador.',
    tags: ['físico'],
  },
  {
    id: 'resistencia',
    term: 'Resistencia',
    category: 'stats',
    definition:
      'El nivel de energía del jugador. Con valores altos el jugador será propenso a correr durante mucho tiempo en el partido. El valor estándar es de 80, ya que con ese valor en el PES un jugador llega a correr los 90 minutos con lo justo para llegar a terminar un partido.',
    tags: ['físico'],
  },
  {
    id: 'velocidad-maxima',
    term: 'Velocidad Máxima',
    legacyTerm: 'VELOCIDAD MÁXIMA',
    category: 'stats',
    definition: 'El tope de velocidad que alcanza un jugador al correr sin el balón.',
    tags: ['físico'],
  },
  {
    id: 'aceleracion',
    term: 'Aceleración',
    legacyTerm: 'ACELERACIÓN',
    category: 'stats',
    definition:
      'La capacidad del jugador de alcanzar con mayor rapidez su velocidad máxima. Mientras más alto sea el valor, más rápido alcanzará su velocidad tope.',
    tags: ['físico'],
  },
  {
    id: 'respuesta',
    term: 'Respuesta',
    legacyTerm: 'REPUESTA',
    category: 'stats',
    definition:
      'La respuesta puede asumirse como la manera en la que un jugador "lee el juego", los reflejos del jugador. Cuanto más alto sea este stat, más rápido reaccionará el jugador en cualquier situación del juego.',
    tags: ['mental'],
  },
  {
    id: 'agilidad',
    term: 'Agilidad',
    category: 'stats',
    definition:
      'Determina qué tan rápido un jugador es capaz de cambiar de dirección con el balón en los pies.',
    tags: ['físico', 'técnico'],
  },
  {
    id: 'precision-conduccion',
    term: 'Precisión de Conducción',
    legacyTerm: 'PRECISIÓN DRIBBLE',
    category: 'stats',
    definition:
      'Capacidad del jugador de llevar el balón pegado al pie mientras conduce. Cuanto más alto sea este stat, más difícil será que se le vaya largo el balón y al regatear será más difícil para el rival quitarle el balón.',
    tags: ['técnico', 'ofensivo'],
  },
  {
    id: 'velocidad-conduccion',
    term: 'Velocidad de Conducción',
    legacyTerm: 'VELOCIDAD DRIBBLE',
    category: 'stats',
    definition: 'Qué tan rápido puede correr un jugador con el balón controlado.',
    tags: ['físico', 'técnico'],
  },
  {
    id: 'precision-pase-corto',
    term: 'Precisión de Pase Corto',
    legacyTerm: 'PRECISIÓN   P CORTO',
    category: 'stats',
    definition:
      'La precisión de los pases al ras del piso. Este stat determina la calidad y qué tipo de pases es capaz de dar el jugador teniendo en cuenta la dificultad de estos.',
    tags: ['técnico'],
  },
  {
    id: 'velocidad-pase-corto',
    term: 'Velocidad de Pase Corto',
    legacyTerm: 'VELOCIDAD  P CORTO',
    category: 'stats',
    definition:
      'La fuerza que el jugador puede darle a los pases. Con un valor alto, los pases no serán interceptados por los jugadores rivales y se desplazarán con mayor velocidad. Además, añade más rango a los pases.',
    tags: ['físico', 'técnico'],
  },
  {
    id: 'precision-pase-largo',
    term: 'Precisión de Pase Largo',
    legacyTerm: 'PRECISIÓN       P LARGO',
    category: 'stats',
    definition:
      'Determina la precisión de los pases por el aire, pases largos, los cambios de frente y centros aéreos.',
    tags: ['técnico'],
  },
  {
    id: 'velocidad-pase-largo',
    term: 'Velocidad de Pase Largo',
    legacyTerm: 'VELOCIDAD     P LARGO',
    category: 'stats',
    definition:
      'La velocidad con lo que los pases largos van hacia su destino y el rango que pueden alcanzar estos. Cabe destacar que este estat actúa junto a "Potencia de disparo" para determinar ese valor.',
    tags: ['físico', 'técnico'],
  },
  {
    id: 'precision-disparo',
    term: 'Precisión de Disparo',
    legacyTerm: 'PRECISIÓN DISPARO',
    category: 'stats',
    definition:
      'Determina la puntería en los disparos. Con valores altos, el jugador será capaz de apuntar a áreas más difícil del arco, lejos del arquero y en los ángulos.',
    tags: ['técnico', 'ofensivo'],
  },
  {
    id: 'potencia-disparo',
    term: 'Potencia de Disparo',
    legacyTerm: 'POTENCIA DISPARO',
    category: 'stats',
    definition:
      'El poder con que se dispara. Determina qué tan rápido y qué tan fuerte el jugador puede patear el balón.',
    tags: ['físico', 'ofensivo'],
  },
  {
    id: 'tecnica-disparo',
    term: 'Técnica de Disparo',
    legacyTerm: 'TÉCNICA DISPARO',
    category: 'stats',
    definition:
      'Con esta habilidad los jugadores serán capaces de disparar al arco bajo presión de algún jugador rival, también permite a los jugadores disparar de ángulos difíciles y ayuda a los jugadores que disparan de lejos a pegarle bien al balón.',
    tags: ['técnico', 'ofensivo'],
  },
  {
    id: 'precision-tiro-libre',
    term: 'Precisión Tiro Libre',
    legacyTerm: 'PRECISIÓN TIRO LIBRE',
    category: 'stats',
    definition:
      'Nivel de precisión que tiene el jugador al realizar pelotas paradas: Tiros libres y saques de esquina.',
    tags: ['técnico', 'ofensivo'],
  },
  {
    id: 'efecto',
    term: 'Efecto',
    category: 'stats',
    definition:
      'Capacidad de patear con comba de un jugador. Qué tan efectiva es la curva que le dan los jugadores a tiros libres, pases largos y cortos, cambios de juego y disparos.',
    tags: ['técnico'],
  },
  {
    id: 'cabezazo',
    term: 'Cabezazo',
    category: 'stats',
    definition:
      'Precisión del jugador golpeando la pelota con la cabeza y nivel de potencia que es capaz de darle al cabezazo.',
    tags: ['técnico', 'físico'],
  },
  {
    id: 'salto',
    term: 'Salto',
    category: 'stats',
    definition:
      'Capacidad del jugador de despegarse del suelo. Qué tanta altura puede alcanzar y que tan rápido puede hacerlo.',
    tags: ['físico'],
  },
  {
    id: 'tecnica',
    term: 'Técnica',
    legacyTerm: 'TÉCNICA',
    category: 'stats',
    definition:
      'Capacidad del jugador para controlar el balón. Cuanto más alto sea el valor, el jugador tendrá más probabilidades de controlar bien el balón, bajarlo y que no se le escape. Es esencialmente el primer toque, sea atrapando valores aéreos o que vengan al ras del piso.',
    tags: ['técnico'],
  },
  {
    id: 'agresividad',
    term: 'Agresividad',
    category: 'stats',
    definition:
      'Determina qué tanto se desprende en ataque un jugador. Cuanto más alto el valor, más se adelantará el jugador cuando no tenga el balón, avanzando en el campo y buscando atacar constantemente.',
    tags: ['mental'],
  },
  {
    id: 'mentalidad',
    term: 'Mentalidad',
    category: 'stats',
    definition:
      'Capacidad del jugador para sobreponerse al cansancio y a condiciones adversas. Hace a los jugadores “más temperamentales”. Con valores altos en esta habilidad, los jugadores seguirán corriendo así estén cansados, dando todo de sí y lucharán cada pelota a muerte.',
    tags: ['mental'],
  },
  {
    id: 'cualidades-portero',
    term: 'Cualidades de Portero',
    legacyTerm: 'ARQUERO',
    category: 'stats',
    definition:
      'Determina la capacidad del arquero de atrapar el balón con las manos. Cuanto más alto sea el valor, mayores chances tendrá el arquero de atrapar el balón y dará menos rebote.',
    tags: ['técnico', 'portero'],
  },
  {
    id: 'trabajo-equipo',
    term: 'Trabajo en Equipo',
    legacyTerm: 'TRABAJO EN EQUIPO',
    category: 'stats',
    definition:
      'Movimiento del jugador sin el balón. Hace que el jugador participe y de buena manera en jugadas colectivas en su equipo. Un jugador con este valor alto se ofrecerá como opción desmarcada de pase con mucha mayor frecuencia. En la parte defensiva hace que ayude a organizar su sector del campo. En la parte ofensiva, los jugadores irán mejor a correr para recibir pases y triangular, además bajarán para recibir el balón.',
    tags: ['mental', 'táctico'],
  },
  {
    id: 'tolerancia-lesiones',
    term: 'Tolerancia a las Lesiones',
    legacyTerm: 'TOLERANCIA LESIONES',
    category: 'stats',
    definition:
      'Qué tan frecuentemente se lesiona el jugador, en un rango de A - B - C, donde A es poco frecuente, B es medianamente frecuente y C es muy frecuente.',
    tags: ['físico'],
  },
  {
    id: 'consistencia',
    term: 'Consistencia',
    category: 'stats',
    definition:
      'La fiabilidad con la que un jugador puede desempeñar sus funciones. Con un valor alto, el jugador responderá a las expectativas de sus habilidades. Por el contrario, con un valor bajo, el jugador tenderá a cometer más errores, aunque su habilidad diga lo contrario.',
    tags: ['mental'],
  },
  {
    id: 'condicion-fisica',
    term: 'Condición Física',
    legacyTerm: 'CONDICIÓN FITNESS',
    category: 'stats',
    definition:
      'Capacidad del jugador para jugar bien muchos partidos. Cuanto más alto sea el stat, más probabilidad habrá de que el jugador tenga flechas amarillas o rojas, de modo que su nivel en los partidos será mejor.',
    tags: ['físico'],
  },
  {
    id: 'precision-pie-torpe',
    term: 'Precisión de Pie Torpe',
    legacyTerm: 'PRECICIÓN PIE MALO',
    category: 'stats',
    definition:
      'Es la capacidad proporcional del jugador de poder ocupar su pie menos hábil igual que su pie principal.',
    tags: ['técnico'],
  },
  {
    id: 'frecuencia-pie-torpe',
    term: 'Frecuencia de Pie Torpe',
    legacyTerm: 'FRECUENCIA PIE MALO',
    category: 'stats',
    definition:
      'Qué tan frecuentemente usa su pierna menos hábil. Con un valor alto el jugador no intentará acomodarse para patear con su pierna hábil y lo hará directamente con la pierna opuesta sin perder tiempo ni espacio.',
    tags: ['técnico'],
  },
];

// ============================================================================
// HABILIDADES ESPECIALES (24 términos)
// ============================================================================

const HABILIDADES_ESPECIALES: GlossaryTerm[] = [
  {
    id: 'regate',
    term: 'Regate',
    legacyTerm: 'REGATE',
    category: 'habilidades-especiales',
    definition:
      'Esta habilidad especial determina si los jugadores son buenos regateando o no.',
    tags: ['especial', 'ofensivo'],
  },
  {
    id: 'habilidad-regate',
    term: 'Habilidad de Regate',
    legacyTerm: 'HAB REGATE',
    category: 'habilidades-especiales',
    definition: 'El jugador "aguanta" y cubre el balón esperando a sus compañeros.',
    tags: ['especial', 'ofensivo'],
  },
  {
    id: 'posicionamiento',
    term: 'Posicionamiento',
    legacyTerm: 'POSICION',
    category: 'habilidades-especiales',
    definition:
      'Mejora el posicionamiento dentro del área rival. Ideal para "cazagoles", ya que estarán mejor ubicados a la hora de atrapar rebotes y recibir centros y pases en profundidad.',
    tags: ['especial', 'táctico'],
  },
  {
    id: 'reaccion',
    term: 'Reacción',
    legacyTerm: 'REACCION',
    category: 'habilidades-especiales',
    definition:
      'El jugador correrá por detrás de la defensa para recibir un pase que lo deje mano a mano con el arquero.',
    tags: ['especial', 'mental'],
  },
  {
    id: 'capacidad-mando',
    term: 'Capacidad de Mando',
    legacyTerm: 'CAP MANDO',
    category: 'habilidades-especiales',
    definition:
      'Ayuda a los jugadores a "distribuir". Esta habilidad especial significa que los jugadores que la posean son propensos a hacer que los demás jugadores se posicionen mejor en jugadas ofensivas, como generar espacios ellos mismos.',
    tags: ['especial', 'mental', 'ofensivo'],
  },
  {
    id: 'pases',
    term: 'Pases',
    legacyTerm: 'PASES',
    category: 'habilidades-especiales',
    definition:
      'Ayuda a los jugadores a hacer pases decisivos de 3/4 de cancha para arriba, habilitando a otros compañeros y dejándolos en situaciones de 1 contra 1.',
    tags: ['especial', 'técnico'],
  },
  {
    id: 'goleador',
    term: 'Goleador',
    legacyTerm: 'GOLEADOR',
    category: 'habilidades-especiales',
    definition:
      'Mejora la habilidad del jugador a la hora de disparar/definir dentro del área o cerca de ésta. Además, mejora el posicionamiento ofensivo del jugador.',
    tags: ['especial', 'ofensivo'],
  },
  {
    id: 'definicion-1v1',
    term: 'Definición Uno contra Uno',
    legacyTerm: '1-1 GOL',
    category: 'habilidades-especiales',
    definition:
      'Mejora la habilidad del jugador al definir en un 1 a 1 contra el portero rival.',
    tags: ['especial', 'ofensivo'],
  },
  {
    id: 'jugador-poste',
    term: 'Jugador Poste',
    legacyTerm: 'JUG POSTE',
    category: 'habilidades-especiales',
    definition:
      'El jugador utilizará el cuerpo para proteger el balón de espaldas al arco. Jugará generalmente adelantado y de espaldas, en posición ideal para recibir pelotazos y utilizar el cuerpo para aguantar al rival mientras se acerca un compañero para pasarle el balón.',
    tags: ['especial', 'físico', 'ofensivo'],
  },
  {
    id: 'evadir-offside',
    term: 'Evadir Offside',
    legacyTerm: 'NO OFFSIDE',
    category: 'habilidades-especiales',
    definition: 'Los jugadores serán menos propensos a caer en posición adelantada.',
    tags: ['especial', 'táctico', 'ofensivo'],
  },
  {
    id: 'disparo-media-distancia',
    term: 'Disparo de Media Distancia',
    legacyTerm: 'MID SHOOT',
    category: 'habilidades-especiales',
    definition:
      'Hace que los jugadores disparen de lejos de forma usual y las da una cierta dosis de efectividad en estos tiros lejanos, pero también tiene la tendencia a reducir el efecto de los disparos.',
    tags: ['especial', 'ofensivo'],
  },
  {
    id: 'lado',
    term: 'Lado',
    legacyTerm: 'LADO',
    category: 'habilidades-especiales',
    definition:
      'A los jugadores les será más fácil jugar y ser efectivos por las bandas, lograrán desbordar por los lados.',
    tags: ['especial', 'táctico'],
  },
  {
    id: 'centro',
    term: 'Centro',
    legacyTerm: 'CENTRO',
    category: 'habilidades-especiales',
    definition:
      'Primeramente hace que los CC o CCD se peguen al centro del campo para realizar un juego efectivo. Así mismo los jugadores de "bandas" (VOL, EX) se pegarán a veces al medio.',
    tags: ['especial', 'técnico', 'ofensivo'],
  },
  {
    id: 'pateador-penales',
    term: 'Pateador de Penales',
    legacyTerm: 'PENALES',
    category: 'habilidades-especiales',
    definition:
      'Los jugadores serán más certeros para patear desde los 12 pasos. Les será muy difícil errarle al arco.',
    tags: ['especial', 'mental', 'ofensivo'],
  },
  {
    id: 'pase-un-toque',
    term: 'Pase a Un Toque',
    legacyTerm: 'PASE 1 TOQ',
    category: 'habilidades-especiales',
    definition: 'Mejora los pases y disparos de primera.',
    tags: ['especial', 'técnico'],
  },
  {
    id: 'exterior-pie',
    term: 'Exterior',
    legacyTerm: 'EXTERIOR',
    category: 'habilidades-especiales',
    definition:
      'Los jugadores usarán la parte exterior de su botín, ya sea para mandar pases o rematar.',
    tags: ['especial', 'técnico'],
  },
  {
    id: 'marcaje-hombre',
    term: 'Marcaje al Hombre',
    legacyTerm: 'MARCA MAN',
    category: 'habilidades-especiales',
    definition:
      'Mejora la habilidad del jugador al quedarse pegado a su marca individual designada en la estrategia, de manera efectiva durante el juego.',
    tags: ['especial', 'defensivo', 'táctico'],
  },
  {
    id: 'entradas',
    term: 'Entradas',
    legacyTerm: 'ENTRADAS',
    category: 'habilidades-especiales',
    definition:
      'Los jugadores harán entradas deslizantes de forma usual y mejorará su efectividad, teniendo más chances de llevarse sólo el balón y no golpear al rival cometiendo una falta.',
    tags: ['especial', 'defensivo'],
  },
  {
    id: 'cobertura',
    term: 'Cobertura',
    legacyTerm: 'COBERTURA',
    category: 'habilidades-especiales',
    definition:
      'Los jugadores cubren bien los espacios defensivos dejados por su otro acompañante.',
    tags: ['especial', 'defensivo', 'táctico'],
  },
  {
    id: 'trampa-offside',
    term: 'Trampa del Offside',
    legacyTerm: 'SI OFFSIDE',
    category: 'habilidades-especiales',
    definition:
      'Se convierte en el "mariscal de la defensa", haciendo que la línea defensiva pueda mantenerse de manera correcta y ordenada. Además, permite hacer bien la trampa del offside.',
    tags: ['especial', 'defensivo', 'táctico'],
  },
  {
    id: 'ataja-penales',
    term: 'Ataja Penales',
    legacyTerm: 'PARAPENAL',
    category: 'habilidades-especiales',
    definition: 'Los arqueros serán más propensos a atajar penales.',
    tags: ['especial', 'portero'],
  },
  {
    id: 'achique-1v1',
    term: 'Achique Uno contra Uno',
    legacyTerm: 'ACHIQUE 1-1',
    category: 'habilidades-especiales',
    definition:
      'Los porteros tendrán mayor éxito de bloquear o atajar en situaciones de 1 contra 1.',
    tags: ['especial', 'portero'],
  },
  {
    id: 'saque-banda-largo',
    term: 'Saque de Banda Largo',
    legacyTerm: 'SAQUE LARG',
    category: 'habilidades-especiales',
    definition:
      'Los jugadores serán más precisos y aumentará su rango en los saques de banda, permitiendo hacer laterales-centro.',
    tags: ['especial', 'físico'],
  },
];

// ============================================================================
// MÉTRICAS CALCULADAS (10 términos)
// Calculadas en packages/engine/src/derived.ts - función computeCompositeMetrics
// ============================================================================

const METRICAS_CALCULADAS: GlossaryTerm[] = [
  {
    id: 'destreza-ataque',
    term: 'Destreza Ataque',
    category: 'metricas-calculadas',
    definition:
      'Inteligencia ofensiva. Mide la capacidad del jugador para tomar decisiones efectivas en ataque.',
    isCalculated: true,
    calculationFile: 'packages/engine/src/derived.ts#L235-L238',
    relatedStats: ['Ataque', 'Respuesta', 'Agresividad'],
    formula: 'max(⅔ Ataque + ⅓ Respuesta, ⅔ Ataque + ⅓ Agresividad)',
    tags: ['calculado', 'mental', 'ofensivo'],
  },
  {
    id: 'finiquito',
    term: 'Finiquito',
    category: 'metricas-calculadas',
    definition:
      'Capacidad global de definición. Combina precisión y técnica de disparo para medir la efectividad goleadora.',
    isCalculated: true,
    calculationFile: 'packages/engine/src/derived.ts#L241',
    relatedStats: ['Precisión de Disparo', 'Técnica de Disparo'],
    formula: 'Precisión Disparo × 0.84 + Técnica Disparo × 0.16',
    tags: ['calculado', 'ofensivo'],
  },
  {
    id: 'velocidad-calculada',
    term: 'Rapidez',
    legacyTerm: 'VELOCIDAD',
    category: 'metricas-calculadas',
    definition:
      'Velocidad efectiva del jugador combinando velocidad con balón y sin balón.',
    isCalculated: true,
    calculationFile: 'packages/engine/src/derived.ts#L242',
    relatedStats: ['Velocidad de Conducción', 'Velocidad Máxima'],
    formula: 'Velocidad Conducción × 0.4 + Velocidad Máxima × 0.6',
    tags: ['calculado', 'físico'],
  },
  {
    id: 'explosividad',
    term: 'Explosividad',
    category: 'metricas-calculadas',
    definition:
      'Capacidad de arranque y cambio de ritmo. Combina agilidad y aceleración.',
    isCalculated: true,
    calculationFile: 'packages/engine/src/derived.ts#L243',
    relatedStats: ['Agilidad', 'Aceleración'],
    formula: '(2 × Agilidad + Aceleración) / 3',
    tags: ['calculado', 'físico'],
  },
  {
    id: 'potencia-patada',
    term: 'Potencia de Patada',
    category: 'metricas-calculadas',
    definition:
      'Fuerza máxima en disparos y pases. Toma el mejor entre disparo y velocidades de pase.',
    isCalculated: true,
    calculationFile: 'packages/engine/src/derived.ts#L245-L247',
    relatedStats: [
      'Potencia de Disparo',
      'Velocidad de Pase Largo',
      'Velocidad de Pase Corto',
    ],
    formula: 'max(Potencia Disparo, Vel. P. Largo, Vel. P. Corto) × 0.4 + promedio × 0.6',
    tags: ['calculado', 'técnico'],
  },
  {
    id: 'destreza-defensa',
    term: 'Destreza Defensa',
    category: 'metricas-calculadas',
    definition:
      'Inteligencia defensiva. Combina defensa con respuesta o trabajo en equipo según lo que sea mayor.',
    isCalculated: true,
    calculationFile: 'packages/engine/src/derived.ts#L248-L251',
    relatedStats: ['Defensa', 'Respuesta', 'Trabajo en Equipo'],
    formula: 'max(⅔ Defensa + ⅓ Respuesta, ⅔ Defensa + ⅓ Trabajo Equipo)',
    tags: ['calculado', 'mental', 'defensivo'],
  },
  {
    id: 'recuperacion-balon',
    term: 'Recuperación de Balón',
    legacyTerm: 'RECUPERACION DE BALÓN',
    category: 'metricas-calculadas',
    definition:
      'Capacidad para recuperar el balón. Combina defensa con estabilidad o mentalidad.',
    isCalculated: true,
    calculationFile: 'packages/engine/src/derived.ts#L252-L255',
    relatedStats: ['Defensa', 'Estabilidad', 'Mentalidad'],
    formula: 'max(⅔ Defensa + ⅓ Estabilidad, ⅔ Defensa + ⅓ Mentalidad)',
    tags: ['calculado', 'defensivo'],
  },
  {
    id: 'juego-aereo',
    term: 'Juego Aéreo',
    legacyTerm: 'JUEGO AEREO',
    category: 'metricas-calculadas',
    definition:
      'Efectividad en jugadas aéreas. Combina altura, salto, cabezazo y otros factores físicos y técnicos.',
    isCalculated: true,
    calculationFile: 'packages/engine/src/derived.ts#L257-L262',
    relatedStats: ['Altura', 'Salto', 'Cabezazo', 'Respuesta', 'Estabilidad', 'Reacción'],
    formula: '((Altura + Salto) / 2) × 0.35 + Cabezazo × 0.45 + Respuesta × 0.1 + otros',
    tags: ['calculado', 'físico'],
  },
  {
    id: 'atletismo',
    term: 'Atletismo',
    legacyTerm: 'ALETISMO',
    category: 'metricas-calculadas',
    definition: 'Capacidad atlética global. Combina múltiples atributos físicos.',
    isCalculated: true,
    calculationFile: 'packages/engine/src/derived.ts#L264-L272',
    relatedStats: [
      'Estabilidad',
      'Respuesta',
      'Resistencia',
      'Potencia de Patada',
      'Agilidades',
      'Juego Aéreo',
      'Reacción',
      'Jugador Poste',
    ],
    formula: 'Estabilidad × 0.3 + Respuesta × 0.2 + Resistencia × 0.1 + más factores',
    tags: ['calculado', 'físico'],
  },
  {
    id: 'creatividad',
    term: 'Creatividad',
    category: 'metricas-calculadas',
    definition:
      'Capacidad creativa y técnica. Combina precisión, técnica, regate y habilidades especiales.',
    isCalculated: true,
    calculationFile: 'packages/engine/src/derived.ts#L274-L286',
    relatedStats: [
      'Técnica',
      'Precisión Tiro Libre',
      'Efecto',
      'Precisión Pase Largo',
      'Precisión Pase Corto',
      'Precisión de Conducción',
      'Regate',
      'Habilidad de Regate',
      'Capacidad de Mando',
      'Pases',
    ],
    formula:
      'Técnica × 0.1 + Prec. Pases × 0.5 + Prec. Conducción × 0.2 + habilidades especiales',
    tags: ['calculado', 'técnico', 'mental'],
  },
];

// ============================================================================
// MACRO STATS (6 términos)
// Calculadas en packages/engine/src/derived.ts - función computeFinalAttributes
// ============================================================================

const MACRO_STATS: GlossaryTerm[] = [
  {
    id: 'atk',
    term: 'ATK',
    category: 'macro-stats',
    definition:
      'Macro stat de ataque ponderado. Combina el ataque base con la precisión de disparo.',
    isCalculated: true,
    calculationFile: 'packages/engine/src/derived.ts#L490',
    relatedStats: ['Ataque', 'Precisión de Disparo'],
    formula: 'Ataque × 0.75 + Precisión Disparo × 0.25',
    tags: ['calculado', 'macro', 'ofensivo'],
  },
  {
    id: 'tec',
    term: 'TEC',
    category: 'macro-stats',
    definition:
      'Macro stat de técnica global. Promedio ponderado de múltiples stats técnicos.',
    isCalculated: true,
    calculationFile: 'packages/engine/src/derived.ts#L491-L497',
    relatedStats: [
      'Técnica',
      'Precisión de Conducción',
      'Precisión de Pase Corto',
      'Precisión de Pase Largo',
      'Precisión Tiro Libre',
      'Efecto',
    ],
    formula: 'Técnica × 0.4 + Prec. Conducción × 0.3 + Prec. P. Corto × 0.1 + más',
    tags: ['calculado', 'macro', 'técnico'],
  },
  {
    id: 'res',
    term: 'RES',
    category: 'macro-stats',
    definition: 'Macro stat de resistencia. Refleja directamente el stat de resistencia.',
    isCalculated: true,
    calculationFile: 'packages/engine/src/derived.ts#L498',
    relatedStats: ['Resistencia'],
    formula: 'Resistencia',
    tags: ['calculado', 'macro', 'físico'],
  },
  {
    id: 'def',
    term: 'DEF',
    category: 'macro-stats',
    definition: 'Macro stat de defensa. Refleja directamente el stat de defensa.',
    isCalculated: true,
    calculationFile: 'packages/engine/src/derived.ts#L499',
    relatedStats: ['Defensa'],
    formula: 'Defensa',
    tags: ['calculado', 'macro', 'defensivo'],
  },
  {
    id: 'fue',
    term: 'FUE',
    category: 'macro-stats',
    definition:
      'Macro stat de fuerza física. Combina estabilidad, salto y potencia de disparo.',
    isCalculated: true,
    calculationFile: 'packages/engine/src/derived.ts#L500-L503',
    relatedStats: ['Estabilidad', 'Salto', 'Potencia de Disparo'],
    formula: 'Estabilidad × 0.6 + Salto × 0.3 + Potencia Disparo × 0.1',
    tags: ['calculado', 'macro', 'físico'],
  },
  {
    id: 'vel',
    term: 'VEL',
    category: 'macro-stats',
    definition:
      'Macro stat de velocidad. Combina velocidad máxima, aceleración, respuesta y velocidad con balón.',
    isCalculated: true,
    calculationFile: 'packages/engine/src/derived.ts#L504-L508',
    relatedStats: [
      'Velocidad Máxima',
      'Aceleración',
      'Respuesta',
      'Velocidad de Conducción',
    ],
    formula:
      'Vel. Máxima × 0.2 + Aceleración × 0.3 + Respuesta × 0.2 + Vel. Conducción × 0.3',
    tags: ['calculado', 'macro', 'físico'],
  },
];

// ============================================================================
// POSICIONES (20 términos)
// ============================================================================

const POSICIONES: GlossaryTerm[] = [
  {
    id: 'gk',
    term: 'PT / GK',
    category: 'posiciones',
    definition: 'Portero / GoalKeeper. Guardameta del equipo.',
    tags: ['posición'],
  },
  {
    id: 'swp',
    term: 'LIB / SWP',
    category: 'posiciones',
    definition: 'Líbero / Sweeper. Defensa central con libertad de movimiento.',
    tags: ['posición'],
  },
  {
    id: 'cb',
    term: 'CT / CB',
    category: 'posiciones',
    definition: 'Defensa Central / Center Back. Defensor en el centro de la zaga.',
    tags: ['posición'],
  },
  {
    id: 'sb',
    term: 'SA / SB',
    category: 'posiciones',
    definition: 'Lateral / Side Back. Defensor de banda.',
    tags: ['posición'],
  },
  {
    id: 'rb',
    term: 'DD / RB',
    category: 'posiciones',
    definition: 'Lateral Derecho / Right Back. Defensor por el lado derecho.',
    tags: ['posición'],
  },
  {
    id: 'lb',
    term: 'DI / LB',
    category: 'posiciones',
    definition: 'Lateral Izquierdo / Left Back. Defensor por el lado izquierdo.',
    tags: ['posición'],
  },
  {
    id: 'dmf',
    term: 'CCD / DMF',
    category: 'posiciones',
    definition:
      'Centrocampista Defensivo / Defensive Midfielder. Mediocampista de contención.',
    tags: ['posición'],
  },
  {
    id: 'wb',
    term: 'LA / WB',
    category: 'posiciones',
    definition: 'Lateral Avanzado / Wing Back. Carrilero con funciones ofensivas.',
    tags: ['posición'],
  },
  {
    id: 'rwb',
    term: 'DLD / RWB',
    category: 'posiciones',
    definition: 'Lateral Avanzado Derecho / Right Wing Back. Carrilero derecho.',
    tags: ['posición'],
  },
  {
    id: 'lwb',
    term: 'DLI / LWB',
    category: 'posiciones',
    definition: 'Lateral Avanzado Izquierdo / Left Wing Back. Carrilero izquierdo.',
    tags: ['posición'],
  },
  {
    id: 'cmf',
    term: 'CC / CMF',
    category: 'posiciones',
    definition: 'Centrocampista / Central Midfielder. Mediocampista central.',
    tags: ['posición'],
  },
  {
    id: 'smf',
    term: 'VOL / SMF',
    category: 'posiciones',
    definition: 'Volante / Side Midfielder. Mediocampista de banda.',
    tags: ['posición'],
  },
  {
    id: 'rmf',
    term: 'CDR / RMF',
    category: 'posiciones',
    definition: 'Volante Derecho / Right Midfielder. Mediocampista por derecha.',
    tags: ['posición'],
  },
  {
    id: 'lmf',
    term: 'CIZ / LMF',
    category: 'posiciones',
    definition: 'Volante Izquierdo / Left Midfielder. Mediocampista por izquierda.',
    tags: ['posición'],
  },
  {
    id: 'amf',
    term: 'MP / AMF',
    category: 'posiciones',
    definition: 'Mediapunta / Attacking Midfielder. Mediocampista ofensivo.',
    tags: ['posición'],
  },
  {
    id: 'wf',
    term: 'EX / WF',
    category: 'posiciones',
    definition: 'Extremo / Wing Forward. Delantero por las bandas.',
    tags: ['posición'],
  },
  {
    id: 'rwf',
    term: 'ED / RWF',
    category: 'posiciones',
    definition: 'Extremo Derecho / Right Wing Forward. Delantero por derecha.',
    tags: ['posición'],
  },
  {
    id: 'lwf',
    term: 'EI / LWF',
    category: 'posiciones',
    definition: 'Extremo Izquierdo / Left Wing Forward. Delantero por izquierda.',
    tags: ['posición'],
  },
  {
    id: 'ss',
    term: 'SD / SS',
    category: 'posiciones',
    definition: 'Segundo Delantero / Second Striker. Delantero de apoyo.',
    tags: ['posición'],
  },
  {
    id: 'cf',
    term: 'DC / CF',
    category: 'posiciones',
    definition: 'Delantero Centro / Center Forward. Punta de ataque.',
    tags: ['posición'],
  },
];

// ============================================================================
// INFO JUGADOR (8 términos)
// ============================================================================

const INFO_JUGADOR: GlossaryTerm[] = [
  {
    id: 'pais',
    term: 'País',
    legacyTerm: 'NACIONALIDAD',
    category: 'info-jugador',
    definition: 'Nacionalidad del jugador.',
    tags: ['información'],
  },
  {
    id: 'dorsal',
    term: 'Número Dorsal',
    legacyTerm: 'DORSAL',
    category: 'info-jugador',
    definition: 'Número de camiseta del jugador en su club.',
    tags: ['información'],
  },
  {
    id: 'altura',
    term: 'Altura',
    category: 'info-jugador',
    definition: 'Altura del jugador en centímetros.',
    tags: ['información', 'físico'],
  },
  {
    id: 'peso',
    term: 'Peso',
    category: 'info-jugador',
    definition: 'Peso del jugador en kilogramos.',
    tags: ['información', 'físico'],
  },
  {
    id: 'edad',
    term: 'Edad',
    category: 'info-jugador',
    definition: 'Edad del jugador.',
    tags: ['información'],
  },
  {
    id: 'pie-habil',
    term: 'Pie Hábil',
    legacyTerm: 'PIE',
    category: 'info-jugador',
    definition: 'Pie dominante del jugador: Derecho, Izquierdo o Ambos.',
    tags: ['información', 'técnico'],
  },
  {
    id: 'lado-preferido',
    term: 'Lado Preferido',
    legacyTerm: 'FAVOURED SIDE',
    category: 'info-jugador',
    definition: 'Lado del campo preferido por el jugador: Derecho, Izquierdo o Centro.',
    tags: ['información', 'táctico'],
  },
  {
    id: 'tono-piel',
    term: 'Tono de Piel',
    legacyTerm: 'SKIN COLOR',
    category: 'info-jugador',
    definition: 'Tono de piel del jugador: Claro, Medio, Moreno, Negro.',
    tags: ['información'],
  },
];

// ============================================================================
// TIPOS DE JUGADOR (2 términos)
// ============================================================================

const TIPOS_JUGADOR: GlossaryTerm[] = [
  {
    id: 'leyenda',
    term: 'Leyenda',
    badge: '⭐',
    badgeStyle: { background: '#9d7c00', color: '#000' },
    category: 'tipos-jugador',
    definition:
      'Jugador histórico incluido en las selecciones clásicas o marcado como leyenda del fútbol representado en su versión "Prime".',
    tags: ['tipo', 'especial'],
  },
  {
    id: 'master-league',
    term: 'Master League',
    badge: 'ML',
    badgeStyle: { background: '#059669', color: '#d1fae5' },
    category: 'tipos-jugador',
    definition:
      'Jugador ficticio creado por KONAMI para el modo Master League (ML) además de los pertenecientes a los equipos PES United y WE United.',
    tags: ['tipo', 'especial'],
  },
  {
    id: 'seleccionado-nacional',
    term: 'Seleccionado Nacional',
    badge: '🌐',
    badgeStyle: { background: '#666', color: '#fff' },
    category: 'tipos-jugador',
    definition:
      'Jugador convocado a una selección nacional. Representa a su país en competiciones internacionales.',
    tags: ['tipo', 'especial'],
  },
  {
    id: 'anfpes',
    term: 'Afiliado a la ANFPES',
    badge: 'ANFPES',
    badgeStyle: { background: '#1e3a8a', color: '#fff' },
    category: 'tipos-jugador',
    definition: 'Jugador contratado por un Club afiliado a la ANFPES.',
    tags: ['tipo', 'especial'],
  },
];

// ============================================================================
// EXPORTACIONES
// ============================================================================

export const GLOSSARY_DATA: GlossaryTerm[] = [
  ...STATS_BASICOS,
  ...HABILIDADES_ESPECIALES,
  ...METRICAS_CALCULADAS,
  ...MACRO_STATS,
  ...POSICIONES,
  ...INFO_JUGADOR,
  ...TIPOS_JUGADOR,
];

export const GLOSSARY_BY_ID = new Map<string, GlossaryTerm>(
  GLOSSARY_DATA.map((term) => [term.id, term] as [string, GlossaryTerm]),
);

/**
 * Normaliza un string colapsando espacios múltiples y eliminando espacios al inicio/fin
 */
function normalizeSpaces(str: string): string {
  return str.trim().replace(/\s+/g, ' ').toLowerCase();
}

const buildTermMap = (): Map<string, GlossaryTerm> => {
  const map = new Map<string, GlossaryTerm>();
  for (const term of GLOSSARY_DATA) {
    // Normalizar espacios al indexar
    map.set(normalizeSpaces(term.term), term);
    if (term.legacyTerm) {
      map.set(normalizeSpaces(term.legacyTerm), term);
    }
  }
  return map;
};

export const GLOSSARY_BY_TERM = buildTermMap();

export const CATEGORY_LABELS: Record<GlossaryCategory, string> = {
  stats: 'Stats',
  'habilidades-especiales': 'Habilidades Especiales',
  'metricas-calculadas': 'Métricas Calculadas',
  'macro-stats': 'Macro Stats',
  posiciones: 'Posiciones',
  'info-jugador': 'Información del Jugador',
  'tipos-jugador': 'Tipos de Jugador',
};

/**
 * Busca un término del glosario por su nombre (UI o legacy)
 * Normaliza espacios múltiples para manejar campos técnicos como 'PRECISIÓN   P CORTO'
 */
export function findGlossaryTerm(fieldName: string): GlossaryTerm | undefined {
  if (!fieldName) return undefined;

  const normalized = normalizeSpaces(fieldName);

  // Buscar por el nombre normalizado
  const found = GLOSSARY_BY_TERM.get(normalized);
  if (found) return found;

  // Si no se encuentra, buscar por nombres de display conocidos
  // Esto maneja casos donde se pasa el label de UI en lugar del nombre técnico
  return GLOSSARY_DATA.find((term) => {
    const termMatch = normalizeSpaces(term.term) === normalized;
    const legacyMatch =
      term.legacyTerm && normalizeSpaces(term.legacyTerm) === normalized;
    return termMatch || legacyMatch;
  });
}

/**
 * Obtiene la definición completa de un término
 */
export function getGlossaryDefinition(fieldName: string): string | null {
  const term = findGlossaryTerm(fieldName);
  return term?.definition || null;
}

/**
 * Obtiene la fórmula de cálculo de un término (si aplica)
 */
export function getGlossaryFormula(fieldName: string): string | null {
  const term = findGlossaryTerm(fieldName);
  return term?.formula || null;
}
