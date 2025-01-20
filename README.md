# Workhour Calculator


This is a small app to calculate the number of hours you are expected to work each month.
For this, it queries the number of holidays and weekends in the current month to calculate the number of working days.
It then uses your personal vacation days and the number of hours you are expected to work per day based on your contract to calculate the number of hours you actually worked.

# How it works

We query the holidays for the given year using the [openholidays API](https://openholidaysapi.org/).
We cross-reference the holidays with expected holidays and the list of vacation days you provided to calculate the number of working days per month.