// Calendar dates in Egypt time (Africa/Cairo): "today" never depends on the server's own time zone.
const TZ = "Africa/Cairo";
const PAST_DATE_MESSAGE =
    "The date cannot be in the past (Egypt time). Please choose today or a later date. / لا يمكن اختيار تاريخ في الماضي (بتوقيت مصر). يرجى اختيار اليوم أو تاريخ لاحق.";

const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });

// "YYYY-MM-DD" of a moment in Egypt time
const egyptDateOf = (moment = new Date()) => fmt.format(moment);

// The calendar day a request names: a plain "YYYY-MM-DD" is that day; a full timestamp is read in Egypt time
const requestedDay = (value) => {
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : egyptDateOf(value);
    const text = String(value || "").trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
    const parsed = new Date(text);
    return Number.isNaN(parsed.getTime()) ? null : egyptDateOf(parsed);
};

// True only when the named day is before today in Egypt. An unreadable value is left to the other checks.
const isPastEgyptDate = (value, now = new Date()) => {
    const day = requestedDay(value);
    return day !== null && day < egyptDateOf(now);
};

// express-validator custom check: .custom(notPastEgyptDate)
const notPastEgyptDate = (value) => {
    if (isPastEgyptDate(value)) throw new Error(PAST_DATE_MESSAGE);
    return true;
};

module.exports = { egyptDateOf, isPastEgyptDate, notPastEgyptDate, PAST_DATE_MESSAGE };
