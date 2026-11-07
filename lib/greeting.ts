import { t } from "@/lib/i18n";
import { pickUserHonorific } from "@/lib/user/userHonorific";

function assertHour(hour: number): void {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    throw new RangeError(`hour must be an integer in 0..23, received ${hour}`);
  }
}

function assertNonNegInt(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(
      `${label} must be a non-negative integer, received ${value}`,
    );
  }
}

function isMorning(hour: number): boolean {
  return hour >= 5 && hour < 18;
}

/**
 * Salut TTS court — Bonjour/Bonsoir + name + systèmes (prefetch splash).
 */
export function spokenGreeting(
  hour: number,
  name: string = pickUserHonorific(),
): string {
  assertHour(hour);
  const key = isMorning(hour)
    ? "greeting.spokenMorning"
    : "greeting.spokenEvening";
  return t(key, { name });
}

function formatSpokenDate(at: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(at);
}

function formatSpokenTime(at: Date): string {
  const hour = at.getHours();
  const minute = at.getMinutes();
  if (minute === 0) {
    return t("greeting.spokenTimeHourOnly", { hour });
  }
  return t("greeting.spokenTimeHourMinute", { hour, minute });
}

function spokenMailBlock(mailToday: number): string {
  assertNonNegInt(mailToday, "mailToday");

  if (mailToday === 0) {
    return t("greeting.spokenMailsNone");
  }
  if (mailToday === 1) {
    return t("greeting.spokenMailTodayOne");
  }
  return t("greeting.spokenMailTodayMany", { today: mailToday });
}

export type SpokenBriefingInput = {
  name: string;
  at: Date;
  /** Mails reçus aujourd’hui uniquement. */
  mailToday: number;
};

/**
 * Briefing TTS home — salut + date/heure + mails du jour + système OK.
 */
export function spokenBriefing(input: SpokenBriefingInput): string {
  const { name, at, mailToday } = input;
  const hour = at.getHours();
  assertHour(hour);

  const hello = isMorning(hour)
    ? t("greeting.spokenHelloMorning", { name })
    : t("greeting.spokenHelloEvening", { name });

  const dateTime = t("greeting.spokenDateTime", {
    date: formatSpokenDate(at),
    time: formatSpokenTime(at),
  });

  const mails = spokenMailBlock(mailToday);
  const systems = t("greeting.spokenSystemsOk");

  return `${hello} ${dateTime} ${mails} ${systems}`;
}
