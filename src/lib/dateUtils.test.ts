import { describe, it, expect } from 'vitest'
import { 
  formatDateRange, 
  parseDateOrRangeString,
  type DateRange,
  DateParseErrorCode,
  DateParseError
} from './dateUtils'

describe('dateUtils', () => {
  const year = 2024

  describe('parseDateOrRangeString', () => {
    it('throws error for empty input', () => {
      expect(() => parseDateOrRangeString('', year)).toThrow(DateParseError)
      expect(() => parseDateOrRangeString('  ', year)).toThrow(DateParseError)
      try {
        parseDateOrRangeString('', year)
      } catch (error) {
        expect(error instanceof DateParseError).toBe(true)
        if (error instanceof DateParseError) {
          expect(error.code).toBe(DateParseErrorCode.EMPTY_DATE_STRING)
        }
      }
    })

    it('throws error for empty range after semicolon', () => {
      expect(() => parseDateOrRangeString('24.03;', year)).toThrow(DateParseError)
      expect(() => parseDateOrRangeString('24.03; ; 25.03', year)).toThrow(DateParseError)
      try {
        parseDateOrRangeString('24.03;', year)
      } catch (error) {
        expect(error instanceof DateParseError).toBe(true)
        if (error instanceof DateParseError) {
          expect(error.code).toBe(DateParseErrorCode.EMPTY_RANGE_AFTER_SEMICOLON)
        }
      }
    })

    it('throws error for missing date in range', () => {
      expect(() => parseDateOrRangeString('24.03-', year)).toThrow(DateParseError)
      expect(() => parseDateOrRangeString('-25.03', year)).toThrow(DateParseError)
      try {
        parseDateOrRangeString('24.03-', year)
      } catch (error) {
        expect(error instanceof DateParseError).toBe(true)
        if (error instanceof DateParseError) {
          expect(error.code).toBe(DateParseErrorCode.RANGE_MISSING_DATE)
          expect(error.fieldValue).toBe('24.03-')
        }
      }
    })

    it('throws error for invalid dates', () => {
      expect(() => parseDateOrRangeString('32.03', year)).toThrow(DateParseError)
      try {
        parseDateOrRangeString('32.03', year)
      } catch (error) {
        expect(error instanceof DateParseError).toBe(true)
        if (error instanceof DateParseError) {
          expect(error.code).toBe(DateParseErrorCode.DATE_FORMAT_INVALID)
          expect(error.fieldValue).toBe('32.03')
        }
      }
    })

    it('throws error for invalid dates in range', () => {
      expect(() => parseDateOrRangeString('32.03-25.03', year)).toThrow(DateParseError)
      expect(() => parseDateOrRangeString('24.03-32.03', year)).toThrow(DateParseError)
      try {
        parseDateOrRangeString('32.03-25.03', year)
      } catch (error) {
        expect(error instanceof DateParseError).toBe(true)
        if (error instanceof DateParseError) {
          expect(error.code).toBe(DateParseErrorCode.DATE_FORMAT_INVALID)
          expect(error.fieldValue).toBe('32.03')
        }
      }
    })

    it('throws error when end date is before start date', () => {
      expect(() => parseDateOrRangeString('25.03-24.03', year)).toThrow(DateParseError)
      try {
        parseDateOrRangeString('25.03-24.03', year)
      } catch (error) {
        expect(error instanceof DateParseError).toBe(true)
        if (error instanceof DateParseError) {
          expect(error.code).toBe(DateParseErrorCode.RANGE_END_BEFORE_START)
          expect(error.fieldValue).toBe('25.03-24.03')
        }
      }
    })

    it('parses valid single dates', () => {
      const expected: DateRange[] = [{
        start: new Date(2024, 2, 24),
        end: new Date(2024, 2, 24)
      }]
      expect(parseDateOrRangeString('24.03', year)).toEqual(expected)
    })

    it('parses valid date ranges', () => {
      const expected: DateRange[] = [{
        start: new Date(2024, 2, 24),
        end: new Date(2024, 2, 28)
      }]
      expect(parseDateOrRangeString('24.03-28.03', year)).toEqual(expected)
    })

    it('parses multiple valid ranges and dates', () => {
      const expected: DateRange[] = [
        {
          start: new Date(2024, 2, 24),
          end: new Date(2024, 2, 28)
        },
        {
          start: new Date(2024, 3, 1),
          end: new Date(2024, 3, 1)
        },
        {
          start: new Date(2024, 5, 15),
          end: new Date(2024, 5, 20)
        }
      ]
      expect(parseDateOrRangeString('24.03-28.03; 01.04; 15.06-20.06', year)).toEqual(expected)
    })
  })

  describe('formatDateRange', () => {
    it('formats single day ranges', () => {
      const range: DateRange = {
        start: new Date(2024, 2, 24),
        end: new Date(2024, 2, 24)
      }
      expect(formatDateRange(range)).toBe('24.03')
    })

    it('formats multi-day ranges', () => {
      const range: DateRange = {
        start: new Date(2024, 2, 24),
        end: new Date(2024, 2, 28)
      }
      expect(formatDateRange(range)).toBe('24.03-28.03')
    })
  })
}) 