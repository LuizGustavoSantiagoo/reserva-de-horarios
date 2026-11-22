// Dia e hora no fuso da arena (architecture §2.1, item 12), só com o Intl nativo.
// Datas de calendário circulam como texto `YYYY-MM-DD`.

const TIME_ZONE = 'America/Sao_Paulo';
const MINUTE_MS = 60_000;

const wallClock = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

interface WallTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

/** O que o relógio de parede de São Paulo marca naquele instante. */
function wallTimeAt(instant: Date): WallTime {
  const parts = Object.fromEntries(
    wallClock
      .formatToParts(instant)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  );
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
  };
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function parseDate(date: string): [number, number, number] {
  const [year, month, day] = date.split('-').map(Number);
  return [year, month, day];
}

/** Diferença entre o relógio de São Paulo e o UTC naquele instante (ex.: -3 h). */
function offsetMs(instant: Date): number {
  const wall = wallTimeAt(instant);
  const wallAsUtc = Date.UTC(
    wall.year,
    wall.month - 1,
    wall.day,
    wall.hour,
    wall.minute,
  );
  const instantToTheMinute =
    Math.floor(instant.getTime() / MINUTE_MS) * MINUTE_MS;
  return wallAsUtc - instantToTheMinute;
}

/** O dia (`YYYY-MM-DD`) que o calendário de São Paulo marca naquele instante. */
export function saoPauloDate(instant: Date): string {
  const { year, month, day } = wallTimeAt(instant);
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** O instante em que o relógio de São Paulo marca `hour`:00 no dia `date`. */
export function saoPauloHourToInstant(date: string, hour: number): Date {
  const [year, month, day] = parseDate(date);
  const wallAsUtc = Date.UTC(year, month - 1, day, hour);
  // Segunda passada: acerta o deslocamento quando a primeira cai do outro
  // lado de uma troca de horário de verão.
  const firstGuess = wallAsUtc - offsetMs(new Date(wallAsUtc));
  return new Date(wallAsUtc - offsetMs(new Date(firstGuess)));
}

/** Dia da semana da data de calendário: 0 (domingo) a 6 (sábado). */
export function weekdayOf(date: string): number {
  const [year, month, day] = parseDate(date);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}
