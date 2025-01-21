import { parse, format, isValid } from "date-fns"

export enum DateParseErrorCode {
  EMPTY_DATE_STRING = "EMPTY_DATE_STRING",
  EMPTY_RANGE_AFTER_SEMICOLON = "EMPTY_RANGE_AFTER_SEMICOLON",
  DATE_FORMAT_INVALID = "DATE_FORMAT_INVALID",
  RANGE_END_BEFORE_START = "RANGE_END_BEFORE_START",
  DATE_PARSE_FAILED = "DATE_PARSE_FAILED",
  RANGE_MISSING_DATE = "RANGE_MISSING_DATE",
}

export class DateParseError extends Error {
  constructor(
    public code: DateParseErrorCode,
    public detail: string,
    public fieldValue?: string
  ) {
    super(detail)
    this.name = "DateParseError"
  }
}

export interface DateRange {
  start: Date
  end: Date
}

export function parseDateString(dateString: string, year: number): Date | null {
  if (!dateString.trim()) {
    throw new DateParseError(
      DateParseErrorCode.EMPTY_DATE_STRING,
      "Date string cannot be empty",
      dateString
    )
  }

  const formats = ["dd.MM", "MM.dd"]
  for (const formatString of formats) {
    const date = parse(dateString, formatString, new Date(year, 0, 1))
    if (isValid(date)) {
      return date
    }
  }
  
  throw new DateParseError(
    DateParseErrorCode.DATE_FORMAT_INVALID,
    "Date must be in format dd.MM or MM.dd",
    dateString
  )
}

export function formatDateRange(range: DateRange): string {
  if (range.start.getTime() === range.end.getTime()) {
    return format(range.start, "dd.MM")
  }
  return `${format(range.start, "dd.MM")}-${format(range.end, "dd.MM")}`
}

export function parseDateRangeString(input: string, year: number): DateRange[] {
  if (!input.trim()) {
    throw new DateParseError(
      DateParseErrorCode.EMPTY_DATE_STRING,
      "Input string cannot be empty"
    )
  }

  const ranges: DateRange[] = []
  const parts = input.split(";").map((part) => part.trim())

  for (const part of parts) {
    if (!part) {
      throw new DateParseError(
        DateParseErrorCode.EMPTY_RANGE_AFTER_SEMICOLON,
        "Empty date range after semicolon"
      )
    }

    if (part.includes("-")) {
      const [start, end] = part.split("-").map(p => p.trim())
      if (!start || !end) {
        throw new DateParseError(
          DateParseErrorCode.RANGE_MISSING_DATE,
          "Missing date in range",
          part
        )
      }

      try {
        const startDate = parseDateString(start, year)
        const endDate = parseDateString(end, year)
        
        if (startDate && endDate) {
          if (endDate < startDate) {
            throw new DateParseError(
              DateParseErrorCode.RANGE_END_BEFORE_START,
              "End date cannot be before start date",
              part
            )
          }
          ranges.push({ start: startDate, end: endDate })
        }
      } catch (error) {
        if (error instanceof DateParseError) {
          throw error
        }
        throw new DateParseError(
          DateParseErrorCode.DATE_PARSE_FAILED,
          "Invalid date in range",
          part
        )
      }
    } else {
      try {
        const date = parseDateString(part, year)
        if (date) {
          ranges.push({ start: date, end: date })
        }
      } catch (error) {
        if (error instanceof DateParseError) {
          throw error
        }
        throw new DateParseError(
          DateParseErrorCode.DATE_PARSE_FAILED,
          "Invalid date",
          part
        )
      }
    }
  }

  return ranges
}

export function parseDateOrRangeString(input: string, year: number): DateRange[] {
  if (!input.trim()) {
    throw new DateParseError(
      DateParseErrorCode.EMPTY_DATE_STRING,
      "Input string cannot be empty"
    )
  }

  const ranges: DateRange[] = []
  const parts = input.split(";").map((part) => part.trim())

  for (const part of parts) {
    if (!part) {
      throw new DateParseError(
        DateParseErrorCode.EMPTY_RANGE_AFTER_SEMICOLON,
        "Empty date range after semicolon"
      )
    }

    if (part.includes("-")) {
      const [start, end] = part.split("-").map(p => p.trim())
      if (!start || !end) {
        throw new DateParseError(
          DateParseErrorCode.RANGE_MISSING_DATE,
          "Missing date in range",
          part
        )
      }

      try {
        const startDate = parseDateString(start, year)
        const endDate = parseDateString(end, year)
        
        if (!startDate || !endDate) {
          throw new DateParseError(
            DateParseErrorCode.DATE_PARSE_FAILED,
            "Invalid date in range",
            part
          )
        }

        if (endDate < startDate) {
          throw new DateParseError(
            DateParseErrorCode.RANGE_END_BEFORE_START,
            "End date cannot be before start date",
            part
          )
        }
        ranges.push({ start: startDate, end: endDate })
      } catch (error) {
        if (error instanceof DateParseError) {
          throw error
        }
        throw new DateParseError(
          DateParseErrorCode.DATE_PARSE_FAILED,
          "Invalid date in range",
          part
        )
      }
    } else {
      try {
        const date = parseDateString(part, year)
        if (!date) {
          throw new DateParseError(
            DateParseErrorCode.DATE_PARSE_FAILED,
            "Invalid date",
            part
          )
        }
        ranges.push({ start: date, end: date })
      } catch (error) {
        if (error instanceof DateParseError) {
          throw error
        }
        throw new DateParseError(
          DateParseErrorCode.DATE_PARSE_FAILED,
          "Invalid date",
          part
        )
      }
    }
  }

  return ranges
}

