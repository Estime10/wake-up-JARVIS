import { t } from "@/lib/i18n";

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
  name: string = t("user.displayName"),
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

function spokenMailBlock(mailTotal: number, mailToday: number): string {
  assertNonNegInt(mailTotal, "mailTotal");
  assertNonNegInt(mailToday, "mailToday");

  if (mailTotal === 0 && mailToday === 0) {
    return t("greeting.spokenMailsNone");
  }

  const totalPart =
    mailTotal === 1
      ? t("greeting.spokenMailTotalOne")
      : t("greeting.spokenMailTotalMany", { total: mailTotal });

  const todayPart =
    mailToday === 0
      ? t("greeting.spokenMailTodayZero")
      : mailToday === 1
        ? t("greeting.spokenMailTodayOne")
        : t("greeting.spokenMailTodayMany", { today: mailToday });

  return `${totalPart} ${todayPart}`;
}

export type SpokenBriefingInput = {
  name: string;
  at: Date;
  /** Lieu nu (sans préfixe GEOLOC) — null si inconnu. */
  place: string | null;
  mailTotal: number;
  mailToday: number;
};

/**
 * Briefing TTS home — aligné sur les 4 points HUD :
 * salut + date/heure + géoloc + mails (total + jour) + système OK.
 */
export function spokenBriefing(input: SpokenBriefingInput): string {
  const { name, at, place, mailTotal, mailToday } = input;
  const hour = at.getHours();
  assertHour(hour);

  const hello = isMorning(hour)
    ? t("greeting.spokenHelloMorning", { name })
    : t("greeting.spokenHelloEvening", { name });

  const dateTime = t("greeting.spokenDateTime", {
    date: formatSpokenDate(at),
    time: formatSpokenTime(at),
  });

  const placePart = place
    ? t("greeting.spokenPlace", { place })
    : t("greeting.spokenPlaceUnknown");

  const mails = spokenMailBlock(mailTotal, mailToday);
  const systems = t("greeting.spokenSystemsOk");

  return `${hello} ${dateTime} ${placePart} ${mails} ${systems}`;
}
