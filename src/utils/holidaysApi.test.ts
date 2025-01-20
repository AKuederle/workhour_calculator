import { fetchHolidaysByYear } from './holidaysApi';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock sample response from the API
const mockApiResponse = [
  {
    "startDate": "2024-01-01",
    "endDate": "2024-01-01",
    "name": [
      {
        "language": "en",
        "text": "New Year's Day"
      }
    ]
  },
  {
    "startDate": "2024-03-29",
    "endDate": "2024-03-29",
    "name": [
      {
        "language": "en",
        "text": "Good Friday"
      }
    ]
  }
];

describe('holidaysApi', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('should fetch and transform holidays correctly', async () => {
    // Mock the fetch function using vi.spyOn
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(new Response(
      JSON.stringify(mockApiResponse),
      { status: 200, headers: { 'content-type': 'application/json' } }
    ));

    const holidays = await fetchHolidaysByYear(2024, 'DE-BE');

    // Check if fetch was called with correct URL
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://openholidaysapi.org/PublicHolidays?countryIsoCode=DE&subdivisionCode=DE-BE&validFrom=2024-01-01&validTo=2024-12-31',
      expect.objectContaining({
        headers: {
          'Accept': 'application/json'
        }
      })
    );

    // Check if holidays are grouped by month correctly
    expect(Object.keys(holidays).length).toBe(2); // January and March
    expect(holidays[0]).toBeDefined(); // January (month 0)
    expect(holidays[2]).toBeDefined(); // March (month 2)

    // Check holiday structure
    const newYearsDay = holidays[0][0];
    expect(newYearsDay).toEqual({
      name: "New Year's Day",
      date: new Date('2024-01-01'),
      isWeekday: true // January 1st, 2024 is a Monday
    });
  });

  it('should handle API errors gracefully', async () => {
    // Mock a failed API response
    vi.spyOn(global, 'fetch').mockResolvedValue(new Response(
      null,
      { status: 404, statusText: 'Not Found' }
    ));

    await expect(fetchHolidaysByYear(2024, 'DE-BE'))
      .rejects
      .toThrow('Failed to fetch holidays: Not Found');
  });

  it('should handle network errors gracefully', async () => {
    // Mock a network error
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

    await expect(fetchHolidaysByYear(2024, 'DE-BE'))
      .rejects
      .toThrow('Error fetching holidays: Network error');
  });
});

describe('fetchHolidayIntegrationTest', () => {
  it('should fetch holidays for a given year and subdivision', async () => {
    const holidays = await fetchHolidaysByYear(2024, 'DE-BY');
    expect(holidays).toBeDefined();
    // Verify we got some holidays
    expect(Object.keys(holidays).length).toBeGreaterThan(0);
  }, 10000); // Increase timeout for real API call
});